import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    recoveryCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalInfo, setModalInfo] = useState({
    show: false,
    type: "", // 'success' or 'error'
    title: "",
    message: "",
  });

  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    recoveryCode: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [touched, setTouched] = useState({
    email: false,
    recoveryCode: false,
    newPassword: false,
    confirmPassword: false
  });

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateRecoveryCode = (code) => {
    if (!code) return "Recovery code is required";
    if (code.length !== 6) return "Recovery code must be 6 digits";
    if (!/^\d{6}$/.test(code)) return "Recovery code must contain only numbers";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/\d/.test(password)) return "Password must contain at least one digit";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return "Password must contain at least one special character (!@#$%^&* etc.)";
    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'recoveryCode':
        return validateRecoveryCode(value);
      case 'newPassword':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(formData.newPassword, value);
      default:
        return "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time validation
    const error = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error }));

    // Also validate confirm password when new password changes
    if (name === 'newPassword' && formData.confirmPassword) {
      const confirmError = validateConfirmPassword(value, formData.confirmPassword);
      setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const closeModal = () => {
    setModalInfo({ ...modalInfo, show: false });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Mark all fields as touched to show validation errors
    setTouched({
      email: true,
      recoveryCode: true,
      newPassword: true,
      confirmPassword: true
    });

    // Validate all fields
    const errors = {
      email: validateEmail(formData.email),
      recoveryCode: validateRecoveryCode(formData.recoveryCode),
      newPassword: validatePassword(formData.newPassword),
      confirmPassword: validateConfirmPassword(formData.newPassword, formData.confirmPassword)
    };

    setValidationErrors(errors);

    // Check if there are any validation errors
    const hasErrors = Object.values(errors).some(error => error !== "");
    if (hasErrors) {
      setError("Please correct the validation errors above");
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

      if (response.ok && data.success) {
        setModalInfo({
          show: true,
          type: "success",
          title: "Success",
          message: "Password reset successfully! Redirecting to login..."
        });
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setModalInfo({
          show: true,
          type: "error",
          title: "Error",
          message: data.message || "Failed to reset password"
        });
      }
    } catch (err) {
      console.error('Error resetting password:', err);
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
    navigate("/forgot-password");
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
                  src={modalInfo.type === "success" ? "./assets/success.png" : "./assets/error.png"}
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

        .reset-container {
          background: rgba(22, 92, 60, 0.8);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          width: 350px;
          min-height: 400px;
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

        .form-group .input-container {
          position: relative;
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

        .eye-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #666;
          font-size: 16px;
          background: none;
          border: none;
        }

        .eye-icon:hover {
          color: #333;
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

          .reset-container {
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

        .validation-error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
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
            <h1>Password Reset</h1>
          </div>

          <div className={`content ${loading ? "loading" : ""}`}>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email"
                  required
                  style={{
                    borderColor: touched.email && validationErrors.email ? '#ef4444' : '#e5e7eb'
                  }}
                />
                {touched.email && validationErrors.email && (
                  <div className="validation-error">{validationErrors.email}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="recoveryCode">Enter Recovery Code</label>
                <input
                  type="text"
                  id="recoveryCode"
                  name="recoveryCode"
                  value={formData.recoveryCode}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  required
                  style={{
                    borderColor: touched.recoveryCode && validationErrors.recoveryCode ? '#ef4444' : '#e5e7eb'
                  }}
                />
                {touched.recoveryCode && validationErrors.recoveryCode && (
                  <div className="validation-error">{validationErrors.recoveryCode}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Enter new password</label>
                <div className="input-container">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter new password"
                    required
                    style={{
                      borderColor: touched.newPassword && validationErrors.newPassword ? '#ef4444' : '#e5e7eb'
                    }}
                  />
                  <button
                    type="button"
                    className="eye-icon"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <i className={showNewPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                  </button>
                </div>
                {touched.newPassword && validationErrors.newPassword && (
                  <div className="validation-error">{validationErrors.newPassword}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm new password</label>
                <div className="input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Confirm new password"
                    required
                    style={{
                      borderColor: touched.confirmPassword && validationErrors.confirmPassword ? '#ef4444' : '#e5e7eb'
                    }}
                  />
                  <button
                    type="button"
                    className="eye-icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                  </button>
                </div>
                {touched.confirmPassword && validationErrors.confirmPassword && (
                  <div className="validation-error">{validationErrors.confirmPassword}</div>
                )}
              </div>


              <button
                type="submit"
                className="btn"
                disabled={loading}
              >
                {loading ? "RESETTING..." : "CONFIRM PASSWORD RESET"}
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
                BACK
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

export default ResetPassword;