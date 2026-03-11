import { Link } from "react-router-dom";
import ThemeToggle from "../UI/ThemeToggle";

const DeliveryNavbar = ({ agent, onLogout }) => {
  const initials = agent?.name
    ? agent.name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "DA";

  const profileUrl = agent?.profileImage?.url || "";

  const handleProfileClick = () => {
    if (typeof document === "undefined") return;
    const section = document.getElementById("delivery-profile");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-blinkit-border/60">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link to="/delivery/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-blinkit-green to-blinkit-green rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-white font-black text-sm">QD</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-blinkit-dark">
              QuickDROP
            </p>
            <p className="text-[10px] text-blinkit-gray font-medium">
              Delivery Dashboard
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <ThemeToggle className="shrink-0" />
          {agent ? (
            <>
              <div className="hidden sm:flex items-center gap-2.5 bg-blinkit-light-gray/80 rounded-xl px-3 py-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blinkit-green to-blinkit-green text-white font-bold text-xs flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                  {profileUrl ? (
                    <img
                      src={profileUrl}
                      alt={agent?.name || "Delivery Agent"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-blinkit-dark leading-tight">
                    {agent?.name || "Agent"}
                  </p>
                  <p className="text-[10px] text-blinkit-gray leading-tight">
                    {agent?.isOnline ? "🟢 Online" : "⚫ Offline"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleProfileClick}
                className="px-3 py-2 text-xs font-semibold text-blinkit-dark border border-blinkit-border rounded-xl hover:bg-blinkit-light-gray transition-all hover:shadow-sm"
              >
                Profile
              </button>
              <button
                onClick={onLogout}
                className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blinkit-green to-blinkit-green rounded-xl hover:shadow-md transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login?role=delivery"
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blinkit-green to-blinkit-green rounded-xl hover:shadow-md transition-all"
            >
              Agent Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default DeliveryNavbar;
