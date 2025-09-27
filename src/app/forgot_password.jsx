import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    recoveryCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalInfo, setModalInfo] = useState({
    show: false,
    type: "", // 'success' or 'error'
    title: "",
    message: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeModal = () => {
    setModalInfo({ ...modalInfo, show: false });
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      console.log('Backend response:', { status: response.status, data });

      if (response.ok && data.success) {
        setModalInfo({
          show: true,
          type: "success",
          title: "Success",
          message: "Your OTP Code is now sent to your registered email."
        });
      } else {
        setModalInfo({
          show: true,
          type: "error",
          title: "Error",
          message: data.message || "Failed to send recovery code"
        });
      }
    } catch (err) {
      console.error('Error sending recovery code:', err);
      setModalInfo({
        show: true,
        type: "error",
        title: "Error",
        message: "Network error. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
  
    if (!formData.recoveryCode) {
      setError("Please enter the recovery code");
      return;
    }
  
    if (!formData.newPassword) {
      setError("Please enter a new password");
      return;
    }
  
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
  
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
  
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          resetToken: formData.recoveryCode,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError("");
      setSuccess("");
      setFormData({ ...formData, recoveryCode: "", newPassword: "", confirmPassword: "" });
    } else {
      navigate("/login");
    }
  };

  const modalStyles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      width: '90%',
      maxWidth: '400px',
    },
    modalHeader: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '15px',
    },
    modalIcon: {
      fontSize: '48px',
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333',
      margin: '10px 0 0 0',
    },
    modalMessage: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px',
    },
    modalButton: {
      backgroundColor: '#165c3c',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
    },
  };

  return (
    <>
      {modalInfo.show && (
        <div style={modalStyles.modalOverlay}>
          <div style={modalStyles.modalContent}>
            <div style={modalStyles.modalHeader}>
              <span style={modalStyles.modalIcon}>
                <img
                  src={modalInfo.type === "success" ? "./assets/success.png" : "./assets/error-.png"}
                  alt={modalInfo.type}
                  style={{ width: '60px', height: '60px' }}
                />
              </span>
              <h2 style={modalStyles.modalTitle}>{modalInfo.title}</h2>
            </div>
            <p style={modalStyles.modalMessage}>{modalInfo.message}</p>
            <button onClick={closeModal} style={modalStyles.modalButton}>
              OK
            </button>
          </div>
        </div>
      )}
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
          overflow: hidden;
          width: 350px;
          min-height: 400px; /* keeps a minimum size */
          height: auto;      /* adjust based on content */
          display: flex;
          flex-direction: column; /* keeps rows stacking */
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
          padding: 0px 35px;
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
            max-width: 100%;
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

      <div className="main-content">
        <div className="reset-container">
          <div className="login-header">
            <h1>Reset Password</h1>
            <p>
              {step === 1
                ? "Enter your email address to receive a recovery code."
                : "Enter the 6-digit code sent to your email and set a new password."}
            </p>
          </div>

          <div
            onSubmit={step === 1 ? handleSendCode : handleResetPassword}
            className={`content ${loading ? "loading" : ""}`}
            >
          
            {step === 1 && (
              <>
                <div className="form-group">
                  <label htmlFor="email">Enter Email to Send your recovery code</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div style={{ textAlign: "center", marginBottom: "15px" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/reset-password")}
                    className="link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ffcf35",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Got OTP Code?
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="form-group">
                  <label htmlFor="recoveryCode">Recovery Code</label>
                  <input
                    type="text"
                    id="recoveryCode"
                    name="recoveryCode"
                    value={formData.recoveryCode}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </>
            )}


            <button type="button" onClick={step === 1 ? handleSendCode : handleResetPassword} className="btn" disabled={loading}>
              {loading ? (step === 1 ? "SENDING..." : "RESETTING...") : (step === 1 ? "SEND CODE" : "RESET PASSWORD")}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="link"
              style={{
                display: "block",
                margin: "10px auto",
                cursor: "pointer",
              }}
              disabled={loading}
            >
              {step === 1 ? "Back to Login" : "Back"}
            </button>
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>2025 © Copyright Code Red Corporation ver. 1.0</p>
      </footer>
    </div>
    </>
  );
};

export default ForgotPassword;