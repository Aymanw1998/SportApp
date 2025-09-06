import React  from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function RoleGuard({ allow = [] }) {
  const role = localStorage.getItem('role');
  if (!allow.includes(role)) {
    return <Navigate to="/dashboard/get" replace />;
    // return navigate("/dashboard/get")
  }
  return <Outlet />;
}
