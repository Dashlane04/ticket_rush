"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { nestFetch } from "@/lib/nest-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getDynamicColor,
  gridDimensions,
  parseSeatRecords,
  type ParsedSeat,
  type SeatApiRecord,
} from "@/lib/concur/seat-grid-utils";
import "@/styles/concur-booking.css";
import { useAuthStore } from "@/stores/auth-store";

async function ticketBffPost(path: string, body: Record<string, unknown>) {
  return fetch(path, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seatPriceForType(type: string): number {
  if (type === "vip") return 40;
  if (type === "sweetbox") return 65;
  return 15;
}

type SeatBookingExperienceProps = {
  showtimeId: string;
  displayTitle?: string;
  /** e.g. `Hall A • May 6, 2026, 1:59 PM` (prototype header subtitle). */
  eventMetaLine?: string;
};

export function SeatBookingExperience({ showtimeId, displayTitle, eventMetaLine }: SeatBookingExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  const [seatRows, setSeatRows] = useState<ParsedSeat[]>([]);
  const [gridCols, setGridCols] = useState(0);
  const [dynamicCss, setDynamicCss] = useState("");
  const [selectedSeats, setSelectedSeats] = useState<Map<string, { price: number }>>(new Map());
  const [locallyLockedSeats, setLocallyLockedSeats] = useState<Set<string>>(new Set());
  const locallyLockedSeatsRef = useRef<Set<string>>(new Set());
  const [locksAcquired, setLocksAcquired] = useState(false);
  const locksAcquiredRef = useRef(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPhase, setCheckoutPhase] = useState<"summary" | "success">("summary");
  const [txnId, setTxnId] = useState("--");
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [loaderText, setLoaderText] = useState("Processing...");

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requireLoginForPurchase = useCallback(() => {
    toast.error("Vui lòng đăng nhập để mua vé.");
    const returnPath = pathname && pathname.length > 0 ? pathname : `/booking/${showtimeId}`;
    router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }, [router, pathname, showtimeId]);

  useEffect(() => {
    locksAcquiredRef.current = locksAcquired;
  }, [locksAcquired]);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const pollSeatStatusRef = useRef<(() => Promise<void>) | null>(null);

  const pollSeatStatus = useCallback(async () => {
    if (locksAcquiredRef.current) return;
    try {
      const res = await nestFetch(`tickets/${showtimeId}/seats`);
      const raw = (await res.json()) as SeatApiRecord[];
      const parsedData = parseSeatRecords(raw);
      setSeatRows(parsedData);

      const { cols: COLS } = gridDimensions(parsedData);
      setGridCols(COLS);

      const uniqueTypes = [...new Set(parsedData.map((s) => s.type).filter((t) => t !== "empty"))];
      let cssStr = "";
      uniqueTypes.forEach((type) => {
        const color = getDynamicColor(type);
        cssStr += `.concur-booking-root .cb-seat.cb-available[data-seat-type="${type}"] { border-color: ${color}; color: var(--text-main); }\n`;
      });
      setDynamicCss(cssStr);

      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          void pollSeatStatusRef.current?.();
        }, 1500);
      }
    } catch {
      /* keep UI stable */
    }
  }, [showtimeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- stable handler ref for seat polling interval
    pollSeatStatusRef.current = pollSeatStatus;
  }, [pollSeatStatus]);

  useEffect(() => {
    void pollSeatStatus();
    return () => {
      clearPolling();
    };
  }, [clearPolling, pollSeatStatus]);

  const seatByPos = useMemo(() => {
    const m = new Map<string, ParsedSeat>();
    seatRows.forEach((s) => m.set(`${s.gridRow}-${s.gridCol}`, s));
    return m;
  }, [seatRows]);

  const { rows: ROWS } = gridDimensions(seatRows);

  const legendStatic = useMemo(
    () => (
      <>
        <div className="cb-legend-item">
          <div className="cb-legend-color" style={{ background: "var(--surface)", border: "2px solid var(--border)" }} />
          Available
        </div>
        <div className="cb-legend-item">
          <div className="cb-legend-color" style={{ background: "#f97316" }} />
          Held (In Cart)
        </div>
        <div className="cb-legend-item">
          <div className="cb-legend-color" style={{ background: "#cbd5e1" }} />
          Sold
        </div>
        <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 10px" }} />
      </>
    ),
    [],
  );

  const legendDynamic = useMemo(() => {
    const uniqueTypes = [...new Set(seatRows.map((s) => s.type).filter((t) => t !== "empty"))];
    return uniqueTypes.map((type) => {
      const color = getDynamicColor(type);
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      return (
        <div key={type} className="cb-legend-item">
          <div className="cb-legend-color" style={{ border: `2px solid ${color}` }} />
          {label}
        </div>
      );
    });
  }, [seatRows]);

  const titleText = displayTitle ?? showtimeId.split("-")[0].toUpperCase();
  const headerMetaLine = eventMetaLine ?? "Hall A • Live showtime";

  const qrCodeUrl = useMemo(() => {
    if (txnId === "--") return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`TicketRush:${txnId}`)}`;
  }, [txnId]);

  const handleSeatClick = useCallback((seatNumber: string, status: string, type: string) => {
    if (status === "sold" || status === "held" || status === "unavailable" || status === "broken") return;

    setSelectedSeats((prev) => {
      const next = new Map(prev);
      if (next.has(seatNumber)) {
        next.delete(seatNumber);
      } else {
        if (next.size >= 8) {
          toast.warning("Maximum 8 seats per transaction.");
          return prev;
        }
        next.set(seatNumber, { price: seatPriceForType(type) });
      }
      return next;
    });
  }, []);

  const totalPrice = useMemo(() => {
    let t = 0;
    selectedSeats.forEach((s) => {
      t += s.price;
    });
    return t;
  }, [selectedSeats]);

  const initiateCheckout = async () => {
    if (selectedSeats.size === 0) return;
    if (hydrated && !user) {
      requireLoginForPurchase();
      return;
    }
    setLoaderOpen(true);
    const requestedSeatIds = Array.from(selectedSeats.keys());

    try {
      const res = await ticketBffPost("/api/tickets/reserve", {
        showtimeId,
        seatIds: requestedSeatIds,
      });
      if (res.status === 401) {
        setLoaderOpen(false);
        requireLoginForPurchase();
        return;
      }
      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        setSelectedSeats(new Map());
        throw new Error(data.message || "Some seats were taken! Please pick again.");
      }

      clearPolling();
      setLocksAcquired(true);
      locksAcquiredRef.current = true;
      const lockSet = new Set(requestedSeatIds);
      locallyLockedSeatsRef.current = lockSet;
      setLocallyLockedSeats(lockSet);
      setLoaderOpen(false);
      setCheckoutPhase("summary");
      setCheckoutOpen(true);
    } catch (e) {
      setLoaderOpen(false);
      toast.error(e instanceof Error ? e.message : "Error");
      void pollSeatStatus();
    }
  };

  const cancelCheckout = async () => {
    setCheckoutOpen(false);
    setCheckoutPhase("summary");

    if (locallyLockedSeats.size > 0) {
      try {
        const res = await ticketBffPost("/api/tickets/reserve/cancel", {
          showtimeId,
          seatIds: Array.from(locallyLockedSeats),
        });
        if (res.status === 401) {
          console.warn("Session expired while releasing holds");
        }
      } catch {
        console.warn("Failed to release locks");
      }
    }

    setSelectedSeats(new Map());
    locallyLockedSeatsRef.current = new Set();
    setLocallyLockedSeats(new Set());
    setLocksAcquired(false);
    locksAcquiredRef.current = false;
    void pollSeatStatus();
  };

  const finalizePurchase = async () => {
    setLoaderText("Processing Payment...");
    setLoaderOpen(true);

    try {
      const seatIdsToPurchase = Array.from(selectedSeats.keys());
      const res = await ticketBffPost("/api/tickets/purchase", {
        showtimeId,
        seatIds: seatIdsToPurchase,
      });

      if (res.status === 401) {
        setLoaderOpen(false);
        requireLoginForPurchase();
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Payment failed. Please try again.");
      }

      setLoaderOpen(false);

      const id = "TXN-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      setTxnId(id);

      setSelectedSeats(new Map());
      locallyLockedSeatsRef.current = new Set();
      setLocallyLockedSeats(new Set());
      setLocksAcquired(false);
      locksAcquiredRef.current = false;
      setCheckoutPhase("success");
      void pollSeatStatus();
    } catch (err) {
      setLoaderOpen(false);
      toast.error(err instanceof Error ? err.message : "An error occurred during checkout.");
    }
  };

  function derivedSeatClass(seat: ParsedSeat): string {
    const base = "cb-seat ";
    if (seat.type === "empty") return base + "cb-empty";
    if (selectedSeats.has(seat.seatNumber)) return base + "cb-selected";
    if (seat.status === "sold") return base + "cb-sold";
    if (seat.status === "held") return base + "cb-held";
    if (seat.status === "unavailable" || seat.status === "broken") return base + "cb-unavailable";
    return base + "cb-available";
  }

  return (
    <div className="concur-booking-root">
      <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />

      <div className="cb-container">
        <div className="cb-header">
          <h1>
            <i className="fa-solid fa-ticket shrink-0 text-[20px]" aria-hidden />
            Ticket Rush
          </h1>
          <div className="cb-movie-info">
            <h2>{titleText}</h2>
            <p>{headerMetaLine}</p>
          </div>
        </div>

        <div className="cb-main">
          <div className="cb-screen-curve">
            <span>SCREEN</span>
          </div>

          <div className="cb-grid-wrapper">
            <div
              className="cb-grid"
              style={{ gridTemplateColumns: gridCols ? `repeat(${gridCols}, 32px)` : undefined }}
            >
              {ROWS > 0 &&
                gridCols > 0 &&
                Array.from({ length: ROWS }).map((_, r) =>
                  Array.from({ length: gridCols }).map((__, c) => {
                    const seat = seatByPos.get(`${r}-${c}`);
                    if (!seat || seat.type === "empty") {
                      return (
                        <div key={`${r}-${c}`} className="cb-cell-slot">
                          <div className="cb-seat cb-empty" />
                        </div>
                      );
                    }
                    const cls = derivedSeatClass(seat);
                    const showNum = seat.seatNumber.replace(/^[A-Z]+/, "");
                    return (
                      <div key={`${r}-${c}`} className="cb-cell-slot">
                        <Button
                          type="button"
                          variant="ghost"
                          data-seat-type={seat.type}
                          className={cn(cls, "h-auto min-h-0 w-auto shrink-0 rounded-none border-0 p-0 shadow-none hover:bg-transparent")}
                          onClick={() => handleSeatClick(seat.seatNumber, seat.status, seat.type)}
                        >
                          {showNum}
                        </Button>
                      </div>
                    );
                  }),
                )}
            </div>
          </div>

          <div className="cb-legend">
            {legendStatic}
            {legendDynamic}
          </div>
        </div>

        <div className="cb-footer">
          <div className="cb-cart-info">
            Selected:{" "}
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{selectedSeats.size}</span>
            <span style={{ margin: "0 15px", color: "var(--border)" }}>|</span>
            Total: <strong>${totalPrice}</strong>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="cb-btn cb-btn-primary border-0 shadow-none hover:bg-transparent disabled:opacity-50"
            disabled={selectedSeats.size === 0 || locksAcquired || (hydrated && !user)}
            title={hydrated && !user ? "Đăng nhập để thanh toán" : undefined}
            onClick={() => void initiateCheckout()}
          >
            Proceed to Checkout
          </Button>
          {hydrated && !user ? (
            <p className="mt-2 text-center text-sm text-amber-800 dark:text-amber-200/90">
              Đăng nhập để giữ ghế và thanh toán. Bạn vẫn có thể xem sơ đồ ghế.
            </p>
          ) : null}
        </div>
      </div>

      <div className={`cb-overlay ${!checkoutOpen ? "cb-hidden" : ""}`}>
        <div className="cb-checkout-box">
          <div id="payment-actions" className={checkoutPhase !== "summary" ? "cb-hidden-block" : undefined}>
            <h2 style={{ margin: "0 0 10px", color: "var(--text-main)", fontSize: 24 }}>Order Summary</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 30 }}>
              Please review your tickets before finalizing the purchase.
            </p>

            <div className="cb-receipt">
              <div className="cb-receipt-row">
                <span>Event:</span> <strong>{titleText}</strong>
              </div>
              <div className="cb-receipt-row">
                <span>Seats:</span>{" "}
                <strong>{Array.from(selectedSeats.keys()).join(", ") || "--"}</strong>
              </div>
              <div className="cb-receipt-row cb-total">
                <span>Total Price:</span> <span style={{ color: "#166534" }}>${totalPrice}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button
                type="button"
                variant="ghost"
                className="cb-btn cb-btn-primary flex-1 border-0 shadow-none hover:bg-transparent"
                style={{ background: "#f1f5f9", color: "var(--text-main)", flex: 1 }}
                onClick={() => void cancelCheckout()}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="cb-btn cb-btn-primary flex-[2] border-0 shadow-none hover:bg-transparent"
                style={{ flex: 2, background: "#166534" }}
                onClick={() => void finalizePurchase()}
              >
                <i className="fa-regular fa-credit-card mr-1" aria-hidden />
                Confirm & Pay
              </Button>
            </div>
          </div>

          <div id="success-details" className={checkoutPhase !== "success" ? "cb-hidden-block" : undefined}>
            <div className="cb-checkout-success-icon">
              <i className="fa-solid fa-check" aria-hidden />
            </div>
            <h2 style={{ margin: "0 0 10px", color: "var(--text-main)", fontSize: 24 }}>Payment Successful!</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Your tickets have been secured. Have fun!</p>

            <div
              style={{
                margin: "24px 0",
                padding: 20,
                border: "2px dashed #cbd5e1",
                borderRadius: 12,
                display: "inline-block",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external QR API */}
              <img src={qrCodeUrl || undefined} alt="QR Code" width={150} height={150} />
            </div>

            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Transaction ID: <strong>{txnId}</strong>
            </p>
            <Button
              type="button"
              variant="ghost"
              className="cb-btn cb-btn-primary mt-5 w-full border-0 shadow-none hover:bg-transparent"
              style={{ marginTop: 20 }}
              onClick={() => window.location.reload()}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className={`cb-overlay ${!loaderOpen ? "cb-hidden" : ""}`} style={{ zIndex: 2000 }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div className="cb-queue-spinner" style={{ borderTopColor: "white" }} />
          <h3 style={{ fontWeight: 500 }}>{loaderText}</h3>
        </div>
      </div>
    </div>
  );
}
