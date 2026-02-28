import sgMail from "@sendgrid/mail";

let isConfigured = false;

const ensureConfigured = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not set");
  }
  if (!isConfigured) {
    sgMail.setApiKey(apiKey);
    isConfigured = true;
  }
};

export const sendEmail = async (to, subject, html) => {
  ensureConfigured();

  const from = process.env.SENDGRID_FROM;
  if (!from) {
    throw new Error("SENDGRID_FROM is not set");
  }

  const msg = {
    to,
    from, // must be verified in SendGrid
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("SendGrid Error:", error.response?.body || error);
    throw error;
  }
};
