import { apiService, setAuthToken } from "../api";
export const getAllUser = async() => {
    try{
        console.log("go to server login");
        console.log()
        const res = await apiService.get("/user/");
        console.log("res", res);
        if(res.status == 200) {
            return {status: res.status, users: res.data}
        } else return {status:res.status,message: "no have users"}

    } catch(err) {console.error("Login error: ", err.response?.data || err.message); return {status:0,message: "אין הרשאה"}}
}

export const getUserById = async (tz) => {
    try {
        console.log("getOne", tz);
        const res = await apiService.get(`/user/${tz}`);
        if (res.status === 200) {
            return { user: res.data };
        } else {
            return { error: "User not found" };
        }
    } catch (err) {
        console.error("Error getting user by ID:", err.response?.data || err.message);
    }
};


export const createUser = async(tz, username, password, firstname, lastname, birth_date, gender, phone, email, city, street, role, wallet = 0) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.post("/user/", {tz, username, password, firstname, lastname, birth_date, gender, phone, email, city, street, role, wallet});
        console.log("back from server GETME");
        return res;
    } catch(err) {console.error("Login error: ", err.response?.data || err.message);}
}

export const updateUser = async(tz, username, password, firstname, lastname, birth_date, gender, phone, email, city, street, role, list_class, max_class, wallet) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.put("/user/"+tz, {tz, username, password, firstname, lastname, birth_date, gender, phone, email, city, street, role, list_class, max_class, wallet});
        console.log("back from server GETME", res);
        return res;
    } catch(err) {console.error("Login error: ", err.response?.data || err.message);}
}

export const deleteUser = async(tz) => {
    try{
        console.log("go to server GETME");
        console.log()
        const res = await apiService.delete("/user/"+tz);
        console.log("back from server GETME");
        const { users } = res.data;
        return users;
    } catch(err) {console.error("Login error: ", err.response?.data || err.message);}
}


export const addSub = async(subId) => {
    try{
        const res = await apiService.post("/user/addSub/"+subId);
        console.log("addSub",res.data);
        return res.data
    }
    catch(err) {console.error("Login error: ", err.response?.data || err.message);}
}