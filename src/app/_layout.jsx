import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Splashscreen from "./splashscreen";
import Login from "./login";
import Signup from "./signup";
import ForgotPassword from "./forgot_password";
import Dashboard from "./dashboard/dashboard";
import Portal from "./portal";
import LoginOrg from "./organization/login";
import SignUpOrg from "./organization/signup";
import ForgotPasswordOrg from "./organization/forgot_password";
import DonorRecordOrg from "./organization/dashboard/donor_record";
import VerifyUser from "./verify_user";
import VerifyOrg from "./organization/verify_org";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState(null);

  useEffect(() => {
    // Check if user has previously selected a portal type
    const storedPortal = localStorage.getItem('selectedPortal');
    if (storedPortal) {
      setSelectedPortal(storedPortal);
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Function to handle portal selection
  const handlePortalSelection = (portalType) => {
    setSelectedPortal(portalType);
    localStorage.setItem('selectedPortal', portalType);
  };

  // Optional: Function to clear portal selection (useful for testing or switching accounts)
  const clearPortalSelection = () => {
    setSelectedPortal(null);
    localStorage.removeItem('selectedPortal');
  };

  if (isLoading) {
    return <Splashscreen />;
  }

  return (
    <Routes>
      <Route 
        index 
        element={
          selectedPortal ? (
            <Navigate to={selectedPortal === 'regional' ? '/login' : '/login-org'} replace />
          ) : (
            <Portal onPortalSelect={handlePortalSelection} />
          )
        } 
      />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="login-org" element={<LoginOrg />} />
      <Route path="signup-org" element={<SignUpOrg />} />
      <Route path="verify-org" element={<VerifyOrg />} />
      <Route path="verify-user" element={<VerifyUser />} />
      <Route path="forgot-password-org" element={<ForgotPasswordOrg />} />
      <Route path="donor-record-org" element={<DonorRecordOrg />} />
    </Routes>
  );
};

export default App;