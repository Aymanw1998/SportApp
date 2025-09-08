import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLesson, updateLesson } from '../../WebServer/services/lesson/functionsLesson';
import { getUserById } from '../../WebServer/services/user/functionsUser';
import { getMe } from '../../WebServer/services/auth/fuctionsAuth';
import { getOne as getSubById } from '../../WebServer/services/subs/functionsSubs';
import styles from './EditLesson.module.css';
import { toast } from '../../ALERT/SystemToasts';

const daysNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'/*,'שישי','שבת'*/];
const dayLetter = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const hourSlot = (hh) => `${String(hh).padStart(2,'0')}:00 - ${String(hh).padStart(2,'0')}:45`;

export default function RegNextMonth() {
  
  const navigate = useNavigate();
  const [err, setErr] = useState();
  const [lessons, setLessons] = useState(null);        // כל השיעורים להצגה/עריכה
  useEffect(()=>console.log("lessons", lessons), [lessons]);
  const [trainerNames, setTrainerNames] = useState({}); // מפה: trainerId -> "שם פרטי שם משפחה"
  const [me, setMe] = useState(null);
  const [sub, setSub] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

    const loadGetMe = async() => {
        let alive = true;
        try {
        const u = await getMe();       // { user: ... } → בשירות החזר רק user
        setMe(u);
        return u;
        } catch (e) {
        if (!alive) return;
        console.log("err", e)
        setErr('נדרשת התחברות');
        console.log("err", err);
        navigate('/', { replace: true });
        }
    }

    const loadGetMeAndSub = async() => {
        const usr = await loadGetMe();
        if (!usr?.tz) return navigate(-1);
        try {
            // טען מנוי שלו (אם יש)
            const subId = usr?.subs?.id;
            if (subId) {
                try {
                    const resS = await getSubById(subId);
                    if(!resS.ok) throw new Error(resS.message)
                    setSub(resS.sub);
                } catch {
                    setSub(null);
                }
            } else {
            setSub(null);
            }
        } catch {
            navigate(-1);
        }
    }
  // --- טעינת משתמש מחובר + מנוי ---
  useEffect(() => {
    loadGetMeAndSub();
  }, []);

  // --- טעינת שיעורים (ברירת מחדל: “החודש הנוכחי” במודל שלך שהוא לוגיקת next) ---
  useEffect(() => {
    (async () => {
      try {
        const resL = await getAllLesson();
        console.log("resL");
        if(!resL.ok) throw new Error(resL.message);
        const now = new Date();
        const list = resL.lessons
          .filter((l) => {
            return l.date.month-2 === now.getMonth() && l.date.year === now.getFullYear();
          })
          .sort((a, b) => (a.date.day - b.date.day) || (a.date.hh - b.date.hh));

        setLessons(list);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // --- טעינת שמות מאמנים באופן יעיל ---
  useEffect(() => {
    (async () => {
      if(!lessons || lessons.length <=0) return;
      const setIds = new Set(lessons.map((l) => l.trainer).filter(Boolean));
      if (!setIds.size) return setTrainerNames({});

      const entries = await Promise.all(
        Array.from(setIds).map(async (id) => {
          try {
            const resR = await getUserById(id);
            if(!resR.ok) throw new Error(resR.message);
            const u = resR.user;
            return [id, u ? `${u.firstname || ''} ${u.lastname || ''}`.trim() : 'לא ידוע'];
          } catch (err){
            return [id, 'לא ידוע'];
          }
        })
      );

      setTrainerNames(Object.fromEntries(entries));
    })();
  }, [lessons]);

  // --- קיבוץ שיעורים לפי יום עבור ההצגה ---
  const groupedByDay = useMemo(() => {
  // תמיד נצא עם 7 מערכים ריקים כברירת מחדל
  const groups = Array.from({ length: 7 }, () => []);

  // אם אין שיעורים – נחזיר את המערך הריק (ולא undefined)
  if (!Array.isArray(lessons) || lessons.length === 0) return groups;

  for (const l of lessons) {
    const day = Number(l?.date?.day); // צפוי 1..7
    const hh  = Number(l?.date?.hh);

    if (Number.isInteger(day) && day >= 1 && day <= 7) {
      groups[day - 1].push(l);        // ← אינדקס 0..6
    }
  }

  // מיון כל יום לפי שעה
  for (const arr of groups) {
    arr.sort(
      (a, b) => (Number(a?.date?.hh) || 0) - (Number(b?.date?.hh) || 0)
    );
  }

  return groups;
}, [lessons]);


  // כמה שיעורים סומנו עבורי (לפי מצב נוכחי)
  const selectedCount = useMemo(() => {
    if (!me?._id) return 0;
    if(!lessons) return 0;
    return lessons.reduce((acc, l) => acc + (l.list_trainees?.includes(me._id) ? 1 : 0), 0);
  }, [lessons, me]);

  // חיפוש טקסטואלי
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const matchSearch = (l) => {
    const trainer = trainerNames[l.trainer] || '';
    const tokens = [
      l.name || '',
      dayLetter[l.date.day] || '',
      hourSlot(l.date.hh),
      trainer,
      `${(l.list_trainees?.length || 0)}/${l.max_trainees || 0}`,
    ]
      .join(' ')
      .toLowerCase();

    return tokens.includes(normalizedSearch);
  };

  const toggleLesson = (lesson) => {
    if (!me?._id) return;
    const inList = lesson.list_trainees?.includes(me._id);
    const full = (lesson.list_trainees?.length || 0) >= (lesson.max_trainees || 0);

    // לא לאפשר הוספה אם מלא ולא הייתי בפנים
    if (!inList && full) return;

    // מגבלת times_week לפי המנוי
    const maxPerWeek = Number(sub?.times_week || 0);
    if (!inList && maxPerWeek && selectedCount >= maxPerWeek) {
      toast.warn('הגעת למקסימום השיעורים המותרים לפי המנוי');
      return;
    }

    setLessons((prev) =>
      prev.map((l) =>
        l._id === lesson._id
          ? {
              ...l,
              list_trainees: inList
                ? l.list_trainees.filter((id) => id !== me._id)
                : [...(l.list_trainees.length > 0 && l.list_trainees[0] != null ? l.list_trainees : []), me._id],
            }
          : l
      )
    );
  };

  const saveAll = async () => {
    try {
      // await Promise.all(
      //   lessons.map(async (l) => await updateLesson(l._id, l, {confirm : false})) // שמירה “ברוטאלית” לכל השיעורים
      // );
      for(const l of lessons){
        await updateLesson(l._id, l, {confirm : false}).then((d) => console.log("update lesson success")).catch((err) => console.error(err))
      }
      toast.success('✅ השינויים נשמרו');
      navigate(-1);
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בשמירה');
    }
  };
  
  const view = () => {
    if(!lessons) return <h1>טוען שיעורים...</h1>
    else if(lessons && lessons.length <= 0) return <h1>עדיין אין שיעורים לחודש הבא</h1>
    else {
      return (
        <div>
          <h4>הרשמה למערכת של החודש הבאה</h4>
          <input
            type="text"
            placeholder="חיפוש ..."
            className={styles.searchInput}
                        style={{
              width: "80%", padding: "10px", margin: "10px", marginBottom: "20px",fontSize: "14px", 
              border: "1px solid #ccc",borderRadius: "8px"
            }}

            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
              
          <div>
            {groupedByDay && groupedByDay.map((list, dayIdx) => {
              const filtered = normalizedSearch ? list.filter(matchSearch) : list;
              if (!filtered.length) return null;
              return (
                <div key={dayIdx} style={{ marginBottom: 16 }}>
                  <h1 style={{ margin: '8px 0' }}>{daysNames[dayIdx]}</h1>
                  {filtered && filtered.map((lesson) => {
                    const alreadyIn = !!lesson.list_trainees?.includes(me?._id);
                    const isFull = (lesson.list_trainees?.length || 0) >= (lesson.max_trainees || 0);
                    const trainer = trainerNames[lesson.trainer] || 'טוען...';
                    return (
                      <label
                        key={lesson._id}
                        style={{
                          display: 'block',
                          borderRadius: 10,
                          border: '1px solid #ccc',
                          margin: '10px 0',
                          padding: 10,
                          background: alreadyIn ? '#ecfeff' : '#fff',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={alreadyIn}
                          disabled={!alreadyIn && isFull}
                          onChange={() => toggleLesson(lesson)}
                          style={{ marginInlineEnd: 8 }}
                        />
                        <div><strong>שיעור:</strong> {lesson.name}</div>
                        <div><strong>יום:</strong> {dayLetter[lesson.date.day]}</div>
                        <div><strong>שעה:</strong> {hourSlot(lesson.date.hh)}</div>
                        {/* <div><strong>מאמן:</strong> {trainer}</div> */}
                        <div>
                          {/* <strong>נרשמים:</strong> {(lesson.list_trainees?.length || 0)}/{lesson.max_trainees} */}
                        </div>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className={styles.buttonRow}>
            {lessons.filter(matchSearch).length > 0 ? <><button
              type="button"
              style={{ background: 'green' }}
              className="select-btn"
              onClick={saveAll}
            >
              שמור שינויים
            </button>
            <button
              type="button"
              style={{ background: 'red' }}
              className="select-btn"
              onClick={() => navigate(-1)}
            >
              ביטול
            </button></>: <button type="button" style={{ background: "#6b7280" }} onClick={() => navigate("/subs")}>
          חזרה לדף הקודם</button>}
          </div>
        </div>
      );
    }
  }
  
  return(
    <>
      <h1 style={{textAlign: "center", borderBottom: "8px solid #080707ff"}}>רישום למערכת שעות </h1>
      <center>{view()}</center>
    </>
  )
}
