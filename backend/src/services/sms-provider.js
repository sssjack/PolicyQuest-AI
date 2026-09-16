const Sms = require('@alicloud/dypnsapi20170525');
const { $OpenApiUtil } = require('@alicloud/openapi-core');
const { RuntimeOptions } = require('@darabonba/typescript');

function configured() {
  return ['ALIYUN_SMS_ACCESS_KEY_ID', 'ALIYUN_SMS_ACCESS_KEY_SECRET', 'ALIYUN_SMS_SIGN_NAME', 'ALIYUN_SMS_TEMPLATE_CODE']
    .every(name => Boolean(process.env[name]?.trim()));
}
async function sendCode(phone, code) {
  const client = new Sms.default(new $OpenApiUtil.Config({
    accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
    endpoint: 'dypnsapi.aliyuncs.com', protocol: 'https',
  }));
  const params = { [process.env.ALIYUN_SMS_TEMPLATE_PARAM_NAME || 'code']: code };
  if (process.env.ALIYUN_SMS_TEMPLATE_MIN_PARAM_NAME) params[process.env.ALIYUN_SMS_TEMPLATE_MIN_PARAM_NAME] = '5';
  const response = await client.sendSmsVerifyCodeWithOptions(new Sms.SendSmsVerifyCodeRequest({
    phoneNumber: phone, countryCode: '86', signName: process.env.ALIYUN_SMS_SIGN_NAME,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE, templateParam: JSON.stringify(params),
    validTime: 300, interval: 60, duplicatePolicy: 1, returnVerifyCode: false,
  }), new RuntimeOptions({ connectTimeout: 5000, readTimeout: 10000, autoretry: false }));
  if (response.body?.code !== 'OK' || response.body?.success === false) {
    // 不记录供应商原始响应，避免验证码和手机号进入日志。
    throw new Error('短信供应商未接受发送请求');
  }
}
module.exports = { configured, sendCode };
