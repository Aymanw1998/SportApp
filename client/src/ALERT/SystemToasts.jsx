// SystemToasts.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import "./SystemToasts.css";
import api from "../WebServer/services/api";

// ---- Global server health signal ----
const HEALTH_EVENT = "server-health";
let _serverHealthy = null; // null | true | false

function emitHealth(ok) {
  _serverHealthy = ok;
  try { window.dispatchEvent(new CustomEvent(HEALTH_EVENT, { detail: { ok } })); } catch {}
}
function useServerHealth() {
  const [ok, setOk] = React.useState(_serverHealthy);
  React.useEffect(() => {
    const handler = (e) => setOk(e.detail.ok);
    window.addEventListener(HEALTH_EVENT, handler);
    return () => window.removeEventListener(HEALTH_EVENT, handler);
  }, []);
  return ok;
}

// ---------- API גלובלי ----------
const _queue = [];
export const toast = {
  _push: (t) => _queue.push(t),
  success: (msg, opts = {}) => toast._push({ description: msg, variant: "success", ...opts }),
  info:    (msg, opts = {}) => toast._push({ description: msg, variant: "info",    ...opts }),
  warn:    (msg, opts = {}) => toast._push({ description: msg, variant: "warning", ...opts }),
  error:   (msg, opts = {}) => toast._push({ description: msg, variant: "destructive", ...opts }),
};

// ---------- Context ----------
const ToastContext = createContext(null);
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast inside <ToastProvider>");
  return ctx;
}

// ---------- Provider ----------
export function ToastProvider({ children, rtl = true, baseZIndex = 50 }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const clear = useCallback(() => setToasts([]), []);

  // ✅ push אמיתי שמוסיף לטוסטים
  const push = useCallback((t) => {
    const id = t.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const withDefaults = {
      id,
      title: t.title,
      description: t.description,
      variant: t.variant || "info",
      duration: t.duration ?? (t.variant === "destructive" ? 8000 : t.variant === "warning" ? 7000 : 5000),
      sticky: !!t.sticky,
    };
    setToasts((prev) => [withDefaults, ...prev]);
    return id;
  }, []);

  // ✅ חבר את ה־API הגלובלי ונקז הודעות שנשלחו לפני שה־Provider עלה
  useEffect(() => {
    toast._push = push;
    if (_queue.length) for (const t of _queue.splice(0)) push(t);
  }, [push]);

  const value = useMemo(() => ({ toasts, push, dismiss, clear }), [toasts, push, dismiss, clear]);

  return (
    <ToastContext.Provider value={value}>
      <div dir={rtl ? "rtl" : undefined}>{children}</div>
      <ToastViewport baseZIndex={baseZIndex} />
    </ToastContext.Provider>
  );
}

// ---------- Viewport (פורטל ל-body כדי לעקוף z-index/transform של הורים) ----------
function ToastViewport({ baseZIndex = 50 }) {
  const { toasts, dismiss } = useToast();
  const view = (
    <div className="toast-viewport" style={{ zIndex: baseZIndex }}>
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} t={t} onClose={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
  return createPortal(view, document.body);
}

// ---------- Item ----------
function ToastItem({ t, onClose }) {
  const [hover, setHover] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    console.log('t.sticky', t.sticky);
    console.log('hover', hover);
    if (t.sticky || hover) return;
    timeoutRef.current = window.setTimeout(onClose, t.duration || 5000);
    return () => timeoutRef.current && window.clearTimeout(timeoutRef.current);
  }, [hover, t.duration, t.sticky, onClose]);

  const variantClass = `toast ${t.variant || "info"}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={variantClass}
      role="status"
      aria-live="polite"
    >
      <div className="toast-row">
        <div className="toast-body">
          {t.title && <div className="toast-title">{t.title}</div>}
          {t.description && <div className="toast-desc">{t.description}</div>}
        </div>
        <button onClick={onClose} aria-label="סגירה" className="toast-close">×</button>
      </div>
    </motion.div>
  );
}

// ---------- Watcher: Health + Token ----------
export function SystemStatusWatcher({ options }) {
  const { push } = useToast();
  const healthUrl = options?.healthUrl || "/api/health";
  const intervalMs = options?.intervalMs || 30000;
  const getToken = options?.getToken || (() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null));
  const warnBeforeExpirySec = options?.warnBeforeExpirySec || 300;

  useEffect(() => {
    let mounted = true;
    let fails = 0;
    const check = async () => {
      try {
        const r =  await api.get(healthUrl);
        if (!r.data.ok) throw new Error(String(r.status));
        emitHealth(true);
        if (mounted && fails > 0) {
          push({ variant: "success", description: "✅ חזר חיבור השרת", duration: 3000 });
          fails = 0;
        }
      } catch {
        emitHealth(false);
        fails++;
        if (mounted && fails === 1) {
          push({ variant: "warning", sticky: true, description: "⚠️ אין חיבור לשרת כרגע. ננסה שוב ברקע." });
        }
      }
    };
    const id = window.setInterval(check, intervalMs);
    check();
    return () => { mounted = false; window.clearInterval(id); };
  }, [healthUrl, intervalMs, push]);

  useEffect(() => {
    const checkExp = () => {
      const tok = getToken();
      console.log('tok', tok);
      if (!tok) return;
      const exp = getJwtExp(tok);
      console.log('exp', exp);

      if (!exp) return;
      const now = Math.floor(Date.now() / 1000);
      const left = exp - now;
      if (left <= 0) {
        push({ variant: "destructive", sticky: true, description: "⛔ התוקף פג – נא להתחבר מחדש." });
      } else if (left < warnBeforeExpirySec) {
        const min = Math.max(1, Math.floor(left / 60));
        push({ variant: "info", description: `ℹ️ התוקף יפוג בעוד ~${min} ד׳. רענון/כניסה מחדש מומלצים.` });
      }
    };
    const id = window.setInterval(checkExp, 20000);
    checkExp();
    return () => window.clearInterval(id);
  }, [getToken, warnBeforeExpirySec, push]);

  return null;
}

// ---------- SSE Subscriber ----------
export function SystemEventSubscriber({ url = "/api/events" }) {
  const { push } = useToast();
  useEffect(() => {
    const es = new EventSource(url, { withCredentials: true });
    console.log("es", es);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        const level = data.level || "info";
        const variant = level === "error" ? "destructive" : level === "warning" ? "warning" : level === "success" ? "success" : "info";
        console.log('onmessage', { title: data.title, description: data.message, variant });
        push({ title: data.title, description: data.message, variant });
      } catch {
        push({ description: ev.data || "אירוע מערכת", variant: "info" });
      }
    };
    // es.onerror = () => { push({ description: "⚠️ חיבור אירועי-שרת נפל. מנסה להתחבר מחדש…", variant: "warning" }); };
    return () => es.close();
  }, [url, push]);
  return null;
}

// ---------- Status Badge ----------
export function StatusBadge({ className = "" }) {
  const serverOk = useServerHealth();
  const [minsLeft, setMinsLeft] = useState(null);
  const [netState, setNetState]     = useState(null);   // 'ok'|'warn'|'bad'|null
  const [tokenState, setTokenState] = useState("warn"); // 'ok'|'warn'|'bad'

  React.useEffect(() => {
    if (serverOk === null) setNetState("warn");
    else if (serverOk)     setNetState("ok");
    else                   setNetState("bad");
  }, [serverOk]);

  React.useEffect(() => {
    const WARN_BEFORE_SEC = 5 * 60;
    const compute = async () => {
      try {
        const tok = localStorage.getItem("accessToken");
        if (!tok) { setMinsLeft(null); setTokenState("warn"); return; }
        const exp = getJwtExp(tok);
        if (!exp) { setMinsLeft(null); setTokenState("warn"); return; }
        const leftSec = exp - Math.floor(Date.now() / 1000);
        const minutes = Math.max(0, Math.floor(leftSec / 60));
        setMinsLeft(minutes);
        if (leftSec <= 0) setTokenState("bad");
        else if (leftSec < WARN_BEFORE_SEC) setTokenState("warn");
        else setTokenState("ok");
      } catch { setMinsLeft(null); setTokenState("warn"); }
    };
    const id = setInterval(compute, 10000);
    compute();
    return () => clearInterval(id);
  }, []);

  return (
    <>
    {false && <div className={`status-badge ${className}`}>
      <div className="status-box">
        <div className="status-seg"><span className={`dot ${netState}`} /><span className="label">שרת</span></div>
        <div className="split" />
        <div className="status-seg">
          <span className={`dot ${tokenState}`} />
          <span className="label">טוקן {minsLeft !== null ? minsLeft > 60 ? `~${(minsLeft/60).toFixed(0)} שע׳` : `~${minsLeft} ד׳` : "לא נמצא"}</span>
        </div>
      </div>
    </div>}
    </>
  );
}

// ---------- Utils ----------
function getJwtExp(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch { return null; }
}
