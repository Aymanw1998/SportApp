import React, { useEffect, useMemo, useState, useRef } from 'react';
import styles from './ViewAllLesson.module.css';
import { getUserById } from '../../WebServer/services/user/functionsUser';
import { copyLessonsMonth, deleteLessonsPerMonth, getAllLesson, updateLesson } from '../../WebServer/services/lesson/functionsLesson';
import { useNavigate } from 'react-router-dom';
import Fabtn from "./../Global/Fabtn/Fabtn";
import { toast } from '../../ALERT/SystemToasts';

/* === helpers === */
const BASE_MIN = 8 * 60;   // 08:00
const END_MIN  = 23 * 60;  // 22:00
const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי'];

const toHHMM = (min) => {
  const m = Math.max(0, Math.min(min ?? 0, 24*60));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
};
const minuteToPx = (min) => Math.max(0, Math.min((min ?? BASE_MIN) - BASE_MIN, END_MIN - BASE_MIN));
const getStart = (l) => l?.date?.startMin ?? ((l?.date?.hh ?? 8) * 60);
const getEnd   = (l) => l?.date?.endMin   ?? (getStart(l) + 45);

/* === דסקטופ: לוח 5 ימים עם כותרות === */
function DesktopTimeline({ lessons, canEdit, currentMonth, currentYear, showMyLessons, navigate, onReload, onHover }) {
  // קיבוץ לימים (א׳–ה׳)
  const byDay = useMemo(() => {
    const map = {1:[],2:[],3:[],4:[],5:[]}; // 1=א׳ .. 5=ה׳ (+6 לשמור מקום)
    const uid = localStorage.getItem('user_id');

    for (const l of (lessons || [])) {
      if (!l?.date) continue;
      const month = Number(l.date.month), year = Number(l.date.year);
      let day     = Number(l.date.day);

      if (month !== currentMonth || year !== currentYear) continue;
      if (!(day >= 1 && day <= 5)) continue;

      const isMine = String(l.trainer) === String(uid) || (l.list_trainees || []).map(String).includes(String(uid));
      console.log("showMyLessons check", day, showMyLessons, isMine);
      if (!showMyLessons || (showMyLessons && isMine)) map[day].push(l);
    }
    console.log("byDay map", map);
    return map;
  }, [lessons, currentMonth, currentYear, showMyLessons]);

  const hourMarks = Array.from({length: 16}, (_, i) => 8 + i); // 08..22

  const rescheduleLesson = async (lesson, day, targetStartMin) => {
    console.log("reschedule", lesson, day, targetStartMin);
    const dur = Math.max(1, getEnd(lesson) - getStart(lesson));
    const newStart = Math.max(BASE_MIN, Math.min(targetStartMin, END_MIN - 1));
    const newEnd   = Math.min(newStart + dur, 24*60);

    try {
      const res = await updateLesson(
        lesson._id,
        {name: lesson.name,
        date: { day, month: currentMonth, year: currentYear, startMin: newStart, endMin: newEnd },
        trainer: lesson.trainer,
        max_trainees: lesson.max_trainees,
        list_trainees: lesson.list_trainees}
      );
      if (res?.status === 200 || res?.ok) {
        toast.success('עודכן בהצלחה');
        onReload?.();
      } else {
        toast.error(res?.message || 'שגיאה בעדכון');
      }
    } catch {
      toast.error('שגיאה בעדכון');
    }
  };

  return (
    <>
      {/* שורת כותרות */}
      <div className={styles.timelineGrid}>
        <div className={styles.headerSpacer} />
        {dayNames.map((dn, i) => (
          <div key={i} className={styles.dayHeader}>{dn}</div>
        ))}

        {/* עמודת תוויות שעות */}
        <div className={styles.hoursGutter}>
          {hourMarks.map(h => (
            <div key={h}>
              <div className={styles.hourLine} style={{ top: `${(20+h*60 - BASE_MIN)}px` }} />
              <div className={styles.hourLabel} style={{ top: `${(20+h*60 - BASE_MIN)}px` }}>
                {String(h).padStart(2,'0')}:00
              </div>
            </div>
          ))}
        </div>

        {/* חמשת הימים */}
        {dayNames.map((_dn, idx) => {
          const day = idx ;
          return (
            <div
              key={day}
              className={styles.dayCol}
              onClick={(e) => {
                if (!canEdit) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                const clickedMin = BASE_MIN + Math.round(offsetY);
                navigate(`/lessons/new?day=${day}&month=${currentMonth}&year=${currentYear}&startMin=${clickedMin}`);
              }}
              onDragOver={(e) => { if (canEdit) e.preventDefault(); }}
              onDrop={(e) => {
                if (!canEdit) return;
                const lessonId = e.dataTransfer.getData('lesson-id');
                if (!lessonId) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                const targetStartMin = BASE_MIN + Math.round(offsetY);

                const all = Object.values(byDay).flat();
                const l   = all.find(x => String(x._id) === String(lessonId));
                if (!l) return;

                rescheduleLesson(l, day, targetStartMin);
              }}
            >
              {(byDay[day+1] || []).map(l => {
                const top    = 30 + minuteToPx(getStart(l));
                const height = Math.max(10, getEnd(l) - getStart(l));
                return (
                  <div
                    key={l._id}
                    className={styles.lessonBlock}
                    style={{ top, height }}
                    draggable={canEdit}
                    onClick={(ev) => { ev.stopPropagation(); navigate(`/lessons/${l._id}`); }}
                    onDragStart={(e) => e.dataTransfer.setData('lesson-id', l._id)}
                    onMouseEnter={() => onHover?.(l, `${toHHMM(getStart(l))}–${toHHMM(getEnd(l))}`, dayNames[day])}
                    onMouseMove={(e) => onHover?.('__move__', e.clientX, e.clientY)}
                    onMouseLeave={() => onHover?.()}
                  >
                    <div><b>{l.name}</b></div>
                    <div>{toHHMM(getStart(l))}–{toHHMM(getEnd(l))}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* === מובייל + מעטפת === */
function ScheduleView({ lessons, canEdit, currentMonth, currentYear, showMyLessons, navigate, onReload, setTooltip }) {
  const [trainerNames, setTrainerNames] = useState({});

  useEffect(() => {
    // טעינת שמות מאמנים (אופציונלי)
    const load = async () => {
      const ids = Array.from(new Set((lessons || []).map(l => l?.trainer).filter(Boolean).map(String)));
      const pairs = await Promise.all(ids.map(async id => {
        try {
          const res = await getUserById(id);
          if (!res?.ok) throw 0;
          const u = res.user || {};
          return [id, [u.firstname, u.lastname].filter(Boolean).join(' ') || 'לא ידוע'];
        } catch { return [id, 'שגיאה']; }
      }));
      setTrainerNames(Object.fromEntries(pairs));
    };
    load();
  }, [lessons]);

  const filtered = useMemo(() => {
    console.log("filtering lessons", {lessons, currentMonth, currentYear, showMyLessons});
    const uid = localStorage.getItem('user_id');
    return (lessons || [])
      .filter(l => l?.date?.month === currentMonth && l?.date?.year === currentYear)
      .filter(l => {
        if (!showMyLessons) return true;
        const isMine = String(l.trainer) === String(uid) || (l.list_trainees || []).map(String).includes(String(uid));
        return isMine;
      })
      .sort((a,b) => (a.date.day - b.date.day) || (getStart(a) - getStart(b)));
  }, [lessons, currentMonth, currentYear, showMyLessons]);

  return (
    <div className={styles.scheduleContainer}>
      {/* מובייל */}
      <div className={styles.mobileView}>
        {localStorage.getItem("role") !== "מתאמן" && (
          <button id="page-add-lesson" className={styles.addBtn}
                  style={{backgroundColor: "greenyellow"}}
                  onClick={() => navigate(`/lessons/new?month=${currentMonth}&year=${currentYear}`)}>
            הוסף שיעור
          </button>
        )}

        {filtered.map(l => (
          <div key={l._id} className={styles.lessonCard}
               onClick={() => navigate(`/lessons/${l._id}`)}
               onMouseEnter={() => setTooltip?.({ show:true, content:(
                 <>
                   <div style={{display:'flex',gap:4}}><span>🧑‍🏫</span><span>שיעור:</span><span>{l.name}</span></div>
                   <div style={{display:'flex',gap:4}}><span>🕒</span><span>שעה:</span><span>{toHHMM(getStart(l))}–{toHHMM(getEnd(l))}</span></div>
                   <div style={{display:'flex',gap:4}}><span>📅</span><span>יום:</span><span>{dayNames[(l.date.day)-1]}</span></div>
                 </>
               )})}
               onMouseLeave={() => setTooltip?.({ show:false })}
          >
            <p><strong>שיעור:</strong> {l.name}</p>
            <p><strong>יום:</strong> {dayNames[(l.date.day)-1]}</p>
            <p><strong>שעה:</strong> {toHHMM(getStart(l))}–{toHHMM(getEnd(l))}</p>
            {/* <p><strong>מאמן:</strong> {trainerNames[l.trainer] || 'טוען...'}</p> */}
          </div>
        ))}
      </div>

      {/* דסקטופ */}
      <div className={styles.desktopView}>
        <DesktopTimeline
          lessons={lessons}
          canEdit={canEdit}
          currentMonth={currentMonth}
          currentYear={currentYear}
          showMyLessons={showMyLessons}
          navigate={navigate}
          onReload={onReload}
          onHover={(lOrCmd, time, day) => {
            if (lOrCmd === '__move__') return; // מטופל מלמעלה
            if (!lOrCmd) return setTooltip({ show:false });
            setTooltip({
              show: true,
              content: (
                <>
                  <div style={{display:'flex',gap:4}}><span>🧑‍🏫</span><span>שיעור:</span><span>{lOrCmd.name}</span></div>
                  <div style={{display:'flex',gap:4}}><span>🕒</span><span>שעה:</span><span>{time}</span></div>
                  <div style={{display:'flex',gap:4}}><span>📅</span><span>יום:</span><span>{day}</span></div>
                  <div style={{display:'flex',gap:4}}><span>👨‍👨‍👦‍👦</span><span>משתתפים:</span><span>{lOrCmd.list_trainees?.length ?? 0}</span></div>
                </>
              )
            });
          }}
        />
      </div>
    </div>
  );
}

/* === עמוד הראשי === */
export default function ViewAllLesson() {
  const navigate = useNavigate();

  const topAnchorRef = useRef(null);
  const [showFab, setShowFab] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setShowFab(!entry.isIntersecting), { root: null });
    if (topAnchorRef.current) io.observe(topAnchorRef.current);
    return () => io.disconnect();
  }, []);

  const [monthOffset, setMonthOffset] = useState(Number(localStorage.getItem("monthOffset")) || 0);
  const currentMonthInfo = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() + monthOffset);
    return { month: d.getMonth()+1, year: d.getFullYear(), label: `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` };
  }, [monthOffset]);

  const [canEdit, setCanEdit] = useState(true);
  useEffect(() => { localStorage.setItem('canEdit', String(canEdit)); }, [canEdit]);

  const [isLoading, setIsLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  useEffect(() => console.log("lessons ", lessons), [lessons]);
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await getAllLesson();
      console.log("all lessons", res);
      if (!res?.ok) throw new Error(res?.message || 'Load failed');
      setLessons(Array.isArray(res.lessons) ? res.lessons : []);
    } catch (e) {
      toast.error('שגיאה בטעינת השיעורים');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { loadData(); }, [monthOffset]);

  const [tooltipInfo, setTooltipInfo] = useState({ show:false, content:'', x:0, y:0 });
  const onMouseMove = (e) => setTooltipInfo(prev => ({ ...prev, x: e.clientX, y: e.clientY }));

  const [showMyLessons, setShowMyLessons] = useState(localStorage.getItem("role") !== "מנהל");

  return (
    <div>
      <span ref={topAnchorRef} className={styles.fabAnchor} aria-hidden="true" />
      <h1 className={styles.title}>מערכת שעות החודש הנבחר ({currentMonthInfo.label})</h1>

      <div className={styles.monthControls}>
        <button className={styles.navBtn}
          onClick={() => { const next=(Number(localStorage.getItem("monthOffset"))||0)+1; localStorage.setItem("monthOffset",next); setMonthOffset(v=>v+1); }}>
          חודש אחרי
        </button>
        <button className={styles.navBtn} style={{backgroundColor: "greenyellow"}}
          onClick={() => { localStorage.setItem("monthOffset",0); setMonthOffset(0); }}>
          חודש נוכחי
        </button>
        <button className={styles.navBtn}
          onClick={() => { const prev=(Number(localStorage.getItem("monthOffset"))||0)-1; localStorage.setItem("monthOffset",prev); setMonthOffset(v=>v-1); }}>
          חודש קודם
        </button>
      </div>

      <div className={styles.monthControls}>
          {localStorage.getItem("role") === "מנהל" && (
            <>
              {/* <button className={styles.addBtn} onClick={() => setCanEdit(!canEdit)}>
                {canEdit ? "בטל שינויים" : "אפשיר שינויים"}
              </button> */}

              <button
                className={styles.addBtn}
                style={{ background: "#60d394" }} // ירוק עדין
                onClick={async () => {
                  try {
                    // אפשר גם לפתוח מודאל ולתת לבחור אופציות; כאן דיפולט:
                    const now = new Date();
                    const params = {
                      fromMonth: now.getMonth()+1,
                      fromYear:  now.getFullYear(),
                      // אפשר להשאיר ריק – השרת יחשב month+1/year
                      overwrite: false,       // true כדי למחוק כפילויות ביעד
                      keepTrainees: false,    // true כדי לשכפל משתתפים
                      // trainerOnly: localStorage.getItem('user_id'), // אופציונלי: רק המאמן הנוכחי
                    };
                    const res = await copyLessonsMonth(params);
                    if (res.ok) {
                      toast.success(`הועתקו ${res.copied || 0} שיעורים. דולגו ${res.skipped || 0}.`);
                      // רענון
                      await loadData();
                      // מעבר לחודש הבא כדי לראות:
                      const next = (Number(localStorage.getItem("monthOffset"))||0) + 1;
                      localStorage.setItem("monthOffset", next);
                      setMonthOffset(v => v + 1);
                    } else {
                      toast.error(res.message || 'שגיאה בהעתקה');
                    }
                  } catch (e) {
                    console.error("copy error", e);
                    toast.error('שגיאה בהעתקה');
                  }
                }}
              >
                העתק לחודש הבא
              </button>

              <button
                className={styles.addBtn}
                style={{ background: "#f77676" }} // אדום עדין
                onClick={async () => {
                  if (!window.confirm('האם למחוק את כל השיעורים בחודש זה? פעולה זו לא ניתנת לביטול.')) return;
                  try {
                    const res = await deleteLessonsPerMonth(currentMonthInfo.month, currentMonthInfo.year);
                    if (res.ok) {
                      toast.success(`נמחקו ${res.deleted || 0} שיעורים.`);
                      // רענון
                      await loadData();
                    } else {
                      toast.error(res.message || 'שגיאה במחיקה');
                    }
                  } catch (e) {
                    console.error("delete error", e);
                    toast.error('שגיאה במחיקה');
                  }
                }}
              >
                מחק כל השיעורים בחודש
              </button>
            </>
          )}

      </div>

      {isLoading ? (
        <div className={styles.loaderWrap}>
          <div />{/* spacer */}
          {[...Array(5)].map((_,i)=><div key={i} className={styles.loaderBox} />)}
        </div>
      ) : (
        <ScheduleView
          lessons={lessons}
          canEdit={canEdit}
          currentMonth={currentMonthInfo.month}
          currentYear={currentMonthInfo.year}
          showMyLessons={showMyLessons}
          navigate={navigate}
          onReload={loadData}
          setTooltip={(t)=> setTooltipInfo(prev => ({ ...prev, ...t }))}
        />
      )}

      {tooltipInfo.show && (
        <div
          style={{
            top: tooltipInfo.y, left: tooltipInfo.x,
            position: 'absolute', background: 'black', color: 'white',
            padding: 10, border: '1px solid black', borderRadius: 5,
            pointerEvents: 'none', zIndex: 9999,
          }}
          onMouseMove={onMouseMove}
        >
          {tooltipInfo.content}
        </div>
      )}

      <Fabtn
        anchor="#page-add-lesson"
        visible={showFab}
        label="הוספת שיעור"
        onClick={() => navigate(`/lessons/new?month=${currentMonthInfo.month}&year=${currentMonthInfo.year}`)}
      />
    </div>
  );
}
