import admin from "firebase-admin";

let messaging = null;
let initAttempted = false;

const parsePrivateKey = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  return raw.replace(/\\n/g, "\n");
};

export const initFirebaseAdmin = () => {
  if (initAttempted) return Boolean(messaging);
  initAttempted = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[FCM] Firebase Admin not configured (set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Push skipped.",
    );
    return false;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    messaging = admin.messaging();
    console.log("[FCM] Firebase Admin initialized");
    return true;
  } catch (err) {
    console.error("[FCM] Firebase Admin init failed:", err?.message || err);
    messaging = null;
    return false;
  }
};

/**
 * @param {string} fcmToken
 * @param {{ title?: string; body?: string; data?: Record<string, string> }} payload
 */
export const sendPushNotification = async (fcmToken, payload = {}) => {
  if (!fcmToken) return false;

  if (!messaging) initFirebaseAdmin();
  if (!messaging) return false;

  const data = payload.data || {};
  const dataStrings = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v == null ? "" : String(v)]),
  );

  try {
    await messaging.send({
      token: fcmToken,
      notification: {
        title: payload.title || "QuickDrop",
        body: payload.body || "",
      },
      data: dataStrings,
      android: { priority: "high" },
      apns: {
        payload: { aps: { sound: "default" } },
      },
    });
    return true;
  } catch (err) {
    console.error("[FCM] send failed:", err?.message || err);
    return false;
  }
};
