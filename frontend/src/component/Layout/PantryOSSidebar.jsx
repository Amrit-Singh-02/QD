import React from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    to: "/pantry-os/pantry",
    label: "Pantry",
    icon: "M4 7h16M6 7v12a1 1 0 001 1h10a1 1 0 001-1V7M9 11h6M9 15h6",
    description: "Track items and expiry",
  },
  {
    to: "/pantry-os/cook",
    label: "Cook Tonight AI",
    icon: "M12 8c1.657 0 3-1.343 3-3h-6c0 1.657 1.343 3 3 3zm0 0v12m-4-7h8",
    description: "Personalized recipes",
  },
  {
    to: "/pantry-os/reorder",
    label: "Smart Reorder",
    icon: "M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0111-3m3 9a7 7 0 01-11 3",
    description: "Auto reorder patterns",
  },
];

const PantryOSSidebar = ({ expiringCount = 0 }) => {
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="rounded-2xl border border-blinkit-border bg-white p-4 lg:sticky lg:top-24">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-widest text-blinkit-gray font-semibold">Pantry OS</p>
          <h2 className="text-lg font-bold text-blinkit-dark mt-1">Kitchen Control</h2>
          <p className="text-xs text-blinkit-gray mt-1">
            Plan, cook, and reorder from one place.
          </p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm border transition-colors ${
                  isActive
                    ? "bg-blinkit-green text-white border-blinkit-green"
                    : "bg-white text-blinkit-dark border-blinkit-border hover:bg-blinkit-light-gray"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{item.label}</span>
                      {item.label === "Pantry" && expiringCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {expiringCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] ${isActive ? "text-white/80" : "text-blinkit-gray"}`}>
                      {item.description}
                    </p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-xl bg-blinkit-light-gray p-3 text-xs text-blinkit-gray">
          Expiring soon: <span className="font-semibold text-blinkit-dark">{expiringCount}</span> items
        </div>
      </div>
    </aside>
  );
};

export default PantryOSSidebar;
