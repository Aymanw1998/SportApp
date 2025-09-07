import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// עדכן את הנתיב לפי המבנה שלך:
import { getAll, /*softDelete fallback: deleteS */ } from "../../WebServer/services/subs/functionsSubs";
import styles from "./Subs.module.css";

import Fabtn from "./../Global/Fabtn/Fabtn"
import { toast } from "../../ALERT/SystemToasts";

const ViewAllSubs = () => {
  const topAnchorRef = useRef(null);
  const [showFab, setShowFab] = useState(false);
  
    // אם גוללים והעוגן לא נראה – נראה FAB
    useEffect(() => {
      // אם הגלילה נעשית בתוך קונטיינר פנימי עם overflow:auto,
      // אפשר להחליף ל-root: scrollEl
      const io = new IntersectionObserver(
        ([entry]) => setShowFab(!entry.isIntersecting),
        { root: null } // viewport
      );
      if (topAnchorRef.current) io.observe(topAnchorRef.current);
      return () => io.disconnect();
    }, []);
  
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");      // "name" | "price"
  const [sortDir, setSortDir] = useState("asc");           // "asc" | "desc"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const loadSubs = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getAll();
      if(!res.ok) throw new Error(res.message)
      const data = res.subs;
      if (data && data.length > 0) {
        // סינון מנויים שמסומנים למחיקה רכה
        console.log("getAllSub", data)
        const filtered = data;
        setSubs(filtered);
      } else {
        setSubs([]);
      }
    } catch (e) {
      console.error("שגיאה בהבאת מנויים", e);
      setErr("שגיאה בטעינת מנויים");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  const fmtILS = (n) =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" })
      .format(Number(n) || 0);

  const toggleDir = () => setSortDir(d => (d === "asc" ? "desc" : "asc"));

  const sortedFilteredSubs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = q
      ? subs.filter(s =>
          [s.name, s.months, s.times_week, s.price]
            .map(v => String(v ?? "").toLowerCase())
            .join(" ")
            .includes(q)
        )
      : subs;

    const dirMul = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (sortField === "price") {
        const av = Number(a.price) || 0;
        const bv = Number(b.price) || 0;
        return (av - bv) * dirMul;
      }
      // name (ברירת מחדל)
      const an = String(a.name ?? "");
      const bn = String(b.name ?? "");
      return an.localeCompare(bn, "he", { sensitivity: "base" }) * dirMul;
    });
  }, [subs, searchTerm, sortField, sortDir]);

  const onSoftDelete = async (id, name) => {
    if (!window.confirm(`למחוק (רכה) את המנוי "${name}"?`)) return;
    try {
        const res = {status: 300}
      if (res?.status === 200) {
        setSubs(prev => prev.filter(s => s._id !== id));
      } else {
        toast.error("❌ המחיקה נכשלה");
      }
    } catch (e) {
      console.error(e);
      toast.error("❌ המחיקה נכשלה");
    }
  };

  return (
    <div>
      <div >
        <h1 style={{ textAlign: "center"}}>רשימת מנויים</h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="חיפוש ..."
            style={{
              width: "80%", padding: "10px", margin: "10px", marginBottom: "20px",fontSize: "14px", 
              border: "1px solid #ccc",borderRadius: "8px"
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            title="שדה מיון"
            style={{ padding: "0.5rem", borderRadius: "0.5rem" }}
          >
            <option value="name">מיון לפי שם</option>
            <option value="price">מיון לפי מחיר</option>
          </select> */}

          {/* <button
            onClick={toggleDir}
            title="היפוך סדר המיון"
            style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem" }}
          >
            {sortDir === "asc" ? "⬆️ עולה" : "⬇️ יורד"}
          </button> */}

          <button id="page-add-subs"
            style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}
            onClick={() => navigate("/subs/new")}
          >
            ➕ הוסף מנוי
          </button>

          <button
            style={{ backgroundColor: '#374151', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}
            onClick={loadSubs}
            disabled={loading}
          >
            {loading ? "מרענן…" : "רענן"}
          </button>
        </div>
        <div style={{ marginTop: 8, opacity: 0.7 }}>
        סה״כ: {sortedFilteredSubs && sortedFilteredSubs.length > 0 ? sortedFilteredSubs.length: 0} מנויים
      </div>
      </div>

      {err && <div style={{ marginTop: 12, color: "#b91c1c" }}>{err}</div>}
      {!err && loading && <div style={{ marginTop: 12 }}>טוען מנויים…</div>}

      {!loading && !err && (
        <table className={`table ${styles.subTable}`} style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>שם</th>
              <th>חודשים</th>
              <th>פעמים בשבוע</th>
              <th>מחיר</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sortedFilteredSubs.length > 0 ? (
              sortedFilteredSubs.map((sub) => (
                <tr key={sub._id}>
                  <td data-label="שם">{sub.name}</td>
                  <td data-label="חודשים">{sub.months}</td>
                  <td data-label="פעמים בשבוע">{sub.times_week}</td>
                  <td data-label="מחיר">{fmtILS(sub.price)}</td>
                  <td data-label="פעולות">
                    <button style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', alignItems: "center" }} onClick={() => navigate(`/subs/${sub._id}`)}>לחץ לפרטים</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 16 }}>
                  אין תוצאות להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <Fabtn
        anchor="#page-add-subs"                     // או: showFab && canEdit אם תרצה רק כשיש הרשאת עריכה
        visible={showFab}
        label="הוספת מנוי"
        onClick={() => {
          console.log('fab click');           // בדיקת קליק
          navigate(`/subs/new`);
        }}
      />
    </div>
  );
};

export default ViewAllSubs;
