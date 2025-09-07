import React, { useEffect, useMemo, useState, useRef } from 'react';
import styles from './ViewAllLesson.module.css';
import { getUserById } from '../../WebServer/services/user/functionsUser';
import { getAllLesson, updateLesson } from '../../WebServer/services/lesson/functionsLesson';
import { useNavigate } from 'react-router-dom';

import Fabtn from "./../Global/Fabtn/Fabtn"
import { toast } from '../../ALERT/SystemToasts';
const ScheduleView = ({
  tableData,
  handleDrop,
  handleMouseEnter,
  handleMouseMove,
  handleMouseLeave,
  canEdit,
  currentMonth,
  currentYear,
  showMyLessons
}) => {
  const [trainerNames, setTrainerNames] = useState({});
  const navigate = useNavigate();

  // טעינת שמות מאמנים פעם אחת לכל מזהה ייחודי
useEffect(() => {
  const fetchTrainerNames = async () => {
    const ids = Array.from(
      new Set(
        tableData.flat().map((cell) => cell?.trainer).filter(Boolean)
      )
    );
    if (!ids.length) { setTrainerNames({}); return; }

    const entries = await Promise.all(ids.map(async (id) => {
      try {
        const res = await getUserById(id);
        if(!res.ok) throw new Error(res.message);
        const u = res?.user;
        const name = [u?.firstname, u?.lastname].filter(Boolean).join(' ') || 'לא ידוע';
        return [id, name];
      } catch {
        return [id, 'שגיאה'];
      }
    }));
    setTrainerNames(Object.fromEntries(entries));
  };
  fetchTrainerNames();
}, [tableData]);

  // מובייל: רשימת שיעורים שטוחה
  const flatLessons = [];
  tableData.forEach((row, hourIndex) => {
    row.forEach((lesson, dayIndex) => {
      if ((!showMyLessons && lesson) || (showMyLessons && lesson && (lesson.trainer === localStorage.getItem("user_id") || lesson.list_trainees.includes(localStorage.getItem("user_id"))))) {
        flatLessons.push({
          _id: lesson._id,
          name: lesson.name,
          day: dayIndex,
          hh: lesson.date.hh,
          max_trainees: lesson.max_trainees,
          num_in_list: lesson.num_in_list,
          trainer: lesson.trainer,
        });
      }
    });
  });

  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'/*,'שישי','שבת'*/]
  const hours = Array.from({ length: 15 }, (_, i) => 8 + i); // 08..22
  const getDayName = (i) => days[i];
  const getHourSlot = (hh) => `${String(hh).padStart(2, '0')}:45 - ${String(hh).padStart(2, '0')}:00`;

// const canEdit = isChange && localStorage.getItem("role") !== 'מתאמן';

  return (
    <div className={styles.scheduleContainer}>

      {/* 📱 מובייל: רשימה לחיצה (ללא DnD) */}
      <div className={styles.mobileView}>
        {localStorage.getItem("role") !== "מתאמן" && <button id="page-add-lesson"className={styles.addBtn} style={{backgroundColor: "greenyellow"}} onClick={() =>navigate(`/lessons/new?month=${currentMonth}&year=${currentYear}`)}>הוסיף שיעור</button>}

        {flatLessons
          .sort((a, b) => (a.day - b.day) || (a.hh - b.hh))
          .map((lesson) => (
            <div
              className={styles.lessonCard}
              key={lesson._id}
              onClick={() => navigate(`/lessons/${lesson._id}`)}
            >
              <p><strong>שיעור:</strong> {lesson.name}</p>
              <p><strong>יום:</strong> {getDayName(lesson.day)}</p>
              <p><strong>שעה:</strong> {getHourSlot(lesson.hh)}</p>
              {/* <p><strong>מאמן:</strong> {trainerNames[lesson.trainer] || "טוען..."}</p> */}
                {/* <p><strong>נרשמים:</strong> {(lesson.list_trainees?.length ?? 0)}/{lesson.max_trainees}</p> */}
            </div>
          ))}
      </div>

      {/* 💻 דסקטופ: טבלת מערכת + DnD */}
      <table className={`${styles.tooltipTable} ${styles.desktopView}`}>
        <thead>
          <tr>
            <th>שעה</th>
            {days.map((day, i) => (
              <th key={i}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hh, rowIdx) => (
            <tr key={rowIdx}>
              <td>{getHourSlot(hh)}</td>
              {tableData[rowIdx]?.map((lesson, colIdx) => {
                const isEmptySlot = !lesson;
                return (
                  <td
                    key={`${rowIdx}-${colIdx}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, rowIdx, colIdx)}
                    onClick={() => {
                      if (!canEdit && !lesson) return;
                      lesson
                        ? navigate(`/lessons/${lesson._id}`)
                        : canEdit && navigate(`/lessons/new?day=${colIdx + 1}&hh=${hh}&month=${currentMonth}&year=${currentYear}`);
                    }}
                    style={{
                      background: canEdit && isEmptySlot ? '#5CE65C' : '',
                      cursor: canEdit && isEmptySlot ? 'pointer' : (lesson ? 'pointer' : 'default'),
                    }}
                  >
                    {                      ((!showMyLessons && lesson) || (showMyLessons && lesson && (lesson.trainer === localStorage.getItem("user_id") || lesson.list_trainees.includes(localStorage.getItem("user_id"))))) ? (
                      <div
                        className={styles.cellContent}
                        draggable={canEdit}               // גרירה רק כאשר אפשר לערוך
                        onDragStart={(e) => {
                          // שומרים מיקום מקור + מזהה שיעור
                          e.dataTransfer.setData('lesson-id', lesson._id);
                          e.dataTransfer.setData('origin-day', String(colIdx));
                          e.dataTransfer.setData('origin-hour', String(rowIdx));
                        }}
                        onMouseEnter={() =>
                          handleMouseEnter(
                            lesson,
                            lesson.date.hh,
                            days[lesson.date.day-1]
                          )
                        }
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      >
                        {lesson.name}
                      </div>
                    ) : (
                      canEdit ? '+' : null
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};


const ViewAllLesson = () => {
  const navigate = useNavigate();
  // עוגן בחלק העליון + שליטה על הצגת ה-FAB
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
  // בראש הקומפוננטה ViewAllLesson:
const [monthOffset, setMonthOffset] = useState(Number(localStorage.getItem("monthOffset")) || 0); // 0=חודש נוכחי, -1=קודם, +1=אחרי
useEffect(()=>console.log("monthOffset", monthOffset),[monthOffset])
const currentMonthInfo = useMemo(() => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  return {
    month: d.getMonth() + 1,               // 1..12
    year:  d.getFullYear(),
    label: `${String(d.getMonth() + 1).padStart(2,'0')}/${d.getFullYear()}`
  };
}, [monthOffset]);

  const me = useMemo(() => {
      try {
          return JSON.parse(localStorage.getItem('user') || 'null');
      } catch {
          return null;
      }
  }, []);

  const generateTimeSlots = (start, end) => {
    const slots = [];
    for (let i = start; i < end; i++) {
      const left = `${String(i).padStart(2,'0')}:45`;
      const right = `${String(i).padStart(2,'0')}:00`;
      slots.push(`${left} - ${right}`);
    }
    return slots;
  };

  const [canEdit, setCanEdit] = useState(localStorage.getItem('canEdit') === 'true');

  useEffect(() => { console.log("canEdit", canEdit);localStorage.setItem('canEdit', String(canEdit)); }, [canEdit]);

  const hours = generateTimeSlots(8, 23);
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'/*,'שישי','שבת'*/]

  const [tableData, setTableData] = useState([]);
    useEffect(() => { console.log("tableData", tableData);}, [tableData]);

  const [tooltipInfo, setTooltipInfo] = useState({ show: false, content: '', x: 0, y: 0 });

  const loadData = async () => {
  const resL = await getAllLesson();
  if(!resL.ok) {
    setTableData(tableData);
    return toast.error("שגיאה בטעינת השיעורים");
  }
  const lessons = resL.lessons;
  const table = Array(hours.length).fill(null).map(() => Array(days.length).fill(null));
  for (const lesson of lessons) {
    const { day, hh, month, year } = lesson.date;          // month = 1..12
    const hourKey = `${String(hh).padStart(2, '0')}:00`;
    const rowIndex = hours.findIndex((h) => h.includes(hourKey));

    if (rowIndex !== -1 && day >= 1 && day <= 5) {
      if (month === currentMonthInfo.month && year === currentMonthInfo.year) {
        table[rowIndex][day - 1] = lesson;
      }
    }
  }
  setTableData(table);
};

  useEffect(() => { loadData(); }, [monthOffset]); // במקום isChange

  const handleMouseEnter = (lesson, hour, day) => {
    if (!lesson) return;
    setTooltipInfo({
      show: true,
      content: (
        <>
          <div style={{ display: 'flex', gap: 4 }}>
            <span>🧑‍🏫</span><span>שיעור:</span><span>{lesson.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <span>🕒</span><span>שעה:</span><span>{hour}:00</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <span>📅</span><span>יום:</span><span>{day}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <span>👨‍👨‍👦‍👦</span><span>משתתפים:</span><span>{lesson.list_trainees?.length ?? 0}</span>
          </div>
        </>
      ),
      x: 0,
      y: 0,
    });
  };

  const handleMouseMove = (e) => {
    setTooltipInfo((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
  };

  const handleMouseLeave = () => {
    setTooltipInfo({ show: false, content: '', x: 0, y: 0 });
  };
  // DnD יעד – מעדכן שעה/יום של שיעור
  const handleDrop = (e, targetRow, targetCol) => {
  if (!canEdit) return;

  const lessonId   = e.dataTransfer.getData('lesson-id');
  const originDay  = parseInt(e.dataTransfer.getData('origin-day'), 10);
  const originHour = parseInt(e.dataTransfer.getData('origin-hour'), 10);
  if (!lessonId || Number.isNaN(originDay) || Number.isNaN(originHour)) return;

  const source = tableData[originHour]?.[originDay];
  if (!source) return;

  // יעד כבר תפוס? אל תאפשר
  const targetCell = tableData[targetRow]?.[targetCol];
  if (targetCell && targetCell._id !== lessonId) {
    toast.warn('יש כבר שיעור בזמן הזה.');
    return;
  }

  const targetHour = parseInt(hours[targetRow].split(':')[0], 10);

  const updatedLesson = {
    ...source,
    date: { ...source.date, day: targetCol, hh: targetHour },
  };

  updateLesson(
    lessonId,
    updatedLesson.name,
    updatedLesson.date,
    updatedLesson.trainer,
    updatedLesson.max_trainees,
    updatedLesson.list_trainees
  )
    .then((res) => res.status === 200 ? loadData() : toast.error('❌ שגיאה בעדכון מועד השיעור'))
    .catch(() => toast.error('❌ שגיאה בעדכון מועד השיעור'));
};


  const getTheMonthYear = (jump) => {
    const d = new Date();
    d.setMonth(d.getMonth() + jump);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const [showMyLessons, setShowMyLessons] = useState(false);
  useEffect(()=>console.log("showMyLessons", showMyLessons),[showMyLessons])
  return (
    <div>
      <span ref={topAnchorRef} className={styles.fabAnchor} aria-hidden="true" />
      <h1 className={styles.title}>מערכת שעות החודש הנבחר ({currentMonthInfo.label})</h1>
      <div className={styles.monthControls}>
        <button
          className={styles.navBtn}
          onClick={() => {localStorage.setItem("monthOffset",(Number(localStorage.getItem("monthOffset"))||0) + 1);setMonthOffset((v) => v + 1)}}
        >
          חודש אחרי
        </button>
        <button
          className={styles.navBtn}
          style={{backgroundColor: "greenyellow"}}
          onClick={() => {localStorage.setItem("monthOffset",Number(0));setMonthOffset((v) => v - v)}}
        >
          חודש נוכחי
        </button>
        <button
          className={styles.navBtn}
          onClick={() => {localStorage.setItem("monthOffset",Number(localStorage.getItem("monthOffset") || 0) - 1);setMonthOffset((v) => v - 1)}}
        >
          חודש קודם
        </button>
      </div>
      <div className={styles.monthControls}>
        {localStorage.getItem("role") !== "מנהל" &&<button
          className={styles.addBtn}
          onClick={() => {setShowMyLessons(!showMyLessons)}}
        >
          {!showMyLessons ? "הצגת השיעורים שלי" : "הצגת כל השיעורים"}
        </button>}
        {localStorage.getItem("role") === "מנהל" && <button
          className={styles.addBtn}
          onClick={() =>{setCanEdit(!canEdit)}}
        >
          {canEdit ? "בטל שינויים" : "אפשיר שינויים"}
        </button>}
      </div>
      <ScheduleView
        canEdit={canEdit}
        currentMonth={currentMonthInfo.month}
        currentYear={currentMonthInfo.year}
        tableData={tableData}
        showMyLessons={showMyLessons}
        handleDrop={handleDrop}
        handleMouseEnter={handleMouseEnter}
        handleMouseMove={handleMouseMove}
        handleMouseLeave={handleMouseLeave}
      />

      {tooltipInfo.show && (
        <div
          style={{
            top: tooltipInfo.y,
            left: tooltipInfo.x,
            position: 'absolute',
            background: 'black',
            color: 'white',
            padding: '10px',
            border: '1px solid black',
            borderRadius: 5,
            pointerEvents: 'none',
          }}
        >
          {tooltipInfo.content}
        </div>
      )}

    {/* כפתור רודף – מופיע רק כשגוללים למטה וגם רק כשאפשר לערוך */}
      <Fabtn
        anchor="#page-add-lesson"              // מרחרח את הכפתור הזה
        visible={showFab}
        label="הוספת שיעור"
        onClick={() => {
          console.log('fab click');           // בדיקת קליק
          navigate(`/lessons/new?month=${currentMonthInfo.month}&year=${currentMonthInfo.year}`);
        }}
      />

    </div>
  );
};


export default ViewAllLesson;
