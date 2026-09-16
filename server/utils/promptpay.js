/**
 * PromptPay EMVCo QR Code Payload Generator (Standard of Bank of Thailand / National ITMX)
 * Produces valid EMVCo QR strings readable by all Thai banking applications (SCB, KBank, KTB, BBL, TTB, GSB, etc.)
 */

function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id, value) {
  const strVal = String(value);
  const len = strVal.length.toString().padStart(2, '0');
  return `${id}${len}${strVal}`;
}

/**
 * Generate official PromptPay EMVCo QR Payload
 * @param {string} target - Mobile phone (10 digits) or Citizen / Tax ID (13 digits)
 * @param {number|string|null} amount - Transfer amount in THB (optional)
 * @returns {string} EMVCo QR payload string
 */
export function generatePromptPayPayload(target, amount = null) {
  if (!target) return '';
  const cleanTarget = String(target).replace(/[^0-9]/g, '');
  if (!cleanTarget) return '';

  let formattedTarget = '';

  if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
    // Mobile phone number: 08x-xxx-xxxx -> 00668xxxxxxxx (13 chars)
    const internationalPhone = '0066' + cleanTarget.slice(1);
    formattedTarget = formatTag('01', internationalPhone.padStart(13, '0'));
  } else if (cleanTarget.length === 13) {
    // Citizen ID or Tax ID
    formattedTarget = formatTag('02', cleanTarget);
  } else if (cleanTarget.length === 15) {
    // e-Wallet ID
    formattedTarget = formatTag('03', cleanTarget);
  } else if (cleanTarget.length === 10) {
    // 10-digit Bank Account Number (e.g. KBANK: 004, TTB: 011, SCB: 014, BBL: 002)
    let bankCode = '004'; // Default to KBANK (Kasikornbank)
    if (cleanTarget.startsWith('209')) bankCode = '011'; // TTB
    else if (cleanTarget.startsWith('156')) bankCode = '004'; // KBANK
    formattedTarget = formatTag('04', (bankCode + cleanTarget).padStart(13, '0'));
  } else {
    // Generic fallback
    formattedTarget = formatTag('01', cleanTarget.padStart(13, '0'));
  }

  // Tag 29: Merchant Account Information - PromptPay AID
  const aid = formatTag('00', 'A000000677010111');
  const tag29Value = aid + formattedTarget;

  const numAmount = amount ? parseFloat(amount) : null;
  const isDynamic = numAmount && !isNaN(numAmount) && numAmount > 0;

  let payload = '';
  payload += formatTag('00', '01'); // Payload Format Indicator
  payload += formatTag('01', isDynamic ? '12' : '11'); // 12 = Dynamic with Amount, 11 = Static
  payload += formatTag('29', tag29Value); // Tag 29 PromptPay
  payload += formatTag('53', '764'); // Currency: THB (764)

  if (isDynamic) {
    payload += formatTag('54', numAmount.toFixed(2)); // Amount
  }

  payload += formatTag('58', 'TH'); // Country: TH

  // Tag 63: CRC16 Checksum
  payload += '6304';
  const checksum = crc16(payload);

  return payload + checksum;
}
