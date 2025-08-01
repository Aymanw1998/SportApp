import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import LOGO from "../../images/logo.png";

export default function Header() {
    const [role, setRole] = useState(localStorage.getItem('role'));
    useEffect(()=>console.log("role", role),[role])
    const [user, setUser] = useState();
    useEffect(()=>console.log("user", user),[user])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    //open change iamge
    const handleImageUpload = (url) => {
        setUser(prev => ({ ...prev, image_url: url }));
    };

    async function uploadImage(file) {
            // setUploading(true);
            // setError(null);
            try {
            const sigRes = await apiService.get(`/cloudinary-signature`);
            const { signature, timestamp, api_key, cloud_name, folder } = sigRes.data;
    
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', api_key);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
            formData.append('folder', folder);
    
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
    
            const uploadRes = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: formData,
            });
    
            const data = await uploadRes.json();
    
            if (data.secure_url) {
                handleImageUpload(data.secure_url);
            } else {
                alert('فشلة الإضافة');
            }
            } catch (e) {
            console.error(e);
            alert('يوجد مشكلة في إضافة الصورة للشبكة');
            }
            // setUploading(false);
        }
    
        const onFileChange = (e) => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = "image/*";
                fileInput.style.display = 'none';
                fileInput.multiple = false; // מאפשר בחירה של מספר קבצים 
                fileInput.onchange = async(e) => {
                    const fileT = e.target.files[0];
                    if (fileT) {
                        uploadImage(fileT);
                    }
                }
                fileInput.oncancel = (e) => {
                    console.log(e)
                    // setLoading(false)
                }
                fileInput.onclose = (e) => {
                    console.log(e);
                }
                fileInput.click();
        };
    
    useEffect(() => {
        const userData = localStorage.getItem("user");
        const role = localStorage.getItem("role");
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (err) {
                console.error("Error parsing user:", err);
            }
        }
        if(role){
            setRole(role);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const expiry = localStorage.getItem("tokenExpiry");
        const currentPath = window.location.pathname;

        if (((token && expiry && Date.now() > Number(expiry)) || (!token && !expiry)) && currentPath !== "/") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("tokenExpiry");
            setTimeout(() => {
                alert("لم يعد لديك صلاحية للدخول");
                navigate("/");
            }, 2000);
        } else if (token && expiry && Date.now() <= Number(expiry) && currentPath === "/") {
            navigate("/dashboard/get");
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
        window.location.reload();
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleImageClick = () => setIsDropdownOpen(!isDropdownOpen);

    const handleChangeImage = () => {
        setIsDropdownOpen(false);
        alert("هنا تفتح نافذة لتغيير الصورة 🚧"); // כאן תוכל לפתוח מודל להעלאה
        onFileChange()
    };

    const handleMyProfile = () => {
        setIsDropdownOpen(false);
        navigate("/dashboard/user");
    };

    // סגירה אוטומטית של הדרופדאון כשלוחצים מחוץ
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <header id="header">
                <div className="header-content">
                    <img
                        src={LOGO}
                        alt="logo"
                        className="logo"
                        onClick={() => navigate("/")}
                        style={{ cursor: "pointer" }}
                    />
                    <span className="title">מערכת לתיאום ותזמון פגישות ספורט </span>
                    {user && <div style={{textAlign: "right", color: "white"}}>{user?.firstname + " " + user?.lastname + " - " + user?.role}</div>}
                </div>
            </header>
            <nav className="navbarV">
                {role != "מתאמן" && <a href="/users">משתמשים</a>}
                <a href="/lessons">שיעורים</a>
                {role != "מתאמן" &&<a href="/subs">מנויים</a>}
                <a href="/">פרופיל</a>

                <button onClick={() => {handleLogout() }} className="logout-button" title="יציאה"> 🔓 יציאה</button>
            </nav>
        </>
    );
}
