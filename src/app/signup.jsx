import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const Signup = () => {
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    role: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.role) {
      setError("Please select a role");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);
    setError("");
    setSuccess("");

    try {
      const userData = {
        fullName: formData.fullName.trim(),
        role: formData.role,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const result = await window.electronAPI.register(userData);

      if (result.success) {
        setSuccess(
          "Registration successful! You'll receive an email once your account is verified. Redirecting to login…"
        );

        // Clear form
        setFormData({
          fullName: "",
          role: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      console.error("Signup failed:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
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

        .form-group input, .form-group select {
          width: 100%;
          padding: 10px 16px;
          border: 2px solid #e5e7eb;
          font-size: 13px;
          transition: border-color 0.2s;
        }

        .form-group select {
          background: white;
          cursor: pointer;
        }

        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: #15803d;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input-wrapper input {
          padding-right: 45px;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: color 0.2s;
        }

        .password-toggle-btn:hover {
          color: #374151;
        }

        .password-toggle-btn svg {
          width: 20px;
          height: 20px;
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
          color: #ffcf35;
          background: rgba(255, 255, 255, 0.1);
          padding: 10px;
          border-radius: 4px;
          font-size: 14px;
          margin-bottom: 16px;
          text-align: justified;
        }

        .footer {
          background: #ffcf35;
          color: black;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          font-family: Arial;
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

        <div className="main-content">
          <div className="login-container">
            <div className="login-header">
              <h1>Create an Account</h1>
              <p>
                Have an Account?&nbsp;
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="link"
                >
                  Click Here
                </button>
              </p>
            </div>
            <div className="content">
              <form onSubmit={handleSignup}>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name:</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role:</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a role...</option>
                    <option value="Admin">Admin</option>
                    <option value="Inventory Staff">Inventory Staff</option>
                    <option value="Non-Conforming Staff">
                      Non-Conforming Staff
                    </option>
                    <option value="Scheduler">Scheduler</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password:</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password:</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
                <button
                  type="submit"
                  className="btn"
                  style={{ marginBottom: "30px" }}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    "REGISTER"
                  )}
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

export default Signup;
