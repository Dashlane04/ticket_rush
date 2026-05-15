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
import { getOrCreateTabUserId } from "@/lib/concur/tab-user-id";

async function ticketBffPost(path: string, body: Record<string, unknown>) {
  return fetch(path, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}



type SeatBookingExperienceProps = {
  showtimeId: string;
  displayTitle?: string;
  /** e.g. `Hall A • May 6, 2026, 1:59 PM` (prototype header subtitle). */
  eventMetaLine?: string;
  maxSeatsPerBooking?: number;
};

export function SeatBookingExperience({ showtimeId, displayTitle, eventMetaLine, maxSeatsPerBooking }: SeatBookingExperienceProps) {
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

  const [queueState, setQueueState] = useState<"idle" | "joining" | "waiting" | "entered" | "error">("idle");
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const queueIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    pollSeatStatusRef.current = pollSeatStatus;
  }, [pollSeatStatus]);

  const clearQueuePolling = useCallback(() => {
    if (queueIntervalRef.current) {
      clearInterval(queueIntervalRef.current);
      queueIntervalRef.current = null;
    }
  }, []);

  const leaveQueue = useCallback(async () => {
    try {
      await nestFetch(`tickets/${showtimeId}/queue/leave`, {
        method: "POST",
        body: JSON.stringify({ userId: getOrCreateTabUserId() }),
      });
    } catch {
      // ignore
    }
  }, [showtimeId]);

  useEffect(() => {
    const joinQueue = async () => {
      setQueueState("joining");
      try {
        const res = await nestFetch(`tickets/${showtimeId}/queue/join`, {
          method: "POST",
          body: JSON.stringify({ userId: getOrCreateTabUserId() }),
        });
        if (!res.ok) throw new Error("Join queue failed");
        const data = (await res.json()) as { status: string; position?: number };

        if (data.status === "ENTER") {
          setQueueState("entered");
          void pollSeatStatus();
        } else if (data.status === "WAIT") {
          setQueueState("waiting");
          setQueuePosition(data.position || 0);
        } else {
          setQueueState("error");
        }
      } catch {
        setQueueState("error");
      }
    };

    void joinQueue();

    return () => {
      clearQueuePolling();
      void leaveQueue();
      clearPolling();
    };
  }, [showtimeId, pollSeatStatus, leaveQueue, clearQueuePolling, clearPolling]);

  useEffect(() => {
    if (queueState !== "waiting" && queueState !== "entered") {
      clearQueuePolling();
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await nestFetch(
          `tickets/${showtimeId}/queue/status/${encodeURIComponent(getOrCreateTabUserId())}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { status: string; position?: number };

        if (data.status === "ENTER") {
          setQueueState((prev) => {
            if (prev !== "entered") {
              void pollSeatStatus();
              return "entered";
            }
            return prev;
          });
        } else if (data.status === "WAIT") {
          setQueueState("waiting");
          setQueuePosition(data.position || 0);
        }
      } catch {
        // ignore
      }
    };

    queueIntervalRef.current = setInterval(() => {
      void checkStatus();
    }, 3000);
    return () => clearQueuePolling();
  }, [queueState, showtimeId, pollSeatStatus, clearQueuePolling]);

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

  const handleSeatClick = useCallback((seatNumber: string, status: string, type: string, price?: number) => {
    if (status === "sold" || status === "held" || status === "unavailable" || status === "broken") return;

    setSelectedSeats((prev) => {
      const next = new Map(prev);
      if (next.has(seatNumber)) {
        next.delete(seatNumber);
      } else {
        const limit = maxSeatsPerBooking ?? 8;
        if (next.size >= limit) {
          toast.warning(`Maximum ${limit} seats per transaction.`);
          return prev;
        }
        let p = price ?? 15;
        if (p < 1000) p = p * 25000;
        next.set(seatNumber, { price: p });
      }
      return next;
    });
  }, []);

  const availableSeatsCount = useMemo(() => seatRows.filter(s => s.status === "available").length, [seatRows]);
  const isSoldOut = seatRows.length > 0 && availableSeatsCount === 0;

  const totalPrice = useMemo(() => {
    let t = 0;
    selectedSeats.forEach((s) => {
      t += Number(s.price);
    });
    return t;
  }, [selectedSeats]);

  const discountedPrice = useMemo(() => {
    if (promoDiscount === 0) return totalPrice;
    return totalPrice * (1 - promoDiscount / 100);
  }, [totalPrice, promoDiscount]);

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
    setPromoInput("");
    setAppliedPromoCode(null);
    setPromoDiscount(0);
    void pollSeatStatus();
  };

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const res = await ticketBffPost("/api/tickets/validate-promo", { code: promoInput.trim() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid promo code");
      setPromoDiscount(data.discountPercent);
      setAppliedPromoCode(promoInput.trim());
      toast.success(`Applied ${data.discountPercent}% discount!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid promo code");
      setPromoDiscount(0);
      setAppliedPromoCode(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const finalizePurchase = async () => {
    setLoaderText("Processing Payment...");
    setLoaderOpen(true);

    try {
      const seatIdsToPurchase = Array.from(selectedSeats.keys());
      const res = await ticketBffPost("/api/tickets/purchase", {
        showtimeId,
        seatIds: seatIdsToPurchase,
        promoCode: appliedPromoCode,
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

      {queueState === "joining" || queueState === "waiting" || queueState === "error" ? (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 transition-all">
          <div className="relative overflow-hidden w-full max-w-sm bg-white dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 text-center">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-rose-500/20 blur-3xl rounded-full -z-10 pointer-events-none" />

            {queueState === "joining" && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="relative flex items-center justify-center w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-slate-800" />
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                  <i className="fa-solid fa-ticket text-rose-500 text-lg" aria-hidden />
                </div>
                <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white">Connecting...</h3>
                <p className="text-sm text-slate-500 mt-2">Checking ticket availability</p>
              </div>
            )}
            
            {queueState === "waiting" && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="relative flex items-center justify-center w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                  <i className="fa-solid fa-user-clock text-rose-500 text-2xl" aria-hidden />
                </div>
                
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">You are in line</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed px-2">
                  Due to high demand, you have been placed in a virtual queue. Please keep this page open.
                </p>
                
                <div className="w-full bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-inner">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Your Position</span>
                  <div className="text-5xl font-black text-rose-500 tracking-tighter" style={{ fontFeatureSettings: '"tnum"' }}>
                    {queuePosition !== null ? queuePosition : "—"}
                  </div>
                </div>
              </div>
            )}

            {queueState === "error" && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/10 mb-6">
                  <i className="fa-solid fa-triangle-exclamation text-rose-600 dark:text-rose-400 text-2xl" aria-hidden />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Connection Error</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 px-2">
                  We couldn't connect you to the queue.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl h-12 font-medium"
                >
                  Thử lại
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}

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

        <div className="cb-main relative">
          {isSoldOut && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[2px] rounded-2xl m-4 border border-rose-500/20">
              <div className="bg-rose-500/10 text-rose-500 rounded-full px-6 py-2 mb-4 border border-rose-500/20 uppercase tracking-widest font-bold text-sm">
                Sold Out
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 text-center px-4">Đã Hết Vé</h2>
              <p className="text-slate-300 text-center max-w-sm px-4">
                Tất cả ghế cho suất chiếu này đã được đặt. Vui lòng chọn suất chiếu khác.
              </p>
            </div>
          )}

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
                          onClick={() => handleSeatClick(seat.seatNumber, seat.status, seat.type, seat.price)}
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
            Total: <strong>{totalPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</strong>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="cb-btn cb-btn-primary border-0 shadow-none hover:bg-transparent disabled:opacity-50"
            disabled={selectedSeats.size === 0 || locksAcquired || (hydrated && !user)}
            title={hydrated && !user ? "Đăng nhập để thanh toán" : undefined}
            onClick={() => void initiateCheckout()}
          >
            Thanh toán ngay
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
                <span>Total Price:</span> 
                <span style={{ color: "#166534" }}>
                  {promoDiscount > 0 && (
                    <span className="text-slate-400 line-through mr-2 text-sm font-normal">
                      {totalPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                    </span>
                  )}
                  {discountedPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                </span>
              </div>
            </div>

            <div className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                disabled={promoDiscount > 0 || promoLoading}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase text-slate-900"
              />
              <Button
                type="button"
                disabled={!promoInput || promoDiscount > 0 || promoLoading}
                onClick={() => void applyPromo()}
                className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg px-6"
              >
                {promoLoading ? "..." : promoDiscount > 0 ? "Applied" : "Apply"}
              </Button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button
                type="button"
                variant="ghost"
                className="cb-btn cb-btn-primary flex-1 border-0 shadow-none hover:bg-transparent"
                style={{ background: "#f1f5f9", color: "var(--text-main)", flex: 1 }}
                onClick={() => void cancelCheckout()}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="cb-btn cb-btn-primary flex-[2] border-0 shadow-none hover:bg-transparent"
                style={{ flex: 2, background: "#166534" }}
                onClick={() => void finalizePurchase()}
              >
                <i className="fa-regular fa-credit-card mr-1" aria-hidden />
                Xác nhận & Thanh toán
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
              Về trang chủ
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
