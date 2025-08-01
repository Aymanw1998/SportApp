// 📁 src/components/subs/ViewAllSubs.jsx
import React, { useEffect, useState } from "react";
import { getAll, deleteS } from "../services/subs/functionsSubs";
import { useNavigate } from "react-router-dom";
import "./Subs.css";

const ViewAllSubs = () => {
    const [subs, setSubs] = useState();
    useEffect(()=>console.log("subs",subs),[subs])
    const [searchTerm, setSearchTerm] = useState("");
    useEffect(()=>console.log("searchTerm",searchTerm),[searchTerm])
    const navigate = useNavigate();

    useEffect(() => {
        loadSubs();
    }, []);

    const loadSubs = async () => {
        try {
        const data = await getAll();
        console.log("loadSubs", data.status, data.subs);
        if(data.status == 200)
            setSubs(data.subs);
        } catch (err) {
        console.error("שגיאה בהבאת מנויים", err);
        }
    };

    return (
    <div className="">
        <h2 style={{textAlign: "center"}}>רשימת מנויים</h2>
        <input type="text" placeholder="חיפוש ..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        <button style={{ backgroundColor: 'green', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }} onClick={() => navigate("/subs/new")}>➕ הוסף מנוי</button>

        <table className="subs-table">
            <thead>
            <tr>
                <th>שם</th>
                <th>חודשים</th>
                <th>פעמים בשבוע</th>
                <th>מחיר</th>
                <th>פעולות</th>
            </tr>
            </thead>
            <tbody>
            {subs && subs.length > 0 && subs.filter(sub=> (sub.name +" " + sub.months + " " + sub.times_week + " " + sub.price).includes(searchTerm)).map((sub) => (
                
                <tr key={sub.name}>
                <td data-label="שם">{sub.name}</td>
                <td data-label="חודשים">{sub.months}</td>
                <td data-label="פעמים בשבוע">{sub.times_week}</td>
                <td data-label="מחיר">{sub.price} ₪</td>
                <td data-label="פעולות">
                    <div className="actions-buttons">
                    <button onClick={() => navigate(`/subs/${sub._id}`)}>✏️</button>
                    </div>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
};

export default ViewAllSubs;