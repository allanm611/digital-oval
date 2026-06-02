import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function usePreviousLocation() {
  const location = useLocation();
  const previousLocationRef = useRef<string | null>(null);

  useEffect(() => {
    previousLocationRef.current = location.pathname;
  }, [location.pathname]);

  return previousLocationRef.current;
}
