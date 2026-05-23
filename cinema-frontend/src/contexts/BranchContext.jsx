import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../utils/api";

const BranchContext = createContext(null);
const STORAGE_KEY = "cinema_selected_branch_id";

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get("/public/branches")
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setBranches(list);
        const current = selectedBranchId ? list.find((b) => Number(b.id) === Number(selectedBranchId)) : null;
        if (!current && list.length > 0) {
          setSelectedBranchId(Number(list[0].id));
          localStorage.setItem(STORAGE_KEY, String(list[0].id));
        }
      })
      .catch((err) => console.error("Branch fetch error:", err))
      .finally(() => mounted && setLoadingBranches(false));
    return () => { mounted = false; };
  }, []);

  const selectedBranch = useMemo(
    () => branches.find((b) => Number(b.id) === Number(selectedBranchId)) || null,
    [branches, selectedBranchId],
  );

  const changeBranch = (branchId) => {
    const nextId = Number(branchId);
    setSelectedBranchId(nextId);
    localStorage.setItem(STORAGE_KEY, String(nextId));
  };

  const value = {
    branches,
    selectedBranch,
    selectedBranchId,
    loadingBranches,
    changeBranch,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
};
