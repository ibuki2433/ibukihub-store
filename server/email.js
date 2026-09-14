import nodemailer from 'nodemailer';
import { db } from './db.js';

/**
 * Universal Email Delivery Service (Gmail SMTP & Custom SMTP)
 * Sends professional OTP & Notification emails to users.
 */
export async function sendEmail({ to, subject, html, text, otp, ref }) {
  const cleanEmail = (to || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("กรุณาระบุที่อยู่อีเมลผู้รับ");
  }

  const settings = db.getSettings() || {};
  const emailConfig = settings.emailGateway || {
    enabled: false,
    provider: 'gmail',
    user: '',
    pass: '',
    fromName: 'IbukiHub Store',
    host: 'smtp.gmail.com',
    port: 465
  };

  const fromAddress = emailConfig.user 
    ? `"${emailConfig.fromName || 'IbukiHub'}" <${emailConfig.user}>`
    : `"IbukiHub" <noreply@ibukihub.local>`;

  console.log(`\n========================================================================`);
  console.log(`📧 [Gmail OTP Service] DISPATCHING EMAIL TO: ${cleanEmail}`);
  if (otp) console.log(`🔑 OTP Code: ${otp} | Ref: ${ref || '-'}`);
  console.log(`✉️ Subject: ${subject}`);

  // If real Gmail / SMTP credentials are configured and enabled
  if (emailConfig.enabled && emailConfig.user && emailConfig.pass) {
    try {
      console.log(`🚀 [Gmail SMTP] Connecting to ${emailConfig.provider === 'gmail' ? 'Gmail SMTP' : emailConfig.host}...`);
      
      const cleanPass = emailConfig.pass.replace(/\s+/g, '');
      const transporter = emailConfig.provider === 'gmail'
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: emailConfig.user,
              pass: cleanPass
            }
          })
        : nodemailer.createTransport({
            host: emailConfig.host || 'smtp.gmail.com',
            port: Number(emailConfig.port) || 465,
            secure: Number(emailConfig.port) === 465,
            auth: {
              user: emailConfig.user,
              pass: cleanPass
            }
          });

      const info = await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject: subject,
        text: text,
        html: html
      });

      console.log(`✅ [Gmail SMTP] Email successfully delivered! MessageId: ${info.messageId}`);
      console.log(`========================================================================\n`);

      return {
        success: true,
        delivered: true,
        provider: emailConfig.provider,
        messageId: info.messageId
      };
    } catch (err) {
      console.error(`❌ [Gmail SMTP Error]:`, err.message);
      console.log(`⚠️ Falling back to logged OTP for development.`);
      console.log(`========================================================================\n`);
      return {
        success: true,
        delivered: false,
        simulated: true,
        error: err.message,
        message: "ระบบจำลองการส่งอีเมล (โปรดตรวจสอบการตั้งค่า Gmail App Password)"
      };
    }
  }

  // Fallback / Simulated mode when SMTP is not yet configured
  console.log(`ℹ️ [Notice] ยังไม่ได้เปิดใช้งาน Gmail SMTP ใน Admin Dashboard (เปิดได้ที่ แผงควบคุมระบบ -> ตั้งค่าระบบอีเมล)`);
  console.log(`========================================================================\n`);

  return {
    success: true,
    delivered: false,
    simulated: true,
    message: "บันทึกรหัส OTP ลงในคอนโซลเรียบร้อยแล้ว"
  };
}

/**
 * Generate a responsive, dark/purple styled HTML template for OTP verification.
 */
export function generateOtpHtml({ otp, ref, username, purpose = 'ยืนยันการสมัครสมาชิก' }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>รหัสยืนยันตัวตน OTP - IbukiHub</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0b0814; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0814; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" max-width="520px" style="max-width: 520px; background-color: #151124; border: 1px solid #3b2a68; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <!-- Header Banner -->
            <tr>
              <td style="background: linear-gradient(135deg, #4c1d95 0%, #1e113a 100%); padding: 25px 25px 20px; text-align: center;">
                <h1 style="margin: 0; color: #e9d5ff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">IbukiHub Store</h1>
                <p style="margin: 5px 0 0; color: #c084fc; font-size: 13px;">ศูนย์รวมซอฟต์แวร์และโปรแกรมพกพาอัตโนมัติ</p>
              </td>
            </tr>

            <!-- Content Body -->
            <tr>
              <td style="padding: 30px 25px 25px;">
                <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 18px; font-weight: 700;">
                  รหัสยืนยันตัวตน OTP ของคุณ
                </h2>
                <p style="margin: 0 0 20px; color: #c4b5fd; font-size: 14px; line-height: 1.5;">
                  สวัสดีคุณ <strong style="color: #ffffff;">${username || 'ผู้ใช้งาน'}</strong>,<br>
                  คุณได้ทำรายการ <strong>${purpose}</strong> ที่เว็บไซต์ IbukiHub กรุณานำรหัส OTP 6 หลักด้านล่างนี้ไปกรอกเพื่อยืนยันตัวตน:
                </p>

                <!-- OTP Display Box -->
                <div style="background-color: #0e0a1b; border: 2px dashed #8b5cf6; border-radius: 14px; padding: 20px; text-align: center; margin: 25px 0;">
                  <span style="display: block; font-size: 11px; text-transform: uppercase; color: #a78bfa; letter-spacing: 1.5px; margin-bottom: 6px;">รหัสยืนยันตัวตน (OTP)</span>
                  <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #34d399; font-family: monospace; text-shadow: 0 0 10px rgba(52, 211, 153, 0.4);">
                    ${otp}
                  </div>
                  ${ref ? `
                  <div style="margin-top: 10px; display: inline-block; background-color: #2e1065; color: #e9d5ff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; border: 1px solid #7c3aed;">
                    รหัสอ้างอิง (Ref): <strong>${ref}</strong>
                  </div>
                  ` : ''}
                </div>

                <!-- Warning Notice -->
                <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 14px; border-radius: 6px; margin: 20px 0 10px;">
                  <p style="margin: 0; color: #fca5a5; font-size: 12px; line-height: 1.5;">
                    ⚠️ <strong>ข้อควรระวัง:</strong> รหัส OTP มีอายุใช้งาน <strong>5 นาที</strong> โปรดอย่านำรหัสนี้ไปเปิดเผยแก่บุคคลอื่นเพื่อความปลอดภัยของบัญชีของคุณ
                  </p>
                </div>

                <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px;">
                  หากคุณไม่ได้เป็นผู้ทำรายการนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้ บัญชีของคุณจะยังคงปลอดภัย
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #0c0818; padding: 18px 25px; text-align: center; border-top: 1px solid #281a4a;">
                <p style="margin: 0; color: #6b7280; font-size: 11px;">
                  © 2026 IbukiHub Software Store. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}
