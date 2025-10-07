// src/Components/Auth/SelectSubs/AssignSubPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import SelectSubForTrainee from './SelectSubForTrainee';
import { getUserById, addSub, updateUser /* or addSubForUser */ } from '../../../WebServer/services/user/functionsUser';
import SelectDaysForTrainee from './SelectDaysTrainee';
import { calcProratedQuote } from '../../Provides//pricing';
import { toast } from '../../../ALERT/SystemToasts';
import { addToList, getOneLesson, updateLesson } from '../../../WebServer/services/lesson/functionsLesson';

export default function AssignSubPage() {
  const navigate = useNavigate();
  const { id } = useParams();        // בד"כ tz או _id לפי הראוטר שלך
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("current");
  useEffect(()=>console.log("selectedMonth", selectedMonth), [selectedMonth])
  const [selectedDays, setSelectedDays] = useState([]);
  const [user1, setUser1] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dosave, SetDosave] = useState(false);
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
    if(((listDays.length > 0 && selectedMonth === "current") || (selectedMonth === "next"))&& user1 && user1.wallet > 0) {
      SetDosave(true);
    } else SetDosave(false);
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
    let startDate = new Date();
    if(selectedMonth === "current" && (!selectedDays || selectedDays.length === 0)) {
      return <h4>עדיין לא נבחר כלום לחישוב</h4>
    }
    else if(selectedSub === "next") {
      console.log("startDate first", startDate.toLocaleString());
      startDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
      console.log("startDate change month", startDate.toLocaleString());
      startDate = new Date(startDate.setDate(1));
      console.log("startDate change day", startDate.toLocaleString());
    } 
    // בדיקת יתרת ארנק
    const quote = calcProratedQuote({
      planPrice:  selectedSub?.price,
      months:     selectedSub?.months,
      startDate:  startDate,
      daysOfWeek: selectedDays,
      roundTo: 1,
    })
    const price = Number(quote.price || selectedSub?.price || 0);
    const wallet = Number(user1?.wallet || 0);
    if (wallet < price) {
      toast.warn('אין מספיק כסף בארנק כדי לרכוש את המנוי, נא לעדכן את המנהל.');
      return;
    }

    setSaving(true);
    try {
      const res1 = await addSub(user1._id,selectedSub._id, quote.period.start, quote.period.end);
      if(!res1.ok) throw new Error(res1.message);
      toast.success('המנוי נוסף למשתמש בהצלחה!');
      const res2 = await updateUser(user1.tz, { wallet: wallet - price }, {confirm: false} ); // ודא שהפונקציה תומכת באובייקט חלקי
      if(!res2.ok) throw new Error(res2.message);
      toast.success('הארנק התעדכן!');
      for(const lesson of selectedLessons) {
        console.log("lesson.list_trainees1", lesson.list_trainees)
        lesson.list_trainees.push(user1._id);
        console.log("lesson.list_trainees2", lesson.list_trainees)
        const res3 = await addToList(lesson._id, [user1.id]);
        if(!res3.ok) throw new Error(res1.message);
      }
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
    let startDate = new Date();
    if(selectedMonth === "current" && (!selectedDays || selectedDays.length === 0)) {
      return <h4>עדיין לא נבחר כלום לחישוב</h4>
    }
    else if(selectedMonth === "next") {
      console.log("startDate first", startDate.toLocaleString());
      startDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
      console.log("startDate change month", startDate.toLocaleString());
      startDate = new Date(startDate.setDate(1));
      console.log("startDate change day", startDate.toLocaleString());
    } 
    const quote = calcProratedQuote({
      planPrice:  selectedSub?.price,
      months:     selectedSub?.months,
      startDate:  startDate,
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
          {<SelectDaysForTrainee selectedSubs={selectedSub} selected={selectedLessons} setSelected={setSelectedLessons} selectedMonth={selectedMonth} setSelectedMonth= {setSelectedMonth}/>}
          {((selectedMonth === "current" && selectedDays && selectedDays.length > 0) || selectedMonth !== "current") && <h3>פירוט:</h3>} 
          {((selectedMonth === "current" && selectedDays && selectedDays.length > 0) || selectedMonth !== "current") && forPay()}
        </>
      }

      {user1 && <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          type="button"
          style={dosave ? { backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' } : { backgroundColor: 'gray', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', cursor: 'none' }}
          onClick={() => {handleSave()}}
          disabled={!dosave}
          
        >
          {saving ? 'שומר…' : '💾 שמור'}
        </button>
      </div>}
    </div>
  );
}
