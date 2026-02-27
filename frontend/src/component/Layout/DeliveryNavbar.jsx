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
    <header className="sticky top-0 z-40 bg-white border-b border-blinkit-border">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/delivery/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blinkit-green rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">QD</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-blinkit-dark">
              QuickDROP Delivery
            </p>
            <p className="text-[10px] text-blinkit-gray">
              Agent operations
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle className="shrink-0" />
          {agent ? (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-blinkit-gray">Agent</p>
                <p className="text-sm font-semibold text-blinkit-dark">
                  {agent?.name || "Delivery Agent"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blinkit-green text-white font-bold text-xs flex items-center justify-center overflow-hidden">
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
              <button
                type="button"
                onClick={handleProfileClick}
                className="px-3 py-2 text-xs font-semibold text-blinkit-dark border border-blinkit-border rounded-lg hover:bg-blinkit-light-gray transition-colors"
              >
                Profile
              </button>
              <button
                onClick={onLogout}
                className="px-3 py-2 text-xs font-semibold text-white bg-blinkit-green rounded-lg hover:bg-blinkit-green-dark transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login?role=delivery"
              className="px-3 py-2 text-xs font-semibold text-white bg-blinkit-green rounded-lg hover:bg-blinkit-green-dark transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default DeliveryNavbar;
