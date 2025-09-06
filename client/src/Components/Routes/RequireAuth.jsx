// src/Components/Routes/RequireAuth.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getMe } from '../../WebServer/services/auth/fuctionsAuth';

export default function RequireAuth() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) בדיקה בסיסית: יש בכלל חיבור?
        const isLoggedIn = !!localStorage.getItem('isLoggedIn');
        const token      = localStorage.getItem('accessToken');

        if (!isLoggedIn || !token) {
          if (!alive) return;
          navigate('/', { replace: true, state: { from: location } });
          return;
        }

        // 2) שליפת המשתמש
        const me = await getMe().catch(() => null);
        if (!alive) return;

        if (!me) {
          navigate('/', { replace: true, state: { from: location } });
          return;
        }

        // 3) אם מתאמן וללא מנוי—להפנות לבחירת מנוי, אלא אם כבר שם
        const hasSub = !!(me.subs && me.subs.id);
        const isTrainee = me.role === 'מתאמן';
        console.warn("hasSub", hasSub, "isTrainee", isTrainee);
        const onSelectSubPage = location.pathname.startsWith('/selectSubfor/');
        const onQuotationPage = location.pathname === '/quotation'; // אם יש אצלך דף הצעת מחיר ציבורי
        console.warn("onSelectSubPage", onSelectSubPage, "onQuotationPage", onQuotationPage);
        if (isTrainee && !hasSub && !onSelectSubPage && !onQuotationPage) {
          navigate(`/selectSubfor/${encodeURIComponent(me.tz)}`, { replace: true });
          return;
        }
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => { alive = false; };
  }, [location.pathname, navigate]);

  // בזמן הבדיקה לא מרנדרים כלום (אפשר לשים ספינר)
  if (checking) return null;

  return <Outlet />;
}
