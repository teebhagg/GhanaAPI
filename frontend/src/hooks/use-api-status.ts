import { useEffect, useState } from "react";

import { API_BASE } from "@/lib/api";

export type ApiStatus = "ok" | "down" | "unknown";

const TIMEOUT_MS = 4000;
let inflight: Promise<ApiStatus> | null = null;

function checkStatus(): Promise<ApiStatus> {
  if (inflight) return inflight;
  inflight = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE}/status`, {
        signal: controller.signal,
      });
      return res.ok ? "ok" : "down";
    } catch {
      return "unknown";
    } finally {
      clearTimeout(timer);
    }
  })();
  return inflight;
}

/** One shared, non-blocking health ping. Never throws. */
export function useApiStatus(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>("unknown");

  useEffect(() => {
    let active = true;
    checkStatus().then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, []);

  return status;
}
