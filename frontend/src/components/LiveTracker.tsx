"use client";

import { useEffect } from "react";
import { getOrCreateTabUserId } from "@/lib/concur/tab-user-id";
import { nestFetch } from "@/lib/nest-api";

export function LiveTracker() {
  useEffect(() => {
    const ping = () => {
      const sessionId = getOrCreateTabUserId();
      if (sessionId === "USER-SERVER") return;
      nestFetch("tickets/ping", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      }).catch(() => {
        // Ignore ping errors
      });
    };

    ping();
    const id = setInterval(ping, 15000); // Ping every 15s
    return () => clearInterval(id);
  }, []);

  return null;
}
