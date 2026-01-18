const axios = require('axios');

const sendEmailViaApi = async (to, subject, htmlContent, fromName = 'LMS Studio') => {
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not configured');
    return false;
  }

  const payload = {
    sender: {
      name: fromName,
      email: process.env.SMTP_USER || 'noreply@lmsstudio.com',
    },
    to: [{ email: to }],
    subject: subject,
    htmlContent: htmlContent,
  };

  try {
    console.log(`📤 Sending email via Brevo REST API to: ${to}`);
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    console.log(`✅ Email sent via Brevo API. Message ID: ${response.data.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Brevo API error:', error.response?.data?.message || error.message);
    return false;
  }
};

module.exports = {
  sendEmailViaApi,
};

