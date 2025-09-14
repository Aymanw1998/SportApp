// 📁 src/components/user/EditUser.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  removeSub,
} from '../../WebServer/services/user/functionsUser';
import { getOne as getSubById } from '../../WebServer/services/subs/functionsSubs';
import styles from './EditUser.module.css';
import { toast } from '../../ALERT/SystemToasts';

const initialUser = {
  tz: '', password: '',
  firstname: '', lastname: '', birth_date: '',
  gender: '', phone: '', email: '',
  city: '', street: '', role: '', wallet: 0,
  subs: { id: null, start: { day: 0, month: 0, year: 0 } },
};

const normalizePhoneToIntl = (val) => {
  if (!val) return '';
  let v = String(val).replace(/\D+/g, '');
  // אם מתחיל ב-972 בלי +
  if (v.startsWith('972')) v = '+' + v;
  // אם מתחיל ב-0 ישראלי → +972
  if (v.startsWith('0')) v = '+972' + v.slice(1);
  if (!v.startsWith('+')) v = '+' + v;
  return v;
};

const displayPhoneLocal = (val) => {
  if (!val) return '';
  let v = String(val);
  if (v.startsWith('+972')) v = '0' + v.slice(4);
  return v.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'); // 05x-xxx-xxxx
};

export default function EditUser() {

  const { id } = useParams(); // tz או "new"
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [user, setUser] = useState(initialUser);
  const [error, setError] = useState(initialUser);
  const [sub, setSub] = useState(null);
  useEffect(()=>console.log("sub", sub), [sub]);
  const [walletDelta, setWalletDelta] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // טען משתמש + מנוי
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await getUserById(id);
        if (!res?.ok) {
          setErr('משתמש לא נמצא');
          return;
        }
        // מלא חסרים ושמור טלפון בפורמט E164
        const u = { ...initialUser, ...res.user };
        console.log("res.user", res.user)
        console.log("new user", u)
        u.phone = normalizePhoneToIntl(u.phone);
        setUser(u);

        // טען מנוי אם קיים
        const subId = res?.user?.subs?.id;
        if (subId) {
          try {
            const resS = await getSubById(subId);
            console.log("the subs", resS)
            if(!resS.ok) throw new Error(res.message);

            setSub(resS.sub);
          } catch {
            setSub(null);
          }
        } else {
          setSub(null);
        }
      } catch (e) {
        setErr('שגיאה בטעינת משתמש');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const canSave = useMemo(() => {
    if (!user.tz?.trim() && isNew) return false;
    if (!user.role) return false;
    return true;
  }, [user, isNew]);

  function isValidIsraeliId(id) {
    if (!/^\d{5,9}$/.test(id)) return false;
    id = id.padStart(9, "0");
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let n = Number(id[i]) * (i % 2 === 0 ? 1 : 2);
      if (n > 9) n -= 9;
      sum += n;
    }
    return sum % 10 === 0;
  }

  const onField = async(e) => {
    const { name, value } = e.target;
    console.log(`onField[${name}] = ${String(value)}`, value === '');
    setUser((prev) => ({ ...prev, [name]: value }));
    const msg = await validateBeforeSave(name, value)
    console.log("msg", msg);
    setError((prev) => ({ ...prev, [name]: msg }));
  };

  // טלפון: מציגים 05x-xxx-xxxx, מאחסנים כ +972…
  const onPhoneChange = (e) => {
    const local = e.target.value.replace(/[^\d-]/g, '');
    const intl = normalizePhoneToIntl(local);
    setUser((prev) => ({ ...prev, phone: intl }));
  };

  const adjustWallet = (sign) => {
    const delta = Number(walletDelta);
    if (!Number.isFinite(delta)) return;
    setUser((prev) => ({ ...prev, wallet: Number(prev.wallet || 0) + (sign * delta) }));
    setWalletDelta('');
  };

  const validateBeforeSave = async(name = null, value = null) => {
    console.log(name, value);
    if(!name) {
      if (isNew && !user.tz?.trim()) {return 'תעודת זהות חובה';}
      if (!user.role) return 'בחר תפקיד';
      // ולידציה בסיסית לישראלית: 9 ספרות (לא כולל לוגיקת ביקורת)
      if (isNew && !/^\d{9}$/.test(user.tz)) return 'ת.ז. צריכה להיות 9 ספרות';
      // אימייל בסיסי
      if (user.email && !/^\S+@\S+\.\S+$/.test(user.email)) return 'אימייל לא תקין';
      return null;
    }
    else{
      if(name === "tz" && isNew){
      const tzEl = document.getElementsByName('tz')[0];
      console.log(isNew && value === "");
        if (isNew && value === "") {
          tzEl?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "מלאה שדה";
        } 
        else if(!isValidIsraeliId(value)){
        tzEl?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
        return "תעודת זיהות לא חוקית"
        }
        else{
          const data = await getUserById(value)
          if(data.ok){
            tzEl?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
            return "תעודת זיהות קיימת במערכת"
          } else{
            tzEl?.style.setProperty('border', '2px solid green'); // או ישירות סטייל
            return ""
          }
        }
      }
      else if(['fistname', 'lastname'].includes(name) && isNew){
        const tag = document.getElementsByName(name)[0];
        console.log(isNew && value === "");
        if (isNew && value === "") {
          tag?.style.setProperty('border', ''); // או ישירות סטייל
          return "מלאה שדה";
        } 
        else{
          tag?.style.setProperty('border', '2px solid green'); // או ישירות סטייל
          return ""
        }
      }
      else if(['gender', 'role'].includes(name) && isNew){
        const tag = document.getElementsByName(name)[0];
        if (isNew && name === 'gender' && !['זכר', 'נקבה'].includes(value)) {
          tag?.style.setProperty('border', ''); // או ישירות סטייל
          return "בחר מין";
        } else if (isNew && name === 'role' && !['מנהל', 'מאמן', 'מתאמן'].includes(value)) {
          tag?.style.setProperty('border', ''); // או ישירות סטייל
          return "בחר תפקיד";
        }  
        else{
          tag?.style.setProperty('border', '2px solid green'); // או ישירות סטייל
          return ""
        }
      }
      return "";
    }
  };

  const handleSave = async () => {
    console.log("handleSave");
    const b = await validateBeforeSave();
    if (b) { toast.warn(b); return; }

    try {
      setSaving(true);
      setErr(null);

      if (isNew) {
        const res = await createUser(user);
        if(!res) return;
        if (res?.ok) {
          toast.success('✅ משתמש נוצר בהצלחה');
          navigate(-1);
      } else if(res?.status != 100){
          toast.error('❌ יצירה נכשלה');
        }
        return;
      }

      // עדכון: אל תשלח סיסמה ריקה כדי לאפס
      const passwordToSend = user.password?.trim() ? user.password : undefined;

      const res1 = await updateUser(user.tz,user);
      if(!res1)return;
      console.log("updateUser", res1);
      if (res1?.ok) {
        toast.success('✅ עודכן בהצלחה');
        navigate(-1);
      } else {
        toast.warn('❌ שמירה נכשלה');
      }
    } catch (e) {
      console.error(e);
      toast.error('❌ שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!window.confirm('למחוק משתמש?')) return;
    try {
      const res = await deleteUser(id); // אצלך הנתיב לפי tz
      if(!res)return;
      if (res?.ok) {
        toast.success('✅ המשתמש נמחק');
        navigate(-1);
      } else {
        toast.warn('❌ מחיקה נכשלה');
      }
    } catch {
      toast.error('❌ מחיקה נכשלה');
    }
  };

  const handleRemoveSub = async () => {
    try {
      const res = await removeSub(user._id);
      if(!res.ok) throw new Error(res.message)
      const updated = res?.user || res; // תמיכה בשתי סכימות תשובה
      if (updated) {
        setUser((prev) => ({ ...prev, subs: { id: null, start: { day: 0, month: 0, year: 0 } } }));
        setSub(null);
        toast.success("✅ המנוי נמחק");      
      }
    } catch (e) {
      console.error(e);
      toast.error('❌ שגיאה במחיקת מנוי');
    }
  };

  if (loading) return <div className={styles.formContainer}>טוען…</div>;
  if (err)      return <div className={styles.formContainer} style={{ color: '#b91c1c' }}>{err}</div>;

  return (
    <div className={styles.formContainer}>
      <h2>{isNew ? '➕ הוספת משתמש חדש' : '✏️ עריכת משתמש'}</h2>

      <label>ת.ז.:</label>
      <input name="tz" value={user.tz} onChange={onField} readOnly={!isNew} />
      <label style={{color: "red"}}>{error.tz}</label>
      <label>סיסמה:</label>
      <div className={styles.passwordWrapper}>
        <input
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={user.password || ''}
          onChange={onField}
          // placeholder={isNew ? '' : 'השאר ריק כדי לא לשנות'}
        />
        <button
          type="button"
          className={styles.togglePassword}
          onClick={() => setShowPassword((s) => !s)}
          title={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>

      <label>שם פרטי:</label>
      <input name="firstname" value={user.firstname} onChange={onField} />
      <label style={{color: "red"}}>{error.firstname}</label>

      <label>שם משפחה:</label>
      <input name="lastname" value={user.lastname} onChange={onField} />
      <label style={{color: "red"}}>{error.lastname}</label>

      <label>תאריך לידה:</label>
      <input
        name="birth_date"
        type="date"
        value={user.birth_date ? String(user.birth_date).slice(0, 10) : ''}
        onChange={onField}
      />

      <label>מין:</label>
      <select name="gender" value={user.gender} onChange={onField}>
        <option value="">בחר מין</option>
        <option value="זכר">זכר</option>
        <option value="נקבה">נקבה</option>
      </select>
      <label style={{color: "red"}}>{error.gender}</label>

      <label>טלפון:</label>
      <input
        name="phone"
        value={displayPhoneLocal(user.phone)}
        onChange={onPhoneChange}
        placeholder="052-123-4567"
      />
      <label style={{color: "red"}}>{error.phone}</label>

      <label>אימייל:</label>
      <input name="email" value={user.email} onChange={onField} />
      <label style={{color: "red"}}>{error.email}</label>

      <label>עיר:</label>
      <input name="city" value={user.city !== "" ? user.city : (window.innerWidth > 768 ? 'רמלה' : '')} onChange={onField} />
      <label style={{color: "red"}}>{error.city}</label>

      <label>רחוב:</label>
      <input name="street" value={user.street} onChange={onField} />
      <label style={{color: "red"}}>{error.street}</label>

      <label>תפקיד:</label>
      <select name="role" value={user.role} onChange={onField}>
        <option value="">בחר תפקיד</option>
        <option value="מנהל">מנהל</option>
        <option value="מאמן">מאמן</option>
        <option value="מתאמן">מתאמן</option>
      </select>
      <label style={{color: "red"}}>{error.role}</label>

      <label>עדכון ארנק:</label>
      <div className={styles.buttonRow}>
        <input
          name="walletDelta"
          type="number"
          step="1"
          value={walletDelta}
          onChange={(e) => setWalletDelta(e.target.value)}
          style={{ maxWidth: 120 }}
        />
        <button type="button" onClick={() => adjustWallet(+1)}>+</button>
        <button type="button" onClick={() => adjustWallet(-1)}>-</button>
        <h3>סה"כ בארנק: {Number(user.wallet) || 0} ₪</h3>
      </div>

      <label>מנוי נבחר:</label>
      <div className={styles.buttonRow}>
        <div>
          {sub ? (
            <>
              <h3>{sub.name}</h3>
              <p>⏳ {sub.months} חודשים</p>
              <p>📅 {sub.times_week} פעמים בשבוע</p>
              <p>💰 {sub.price} ₪</p>
              <button
                type="button"
                style={{ background: 'red' }}
                className="select-btn"
                onClick={handleRemoveSub}
              >
                מחיקת מנוי
              </button>
            </>
          ) : (
            <>
              <h3>לא נבחר מנוי</h3>
              <button
                type="button"
                style={{ background: 'green' }}
                className="select-btn"
                onClick={() => navigate(`/selectSubfor/${user.tz}`)}
              >
                הוסף מנוי
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.buttonRow}>
        <button type="button" onClick={handleSave}>
          {saving ? 'שומר…' : (isNew ? 'צור משתמש' : 'שמור שינויים')}
        </button>
        {!isNew && (
          <button type="button" style={{ background: 'red' }} onClick={handleDelete}>
            מחיקת משתמש
          </button>
        )}
        <button type="button" style={{ background: '#6b7280' }} onClick={() => navigate(-1)}>
          חזרה
        </button>
      </div>
    </div>
  );
}
