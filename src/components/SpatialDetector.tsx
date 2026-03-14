"use client";

import { useEffect } from "react";

export function SpatialDetector() {
  useEffect(() => {
    // Detect WebSpatial runtime via User-Agent
    const isSpatial = navigator.userAgent.includes("WebSpatial");
    if (isSpatial) {
      document.documentElement.classList.add("is-spatial");
    }
  }, []);

  return null;
}
