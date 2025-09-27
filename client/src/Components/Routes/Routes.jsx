// src/Components/Routes/CRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import LoginPage from '../Auth/LoginPage/LoginPage';
import RegisterPage from '../Auth/RegisterPage/RegisterPage';
import AssignSubPage from '../Auth/SelectSubs/AssignSubPage';

import Header from '../Header/Header';

import Dashborad from '../Dashboard/Dashboard';
import ViewAllUser from '../User/ViewAllUser';
import ViewAllLesson from '../Lesson/ViewAllLesson';
import ViewAllSubs from '../Subs/ViewAllSubs';
import EditUser from '../User/EditUser';
import EditLesson from '../Lesson/EditLesson';
import RegNextMonth from '../Lesson/RegNextMonth';
import EditSubs from '../Subs/EditSubs';

import RequireAuth from './RequireAuth';
import RoleGuard from './RoleGuard';
import PublicOnly from './PublicOnly';

function ProtectedLayout() {
  // Header רק בדפים מוגנים
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

export default function CRoutes() {
  return (
    <Routes>
      {/* ציבורי */}
      <Route path="/" element={<PublicOnly/>} />
      <Route path="/login" element={<PublicOnly/>} />
      <Route path="/quotation" element={<AssignSubPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* מוגן */}
      <Route element={<RequireAuth />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard/get" element={<Dashborad />} />
          <Route path="/selectSubfor/:id" element={<AssignSubPage />} />
          {/* <Route path="/quotation" element={<AssignSubPage />} /> */}

          {/* מנהל בלבד */}
          <Route element={<RoleGuard allow={['מנהל']} />}>
            <Route path="/users" element={<ViewAllUser />} />
            <Route path="/users/:id" element={<EditUser />} />
            <Route path="/subs" element={<ViewAllSubs />} />
            <Route path="/subs/:id" element={<EditSubs />} />
          </Route>

          {/* כל מחוברים */}
          <Route path="/lessons" element={<ViewAllLesson />} />
          <Route path="/lessons/:id" element={<EditLesson />} />
          <Route path="/regnextmonth" element={<RegNextMonth />} />

          {/* ברירת מחדל פנימית – אם נכנסו ל-root בעודך מחובר */}
          <Route path="" element={<Navigate to="/dashboard/get" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
