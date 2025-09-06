import { ask } from "../../../Components/Provides/confirmBus";
import api,{setAuthToken } from "../api";

export const getAllLesson = async() => {
    try{
        const {data, status} = await api.get('/lesson');
        if(![200,201].includes(status) || !data.ok) throw new Error ('לא קיים שיעורים במערכת');
        return {ok: true, lessons: data.lessons || data.schema || []};
    } catch(err) {    
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}

export const getOneLesson = async(_id) => {
    try{
        const {data, status} = await api.get('/lesson/' + _id);
        if(![200,201].includes(status) || !data.ok) throw new Error ('השיעור לא קיים');
        return {ok: true, lesson: data.lesson || data.schema};
    } catch(err) {    
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}

export const createLesson = async(payload, {confirm = true} = {}) => {
    try{
        if(confirm) {
            const ok = await ask("create");
            if(!ok) {
                    return null;
            }
        }
        const {data, status} = await api.post('/lesson', payload);
        console.log(data, status);
        if(![200,201].includes(status) || !data.ok) throw new Error ('השיעור לא נוצר');
        return {ok: true, lesson: data.lesson || data.schema};
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}
export const updateLesson = async(_id, payload, {confirm = true} = {}) => {
    try{
        if(confirm) {
            const ok = await ask('change');
            if(!ok) {
                    return null;
            }
        }
        const {data, status} = await api.put(`/lesson/${encodeURIComponent(_id)}`, payload);
        if(![200,201].includes(status) || !data.ok) throw new Error ('השיעור לא עודכן');
        return {ok: true, lesson: data.lesson || data.schema};
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}

export const deleteLesson = async(_id, {confirm = true} = {}) => {
    try{
        if(confirm) {
            const ok = await ask("delete");
            if(!ok) {
                    return null;
            }
        }
        const {data, status} = await api.delete(`/lesson/${encodeURIComponent(_id)}`);
        console.log("delete lesson", status, data);
        if(![200,201].includes(status) || !data.ok) throw new Error ('השיעור לא נמחק');
        return {ok: true, lesson: null};
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}

// ניהול רשימות משתתפים (כפי שהיה)
export async function addToList(lessonId, traineeIds = []) {
    try{
        const { data, status } = await api.post(`/lesson/addToList/${encodeURIComponent(lessonId)}`, {
        list_trainees: traineeIds,
        });
        if (![200,201].includes(status)) throw new Error('הוסף מתאמן לשיעור נכשלה');
        return {ok: true, lessons: data.lessons || data.schema};
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}

export async function removeFromList(lessonId, traineeIds = []) {
    try{
        const { data, status } = await api.post('/lesson/removeFromList', {
            id: lessonId,
            list_trainees: traineeIds,
        });
        if (![200,201].includes(status)) throw new Error('הסרת מתאמן משיעור נכשלה');
        return {ok: true, lessons: data.lessons || data.schema};
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}
