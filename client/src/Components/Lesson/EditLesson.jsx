import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useAsyncError } from 'react-router-dom';
import { getOneLesson, createLesson, updateLesson, getAllLesson, deleteLesson } from '../services/lesson/functionsLesson';
import { getAllUser, getUserById } from '../services/user/functionsUser';
import './EditLesson.css';

const EditLesson = () => {
    const { id } = useParams(); // "new" או מזהה שיעור
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(window.location.search);
    const dayFromUrl = parseInt(searchParams.get('day')) || 0;
    const hhFromUrl = parseInt(searchParams.get('hh')) || 8;

    useEffect(() => {
    if (id === 'new') {
        setLesson(prev => ({
        ...prev,
        date: {
            ...prev.date,
            day: dayFromUrl,
            hh: hhFromUrl
        }
        }));
    }
    }, []);

    const [lesson, setLesson] = useState({
        name: '',
        date: { day: 0, hh: 0,},
        trainer: '',
        max_trainees: 10,
        list_trainees: []
    });
    const [lessonConst, setLessonConst] = useState({
        name: '',
        date: { day: 0, hh: 0,},
        trainer: '',
        max_trainees: 10,
        list_trainees: []
    });

    useEffect(()=>console.log("lesson", lesson), [lesson])
    const [users, setUsers] = useState([]);
    useEffect(()=>console.log("users",users),[users])
    const [lessons, setLessons] = useState([]);
    useEffect(()=>console.log("lessons",lessons),[lessons])
    const loadData = async() =>{
        console.log("in edite lesson page")
        await getAllUser().then(res => {
            if (res.status === 200) setUsers(res.users);
        });
        await getAllLesson().then(async res =>{
            if(res.status == 200) {
                setLessons(res.lessons);
            }

        });
        if (id !== 'new') {
            getOneLesson(id).then(res => {
                if (res.status === 200) {
                    setLesson(res.lesson);setLessonConst(res.lesson);
                    getUserById(res.lesson.trainer).then(res=> setUsers([res.user]))

                }
            }).catch(err=> navigate(-1));
        }
        console.log("have users and lessons")
    }
    
    useEffect(() => {loadData();}, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['day', 'hh'].includes(name)) {
        setLesson({ ...lesson, date: { ...lesson.date, [name]: Number(value) } });
        } else {
        setLesson({ ...lesson, [name]: value });
        }
    };

    const handleSave = async () => {
        if(lesson.name === "" || lesson.date.day.hh === "" || lesson.trainer === "") return alert("אחד מהשדות לא תקינות");
        const res = id === 'new'
        ? await createLesson(lesson.name,lesson.date, lesson.trainer, lesson.max_trainees, lesson.list_trainees)
        : await updateLesson(id, lesson.name, lesson.date, lesson.trainer, lesson.max_trainees, lesson.list_trainees);
        if (res.status === 200 || res.status === 201) {
        alert('✅ השיעור נשמר בהצלחה');
        navigate(-1);
        } else {
        alert('❌ שגיאה בשמירה');
        }
    };

    const handleDelete = async() => {
        if (!window.confirm("למחוק שיעור?")) return
        await deleteLesson(id).then(res=>console.log("השיעור נימחק"));
        navigate(-1);
    }    
    const [showTraineeModal, setShowTraineeModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTerm2, setSearchTerm2] = useState('');


  return (
    <div className="edit-lesson-container">
        {localStorage.getItem("role") == "מנהל" ? 
            <h2>{id === 'new' ? '➕ הוספת שיעור' : '✏️ עריכת שיעור'}</h2> :
            <h2>צפיה בפרטי השיעור</h2>

        }

        <div className="datetime-group">
            <div className="form-control">
                <label>שם שיעור:</label>
                <input
                    type="text"
                    name="name"
                    value={lesson.name}
                    onChange={handleChange}
                    placeholder="הכנס שם שיעור"
                    disabled={localStorage.getItem("role") !== "מנהל"}
                />
            </div>
            <div className="form-control">
                <label>מאמן:</label>
                <select name="trainer"  value={lesson.trainer} onChange={handleChange} disabled={localStorage.getItem("role") !== "מנהל"}>
                    <option value="">בחר מאמן</option>
                    {users.filter(u => u.role === 'מאמן').map(u => {
                        if(id === 'new' && lessons.filter(le => le.trainer == u._id && le.date.day == lesson.date.day && le.date.hh == lesson.date.hh).length > 0)
                            return;
                        if(id !== 'new' && lessons.filter(le => le.trainer == u._id && le.trainer !== lessonConst.trainer && le.date.day == lesson.date.day && le.date.hh == lesson.date.hh).length > 0)
                            return;
                        return <option key={u._id} value={u._id}>
                            {u.firstname} {u.lastname}
                        </option>
                    })}
                </select>
            </div>
            <div className="form-control">
                <label htmlFor="max_trainees">כמות משתתפים מקסימלית:</label>
                <input
                    type="number"
                    id="max_trainees"
                    name="max_trainees"
                    value={lesson.max_trainees}
                    onChange={handleChange}
                    min="1"
                    disabled={localStorage.getItem("role") !== "מנהל"}
                />
            </div>
            
        </div>
        <div className="datetime-group">
            <div className="form-control">
                <label>יום בשבוע:</label>
                <select name="day" value={lesson.date.day} onChange={handleChange} disabled={localStorage.getItem("role") !== "מנהל"}>
                {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].map((d, i) => (
                    <option value={i} key={i}>{d}</option>
                ))}
                </select>
            </div>
            <div className="form-control">
                <label>שעה:</label>
                <div className="time-inputs">
                    <span className="time-separator">00:</span>
                    <input
                    type="number"
                    name="hh"
                    value={lesson.date.hh}
                    onChange={handleChange}
                    min="0"
                    max="23"
                    placeholder="שעה"
                    disabled={localStorage.getItem("role") !== "מנהל"}
                    />
                </div>
            </div>
        </div>
        <h4>מתאמנים שנבחרו: {`${lesson.list_trainees?.length}`}</h4>
        {localStorage.getItem("role") === "מנהל" && 
        <><input
        type="text"
        placeholder="חפש מתאמן לפי שם או תעודת זהות"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }} onClick={() => setShowTraineeModal(true)}>➕ הוסף מתאמנים</button>
        <table className="selected-trainees-table">
        <thead>
        <tr>
            <th>ת.ז.</th>
            <th>שם פרטי</th>
            <th>שם משפחה</th>
        </tr>
        </thead>
        <tbody>
        {users
            .filter(u => lesson.list_trainees.includes(u._id))
            .filter(u =>
            (u.firstname + u.lastname + u.tz).includes(searchTerm)
            )
            .map(u => (
            <tr key={u._id}>
                <td>{u.tz}</td>
                <td>{u.firstname}</td>
                <td>{u.lastname}</td>
            </tr>
        ))}
        </tbody>
        </table>
        <div className='button-row'>
            <button type="submit" onClick={handleSave}>{id !== "new" ? "שמור שינויים" : "צור שיעור"}</button>
            {id !== "new" && <button type="submit" style={{background: "red"}}onClick={handleDelete}>מחיקת שיעור</button>}
        </div></>}

        {showTraineeModal && (
        <div className="modal-overlay">
            <div className="modal-content">
            <h4>הוספת מתאמנים</h4>
            <input
                type="text"
                placeholder="חיפוש לפי שם או תז"
                value={searchTerm2}
                onChange={(e) => setSearchTerm2(e.target.value)}
            />
            <div className="trainees-list">
                {users
                .filter(u => u.role === 'מתאמן')
                .filter(u =>
                    (u.firstname + ' ' + u.lastname + u.tz).includes(searchTerm2)
                )
                .map(trainee => {
                    const alreadyInList = lesson.list_trainees.includes(trainee._id);
                    return (
                    <label key={trainee._id} className="trainee-item">
                        <input
                        type="checkbox"
                        checked={alreadyInList}
                        onChange={(e) => {
                            const { checked } = e.target;
                            if(checked == true && lesson.list_trainees.length === lesson.max_trainees)
                            {
                                return alert("הגענו למקסימום משתתפים לשיעור הזה");
                            }
                            setLesson(prev => ({
                            ...prev,
                            list_trainees: checked
                                ? [...prev.list_trainees, trainee._id]
                                : prev.list_trainees.filter(id => id !== trainee._id)
                            }));
                        }}
                        />
                        {trainee.firstname} {trainee.lastname} ({trainee.tz})
                    </label>
                    );
                })}
            </div>
            <button onClick={() => setShowTraineeModal(false)}>✔️ סגור</button>
            </div>
        </div>
        )}

    </div>
  );
};

export default EditLesson;
