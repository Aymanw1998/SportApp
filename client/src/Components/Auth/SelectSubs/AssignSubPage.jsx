import React, { useEffect, useState } from "react";
import SelectSubForTrainee from "./SelectSubForTrainee";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById, addSub, updateUser} from "../../services/user/functionsUser";


const AssignSubPage = () => {
    const navigate = useNavigate()
    const { id } = useParams();
    const [selectedSub, setSelectedSub] = useState(null);
    const [user, setUser] = useState(null)
    useEffect(()=>console.log("user", user), [user]);
    const loadData = async() => {
        await getUserById(id).then(data=>setUser(data.user)).catch(err=> navigate(-1));
    }
    useEffect(()=>{loadData()},[])
    const handleSave = async() => {
        if (!selectedSub) return alert("בחר מנוי קודם!");
        console.log("📝 נבחר:", selectedSub);
        // המשך שמירה...

        //subs in user
        await addSub(selectedSub._id)
                .then(data=>{console.log("addSubs data", data)})
                .catch(err=>console.log("addSub err", err));
        //update wallet
        await updateUser(user.tz, user.username, user.password, user.firstname, user.lastname, user.birth_date, user.gender, user.phone, user.email, user.city, user.street, user.role, user.list_class, user.max_class, user.wallet-selectedSub.price);
        
    };

    return (
        user && <div>
            <div style={{ textAlign: "left", margin: "1rem" }}>
                <h3>👛ארנק: {user?.wallet || 0} ₪</h3>
            </div>

            <h2 style={{ textAlign: "center" }}>בחירת מנוי עבור המתאמן - {user.firstname + " " + user.lastname} - {user.tz}</h2>
                {user&&<SelectSubForTrainee selectedSub={selectedSub} setSelectedSub={setSelectedSub} wallet={user.wallet}/>}
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <button style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }} onClick={handleSave}>💾 שמור</button>
                </div>
        </div>
    );
};

export default AssignSubPage;
