const brevo = require('@getbrevo/brevo');

let apiInstance = null;

const initBrevoApi = () => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️  BREVO_API_KEY not configured. Email sending will use SMTP only.');
    return null;
  }

  const defaultClient = brevo.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  apiInstance = new brevo.TransactionalEmailsApi();
  console.log('✅ Brevo API initialized');
  return apiInstance;
};

const sendEmailViaApi = async (to, subject, htmlContent, fromName = 'LMS Studio') => {
  if (!apiInstance) {
    apiInstance = initBrevoApi();
  }

  if (!apiInstance) {
    console.error('❌ Brevo API not initialized');
    return false;
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = { name: fromName, email: process.env.SMTP_USER || 'noreply@yourdomain.com' };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    console.log(`📤 Sending email via Brevo API to: ${to}`);
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent via Brevo API. Message ID: ${data.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Brevo API error:', error.message);
    return false;
  }
};

module.exports = {
  sendEmailViaApi,
};
