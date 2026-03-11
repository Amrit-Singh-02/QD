import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const linkGroups = [
  {
    title: "Company",
    links: ["About Us", "Careers", "Blog", "Press", "Contact Us"],
  },
  {
    title: "Categories",
    links: [
      "Fruits & Vegetables",
      "Dairy & Bakery",
      "Snacks & Beverages",
      "Frozen Foods",
      "Personal Care",
    ],
  },
  {
    title: "Help",
    links: [
      "FAQ",
      "Privacy Policy",
      "Terms of Service",
      "Returns Policy",
      "Partner with us",
    ],
  },
];

const Footer = () => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handler = (event) => {
      if (event?.detail?.open === false) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };
    window.addEventListener("footer:expand", handler);
    return () => window.removeEventListener("footer:expand", handler);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const body = document.body;
    if (isHome) {
      body.classList.remove("footer-collapsed");
      return undefined;
    }
    body.classList.toggle("footer-collapsed", !expanded);
    return () => body.classList.remove("footer-collapsed");
  }, [expanded, isHome]);

  const footerContent = (
    <>
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1">Stay updated with QuickDROP</h3>
            <p className="text-gray-400 text-sm">
              Get updates on exclusive offers and new arrivals.
            </p>
          </div>
          <div className="flex w-full md:w-auto max-w-md">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blinkit-green/50 transition-colors"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blinkit-green to-blinkit-green text-white font-semibold text-sm rounded-r-xl hover:shadow-lg hover:shadow-blinkit-green/20 transition-all whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blinkit-green to-blinkit-green rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-black text-lg">Q</span>
              </div>
              <h2 className="text-xl font-extrabold">
                Quick<span className="text-blinkit-green">DROP</span>
              </h2>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-xs">
              India's fastest delivery app. Get groceries, fresh fruits &
              vegetables, and more delivered to your doorstep in minutes.
            </p>

            {/* Social Links */}
            <div className="flex gap-2.5">
              {[
                {
                  label: "Facebook",
                  icon:
                    "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
                },
                {
                  label: "Twitter",
                  icon:
                    "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
                },
                {
                  label: "Instagram",
                  icon:
                    "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 2h11A4.5 4.5 0 0122 6.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z",
                },
                {
                  label: "LinkedIn",
                  icon:
                    "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-9 h-9 bg-white/8 rounded-lg flex items-center justify-center hover:bg-blinkit-green hover:scale-110 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d={social.icon}
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link Groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-blinkit-green mb-4">
                {group.title}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-400 text-sm hover:text-white hover:pl-1 transition-all duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 text-xs">
            © 2026 QuickDROP. Built with ❤️ for learning purposes.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </>
  );

  if (isHome) {
    return (
      <footer className="bg-blinkit-dark text-white mt-auto footer-dark">
        {footerContent}
      </footer>
    );
  }

  if (!expanded) {
    return (
      <div className="mt-auto">
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-blinkit-dark text-white border-t border-white/10 footer-dark">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blinkit-green to-blinkit-green rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm">Q</span>
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">QuickDROP</p>
                <p className="text-[11px] text-white/70">Apni Dukan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="px-3 py-1.5 rounded-lg bg-white text-blinkit-dark text-xs font-semibold hover:bg-gray-100 transition-colors"
            >
              Expand
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto">
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => setExpanded(false)}
      />
      <footer className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto bg-blinkit-dark text-white footer-dark">
        <div className="sticky top-0 bg-blinkit-dark/95 backdrop-blur border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blinkit-green to-blinkit-green rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm">Q</span>
              </div>
              <span className="text-sm font-semibold">QuickDROP Footer</span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>
        {footerContent}
      </footer>
    </div>
  );
};

export default Footer;
