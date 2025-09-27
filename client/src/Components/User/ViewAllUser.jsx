// 📄 src/components/user/ViewAllUser.jsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUser, changeStatus, deleteUser } from '../../WebServer/services/user/functionsUser';
import styles from './ViewAllUser.module.css';

import Fabtn from "./../Global/Fabtn/Fabtn";

// שימוש ברכיב הסגמנט (הקפד על הנתיב):
import UserStatusFilter from './UserStatusFilter';
import { toast } from '../../ALERT/SystemToasts';

// ---------- כרטיסיות ----------
function UsersCardBoard({ users, }) {
  if (!users?.length) {
    return (
      <div style={{ textAlign: 'center', padding: 24, opacity: 0.7 }}>
        אין משתמשים להצגה
      </div>
    );
  }
  const navigate = useNavigate();
  const onEdit = (user) => navigate(`/users/${user.tz}`);
  const onWaitingToActive = async (user) => {
    try {
    await changeStatus(user.tz, 'waiting', 'active');
    window.location.reload();
    toast.success("המשתמש אושר בהצלחה");
    } catch(err) { 
      console.error(err); 
      toast.error("שגיאה באישור המשתמש");
    }
  }
  const onNoActiveToActive = async (user) => {
    try {
    await changeStatus(user.tz, 'noActive', 'active');
    window.location.reload();
    toast.success("המשתמש שוחזר בהצלחה");
    } catch(err) { 
      console.error(err); 
      toast.error("שגיאה בשחזור המשתמש");
    }
  }
  const deleteU = async (user, from) => {
    try{
    console.log("deleteU", user.tz, from);
    await deleteUser(user.tz, from);
    window.location.reload();
    toast.success("המשתמש נמחק בהצלחה");
    } catch(err) { 
      console.error(err); 
      toast.error("שגיאה במחיקת המשתמש");
    }
  }
  return (
    <div className={styles.usersGrid}>
      {users.map((user) => (
        <div
          key={user._id}
          className={
            user.room === 'waiting'
              ? styles.cardWaiting
              : user.room === 'noActive'
              ? styles.cardNoActive
              : styles.cardActive
          }
        >
          <h4 className={styles.cardTitle}>
            {(user.firstname || '') + ' ' + (user.lastname || '')}
          </h4>
          <div>ת.ז.: {user.tz}</div>
          <div>מין: {user.gender}</div>
          <div>תפקיד: {user.role}</div>
          {user.room === 'active' && <button className={styles.cardButton} style={{background: "yellow", color: "black", marginBottom: "10px"}} onClick={() => onEdit(user)}>✏️ ערוך </button> }
          {user.room === 'waiting' && 
            <>
              <button className={styles.cardButton} style={{background: "green", color: "black", marginBottom: "10px"}} onClick={async() => await onWaitingToActive(user)}>✅ אישור</button>
              <button className={styles.cardButton} style={{background: "red", color: "black", marginBottom: "10px"}} onClick={() => deleteU(user, 'waiting')}>🗑️ מחיקה</button>
            </>
          }
          {user.room === 'noActive' && 
            <>
              <button className={styles.cardButton} style={{background: "green", color: "black", marginBottom: "10px"}} onClick={async() => await onNoActiveToActive(user)}>♻️ שחזור</button>
              <button className={styles.cardButton} style={{background: "red", color: "black", marginBottom: "10px"}} onClick={() => deleteU(user, 'noActive')}>🗑️ מחיקה</button>
            </>
          }
        </div>
      ))}
    </div>
  );
}

// ---------- העמוד ----------
export default function ViewAllUser() {
  const topAnchorRef = useRef(null);
  const [showFab, setShowFab] = useState(false);

  // FAB כשהעוגן לא בפריים
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { root: null }
    );
    if (topAnchorRef.current) io.observe(topAnchorRef.current);
    return () => io.disconnect();
  }, []);

  const navigate = useNavigate();
  const [me, setMe] = useState();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // --- NEW: מצב סגמנט – תמיד מתחיל על פעילים
  const [status, setStatus] = useState('active'); // 'active' | 'pending' | 'inactive'

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced value
  const [sortField, setSortField] = useState('name'); // 'name' | 'role'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  // Debounce לחיפוש
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 230);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const user_id = localStorage.getItem('user_id');
      const res = await getAllUser();
      if (res.ok) {
        const list = res.users.filter((u) => !user_id || u._id !== user_id); // להסתיר את עצמי
        const usr = res.users.find((u) => u.id === user_id);
        setMe(usr);
        setUsers(list);
      } else {
        setUsers([]);
        throw new Error(res.message);
      }
    } catch (e) {
      setErr('שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- NEW: ספירות לכל מצב (על כל הרשימה)
  const counts = useMemo(() => {
    let active = 0, pending = 0, inactive = 0;
    for (const u of users) {
      if (u.room === 'waiting') pending++;
      else if (u.room === 'noActive') inactive++;
      else active++;
    }
    return { active, pending, inactive };
  }, [users]);

  // --- NEW: סינון לפי סטטוס -> חיפוש -> מיון
  const filteredSorted = useMemo(() => {
    // 1) לפי סטטוס
    const byStatus = users.filter((u) => {
      if (status === 'pending')  return u.room === 'waiting';
      if (status === 'inactive') return u.room === 'noActive';
      return u.room !== 'waiting' && u.room !== 'noActive'; // active
    });

    // 2) חיפוש
    const q = search;
    const searched = q
      ? byStatus.filter((u) => {
          const hay = [
            u.firstname,
            u.lastname,
            u.role,
            u.gender,
            u.tz,
          ]
            .map((v) => String(v ?? '').toLowerCase())
            .join(' ');
          return hay.includes(q);
        })
      : byStatus;

    // 3) מיון
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...searched].sort((a, b) => {
      if (sortField === 'role') {
        return (
          String(a.role ?? '').localeCompare(String(b.role ?? ''), 'he', { sensitivity: 'base' }) * dir
        );
      }
      const an = `${a.firstname ?? ''} ${a.lastname ?? ''}`.trim();
      const bn = `${b.firstname ?? ''} ${b.lastname ?? ''}`.trim();
      return an.localeCompare(bn, 'he', { sensitivity: 'base' }) * dir;
    });
  }, [users, status, search, sortField, sortDir]);

  const toggleDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  return (
    <div className={styles.scheduleContainer}>
      <div ref={topAnchorRef} />

      <h1 className={styles.title}>דף המשתמשים</h1>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="חיפוש לפי שם, ת.ז., תפקיד…"
          className={styles.searchInput}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <button
          id="page-add-user"
          style={{ background: 'green', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8 }}
          onClick={() => navigate('/users/new')}
        >
          ➕ הוסף משתמש
        </button>

        <button
          style={{ background: '#374151', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8 }}
          onClick={loadData}
          disabled={loading}
        >
          {loading ? 'מרענן…' : 'רענן'}
        </button>
      </div>

      {/* --- NEW: הסגמנט עצמו */}
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <UserStatusFilter
          value={status}
          onChange={setStatus}
          counts={counts}      // תגים עם ספירה לכל מצב
          compact={false}      // אפשר true לגרסה קומפקטית
        />
      </div>

      <div style={{ marginTop: 8, opacity: 0.7 }}>
        סה״כ: {filteredSorted.length} משתמשים (
        {status === 'active' ? 'פעילים' : status === 'pending' ? 'ממתינים' : 'לא פעילים'})
      </div>

      {err && <div style={{ color: '#b91c1c', marginTop: 12 }}>{err}</div>}
      {!err && loading && <div style={{ marginTop: 12 }}>טוען משתמשים…</div>}

      {!loading && !err && (
        <UsersCardBoard users={filteredSorted} />
      )}

      <Fabtn
        anchor="#page-add-user"
        label="הוספת משתמש"
        visible={showFab}
        onClick={() => navigate(`/users/new`)}
      />
    </div>
  );
}
