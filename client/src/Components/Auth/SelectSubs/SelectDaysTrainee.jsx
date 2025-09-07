import React, { useEffect, useState } from "react";
import { getAllLesson } from "../../../WebServer/services/lesson/functionsLesson";
import "./SelectSub.css";
import { toast } from "../../../ALERT/SystemToasts";

const SelectDaysForTrainee = ({ selectedSubs,selected = [], setSelected}) => {
  const [tableData, setTableData] = useState([]);
  const [lessonsThisMonth, setLessonsThisMonth] = useState([]);
  useEffect(()=>console.log("lessonsThisMonth", lessonsThisMonth),[lessonsThisMonth]);
  const [lessonsNextMonth, setLessonsNextMonth] = useState([]);
  useEffect(()=>console.log("lessonsNextMonth", lessonsNextMonth),[lessonsNextMonth]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const generateTimeSlots = (start, end) => {
    const slots = [];
    for (let i = start; i < end; i++) {
      const left = `${String(i).padStart(2,'0')}:45`;
      const right = `${String(i).padStart(2,'0')}:00`;
      slots.push(`${left} - ${right}`);
    }
    return slots;
  };

  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'/*,'שישי','שבת'*/]
  const hours = generateTimeSlots(8, 23);
  const getDayName = (i) => days[i];
  const getHourSlot = (hh) => `${String(hh).padStart(2, '0')}:45 - ${String(hh).padStart(2, '0')}:00`;

  const loadData = async () => {
        const resL = await getAllLesson();
        if(!resL.ok) {
          setTableData(tableData);
          return toast.error("שגיאה בטעינת השיעורים");
        }
        const lessons = resL.lessons;
        let table = [];
        for (const lesson of lessons) {
          const { day, hh, month, year } = lesson.date;          // month = 1..12
          const today = new Date();
          if (day >= 1 && day <= 5) {
            if (month === today.getMonth() + 2 && year === today.getFullYear()) {
              table.push(lesson);
            }
          }
        }
        setTableData(table);
    };
  
  useEffect(() => { loadData(); }, [selectedSubs]);
  useEffect(() =>console.log("selected", selected), [selected]);
  const toggleSelect = (lesson) => {
    console.log("toggleSelect", selectedSubs, selected);
    for(let i =0; i < selected.length; i++) {
      if(selected[i]._id == lesson._id)
      {
        setSelected(selected.filter((l) => l._id !== lesson._id));
        return;
      }
    }
    if(selectedSubs.times_week > selected.length)
      setSelected([...selected, lesson]);
    else return toast.warn('הגעת למקסימום השיעורים המותרים לפי המנוי');
  };

  if (loading) return <div className="subs-selection-container">טוען שיעורים</div>;
  if (err) return <div className="subs-selection-container error">{err}</div>;
  
  return (
    <div>
      <div>
        {tableData.length > 0 && <h3>שיעורים לחודש הזה</h3>}
        <div className="subs-selection-container">
          {tableData.map((lesson) => {
            
            const isSelected = selected.filter(l => l._id === lesson._id).length > 0;            
            return (
              <div
                key={lesson._id}
                className={`sub-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleSelect(lesson)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {if (e.key === "Enter" || e.key === " ") toggleSelect(lesson);}}
              >
              <div style={{ display: 'flex', gap: 4 }}><span>🧑‍🏫</span><span>שיעור:</span><span>{lesson.name}</span></div>
              <div style={{ display: 'flex', gap: 4 }}><span>🕒</span><span>שעה:</span><span>{lesson.date.hh}:00</span></div>
              <div style={{ display: 'flex', gap: 4 }}><span>📅</span><span>יום:</span><span>{days[lesson.date.day]}</span></div>
              <div style={{ display: 'flex', gap: 4 }}><span>👨‍👨‍👦‍👦</span><span>משתתפים:</span><span>{lesson.list_trainees?.length ?? 0}</span></div>
              <button
                type="button"
                className="select-btn"
                onClick={(e) => { e.stopPropagation(); toggleSelect(lesson); }}
              >
                {isSelected ? "✅ נבחר" : "בחר שיעור"}
              </button>
            </div>
          );
        })}
        </div>
      </div>

      <div>
        {lessonsNextMonth.length > 0 && <h3>שיעורים לחודש הבא</h3>}
        <div className="subs-selection-container">
          {lessonsNextMonth.length > 0 && lessonsNextMonth.map((lesson) => {
            const isSelected = selected.filter(l => l._id === lesson._id).length > 0;
            return (
              <div
                key={lesson._id}
                className={`sub-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleSelect(lesson)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {if (e.key === "Enter" || e.key === " ") toggleSelect(lesson);}}
              >
              <div style={{ display: 'flex', gap: 4 }}><span>🧑‍🏫</span><span>שיעור:</span><span>{lesson.name}</span></div>
              <div style={{ display: 'flex', gap: 4 }}><span>🕒</span><span>שעה:</span><span>{lesson.date.hh}:00</span></div>
              <div style={{ display: 'flex', gap: 4 }}><span>📅</span><span>יום:</span><span>{days[lesson.date.day]}</span></div>
              <div style={{ display: 'flex', gap: 4 }}><span>👨‍👨‍👦‍👦</span><span>משתתפים:</span><span>{lesson.list_trainees?.length ?? 0}</span></div>
              <button
                type="button"
                className="select-btn"
                onClick={(e) => { e.stopPropagation(); toggleSelect(lesson); }}
              >
                {isSelected ? "✅ נבחר" : "בחר שיעור"}
              </button>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default SelectDaysForTrainee;
