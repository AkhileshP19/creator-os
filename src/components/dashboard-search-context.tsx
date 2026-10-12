"use client";

import { createContext, ReactNode, useContext, useState } from "react";

interface DashboardSearchContextValue {
  search: string;
  setSearch: (search: string) => void;
}

const DashboardSearchContext = createContext<DashboardSearchContextValue | undefined>(
  undefined,
);

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");

  return (
    <DashboardSearchContext.Provider value={{ search, setSearch }}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch() {
  const context = useContext(DashboardSearchContext);

  if (!context) {
    throw new Error("useDashboardSearch must be used within DashboardSearchProvider");
  }

  return context;
}