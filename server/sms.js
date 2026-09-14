import { db } from './db.js';

/**
 * Universal SMS Gateway Dispatcher
 * Supports:
 * 1. ThaiBulkSMS (Thailand Standard)
 * 2. SMSMKT (SMS Marketing Thailand)
 * 3. Twilio (International)
 * 4. Custom Webhook
 */
export async function sendSms({ phone, message, otp, ref }) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const settings = db.getSettings() || {};
  const gateway = settings.smsGateway || {};

  console.log(`📱 [SMS Gateway] Request to send SMS to: ${cleanPhone} (Ref: ${ref}, OTP: ${otp})`);

  // 1. If ThaiBulkSMS is configured & enabled
  if (gateway.enabled && gateway.provider === 'thaibulksms' && gateway.apiKey && gateway.apiSecret) {
    try {
      // ThaiBulkSMS Standard SMS API
      const params = new URLSearchParams();
      params.append('msisdn', cleanPhone.startsWith('0') ? '66' + cleanPhone.slice(1) : cleanPhone);
      params.append('message', message);
      params.append('sender', gateway.senderName || 'IbukiHub');
      params.append('force', 'standard');

      const authHeader = 'Basic ' + Buffer.from(`${gateway.apiKey}:${gateway.apiSecret}`).toString('base64');
      const response = await fetch('https://api-v2.thaibulksms.com/sms', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const resJson = await response.json().catch(() => ({}));
      if (response.ok && !resJson.error) {
        console.log(`✅ [ThaiBulkSMS] Successfully sent SMS to ${cleanPhone}:`, resJson);
        return { success: true, provider: 'thaibulksms', details: resJson };
      } else {
        console.error(`❌ [ThaiBulkSMS Error]:`, resJson);
        return { success: false, provider: 'thaibulksms', error: resJson.error?.message || "ส่ง SMS ผ่าน ThaiBulkSMS ไม่สำเร็จ" };
      }
    } catch (err) {
      console.error(`❌ [ThaiBulkSMS Connection Error]:`, err);
      return { success: false, provider: 'thaibulksms', error: err.message };
    }
  }

  // 2. If SMSMKT is configured & enabled
  if (gateway.enabled && gateway.provider === 'smsmkt' && gateway.apiKey && gateway.apiSecret) {
    try {
      const response = await fetch('https://api.smsmkt.com/v1/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': gateway.apiKey,
          'secret_key': gateway.apiSecret
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: message,
          sender: gateway.senderName || 'IbukiHub'
        })
      });

      const resJson = await response.json().catch(() => ({}));
      if (response.ok && resJson.code === '000') {
        console.log(`✅ [SMSMKT] Successfully sent SMS to ${cleanPhone}:`, resJson);
        return { success: true, provider: 'smsmkt', details: resJson };
      } else {
        console.error(`❌ [SMSMKT Error]:`, resJson);
        return { success: false, provider: 'smsmkt', error: resJson.message || "ส่ง SMS ผ่าน SMSMKT ไม่สำเร็จ" };
      }
    } catch (err) {
      console.error(`❌ [SMSMKT Connection Error]:`, err);
      return { success: false, provider: 'smsmkt', error: err.message };
    }
  }

  // 3. If Twilio is configured & enabled
  if (gateway.enabled && gateway.provider === 'twilio' && gateway.accountSid && gateway.authToken) {
    try {
      const internationalPhone = cleanPhone.startsWith('0') ? '+66' + cleanPhone.slice(1) : '+' + cleanPhone;
      const params = new URLSearchParams();
      params.append('To', internationalPhone);
      params.append('From', gateway.senderNumber || gateway.senderName || 'IbukiHub');
      params.append('Body', message);

      const authHeader = 'Basic ' + Buffer.from(`${gateway.accountSid}:${gateway.authToken}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${gateway.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const resJson = await response.json().catch(() => ({}));
      if (response.ok && !resJson.error_code) {
        console.log(`✅ [Twilio] Successfully sent SMS to ${internationalPhone}:`, resJson.sid);
        return { success: true, provider: 'twilio', sid: resJson.sid };
      } else {
        console.error(`❌ [Twilio Error]:`, resJson);
        return { success: false, provider: 'twilio', error: resJson.message };
      }
    } catch (err) {
      console.error(`❌ [Twilio Connection Error]:`, err);
      return { success: false, provider: 'twilio', error: err.message };
    }
  }

  // 4. Default / Simulated Mode (When no SMS Gateway API Key is configured yet)
  // Server logs to terminal for admin oversight, but OTP is NEVER leaked to the client browser!
  console.log(`========================================================================`);
  console.log(`📱 [SMS Gateway] DISPATCHING OTP TO MOBILE PHONE: ${cleanPhone}`);
  console.log(`💬 Message: "${message}"`);
  console.log(`🔑 OTP: ${otp} | Ref: ${ref}`);
  if (!gateway.enabled || !gateway.apiKey) {
    console.log(`ℹ️ [SMS Notice] ยังไม่ได้เปิดใช้งาน SMS Gateway ในระบบ Admin (ตั้งค่าได้ที่ Admin Dashboard -> ตั้งค่า SMS Gateway)`);
  }
  console.log(`========================================================================`);

  return {
    success: true,
    simulated: true,
    message: "ส่งคำขอ SMS เรียบร้อยแล้ว"
  };
}
