// 📁 src/WebServer/services/user/functionsUser.js
import { ask } from "../../../Components/Provides/confirmBus";
import api from "../api";

// עוזר קטן לאחידות תשובות user מהשרת
const extractUser = (data) => data?.user ?? data ?? null;

/** כל המשתמשים */
export const getAllUser = async () => {
  try{
    const {status, data} = await api.get('/user/');
    if (![200,201].includes(status) || !data?.ok) throw new Error('לא קיים משתמשים');
    return {ok: true, users: data.users};
  } catch(err) {
    return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
  }
};

/** משתמש לפי מזהה (tz או _id לפי ה־route שלך) */
export const getUserById = async (tzOrId) => {
  try {
    const {status, data} = await api.get(`/user/${tzOrId}`);

    if (![200,201].includes(status) || !data?.ok) throw new Error('לא קיים משתמש בעל מזהה' + tzOrId);
    return {ok: true, user: data.user};
  } catch (err) {
    return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
  }
};

/** יצירת משתמש */
export const createUser = async (payload, {confirm = true} = {}) => {
  if(confirm) {
            const ok = await ask("create");
            if(!ok) {
                return null;
            }
        }
  try {
    const {status, data} = await api.post("/user/", payload);
    if (![200,201].includes(status) || !data?.ok) throw new Error('לא נוצר משתמש');
    return { ok: true, user: extractUser(data) };
  } catch (err) {
    return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
  }
};

/** עדכון מלא (PUT) – שומר על החתימה הקיימת בקוד שלך */
export const updateUser = async (tz, petch, {confirm = true} = {}) => {
  if(confirm) {
            const ok = await ask("change");
            if(!ok) {
                return null;
            }
        }
  try {
    const {status, data} = await api.put(`/user/${tz}`, petch);
    if (![200,201].includes(status) || !data?.ok) throw new Error('משתמש לא עודכן');
    return { ok: true, user: extractUser(data.user) };
  } catch (err) {
    return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
  }
};

/** מחיקת משתמש */
export const deleteUser = async (tz, {confirm = true} = {}) => {
  if(confirm) {
            const ok = await ask("delete");
            if(!ok) {
                return null;
            }
        }
  try {
    const {status, data} = await api.delete(`/user/${tz}`);
    if (![200,201].includes(status) || !data?.ok) throw new Error ('משתמש לא נמחק');
    return { ok: true, user: null };
  } catch (err) {
    return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
  }
};

/** הוספת מנוי למשתמש המחובר (על פי ה־middleware שלך) */
export const addSub = async (subId) => {

  try {
    const {status, data} = await api.post(`/user/addSub/${subId}`);
    if (![200,201].includes(status) || !data?.ok) throw new Error('משתמש לא נוסף לו מנוי');
    return { ok: true, user: extractUser(data.data) };
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "שגיאה בהוספת מנוי";
    return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
  }
};


/** הסרת מנוי ממשתמש לפי _id */
export const removeSub = async (_userId) => {

  try {
    const {status, data} = await api.post(`/user/removeSub/${_userId}`);
    if (![200,201].includes(status) || !data?.ok) throw new Error('משתמש לא נמחק לו המנוי');
    return { ok: true, user: extractUser(res.data) };
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "שגיאה בהסרת מנוי";
    return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
  }
};
