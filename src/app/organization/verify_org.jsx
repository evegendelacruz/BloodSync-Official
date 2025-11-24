import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../../components/Loader";

const VerifyOrg = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState("verifying"); 
  const [message, setMessage] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      verifyToken();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const verifyToken = async () => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await window.electronAPI.verifyOrg(token);

      if (result.success) {
        setStatus("success");
        setMessage("Your account has been successfully verified!");
        setUserInfo(result.user);

        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate("/login");
        }, 5000);
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setStatus("error");
      setMessage(err.message || "Verification failed. The link may have expired or already been used.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        .doh-section { display: flex; align-items: center; }
        .bloodsync-logo { height: auto; width: 13.5rem; margin-left: -12px; }
        .doh-logo { height: auto; width: 15rem; }
        .doh-text { color: white; height: 4rem; width: 12rem; margin-right: 12px; }
        .page-container { min-height: 100vh; display: flex; flex-direction: column; }
        .main-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .verify-container {
          background: rgba(22, 92, 60, 0.9);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          width: 400px;
          padding: 40px;
          text-align: center;
          color: white;
        }
        .icon-container {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .icon-success { background: #93c242; }
        .icon-error { background: #ff6b6b; }
        .icon-verifying { background: #ffcf35; }
        .icon-container svg { width: 40px; height: 40px; color: white; }
        h1 { font-size: 24px; margin-bottom: 15px; }
        .message { font-size: 14px; line-height: 1.6; margin-bottom: 20px; opacity: 0.9; }
        .user-info {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          text-align: left;
        }
        .user-info p { font-size: 13px; margin-bottom: 8px; }
        .user-info strong { color: #93c242; }
        .btn {
          width: 100%;
          padding: 14px;
          background: #93c242;
          color: white;
          border: none;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          font-family: Arial;
        }
        .btn:hover { transform: translateY(-2px); }
        .redirect-text { font-size: 12px; opacity: 0.7; margin-top: 15px; }
        .footer {
          background: #ffcf35;
          color: black;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          font-family: Arial;
        }
        body {
          font-family: "Barlow", "Arial", sans-serif;
          background: #EDF4E6 url("../assets/Background.png") no-repeat center center fixed;
          background-size: cover;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-container">
        <header className="bloodsync-header">
          <div className="header-container">
            <div className="left-section">
              <img src="/assets/Logo1.png" alt="BloodSync Logo" className="bloodsync-logo" />
            </div>
            <div className="right-section">
              <div className="doh-section">
                <img src="/assets/DOH Logo.png" alt="Department of Health" className="doh-logo" />
                <div className="doh-text">
                  <img src="/assets/Text Logo.png" alt="Department of Health" className="doh-text" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="main-content">
          <div className="verify-container">
            {isVerifying ? (
              <>
                <div className="icon-container icon-verifying">
                  <div className="spinner"></div>
                </div>
                <h1>Verifying Your Account</h1>
                <p className="message">Please wait while we verify your email address...</p>
              </>
            ) : status === "success" ? (
              <>
                <div className="icon-container icon-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h1>Verification Successful!</h1>
                <p className="message">{message}</p>
                {userInfo && (
                <div className="user-info">
                    <p><strong>DOH ID:</strong> {userInfo.u_org_id}</p>
                    <p><strong>Name:</strong> {userInfo.u_full_name}</p>
                    <p><strong>Category:</strong> {userInfo.u_category}</p>
                    <p><strong>{userInfo.u_category === 'Organization' ? 'Organization' : 'Barangay'}:</strong> {userInfo.u_organization_name || userInfo.u_barangay}</p>
                </div>
                )}
                <button className="btn" onClick={() => navigate("/login")}>
                  GO TO LOGIN
                </button>
                <p className="redirect-text">You will be redirected to login in 5 seconds...</p>
              </>
            ) : (
              <>
                <div className="icon-container icon-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <h1>Verification Failed</h1>
                <p className="message">{message}</p>
                <button className="btn" onClick={() => navigate("/login")}>
                  GO TO LOGIN
                </button>
              </>
            )}
          </div>
        </div>

        <footer className="footer">
          <p>2025 © Copyright Code Red Corporation ver. 1.0</p>
        </footer>
      </div>
    </>
  );
};

export default VerifyOrg;