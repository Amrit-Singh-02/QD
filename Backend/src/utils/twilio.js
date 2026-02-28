import twilio from "twilio";

let cachedClient;

const getClient = () => {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials are missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
    );
  }

  if (!cachedClient) {
    cachedClient = twilio(accountSid, authToken);
  }

  return cachedClient;
};

const getVerifyService = () => {
  const verifySid = (process.env.TWILIO_VERIFY_SERVICE_SID || "").trim();
  if (!verifySid) {
    throw new Error(
      "Twilio Verify Service SID is missing. Set TWILIO_VERIFY_SERVICE_SID."
    );
  }
  if (!/^VA[a-zA-Z0-9]{32}$/.test(verifySid)) {
    throw new Error(
      "Twilio Verify Service SID is invalid. It should start with 'VA' and be 34 chars long."
    );
  }

  return getClient().verify.v2.services(verifySid);
};

export const sendOTP = async (phone) => {
  return await getVerifyService().verifications.create({
    to: phone,
    channel: "sms",
  });
};

export const verifyOTP = async (phone, code) => {
  const result = await getVerifyService().verificationChecks.create({
    to: phone,
    code: code,
  });

  return result.status === "approved";
};
