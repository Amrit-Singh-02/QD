import CustomError from "./customError.util.js";

export const ORDER_STATUSES = {
  PLACED: "PLACED",
  ASSIGNING: "ASSIGNING",
  ACCEPTED: "ACCEPTED",
  PICKED_UP: "PICKED_UP",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  NO_AGENT_AVAILABLE: "NO_AGENT_AVAILABLE",
};

const TRANSITIONS = {
  [ORDER_STATUSES.PLACED]: [
    ORDER_STATUSES.ASSIGNING,
    ORDER_STATUSES.CANCELLED,
  ],
  [ORDER_STATUSES.ASSIGNING]: [
    ORDER_STATUSES.ACCEPTED,
    ORDER_STATUSES.CANCELLED,
    ORDER_STATUSES.NO_AGENT_AVAILABLE,
  ],
  [ORDER_STATUSES.ACCEPTED]: [
    ORDER_STATUSES.PICKED_UP,
    ORDER_STATUSES.CANCELLED,
  ],
  [ORDER_STATUSES.PICKED_UP]: [ORDER_STATUSES.OUT_FOR_DELIVERY],
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: [ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.DELIVERED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
  [ORDER_STATUSES.NO_AGENT_AVAILABLE]: [ORDER_STATUSES.ASSIGNING],
};

export const normalizeOrderStatus = (status) => {
  if (!status) return status;
  return String(status).trim().toUpperCase();
};

export const canTransition = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  const allowed = TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};

export const assertValidTransition = (fromStatus, toStatus) => {
  if (!canTransition(fromStatus, toStatus)) {
    throw new CustomError(
      400,
      `Invalid order status transition: ${fromStatus} -> ${toStatus}`,
    );
  }
};

export const isTerminalStatus = (status) => {
  return (
    status === ORDER_STATUSES.DELIVERED ||
    status === ORDER_STATUSES.CANCELLED ||
    status === ORDER_STATUSES.NO_AGENT_AVAILABLE
  );
};
