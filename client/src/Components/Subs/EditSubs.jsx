// 📁 src/components/subs/EditOrAddSub.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// עדכן נתיב אם אצלך שונה:
import { create, update, getOne, /*softDelete,*/ deleteS } from "../../WebServer/services/subs/functionsSubs";
import styles from "./Subs.module.css";
import { toast } from "../../ALERT/SystemToasts";

const EditSubs = () => {
  const { id } = useParams();              // "new" או _id
  const navigate = useNavigate();
  const isEdit = id !== "new";

  const [form, setForm] = useState({
    _id: "",
    name: "",
    months: "",
    times_week: "",
    price: "",
  });

  const [error, setError] = useState({
    _id: "",
    name: "",
    months: "",
    times_week: "",
    price: "",
  })

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState(null);

  // טעינת מנוי לעריכה
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        console.log("load sub");
        setLoading(true);
        setErr(null);
        const res = await getOne(id); // מצפה ל-{ status, subs }
        console.log("after getOne Sub", res);
        console.log("res load sub", res);
        if(!res.ok) throw new Error(res.message);
        if (res) {
          const s = res.sub;
          setForm({
            _id: s._id,
            name: s.name ?? "",
            months: s.months ?? "",
            times_week: s.times_week ?? "",
            price: s.price ?? "",
          });
        } else {
          setErr("המנוי לא נמצא");
        }
      } catch (e) {
        setErr("שגיאה בטעינת המנוי");
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
    if (!form.name.trim()) return "שם מנוי חובה";
      const months = Number(form.months);
      const times  = Number(form.times_week);
      const price  = Number(form.price);
      if (!Number.isFinite(months) || months <= 0) return "מספר חודשים חייב להיות מספר חיובי";
      if (!Number.isFinite(times) || times <= 0) return "פעמים בשבוע חייב להיות מספר חיובי";
      if (!Number.isFinite(price) || price < 0)  return "מחיר חייב להיות מספר תקין";
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
        if(sub) {
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "שם מנוי קיים במערכת";
        }
        return "";
      } else if (['months', 'times_week', 'price'].includes(name)){
        const tag = document.getElementsByName(name)[0];
        if(value == ""){
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "מלאה שדה";
        }
        else{
          const tag = document.getElementsByName(name)[0];
          try{
            if(Number(value) <= 0){
              tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
              return "השדה חייב להכיל מספר חיובי מעל 0"
            }
            else{
              return "";
            }
          } catch(err) {
            tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
            return "השדה אינו מספר"
          }
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    let b = true;
    const ff = ['name', 'months', 'times_week', 'price'];
    for(const nameTag in ff){
      const tag = document.getElementsByName(ff[nameTag])[0];
      console.log('tag', tag, tag.name, tag.value);
      const msg = await validate(tag.name, tag.value);
      setError((prev) => ({ ...prev, [tag.name]: msg }));
      if(msg !== ''){
        b = false;
      }
    }
    if(!b) return toast.info("בדיקת שדות");
    e.preventDefault();
    try {
      setSaving(true);
      setErr(null);

      const payload = {
        name: form.name.trim(),
        months: Number(form.months),
        times_week: Number(form.times_week),
        price: Number(form.price),
      };

      const res = isEdit ? await update(form._id, payload): await create(payload);
      if(!res) return;
      console.log("edit sub res", res)
      if(!res.ok) throw new Error(res.message);
      toast.success(`✅ המנוי ${isEdit ? 'עודן' : 'נשמר'} בהצלחה`);
      navigate("/subs");
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
      const res = await deleteS(form._id);
      if(!res) return;
      if(!res.ok) throw new Error(res.message);

      toast.success("✅ המנוי נמחק");
      navigate("/subs");
    } catch (e) {
      toast.error(e.message || "❌ מחיקה נכשלה");
    }
  };

  if (loading) return <div className={styles.formContainer}>טוען…</div>;
  if (err)      return <div className={styles.formContainer} style={{color:"#b91c1c"}}>{err}</div>;

  return (
    <div className={styles.formContainer}>
      <h2>{isEdit ? "עריכת מנוי" : "הוספת מנוי"}</h2>

      <label>שם:</label>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        required
        // אם רוצים למנוע שינוי שם בעת עריכה – בטל את ההערה:
        // disabled={isEdit}
      />
      <label style={{color: "red"}}>{error.name}</label>

      <label>חודשים:</label>
      <input
        name="months"
        type="number"
        min="1"
        value={form.months}
        onChange={handleChange}
        required
      />
      <label style={{color: "red"}}>{error.months}</label>

      <label>פעמים בשבוע:</label>
      <input
        name="times_week"
        type="number"
        min="1"
        value={form.times_week}
        onChange={handleChange}
        required
      />
      <label style={{color: "red"}}>{error.times_week}</label>

      <label>מחיר:</label>
      <input
        name="price"
        type="number"
        min="0"
        step="1"
        value={form.price}
        onChange={handleChange}
        required
      />
      <label style={{color: "red"}}>{error.price}</label>

      <div className={styles.buttonRow} style={{ gap: 8, flexWrap: "wrap" }}>
        <button type="submit" onClick={handleSubmit} disabled={saving}>
          {saving ? "שומר…" : (isEdit ? "שמור שינויים" : "צור מנוי")}
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

export default EditSubs;
