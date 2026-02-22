import { useState } from "react";
import toast from "react-hot-toast";
import { deliveryService } from "../../services/deliveryService";

const isPaymentFinal = (paymentStatus) => {
  const normalized = String(paymentStatus || "").toLowerCase();
  return normalized === "paid" || normalized === "successful";
};

const ACTIONS = [
  {
    id: "PICKED_UP",
    label: "Mark Picked Up",
    requiredStatuses: ["ACCEPTED"],
    call: deliveryService.pickupOrder,
  },
  {
    id: "OUT_FOR_DELIVERY",
    label: "Out For Delivery",
    requiredStatuses: ["PICKED_UP"],
    call: deliveryService.markOutForDelivery,
  },
  {
    id: "PAYMENT_ACCEPTED",
    label: "Payment Accepted",
    requiredStatuses: ["PICKED_UP", "OUT_FOR_DELIVERY"],
    call: deliveryService.acceptPayment,
    affectsStatus: false,
    disableWhen: ({ paymentStatus }) => isPaymentFinal(paymentStatus),
  },
  {
    id: "DELIVERED",
    label: "Mark Delivered",
    requiredStatuses: ["OUT_FOR_DELIVERY"],
    call: deliveryService.markDelivered,
  },
];

const DeliveryOrderActions = ({
  orderId,
  status,
  paymentStatus,
  onStatusChange,
  onOrderUpdate,
}) => {
  const [loadingAction, setLoadingAction] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleAction = async (action) => {
    if (!orderId) return;
    setLoadingAction(action.id);
    try {
      const response = await action.call(orderId);
      const payload = response?.payload;
      if (onOrderUpdate && payload) {
        onOrderUpdate(payload);
      }
      if (action.affectsStatus !== false) {
        const nextStatus = payload?.orderStatus || action.id;
        if (onStatusChange) onStatusChange(nextStatus);
      }
      toast.success(response?.message || "Order updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;
    setLoadingAction("CANCEL");
    try {
      const response = await deliveryService.cancelOrder(orderId);
      toast.success(response?.message || "Order cancelled");
      if (onOrderUpdate) onOrderUpdate(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setLoadingAction(null);
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="mt-8 rounded-xl border border-blinkit-border bg-white p-4">
      <h3 className="font-bold text-blinkit-dark mb-2">Delivery Actions</h3>
      <p className="text-xs text-blinkit-gray mb-4">
        These actions are available to the assigned delivery agent only.
      </p>
      <div className="flex flex-wrap gap-3">
        {ACTIONS.map((action) => {
          const allowed = action.requiredStatuses?.includes(status);
          const disabled =
            !orderId ||
            loadingAction !== null ||
            !allowed ||
            (action.disableWhen && action.disableWhen({ paymentStatus, status }));
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={disabled}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-blinkit-border disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blinkit-light-gray transition-colors"
            >
              {loadingAction === action.id ? "Updating..." : action.label}
            </button>
          );
        })}

        {status === "ACCEPTED" && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={loadingAction !== null}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loadingAction === "CANCEL" ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl border border-blinkit-border p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-blinkit-dark mb-2">
              Cancel Order?
            </h3>
            <p className="text-sm text-blinkit-gray mb-4">
              This will reassign the order to another agent. Your acceptance
              rate will be penalized.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-blinkit-border text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={loadingAction !== null}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loadingAction === "CANCEL"
                  ? "Cancelling..."
                  : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOrderActions;
