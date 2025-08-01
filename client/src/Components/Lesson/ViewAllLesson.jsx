import React, { useEffect, useState } from 'react';
import './ViewAllLesson.css';
import { getAllLesson, updateLesson } from '../services/lesson/functionsLesson';
import { useNavigate } from 'react-router-dom';

const ScheduleView = ({ tableData, handleMouseEnter, handleMouseMove, handleMouseLeave, isChange}) => {
    // מיפוי נתונים לשיעורים עבור מובייל
    const flatLessons = [];
    const navigate =  useNavigate()
    tableData.forEach((row, hourIndex) => {
        row.forEach((lesson, dayIndex) => {
        if (lesson) {
            flatLessons.push({
            _id: lesson._id,
            name: lesson.name,
            day: dayIndex,
            hh: lesson.date.hh,
            max_trainees: lesson.max_trainees,
            num_in_list: lesson.num_in_list,
            trainer: lesson.trainer?.firstname + ' ' + lesson.trainer?.lastname || '',
            });
        }
        });
    });

    const getDayName = (index) => ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'][index];

    const getHourSlot = (hh) => {
        const start = hh.toString().padStart(2, '0') + ":00";
        const end = hh.toString().padStart(2, '0') + ":45";
        return `${start} - ${end}`;
    };

    const hours = Array.from({ length: 15 }, (_, i) => 8 + i); // 08:00 - 22:00

    return (
        <div className="schedule-container">

        {/* 📱 מובייל: הצגה כרשימה */}
        <div className="mobile-view">
            {flatLessons.sort((a,b) => {
                if(a.day !== b.day) return a.day - b.day;
                return a.hh - b.hh;
            }).map((lesson, idx) => (
            <div className="lesson-card" key={idx}
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                onClick={() =>{
                    if(!isChange && !lesson) return;    
                    lesson
                        ? navigate(`/lessons/${lesson._id}`)
                        : navigate(`/lessons/new?day=${colIndex}&hh=${hours[rowIndex].split(':')[0]}`)
                    }
                }
            >
                <p><strong>שיעור:</strong> {lesson.name}</p>
                <p><strong>יום:</strong> {getDayName(lesson.day)}</p>
                <p><strong>שעה:</strong> {getHourSlot(lesson.hh)}</p>
                <p><strong>מאמן:</strong> {lesson.trainer}</p>
                <p><strong>נרשמים:</strong> {lesson.num_in_list}/{lesson.max_trainees}</p>
            </div>
            ))}
        </div>

        {/* 💻 דסקטופ: טבלה רגילה */}
        <table className="tooltip-table desktop-view">
            <thead>
            <tr>
                <th>שעה</th>
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, i) => (
                <th key={i}>{day}</th>
                ))}
            </tr>
            </thead>
            <tbody>
            {hours.map((hh, rowIdx) => (
                <tr key={rowIdx}>
                <td>{getHourSlot(hh)}</td>
                {tableData[rowIdx]?.map((lesson, colIdx) => (
                    <td key={colIdx}
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                        onClick={() =>{
                            if(!isChange && !lesson) return;    
                            lesson
                            ? navigate(`/lessons/${lesson._id}`)
                            : navigate(`/lessons/new?day=${colIndex}&hh=${hours[rowIndex].split(':')[0]}`)
                        }
                    }
                    >
                    {lesson ? (
                        <div className="cell-content"
                            onMouseEnter={() => handleMouseEnter(lesson, lesson.date.hh, ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'][lesson.date.day])}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                        {lesson.name}
                        </div>
                    ) : null}
                    </td>
                ))}
                </tr>
            ))}
            </tbody>
        </table>

        </div>
    );
};


const ViewAllLesson = () => {
    const navigate = useNavigate();
    const generateTimeSlots = (start, end) => {
        const slots = [];
        for (let i = start; i < end; i++) {
        slots.push(i > 9 ? `${i}:45 - ${i}:00` : `0${i}:45 - 0${i}:00`);
        }
        return slots;
    };

    const [isChange, setIsChange] = useState((localStorage.getItem("isChange"))== 'true' || false);
    useEffect(()=>{localStorage.setItem("isChange", isChange); console.log("isChange", isChange)},[isChange])
    const hours = generateTimeSlots(8, 23);
    const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    const [tableData, setTableData] = useState([]);
    const [tooltipInfo, setTooltipInfo] = useState({
        show: false,
        content: '',
        x: 0,
        y: 0,
    });
    useEffect(()=> console.log("tooltipInfo", tooltipInfo),[tooltipInfo])
    const loadData = async () => {
        const data = await getAllLesson();
        if (data.status === 200) {
        const table = Array(hours.length)
            .fill(null)
            .map(() => Array(days.length).fill(null));

        for (let lesson of data.lessons) {
            const { day, hh } = lesson.date;
            const hourKey = `${hh.toString().padStart(2, '0')}:00`;
            const rowIndex = hours.findIndex((h) => h.includes(hourKey));
            if (rowIndex !== -1 && day >= 0 && day < 7) {
                const thisMonth = new Date();
                const lastMonth = new Date(); lastMonth.setMonth(thisMonth.getMonth() -1);
                const lessonMonth = new Date(lesson?.created);
                console.log(lesson,"isChange", isChange);
                console.log("thisMonth", thisMonth.getMonth(), thisMonth.getFullYear());
                console.log("lastMonth", lastMonth.getMonth(), lastMonth.getFullYear());
                console.log("lessonMonth", lessonMonth.getMonth(), lessonMonth.getFullYear());
                if((!isChange && lessonMonth.getMonth() === lastMonth.getMonth() && lessonMonth.getFullYear() === lastMonth.getFullYear()) || (isChange && lessonMonth.getMonth() === thisMonth.getMonth() && lessonMonth.getFullYear() === thisMonth.getFullYear()))
                    table[rowIndex][day] = lesson;
            }
        }

        setTableData(table);
        }
    };

    useEffect(() => {
        loadData();
    }, [isChange]);

    const handleMouseEnter = (lesson, hour, day) => {
        console.log("handleMouseEnter", lesson.date, day)
        if (!lesson) return;
        setTooltipInfo((prev) => ({
        ...prev,
        show: true,
        content: (
        <>
            <div style={{ display: "flex", gap: "4px" }}>
            <span>🧑‍🏫</span>
            <span>שיעור:</span>
            <span>{lesson.name}</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
            <span>🕒</span>
            <span>שעה:</span>
            <span>{hour}:00</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
            <span>📅</span>
            <span>יום:</span>
            <span>{day}</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
            <span>👨‍👨‍👦‍👦</span>
            <span>משתתפים:</span>
            <span>{lesson.num_in_list}</span>
            </div>
        </>
        )
,
        }));
    };

    const handleMouseMove = (e) => {
        console.log("handleMouseMove")
        setTooltipInfo((prev) => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
        }));
    };

    const handleMouseLeave = () => {
        console.log("handleMouseLeave")
        setTooltipInfo({ show: false, content: '', x: 0, y: 0 });
    };

    const handleDrop = (e, targetRow, targetCol) => {
        console.log("handleDrop")
        if(!isChange) return;
        const lessonId = e.dataTransfer.getData('lesson-id');
        const originDay = parseInt(e.dataTransfer.getData('origin-day'));
        const originHour = parseInt(e.dataTransfer.getData('origin-hour'));
        console.log(lessonId, originDay, originHour)
        if (!lessonId) return;

        const lesson = tableData[originHour][originDay];
        if (!lesson) return;

        // עדכון מקומי בטבלה
        const updatedLesson = {
            ...lesson,
            date: {
            ...lesson.date,
            day: targetCol,
            hh: parseInt(hours[targetRow].split(':')[0]),
            },
        };

        // עדכון במסד נתונים
        updateLesson(lessonId, updatedLesson.name, updatedLesson.date, updatedLesson.trainer, updatedLesson.max_trainees, updatedLesson.list_trainees)
            .then(res => {
            if (res.status === 200) {
                loadData(); // רענון הטבלה
            } else {
                alert('❌ שגיאה בעדכון מועד השיעור');
            }
            });
        };

        const getTheMonthYear = (jump) => {
            const d = new Date(); // 1 בדצמבר 2025 (11 = דצמבר)
            d.setMonth(d.getMonth() + jump); // מוסיפים חודש → ינואר 2026
            return`${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; 
        }
    return (
        <div className="schedule-container">
        <h1 className='title'>{isChange? `ערכת שעות החודש הבאה (${getTheMonthYear(+1)})` : `ערכת שעות החודש הנוכחי (${getTheMonthYear(0)})`}</h1>
        <button onClick={()=>setIsChange(!isChange)}>{isChange? "הצגת מערכת החודש":"הצגת מערכת לחודש הבא"}</button>
        <ScheduleView isChange={isChange} tableData ={tableData} handleMouseEnter={handleMouseEnter} handleMouseMove={handleMouseMove} handleMouseLeave={handleMouseLeave}/>
        {/* <table className="tooltip-table">
            <thead>
            <tr>
                <th>שעה</th>
                {days.map((day, index) => (
                <th key={index}>{day}</th>
                ))}
            </tr>
            </thead>
            <tbody>
            {hours.map((hour, rowIndex) => (
                <tr key={rowIndex}>
                <td>{hour}</td>
                {days.map((dayLabel, colIndex) => {
                    const lesson = tableData[rowIndex]?.[colIndex];
                    return (
                    <td key={colIndex}   
                    onDragOver={(e) => e.preventDefault()} 
                    onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                    onClick={() =>{
                        if(!isChange && !lesson) return;    
                        lesson
                            ? navigate(`/lessons/${lesson._id}`)
                            : navigate(`/lessons/new?day=${colIndex}&hh=${hours[rowIndex].split(':')[0]}`)
                        }
                    }
                    >
                        <div
                        className="cell-content"
                        style={{
                            background: isChange ? !!lesson ? "": "#00FF00": "", 
                            cursor: isChange? "pointer" : '',
                        }}
                        draggable={!!lesson} רק אם יש שיעור
                        onDragStart={(e) => {
                            console.log("🚚 Drag started", !!lesson);
                            e.dataTransfer.setData('lesson-id', lesson._id);
                            e.dataTransfer.setData('origin-day', colIndex);
                            e.dataTransfer.setData('origin-hour', rowIndex);
                        }}
                        onMouseEnter={() => handleMouseEnter(lesson, hour, dayLabel)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        >
                        {isChange && !lesson? "+":lesson?.name}
                        </div>
                    </td>
                    );
                })}
                </tr>
            ))}
            </tbody>
        </table> */}

        {tooltipInfo.show && (
            <div
            style={{
                top: tooltipInfo.y,
                left: tooltipInfo.x,
                position: 'absolute',
                background: "black",
                color: "white",
                padding: "10px",
                border: '1px solid black',
                borderRadius: '5px!important'            
            }}
            >
            {tooltipInfo.content}
            </div>
        )}
        </div>
    );
};

export default ViewAllLesson;
