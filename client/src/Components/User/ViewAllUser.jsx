import React, { useEffect, useState } from 'react';
import "./ViewAllUser.css"
import {getAllUser} from "../services/user/functionsUser"
import { useNavigate } from 'react-router-dom';

const UsersCardBoard = ({ users }) => {
    const navigate = useNavigate();
    console.log("in user card", users)
    return (
        <div className="users-grid">
            {users && users.map(user => (
            <div key={user._id} className="card">
                <h4 className="card-title">{user.firstname + " " + user.lastname}</h4>
                <div>ת.ז.: {user.tz}</div>
                <div>שם משתמש: {user.username}</div>
                <div>מין: {user.gender}</div>
                <div>תפקיד:{user.role}</div>
                <button className="card-button" onClick={() => navigate(`/users/${user.tz}`)}>✏️ ערוך</button>
            </div>
            ))}
        </div>

    );
};

const TableUsers = ({users}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate(); // ניווט

    const filteredUsers = searchTerm == "" ? users : users.filter(user => {
        return  user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) || 
                user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.tz.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.role.toLowerCase().includes(searchTerm.toLowerCase()) 
    });
    return (
        <>
            <h1 className='title'>דף המשתמשים</h1>
            <input type="text" placeholder="חיפוש ..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            <button style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }} onClick={() => navigate("/users/new")}>➕ הוסף משתמש</button>
            {users ?<UsersCardBoard users={filteredUsers}/>: <>no data</>}
        </>
    )
}
const ViewAllUser = () => {

    const [me, setMe] = useState(JSON.parse(localStorage.getItem("user")));
    useEffect(()=>console.log("me: ", me),[me])
    const [users, setUsers] = useState([]);
    useEffect(()=>console.log("users: ", users),[users])

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
            for( let i = 0; i < models.length; i++)
            {
                list.push(models[i]);
            }
            console.log(list)
            setUsers(list);
        }
    }
    return(<TableUsers users={users}/>)
}

export default ViewAllUser;