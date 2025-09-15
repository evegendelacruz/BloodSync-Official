import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Splashscreen from "./splashscreen";
import Login from "./login";
import Signup from "./signup";
import ForgotPassword from "./forgot_password";
import Dashboard from "./dashboard/dashboard";
import Portal from "./portal";
import LoginOrg from "./organization/login";
import SignUpOrg from "./organization/signup";
import ForgotPasswordOrg from "./organization/forgot_password";
import DashboardOrg from "./organization/dashboard/dashboard";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Splashscreen />;
  }

  return (
    <Routes>
        <Route index element={<Portal />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="login-org" element={<LoginOrg />} />
        <Route path="signup-org" element={<SignUpOrg />} />
        <Route path="forgot-password-org" element={<ForgotPasswordOrg />} />
        <Route path="dashboard-org" element={<DashboardOrg />} />
    </Routes>
  );
};

export default App; 
