const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');
const { auth } = require('../middleware/auth');
const { HandwritingQueue } = require('../services/handwriting-queue');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 0 } });
const limiter = rateLimit({ windowMs: 60000, max: 6, keyGenerator: req => String(req.userId),
  message: { code: 429, message: '手写识别请求较多，请一分钟后重试' } });

function validImage(buffer) {
  return buffer?.length >= 12 && (
    buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    || buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'));
}

function acceptImage(req, res, next) {
  upload.single('image')(req, res, error => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ code: status, message: status === 413 ? '图片请控制在8MB以内' : '请上传一张 JPG、PNG 或 WebP 图片' });
  });
}

async function runRecognition(buffer) {
  const url = process.env.OCR_SERVICE_URL;
  const token = process.env.OCR_SERVICE_TOKEN;
  const deadline = Date.now() + 120000;
  try {
    let response;
    do {
      response = await fetch(`${url.replace(/\/$/, '')}/recognize`, {
        method: 'POST', timeout: Math.max(1000, deadline - Date.now()), size: 2 * 1024 * 1024,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: buffer.toString('base64') }),
      });
      if (response.status !== 429) break;
      await response.text();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } while (Date.now() < deadline);
    if (!response.ok) {
      const status = [400, 413, 429].includes(response.status) ? response.status : 503;
      throw Object.assign(new Error(status === 429 ? '识别服务持续繁忙，请稍后重试' : status === 400 || status === 413 ? '图片损坏、尺寸过大或无法读取，请换一张清晰照片' : '手写识别暂不可用，请稍后重试'), { status });
    }
    const data = await response.json();
    if (typeof data.text !== 'string' || !Array.isArray(data.lines)) throw new Error('识别响应格式错误');
    if (!data.text.trim()) throw Object.assign(new Error('未识别到文字，请上传光线充足、文字清晰的照片'), { status: 422 });
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw new Error('手写识别超时或不可用，请稍后重试，现有答案已保留');
  }
}

const queue = new HandwritingQueue(runRecognition);
setInterval(() => queue.cleanup(), 30000).unref();

function submit(req, res) {
  if (!validImage(req.file?.buffer)) {
    res.status(400).json({ code: 400, message: '请上传有效的 JPG、PNG 或 WebP 图片' });
    return null;
  }
  if (!process.env.OCR_SERVICE_URL || !process.env.OCR_SERVICE_TOKEN) {
    res.status(503).json({ code: 503, message: '手写识别服务尚未配置，请联系管理员' });
    return null;
  }
  try { return queue.submit(req.userId, req.file.buffer); }
  catch (error) { res.status(error.status || 503).json({ code: error.status || 503, message: error.message }); return null; }
}

router.post('/jobs', auth, limiter, acceptImage, (req, res) => {
  const job = submit(req, res);
  if (job) res.status(202).json({ code: 202, data: queue.snapshot(job) });
});

router.get('/jobs/:id', auth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const job = queue.get(req.params.id, req.userId);
  if (!job) return res.status(404).json({ code: 404, message: '识别任务已过期或服务已重启，请重新识别；现有答案已保留' });
  return res.json({ code: 200, data: queue.snapshot(job) });
});

router.delete('/jobs/:id', auth, (req, res) => {
  const job = queue.get(req.params.id, req.userId);
  if (!job) return res.status(404).json({ code: 404, message: '识别任务已结束' });
  queue.cancel(job);
  return res.json({ code: 200, data: { status: 'cancelled' } });
});

// 兼容已经打开的旧版页面，统一经过同一队列，避免绕开串行限制。
router.post('/', auth, limiter, acceptImage, async (req, res) => {
  const job = submit(req, res);
  if (!job) return;
  const onClose = () => { if (!res.writableEnded) queue.cancel(job); };
  res.on('close', onClose);
  const deadline = Date.now() + 120000;
  while (['queued', 'running'].includes(job.status) && !job.cancelled && Date.now() < deadline) {
    job.seenAt = Date.now();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  res.off('close', onClose);
  if (res.destroyed) return;
  if (job.status === 'completed') return res.json({ code: 200, data: job.result });
  queue.cancel(job);
  return res.status(503).json({ code: 503, message: job.message || '等待识别超时，请刷新页面使用排队功能；现有答案已保留' });
});
module.exports = router;
