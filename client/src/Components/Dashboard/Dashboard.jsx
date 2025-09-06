import React, { useEffect, useMemo, useState } from 'react';
import styles from './Dashboard.module.css';
import { useNavigate } from 'react-router-dom';

// ⚠ עדכן נתיבים לפי הפרויקט שלך
import { getAllUser } from '../../WebServer/services/user/functionsUser';
import { getAllLesson } from '../../WebServer/services/lesson/functionsLesson';
import { getMe, logout as doLogout } from '../../WebServer/services/auth/fuctionsAuth';

const dayName = (d) => ['ראשון','שני','שלישי','רביעי','חמישי'/*,'שישי','שבת'*/][Number(d) || 0];

function LessonsTable({ lessons, usersById }) {
  const rows = useMemo(() => {
    return [...lessons]
      .sort((a, b) => (a?.date?.day - b?.date?.day) || (a?.date?.hh - b?.date?.hh))
      .slice(0, 10);
  }, [lessons]);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.lessonsTable}>
        <thead>
          <tr>
            <th>יום</th>
            <th>שעה</th>
            <th>מאמן</th>
            <th>רישומים</th>
            <th>מקסימום</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lesson) => {
            const trainer = usersById[lesson.trainer] || null;
            return (
              <tr key={lesson._id}>
                <td>{dayName(lesson?.date?.day)}</td>
                <td>{String(lesson?.date?.hh ?? '').padStart(2, '0')}:00</td>
                <td>{trainer ? `${trainer.firstname} ${trainer.lastname}` : '—'}</td>
                <td>{lesson?.list_trainees?.length ?? 0}</td>
                <td>{lesson?.max_trainees ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UsersCardBoard({ users }) {
  return (
    <div className={styles.usersGrid}>
      {users.slice(0, 5).map((user) => (
        <div key={user._id} className={styles.card}>
          <h4 className={styles.cardTitle}>{user.firstname} {user.lastname}</h4>
          <div className={styles.cardRow}><span>ת.ז.: </span><span>{user.tz}</span></div>
          <div className={styles.cardRow}><span>מין: </span><span>{user.gender}</span></div>
          <div className={styles.cardRow}><span>תפקיד: </span><span>{user.role}</span></div>
          <button className={styles.cardButton}>Contact</button>
        </div>
      ))}
    </div>
  );
}

function MessageBoxSystem() {
  const navigate = useNavigate();
  const today = new Date();
  const isOpenDay = today.getDate() === today.getDate();

  return (
    <div className={styles.systemMessage}>
      <strong>📌 תזכורת:</strong> ההרשמה לחודש הקרוב נפתחה!{' '}
      {isOpenDay ? (
        <button
        //   className={styles.ctaBtn}
            style={{
                background: "#5CE65C"
            }}
          onClick={() => navigate('/regnextmonth')}
        >
          הרשם למערכת של החודש הבאה
        </button>
      ) : (
        <>יפתח בכל 3 לחודש</>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);

  const [usersAll, setUsersAll] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const loadGetMe = async() => {
    let alive = true;
    try {
    const u = await getMe();       // { user: ... } → בשירות החזר רק user

    if (!alive) return;
    setMe(u);
    setRole(u?.role || localStorage.getItem('role') || null);
    } catch (e) {
    if (!alive) return;

    setErr('נדרשת התחברות');
    console.log("err", err);
    navigate('/', { replace: true });
    }
  }

  const loadData = async() => {
    let alive = true;
      try {
        setLoading(true);
        setErr(null);
        const resL = await getAllLesson();
        console.log("resL", resL);
        console.log("lessons", resL);
        if(!resL.ok) throw new Error(resL.message);
        if (!alive) return;
        const l = resL.lessons;
        const lessonsArr = Array.isArray(l) ? l : [];
        setLessons(lessonsArr);
        console.log("lessonsArr", lessonsArr);
        const res = await getAllUser();
        console.log("u", res);
        if (!alive) return;
        if(!res.ok) throw new Error(res?.message);
        const usersArr = Array.isArray(res.users) ? res.users : [];
        setUsersAll(usersArr);
        console.log("usersArr", usersArr);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr(e.message || 'שגיאה בטעינת נתונים');
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
  }
  // טוען שיעורים + משתמשים
  useEffect(() => {
    loadData();
    loadGetMe();
  }, []);

  const usersById = useMemo(() => {
    const map = Object.create(null);
    for (const u of usersAll) map[u._id] = u;
    return map;
  }, [usersAll]);

  if (loading && !me) return <div className={styles.title}>טוען…</div>;
  if (err) return <div className={styles.title}>{err}</div>;
  if (!me) return null;

  const cardsForAdmin = usersAll.filter((u) => u._id !== me._id).slice(0, 5);

  return (
    <>
      <h1 className={styles.title}>דף ראשי</h1>

      {role === 'מנהל' ? (
        <>
          <h2 className={styles.h2}>משתמשים</h2>
          <UsersCardBoard users={cardsForAdmin} />
        </>
      ) : (
        <>
          <h2 className={styles.h2}>הודעות מערכת</h2>
          <MessageBoxSystem />
        </>
      )}

      <h2 className={styles.h2}>שיעורים</h2>
      <LessonsTable lessons={lessons} usersById={usersById} />
    </>
  );
}
