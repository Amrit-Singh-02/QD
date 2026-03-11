import React, { useEffect, useMemo, useState } from "react";
import Navbar from '../component/Layout/Navbar';
import AdminSidebar from "../component/Layout/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";
import toast from "react-hot-toast";

const AdminCategories = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [search, setSearch] = useState("");

  const isAdmin = user?.role === "admin";

  const loadCategories = async () => {
    try {
      setFetching(true);
      const response = await adminService.getCategories();
      setCategories(response?.payload || []);
    } catch (error) {
      if (error?.response?.status === 404) {
        setCategories([]);
      } else {
        toast.error(error?.response?.data?.message || "Failed to fetch categories");
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadCategories();
    } else {
      setFetching(false);
    }
  }, [isAuthenticated, isAdmin]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((cat) =>
      String(cat?.name || "").toLowerCase().includes(needle),
    );
  }, [categories, search]);

  const resetForm = () => {
    setName("");
    setImageFile(null);
    setEditing(null);
  };

  const handleDelete = async (categoryId) => {
    try {
      setDeletingId(categoryId);
      await adminService.deleteCategory(categoryId);
      toast.success("Category deleted");
      if (editing === categoryId) {
        resetForm();
      }
      loadCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  const requestDelete = (category) => {
    const id = category?._id || category?.id;
    if (!id) return;
    setConfirmDelete({ id, name: category?.name || "this category" });
  };

  const confirmDeleteCategory = async () => {
    if (!confirmDelete?.id) return;
    await handleDelete(confirmDelete.id);
    setConfirmDelete(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!editing && !imageFile) {
      toast.error("Category image is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    if (imageFile) formData.append("image", imageFile);

    try {
      setSubmitting(true);
      if (editing) {
        await adminService.updateCategory(editing, formData);
        toast.success("Category updated");
      } else {
        await adminService.addCategory(formData);
        toast.success("Category added");
      }
      resetForm();
      loadCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 pb-20 lg:pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blinkit-dark">Admin: Categories</h1>
              <p className="text-sm text-blinkit-gray mt-1">
                Add, edit, and manage product categories.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
            >
              New Category
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
                    {editing ? "Edit Category" : "Add Category"}
                  </h2>
                  <p className="text-xs text-blinkit-gray mt-1">
                    Upload an icon image and set a display name.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Category Name</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                    placeholder="Fresh Vegetables"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Category Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className="mt-2 w-full text-sm"
                  />
                  <p className="text-xs text-blinkit-gray mt-1">
                    {editing ? "Leave empty to keep the current image." : "Required for new categories."}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors disabled:opacity-60"
                >
                  {submitting ? "Saving..." : editing ? "Update Category" : "Add Category"}
                </button>
              </form>

              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl border border-blinkit-border p-4">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search categories..."
                    className="w-full rounded-xl border border-blinkit-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>

                {fetching ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-blinkit-border">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
                    <p className="text-sm text-blinkit-gray">No categories found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((category) => {
                      const id = category?._id || category?.id;
                      return (
                        <div
                          key={id}
                          className="bg-white rounded-2xl border border-blinkit-border p-4 flex items-center gap-4"
                        >
                          <div className="w-14 h-14 rounded-xl bg-blinkit-light-gray overflow-hidden flex items-center justify-center border border-blinkit-border">
                            {category?.image ? (
                              <img
                                src={category.image}
                                alt={category?.name || "Category"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-blinkit-gray">No Image</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-blinkit-dark truncate">
                              {category?.name || "Unnamed category"}
                            </p>
                            <p className="text-xs text-blinkit-gray mt-1">
                              ID: {String(id).slice(-6).toUpperCase()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditing(id);
                                setName(category?.name || "");
                                setImageFile(null);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-3 py-1.5 rounded-lg border border-blinkit-border text-xs font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => requestDelete(category)}
                              disabled={deletingId === id}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                            >
                              {deletingId === id ? "Deleting..." : "Delete"}
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
                <h3 className="text-lg font-bold text-blinkit-dark">Delete category?</h3>
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
                onClick={confirmDeleteCategory}
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

export default AdminCategories;






