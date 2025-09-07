import React, {useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ConfirmProvider } from './Components/Provides/ConfirmContext';
import { ToastProvider, SystemStatusWatcher, SystemEventSubscriber, StatusBadge, useToast, toast } from "./ALERT/SystemToasts";

// לוג שגיאות גלובלי – אם משהו קורס לפני רנדר תראה בקונסול
window.onerror = (m, s, l, c, e) => console.error('[window.onerror]', m, e);
window.onunhandledrejection = (e) => console.error('[unhandledrejection]', e.reason || e);

// “בדיקת דופק” – שלא ניתקע על כלום
function BootGuard({ children }) {
  return (
    <>
      <div id="boot-ping" style={{position:'fixed',inset:0,pointerEvents:'none',opacity:.0}} />
      {children}
    </>
  );
}

function DevToastPing() {
  const { push } = useToast();
  useEffect(() => {
    // console.log("🎉 ToastProvider פעיל (בדיקת עשן)");
    // push({ variant: "success", description: "🎉 ToastProvider פעיל (בדיקת עשן)" });
    // השאר גם לקונסול — לעבודה דרך ה-DOM
    window.toast = toast;
  }, [push]);
  return null;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ConfirmProvider>
        <BootGuard>
            <ToastProvider rtl baseZIndex={4000}>
              <App />

              {/* ניטור ברקע */}
              <SystemStatusWatcher
                options={{
                  healthUrl: `/health`,               // ← להתאים לשרת שלך
                  intervalMs: 5000,                     // רענון מהיר ונעים
                  getToken: () => localStorage.getItem("accessToken"),
                  warnBeforeExpirySec: 300
                }}
              />

              {/* אירועים חיים מהשרת */}
              <SystemEventSubscriber url="/api/events" />

              {/* באדג׳ סטטוס קבוע */}
              <StatusBadge />
                <DevToastPing /> {/* ← להסיר אחרי שבדקת שזה עובד */}
            </ToastProvider>
        </BootGuard>
    </ConfirmProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
