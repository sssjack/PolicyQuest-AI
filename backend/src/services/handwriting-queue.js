const { randomUUID } = require('crypto');

// 单实例内存队列：不落盘保存照片，每个账号最多占一个位置。
class HandwritingQueue {
  constructor(run, { now = Date.now, capacity = 21, leaseMs = 90000, retentionMs = 300000 } = {}) {
    this.run = run;
    this.now = now;
    this.capacity = capacity;
    this.leaseMs = leaseMs;
    this.retentionMs = retentionMs;
    this.jobs = new Map();
    this.pending = [];
    this.active = null;
    this.averageMs = 15000;
  }

  cleanup() {
    const now = this.now();
    for (const job of this.jobs.values()) {
      if (job.status === 'queued' && now - job.seenAt > this.leaseMs) this.cancel(job);
      if (job.finishedAt != null && now - job.finishedAt > this.retentionMs) this.jobs.delete(job.id);
    }
    // 终态结果有数量和时间双重上限，防止大量识别文本滞留内存。
    const terminal = [...this.jobs.values()].filter(job => job.finishedAt != null);
    for (const job of terminal.slice(0, Math.max(0, terminal.length - 100))) this.jobs.delete(job.id);
  }

  submit(userId, buffer) {
    this.cleanup();
    const owner = String(userId);
    if ([...this.jobs.values()].some(job => job.userId === owner && ['queued', 'running'].includes(job.status))) {
      throw Object.assign(new Error('你已有一项识别任务，请等待完成或先取消排队'), { status: 409 });
    }
    if (this.pending.length + (this.active ? 1 : 0) >= this.capacity) {
      throw Object.assign(new Error('识别队列已满（最多20人等待），请稍后再试'), { status: 429 });
    }
    const job = { id: randomUUID(), userId: owner, buffer, status: 'queued', seenAt: this.now() };
    this.jobs.set(job.id, job);
    this.pending.push(job);
    void this.pump();
    return job;
  }

  get(id, userId) {
    this.cleanup();
    const job = this.jobs.get(id);
    if (!job || job.userId !== String(userId)) return null;
    job.seenAt = this.now();
    return job;
  }

  snapshot(job) {
    const index = job.status === 'queued' ? this.pending.indexOf(job) : -1;
    const waitingAhead = Math.max(0, index);
    const runningAhead = index >= 0 && this.active ? 1 : 0;
    const remainingMs = runningAhead ? Math.max(3000, this.averageMs - (this.now() - this.active.startedAt)) : 0;
    return {
      id: job.id, status: job.cancelled ? 'cancelled' : job.status,
      waitingAhead, runningAhead, peopleAhead: waitingAhead + runningAhead,
      estimatedWaitSeconds: index >= 0 ? Math.ceil((remainingMs + waitingAhead * this.averageMs) / 1000) : 0,
      result: job.status === 'completed' ? job.result : undefined,
      message: job.message,
    };
  }

  cancel(job) {
    job.cancelled = true;
    if (job.status === 'queued') {
      this.pending = this.pending.filter(item => item !== job);
      job.status = 'cancelled';
      job.buffer = null;
      job.finishedAt = this.now();
    }
    // 正在运行的原生推理无法中断，继续占用执行位直至返回，结果丢弃。
  }

  async pump() {
    if (this.active) return;
    this.cleanup();
    const job = this.pending.shift();
    if (!job) return;
    this.active = job;
    job.status = 'running';
    job.startedAt = this.now();
    const buffer = job.buffer;
    job.buffer = null;
    try {
      const result = await this.run(buffer);
      const duration = this.now() - job.startedAt;
      this.averageMs = Math.max(5000, Math.min(120000, this.averageMs * 0.7 + duration * 0.3));
      job.result = job.cancelled ? undefined : result;
      job.status = job.cancelled ? 'cancelled' : 'completed';
    } catch (error) {
      job.status = job.cancelled ? 'cancelled' : 'failed';
      job.message = error.message || '识别失败，请重试';
    } finally {
      job.finishedAt = this.now();
      this.active = null;
      void this.pump();
    }
  }
}

module.exports = { HandwritingQueue };
