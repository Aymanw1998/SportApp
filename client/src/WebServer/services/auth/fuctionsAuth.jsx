// AUTH services
import axios from 'axios';
import api, { API_BASE_URL, setAuthTokens } from '../api';
import { scheduleAccessRefresh, clearAccessRefresh } from '../../utils/accessScheduler';

// עוזר קטן לשמור "מחובר" + מזהה משתמש
function markSignedIn(user, accessToken, expirationTime) {
  console.log("user", user);
  console.log("accessToken", accessToken);
  console.log("expirationTime", expirationTime)
  setAuthTokens(accessToken, expirationTime);
  scheduleAccessRefresh(accessToken);
  console.log("done save token");
  localStorage.setItem('isLoggedIn', '1');
  if (user?._id) localStorage.setItem('user_id', user._id);
  if (user?.role) localStorage.setItem('role', user.role);
}

// רישום משתמש חדש (אם יש לך מסך הרשמה)
export async function register(payload) {
  const { data, status } = await api.post('/auth/register', payload, { withCredentials: true });
  if (![200,201].includes(status) || !data?.ok) throw new Error(data?.message || 'Register failed');

  const { accessToken, expToken: expirationTime, user } = data;
  markSignedIn(user, accessToken, expirationTime);
  return user;
}

// התחברות עם תעודת זהות + סיסמה
export async function login(tz, password) {
  const { data, status } = await api.post('/auth/login', { tz, password }, { withCredentials: true });
  console.log("login", status, data);
  if (![200,201].includes(status) || !data?.ok) throw new Error(data?.message || 'Login failed');

  const { accessToken, expirationTime, user } = data;
  markSignedIn(user, accessToken, expirationTime);
  return user;
}

// רענון חד-פעמי ידני (בד"כ לא צריך לקרוא ידנית; ה־interceptor/‏PublicOnly עושה את זה)
export async function refresh() {
  const { data, status } = await axios.post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true });
  if (![200,201].includes(status) || !data?.ok || !data?.accessToken) throw new Error('Refresh failed');
  setAuthTokens(data.accessToken, data.expirationTime);
  scheduleAccessRefresh(data.accessToken);
  return { accessToken: data.accessToken, expirationTime: data.expirationTime };
}

// זהות עצמי (משתמש מחובר)
export async function getMe() {
  try{
  const { data, status } = await api.get('/auth/me');
  if (![200,201].includes(status) || !data?.ok) throw new Error(data?.message || 'Not authenticated');
  return data.user; // הקומפוננטות אצלך מצפות ל-user ישירות
  }catch(err){
    console.warn("err getme", err);
    throw err;
  }
}

// התנתקות
export async function logout() {
  try {
    await api.post('/auth/logout', null, { withCredentials: true });
  } catch {}
  clearAccessRefresh();
  setAuthTokens(null);
  localStorage.clear();
  localStorage.setItem('LOGOUT_BROADCAST', String(Date.now()));
  // אפשר להשאיר לראוטר לנווט, או לבצע redirect קשיח:
  window.location.assign('/');
}
