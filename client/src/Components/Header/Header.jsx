import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import LOGO from "../../images/logo.png";
import { getMe } from "../../WebServer/services/auth/fuctionsAuth";
import { ask } from "../Provides/confirmBus";
import { useToast } from "../../ALERT/SystemToasts";

export default function Header() {
    const { push } = useToast();  // ← מקבל את push מה-Provider
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [user, setUser] = useState();
  const navigate = useNavigate();

  // --- מובייל / תפריט ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => console.log("role", role), [role]);
  useEffect(() => console.log("user", user), [user]);

  useEffect(() => {
    if (role) setRole(role);
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const u = await getMe();
      setUser(u || null);
    } catch (e) {
      console.error(e);
      setErr("שגיאה בטעינת משתמשים");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    localStorage.setItem("LOGOUT_BROADCAST", "1");
    navigate("/");
  };

  // --- resize: קובע מובייל/דסקטופ וסוגר תפריט כשעוברים לדסקטופ ---
  useEffect(() => {
    const handleResize = () => {
      const m = window.innerWidth <= 768;
      setIsMobile(m);
      if (!m) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- click outside לסגירת התפריט במובייל ---
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  const EDIT_PATTERNS = [
    /^\/users\/(new|[^/]+)$/,
    /^\/lessons\/(new|[^/]+)$/,
    /^\/subs\/(new|[^/]+)$/,
    /^\/selectSubfor\/[^/]+$/,
    /^\/regnextmonth$/,
  ];

  const onNavClick = async (e, to) => {
    setMenuOpen(false);
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    const a = e.currentTarget;
    if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();

    const onEditPage = EDIT_PATTERNS.some((rx) => rx.test(window.location.pathname));
    if (onEditPage) {
      if (role === "מתאמן" && !window.location.pathname.includes("selectSubfor") && !window.location.pathname.includes("regnextmonth")) {
        setMenuOpen(false);
        return navigate(to);
      }
      const ok = await ask("navigate");
      if (!ok) return;
    }
    setMenuOpen(false);            // ← סגירת התפריט אחרי ניווט
    navigate(to);
  };

  return (
    <>
      <header id="header" className={styles.header}>
        <div className={styles.headerContent}>
          <img
            src={LOGO}
            alt="logo"
            className={styles.logo}
            onClick={(e) => onNavClick(e, "/")}
            style={{ cursor: "pointer" }}
          />
          <span className={styles.title}>Fitness 360 </span>
          {user && !isMobile && (
            <div className={styles.userBadge}>
              {user?.firstname + " " + user?.lastname + " - " + user?.role}
            </div>
          )}
        </div>
        <div className={styles.headerContent}>
          {/* כפתור המבורגר – מופיע רק במובייל */}
          {isMobile && (
            <button
              className={styles.menuToggle}
              aria-label="פתיחת תפריט"
              aria-controls="main-nav"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          )}
          {/* <button onClick={() => {console.log("👋 בדיקה: זה טוסט שאני יצרתי!");
            push({ variant: "info", description: "👋 בדיקה: זה טוסט שאני יצרתי!" });
            }}>טוסט בדיקה</button> */}
          {/* פרטי משתמש (נעלמים במובייל ונכנסים לתפריט) */}
          {user && isMobile && (
            <div className={styles.userBadge}>
              {user?.firstname + " " + user?.lastname + " - " + user?.role}
            </div>
          )}
        </div>
        {/* כיסוי רקע במובייל בזמן פתיחת תפריט */}
        {isMobile && menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />}
        {/* יציאה: רק בתוך ההמבורגר במובייל; בדסקטופ נשאר בסרגל */}
        {isMobile ? (
            menuOpen && (
                    <nav className={`${styles.navbarV} ${isMobile ? styles.mobileNav : ''}`} data-open={menuOpen}>
                      {role !== "מתאמן" && (<a href="/users" onClick={(e) => onNavClick(e, "/users")}>משתמשים</a>)}
                      <a href="/lessons" onClick={(e) => onNavClick(e, "/lessons")}>שיעורים</a>
                      {role !== "מתאמן" && (<a href="/subs" onClick={(e) => onNavClick(e, "/subs")}>מנויים</a>)}
                      {role === "מתאמן" && (<a href="/regnextmonth" 
                        style={
                          new Date().getDate() === new Date().getDate() ?
                          {
                          }:{backgroundColor: 'gray',}}onClick={(e) => {
                        onNavClick(e, "/regnextmonth")}}>רישום למערכת החודש הבא - {new Date().getDate() === new Date().getDate() ? 'פתוח' : 'סגור'}</a>)}
                      {/* <a href="/" onClick={(e) => onNavClick(e, "/")}>פרופיל</a> */}
                      <button onClick={handleLogout} className={styles.logoutButton} title="יציאה"> 🔓 יציאה</button>
                    </nav>
                )
        ) : (
            <nav style={{width: "100%"}} className={`${styles.navbarV} ${isMobile ? styles.mobileNav : ''}`} data-open={menuOpen}>
                {role !== "מתאמן" && (<a href="/users" onClick={(e) => onNavClick(e, "/users")}>משתמשים</a>)}
                <a href="/lessons" onClick={(e) => onNavClick(e, "/lessons")}>שיעורים</a>
                {role !== "מתאמן" && (<a href="/subs" onClick={(e) => onNavClick(e, "/subs")}>מנויים</a>)}
                {role === "מתאמן" && (<a href="/regnextmonth" 
                  style={
                    new Date().getDate() === new Date().getDate() ?
                    {
                    }:{backgroundColor: 'gray',}}onClick={(e) => {
                  onNavClick(e, "/regnextmonth")}}>רישום למערכת החודש הבא - {new Date().getDate() === new Date().getDate() ? 'פתוח' : 'סגור'}</a>)}
                {/* <a href="/" onClick={(e) => onNavClick(e, "/")}>פרופיל</a> */}
                <button onClick={handleLogout} className={styles.logoutButton} title="יציאה"> 🔓 יציאה</button>
            </nav>
        )}
      </header>
    </>
  );
}
