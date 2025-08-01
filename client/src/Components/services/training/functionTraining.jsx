import { apiService, setAuthToken } from "../api";
export const getAll = async() => {
    try{
        const res = await apiService.get("/training/");
        const { schema } = res.data;
        console.log("res", res);
        if(res.status == 200) {
            return {status: res.status, train:schema}
        } else return {status:res.status,message: "no have subs"}

    } catch(err) {console.error("getAllSubs error: ", err.response?.data || err.message); throw err}
}

export const getOne = async(_id) => {
    try{
        const res = await apiService.get("/training/"+_id);
        const { schema } = res.data;

        if(res.status == 200) {
            return {status: res.status, train:schema}
        } else return {status:res.status,message: "no have Subs with same name"}

    } catch(err) {console.error("getOne error: ", err.response?.data || err.message); throw err}
}

export const create = async(name, info) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.post("/training/", {name, info});
        console.log("back from server GETME");
        console.log("create subs res", res);
        const { status, schema } = res.data;
        return {status: res.status, train:schema}
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}

export const update= async(name, info) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.put("/training/"+name, {name, info});
        console.log("back from server GETME");
        console.log("update lesson res", res);        
        return {status: res.status, lesson:res.schema}
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}

export const deleteT= async(name) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.delete("/training/"+name);
        console.log("back from server GETME");
        console.log("delete lesson res", res);
        return schema;
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}
