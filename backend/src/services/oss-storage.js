const OSS = require('ali-oss');
const config = require('../config');

const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function encodeStorageKey(storageKey) {
  return storageKey.split('/').map(part => encodeURIComponent(part)).join('/');
}

function stripProtocol(value) {
  return String(value || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function ensureAliyunConfig() {
  const oss = config.oss || {};
  if (oss.provider !== 'aliyun') {
    throw new Error('OSS_PROVIDER must be aliyun for avatar uploads');
  }
  if (!oss.accessKey || !oss.secretKey) {
    throw new Error('OSS_ACCESS_KEY / OSS_SECRET_KEY not configured');
  }
  if (!oss.bucket || (!oss.endpoint && !oss.region)) {
    throw new Error('OSS_BUCKET and OSS_ENDPOINT or OSS_REGION not configured');
  }
}

function createAliyunClient() {
  ensureAliyunConfig();
  const oss = config.oss;
  const clientConfig = {
    accessKeyId: oss.accessKey,
    accessKeySecret: oss.secretKey,
    bucket: oss.bucket,
    secure: true,
  };

  if (oss.region) clientConfig.region = oss.region;
  if (oss.endpoint) clientConfig.endpoint = oss.endpoint;

  return new OSS(clientConfig);
}

function publicUrl(storageKey) {
  const oss = config.oss;
  const encodedKey = encodeStorageKey(storageKey);
  if (oss.cdnDomain) {
    return `${String(oss.cdnDomain).replace(/\/+$/, '')}/${encodedKey}`;
  }

  if (oss.endpoint) {
    return `https://${oss.bucket}.${stripProtocol(oss.endpoint)}/${encodedKey}`;
  }

  return `https://${oss.bucket}.${oss.region}.aliyuncs.com/${encodedKey}`;
}

async function putObject({ storageKey, buffer, contentType }) {
  const client = createAliyunClient();
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await client.put(storageKey, buffer, {
        headers: contentType ? { 'Content-Type': contentType } : undefined,
      });
      return {
        storageKey,
        url: publicUrl(storageKey),
      };
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

module.exports = {
  IMAGE_EXTENSIONS,
  putObject,
};
