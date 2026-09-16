import crypto from 'crypto';

/**
 * Verify bank transfer slip via SlipOK API or EasySlip API
 * @param {Object} params
 * @param {Buffer} params.fileBuffer - Binary buffer of the uploaded slip image
 * @param {string} params.mimeType - Mime type (e.g. image/jpeg, image/png)
 * @param {string} params.fileName - File name
 * @param {number} params.expectedAmount - Expected transfer amount
 * @param {Object} params.settings - Store settings including promptpay & slipok config
 * @returns {Promise<Object>} Verification result
 */
export async function verifyBankSlip({ fileBuffer, mimeType, fileName, expectedAmount, settings }) {
  const promptpayConfig = settings?.promptpay || {};
  const slipokApiKey = (process.env.SLIPOK_API_KEY || promptpayConfig.slipokApiKey || '').trim();
  const slipokBranchId = (process.env.SLIPOK_BRANCH_ID || promptpayConfig.slipokBranchId || '').trim();
  const easyslipApiKey = (process.env.EASYSLIP_API_KEY || promptpayConfig.easyslipApiKey || '').trim();

  // Compute SHA256 hash of slip file for duplicate prevention
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Case 1: SlipOK API is configured
  if (slipokApiKey && slipokBranchId) {
    try {
      console.log(`🔍 [SlipOK] Verifying slip via SlipOK API (Branch: ${slipokBranchId})...`);
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: mimeType || 'image/jpeg' });
      formData.append('files', blob, fileName || 'slip.jpg');
      if (expectedAmount && Number(expectedAmount) > 0) {
        formData.append('amount', String(expectedAmount));
      }
      formData.append('log', 'true');

      const response = await fetch(`https://api.slipok.com/api/line/apikey/${slipokBranchId}`, {
        method: 'POST',
        headers: {
          'x-authorization': slipokApiKey
        },
        body: formData,
        signal: AbortSignal.timeout(15000)
      });

      const resData = await response.json();
      console.log(`📥 [SlipOK Response]:`, JSON.stringify(resData));

      if (resData && (resData.success === true || resData.data?.success === true)) {
        const data = resData.data || resData;
        const transRef = data.transRef || data.trans_ref || null;
        const actualAmount = parseFloat(data.amount || data.paidLocalAmount || expectedAmount);

        return {
          verified: true,
          provider: 'slipok',
          transRef,
          fileHash,
          amount: actualAmount,
          senderName: data.sender?.name || data.sender?.displayName || 'ลูกค้าผู้โอนเงิน',
          receivingAccount: data.receiver?.account || data.receiver?.proxy?.value || '',
          transDate: data.transDate || data.date || '',
          transTime: data.transTime || data.time || '',
          raw: data,
          message: `สลิปถูกต้อง โอนเงินสำเร็จ ฿${actualAmount.toLocaleString()} เข้าบัญชีเรียบร้อยแล้ว`
        };
      } else {
        const errMsg = resData.message || resData.data?.message || 'ไม่สามารถตรวจสอบสลิปได้ ข้อมูลสลิปไม่ถูกต้องหรือไม่พบรายการโอน';
        return {
          verified: false,
          fileHash,
          error: errMsg,
          raw: resData
        };
      }
    } catch (err) {
      console.error(`❌ [SlipOK Error]:`, err.message);
      return {
        verified: false,
        fileHash,
        error: `ระบบตรวจสอบสลิปขัดข้องชั่วคราว (${err.message}) กรุณารอแอดมินตรวจสอบ`
      };
    }
  }

  // Case 2: EasySlip API is configured
  if (easyslipApiKey) {
    try {
      console.log(`🔍 [EasySlip] Verifying slip via EasySlip API...`);
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: mimeType || 'image/jpeg' });
      formData.append('file', blob, fileName || 'slip.jpg');

      const response = await fetch('https://developer.easyslip.com/api/v1/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${easyslipApiKey}`
        },
        body: formData,
        signal: AbortSignal.timeout(15000)
      });

      const resData = await response.json();
      console.log(`📥 [EasySlip Response]:`, JSON.stringify(resData));

      if (resData && (resData.status === 200 || resData.data)) {
        const data = resData.data || {};
        const transRef = data.transRef || null;
        const actualAmount = parseFloat(data.amount?.amount || expectedAmount);

        return {
          verified: true,
          provider: 'easyslip',
          transRef,
          fileHash,
          amount: actualAmount,
          senderName: data.sender?.name || 'ลูกค้าผู้โอนเงิน',
          receivingAccount: data.receiver?.account?.bank?.account || '',
          transDate: data.date || '',
          raw: data,
          message: `สลิปถูกต้อง ตรวจสอบยอดโอน ฿${actualAmount.toLocaleString()} สำเร็จ`
        };
      } else {
        return {
          verified: false,
          fileHash,
          error: resData.message || 'สลิปไม่ถูกต้อง หรือไม่พบข้อมูลการทำรายการในระบบธนาคาร'
        };
      }
    } catch (err) {
      console.error(`❌ [EasySlip Error]:`, err.message);
      return {
        verified: false,
        fileHash,
        error: `เชื่อมต่อระบบตรวจสอบสลิปไม่สำเร็จ (${err.message})`
      };
    }
  }

  // Case 3: No external API configured yet
  // Returns pending for admin review or manual approval
  console.log(`ℹ️ [Slip Verification]: No SlipOK/EasySlip API Key configured. Slip submitted for Admin manual review.`);
  return {
    verified: false,
    needsManualReview: true,
    fileHash,
    amount: expectedAmount ? parseFloat(expectedAmount) : 0,
    message: 'ได้รับหลักฐานสลิปการโอนเงินแล้ว รอแอดมินตรวจสอบยอดเงินและอนุมัติเครดิต'
  };
}
