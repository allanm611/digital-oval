import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface NavigationHistoryContextType {
  previousPath: string | null;
  currentPath: string;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    setPreviousPath(currentPath);
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  return (
    <NavigationHistoryContext.Provider value={{ previousPath, currentPath }}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error("useNavigationHistory must be used within NavigationHistoryProvider");
  }
  return context;
}
