"""使用 PaddleOCR PP-OCRv5 在私有服务内识别手写答卷，不保存原图。"""
import base64
import io
import logging
import os
import threading
import asyncio
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from fastapi import FastAPI, HTTPException, Request
from PIL import Image, ImageOps, UnidentifiedImageError
from paddleocr import PaddleOCR

Image.MAX_IMAGE_PIXELS = 20000000
engine = None
busy = threading.Lock()
logger = logging.getLogger("policyquest.ocr")
executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="paddle-ocr")


def initialize_engine():
    global engine
    engine = PaddleOCR(
        text_detection_model_name="PP-OCRv5_mobile_det",
        text_recognition_model_name="PP-OCRv5_server_rec",
        text_recognition_batch_size=1,
        text_det_limit_side_len=1280,
        text_det_limit_type="max",
        use_doc_orientation_classify=True,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        device="cpu", cpu_threads=1, enable_mkldnn=False,
    )


@asynccontextmanager
async def lifespan(app):
    # Paddle预测器在同一个专用线程中初始化与复用，避免线程池切换导致原生缓存膨胀。
    await asyncio.get_running_loop().run_in_executor(executor, initialize_engine)
    yield
    executor.shutdown(wait=True)


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    return {"ready": engine is not None, "engine": "PaddleOCR / PP-OCRv5 (mobile_det + server_rec)"}


@app.post("/recognize")
async def recognize(request: Request):
    # 服务端口只绑定回环地址，同时校验共享密钥。
    import secrets
    token = os.environ.get("OCR_SERVICE_TOKEN", "")
    if not token or not secrets.compare_digest(request.headers.get("authorization", ""), f"Bearer {token}"):
        raise HTTPException(401, "识别服务鉴权失败")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 12 * 1024 * 1024:
            raise HTTPException(413, "图片过大")
    import json
    try:
        payload = json.loads(body)
        raw = base64.b64decode(payload["image"], validate=True)
        if len(raw) > 8 * 1024 * 1024:
            raise HTTPException(413, "图片请控制在8MB以内")
        with Image.open(io.BytesIO(raw)) as original:
            if original.width * original.height > Image.MAX_IMAGE_PIXELS:
                raise HTTPException(413, "图片不得超过2000万像素")
            picture = ImageOps.exif_transpose(original).convert("RGB")
            picture.thumbnail((2600, 2600))
    except HTTPException:
        raise
    except (ValueError, KeyError, TypeError, UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(400, "图片损坏或格式不支持，请重新上传")
    if not busy.acquire(blocking=False):
        raise HTTPException(429, "识别服务忙，请稍后重试")
    # 推理移到线程，避免阻塞健康检查；单实例同时只处理一张图片。
    def run():
        try:
            results = list(engine.predict(np.asarray(picture)[:, :, ::-1]))
            lines = []
            for result in results:
                data = result.json["res"]
                for text, score, box in zip(data.get("rec_texts", []), data.get("rec_scores", []), data.get("rec_polys", [])):
                    if text.strip():
                        lines.append({"text": text.strip(), "confidence": round(float(score), 4), "box": box})
            return {"text": "\n".join(line["text"] for line in lines), "lines": lines,
                    "engine": "PaddleOCR / PP-OCRv5 (mobile_det + server_rec)"}
        finally:
            busy.release()
    try:
        return await asyncio.get_running_loop().run_in_executor(executor, run)
    except Exception:
        logger.exception("手写图片识别失败")
        raise HTTPException(503, "识别暂不可用，请稍后重试")
