import React, { useEffect, useRef, useState } from 'react'
import styles from "./LoginPage.module.css"

//LogoIMG
import LogoIMG from "./../../../images/logo.png"
import { useLocation, useNavigate } from 'react-router-dom'

import { login, getMe } from '../../../WebServer/services/auth/fuctionsAuth';
import { toast } from '../../../ALERT/SystemToasts';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [tz, setTz] = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);

    const tzRef = useRef(null);
    const passwordRef = useRef(null);
    
    const handleKeyDown = (e) => {
        console.log(e.target.name, e.key);
        if(e.target.name == "tz" && e.key == "Enter") {
            passwordRef.current.focus();
        }
        else if(e.target.name == "password" && e.key == "Enter"){
            handleLogin();
        }
    }
    const handleLogin = async(e)=> {
        if(tz == "" || password == ""){
            toast.warn("יש שדות ריקות");
            return;
        }
        setLoading(true);
        try {
            // login: שומר accessToken + isLoggedIn + role (לפי ה-services שלנו)
            const me = await login(tz, password);
            console.log("me", me?.role === 'מתאמן', !me?.subs?.id, me.wallet > 0)
            // כללי מנוי למתאמן
            if (me?.role === 'מתאמן' && !me?.subs?.id) {
                    toast.warn('אין לך מנוי כדי להשתמש במערכת, נא בחר מנוי אפשרי');
                    navigate(`/selectSubfor/${encodeURIComponent(me.tz)}`);
                    return;
            }

            // הודעת ברוך הבא (אופציונלי)
            if (me?.firstname || me?.lastname) {
                toast.success(`ה${me.role} ${[me.firstname, me.lastname].filter(Boolean).join(' ')}, ברוך הבא למערכת`);
            }

            // נווט חזרה לנתיב המבוקש או לדאשבורד
            
            const from = location.state?.from?.pathname || '/dashboard/get';
            navigate(from, { replace: true });
        } catch (err) {
            console.error('Login error:', err?.response?.data || err.message);
            toast.error(err?.response?.data?.message || err.message || 'נכשלת התחברות, נסה שוב');
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.welcomeText}>
                    <h2>התחברות</h2>
                </div>
            </div>
            <div className={styles.rightPanel}>
                <div className={styles.loginForm}>
                    <div className={`${styles.logo} ${styles.logoDisNone}`}><img src={LogoIMG}/></div>
                    <h2>התחברות</h2>
                    <input ref={tzRef} name="tz" type="text" placeholder="תעודת זיהות" value={tz} onChange={(e)=>setTz(e.target.value)} onKeyDown={handleKeyDown} required />
                    <input ref={passwordRef} name="password" type="password" placeholder="סיסמה" value={password} onChange={(e)=>setPassword(e.target.value)} onKeyDown={handleKeyDown} required />
                    <button type="submit" style={{backgroundColor: "#88f388ff", color: "#000"}} onClick={handleLogin}>{loading ? '...' : 'כניסה'}</button>
                    {/* <a href='/quotation'>בדיקת הצעת מחיר לרישום מהיום הזה</a> */}
                    <hr />
                    <button type="submit" style={{backgroundColor: "#4cfdfdff", color: "#000"}} onClick={()=>navigate("/register")}>{loading ? '...' : 'רישום משתמש חדש למערכת'}</button>
                </div>
            </div>
        </div>
    )
}
