import React, { useEffect, useState } from "react";
import { getAll } from "../../services/subs/functionsSubs";
import "./SelectSub.css";

const SelectSubForTrainee = ({ selectedSub, setSelectedSub, wallet}) => {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const data = await getAll();
        const s = data.subs.filter(item => item.price <= wallet);
        setSubs(s);
      } catch (err) {
        console.error("שגיאה בטעינת מנויים", err);
      }
    };
    fetchSubs();
  }, []);

  const handleSelect = (sub) => {
    if (selectedSub && selectedSub._id === sub._id) {
      setSelectedSub(null); // ביטול בחירה
    } else {
      setSelectedSub(sub);
    }
  };

  return (
    <div className="subs-selection-container">
      {subs && subs.length > 0 && subs.map((sub) => (
        <div
          key={sub.name}
          className={`sub-card ${selectedSub === sub.name ? "selected" : ""}`}
          onClick={() => handleSelect({_id:sub._id, name: sub.name})}
        >
          <h3>{sub.name}</h3>
          <p>⏳ {sub.months} חודשים</p>
          <p>📅 {sub.times_week} פעמים בשבוע</p>
          <p>💰 {sub.price} ₪</p>
          <button className="select-btn">
            {selectedSub?._id === sub._id ? "✅ נבחר" : "בחר מנוי"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default SelectSubForTrainee;
