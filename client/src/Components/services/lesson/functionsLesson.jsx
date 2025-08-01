import { apiService, setAuthToken } from "../api";
export const getAllLesson = async() => {
    try{
        const res = await apiService.get("/lesson/");
        const { schema } = res.data;
        console.log("res", res);
        if(res.status == 200) {
            return {status: res.status, lessons:schema}
        } else return {status:res.status,message: "no have lessons"}

    } catch(err) {console.error("getAllLesson error: ", err.response?.data || err.message); throw err}
}

export const getOneLesson = async(_id) => {
    try{
        const res = await apiService.get("/lesson/"+_id);
        const { schema } = res.data;

        if(res.status == 200) {
            return {status: res.status, lesson:schema}
        } else return {status:res.status,message: "no have lesson with same id"}

    } catch(err) {console.error("getOneLesson error: ", err.response?.data || err.message); throw err}
}

export const createLesson = async(name,date, trainer, max_trainees, list_trainees) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.post("/lesson/", {name,date, max_trainees, trainer, list_trainees});
        console.log("back from server GETME");
        console.log("create lesson res", res);
        const { status, schema } = res.data;
        return {status: res.status, lesson:schema}
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}

export const updateLesson = async(_id, name, date, trainer, max_trainees, list_trainees) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.put("/lesson/"+_id, {name,date, trainer, max_trainees, list_trainees});
        console.log("back from server GETME");
        console.log("update lesson res", res);        
        return {status: res.status, lesson:res.schema}
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}

export const deleteLesson = async(_id) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.delete("/lesson/"+_id);
        console.log("back from server GETME");
        console.log("delete lesson res", res);
        const { schema } = res.data;
        return schema;
    } catch(err) {console.error("Login error: ", err.response?.data || err.message); throw err}
}
