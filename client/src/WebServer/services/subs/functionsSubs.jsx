import { ask } from "../../../Components/Provides/confirmBus";
import api, { publicApi } from "../api";
export const getAll = async({ publicMode = false } = {}) => {
    try{
        const client = publicMode ? publicApi: api 
        const url = "/subs" + (publicMode ? "/public" : "/");
        const { data, status } = await client.get(url);
        if (![200,201].includes(status) || !data?.ok) throw new Error('לא קיים מנויים במערכת');
        return {ok: true, subs: data.subs || []};
    } catch(err){
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

export const getOne = async(id) => {
    try{
        const { data, status } = await api.get(`/subs/${id}`);
        if (![200,201].includes(status) || !data?.ok) throw new Error('מנוי הנבחר אינו קיים');
        return {ok: true, sub:data.sub};
    } catch(err) {
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }

}

export const create = async(payload, {confirm = true} = {}) => {
    if(confirm) {
        const ok = await ask("create");
        if(!ok) {
            return null;
        }
    }
    try{
        const { data, status } = await api.post('/subs', payload);
        if (![200,201].includes(status) || !data?.ok) throw new Error('המנוי לא נוצר');
        return {ok: true, sub: data.sub};
    } catch(err) {    
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}
export const update= async(id,patch, {confirm = true} = {}) => {
    if(confirm) {
        const ok = await ask("change");
        if(!ok) {
            return null;
        }
    }
    try{
        const {data, status} = await api.put(`/subs/${encodeURIComponent(id)}`, patch);
        if(![200,201].includes(status) || !data.ok) throw new Error (data?.message || 'מנוי לא עודכן');
        return {ok: true, sub: data.sub};
    } catch(err) {    
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}

export const deleteS= async(id, {confirm = true} = {}) => {
    try{
        if(confirm) {
            const ok = await ask("delete");
            if(!ok) {
                return null;
            }
        }
        const {data, status} = await api.put(`/sub/${encodeURIComponent(id)}`);
        if(![200,201].includes(status) || !data.ok) throw new Error ('מנוי לא נמחק');
        return {ok: true, subs: null};
    } catch(err){
        return {ok: false, message: err.response.data.message || err.message || 'נוצר שגיאה בתהליך'};
    }
}
