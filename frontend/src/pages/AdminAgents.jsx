import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../component/Layout/Navbar";
import AdminSidebar from "../component/Layout/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";
import toast from "react-hot-toast";

const initialForm = {
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
};

const parseList = (value) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const AdminAgents = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [agents, setAgents] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isAdmin = user?.role === "admin";

  const loadAgents = async () => {
    try {
      setFetching(true);
      const response = await adminService.getAllAgents();
      setAgents(response?.payload || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch agents");
      setAgents([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAgents();
    } else {
      setFetching(false);
    }
  }, [isAuthenticated, isAdmin]);

  const stats = useMemo(() => {
    const total = agents.length;
    const online = agents.filter((agent) => agent?.isOnline).length;
    const available = agents.filter((agent) => agent?.isAvailable).length;
    const offline = total - online;
    return { total, online, offline, available };
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return agents.filter((agent) => {
      if (statusFilter === "online" && !agent?.isOnline) return false;
      if (statusFilter === "offline" && agent?.isOnline) return false;
      if (!needle) return true;
      const hay = [
        agent?.name,
        agent?.email,
        agent?.phone,
        agent?.pincode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [agents, search, statusFilter]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, profileImage: file }));
  };

  const startEdit = (agent) => {
    setEditingId(agent?.id || agent?._id);
    setForm({
      name: agent?.name || "",
      email: agent?.email || "",
      phone: agent?.phone || "",
      password: "",
      address: agent?.address || "",
      aadharNumber: agent?.aadharNumber || "",
      profileImage: null,
      age: agent?.age ? String(agent.age) : "",
      bikeName: agent?.bikeName || "",
      bikeNumber: agent?.bikeNumber || "",
      pincode: Array.isArray(agent?.deliveryPincodes)
        ? agent.deliveryPincodes.join(", ")
        : agent?.pincode || "",
      deliveryAreas: Array.isArray(agent?.deliveryAreas)
        ? agent.deliveryAreas.join(", ")
        : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = (isEdit) => {
    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("email", form.email.trim());
    payload.append("phone", form.phone.trim());
    if (!isEdit) payload.append("password", form.password);
    payload.append("address", form.address.trim());
    payload.append("aadharNumber", form.aadharNumber.trim());
    payload.append("bikeName", form.bikeName.trim());
    payload.append("bikeNumber", form.bikeNumber.trim());

    if (form.age !== "" || isEdit) {
      payload.append("age", form.age);
    }

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
    } else if (isEdit) {
      payload.append("deliveryPincodes", "");
      payload.append("pincode", "");
    }

    const deliveryAreas = form.deliveryAreas.trim()
      ? parseList(form.deliveryAreas)
      : [];
    if (deliveryAreas.length) {
      deliveryAreas.forEach((area) => payload.append("deliveryAreas", area));
    } else if (isEdit) {
      payload.append("deliveryAreas", "");
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      toast.error("Name, email, and phone are required.");
      return;
    }

    if (!editingId && !form.password) {
      toast.error("Password is required for new agents.");
      return;
    }

    if (form.age) {
      const parsedAge = Number(form.age);
      if (!Number.isFinite(parsedAge) || parsedAge < 18) {
        toast.error("Please enter a valid age (18+).");
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = buildPayload(Boolean(editingId));
      if (editingId) {
        await adminService.updateDeliveryAgent(editingId, payload);
        toast.success("Agent updated");
      } else {
        await adminService.createDeliveryAgent(payload);
        toast.success("Agent created");
      }
      resetForm();
      loadAgents();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save agent");
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (agent) => {
    const id = agent?.id || agent?._id;
    if (!id) return;
    setConfirmDelete({ id, name: agent?.name || "this agent" });
  };

  const handleDelete = async (agentId) => {
    try {
      setDeletingId(agentId);
      await adminService.deleteDeliveryAgent(agentId);
      toast.success("Agent deleted");
      if (editingId === agentId) resetForm();
      loadAgents();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete agent");
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDeleteAgent = async () => {
    if (!confirmDelete?.id) return;
    await handleDelete(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 pb-20 lg:pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blinkit-dark">Admin: Agents</h1>
              <p className="text-sm text-blinkit-gray mt-1">
                Track, create, edit, and manage delivery agents.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
            >
              New Agent
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto" />
            </div>
          ) : !isAuthenticated ? (
            <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
              <h2 className="text-lg font-bold text-blinkit-dark">Login required</h2>
              <p className="text-sm text-blinkit-gray mt-2">
                Please log in with an admin account to access this page.
              </p>
            </div>
          ) : !isAdmin ? (
            <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
              <h2 className="text-lg font-bold text-blinkit-dark">Admin access only</h2>
              <p className="text-sm text-blinkit-gray mt-2">
                Your account does not have admin privileges.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-blinkit-border p-5 space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-blinkit-dark">
                    {editingId ? "Edit Agent" : "Create Agent"}
                  </h2>
                  <p className="text-xs text-blinkit-gray mt-1">
                    {editingId
                      ? "Update agent profile details."
                      : "Create a new delivery agent account."}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Full Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="Aman Singh"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="agent@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="9876543210"
                    required
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="text-sm font-semibold text-blinkit-dark">Temporary Password</label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                      placeholder="Set a temporary password"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Address</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="House no, street, city"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-blinkit-dark">Aadhar Number</label>
                    <input
                      name="aadharNumber"
                      value={form.aadharNumber}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                      placeholder="1234 5678 9012"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blinkit-dark">Age</label>
                    <input
                      name="age"
                      type="number"
                      min="18"
                      value={form.age}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                      placeholder="23"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-blinkit-dark">Bike Name</label>
                    <input
                      name="bikeName"
                      value={form.bikeName}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                      placeholder="Honda Activa"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blinkit-dark">Bike Number</label>
                    <input
                      name="bikeNumber"
                      value={form.bikeNumber}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                      placeholder="PB10AB1234"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Profile Image</label>
                  <input
                    name="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Delivery Pincode(s)</label>
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="560001, 560002"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Delivery Area(s)</label>
                  <input
                    name="deliveryAreas"
                    value={form.deliveryAreas}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="Royal City Colony, Downtown"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors disabled:opacity-60"
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                      ? "Update Agent"
                      : "Create Agent"}
                  </button>
                </div>
              </form>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total", value: stats.total },
                    { label: "Online", value: stats.online },
                    { label: "Offline", value: stats.offline },
                    { label: "Available", value: stats.available },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white rounded-2xl border border-blinkit-border p-4"
                    >
                      <p className="text-xs text-blinkit-gray uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold text-blinkit-dark mt-1">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-blinkit-border p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search agents by name, email, phone..."
                    className="w-full md:w-2/3 rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-xl border border-blinkit-border px-3 py-2 text-sm font-semibold text-blinkit-dark"
                  >
                    <option value="all">All statuses</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {fetching ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-blinkit-border">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto" />
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
                    <p className="text-sm text-blinkit-gray">No agents found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAgents.map((agent) => {
                      const agentId = agent?.id || agent?._id;
                      const imageUrl =
                        agent?.profileImage?.url ||
                        agent?.profileImage?.url ||
                        agent?.profileImage ||
                        "https://placehold.co/120x120?text=Agent";
                      return (
                        <div
                          key={agentId}
                          className="bg-white rounded-2xl border border-blinkit-border p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-blinkit-border bg-blinkit-light-gray">
                              <img
                                src={imageUrl}
                                alt={agent?.name || "Agent"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src =
                                    "https://placehold.co/120x120?text=Agent";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-blinkit-dark truncate">
                                  {agent?.name || "Unnamed"}
                                </p>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    agent?.isOnline
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {agent?.isOnline ? "Online" : "Offline"}
                                </span>
                                {agent?.isAvailable && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                    Available
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-blinkit-gray mt-1 truncate">
                                {agent?.email || "No email"}
                              </p>
                              <p className="text-xs text-blinkit-gray">
                                {agent?.phone || "No phone"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-blinkit-gray">
                            <div>
                              <span className="font-semibold text-blinkit-dark">Pincode:</span>{" "}
                              {agent?.pincode || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold text-blinkit-dark">Bike:</span>{" "}
                              {agent?.bikeName || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold text-blinkit-dark">Rating:</span>{" "}
                              {agent?.rating ?? 0} ⭐
                            </div>
                            <div>
                              <span className="font-semibold text-blinkit-dark">Deliveries:</span>{" "}
                              {agent?.totalDeliveries ?? 0}
                            </div>
                            <div className="col-span-2">
                              <span className="font-semibold text-blinkit-dark">Areas:</span>{" "}
                              {Array.isArray(agent?.deliveryAreas) && agent.deliveryAreas.length
                                ? agent.deliveryAreas.join(", ")
                                : "N/A"}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              onClick={() => startEdit(agent)}
                              className="px-3 py-1.5 rounded-lg border border-blinkit-border text-xs font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => requestDelete(agent)}
                              disabled={deletingId === agentId}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                            >
                              {deletingId === agentId ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-blinkit-border p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.8A2 2 0 004.6 20h14.8a2 2 0 001.71-3.34l-7.4-12.8a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blinkit-dark">Delete agent?</h3>
                <p className="text-sm text-blinkit-gray mt-1">
                  Are you sure you want to delete "{confirmDelete.name}"? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAgent}
                disabled={deletingId === confirmDelete.id}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deletingId === confirmDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgents;
