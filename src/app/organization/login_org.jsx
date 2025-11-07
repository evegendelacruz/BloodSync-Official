import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LoginOrg = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalInfo, setModalInfo] = useState({
    show: false,
    type: "", // 'success' or 'error'
    title: "",
    message: "",
  });

  useEffect(() => {
    // Suppress DevTools autofill warnings
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' &&
          (args[0].includes('Autofill.enable') ||
           args[0].includes('Autofill.setAddresses'))) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const emailOrDohId = formData.get("email");
    const password = formData.get("password");

    try {
      // Use IPC to login organization user (accepts email or DOH ID)
      const user = await window.electronAPI.loginOrgUser(emailOrDohId, password);

      // Store user data in localStorage
      localStorage.setItem('currentOrgUser', JSON.stringify({
        userId: user.userId,
        email: user.email,
        role: user.role,
        barangay: user.barangay,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto
      }));

      // Log the login activity
      try {
        await window.electronAPI.logActivity({
          user_name: user.fullName,
          action_type: 'login',
          entity_type: 'user_auth',
          entity_id: user.userId.toString(),
          action_description: `${user.fullName} logged in to the Organization system`,
          details: {
            email: user.email,
            role: user.role,
            barangay: user.barangay,
            loginTime: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Error logging login activity:', logError);
      }

      setModalInfo({
        show: true,
        type: "success",
        title: "Login Successful!",
        message: "You'll be directed shortly...",
      });
      setTimeout(() => {
        navigate("/donor-record-org");
      }, 2000);
    } catch (err) {
      console.error('Login error:', err);
      setModalInfo({
        show: true,
        type: "error",
        title: "Login Error",
        message: err.message || "Incorrect Email Address/Password. If issue persists, proceed to Forgot Password or contact System Developer.",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalInfo({ ...modalInfo, show: false });
  };

  const styles = {
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
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <span style={styles.modalIcon}>
                <img
                  src={modalInfo.type === "success" ? "../src/assets/success.png" : "../src/assets/error-.png"}
                  alt={modalInfo.type}
                  style={{ width: '60px', height: '60px' }}
                />
              </span>
              <h2 style={styles.modalTitle}>{modalInfo.title}</h2>
            </div>
            <p style={styles.modalMessage}>{modalInfo.message}</p>
            {modalInfo.type === "error" && (
              <button onClick={closeModal} style={styles.modalButton}>
                Close
              </button>
            )}
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

        .login-container {
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
          cursor: pointer;
        }

        .link:hover {
          text-decoration: underline;
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
                  <label htmlFor="email">Email Address / DOH ID</label>
                  <input type="text" id="email" name="email" required />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      required
                      style={{ paddingRight: '40px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                        padding: '0',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'LOGGING IN...' : 'LOGIN'}
                </button>
              </form>

              <div
                className="remember-me"
                style={{ display: "flex", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  style={{ marginRight: "8px" }}
                />
                <label
                  htmlFor="remember"
                  style={{ fontSize: "13px", color: "white" }}
                >
                  Remember Me
                </label>
              </div>

              <div className="text-center">
                <p style={{ fontSize: "13px", marginTop: "10px" }}>
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
