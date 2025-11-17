import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const VerifyUser = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying user account...");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      console.log("Token from URL:", token);
      console.log("Window electronAPI available:", !!window.electronAPI);
      console.log("verifyUser method available:", !!window.electronAPI?.verifyUser);

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link - no token provided");
        return;
      }

      try {
        // Wait a bit for electronAPI to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!window.electronAPI || !window.electronAPI.verifyUser) {
          throw new Error("Electron API not properly loaded. Please restart the application.");
        }

        console.log("Calling verifyUser with token:", token);
        const result = await window.electronAPI.verifyUser(token);
        console.log("Verification result:", result);
        
        if (result && result.success) {
          setStatus("success");
          setMessage(`User verified successfully! Redirecting to login...`);
          
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(result?.message || "Verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.message || "Verification failed - please contact administrator");
      }
    };

    verifyToken();
  }, [searchParams, navigate]);


  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          background: #EDF4E6;
          margin: 0;
          padding: 0;
        }

        .verify-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .verify-box {
          background: white;
          border-radius: 8px;
          padding: 60px 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .verify-icon {
          font-size: 80px;
          margin-bottom: 24px;
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .verify-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 16px;
          color: #165c3c;
        }

        .verify-message {
          font-size: 16px;
          color: #666;
          line-height: 1.8;
        }

        .success .verify-icon { 
          color: #10b981; 
        }
        
        .error .verify-icon { 
          color: #ef4444; 
        }
        
        .verifying .verify-icon { 
          color: #165c3c;
          animation: spin 2s linear infinite;
        }

        .back-button {
          margin-top: 24px;
          padding: 12px 24px;
          background: #165c3c;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .back-button:hover {
          background: #0f4a2d;
        }

        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          color: #999;
          font-size: 12px;
        }
      `}</style>

<div className="verify-container">
        <div className={`verify-box ${status}`}>
          <div className="verify-icon">
            {status === "verifying" && "⏳"}
            {status === "success" && "✓"}
            {status === "error" && "✗"}
          </div>
          <h1 className="verify-title">
            {status === "verifying" && "Verifying User..."}
            {status === "success" && "Verification Successful!"}
            {status === "error" && "Verification Failed"}
          </h1>
          <p className="verify-message">{message}</p>
          
          {status === "error" && (
            <button 
              className="back-button"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          )}

          <div className="footer">
            <p>&copy; 2025 Code Red Corporation - BloodSync ver. 1.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyUser;