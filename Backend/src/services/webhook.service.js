const isValidUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch (err) {
    return false;
  }
};

const retryQueue = [];
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;

const scheduleRetry = (entry) => {
  if (!entry || entry.attempts >= MAX_ATTEMPTS) return;
  const delay = Math.min(BASE_DELAY_MS * 2 ** (entry.attempts - 1), MAX_DELAY_MS);
  setTimeout(async () => {
    try {
      await deliver(entry.url, entry.payload);
    } catch (err) {
      entry.attempts += 1;
      retryQueue.push(entry);
      scheduleRetry(entry);
    }
  }, delay);
};

const enqueueRetry = (url, payload, attempts = 1) => {
  const entry = { url, payload, attempts };
  retryQueue.push(entry);
  scheduleRetry(entry);
};

const deliver = async (url, payload) => {
  if (!isValidUrl(url)) return;
  if (typeof fetch !== "function") {
    console.warn("Webhook skipped: fetch is not available in this runtime.");
    return;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}`);
  }
};

export const sendWebhook = async (url, payload) => {
  if (!isValidUrl(url)) return;
  try {
    await deliver(url, payload);
  } catch (err) {
    console.error("Webhook delivery failed, queued for retry:", err);
    enqueueRetry(url, payload, 1);
  }
};
