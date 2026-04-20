import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../component/Layout/Navbar";
import PantryOSSidebar from "../component/Layout/PantryOSSidebar";
import { usePantry } from "../context/PantryContext";

const PantryOSPage = () => {
  const { expiringItems } = usePantry();
  const expiringCount = expiringItems.length || 0;

  return (
    <div className="min-h-screen bg-blinkit-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <PantryOSSidebar expiringCount={expiringCount} />
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PantryOSPage;
