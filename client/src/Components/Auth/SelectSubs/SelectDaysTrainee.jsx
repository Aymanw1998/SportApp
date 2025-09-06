import React, { useEffect, useState } from "react";
import { getAllLesson } from "../../../WebServer/services/lesson/functionsLesson";
import "./SelectSub.css";
import { toast } from "../../../ALERT/SystemToasts";

const SelectDaysForTrainee = ({ selectedSubs,selected = [], setSelected}) => {
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
      const res = await getAllLesson();
      console.log("res loadData", res)
      if(!res.ok)
        return toast.warn(res.message);
      const lessons = res.lessons;
      if (lessons) {
        let listThisMonth = [];
        let listNextMonth = [];
        for (const lesson of lessons) {
          const { day, hh } = lesson.date;
          const hourKey = `${String(hh).padStart(2, '0')}:00`;
          const rowIndex = hours.findIndex((h) => h.includes(hourKey));
          console.log("day", day, "hh", hh, "hourKey", hourKey, "rowIndex", rowIndex);
          if (rowIndex !== -1 && day >= 0 && day < 5) {
            const thisMonth = new Date();
            const lastMonth = new Date(); lastMonth.setMonth(thisMonth.getMonth() - 1);
            const lessonMonth = new Date(lesson?.created);
              console.log("thisMonth", thisMonth); console.log("lastMonth", lastMonth); console.log( "lessonMonth", lastMonth);
  
            let isLastMonth =
              lessonMonth.getMonth() === lastMonth.getMonth() &&
              lessonMonth.getFullYear() === lastMonth.getFullYear();
  
            let isThisMonth =
              lessonMonth.getMonth() === thisMonth.getMonth() &&
              lessonMonth.getFullYear() === thisMonth.getFullYear();
            console.log("isLastMonth", isLastMonth, "isThisMonth", isThisMonth)
            if (isLastMonth) {
              listThisMonth.push(lesson);
            }
            else if(isThisMonth){
              listNextMonth.push(lesson);
            } else {
                    let list = []; 
                    for(let i =0; i < days.length; i++){
                      for(let j = 0; j < selectedSubs.times_week; j++){
                        list.push({
                          _id: `${i}${j}`,
                          name: `test${i}${j}`,
                          date: {day: i, hh: 10+j},
                          list_trainees:[]
                        })
                      }
                    }
                  setLessonsThisMonth(list);
                  return;
            }
          }
        }
        setLessonsThisMonth(listThisMonth);
        setLessonsNextMonth(listNextMonth);
      }
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
        {lessonsThisMonth.length > 0 && <h3>שיעורים לחודש הזה</h3>}
        <div className="subs-selection-container">
          {lessonsThisMonth.length > 0 && lessonsThisMonth.map((lesson) => {
            
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
