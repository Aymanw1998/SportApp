import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// עדכן את הנתיב לפי המבנה שלך:
import { getAll, /*softDelete fallback: deleteS */ } from "../../WebServer/services/training/functionTraining";
import styles from "./Training.module.css";

import Fabtn from "../Global/Fabtn/Fabtn"
import { toast } from "../../ALERT/SystemToasts";

const ViewAllTraining = () => {
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
  const [trainings, setTrainings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");      // "name" | "price"
  const [sortDir, setSortDir] = useState("asc");           // "asc" | "desc"
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const loadTraining = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getAll();
      if(!res.ok) throw new Error(res.message)
      const data = res.trainings;
      if (data && data.length > 0) {
        // סינון מנויים שמסומנים למחיקה רכה
        console.log("getAllTraining", data)
        const filtered = data;
        setTrainings(filtered);
      } else {
        setTrainings([]);
      }
    } catch (e) {
      console.error("שגיאה בהבאת האימונים", e);
      setErr("שגיאה בטעינת האימונים");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTraining(); }, [loadTraining]);

  const sortedFilteredTrainings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = q
      ? trainings.filter(s =>
          [s.name, s.info]
            .map(v => String(v ?? "").toLowerCase())
            .join(" ")
            .includes(q)
        )
      : trainings;

    const dirMul = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (sortField === "info") {
        const an = String(a.info ?? "");
      const bn = String(b.info ?? "");
      return an.localeCompare(bn, "he", { sensitivity: "base" }) * dirMul;
      }
      // name (ברירת מחדל)
      const an = String(a.name ?? "");
      const bn = String(b.name ?? "");
      return an.localeCompare(bn, "he", { sensitivity: "base" }) * dirMul;
    });
  }, [trainings, searchTerm, sortField, sortDir]);

  return (
    <div>
      <div >
        <h1 style={{ textAlign: "center"}}>רשימת אימונים</h1>

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

          <button id="page-add-subs"
            style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}
            onClick={() => navigate("/trainings/new")}
          >
            ➕ הוסף אימון
          </button>

          <button
            style={{ backgroundColor: '#374151', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}
            onClick={loadTraining}
            disabled={loading}
          >
            {loading ? "מרענן…" : "רענן"}
          </button>
        </div>
        <div style={{ marginTop: 8, opacity: 0.7 }}>
        סה״כ: {sortedFilteredTrainings && sortedFilteredTrainings.length > 0 ? sortedFilteredTrainings.length: 0} מנויים
      </div>
      </div>

      {err && <div style={{ marginTop: 12, color: "#b91c1c" }}>{err}</div>}
      {!err && loading && <div style={{ marginTop: 12 }}>טוען אימונים</div>}

      {!loading && !err && (
        <table className={`table ${styles.subTable}`} style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>שם</th>
              <th>מידע</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sortedFilteredTrainings.length > 0 ? (
              sortedFilteredTrainings.map((t) => (
                <tr key={t._id}>
                  <td data-label="שם">{t.name}</td>
                  <td data-label="מידע">{t.info}</td>
                  <td data-label="פעולות">
                    <button style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', alignItems: "center" }} 
                    onClick={() => navigate(`/trainings/${t._id}`)}>לחץ לפרטים</button>
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
        label="הוספת אימון"
        onClick={() => {
          console.log('fab click');           // בדיקת קליק
          navigate(`/trainings/new`);
        }}
      />
    </div>
  );
};

export default ViewAllTraining;
