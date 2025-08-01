import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, createUser, updateUser, deleteUser } from '../services/user/functionsUser';
import {getOne} from '../services/subs/functionsSubs';
import "./EditUser.css";

const EditUser = () => {
    const { id } = useParams();
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [user, setUser] = useState({
        tz: '', username: '', password: '',
        firstname: '', lastname: '', birth_date: '',
        gender: '', phone: '', email: '',
        city: '', street: '', role: '', wallet: 0,
    });
    const [sub, setSub] = useState({
        name:'', months: 0, times_week: 0, price: 0,
    })
    useEffect(()=>console.log("user", user), [user])
    useEffect(()=>console.log("sub", sub), [sub])
    const [price, setPrice] = useState(0);
    useEffect(()=>console.log("price", price), [price])
    const fillMissingFields = (userData) => ({
        tz: '', username: '', password: '',
        firstname: '', lastname: '', birth_date: '',
        gender: '', phone: '', email: '',
        city: '', street: '', role: '',wallet: 0,
        ...userData
    });

    useEffect(() => {
        if (id !== 'new') {
            getUserById(id).then(res => {
                if (res && res.user) {
                    setUser(fillMissingFields(res.user));
                    if(res.user.subs.type != ""){
                        getOne(res.user.subs.type).then(res =>{
                            if(res.status == 200){
                                setSub(res.subs);
                            }
                        }).catch(err=> setSub({name:'', months: 0, times_week: 0, price: 0,}));
                    }
                }
            }).catch(err=> navigate(-1));

        }
    }, [id]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            const res = id === 'new'
                ? await createUser(
                    user.tz, user.username, user.password, user.firstname, user.lastname,
                    user.birth_date, user.gender, user.phone, user.email, user.city, user.street, user.role
                )
                : await updateUser(
                    user.tz, user.username, user.password, user.firstname, user.lastname,
                    user.birth_date, user.gender, user.phone, user.email, user.city, user.street, user.role, [], 0, user.wallet
                );
            if (res.status === 200) {
                alert('✅ נשמר בהצלחה');
                navigate(-1);
            }
        } catch (err) {
            alert('❌ שגיאה בשמירה');
        }
    };

    const formatPhoneNumber = (num) => {
        if (!num) return '';
        let cleaned = num.replace(/-/g, '');
        if (cleaned.startsWith('+972')) {
            cleaned = '0' + cleaned.slice(4);
        }
        return cleaned;
    };

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/-/g, '');
        if (value.startsWith('0')) {
            value = '+972' + value.slice(1);
        }
        setUser({ ...user, phone: value });
    };

    const handleDelete = async() => {
        if (!window.confirm("למחוק משתמש?")) return
        await deleteUser(id).then(res=>console.log("השיעור נימחק"));
        navigate(-1);
    }
    return (
        <div className="form-container">
            <h2>{id === 'new' ? '➕ הוספת משתמש חדש' : '✏️ עריכת משתמש'}</h2>

            <label>ת.ז.:</label>
            <input name="tz" value={user.tz || ''} onChange={handleChange} readOnly={id !== 'new'} />

            <label>שם משתמש:</label>
            <input name="username" value={user.username || ''} onChange={handleChange} />

            <label>סיסמה:</label>
            <div className="password-wrapper">
                <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={user.password || ''}
                    onChange={handleChange}
                />
                <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                >
                    {showPassword ? "🙈" : "👁️"}
                </button>
            </div>

            <label>שם פרטי:</label>
            <input name="firstname" value={user.firstname || ''} onChange={handleChange} />

            <label>שם משפחה:</label>
            <input name="lastname" value={user.lastname || ''} onChange={handleChange} />

            <label>תאריך לידה:</label>
            <input name="birth_date" type="date" value={user.birth_date?.slice(0, 10) || ''} onChange={handleChange} />

            <label>מין:</label>
            <select name="gender" value={user.gender || ''} onChange={handleChange}>
                <option value="">בחר מין</option>
                <option value="זכר">זכר</option>
                <option value="נקבה">נקבה</option>
            </select>

            <label>טלפון:</label>
            <input name="phone" value={formatPhoneNumber(user.phone) || ''} onChange={handlePhoneChange} />

            <label>אימייל:</label>
            <input name="email" value={user.email || ''} onChange={handleChange} />

            <label>עיר:</label>
            <input name="city" value={user.city || ''} onChange={handleChange} />

            <label>רחוב:</label>
            <input name="street" value={user.street || ''} onChange={handleChange} />

            <label>תפקיד:</label>
            <select name="role" value={user.role || ''} onChange={handleChange}>
                <option value="">בחר תפקיד</option>
                <option value="מאמן">מאמן</option>
                <option value="מתאמן">מתאמן</option>
            </select>
            <label>עדכון ארנק:</label>
            <div className='button-row'>
                <input name="wallet" type="number" value={price || 0} onChange={(e)=>{setPrice(e.target.value)}} />
                <button type="submit" onClick={()=>{setUser({ ...user, wallet: parseFloat(user.wallet) + parseFloat(price)});}}>+</button>
                <button type="submit" onClick={()=>{setUser({ ...user, wallet: parseFloat(user.wallet) - parseFloat(price)});}}>-</button>
                <h3>סה"כ בארנק: {user.wallet || 0}</h3>
            </div>
            <label>מנוי נבחר:</label>
            <div className='button-row'>
                <div key={sub.name}>
                    <h3>{sub.name}</h3>
                    <p>⏳ {sub.months} חודשים</p>
                    <p>📅 {sub.times_week} פעמים בשבוע</p>
                    <p>💰 {sub.price} ₪</p>
                    <button style={{background: "red"}}className="select-btn">מחיקת מנוי</button>
                </div>
            </div>
            
            <div className='button-row'>
                <button type="submit" onClick={handleSave}>{id !== "new" ? "שמור שינויים" : "צור משתמש"}</button>
                {id !== "new" && <button type="submit" style={{background: "red"}}onClick={handleDelete}>מחיקת משתמש</button>}
            </div>
        </div>
    );
};

export default EditUser;