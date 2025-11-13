'use client';

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { BASSETT_LNG_LAT, NEXT_PUBLIC_MAPBOX_TOKEN } from "@/lib/constants";

mapboxgl.accessToken = NEXT_PUBLIC_MAPBOX_TOKEN;

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.error("MapCanvas: container ref is null");
      return;
    }
    
    if (!mapboxgl.accessToken) {
      console.error("Missing Mapbox token. Set NEXT_PUBLIC_MAPBOX_TOKEN environment variable.");
      return;
    }

    const container = containerRef.current;
    let map: mapboxgl.Map | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let rafId: number | null = null;
    let resizeHandler: (() => void) | null = null;
    
    const initMap = () => {
      if (!containerRef.current) return;
      
      if (container.offsetHeight === 0 || container.offsetWidth === 0) {
        console.warn("MapCanvas: container has zero dimensions, retrying...", {
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
        // Retry after a short delay
        retryTimeout = setTimeout(initMap, 100);
        return;
      }

      map = new mapboxgl.Map({
        container: container,
        style: "mapbox://styles/mapbox/standard",
        center: BASSETT_LNG_LAT,
        zoom: 16.5,
        pitch: 0,
        bearing: 0,
        interactive: true,
        attributionControl: false,
        logoPosition: "bottom-right",
      });

      map.on("error", (e) => {
        console.error("Mapbox error:", e);
      });

      map.addControl(
        new mapboxgl.AttributionControl({ compact: true }),
        "bottom-right",
      );

      map.on("load", () => {
        console.log("Map loaded successfully");
        const marker = document.createElement("div");
        marker.className = "live-marker";
        new mapboxgl.Marker({ element: marker }).setLngLat(BASSETT_LNG_LAT).addTo(map!);
      });

      // Handle window resize
      resizeHandler = () => {
        map?.resize();
      };
      window.addEventListener("resize", resizeHandler);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    rafId = requestAnimationFrame(initMap);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (retryTimeout !== null) {
        clearTimeout(retryTimeout);
      }
      if (resizeHandler !== null) {
        window.removeEventListener("resize", resizeHandler);
      }
      if (map) {
        map.remove();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 h-full w-full"
      aria-label="Live map centered on 1700 Bassett Street, Denver"
    />
  );
}
