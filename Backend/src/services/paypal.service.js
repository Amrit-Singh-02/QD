import CustomError from "../utils/customError.util.js";

const getPayPalMode = () => {
  const mode = String(process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  return mode === "live" ? "live" : "sandbox";
};

const getPayPalBaseUrl = () =>
  getPayPalMode() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export const getPayPalCurrency = () => {
  if (process.env.PAYPAL_CURRENCY) {
    return String(process.env.PAYPAL_CURRENCY).toUpperCase();
  }
  return "USD";
};

export const getPayPalUsdRate = () => {
  const raw = process.env.PAYPAL_USD_RATE;
  if (!raw) {
    console.warn("PAYPAL_USD_RATE not set. Defaulting to 83.");
    return 83;
  }
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new CustomError(500, "PAYPAL_USD_RATE must be a positive number");
  }
  return rate;
};

export const convertInrToUsd = (amountInr, rate) => {
  const numeric = Number(amountInr);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new CustomError(400, "Invalid amount for currency conversion");
  }
  const usd = numeric / rate;
  return Number(usd.toFixed(2));
};

export const getPayPalClientId = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) {
    throw new CustomError(500, "PayPal client id is not configured");
  }
  return clientId;
};

const getPayPalSecret = () => {
  const secret = process.env.PAYPAL_SECRET_ID;
  if (!secret) {
    throw new CustomError(500, "PayPal secret is not configured");
  }
  return secret;
};

const ensureFetch = () => {
  if (typeof fetch !== "function") {
    throw new CustomError(
      500,
      "Fetch API is not available. Use Node 18+ or add a fetch polyfill.",
    );
  }
};

let cachedToken = null;
let tokenExpiresAt = 0;

const requestPayPalAccessToken = async () => {
  ensureFetch();
  const clientId = getPayPalClientId();
  const secret = getPayPalSecret();
  const baseUrl = getPayPalBaseUrl();

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message =
      data?.error_description ||
      data?.message ||
      "Failed to fetch PayPal access token";
    throw new CustomError(response.status, message);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (Number(data.expires_in || 0) * 1000);
  return cachedToken;
};

const getPayPalAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60 * 1000) {
    return cachedToken;
  }
  return await requestPayPalAccessToken();
};

const formatPayPalError = (data) => {
  const issue = data?.details?.[0]?.issue;
  const description = data?.details?.[0]?.description;
  const name = data?.name;
  const debugId = data?.debug_id;

  let message = description || data?.message || "PayPal request failed";
  if (issue) message = `${message} (issue: ${issue})`;
  if (name && !message.includes(name)) message = `${message} [${name}]`;
  if (debugId) message = `${message} (debug_id: ${debugId})`;
  return message;
};

const callPayPal = async (path, { method = "POST", body } = {}) => {
  ensureFetch();
  const baseUrl = getPayPalBaseUrl();
  const token = await getPayPalAccessToken();

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    console.error("PayPal API error:", {
      path,
      status: response.status,
      data,
    });
    throw new CustomError(response.status, formatPayPalError(data));
  }

  return data;
};

export const createPayPalOrder = async ({ amount, currency, referenceId }) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new CustomError(400, "Invalid order amount for PayPal");
  }

  const payload = {
    intent: "CAPTURE",
    application_context: {
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
    },
    purchase_units: [
      {
        reference_id: referenceId,
        amount: {
          currency_code: currency,
          value: value.toFixed(2),
        },
      },
    ],
  };

  return await callPayPal("/v2/checkout/orders", { method: "POST", body: payload });
};

export const capturePayPalOrder = async (orderId) => {
  if (!orderId) {
    throw new CustomError(400, "PayPal order id is required");
  }
  return await callPayPal(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
  });
};
