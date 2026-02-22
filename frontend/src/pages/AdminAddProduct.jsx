import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../component/Layout/Navbar";
import Footer from "../component/Layout/Footer";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";

const AdminAddProduct = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    brand: "",
    stocks: "",
    discount: "",
    categoryId: "",
    subCategoryId: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  const isAdmin = user?.role === "admin";

  const selectedCategory = useMemo(() => form.categoryId, [form.categoryId]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await adminService.getCategories();
        setCategories(response.payload || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isAuthenticated && isAdmin) {
      fetchCategories();
    } else {
      setLoadingCategories(false);
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedCategory) {
        setSubCategories([]);
        return;
      }
      try {
        setLoadingSubCategories(true);
        const response = await adminService.getSubCategories(selectedCategory);
        setSubCategories(response.payload || []);
      } catch (error) {
        if (error.response?.status === 404) {
          setSubCategories([]);
        } else {
          toast.error(
            error.response?.data?.message || "Failed to load subcategories",
          );
        }
      } finally {
        setLoadingSubCategories(false);
      }
    };

    if (isAuthenticated && isAdmin) {
      fetchSubCategories();
    }
  }, [isAuthenticated, isAdmin, selectedCategory]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!imageFile) {
      toast.error("Product image is required");
      return;
    }
    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("price", form.price);
    formData.append("brand", form.brand.trim());
    formData.append("stocks", form.stocks);
    if (form.discount !== "") {
      formData.append("discount", form.discount);
    }
    formData.append("category", form.categoryId);
    if (form.subCategoryId) {
      formData.append("subCategory", form.subCategoryId);
    }
    formData.append("images", imageFile);

    try {
      setSubmitting(true);
      await adminService.addProduct(formData);
      toast.success("Product added successfully");
      setForm({
        name: "",
        description: "",
        price: "",
        brand: "",
        stocks: "",
        discount: "",
        categoryId: "",
        subCategoryId: "",
      });
      setImageFile(null);
      setSubCategories([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blinkit-dark">Admin: Add Product</h1>
            <p className="text-sm text-blinkit-gray mt-1">
              Add new products to the catalog using the admin route.
            </p>
          </div>
          <Link
            to="/admin/products"
            className="text-sm font-semibold text-blinkit-green hover:underline"
          >
            View products
          </Link>
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
            <Link
              to="/login"
              className="inline-flex mt-4 px-5 py-2 rounded-xl bg-blinkit-green text-white font-semibold"
            >
              Go to Login
            </Link>
          </div>
        ) : !isAdmin ? (
          <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
            <h2 className="text-lg font-bold text-blinkit-dark">Admin access only</h2>
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
                <label className="text-sm font-semibold text-blinkit-dark">Product Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="Fresh Apples"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">Brand</label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="Nature Farm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-blinkit-dark">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={3}
                className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                placeholder="Crisp, juicy apples delivered fresh."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">Price</label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="99"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">Stocks</label>
                <input
                  name="stocks"
                  type="number"
                  min="0"
                  value={form.stocks}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">Discount (%)</label>
                <input
                  name="discount"
                  type="number"
                  min="0"
                  value={form.discount}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">Product Image</label>
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="mt-2 w-full text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">Category</label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryId: event.target.value,
                      subCategoryId: "",
                    }))
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                >
                  <option value="">
                    {loadingCategories ? "Loading categories..." : "Select a category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category?._id || category?.id} value={category?._id || category?.id}>
                      {category?.name || "Unnamed category"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-blinkit-dark">Subcategory</label>
                <select
                  name="subCategoryId"
                  value={form.subCategoryId}
                  onChange={handleChange}
                  disabled={!form.categoryId || loadingSubCategories}
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">
                    {!form.categoryId
                      ? "Select a category first"
                      : loadingSubCategories
                        ? "Loading subcategories..."
                        : subCategories.length > 0
                          ? "Select a subcategory (optional)"
                          : "No subcategories found"}
                  </option>
                  {subCategories.map((sub) => (
                    <option key={sub?._id || sub?.id} value={sub?._id || sub?.id}>
                      {sub?.name || "Unnamed subcategory"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    name: "",
                    description: "",
                    price: "",
                    brand: "",
                    stocks: "",
                    discount: "",
                    categoryId: "",
                    subCategoryId: "",
                  });
                  setSubCategories([]);
                  setImageFile(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blinkit-green text-white font-semibold hover:bg-blinkit-green-dark transition-colors disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminAddProduct;
