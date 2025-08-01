import { apiService, setAuthToken } from "../api";
export const getAll = async() => {
    try{
        const res = await apiService.get("/subs/");
        const { schema } = res.data;
        console.log("res", res);
        if(res.status == 200) {
            return {status: res.status, subs:schema}
        } else return {status:res.status,message: "no have subs"}

    } catch(err) {console.error("getAllSubs error: ", err.response?.data || err.message); throw err}
}

export const getOne = async(id) => {
    try{
        const res = await apiService.get(`/subs/${id}`);
        console.log(res.data.schema)
        const { schema } = res.data;

        if(res.status == 200) {
            return {status: res.status, subs:schema}
        } else return {status:res.status,message: "no have Subs with same name"}

    } catch(err) {console.error("getOne error: ", err.response?.data || err.message); throw err}
}

export const create = async(name, months, times_week, price) => {
    try{
        console.log("go to server GETME", name, months, times_week, price);
        console.log()
        const res = await apiService.post("/subs/", {name, months, times_week, price});
        console.log("back from server GETME");
        console.log("create subs res", res);
        const { status, schema } = res.data;
        return {status: res.status, subs:schema}
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}

export const update= async(id,name, months, times_week, price) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.put("/subs/"+id, {name, months, times_week, price});
        console.log("back from server GETME");
        console.log("update lesson res", res);        
        return {status: res.status, lesson:res.schema}
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}

export const deleteS= async(id) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.delete("/subs/"+id);
        console.log("back from server GETME");
        console.log("delete lesson res", res);
        return res.data.schema;
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}
