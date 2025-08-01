import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_SERVER_URI}/api`;
export const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    // withCredentials: true  // חובה כדי לשלוח קובצי cookie
});

// פונקציה להגדרת טוקן בבקשות
export const setAuthToken = (token, expirationTime  ) => {
    if (token) {
        apiService.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExp', expirationTime);
    } else {
        delete apiService.defaults.headers.common["Authorization"];
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExp")
    }
};
// הוספת Interceptor לתשובות מהשרת
apiService.interceptors.response.use(
    (response) => response,
    async(error) => {
        if (error.response?.status === 401) {
                const shouldRefresh = window.confirm("الاتصال انتهى, تريد الاستمرار بالاتصال ام الخروج؟");
                console.log("shouldRefresh", shouldRefresh);
                if(shouldRefresh == true){
                    console.log("logoin again")
                    try{
                        const res = await apiService.get("/auth/refresh", { withCredentials: true });
                        const { accessToken } = res.data;
                        setAuthToken(accessToken, Date.now() + 86400000); // 1 יום
                        error.config.headers["Authorization"] = `Bearer ${accessToken}`;
                        return apiService.request(error.config); // שליחה מחדש
                    } catch(refreshError) {
                        console.error("שגיאה ברענון הטוקן:", refreshError);
                        // הפנייה לדף התחברות
                        setAuthToken(null);
                        window.location.href = "/";}
                } else{
                    localStorage.clear();
                    navigate("/");
                    window.location.reload();
                }
        }
        return Promise.reject(error);
    }
);
// הוספת הטוקן לכל הבקשות היוצאות
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);