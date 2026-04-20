import React from "react";

const ExpiryChip = ({ expiryDate }) => {
  if (!expiryDate) return null;
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  let label = `${days} days left`;
  let tone = "bg-green-50 text-green-700 border-green-200";
  if (days <= 0) {
    label = "Expired";
    tone = "bg-gray-100 text-gray-600 border-gray-200";
  } else if (days <= 3) {
    label = `${days} day${days > 1 ? "s" : ""} left`;
    tone = "bg-red-50 text-red-700 border-red-200";
  } else if (days <= 7) {
    tone = "bg-amber-50 text-amber-700 border-amber-200";
  }
  return <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${tone}`}>{label}</span>;
};

export default ExpiryChip;
