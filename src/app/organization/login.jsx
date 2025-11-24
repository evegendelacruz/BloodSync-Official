import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";

const LoginOrg = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);
  
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      console.log("LoginOrg - Attempting login for:", email);
      
      // Call the Electron API to login organization user
      const result = await window.electronAPI.loginOrg(email, password);
      
      console.log("LoginOrg - Result received:", result);

      if (result && result.success) {
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(result.user));
        
        console.log("LoginOrg - Success! Navigating to donor records...");
        
        // Navigate to donor-record-org page
        navigate("/donor-record-org", { replace: true });
      } else {
        const errorMessage = result?.message || "Login failed. Please try again.";
        console.error("LoginOrg - Failed:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("LoginOrg - Exception caught:", err);
      setError(err.message || "Login failed. Please check your credentials and try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      {isPageLoading && <Loader />}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Header Styles */
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
          background: rgba(22, 92, 60, 0.8);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: visible;
          width: 350px;
          min-height: 400px;
          height: auto;
          display: flex;
          flex-direction: column;
        }

        .reset-container {
          background: rgba(22, 92, 60, 0.8);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          width: 350px;
          min-height: 300px;
          height: auto;
          display: flex;
          flex-direction: column;
        }

        .login-header {
          color: white;
          padding: 25px 35px;
          text-align: left;
        }

        .login-header h1 {
          font-size: 26px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .login-header p {
          opacity: 0.9;
          font-size: 14px;
          margin-top: 10px;
          font-family: "Barlow";
          font-weight: medium;
        }

        .content {
          padding: 0px 35px 35px 35px;
          flex: 1;
        }

        .form-group {
          margin-bottom: 20px;
          position: relative;
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

        .password-input-wrapper {
          position: relative;
          width: 100%;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          transition: color 0.2s;
        }

        .password-toggle-btn:hover {
          color: #333;
        }

        .password-toggle-btn svg {
          width: 20px;
          height: 20px;
        }

        .form-group input[type="password"],
        .form-group input[type="text"] {
          padding-right: 45px;
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
          margin-bottom: 10px;
          font-family: Arial;
          cursor: pointer;
        }

        .btn:hover:not(:disabled) {
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
          cursor: pointer;
        }

        .link:hover {
          text-decoration: underline;
        }

        .error {
          color: #ff6b6b;
          background-color: rgba(255, 107, 107, 0.1);
          border: 1px solid #ff6b6b;
          padding: 10px;
          border-radius: 4px;
          font-size: 14px;
          margin-bottom: 16px;
          display: block;
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
            max-width: 100%;
          }
        }

        body {
          font-family: "Barlow", "Arial", "Barlow-Medium", sans-serif;
          background: #EDF4E6 url("../assets/Background.png") no-repeat center center fixed;
          background-size: cover;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        .loading-dots {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          justify-content: center;
        }

        .loading-dots span {
          width: 6px;
          height: 6px;
          background-color: white;
          border-radius: 50%;
          animation: buttonBounce 1.4s infinite ease-in-out both;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes buttonBounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
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
            {/* Login Header */}
            <div className="login-header">
              <h1>Log In to your Account</h1>
              <p>
                Don&apos;t Have an Account?&nbsp;
                <button
                  type="button"
                  onClick={() => navigate("/signup-org")}
                  className="link"
                >
                  Click Here
                </button>
              </p>
            </div>

            {/* Login Form */}
            <div className="content">
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        // Eye slash icon (hide password)
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        // Eye icon (show password)
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && <div className="error">{error}</div>}

                <button type="submit" className="btn" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    "LOGIN"
                  )}
                </button>
              </form>

              <div className="text-center">
                <p style={{ fontSize: "13px", marginTop: "5px" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password-org")}
                    className="link"
                  >
                    Forgot Password?
                  </button>
                </p>
              </div>
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

export default LoginOrg;