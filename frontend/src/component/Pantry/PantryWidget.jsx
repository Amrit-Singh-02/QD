import React from "react";
import { Link } from "react-router-dom";
import { usePantry } from "../../context/PantryContext";

const PantryWidget = () => {
  const { expiringItems } = usePantry();
  const count = expiringItems.length;
  return (
    <div className="rounded-2xl border border-blinkit-border bg-white p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-blinkit-gray font-semibold">Pantry OS</p>
        <h3 className="text-lg font-bold text-blinkit-dark mt-1">{count} items expiring soon</h3>
        <p className="text-xs text-blinkit-gray mt-1">Use expiring items first and reduce waste.</p>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/cook-tonight" className="px-3 py-2 rounded-xl border border-blinkit-border text-xs font-semibold text-blinkit-dark">Cook today</Link>
        <Link to="/pantry" className="px-3 py-2 rounded-xl bg-blinkit-green text-white text-xs font-semibold">View Pantry</Link>
      </div>
    </div>
  );
};

export default PantryWidget;
