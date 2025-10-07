import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getOneLesson,
  createLesson,
  updateLesson,
  getAllLesson,
  deleteLesson,
} from '../../WebServer/services/lesson/functionsLesson';
import { getAllUser, getUserById } from '../../WebServer/services/user/functionsUser';
import { getAll } from '../../WebServer/services/training/functionTraining';
import styles from './EditLesson.module.css';
import { toast } from '../../ALERT/SystemToasts';

const EditLesson = () => {
  const { id } = useParams(); // "new" או מזהה שיעור
  const navigate = useNavigate();
  const isNew = id === 'new';
  const searchParams = new URLSearchParams(window.location.search);
  const dayFromUrl = Number(searchParams.get('day')) || 1;
  const hhFromUrl = Number(searchParams.get('hh')) || 8;
  const monthFromUrl = Number(searchParams.get('month')) || new Date().getMonth()+1;
  const yearFromUrl = Number(searchParams.get('year')) || new Date().getFullYear();

  const [lesson, setLesson] = useState({
    name: '',
    date: { 
      day: dayFromUrl,     
      startMin: hhFromUrl*60,           // אם הגיע 'hh' מה-URL
      endMin:   hhFromUrl*60 + 45,
      month: monthFromUrl, 
      year: yearFromUrl },
      trainer: '', max_trainees: 10, list_trainees: [],
  });
  const [error, setError] = useState({
    name: '',
    date: { day: '', hh: '',month: '', year: '' },
    trainer: '',
    max_trainees: '',
    list_trainees: [],
  });

  // helper להמרת HH:MM <-> דקות
  const toMin = (hhmm) => {
    const [hh, mm] = (hhmm || '00:00').split(':').map(Number);
    return (hh*60 + (mm||0))|0;
  };
  const toHHMM = (min) => {
    const h = Math.floor(min/60);
    const m = min%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  // handleChange לשדות שעות
  const handleTimeChange = (name, hhmm) => {
    console.log("handleTimeChange", name, hhmm, toMin(hhmm));
    setLesson(prev => {
      let startMin = prev.date.startMin;
      let endMin   = prev.date.endMin;
      console.log("before", startMin, endMin);
      if (name === 'start') {
        startMin = toMin(hhmm);
        if (endMin <= startMin) endMin = startMin + 45
      } else {
        endMin = toMin(hhmm);
        if (endMin <= startMin + 45) endMin = startMin + 45; // לפחות דקה אחת
      }
      return { ...prev, date: { ...prev.date, startMin, endMin } };
    });
  };
  const [trainees, setTrainees] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [showTraineeModal, setShowTraineeModal] = useState(false);

  // פרה-פופול לשיעור חדש מה־querystring
  useEffect(() => {
    if (id === 'new') {
      setLesson((prev) => ({
        ...prev,
        date: { ...prev.date, day: dayFromUrl, hh: hhFromUrl },
      }));
    }
  }, [id, dayFromUrl, hhFromUrl]);

  // טעינת נתונים
  const loadData = async () => {
    try {
      const usersRes = await getAllUser();
      if (usersRes?.ok) {
        const allUsers = usersRes.users || [];
        setTrainees(allUsers.filter((u) => u.role === 'מתאמן'));
        // setTrainers(allUsers.filter((u) => u.role === 'מאמן'));
      } else{
        throw new Error(usersRes?.message)
      }
    }
    catch(err){
      console.error(err.message)
    }
    try{
      // לא חובה, אבל משאירים אם תרצה שימוש עתידי
      // await getAllLesson();

      if (id !== 'new') {
        const resL = await getOneLesson(id);
        if(!resL.ok) throw new Error(resL.message);
        const l = resL.lesson;
        console.log("l", l);
        if (l) {
          setLesson(l);
        } else {
          navigate(-1);
        }
      }
    } catch (e) {
      console.error(e);
      navigate(-1);
    }
    try{
      const resT = await getAll();
      console.log("resT", resT);
      if(!resT.ok) throw new Error(resT.message);
      setTrainings(resT.trainings || []);
    }
    catch(err){
      console.error(err.message)
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // שינוי שדות
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'day' || name === 'hh') {
      setLesson((prev) => ({
        ...prev,
        date: { ...prev.date, [name]: Number(value) },
      }));
      return;
    }

    if (name === 'max_trainees') {
      setLesson((prev) => ({ ...prev, max_trainees: Math.max(1, Number(value)) }));
      return;
    }

    setLesson((prev) => ({ ...prev, [name]: value }));
  };

    const validateBeforeSave = async(name = null, value = null) => {
        if(!name) {
          // ולידציה בסיסית
          if (!lesson.name?.trim()) return 'שם שיעור חובה';
          const d = Number(lesson.date.day) ;
          const start = Number(lesson.date.startMin);
          const end = Number(lesson.date.endMin);
          console.log("day,start,end", d, start, end);
          if (Number.isNaN(d) || d < 1 || d > 7) return 'יום בשבוע לא תקין';
          if (Number.isNaN(start) || start < 0 || start > 23 * 60) return 'שעה התחלה לא תקינה';
          if (Number.isNaN(end) || end < start || end > 23 * 60) return 'שעת סיום לא תקינה';

          if (lesson.list_trainees.length > Number(lesson.max_trainees)) {
          return 'מספר המשתתפים חורג מהמקסימום';
          }
        return null;
      }
      else{
        const tag = document.getElementsByName(name)[0];
        if(name === "name" && isNew && value === ""){
          tag?.style.setProperty('border', '2px solid red'); // או ישירות סטייל
          return "מלאה שדה";
        } else if(name === "name" && isNew) {
          return "";
        }
    }
  };
  

  // שמירה
  const handleSave = async () => {
    let b = await validateBeforeSave();
    if (b) { toast.warn(b); return; }
    for(const tag in [{'name': lesson.name} ,{'date.day': lesson.date.day},{'date.hh': lesson.date.hh}, {'max_trainees': lesson.max_trainees}]){
      validateBeforeSave(tag.key, tag.value);
    }
    try {
      const resL =
        id === 'new'
          ? await createLesson({...lesson, ...{trainer: localStorage.getItem("user_id")}})
          : await updateLesson(id,{...lesson,...{trainer: localStorage.getItem("user_id")}});
      
      if (!resL) return;
      if (resL.ok) {
        // alert(`✅ השיעור ${id === 'new'? 'נשמר' : 'עודכן' } בהצלחה`);
        console.log(`✅ השיעור ${id === 'new'? 'נשמר' : 'עודכן' } בהצלחה`);
        toast.success(`✅ השיעור ${id === 'new'? 'נשמר' : 'עודכן' } בהצלחה`);
        navigate(-1);
      } else {
        // alert(resL.message || '❌ שגיאה בשמירה');
        // console.warn(resL.message || '❌ שגיאה בשמירה');
        toast.warn(resL.message || '❌ שגיאה בשמירה');
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || '❌ שגיאה בשמירה');
    }
  };

  // מחיקה
  const handleDelete = async () => {
    if (id === 'new') return;

    try {
      const resDL = await deleteLesson(id);
      if(!resDL) return;
      if("delete b", resDL);
      if (resDL.ok) {
        toast.success('✅ השיעור נמחק');
        navigate(-1);
      } else {
        toast.warn('❌ השיעור לא נמחק');
      }
    } catch {
      toast.error('❌ שגיאה במחיקה');
    }
  };

  const filteredSelected = trainees
    .filter((u) => lesson.list_trainees.includes(u._id))
    .filter((u) => (u.firstname + u.lastname + u.tz).toLowerCase().includes(searchTerm.toLowerCase()));

  const modalChoices = trainees.filter((u) =>
    (u.firstname + ' ' + u.lastname + u.tz).toLowerCase().includes(searchTerm2.toLowerCase())
  );

  return (
    <div className={styles.editLessonContainer}>
      {localStorage.getItem('role') === 'מנהל' ? (
        <h2>{id === 'new' ? '➕ הוספת שיעור' : '✏️ עריכת שיעור'}</h2>
      ) : (
        <h2>צפייה בפרטי השיעור</h2>
      )}

      <div className={styles.formControl}>
        <label>שם שיעור:</label>
        {/* <input
          type="text"
          name="name"
          value={lesson.name}
          onChange={handleChange}
          placeholder="הכנס שם שיעור"
          disabled={localStorage.getItem('role') !== 'מנהל'}
        /> */}
        <select
          name="name"
          value={lesson.name}
          onChange={handleChange}
          disabled={localStorage.getItem('role') !== 'מנהל'}
        >
          <option value="">בחר אימון</option>
          {trainings.length > 0 &&
            trainings.map((t) => (
              <option key={t._id} value={t.name}>
                {t.name}
              </option>
            ))}
        </select>

        <label style={{color: "red"}}>{error.name}</label>
      </div>

      {trainers.length > 0 && <div className={styles.formControl}>
        <label>מאמן:</label>
        <select
          name="trainer"
          value={lesson.trainer}
          onChange={handleChange}
          disabled={localStorage.getItem('role') !== 'מנהל'}
        >
          <option value="">בחר מאמן</option>
          {Array.isArray(trainers) &&
            trainers.map((trainer) => (
              <option key={trainer._id} value={trainer._id}>
                {trainer.firstname} {trainer.lastname}
              </option>
            ))}
        </select>
        <label style={{color: "red"}}>{error.trainer}</label>
      </div> }

      <div className={styles.formControl}>
        <label htmlFor="max_trainees">כמות משתתפים מקסימלית:</label>
        <input
          type="number"
          id="max_trainees"
          name="max_trainees"
          value={lesson.max_trainees}
          onChange={handleChange}
          min="1"
          disabled={localStorage.getItem('role') !== 'מנהל'}
        />
        <label style={{color: "red"}}>{error.max_trainees}</label>
      </div>
      <div className={styles.formControl}>
        <label>יום בשבוע:</label>
        <select
          name="day"
          value={lesson.date.day}
          onChange={handleChange}
          disabled={localStorage.getItem('role') !== 'מנהל'}
        >
          {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'/*,'שישי','שבת'*/].map((d, i) => (
            <option value={i+1} key={i+1}>
              {d}
            </option>
          ))}
        </select>
        <label style={{color: "red"}}>{error.date.day}</label>
      </div>

      <div className={styles.formControl}>
        <label>שעת התחלה:</label>
        <input
          type="time"
          value={toHHMM(lesson.date.startMin)}
          onChange={(e) => handleTimeChange('start', e.target.value)}
          disabled={localStorage.getItem('role') !== 'מנהל'}
        />
      </div>
      <div className={styles.formControl}>
        <label>שעת סיום:</label>
        <input
          type="time"
          value={toHHMM(lesson.date.endMin)}
          onChange={(e) => handleTimeChange('end', e.target.value)}
          disabled={localStorage.getItem('role') !== 'מנהל'}
        />
      </div>

      <h4>מתאמנים שנבחרו: {lesson.list_trainees?.length || 0}</h4>

      {localStorage.getItem('role') === 'מנהל' && (
        <>
          <input
            type="text"
            placeholder="חפש מתאמן לפי שם או תעודת זהות"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}
            onClick={() => setShowTraineeModal(true)}
          >
            ➕ הוסף מתאמנים
          </button>

          <table className={styles.selectedTraineesTable}>
            <thead>
              <tr>
                <th>ת.ז.</th>
                <th>שם פרטי</th>
                <th>שם משפחה</th>
              </tr>
            </thead>
            <tbody>
              {filteredSelected.map((u) => (
                <tr key={u._id}>
                  <td>{u.tz}</td>
                  <td>{u.firstname}</td>
                  <td>{u.lastname}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.buttonRow}>
            <button type="button" onClick={handleSave}>
              {id !== 'new' ? 'שמור שינויים' : 'צור שיעור'}
            </button>
            {id !== 'new' && (
              <button type="button" style={{ background: 'red' }} onClick={handleDelete}>
                מחיקת שיעור
              </button>
            )}
            <button type="button" style={{ background: "#6b7280" }} onClick={() => navigate(-1)}>
          חזרה לרשימה
        </button>
          </div>
        </>
      )}

      {showTraineeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h4>הוספת מתאמנים</h4>
            <input
              type="text"
              placeholder="חיפוש לפי שם או תז"
              value={searchTerm2}
              onChange={(e) => setSearchTerm2(e.target.value)}
            />

            <div className={styles.traineesList}>
              {modalChoices.map((trainee) => {
                const alreadyInList = lesson.list_trainees.includes(trainee._id);
                return (
                  <label key={trainee._id} className={styles.traineeItem}>
                    <input
                      type="checkbox"
                      checked={alreadyInList}
                      onChange={(e) => {
                        const { checked } = e.target;
                        if (checked && lesson.list_trainees.length === Number(lesson.max_trainees)) {
                          return toast.warn('הגענו למקסימום משתתפים לשיעור הזה');
                        }
                        setLesson((prev) => ({
                          ...prev,
                          list_trainees: checked
                            ? [...prev.list_trainees, trainee._id]
                            : prev.list_trainees.filter((tid) => tid !== trainee._id),
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
