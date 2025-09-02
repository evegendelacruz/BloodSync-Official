import React, { useState, useEffect } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Splashscreen from "./splashscreen";
import Login from "./login";
import Signup from "./signup";
import ForgotPassword from "./forgot_password";
import Dashboard from "./dashboard/dashboard";

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
        <Route index element={<Login />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="dashboard" element={<Dashboard />} />
    </Routes>
  );
};

export default App; 
