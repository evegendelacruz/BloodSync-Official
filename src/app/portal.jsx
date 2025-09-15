import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Portal = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .bloodsync-header {
          background: #165c3c;
          padding: 5px 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-bottom: 5px solid #93c242;
        }
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1280px;
          margin: 0 auto;
        }
        .doh-section {
          display: flex;
          align-items: center;
        }
        .bloodsync-logo {
          height: auto;
          width: 13.5rem;
          margin-left: -12px;
        }
        .doh-logo {
          height: auto;
          width: 15rem;
        }
        .doh-text {
          color: white;
          height: 4rem;
          width: 12rem;
          margin-right: 12px;
        }
        .bloodsync-title {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
        }
        .bloodsync-subtitle {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }
        .doh-title {
          font-size: 12px;
          font-weight: 600;
          margin: 0 0 2px 0;
        }
        .doh-republic,
        .doh-tagalog {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .login-container {
          background: rgba(22, 92, 60, 0.9);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          width: 400px;
          min-height: 300px;
          height: auto;
          display: flex;
          flex-direction: column;
        }

        .reset-container {
          background: rgba(22, 92, 60, 0.8);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          width: 350px;
          min-height: 300px; /* keeps a minimum size */
          height: auto;      /* adjust based on content */
          display: flex;
          flex-direction: column; /* keeps rows stacking */
        }

        .login-header {
          color: white;
          padding: 30px 40px 20px 40px;
          text-align: left;
        }

        .login-header h1 {
          font-size: 25px;
          font-weight: bold;
          margin-bottom: 12px;
          color: white;
          font-family: 'Barlow';
        }

        .login-header p {
          opacity: 0.9;
          font-size: 16px;
          margin-top: 8px;
          font-family: "Arial";
          font-weight: normal;
          color: white;
        }

        .content {
          padding: 20px 40px 40px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .account-type-btn {
          width: 100%;
          padding: 18px 20px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: center;
          font-family: "Barlow", Arial, sans-serif;
        }

        .regional-btn {
          background: #14AE5C;
          color: white;
          margin-bottom: 10px;
        }

        .regional-btn:hover {
          background: #22c55e;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
        }

        .partnered-btn {
          background: #93C242;
          color: white;
        }

        .partnered-btn:hover {
          background: #65a30d;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(132, 204, 22, 0.4);
        }

        .or-divider {
          display: flex;
          align-items: center;
          width: 100%;
          margin: 10px 0;
        }

        .or-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.3);
        }

        .or-text {
          color: rgba(255, 255, 255, 0.8);
          padding: 0 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-family: Arial;
          font-size: 13px;
          margin-bottom: 8px;
          font-weight: 500;
          color: white;
        }

        .form-group input {
          width: 100%;
          padding: 10px 16px;
          border: 2px solid #e5e7eb;
          font-size: 13px;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #15803d;
        }

        .btn {
          width: 100%;
          padding: 14px;
          background: #93c242;
          color: white;
          border: none;
          font-size: 16px;
          font-weight: 600;
          transition: transform 0.2s;
          margin-bottom: 16px;
          font-family: Arial;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .text-center {
          text-align: center;
        }

        .link {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          color: #ffcf35;
          text-decoration: none;
          font-weight: bold;
          font-family: inherit;
        }

        .link:hover {
          text-decoration: underline;
        }

        .error {
          color: #ef4444;
          font-size: 14px;
          margin-top: 8px;
          display: none;
        }

        .success {
          color: #10b981;
          font-size: 14px;
          margin-top: 8px;
        }

        .loading {
          opacity: 0.6;
          pointer-events: none;
        }

        /* Footer styling */
        .footer {
          background: #ffcf35;
          color: black;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          font-family: Arial;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .main-content {
            padding: 20px 16px;
          }

          .login-container {
            max-width: 80%;
            width: 80%;
          }
        }

        body {
          font-family: "Barlow", "Arial", "Barlow-Medium", sans-serif;
          background:
             #EDF4E6
            /* Image background */ url("../assets/Background.png") no-repeat
            center center fixed;
          background-size: cover;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="page-container">
        <header className="bloodsync-header">
          <div className="header-container">
            <div className="left-section">
              <img
                src="/assets/Logo1.png"
                alt="BloodSync Logo"
                className="bloodsync-logo"
              />
            </div>
            <div className="right-section">
              <div className="doh-section">
                <img
                  src="/assets/DOH Logo.png"
                  alt="Department of Health"
                  className="doh-logo"
                />
                <div className="doh-text">
                  <img
                    src="/assets/Text Logo.png"
                    alt="Department of Health"
                    className="doh-text"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="main-content">
          <div className="login-container">
            {/* Account Type Selection Header */}
            <div className="login-header">
              <h1>Identify Your Account Type</h1>
              <p>Select your role to access the BloodSync platform.</p>
            </div>

            {/* Account Type Selection Content */}
            <div className="content">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="account-type-btn regional-btn"
              >
                REGIONAL BLOOD CENTER - DOH
              </button>

              <div className="or-divider">
                <div className="or-line"></div>
                <span className="or-text">OR</span>
                <div className="or-line"></div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login-org")}
                className="account-type-btn partnered-btn"
              >
                PARTNERED ORGANIZATION
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>2025 © Copyright Code Red Corporation ver. 1.0</p>
        </footer>
      </div>
    </>
  );
};

export default Portal;