import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../component/Layout/Navbar";
import Footer from "../component/Layout/Footer";
import { adminService } from "../services/adminService";
import { useAuth } from "../context/AuthContext";
import ConfirmationModal from "../component/UI/ConfirmationModal";

const AdminProducts = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [fetching, setFetching] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    stocks: "",
    discount: "",
  });

  const isAdmin = user?.role === "admin";

  const fetchProducts = async () => {
    try {
      setFetching(true);
      const response = await adminService.getProducts();
      setProducts(response.payload || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setProducts([]);
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch products");
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchProducts();
    } else {
      setFetching(false);
    }
  }, [isAuthenticated, isAdmin]);

  const openDelete = (product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product?.name || "",
      brand: product?.brand || "",
      description: product?.description || "",
      price: product?.price ?? "",
      stocks: product?.stocks ?? "",
      discount: product?.discount ?? "",
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();
    const productId = selectedProduct?.id || selectedProduct?._id;
    if (!productId) return;

    const payload = {
      name: editForm.name.trim(),
      brand: editForm.brand.trim(),
      description: editForm.description.trim(),
    };
    if (editForm.price !== "") payload.price = Number(editForm.price);
    if (editForm.stocks !== "") payload.stocks = Number(editForm.stocks);
    if (editForm.discount !== "") payload.discount = Number(editForm.discount);

    try {
      const response = await adminService.updateProduct(productId, payload);
      const updated = response?.payload;
      setProducts((prev) =>
        prev.map((product) => {
          const id = product?.id || product?._id;
          if (id !== productId) return product;
          return {
            ...product,
            ...updated,
          };
        }),
      );
      toast.success("Product updated successfully");
      setIsEditOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update product");
    }
  };

  const handleDeleteProduct = async () => {
    const productId = selectedProduct?.id || selectedProduct?._id;
    if (!productId) return;

    try {
      await adminService.deleteProduct(productId);
      setProducts((prev) =>
        prev.filter((product) => (product?.id || product?._id) !== productId),
      );
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    }
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) => {
      const hay = `${product?.name || ""} ${product?.brand || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [products, query]);

  return (
    <div className="min-h-screen bg-blinkit-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blinkit-dark">Admin: Products</h1>
            <p className="text-sm text-blinkit-gray mt-1">
              Fetch and review products from the admin catalog.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/products/new"
              className="px-4 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors"
            >
              Add Product
            </Link>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
            >
              Refresh
            </button>
          </div>
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
          <>
            <div className="bg-white rounded-2xl border border-blinkit-border p-4 mb-6">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or brand..."
                className="w-full rounded-xl border border-blinkit-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
              />
            </div>

            {fetching ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-blinkit-border p-8 text-center">
                <h2 className="text-lg font-bold text-blinkit-dark">No products found</h2>
                <p className="text-sm text-blinkit-gray mt-2">
                  Try a different search term or add new products.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((product) => {
                  const imageUrl =
                    product?.images && product.images.length > 0
                      ? product.images[0].url
                      : "https://placehold.co/200x200?text=No+Image";
                  const stockLabel =
                    product?.stocks > 0 ? `${product.stocks} in stock` : "Out of stock";
                  const stockClass =
                    product?.stocks > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700";

                  return (
                    <div
                      key={product?.id || product?._id}
                      className="bg-white rounded-2xl border border-blinkit-border p-4 flex flex-col gap-4"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-xl bg-blinkit-light-gray flex items-center justify-center overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={product?.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blinkit-gray">{product?.brand || "Brand"}</p>
                          <h3 className="text-sm font-semibold text-blinkit-dark mt-1 line-clamp-2">
                            {product?.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-blinkit-dark">Rs {product?.price}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stockClass}`}>
                              {stockLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-blinkit-border pt-3">
                        <button
                          onClick={() => openEdit(product)}
                          className="px-3 py-1.5 rounded-lg border border-blinkit-border text-xs font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(product)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Do you want to delete ${selectedProduct?.name || "this product"}?`}
      />

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-blinkit-dark">Edit Product</h3>
                <p className="text-sm text-blinkit-gray">
                  Update product details. Image edits are handled separately.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-blinkit-gray hover:text-blinkit-dark"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Name</label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Brand</label>
                  <input
                    name="brand"
                    value={editForm.brand}
                    onChange={handleEditChange}
                    required
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-blinkit-dark">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={3}
                  required
                  className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Price</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.price}
                    onChange={handleEditChange}
                    required
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Stocks</label>
                  <input
                    name="stocks"
                    type="number"
                    min="0"
                    value={editForm.stocks}
                    onChange={handleEditChange}
                    required
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-blinkit-dark">Discount</label>
                  <input
                    name="discount"
                    type="number"
                    min="0"
                    value={editForm.discount}
                    onChange={handleEditChange}
                    className="mt-2 w-full rounded-xl border border-blinkit-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blinkit-green/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-blinkit-border text-sm font-semibold text-blinkit-dark hover:bg-blinkit-light-gray transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blinkit-green text-white text-sm font-semibold hover:bg-blinkit-green-dark transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
