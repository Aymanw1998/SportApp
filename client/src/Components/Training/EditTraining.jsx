// 📁 src/components/subs/EditOrAddSub.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// עדכן נתיב אם אצלך שונה:
import { create, update, getOne, /*softDelete,*/ deleteT } from "../../WebServer/services/training/functionTraining";
import styles from "./Training.module.css";
import { toast } from "../../ALERT/SystemToasts";

const EditTraining = () => {
  const { id } = useParams();              // "new" או _id
  const navigate = useNavigate();
  const isEdit = id !== "new";

  const [form, setForm] = useState({
    _id: "",
    name: "",
    info: "",
  });

  const [error, setError] = useState({
    _id: "",
    name: "",
    info: "",
  })

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState(null);

  // טעינת מנוי לעריכה
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        console.log("load training");
        setLoading(true);
        setErr(null);
        const res = await getOne(id); // מצפה ל-{ status, subs }
        console.log("after getOne Sub", res);
        console.log("res load sub", res);
        if(!res.ok) throw new Error(res.message);
        if (res) {
          const s = res.training;
          setForm({
            _id: s._id,
            name: s.name ?? "",
            info: s.months ?? "",
          });
        } else {
          setErr("האימון לא נמצא");
        }
      } catch (e) {
        setErr("שגיאה בטעינת האימון");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = async(e) => {
    const { name, value } = e.target;
    // שמור כטקסט; נמיר למספרים בזמן שמירה
    setForm((prev) => ({ ...prev, [name]: value }));
    const msg = await validate(name, value);
    setError((prev) => ({ ...prev, [name]: msg }));
  };

  const validate = async(name = null, value = null) => {
    console.log(name, value)
    if(!name){
      if (!form.name.trim()) return "שם אימון חובה";
      return null;
    }
    else{
        if(['name'].includes(name)){
          const tag = document.getElementsByName(name)[0];
          console.log("tt", tag)
          if(value === ""){
            tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
            return "מלאה שדה";
          }
          const resS = await getOne(value);
          if(!resS.ok) return "";
          if(resS.training && (resS.training._id !== form._id)){
            tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
            return "שם אימון קיים במערכת";
          }
          tag?.style.removeProperty('border');
          return "";
        } 
      }
  }

  const handleSubmit = async (e) => {
    let b = await validate();
    if (b) { toast.warn(b); return; }
    b = true
    const ff = ['name', 'info'];
    for(const nameTag in ff){
      const tag = document.getElementsByName(ff[nameTag])[0];
      console.log('tag', tag, tag.name, tag.value);
      const msg = await validate(tag.name, tag.value);
      setError((prev) => ({ ...prev, [tag.name]: msg }));
      console.log('msg', msg)
      if(msg && msg !== ''){
        b = false;
      }
    }
    if(!b) return toast.warn("בדיקת שדות");
    e.preventDefault();
    try {
      setSaving(true);
      setErr(null);

      const payload = {
        name: form.name.trim(),
        info: form.info.trim(),
      };

      const res = isEdit ? await update(form._id, payload): await create(payload);
      if(!res) return;
      console.log("edit sub res", res)
      if(!res.ok) throw new Error(res.message);
      toast.success(`✅ האימון ${isEdit ? 'עודן' : 'נשמר'} בהצלחה`);
      navigate(-1);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "❌ שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  };

  // מחיקה קשיחה (אופציונלי)
  const handleHardDelete = async () => {
    if (!isEdit) return;
    try {
      const res = await deleteT(form._id);
      if(!res) return;
      if(!res.ok) throw new Error(res.message);

      toast.success("✅ המנוי נמחק");
      navigate(-1);
    } catch (e) {
      toast.error(e.message || "❌ מחיקה נכשלה");
    }
  };

  if (loading) return <div className={styles.formContainer}>טוען…</div>;
  if (err)      return <div className={styles.formContainer} style={{color:"#b91c1c"}}>{err}</div>;

  return (
    <div className={styles.formContainer}>
      <h2>{isEdit ? "עריכת אימון" : "הוספת אימון"}</h2>

      <label>שם:</label>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <label style={{color: "red"}}>{error.name}</label>
      <br />
      <label>מידע:</label>
      <input
        name="info"
        value={form.info}
        onChange={handleChange}
      />
      <label style={{color: "red"}}>{error.info}</label>

      <div className={styles.buttonRow} style={{ gap: 8, flexWrap: "wrap" }}>
        <button type="submit" onClick={handleSubmit}>
          {saving ? "שומר…" : (isEdit ? "שמור שינויים" : "צור אימון")}
        </button>

        {isEdit && (
          <>
            <button type="button" style={{ background: "#7f1d1d" }} onClick={handleHardDelete}>
              מחיקה
            </button>
          </>
        )}

        <button type="button" style={{ background: "#6b7280" }} onClick={() => navigate(-1)}>
          חזרה לרשימה
        </button>
      </div>
    </div>
  );
};

export default EditTraining;
