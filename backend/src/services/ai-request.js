const fetch = require('node-fetch');
const { AiRequestLog } = require('../models');

function stringify(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({ serializationError: error.message });
  }
}

async function createLog(values) {
  try {
    return await AiRequestLog.create(values);
  } catch (error) {
    console.error('AI请求审计记录创建失败', { purpose: values.purpose, message: error.message });
    return null;
  }
}

async function updateLog(log, values) {
  if (!log) return;
  try {
    await log.update(values);
  } catch (error) {
    console.error('AI请求审计记录更新失败', { logId: log.id, message: error.message });
  }
}

async function requestAi(options) {
  const {
    url,
    apiKey,
    model,
    messages,
    maxTokens,
    timeout = 180000,
    responseFormat,
    purpose = 'ai_request',
    userId = null,
    attemptId = null,
    attemptAnswerId = null,
    extraBody = {},
  } = options;
  if (!url || !apiKey) throw new Error('AI模型尚未配置，无法完成请求');

  const body = {
    model,
    max_completion_tokens: maxTokens,
    ...(responseFormat ? { response_format: responseFormat } : {}),
    messages,
    ...extraBody,
  };
  const startedAt = Date.now();
  const log = await createLog({
    purpose,
    url,
    method: 'POST',
    model: model || '',
    request_body: stringify(body),
    status: 'pending',
    user_id: userId,
    attempt_id: attemptId,
    attempt_answer_id: attemptAnswerId,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      timeout,
    });
    const responseText = await response.text();
    const durationMs = Date.now() - startedAt;
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      await updateLog(log, {
        response_body: responseText,
        http_status: response.status,
        status: 'failed',
        duration_ms: durationMs,
        error_message: 'AI服务返回的内容不是有效JSON',
      });
      throw new Error('AI服务返回的内容不是有效JSON');
    }

    if (!response.ok) {
      const errorMessage = data?.error?.message || `AI服务返回HTTP ${response.status}`;
      await updateLog(log, {
        response_body: responseText,
        http_status: response.status,
        status: 'failed',
        duration_ms: durationMs,
        error_message: errorMessage,
      });
      const requestError = new Error(errorMessage);
      requestError.httpStatus = response.status;
      throw requestError;
    }

    await updateLog(log, {
      response_body: responseText,
      http_status: response.status,
      status: 'success',
      duration_ms: durationMs,
      error_message: null,
    });
    return data;
  } catch (error) {
    await updateLog(log, {
      status: 'failed',
      duration_ms: Date.now() - startedAt,
      error_message: error.message,
    });
    throw error;
  }
}

module.exports = { requestAi };
