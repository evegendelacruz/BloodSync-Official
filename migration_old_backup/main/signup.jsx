import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const Signup = () => {
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);
  
    return () => clearTimeout(timer);
  }, []);

  const [form, setForm] = useState({
    full_name: "",
    role: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationToken, setActivationToken] = useState("");

  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ""
  });
  const [touched, setTouched] = useState({
    full_name: false,
    email: false,
    password: false,
    confirmPassword: false,
    role: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check activation status from localStorage
    const status = localStorage.getItem('activationStatus');
    const token = localStorage.getItem('activationToken');
    if (status === 'success') {
      setShowActivationModal(true);
      setActivationToken(token);
      // Optionally clear after showing
      localStorage.removeItem('activationStatus');
      localStorage.removeItem('activationToken');
    }
  }, []);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
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

  const validateName = (name) => {
    if (!name) return "Full name is required";
    if (name.length < 2) return "Name must be at least 2 characters long";
    return "";
  };

  const validateRole = (role) => {
    if (!role) return "Please select a role";
    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'full_name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(form.password, value);
      case 'role':
        return validateRole(value);
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Real-time validation
    const error = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error }));

    // Also validate confirm password when password changes
    if (name === 'password' && form.confirmPassword) {
      const confirmError = validateConfirmPassword(value, form.confirmPassword);
      setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Mark all fields as touched to show validation errors
    setTouched({
      full_name: true,
      email: true,
      password: true,
      confirmPassword: true,
      role: true
    });

    // Validate all fields
    const errors = {
      full_name: validateName(form.full_name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
      role: validateRole(form.role)
    };

    setValidationErrors(errors);

    // Check if there are any validation errors
    const hasErrors = Object.values(errors).some(error => error !== "");
    if (hasErrors) {
      setError("Please correct the validation errors above");
      return;
    }

    setIsPageLoading(true);

    try {
      // Use IPC instead of fetch
      await window.electronAPI.registerUser({
        full_name: form.full_name,
        role: form.role,
        email: form.email,
        password: form.password
      });

      setShowSuccessModal(true);
      setForm({ full_name: "", role: "", email: "", password: "", confirmPassword: "" });
      setTouched({
        full_name: false,
        email: false,
        password: false,
        confirmPassword: false,
        role: false
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsPageLoading(false);
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

        .form-group select {
          width: 100%;
          padding: 10px 16px;
          border: 2px solid #e5e7eb;
          font-size: 13px;
          transition: border-color 0.2s;
          background: white;
          cursor: pointer;
        }

        .form-group input:focus,
        .form-group select:focus {
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

        .btn-1 {
          width: 100%;
          padding: 14px;
          background: #165c3c;
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

        .validation-error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
        }

        .password-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          font-size: 16px;
          z-index: 1;
        }

        .password-toggle:hover {
          color: #333;
        }

        .password-input {
          padding-right: 40px !important;
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
              {/* Success Modal */}
              {showSuccessModal && (
                <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
                  <div style={{background:'#fff',padding:'32px',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',textAlign:'center',minWidth:'320px'}}>
                    <img
                      src="/assets/success.png"
                      alt="Success"
                      style={{width:'60px',height:'60px',marginBottom:'16px'}}
                    />
                    <h2 style={{color:'#165c3c',marginBottom:'16px'}}>Registration Submitted</h2>
                    <p style={{color:'#666',fontSize:'16px',marginBottom:'24px'}}>Your registered information has been sent to our servers. Please be patient for activation.</p>
                    <button className="btn-1" onClick={() => setShowSuccessModal(false)} style={{marginTop:'8px'}}>Okay</button>
                  </div>
                </div>
              )}
              {/* Activation Modal */}
              {showActivationModal && (
                <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
                  <div style={{background:'#fff',padding:'32px',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',textAlign:'center',minWidth:'320px'}}>
                    <h2 style={{color:'#165c3c',marginBottom:'16px'}}>New User Activation</h2>
                    <div style={{color:'#10b981',fontSize:'18px',marginBottom:'16px'}}>Activation successful!</div>
                    <div style={{fontSize:'14px',marginBottom:'16px'}}>Token: <span style={{fontWeight:'bold'}}>{activationToken}</span></div>
                    <button className="btn" onClick={()=>setShowActivationModal(false)} style={{marginTop:'8px'}}>Close</button>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="full_name">Full Name:</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  style={{
                    borderColor: touched.full_name && validationErrors.full_name ? '#ef4444' : '#e5e7eb'
                  }}
                />
                {touched.full_name && validationErrors.full_name && (
                  <div className="validation-error">{validationErrors.full_name}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="role">Role:</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  style={{
                    borderColor: touched.role && validationErrors.role ? '#ef4444' : '#e5e7eb'
                  }}
                >
                  <option value="">Select a role...</option>
                  <option value="Admin">Admin</option>
                  <option value="Non-Conforming Staff">Non-Conforming Staff</option>
                  <option value="Inventory Staff">Inventory Staff</option>
                  <option value="Scheduler">Scheduler</option>
                </select>
                {touched.role && validationErrors.role && (
                  <div className="validation-error">{validationErrors.role}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                <label htmlFor="password">Password:</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className="password-input"
                    style={{
                      borderColor: touched.password && validationErrors.password ? '#ef4444' : '#e5e7eb',
                      width: '100%',
                      padding: '10px 40px 10px 16px',
                      border: '2px solid #e5e7eb',
                      fontSize: '13px',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                  </button>
                </div>
                {touched.password && validationErrors.password && (
                  <div className="validation-error">{validationErrors.password}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className="password-input"
                    style={{
                      borderColor: touched.confirmPassword && validationErrors.confirmPassword ? '#ef4444' : '#e5e7eb',
                      width: '100%',
                      padding: '10px 40px 10px 16px',
                      border: '2px solid #e5e7eb',
                      fontSize: '13px',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                  </button>
                </div>
                {touched.confirmPassword && validationErrors.confirmPassword && (
                  <div className="validation-error">{validationErrors.confirmPassword}</div>
                )}
              </div>
              {error && <div className="error" style={{display:'block'}}>{error}</div>}
              {success && <div className="success" style={{display:'block'}}>{success}</div>}
              <button type="submit" className="btn" style={{ marginBottom: "30px" }} disabled={isPageLoading}>
                {isPageLoading ? (
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