/**
 * SMS Dispatch Service for BuildOps Sentinel (FR04, FR07)
 * Supports AfricasTalking / Twilio or Sandbox Mock Gateway fallback.
 */

const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY;

function formatPhoneNumber(phone) {
  if (!phone) return '+254700000000';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+254' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

async function sendSMS(toPhoneNumber, messageBody) {
  const formattedPhone = formatPhoneNumber(toPhoneNumber);
  const timestamp = new Date().toISOString();

  // If live AfricasTalking credentials exist
  if (AFRICASTALKING_USERNAME && AFRICASTALKING_API_KEY) {
    try {
      const africastalking = require('africastalking')({
        apiKey: AFRICASTALKING_API_KEY,
        username: AFRICASTALKING_USERNAME
      });
      const sms = africastalking.SMS;
      const response = await sms.send({
        to: [formattedPhone],
        message: messageBody,
        from: process.env.AFRICASTALKING_SENDER_ID || undefined
      });

      return {
        success: true,
        channel: 'SMS',
        provider: 'AfricasTalking',
        recipient: formattedPhone,
        message: messageBody,
        response,
        sent_at: timestamp
      };
    } catch (err) {
      console.warn(`[SMS Warning] AfricasTalking dispatch failed: ${err.message}. Falling back to mock logger.`);
    }
  }

  // Mock / Sandbox Gateway Fallback
  console.log(`\n==========================================`);
  console.log(`  [SMS DISPATCH LOG] ${timestamp} `);
  console.log(`  To:      ${formattedPhone}`);
  console.log(`  Message: ${messageBody}`);
  console.log(`==========================================\n`);

  return {
    success: true,
    channel: 'SMS',
    provider: 'MockGateway',
    recipient: formattedPhone,
    message: messageBody,
    message_id: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sent_at: timestamp
  };
}

module.exports = {
  formatPhoneNumber,
  sendSMS
};
