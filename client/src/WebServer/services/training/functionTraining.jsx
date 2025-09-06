import api,{ setAuthToken } from "../api";
export const getAll = async() => {
    try{
        const {status, data} = await api.get("/training/");
        if(![200,201].includes(status) || !data?.ok) throw new Error('לא קיים סוגי שיעורים במערכת');
        return {ok: true, trainings: data.trainings || []}
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}

/**
 * שליפת אימון בודד לפי ObjectId או שם
 * @param {string} idOrName
 */
export const getOne = async(idOrName) => {
    try{
        const {status, data} = await api.get("/training/"+idOrName);
        if(![200,201].includes(status) || !data?.ok) throw new Error('סוג שיעור אינו קיים');
        return {ok: true, training: data.training}
    } catch(err){
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}

/**
 * יצירת אימון חדש
 * @param {{name: string, info?: string}} payload
 */

export const create = async(payload, {confirm = true} = {}) => {
    if(confirm) {
        const ok = await ask("craete");
        if(!ok) {
            return null;
        }
    }
    try{
        const body = { name: payload?.name, info: payload?.info ?? '' };
        const { data, status } = await api.post('/training', body);
        if (![200,201].includes(status) || !data?.ok) throw new Error('סוג שיעור לא נוצר');
        return {ok: true, training: data.training}
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}


/**
 * עדכון אימון קיים (לפי Id או שם)
 * @param {string} idOrName
 * @param {{name?: string, info?: string}} patch
 */
export const update= async(idOrName, patch,{confirm = true} = {}) => {
    if(confirm) {
        const ok = await ask("change");
        if(!ok) {
            return null;
        }
    }
    try{
        const body = {};
        if (patch?.name !== undefined) body.name = patch.name;
        if (patch?.info !== undefined) body.info = patch.info;

        const { data, status } = await api.put(`/training/${encodeURIComponent(idOrName)}`, body);
        if (![200,201].includes(status) || !data?.ok) throw new Error(data?.message || 'סוג שיעור לא עודכן');
        return {ok: true, training: data.training}
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}

/**
 * מחיקה (לפי Id או שם)
 * @param {string} idOrName
 */
export const deleteT= async(idOrName,{confirm = true} = {}) => {
    if(confirm) {
        const ok = await ask("delete");
        if(!ok) {
            return null;
        }
    }
    try{
        const { data, status } = await api.delete(`/training/${encodeURIComponent(idOrName)}`);
        if (![200,201].includes(status) || !data?.ok) throw new Error(data?.message || 'סוג שיעור לא נמחק');
        return {ok: true, training: null}
    } catch(err) {
        return {ok: false, message: err.message || 'נוצר שגיאה בתהליך'};
    }
}
