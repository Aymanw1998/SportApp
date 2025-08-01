// 📁 src/components/subs/EditOrAddSub.jsx
import React, { useEffect, useState } from "react";
import { create, update, getOne, deleteS} from "./../services/subs/functionsSubs";
import { useParams, useNavigate } from "react-router-dom";
import "./Subs.css";

const EditSubs = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = id !== "new";

    const [form, setForm] = useState({
        _id: "",
        name: "",
        months: "",
        times_week: "",
        price: "",
    });
    useEffect(()=>console.log("form", form),[form])
    const loadData = async() => {
        if (isEdit) {
        await getOne(id).then((data) => {
            console.log("data getOne", data);
            if(data.status !== 200) return;
            data = data.subs;
            setForm({
            _id: data._id,
            name: data.name,
            months: data.months,
            times_week: data.times_week,
            price: data.price,
            });
        }).catch(err=> navigate(-1));
        }
    }
    useEffect(() => {
        loadData();
    }, [name]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        if (isEdit) {
            await update(form._id,name, form.months, form.times_week, form.price);
        } else {
            await create(form.name, form.months, form.times_week, form.price);
        }
        navigate("/subs");
        } catch (err) {
        console.error("שגיאה בשמירה", err);
        }
    };

    const handleDelete = async() => {
        if (!window.confirm("למחוק מנוי?")) return
        await deleteS(id).then(res=>console.log("השיעור נימחק"));
        navigate(-1);
    }    

    return (
        <div className="form-container">
            <h2>{isEdit ? "עריכת מנוי" : "הוספת מנוי"}</h2>

            <label>שם:</label>
            <input name="name" value={form.name || ""} onChange={handleChange} disabled={isEdit} required />

            <label>חודשים:</label>
            <input name="months" type="number" value={form.months || ""} onChange={handleChange} required />

            <label>פעמים בשבוע:</label>
            <input name="times_week" type="number" value={form.times_week || ""} onChange={handleChange} required />

            <label>מחיר:</label>
            <input name="price" type="number" value={form.price || ""} onChange={handleChange} required />
            <div className='button-row'>
                <button type="submit" onClick={handleSubmit}>{id !== "new" ? "שמור שינויים" : "צור מנוי"}</button>
                {id !== "new" && <button type="submit" style={{background: "red"}}onClick={handleDelete}>מחיקת מנוי</button>}
            </div>
        </div>
    );
};

export default EditSubs;
