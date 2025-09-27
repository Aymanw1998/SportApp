// 📁 src/components/user/EditUser.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserById,
  createUser,
} from '../../../WebServer/services/user/functionsUser';
import styles from './RegisterPage.module.css';
import { toast } from '../../../ALERT/SystemToasts';
import { register } from '../../../WebServer/services/auth/fuctionsAuth';

const initialUser = {
  tz: '', password: '',
  firstname: '', lastname: '', birth_date: '',
  gender: '', phone: '', email: '',
  city: window.innerWidth < 768 ? 'רמלה' : '', street: '', role: 'מתאמן', wallet: 0,
  subs: { id: null, start: { day: -1, month: -1, year: -1 } },
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

export default function RegisterPage() {

  const navigate = useNavigate();
  const isNew = true;

  const [user, setUser] = useState(initialUser);
  const [error, setError] = useState({...initialUser, birth_date: '', city: ''});
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function isValidIsraeliId(id) {
    if (!/^\d{5,9}$/.test(id)) return false;
    id = id.padStart(9, "0");
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let n = Number(id[i]) * (i % 2 === 0 ? 1 : 2);
      if (n > 9) n -= 9;
      sum += n;
    }
    console.log("isValidIsraeliId", id, sum, sum % 10 === 0);
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

  const validateBeforeSave = async(name = null, value = null) => {
    const tag = document.getElementsByName(name)[0];
    if( isNew && name === "password"){
      console.log(isNew && value === "");
        if (isNew && value === "") {
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "מלאה שדה";
        } 
    }
    // tz
    if(name === "tz"){
      console.log(isNew && value === "");
        if (value === "") {
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "מלאה שדה";
        } 
        else if(!isValidIsraeliId(value)){
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "תעודת זיהות לא חוקית"
        }
        else {
          try{
            const data = await getUserById(value, {publicMode: true});
            console.log("data", value, data);
            if(data.ok){
              tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
              return "תעודת זיהות קיימת במערכת"
            } 
          } catch(e){console.log(e)}
        }
        tag?.style.setProperty('border', '2px solid green'); // או ישירות סטייל
        return ""
      }

      //fisrtname, lastname
      else if(['firstname', 'lastname'].includes(name)){
        if (value === "") {
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "מלאה שדה";
        } 
        else{
          tag?.style.setProperty('border', '2px solid green'); // או ישירות סטייל
          return ""
        }
      }

      //gender, role
      else if(['gender', 'role'].includes(name)){
        if (name === 'gender' && !['זכר', 'נקבה'].includes(value)) {
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "בחר מין";
        } else if (isNew && name === 'role' && !['מנהל', 'מאמן', 'מתאמן'].includes(value)) {
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "בחר תפקיד";
        }  
        else{
          tag?.style.setProperty('border', '2px solid green'); // או ישירות סטייל
          return ""
        }
      }

      else if (name === "birth_date"){
        try{
          console.log("birth_date", value, user.birth_date);
          if(value !== ""){
            const date = new Date(value); 
          }
          else {
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "בחר תאריך לידה";
          }
        } catch {
          console.log("invalid date");
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "תאריך לא חוקי";
        }
      }

      //phone, email, city, street
      else if (['phone', 'email', 'city', 'street'].includes(name)){
        if (value === "") {
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "מלאה שדה";
        } 
        else{
          tag?.style.setProperty('border', '2px solid green'); // או ישירות סטייל
          return ""
        }
      }
      return "";
  };

  const handleSave = async () => {
    console.log("handleSave");
    const listTags = Object.keys(user);
    for(const name of listTags){
      const msg = await validateBeforeSave(name, user[name])
      console.log("msg", msg);
      setError((prev) => ({ ...prev, [name]: msg }));
    }
    const b = await validateBeforeSave();
    if (b) { toast.warn(b); return; }

    try {
      setSaving(true);
      setErr(null);
      const res = await register(user);
      if(!res) return;
      if (res?.ok) {
        toast.success('✅ משתמש נכנס לחדר המתנה לאישור מנהל');
        navigate(-1);
      } else{
        toast.error('❌ יצירה נכשלה');
      }
    } catch (e) {
      console.error(e);
      toast.error('❌ שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.formContainer}>טוען…</div>;
  if (err)      return <div className={styles.formContainer} style={{ color: '#b91c1c' }}>{err}</div>;

  return (
    <div className={styles.formContainer}>
      <h2>➕ הרשמת משתמש חדש</h2>

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
      <label style={{color: "red"}}>{error.password}</label>

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
      <label style={{color: "red"}}>{error.birth_date}</label>

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
      <input name="city" value={user.city} onChange={onField} />
      <label style={{color: "red"}}>{error.city}</label>

      <label>רחוב:</label>
      <input name="street" value={user.street} onChange={onField} />
      <label style={{color: "red"}}>{error.street}</label>

      {/* <label>תפקיד:</label>
      <select name="role" value={user.role} onChange={onField}>
        <option value="">בחר תפקיד</option>
        <option value="מנהל">מנהל</option>
        <option value="מאמן">מאמן</option>
        <option value="מתאמן">מתאמן</option>
      </select>
      <label style={{color: "red"}}>{error.role}</label> */}

      <div className={styles.buttonRow}>
        <button type="button" onClick={handleSave}>
          {saving ? 'שומר…' : 'שמור משתמש וחכה לאישור'}
        </button>
        <button type="button" style={{ background: '#6b7280' }} onClick={() => navigate(-1)}>
          חזרה
        </button>
      </div>
    </div>
  );
}
