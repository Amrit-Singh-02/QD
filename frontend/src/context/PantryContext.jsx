import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { pantryOSService } from "../services/pantryOSService";

const PantryContext = createContext(null);

export const PantryProvider = ({ children }) => {
  const [pantryItems, setPantryItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshPantry = useCallback(async () => {
    setLoading(true);
    try {
      const [items, expiring] = await Promise.all([
        pantryOSService.getPantryItems(),
        pantryOSService.getExpiringItems(),
      ]);
      setPantryItems(items?.payload || []);
      setExpiringItems(expiring?.payload || []);
    } catch {
      setPantryItems([]);
      setExpiringItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPantry();
  }, [refreshPantry]);

  const value = useMemo(
    () => ({ pantryItems, expiringItems, loading, refreshPantry }),
    [pantryItems, expiringItems, loading, refreshPantry],
  );
  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
};

export const usePantry = () => {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error("usePantry must be used within PantryProvider");
  return ctx;
};
