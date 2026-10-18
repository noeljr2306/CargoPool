"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Pings the backend as soon as an auth page opens, so the server and
// database are already awake by the time the user submits the form.
export default function useWarmup() {
  useEffect(() => {
    fetch(`${API_URL}/api/warmup`).catch(() => {});
  }, []);
}
