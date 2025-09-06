// 📄 src/components/user/ViewAllUser.jsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// עדכן את הנתיב לפי הפרויקט שלך:
import { getAllUser } from '../../WebServer/services/user/functionsUser';
import styles from './ViewAllUser.module.css';

import Fabtn from "./../Global/Fabtn/Fabtn"

function UsersCardBoard({ users, onEdit }) {
  if (!users?.length) {
    return (
      <div style={{ textAlign: 'center', padding: 24, opacity: 0.7 }}>
        אין משתמשים להצגה
      </div>
    );
  }

  return (
    <div className={styles.usersGrid}>
      {users.map((user) => (
        <div key={user._id} className={styles.card}>
          <h4 className={styles.cardTitle}>
            {(user.firstname || '') + ' ' + (user.lastname || '')}
          </h4>
          <div>ת.ז.: {user.tz}</div>
          <div>מין: {user.gender}</div>
          <div>תפקיד: {user.role}</div>
          <button className={styles.cardButton} onClick={() => onEdit(user)}>
            ✏️ ערוך
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ViewAllUser() {
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
  const [me, setMe] = useState();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

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
        const user_id = localStorage.getItem("user_id");
      const res = await getAllUser();
      if (res.ok) {
        const list = res.users.filter((u) => !user_id || u._id !== user_id); // להסתיר את עצמי
        const usr = res.users.filter((u) => u.id === user_id)[0];
        setMe(usr);
        setUsers(list);
      } else {
        setUsers([]);
        throw new Error(res.message)
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

  const filteredSorted = useMemo(() => {
    const q = search;
    const filtered = q
      ? users.filter((u) => {
          const hay =
            [
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
      : users;

    const dir = sortDir === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (sortField === 'role') {
        return String(a.role ?? '').localeCompare(String(b.role ?? ''), 'he', {
          sensitivity: 'base',
        }) * dir;
      }
      // sortField === 'name'
      const an = `${a.firstname ?? ''} ${a.lastname ?? ''}`.trim();
      const bn = `${b.firstname ?? ''} ${b.lastname ?? ''}`.trim();
      return an.localeCompare(bn, 'he', { sensitivity: 'base' }) * dir;
    });
  }, [users, search, sortField, sortDir]);

  const toggleDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

  const onEdit = (user) => {
    // עורכים לפי tz אצלך
    navigate(`/users/${user.tz}`);
  };

  return (
    <div className={styles.scheduleContainer}>
      <h1 className={styles.title}>דף המשתמשים</h1>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="חיפוש לפי שם, ת.ז., תפקיד…"
          className={styles.searchInput}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        {/* <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          title="שדה מיון"
          style={{ padding: '0.5rem', borderRadius: 8 }}
        >
          <option value="name">מיון לפי שם</option>
          <option value="role">מיון לפי תפקיד</option>
        </select> */}

        {/* <button onClick={toggleDir} title="היפוך סדר" style={{ padding: '0.5rem 0.75rem', borderRadius: 8 }}>
          {sortDir === 'asc' ? '⬆️ עולה' : '⬇️ יורד'}
        </button> */}

        <button id="page-add-user"
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

      <div style={{ marginTop: 8, opacity: 0.7 }}>
        סה״כ: {filteredSorted.length} משתמשים
      </div>

      {err && (
        <div style={{ color: '#b91c1c', marginTop: 12 }}>
          {err}
        </div>
      )}

      {!err && loading && (
        <div style={{ marginTop: 12 }}>טוען משתמשים…</div>
      )}

      {!loading && !err && (
        <UsersCardBoard users={filteredSorted} onEdit={onEdit} />
      )}

      <Fabtn
        anchor="#page-add-user"                           
        label="הוספת משתמש"
        visible={showFab}
        onClick={() => {
          console.log('fab click');          
          navigate(`/users/new`);
        }}
      />
    </div>
  );
}
