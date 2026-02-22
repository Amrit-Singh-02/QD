import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-blinkit-dark text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blinkit-green rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">B</span>
              </div>
              <h2 className="text-xl font-extrabold">
                blink<span className="text-blinkit-green">it</span>
              </h2>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              India's last minute delivery app. Get groceries, 
              fresh fruits & vegetables, and more delivered to your 
              doorstep in minutes.
            </p>
            <div className="flex gap-3">
              {['M7 16c.6 0 1-.4 1-1V9c0-.6-.4-1-1-1H1c-.6 0-1 .4-1 1v6c0 .6.4 1 1 1zM20 16c.6 0 1-.4 1-1V9c0-.6-.4-1-1-1h-6c-.6 0-1 .4-1 1v6c0 .6.4 1 1 1z',
                'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
                'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 2h11A4.5 4.5 0 0122 6.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z'
              ].map((d, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blinkit-green transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blinkit-green mb-4">
              Useful Links
            </h3>
            <ul className="space-y-2.5">
              {['About Us', 'Careers', 'Blog', 'Press', 'Contact Us'].map(link => (
                <li key={link}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blinkit-green mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {['Fruits & Vegetables', 'Dairy & Bakery', 'Snacks & Beverages', 'Staples', 'Personal Care'].map(link => (
                <li key={link}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blinkit-green mb-4">
              Support
            </h3>
            <ul className="space-y-2.5">
              {['FAQ', 'Privacy Policy', 'Terms of Service', 'Returns Policy', 'Partner with us'].map(link => (
                <li key={link}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 text-xs">
            © 2026 blinkit clone. Built with ❤️ for learning purposes.
          </p>
          <p className="text-gray-500 text-xs">
            Not affiliated with Blinkit / Zomato.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
