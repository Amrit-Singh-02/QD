import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { pantryOSService } from "../../services/pantryOSService";
import ExpiryChip from "../../component/Pantry/ExpiryChip";
import BarcodeScannerModal from "../../component/Pantry/BarcodeScannerModal";
import { usePantry } from "../../context/PantryContext";

const PantrySection = () => {
  const { refreshPantry } = usePantry();
  const [items, setItems] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", quantity: 1, unit: "piece" });
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [itemsRes, expiringRes] = await Promise.all([
        pantryOSService.getPantryItems(),
        pantryOSService.getExpiringItems(),
      ]);
      setItems(itemsRes?.payload || []);
      setExpiring(expiringRes?.payload || []);
      await refreshPantry();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalQty = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    [items],
  );

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await pantryOSService.addPantryItem(form);
    setForm({ name: "", quantity: 1, unit: "piece" });
    load();
  };

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category || "other"));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatch =
        activeCategory === "all" || (item.category || "other") === activeCategory;
      const text = `${item.name} ${item.category || ""}`.toLowerCase();
      const searchMatch = !search.trim() || text.includes(search.trim().toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [items, activeCategory, search]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-blinkit-dark">Pantry Tracker</h1>
          <p className="text-sm text-blinkit-gray mt-1">
            {items.length} items and {totalQty} total quantity
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pantry"
          className="rounded-xl border border-blinkit-border px-3 py-2 text-sm bg-white"
        />
      </div>

      <section className="mt-5 rounded-2xl border border-blinkit-border bg-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-sm font-bold text-blinkit-dark uppercase tracking-wider">Add item</h2>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="text-xs font-semibold text-blinkit-green border border-blinkit-green/40 rounded-xl px-3 py-2 hover:bg-blinkit-green/10"
          >
            Scan barcode
          </button>
        </div>
        <form onSubmit={addItem} className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Item name"
            className="rounded-xl border border-blinkit-border px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) || 1 }))}
            className="rounded-xl border border-blinkit-border px-3 py-2 text-sm"
          />
          <input
            value={form.unit}
            onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            className="rounded-xl border border-blinkit-border px-3 py-2 text-sm"
          />
          <button className="rounded-xl bg-blinkit-green text-white font-semibold text-sm px-4 py-2">
            Add
          </button>
        </form>
      </section>

      {expiring.length > 0 && (
        <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            {expiring.length} items expiring this week
          </p>
        </section>
      )}

      <section className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              activeCategory === cat
                ? "bg-blinkit-green text-white border-blinkit-green"
                : "bg-white border-blinkit-border text-blinkit-dark"
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-blinkit-border bg-white p-4">
        <h2 className="text-sm font-bold text-blinkit-dark uppercase tracking-wider">Expiring soon</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(expiring || []).map((item) => (
            <div key={item._id || item.id} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-sm font-semibold text-blinkit-dark">{item.name}</p>
              <p className="text-xs text-blinkit-gray">
                Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
          ))}
          {!loading && expiring.length === 0 && (
            <p className="text-sm text-blinkit-gray">No items expiring soon.</p>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-blinkit-border bg-white p-4">
        <h2 className="text-sm font-bold text-blinkit-dark uppercase tracking-wider">All pantry items</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(filteredItems || []).map((item) => (
            <div
              key={item._id || item.id}
              className="rounded-xl border border-blinkit-border px-3 py-2 flex items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-blinkit-dark">{item.name}</p>
                  <ExpiryChip expiryDate={item.expiryDate} />
                </div>
                <p className="text-xs text-blinkit-gray">
                  {item.quantity} {item.unit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => pantryOSService.usePantryItem(item._id || item.id).then(load)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-blinkit-border"
                >
                  Use 1
                </button>
                <button
                  onClick={() => pantryOSService.deletePantryItem(item._id || item.id).then(load)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {!loading && filteredItems.length === 0 && (
            <p className="text-sm text-blinkit-gray">No pantry items yet.</p>
          )}
        </div>
      </section>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDecoded={async (code) => {
          try {
            await pantryOSService.scanBarcode(code, form.quantity || 1);
            toast.success("Added from barcode");
            setScannerOpen(false);
            load();
          } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Scan failed";
            toast.error(msg);
          }
        }}
      />
    </>
  );
};

export default PantrySection;
