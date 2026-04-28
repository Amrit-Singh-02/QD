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

  const fromEmail = process.env.SENDGRID_FROM;
  if (!fromEmail) {
    throw new Error("SENDGRID_FROM is not set");
  }

  const msg = {
    to,
    from: {
      email: fromEmail,
      name: "QuickDROP",
    },
    subject,
    html,
    text: html.replace(/<[^>]*>/g, ""), // strip HTML for plain-text fallback
    trackingSettings: {
      clickTracking: { enable: false },
      openTracking: { enable: false },
    },
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log("SendGrid accepted message:", {
      to,
      subject,
      statusCode: response?.statusCode,
      messageId: response?.headers?.["x-message-id"] || response?.headers?.["X-Message-Id"],
    });
    return response;
  } catch (error) {
    console.error("SendGrid Error:", error.response?.body || error);
    throw error;
  }
};
