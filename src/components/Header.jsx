import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide header on login, signup, and forgot password pages
  const hideHeaderPages = ["/", "/login", "/signup", "/forgot-password"];
  if (hideHeaderPages.includes(location.pathname)) {
    return null;
  }

  return (
    
      <div className="header-content">
        <h1 className="app-title">My App</h1>
        <nav className="header-nav">
          <button 
            onClick={() => navigate("/dashboard")}
            className={location.pathname === "/dashboard" ? "active" : ""}
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate("/login")}
            className="logout-btn"
          >
            Logout
          </button>
        </nav>
      </div>
  
  );
};

export default Header;