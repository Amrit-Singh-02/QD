import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../component/Layout/Navbar";
import Footer from "../component/Layout/Footer";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";

const AdminCreateDeliveryAgent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    aadharNumber: "",
    profileImage: null,
    age: "",
    bikeName: "",
    bikeNumber: "",
    pincode: "",
    deliveryAreas: "",
  });

  const isAdmin = user?.role === "admin";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, profileImage: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password ||
      !form.address.trim() ||
      !form.aadharNumber.trim() ||
      !form.age ||
      !form.bikeName.trim() ||
      !form.bikeNumber.trim()
    ) {
      toast.error(
        "Name, email, phone, password, address, Aadhar number, age, bike name, and bike number are required.",
      );
      return;
    }

    const parsedAge = Number(form.age);
    if (!Number.isFinite(parsedAge) || parsedAge < 18) {
      toast.error("Please enter a valid age (18+).");
      return;
    }

    const parseList = (value) =>
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("email", form.email.trim());
    payload.append("phone", form.phone.trim());
    payload.append("password", form.password);
    payload.append("address", form.address.trim());
    payload.append("aadharNumber", form.aadharNumber.trim());
    payload.append("age", String(parsedAge));
    payload.append("bikeName", form.bikeName.trim());
    payload.append("bikeNumber", form.bikeNumber.trim());

    if (form.profileImage) {
      payload.append("profileImage", form.profileImage);
    }

    const deliveryPincodes = form.pincode.trim()
      ? parseList(form.pincode)
      : [];
    if (deliveryPincodes.length) {
      deliveryPincodes.forEach((code) =>
        payload.append("deliveryPincodes", code),
      );
      payload.append("pincode", deliveryPincodes[0]);
    }

    const deliveryAreas = form.deliveryAreas.trim()
      ? parseList(form.deliveryAreas)
      : [];
    if (deliveryAreas.length) {
      deliveryAreas.forEach((area) => payload.append("deliveryAreas", area));
    }

    try {
      setSubmitting(true);
      await adminService.createDeliveryAgent(payload);
      toast.success("Delivery agent created successfully");
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        aadharNumber: "",
        profileImage: null,
        age: "",
        bikeName: "",
        bikeNumber: "",
        pincode: "",
        deliveryAreas: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blinkit-dark">
              Admin: Create Delivery Agent
            </h1>
            <p className="text-sm text-blinkit-gray mt-1">
              Create a new delivery agent (admin only).
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-sm font-semibold text-blinkit-green hover:underline"
          >
            View orders
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto" />
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
            <h2 className="text-lg font-bold text-blinkit-dark">
              Login required
            </h2>
            <p className="text-sm text-blinkit-gray mt-2">
              Please log in with an admin account to access this page.
            </p>
            <Link
              to="/login"
              className="inline-flex mt-4 px-5 py-2 rounded-xl bg-blinkit-green text-white font-semibold"
            >
              Go to Login
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
            <h2 className="text-lg font-bold text-blinkit-dark">
              Admin access only
            </h2>
            <p className="text-sm text-blinkit-gray mt-2">
              Your account does not have admin privileges.
            </p>
            <Link
              to="/"
              className="inline-flex mt-4 px-5 py-2 rounded-xl bg-blinkit-green text-white font-semibold"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-blinkit-border p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="Aman Singh"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="agent@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Phone
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Temporary Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="Set a temporary password"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-blinkit-dark">
                  Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="House no, street, city"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Aadhar Number
                </label>
                <input
                  name="aadharNumber"
                  value={form.aadharNumber}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="1234 5678 9012"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Age
                </label>
                <input
                  name="age"
                  type="number"
                  min="18"
                  value={form.age}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="23"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Bike Name
                </label>
                <input
                  name="bikeName"
                  value={form.bikeName}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="Honda Activa"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Bike Number
                </label>
                <input
                  name="bikeNumber"
                  value={form.bikeNumber}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="PB10AB1234"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-blinkit-dark">
                  Profile Image (optional)
                </label>
                <input
                  name="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Delivery Pincode(s)
                </label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="560001, 560002"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">
                  Delivery Area(s)
                </label>
                <input
                  name="deliveryAreas"
                  value={form.deliveryAreas}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="Royal City Colony, Downtown"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                    address: "",
                    aadharNumber: "",
                    profileImage: null,
                    age: "",
                    bikeName: "",
                    bikeNumber: "",
                    pincode: "",
                    deliveryAreas: "",
                  })
                }
                className="px-5 py-2.5 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blinkit-green text-white font-semibold hover:bg-blinkit-green-dark transition-colors disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminCreateDeliveryAgent;
