import React, { useState, useEffect } from 'react';
import Navbar from '../component/Layout/Navbar';
import Footer from '../component/Layout/Footer';
import { userService } from '../services/userService';
import { locationService } from '../services/locationService';
import toast from 'react-hot-toast';

const MyAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [cityLookupError, setCityLookupError] = useState('');
  const [stateLookupError, setStateLookupError] = useState('');
  const [cityLookupLoading, setCityLookupLoading] = useState(false);
  const [stateLookupLoading, setStateLookupLoading] = useState(false);

  const initialFormState = {
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    type: 'home',
    isDefault: false
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (!isAddingMode) return;
    const query = formData.city.trim();
    if (query.length < 2) {
      setCitySuggestions([]);
      setCityLookupError('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCityLookupLoading(true);
      setCityLookupError('');
      try {
        const results = await locationService.autoSuggest(query);
        if (cancelled) return;
        const cities = Array.from(
          new Set(results.map((item) => item.city).filter(Boolean)),
        );
        setCitySuggestions(cities);
      } catch (error) {
        if (cancelled) return;
        setCitySuggestions([]);
        setCityLookupError(
          error.response?.data?.message || error.message || 'Unable to fetch city suggestions',
        );
      } finally {
        if (!cancelled) {
          setCityLookupLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.city, isAddingMode]);

  useEffect(() => {
    if (!isAddingMode) return;
    const query = formData.state.trim();
    if (query.length < 2) {
      setStateSuggestions([]);
      setStateLookupError('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setStateLookupLoading(true);
      setStateLookupError('');
      try {
        const results = await locationService.autoSuggest(query);
        if (cancelled) return;
        const states = Array.from(
          new Set(results.map((item) => item.state).filter(Boolean)),
        );
        setStateSuggestions(states);
      } catch (error) {
        if (cancelled) return;
        setStateSuggestions([]);
        setStateLookupError(
          error.response?.data?.message || error.message || 'Unable to fetch state suggestions',
        );
      } finally {
        if (!cancelled) {
          setStateLookupLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.state, isAddingMode]);

  const fetchAddresses = async () => {
    try {
      const response = await userService.getMyAddresses();
      setAddresses(response.payload || []);
    } catch (error) {
      toast.error('Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await userService.updateAddress(editingId, formData);
        toast.success('Address updated successfully');
      } else {
        await userService.addAddress(formData);
        toast.success('Address added successfully');
      }
      resetForm();
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleEdit = (address) => {
    setFormData(address);
    setEditingId(address._id);
    setIsAddingMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await userService.deleteAddress(id);
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    }
  };

  const resetForm = () => {
    setIsAddingMode(false);
    setEditingId(null);
    setFormData(initialFormState);
    setCitySuggestions([]);
    setStateSuggestions([]);
    setCityLookupError('');
    setStateLookupError('');
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blinkit-dark">My Addresses</h1>
          {!isAddingMode && (
            <button 
              onClick={() => setIsAddingMode(true)}
              className="bg-blinkit-green text-white font-bold py-2 px-4 rounded-lg hover:bg-blinkit-green-dark transition-colors shadow-sm text-sm"
            >
              + Add New Address
            </button>
          )}
        </div>

        {isAddingMode && (
          <div className="bg-white rounded-xl shadow-sm border border-blinkit-border p-6 mb-8 animate-fade-in-up">
            <h2 className="text-lg font-bold text-blinkit-dark mb-4">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                required
              />
              <input
                type="text"
                name="addressLine1"
                placeholder="House No, Building, Street"
                value={formData.addressLine1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green md:col-span-2"
                required
              />
              <input
                type="text"
                name="addressLine2"
                placeholder="Area, Colony (Optional)"
                value={formData.addressLine2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green md:col-span-2"
              />
              <div className="relative">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                  required
                />
                {cityLookupLoading && (
                  <p className="text-[11px] text-blinkit-gray mt-1">Searching cities...</p>
                )}
                {cityLookupError && (
                  <p className="text-[11px] text-red-500 mt-1">{cityLookupError}</p>
                )}
                {citySuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full max-h-40 overflow-y-auto rounded-lg border border-blinkit-border bg-white shadow-lg">
                    {citySuggestions.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, city }));
                          setCitySuggestions([]);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blinkit-light-gray"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                  required
                />
                {stateLookupLoading && (
                  <p className="text-[11px] text-blinkit-gray mt-1">Searching states...</p>
                )}
                {stateLookupError && (
                  <p className="text-[11px] text-red-500 mt-1">{stateLookupError}</p>
                )}
                {stateSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full max-h-40 overflow-y-auto rounded-lg border border-blinkit-border bg-white shadow-lg">
                    {stateSuggestions.map((state) => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, state }));
                          setStateSuggestions([]);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blinkit-light-gray"
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                name="postalCode"
                placeholder="Pincode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green"
                required
              />
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-blinkit-border rounded-lg text-sm focus:outline-none focus:border-blinkit-green bg-white"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
              
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  id="isDefault"
                  className="w-4 h-4 text-blinkit-green focus:ring-blinkit-green border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="text-sm text-blinkit-dark select-none">Make this my default address</label>
              </div>

              <div className="md:col-span-2 flex gap-3 mt-2">
                <button 
                  type="submit"
                  className="bg-blinkit-green text-white font-bold py-2 px-6 rounded-lg hover:bg-blinkit-green-dark transition-colors"
                >
                  Save Address
                </button>
                <button 
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 text-blinkit-dark font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto"></div>
          </div>
        ) : addresses.length === 0 && !isAddingMode ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-blinkit-border">
            <span className="text-6xl block mb-4">🏠</span>
            <h2 className="text-xl font-bold text-blinkit-dark mb-2">No addresses saved</h2>
            <p className="text-blinkit-gray mb-6">Add an address to make checkout faster.</p>
            <button 
              onClick={() => setIsAddingMode(true)}
              className="bg-blinkit-green text-white font-bold py-2 px-6 rounded-lg hover:bg-blinkit-green-dark transition-colors"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr._id} className="bg-white rounded-xl shadow-sm border border-blinkit-border p-5 relative group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                    ${addr.type === 'home' ? 'bg-blue-100 text-blue-700' : 
                      addr.type === 'work' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {addr.type}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-blinkit-green bg-green-50 px-2 py-0.5 rounded">DEFAULT</span>
                  )}
                </div>
                
                <h3 className="font-bold text-blinkit-dark mt-1">{addr.fullName}</h3>
                <p className="text-sm text-blinkit-gray mt-1 line-clamp-2">
                  {addr.addressLine1}, {addr.addressLine2 ? addr.addressLine2 + ', ' : ''}
                  {addr.city}, {addr.state} - {addr.pincode || addr.postalCode}
                </p>
                <p className="text-sm text-blinkit-dark font-medium mt-2">Phone: {addr.phone}</p>
                
                <div className="mt-4 pt-4 border-t border-blinkit-border flex gap-3">
                  <button 
                    onClick={() => handleEdit(addr)}
                    className="text-blinkit-green text-xs font-bold hover:underline"
                  >
                    EDIT
                  </button>
                  <button 
                    onClick={() => handleDelete(addr._id)}
                    className="text-red-600 text-xs font-bold hover:underline"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyAddresses;
