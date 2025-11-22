import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalInfo, setModalInfo] = useState({
    show: false,
    type: "", // 'success' or 'error'
    title: "",
    message: "",
  });
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [showGotOTP, setShowGotOTP] = useState(false);
  const [otpSentTime, setOtpSentTime] = useState(null);

  useEffect(() => {
    // Check if there's an active OTP session
    const sentTime = sessionStorage.getItem('otpSentTime');
    if (sentTime) {
      const elapsed = Math.floor((Date.now() - parseInt(sentTime)) / 1000);
      const remaining = 300 - elapsed; // 5 minutes

      if (remaining > 0) {
        setShowGotOTP(true);
        setOtpSentTime(parseInt(sentTime));
      } else {
        sessionStorage.removeItem('otpSentTime');
        sessionStorage.removeItem('resetEmail');
      }
    }
  }, []);

  useEffect(() => {
    if (!otpSentTime) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - otpSentTime) / 1000);
      const remaining = 300 - elapsed; // 5 minutes

      if (remaining <= 0) {
        setShowGotOTP(false);
        sessionStorage.removeItem('otpSentTime');
        sessionStorage.removeItem('resetEmail');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSentTime]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown]);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);
  
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeModal = () => {
    setModalInfo({ ...modalInfo, show: false });
    if (modalInfo.type === "success") {
      // Store email and timestamp in sessionStorage
      sessionStorage.setItem('resetEmail', formData.email);
      const currentTime = Date.now();
      sessionStorage.setItem('otpSentTime', currentTime.toString());
      setOtpSentTime(currentTime);
      setShowGotOTP(true);

      // Navigate to reset password page
      navigate("/reset-password");
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!canResend) {
      setError(`Please wait ${countdown} seconds before requesting another code`);
      return;
    }

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
      // Use IPC instead of fetch
      const data = await window.electronAPI.generatePasswordResetToken(formData.email);
      console.log('Password reset response:', data);

      if (data.success) {
        setCanResend(false);
        setCountdown(60); // 1 minute cooldown
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

  const handleBack = () => {
    navigate("/login");
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
      {isPageLoading && <Loader />}

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

      <div className="main-content">
        <div className="reset-container">
          <div className="login-header">
            <h1>Forgot Password</h1>
            <p>Enter your email address to receive a recovery code.</p>
          </div>

          <div className={`content ${loading ? "loading" : ""}`}>
            <form onSubmit={handleSendCode}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
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

              {error && <p style={{ margin: "10px 0", color: "#ffcf35", fontSize: "14px" }}>{error}</p>}

              {showGotOTP && (
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
              )}

              <button
                type="submit"
                className="btn"
                disabled={loading || !canResend}
              >
                {loading ? "SENDING..." : canResend ? "SEND CODE" : `WAIT ${countdown}s`}
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
                Back to Login
              </button>
            </form>
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