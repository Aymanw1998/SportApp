import React, {useState, useEffect} from 'react'
import { Routes, Route, BrowserRouter, useNavigate } from 'react-router-dom';

import LoginPage from "../Auth/LoginPage/LoginPage"
import AssignSubPage from "../Auth/SelectSubs/AssignSubPage"

import Header from '../Header/Header';

import Dashborad from '../Dashboard/Dashboard';
import ViewAllUser from '../User/ViewAllUser';
import ViewAllLesson from "../Lesson/ViewAllLesson"
import ViewAllSubs from '../Subs/ViewAllSubs';
import EditUser from '../User/EditUser';
import EditLesson from '../Lesson/EditLesson';
import EditSubs from '../Subs/EditSubs';
//Routes
export default function CRoutes() {
    const hasToken = localStorage.getItem("authToken") && localStorage.getItem("tokenExpiry");
    console.log("hasToken", hasToken, localStorage.getItem("authToken"), localStorage.getItem("tokenExpiry"))
    return (
        <>
            {/* {localStorage.getItem('role') && <Header onLogout={handleLogout}/>} */}
            {hasToken && <Header/>}
            {/* {localStorage.getItem("authToken") && localStorage.getItem("tokenExpiry")&& <button onClick={handleLogout}>تسجيل الخروج</button> } */}
            <Routes>
                <Route path='/' element={<LoginPage />}/>
                <Route path='/selectSubfor/:id' element={<AssignSubPage/>}/>
                {<Route path="/dashboard/get" element={ <Dashborad />}/> }

                {<Route path="/users" element={ <ViewAllUser/>}/> }
                <Route path="/users/:id" element={<EditUser />} />

                {<Route path="/lessons" element={ <ViewAllLesson/>}/> }
                <Route path="/lessons/:id" element={<EditLesson />} />

                {<Route path="/subs" element={ <ViewAllSubs/>}/> }
                <Route path="/subs/:id" element={<EditSubs />} />
                {/* <Route path='/register' element={<RegisterForm onLogin={handleLogin}/>}/> */}

                {/* הדפים שמוגנים עבור coach ו-trainee */}
                {/* <Route path="/dashboard" element={ role === "coach" ? <CoachDashboard /> : <TraineeDashboard />} /> */}

                {/* דפים נוספים שמוגנים */}
                {/* <Route path="/calendar" element={<CalendarBooking />}/>
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/trainees" element={<ListTrainees />} /> */}
            </Routes>
        </>
    )
}
