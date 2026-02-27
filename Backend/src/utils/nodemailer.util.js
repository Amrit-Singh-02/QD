import mailTransport from "../config/nodemailer.config.js";

export const sendEmail = async (to, subject, html) => {
  return mailTransport.sendMail({
    from: process.env.NODEMAILER_EMAIL,
    to,
    subject,
    html,
  });
};
