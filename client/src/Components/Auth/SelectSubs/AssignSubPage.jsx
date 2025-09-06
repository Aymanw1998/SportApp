// src/Components/Auth/SelectSubs/AssignSubPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import SelectSubForTrainee from './SelectSubForTrainee';
import { getUserById, addSub, updateUser /* or addSubForUser */ } from '../../../WebServer/services/user/functionsUser';
import SelectDaysForTrainee from './SelectDaysTrainee';
import { calcProratedQuote } from '../../Provides//pricing';
import { toast } from '../../../ALERT/SystemToasts';

export default function AssignSubPage() {
  const navigate = useNavigate();
  const { id } = useParams();        // בד"כ tz או _id לפי הראוטר שלך
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [user1, setUser1] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    console.log("selectedSub", selectedSub)
    // setSelectedLessons([]);
  }, [selectedSub])
  useEffect(()=>{
    console.log("selectedLessons", selectedLessons)
    let listDays = [];
    console.log("listDays", listDays)
    for(let i = 0; i < selectedLessons.length; i ++) {
      const dd = selectedLessons[i].date.day;
      const isInSelectedDay = listDays.includes(dd);
      console.log("dd", dd);
      console.log("isInSelectedDay", isInSelectedDay);
      if(isInSelectedDay === false){
        listDays.push(dd);
      }
    }
    console.log("listDays", listDays)
    setSelectedDays(listDays);
  },[selectedLessons])
  useEffect(()=>console.log("selectedDays", selectedDays), [selectedDays])
  useEffect(() => {
    (async () => {
      try {
        if(window.location.pathname === "/quotation") return;
        const res = await getUserById(id);
        if(!res.ok) throw Error(res.message)
        setUser1(res.user);
      } catch (err) {
        console.error('loadData err', err);
        console.error('loadData err', err);
        navigate(-1);
      }
    })();
  }, [id, navigate]);

  const handleSave = async (e) => {
    if(window.location.pathname === "/quotation") return;
    if (!selectedSub) return toast.warn('בחר מנוי קודם!');
    if (!user1) return;
    // בדיקת יתרת ארנק
    const quote = calcProratedQuote({
      planPrice:  selectedSub?.price,
      months:     selectedSub?.months,
      startDate:  new Date(),
      daysOfWeek: selectedDays,
      roundTo: 1,
    })
    const price = Number(quote.price || selectedSub?.price || 0);
    const wallet = Number(user1?.wallet || 0);
    if (wallet < price) {
      toast.warn('אין מספיק כסף בארנק כדי לרכוש את המנוי.');
      return;
    }

    setSaving(true);
    try {
      const res1 = await addSub(selectedSub._id);
      if(!res1.ok) throw new Error(res1.message);
      const res2 = await updateUser(user1.tz, { wallet: wallet - price }, {confirm: false} ); // ודא שהפונקציה תומכת באובייקט חלקי
      if(!res2.ok) throw new Error(res2.message);

      toast.success('המנוי נוסף למשתמש בהצלחה!');
      navigate('/dashboard/get', { replace: true });
    } catch (err) {
      console.error(" save err", err);
      toast.error(err?.message || 'שמירת המנוי נכשלה');
    } finally {
      setSaving(false);
    }
  };

  // if (!user1) return null;

  const forPay = () => {
    console.log("forPay func", selectedSub, selectedDays, new Date().toISOString());
    const quote = calcProratedQuote({
      planPrice:  selectedSub?.price,
      months:     selectedSub?.months,
      startDate:  new Date(),
      daysOfWeek: selectedDays,
      roundTo: 1,
    })
    console.log(quote);
    if(!quote) {
      return <h4>עדיין לא נבחר כלום לחישוב</h4>
    }
    else{
      const funcDDMMYYYY = (input) => {
        const d = new Date(input);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0'); // months are 0–11
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
      return (
        <>
        <h4>מחיר סופי לתשלום: {quote.price}</h4>
        <h4>תאריך התחלה: {funcDDMMYYYY(quote.period.start) || "null"}</h4>
        <h4>תאריך סיום: {funcDDMMYYYY(quote.period.end) || "null"}</h4>
        </>
      )
    }
  }
  return (
    <div>
      {!user1 && <button onClick={()=>navigate(-1)} style={{
        alignSelf: "flex-start",
        padding: "10px 20px",
        backgroundColor: "red",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}>חזור לדף ההתחברות</button>}
      {user1 && <div style={{ textAlign: 'left', margin: '1rem' }}>
        <h3>👛 ארנק: {user1?.wallet || 0} ₪</h3>
      </div>}

      {user1 ? <h2 style={{ textAlign: 'center' }}>
        בחירת מנוי עבור המתאמן – {user1.firstname} {user1.lastname} – {user1.tz}
      </h2>: <h2 style={{ textAlign: 'center' }}>
        בחירת מנוי
      </h2>}

      <SelectSubForTrainee
        selectedSub={selectedSub}
        setSelectedSub={setSelectedSub}
        wallet={user1 ? user1.wallet: 100000}
        publicMode = {user1 !== false}
      />

      { selectedSub &&
        <>
          <h2 style={{ textAlign: 'center' }}>הצעת מחיר לרישום בפעם הראשונה</h2>
          {<SelectDaysForTrainee selectedSubs={selectedSub} selected={selectedLessons} setSelected={setSelectedLessons}/>}
          <h3>פירוט:</h3> 
          {selectedDays && selectedDays.length > 0 && forPay()}
        </>
      }

      {user1 && <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          type="button"
          style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}
          onClick={() => {handleSave()}}
          // disabled={saving}
        >
          {saving ? 'שומר…' : '💾 שמור'}
        </button>
      </div>}
    </div>
  );
}
