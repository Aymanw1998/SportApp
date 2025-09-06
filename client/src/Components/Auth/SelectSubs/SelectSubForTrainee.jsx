import React, { useEffect, useState } from "react";
import { getAll } from "../../../WebServer/services/subs/functionsSubs";
import "./SelectSub.css";

const SelectSubForTrainee = ({ selectedSub, setSelectedSub, wallet = 0, publicMode = false}) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await getAll({publicMode});
        if (!res.ok) throw new Error(res.message);
        const subs = res.subs;
        const list = Array.isArray(subs) ? subs : [];
        const affordable = list.filter((item) => Number(item.price) <= Number(wallet));
        if (alive) setSubs(affordable);
      } catch (e) {
        console.error("שגיאה בטעינת מנויים", e);
        if (alive) setErr("שגיאה בטעינת מנויים");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [wallet]); // רענון כשיתרת הארנק משתנה

  const toggleSelect = (sub) => {
    setSelectedSub((prev) => (prev?._id === sub._id ? null : sub));
  };

  if (loading) return <div className="subs-selection-container">טוען מנויים…</div>;
  if (err) return <div className="subs-selection-container error">{err}</div>;
  if (!subs.length) return <div className="subs-selection-container empty">אין מנויים זמינים לפי היתרה ({wallet} ₪)</div>;

  return (
    <div className="subs-selection-container">
      {subs.map((sub) => {
        const isSelected = selectedSub?._id === sub._id;
        return (
          <div
            key={sub._id}
            className={`sub-card ${isSelected ? "selected" : ""}`}
            onClick={() => toggleSelect(sub)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSelect(sub);
            }}
          >
            <h3>{sub.name}</h3>
            <p>⏳ {sub.months} חודשים</p>
            <p>📅 {sub.times_week} פעמים בשבוע</p>
            <p>💰 {sub.price} ₪</p>
            <button
              type="button"
              className="select-btn"
              onClick={(e) => { e.stopPropagation(); toggleSelect(sub); }}
            >
              {isSelected ? "✅ נבחר" : "בחר מנוי"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SelectSubForTrainee;
