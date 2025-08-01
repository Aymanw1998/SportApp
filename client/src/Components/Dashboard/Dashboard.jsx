import React, { useEffect, useState } from 'react';
import "./style.css"
import {getAllUser} from "./../services/user/functionsUser"
import { getAllLesson } from '../services/lesson/functionsLesson';
const LessonsTable = ({lessons, users}) => {
    return (
    <div className="p-4">
        <table className="table table-bordered lessons-table">
            <thead>
                <tr>
                    <th>יום</th>
                    <th>שעה</th>
                    <th>מאמן</th>
                    <th>רישומים</th>
                    <th>מקסימום</th>
                </tr>
            </thead>
            <tbody>
            {[...lessons].sort((a,b)=>{
                if(a.date.day !== b.date.day) return a.date.day - b.date.day;
                return a.date.hh - b.date.hh;
            }).map((lesson) => {
                const date = lesson.date;
                const trainer = users.filter(u => u._id == lesson.trainer)[0];
                console.log("trainer", lesson.trainer, trainer);
                return(
                    <tr key={lesson._id}>
                        <td>{['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][date.day]}</td>
                        <td>{date.hh}:00</td>
                        <td>{trainer?.firstname} {trainer?.lastname}</td>
                        <td>{lesson.list_trainees?.length}</td>
                        <td>{lesson.max_trainees}</td>
                    </tr>
                )
            })}
            </tbody>
        </table>
    </div>
    );
};
const UsersCardBoard = ({ users }) => {
    return (
        <div className="users-grid">
            {users.map(user => (
            <div key={user._id} className="card">
                <h4 className="card-title">{user.firstname + " " + user.lastname}</h4>
                <div>ת.ז.: {user.tz}</div>
                <div>שם משתמש: {user.username}</div>
                <div>מין: {user.gender}</div>
                <div>{user.role}</div>
                <button className="card-button">Contact</button>
            </div>
            ))}
        </div>

    );
};

const MessageBoxSystem = () => {
    const tody = new Date();
    return(
        <div>
            {(
                <div className="system-message" style={{ backgroundColor: "#fff3cd", padding: "1rem", borderRadius: "8px", border: "1px solid #ffeeba", marginBottom: "1rem" }}>
                    <strong>📌 תזכורת:</strong> ההרשמה לחודש הקרוב נפתחה! ניתן להירשם כבר עכשיו דרך המערכת.
                </div>
            )}
        </div>
    )
}
const Dashborad = () => {

    const [me, setMe] = useState(JSON.parse(localStorage.getItem("user")));
    useEffect(()=>console.log("me: ", me),[me])
    const [users, setUsers] = useState([]);
    useEffect(()=>console.log("users: ", users),[users])
    const [lessons, setLessons] = useState([]);
    useEffect(()=>console.log("lessons: ", lessons),[lessons])
    const [role, setRole] = useState(localStorage.getItem("role"));
    useEffect(()=>console.log("role: ", role),[role])

    useEffect(()=>{
        loadData();
    },[])


    const loadData = async() => {
        let data = {}, list = [], models = []; 
        //שליפת משתמשים
        data = await getAllUser();
        if(data.status == 200) {
            models = data.users.filter(u => u._id != me._id)
            list = []
            for( let i = 0; i < models.length && i < 5; i++)
            {
                list.push(models[i]);
            }
            console.log(list)
            setUsers(list);
        }
        //שליפת שיעורים
        data = await getAllLesson();
        if(data.status == 200) {
            models = data.lessons;
            list = []
            for( let i = 0; i < models.length && i < 5; i++)
            {
                list.push(models[i]);
            }
            console.log(list)
            setLessons  (list);
        }
    }
    return(
        <>
            <br/>
            <h1 className='title'>דף ראשי</h1>

            { role == "מנהל" ?
            <>
            <h2>משתמשים</h2>
            <UsersCardBoard users={users}/>
            <br/>
            </> :
            <>
            <h2>הודעות מערכת</h2>
                <MessageBoxSystem/>
            </>
            }
            <h2>שיעורים</h2>
            <LessonsTable lessons={lessons} users={users}/>
        </>)
}

export default Dashborad;