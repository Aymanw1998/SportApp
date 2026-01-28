import React, { useEffect, useMemo, useState } from "react";
import { getAllLesson } from "../../../WebServer/services/lesson/functionsLesson";
import "./SelectSub.css";
import { toast } from "../../../ALERT/SystemToasts";

const monthLabel = (d) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]; // מציגים רק א-ה

const toHHMM = (m) => {
  const mm = Math.max(0, Math.min(24 * 60, m || 0));
  const h = Math.floor(mm / 60);
  const min = mm % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};
const getStart = (l) =>
  l?.date?.startMin ?? ((l?.date?.hh ?? 8) * 60);
const getEnd = (l) =>
  l?.date?.endMin ?? (getStart(l) + 45);

const SelectDaysForTrainee = ({ selectedSubs, selected = [], setSelected, selectedMonth = "current", setSelectedMonth }) => {
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // רדיו: החודש הנוכחי / הבא
  const [startChoice, setStartChoice] = useState("current"); // 'current' | 'next'
  useEffect(() => {setSelected([]); setSelectedMonth(startChoice)}, [startChoice]);
  // טען את כל השיעורים פעם אחת
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getAllLesson();
        if (!res?.ok) throw new Error(res?.message || "load failed");
        setAllLessons(Array.isArray(res.lessons) ? res.lessons : []);
        setErr(null);
      } catch (e) {
        setErr("שגיאה בטעינת השיעורים");
        toast.error("שגיאה בטעינת השיעורים");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedSubs]); // אם סוג המנוי משתנה—רענון

  // חישוב חודש נוכחי/בא
  const now = useMemo(() => new Date(), []);
  const next = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  }, []);

  // פיצול לפי חודש/שנה וסינון לימים א-ה
  const { lessonsThisMonth, lessonsNextMonth } = useMemo(() => {
    const curM = now.getMonth() + 1;
    const curY = now.getFullYear();
    const nxtM = next.getMonth() + 1;
    const nxtY = next.getFullYear();

    const normalizeDay = (d) => (d >= 0 && d <= 6 ? d + 1 : d); // אם נשמר 0..6
    const inWeek = (d) => d >= 1 && d <= 7;

    const cur = [];
    const nxt = [];
    for (const l of allLessons) {
      if (!l?.date) continue;
      const day = Number(l.date.day);
      const month = Number(l.date.month);
      const year = Number(l.date.year);
      if (!inWeek(day)) continue;

      if (month === curM && year === curY) cur.push(l);
      if (month === nxtM && year === nxtY) nxt.push(l);
    }

    // מיון: יום->שעת התחלה
    const sortFn = (a, b) =>
      Number(a.date.day) - Number(b.date.day) ||
      getStart(a) - getStart(b);

    cur.sort(sortFn);
    nxt.sort(sortFn);
    return { lessonsThisMonth: cur, lessonsNextMonth: nxt };
  }, [allLessons, now, next]);

  // בחירה/ביטול בחירה
  const toggleSelect = (lesson) => {
    const exists = selected.some((l) => String(l._id) === String(lesson._id));
    if (exists) {
      setSelected(selected.filter((l) => String(l._id) !== String(lesson._id)));
      return;
    }
    if (selectedSubs?.times_week > selected.length) {
      setSelected([...selected, lesson]);
    } else {
      toast.warn("הגעת למקסימום השיעורים המותרים לפי המנוי");
    }
  };

  const activeLessons =
    startChoice === "current" ? lessonsThisMonth : lessonsNextMonth;

  if (loading)
    return <div className="subs-selection-container">טוען שיעורים…</div>;
  if (err) return <div className="subs-selection-container error">{err}</div>;

  return (
    <div className="subs-root">
      {/* רדיו התחלה מחודש נוכחי/בא */}
      <div className="start-radio">
        <label className="radio-title">מתי להתחיל את המנוי?</label>
        <label className="radio-opt">
          <input
            type="radio"
            name="startMonth"
            value="current"
            checked={startChoice === "current"}
            onChange={() => setStartChoice("current")}
          />
          <span>מהחודש הנוכחי ({monthLabel(now)})</span>
        </label>
        <label className="radio-opt">
          <input
            type="radio"
            name="startMonth"
            value="next"
            checked={startChoice === "next"}
            onChange={() => setStartChoice("next")}
          />
          <span>מהחודש הבא ({monthLabel(next)})</span>
        </label>
      </div>

      {/* כותרת */}
      {activeLessons.length > 0 && (
        <h3 className="subs-section-title">
          {startChoice === "current" ? "שיעורים לחודש הזה" : "שיעורים לחודש הבא"}
        </h3>
      )}

      {/* רשת השיעורים */}
      <div className="subs-selection-container">
        {activeLessons.map((lesson) => {
          const isSelected = selected.some(
            (l) => String(l._id) === String(lesson._id)
          );
          const dayIdx = Math.max(1, Math.min(7, Number(lesson?.date?.day))) - 1;

          return (
            <div
              key={lesson._id}
              className={`sub-card ${isSelected ? "selected" : ""}`}
              onClick={() => toggleSelect(lesson)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleSelect(lesson);
              }}
            >
              <div className="sub-row">
                <span>🧑‍🏫</span>
                <span className="muted">שיעור:</span>
                <span className="strong">{lesson.name}</span>
              </div>

              <div className="sub-row">
                <span>📅</span>
                <span className="muted">יום:</span>
                <span>{days[dayIdx]}</span>
              </div>

              <div className="sub-row">
                <span>🕒</span>
                <span className="muted">שעה:</span>
                <span>
                  {toHHMM(getStart(lesson))}–{toHHMM(getEnd(lesson))}
                </span>
              </div>

              <div className="sub-row">
                <span>👥</span>
                <span className="muted">משתתפים:</span>
                <span>{lesson?.list_trainees?.length ?? 0}</span>
              </div>

              <button
                type="button"
                className="select-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(lesson);
                }}
              >
                {isSelected ? "✅ נבחר" : "בחר שיעור"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectDaysForTrainee;
