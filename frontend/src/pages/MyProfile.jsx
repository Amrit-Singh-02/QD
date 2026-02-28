import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';
import toast from 'react-hot-toast';

const MyProfile = () => {
  const { user, checkAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [adminAgents, setAdminAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [agentForm, setAgentForm] = useState(null);
  const [agentUpdating, setAgentUpdating] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await authService.updateProfile(formData);
      toast.success('Profile updated successfully');
      checkAuth(); // Refresh user data
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await authService.updatePassword({ password: passwordData.password });
      toast.success('Password changed successfully');
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleFetchUsers = async () => {
    if (!isAdmin) return;
    try {
      setUsersLoading(true);
      const response = await adminService.getAllUsers();
      setAdminUsers(response?.payload || []);
      setUsersLoaded(true);
      toast.success('Fetched users successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleFetchAgents = async () => {
    if (!isAdmin) return;
    try {
      setAgentsLoading(true);
      const response = await adminService.getAllAgents();
      setAdminAgents(response?.payload || []);
      setAgentsLoaded(true);
      toast.success('Fetched agents successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch agents');
    } finally {
      setAgentsLoading(false);
    }
  };

  const startEditAgent = (agent) => {
    if (!agent) return;
    const id = agent?.id || agent?._id;
    setEditingAgentId(id);
    setAgentForm({
      name: agent?.name || '',
      email: agent?.email || '',
      phone: agent?.phone || '',
      address: agent?.address || '',
      aadharNumber: agent?.aadharNumber || '',
      age: agent?.age || '',
      bikeName: agent?.bikeName || '',
      bikeNumber: agent?.bikeNumber || '',
      pincode: agent?.pincode || '',
      deliveryPincodes: (agent?.deliveryPincodes || []).join(', '),
      deliveryAreas: (agent?.deliveryAreas || []).join(', '),
      profileImage: null,
    });
  };

  const cancelEditAgent = () => {
    setEditingAgentId(null);
    setAgentForm(null);
  };

  const handleAgentFieldChange = (event) => {
    const { name, value } = event.target;
    setAgentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgentFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAgentForm((prev) => ({ ...prev, profileImage: file }));
  };

  const handleUpdateAgent = async (agentId) => {
    if (!agentForm || !agentId) return;
    try {
      setAgentUpdating(true);
      const formData = new FormData();
      formData.append('name', agentForm.name || '');
      formData.append('email', agentForm.email || '');
      formData.append('phone', agentForm.phone || '');
      formData.append('address', agentForm.address || '');
      formData.append('aadharNumber', agentForm.aadharNumber || '');
      formData.append('age', agentForm.age ? String(agentForm.age) : '');
      formData.append('bikeName', agentForm.bikeName || '');
      formData.append('bikeNumber', agentForm.bikeNumber || '');
      formData.append('pincode', agentForm.pincode || '');
      formData.append('deliveryPincodes', agentForm.deliveryPincodes || '');
      formData.append('deliveryAreas', agentForm.deliveryAreas || '');
      if (agentForm.profileImage) {
        formData.append('profileImage', agentForm.profileImage);
      }

      const response = await adminService.updateDeliveryAgent(agentId, formData);
      const updatedAgent = response?.payload;
      setAdminAgents((prev) =>
        prev.map((agent) => {
          const id = agent?.id || agent?._id;
          if (String(id) !== String(agentId)) return agent;
          return updatedAgent || agent;
        }),
      );
      toast.success('Agent updated successfully');
      cancelEditAgent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update agent');
    } finally {
      setAgentUpdating(false);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!agentId) return;
    const confirmed = window.confirm('Delete this delivery agent?');
    if (!confirmed) return;
    try {
      await adminService.deleteDeliveryAgent(agentId);
      setAdminAgents((prev) =>
        prev.filter(
          (agent) => String(agent?.id || agent?._id) !== String(agentId),
        ),
      );
      toast.success('Agent deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete agent');
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-blinkit-dark mb-6">My Profile</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-blinkit-border p-6 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-blinkit-dark">Personal Information</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-blinkit-green text-sm font-semibold hover:underline"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs text-blinkit-gray mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blinkit-gray mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blinkit-green text-white font-bold py-2 rounded-lg hover:bg-blinkit-green-dark transition-colors"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blinkit-light-gray rounded-full flex items-center justify-center text-2xl font-bold text-blinkit-gray">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-blinkit-dark">{user?.name}</h3>
                    <p className="text-sm text-blinkit-gray">{user?.email}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${user?.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user?.isVerified ? 'VERIFIED' : 'NOT VERIFIED'}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-blinkit-border pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blinkit-gray">Phone Number</p>
                      <p className="text-sm font-medium text-blinkit-dark">{user?.phone || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blinkit-gray">Joined On</p>
                      <p className="text-sm font-medium text-blinkit-dark">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-xl shadow-sm border border-blinkit-border p-6 h-fit">
            <h2 className="text-lg font-bold text-blinkit-dark mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs text-blinkit-gray mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-blinkit-gray mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-white border border-blinkit-green text-blinkit-green font-bold py-2 rounded-lg hover:bg-green-50 transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-blinkit-border p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-blinkit-dark">Admin: All Users</h2>
                <p className="text-sm text-blinkit-gray">
                  View user details, addresses, and orders.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchUsers}
                disabled={usersLoading}
                className="px-4 py-2 rounded-lg bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark disabled:opacity-60"
              >
                {usersLoading ? 'Loading...' : 'Fetch Users'}
              </button>
            </div>

            {!usersLoaded ? (
              <p className="text-sm text-blinkit-gray">
                Click "Fetch Users" to load the user list.
              </p>
            ) : adminUsers.length === 0 ? (
              <p className="text-sm text-blinkit-gray">No users found.</p>
            ) : (
              <div className="space-y-4">
                {adminUsers.map((adminUser) => {
                  const userId = adminUser?.id || adminUser?._id;
                  const addresses = adminUser?.addresses || [];
                  const orders = adminUser?.orders || [];
                  return (
                    <div
                      key={userId}
                      className="border border-blinkit-border rounded-xl p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                        <div>
                          <p className="font-semibold text-blinkit-dark text-base sm:text-lg">
                            {adminUser?.name || 'User'}
                          </p>
                          <p className="text-xs sm:text-sm text-blinkit-gray">
                            {adminUser?.email || 'No email'}
                          </p>
                          <p className="text-[10px] sm:text-xs text-blinkit-gray mt-1">
                            Phone: {adminUser?.phone || 'N/A'} · Role:{' '}
                            <span className="font-semibold text-blinkit-dark capitalize">{adminUser?.role || 'user'}</span>
                          </p>
                        </div>
                        <div className="text-[10px] sm:text-xs text-blinkit-gray font-medium">
                          Joined:{' '}
                          {adminUser?.createdAt
                            ? new Date(adminUser.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-blinkit-dark mb-2">
                            Addresses
                          </h3>
                          {addresses.length === 0 ? (
                            <p className="text-xs text-blinkit-gray">
                              No addresses saved.
                            </p>
                          ) : (
                            <div className="space-y-2 text-xs text-blinkit-gray">
                              {addresses.map((address) => (
                                <div
                                  key={address?._id || `${userId}-${address?.addressLine1}`}
                                  className="border border-blinkit-border rounded-lg p-2 bg-gray-50"
                                >
                                  <p className="font-semibold text-blinkit-dark">
                                    {address?.fullName || 'Address'}
                                  </p>
                                  <p>
                                    {address?.addressLine1 || ''}
                                    {address?.addressLine2
                                      ? `, ${address.addressLine2}`
                                      : ''}
                                  </p>
                                  <p>
                                    {address?.city || ''}, {address?.state || ''}{' '}
                                    {address?.pincode || address?.postalCode || ''}
                                  </p>
                                  <p>Phone: {address?.phone || 'N/A'}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-blinkit-dark mb-2">
                            Orders ({orders.length})
                          </h3>
                          {orders.length === 0 ? (
                            <p className="text-xs text-blinkit-gray">
                              No orders found.
                            </p>
                          ) : (
                            <div className="space-y-2 text-xs text-blinkit-gray max-h-48 overflow-y-auto pr-1">
                              {orders.map((order) => (
                                <div
                                  key={order?._id || order?.id}
                                  className="border border-blinkit-border rounded-lg p-2"
                                >
                                  <p className="font-semibold text-blinkit-dark">
                                    Order #{String(order?._id || order?.id || '')
                                      .slice(-6)
                                      .toUpperCase()}
                                  </p>
                                  <p>
                                    Status:{' '}
                                    <span className="font-semibold">
                                      {order?.orderStatus || 'N/A'}
                                    </span>
                                  </p>
                                  <p>
                                    Total: {"\u20B9"}{order?.totalAmount || 0}
                                  </p>
                                  <p>
                                    Items: {order?.items?.length || 0}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-blinkit-border p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-blinkit-dark">Admin: Delivery Agents</h2>
                <p className="text-sm text-blinkit-gray">
                  View, edit, and delete delivery agents.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchAgents}
                disabled={agentsLoading}
                className="px-4 py-2 rounded-lg bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark disabled:opacity-60"
              >
                {agentsLoading ? 'Loading...' : 'Fetch Agents'}
              </button>
            </div>

            {!agentsLoaded ? (
              <p className="text-sm text-blinkit-gray">
                Click "Fetch Agents" to load the agent list.
              </p>
            ) : adminAgents.length === 0 ? (
              <p className="text-sm text-blinkit-gray">No agents found.</p>
            ) : (
              <div className="space-y-4">
                {adminAgents.map((agent) => {
                  const agentId = agent?.id || agent?._id;
                  const deliveredOrders = agent?.deliveredOrders || [];
                  const isEditingAgent = String(editingAgentId) === String(agentId);
                  return (
                    <div
                      key={agentId}
                      className="border border-blinkit-border rounded-xl p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div>
                          <p className="font-semibold text-blinkit-dark text-base sm:text-lg">
                            {agent?.name || 'Delivery Agent'}
                          </p>
                          <p className="text-xs sm:text-sm text-blinkit-gray">
                            {agent?.email || 'No email'}
                          </p>
                          <p className="text-[10px] sm:text-xs text-blinkit-gray mt-1">
                            Phone: {agent?.phone || 'N/A'} - Pincode:{' '}
                            <span className="font-semibold">{agent?.pincode || 'N/A'}</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() =>
                              isEditingAgent ? cancelEditAgent() : startEditAgent(agent)
                            }
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg border border-blinkit-border text-xs sm:text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                          >
                            {isEditingAgent ? 'Cancel' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAgent(agentId)}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg border border-red-200 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {isEditingAgent && agentForm ? (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <input
                            name="name"
                            value={agentForm.name}
                            onChange={handleAgentFieldChange}
                            placeholder="Full name"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="email"
                            value={agentForm.email}
                            onChange={handleAgentFieldChange}
                            placeholder="Email"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="phone"
                            value={agentForm.phone}
                            onChange={handleAgentFieldChange}
                            placeholder="Phone"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="pincode"
                            value={agentForm.pincode}
                            onChange={handleAgentFieldChange}
                            placeholder="Primary pincode"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="address"
                            value={agentForm.address}
                            onChange={handleAgentFieldChange}
                            placeholder="Address"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2 md:col-span-2"
                          />
                          <input
                            name="aadharNumber"
                            value={agentForm.aadharNumber}
                            onChange={handleAgentFieldChange}
                            placeholder="Aadhar number"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="age"
                            type="number"
                            min="18"
                            value={agentForm.age}
                            onChange={handleAgentFieldChange}
                            placeholder="Age"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="bikeName"
                            value={agentForm.bikeName}
                            onChange={handleAgentFieldChange}
                            placeholder="Bike name"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="bikeNumber"
                            value={agentForm.bikeNumber}
                            onChange={handleAgentFieldChange}
                            placeholder="Bike number"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="deliveryPincodes"
                            value={agentForm.deliveryPincodes}
                            onChange={handleAgentFieldChange}
                            placeholder="Delivery pincodes (comma separated)"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="deliveryAreas"
                            value={agentForm.deliveryAreas}
                            onChange={handleAgentFieldChange}
                            placeholder="Delivery areas (comma separated)"
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2"
                          />
                          <input
                            name="profileImage"
                            type="file"
                            accept="image/*"
                            onChange={handleAgentFileChange}
                            className="w-full rounded-lg border border-blinkit-border px-3 py-2 md:col-span-2 text-xs sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blinkit-light-gray file:text-blinkit-dark hover:file:bg-gray-200"
                          />
                          <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-2 mt-2">
                            <button
                              type="button"
                              onClick={cancelEditAgent}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateAgent(agentId)}
                              disabled={agentUpdating}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark disabled:opacity-60 transition-colors"
                            >
                              {agentUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blinkit-gray">
                          <div className="space-y-1">
                            <p>
                              Address: <span className="font-semibold text-blinkit-dark">{agent?.address || 'N/A'}</span>
                            </p>
                            <p>
                              Aadhar: <span className="font-semibold text-blinkit-dark">{agent?.aadharNumber || 'N/A'}</span>
                            </p>
                            <p>
                              Age: <span className="font-semibold text-blinkit-dark">{agent?.age || 'N/A'}</span>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p>
                              Bike: <span className="font-semibold text-blinkit-dark">{agent?.bikeName || 'N/A'}</span>
                            </p>
                            <p>
                              Bike No: <span className="font-semibold text-blinkit-dark">{agent?.bikeNumber || 'N/A'}</span>
                            </p>
                            <p>
                              Delivery Areas: <span className="font-semibold text-blinkit-dark">{(agent?.deliveryAreas || []).join(', ') || 'N/A'}</span>
                            </p>
                            <p>
                              Delivery Pincodes: <span className="font-semibold text-blinkit-dark">{(agent?.deliveryPincodes || []).join(', ') || 'N/A'}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-blinkit-dark mb-2">
                          Delivered Orders ({deliveredOrders.length})
                        </h3>
                        {deliveredOrders.length === 0 ? (
                          <p className="text-xs text-blinkit-gray">No delivered orders.</p>
                        ) : (
                          <div className="space-y-2 text-xs text-blinkit-gray max-h-48 overflow-y-auto pr-1">
                            {deliveredOrders.map((order) => (
                              <div
                                key={order?._id || order?.id}
                                className="border border-blinkit-border rounded-lg p-2"
                              >
                                <p className="font-semibold text-blinkit-dark">
                                  Order #{String(order?._id || order?.id || '')
                                    .slice(-6)
                                    .toUpperCase()}
                                </p>
                                <p>
                                  Total: {"₹"}{order?.totalAmount || 0}
                                </p>
                                <p>
                                  Delivered:{' '}
                                  {order?.updatedAt
                                    ? new Date(order.updatedAt).toLocaleString()
                                    : 'N/A'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyProfile;
