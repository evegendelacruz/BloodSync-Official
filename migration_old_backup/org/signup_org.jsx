import React from "react";
import { useNavigate } from "react-router-dom";

const SignUpOrg = () => {
  const navigate = useNavigate();

  const [form, setForm] = React.useState({
    full_name: "",
    role: "",
    barangay: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showActivationModal, setShowActivationModal] = React.useState(false);
  const [activationToken, setActivationToken] = React.useState("");

  // Validation states
  const [validationErrors, setValidationErrors] = React.useState({
    full_name: "",
    role: "",
    barangay: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [touched, setTouched] = React.useState({
    full_name: false,
    role: false,
    barangay: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
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

  const validateBarangay = (barangay) => {
    // Only validate if role is Barangay
    if (form.role === "Barangay" && !barangay) return "Please select a barangay";
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
      case 'role':
        return validateRole(value);
      case 'barangay':
        return validateBarangay(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(form.password, value);
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

    // Clear barangay when role changes from Barangay to something else
    if (name === 'role' && value !== 'Barangay') {
      setForm(prev => ({ ...prev, barangay: "" }));
      setValidationErrors(prev => ({ ...prev, barangay: "" }));
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
      role: true,
      barangay: form.role === "Barangay",
      email: true,
      password: true,
      confirmPassword: true
    });

    // Validate all fields
    const errors = {
      full_name: validateName(form.full_name),
      role: validateRole(form.role),
      barangay: validateBarangay(form.barangay),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword)
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
      // Prepare registration data
      const registrationData = {
        full_name: form.full_name,
        role: form.role,
        email: form.email,
        password: form.password
      };

      // Add barangay if role is Barangay
      if (form.role === "Barangay") {
        registrationData.barangay = form.barangay;
      }

      // Use IPC to register organization user
      await window.electronAPI.registerOrgUser(registrationData);

      setShowSuccessModal(true);
      setForm({ full_name: "", role: "", barangay: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (

    <>
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
          cursor: pointer;
        }

        .btn-1:hover {
          transform: translateY(-2px);
        }

        .btn-1:active {
          transform: translateY(0);
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
                    <h2 style={{color:'#165c3c',marginBottom:'16px'}}>New Organization Activation</h2>
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
                  <option value="Barangay">Barangay</option>
                  <option value="Local Government Unit">Local Government Unit</option>
                  <option value="Non-Profit Organization">Non-Profit Organization</option>
                </select>
                {touched.role && validationErrors.role && (
                  <div className="validation-error">{validationErrors.role}</div>
                )}
              </div>
              {form.role === "Barangay" && (
              <div className="form-group">
                <label htmlFor="barangay">Barangay (CDO):</label>
                <select
                  id="barangay"
                  name="barangay"
                  value={form.barangay}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  style={{
                    borderColor: touched.barangay && validationErrors.barangay ? '#ef4444' : '#e5e7eb'
                  }}
                >
                  <option value="">Select a barangay...</option>
                  <option value="Agusan">Agusan</option>
                  <option value="Baikingon">Baikingon</option>
                  <option value="Balubal">Balubal</option>
                  <option value="Balulang">Balulang</option>
                  <option value="Barangay 1">Barangay 1</option>
                  <option value="Barangay 2">Barangay 2</option>
                  <option value="Barangay 3">Barangay 3</option>
                  <option value="Barangay 4">Barangay 4</option>
                  <option value="Barangay 5">Barangay 5</option>
                  <option value="Barangay 6">Barangay 6</option>
                  <option value="Barangay 7">Barangay 7</option>
                  <option value="Barangay 8">Barangay 8</option>
                  <option value="Barangay 9">Barangay 9</option>
                  <option value="Barangay 10">Barangay 10</option>
                  <option value="Barangay 11">Barangay 11</option>
                  <option value="Barangay 12">Barangay 12</option>
                  <option value="Barangay 13">Barangay 13</option>
                  <option value="Barangay 14">Barangay 14</option>
                  <option value="Barangay 15">Barangay 15</option>
                  <option value="Barangay 16">Barangay 16</option>
                  <option value="Barangay 17">Barangay 17</option>
                  <option value="Barangay 18">Barangay 18</option>
                  <option value="Barangay 19">Barangay 19</option>
                  <option value="Barangay 20">Barangay 20</option>
                  <option value="Barangay 21">Barangay 21</option>
                  <option value="Barangay 22">Barangay 22</option>
                  <option value="Barangay 23">Barangay 23</option>
                  <option value="Barangay 24">Barangay 24</option>
                  <option value="Barangay 25">Barangay 25</option>
                  <option value="Barangay 26">Barangay 26</option>
                  <option value="Barangay 27">Barangay 27</option>
                  <option value="Barangay 28">Barangay 28</option>
                  <option value="Barangay 29">Barangay 29</option>
                  <option value="Barangay 30">Barangay 30</option>
                  <option value="Barangay 31">Barangay 31</option>
                  <option value="Barangay 32">Barangay 32</option>
                  <option value="Barangay 33">Barangay 33</option>
                  <option value="Barangay 34">Barangay 34</option>
                  <option value="Barangay 35">Barangay 35</option>
                  <option value="Barangay 36">Barangay 36</option>
                  <option value="Barangay 37">Barangay 37</option>
                  <option value="Barangay 38">Barangay 38</option>
                  <option value="Barangay 39">Barangay 39</option>
                  <option value="Barangay 40">Barangay 40</option>
                  <option value="Bayabas">Bayabas</option>
                  <option value="Bayanga">Bayanga</option>
                  <option value="Besigan">Besigan</option>
                  <option value="Bonbon">Bonbon</option>
                  <option value="Bugo">Bugo</option>
                  <option value="Bulua">Bulua</option>
                  <option value="Camaman-an">Camaman-an</option>
                  <option value="Canito-an">Canito-an</option>
                  <option value="Carmen">Carmen</option>
                  <option value="Consolacion">Consolacion</option>
                  <option value="Cugman">Cugman</option>
                  <option value="Dansolihon">Dansolihon</option>
                  <option value="F. S. Catanico">F. S. Catanico</option>
                  <option value="Gusa">Gusa</option>
                  <option value="Indahag">Indahag</option>
                  <option value="Iponan">Iponan</option>
                  <option value="Kauswagan">Kauswagan</option>
                  <option value="Lapasan">Lapasan</option>
                  <option value="Lumbia">Lumbia</option>
                  <option value="Macabalan">Macabalan</option>
                  <option value="Macasandig">Macasandig</option>
                  <option value="Mambuaya">Mambuaya</option>
                  <option value="Nazareth">Nazareth</option>
                  <option value="Pagalungan">Pagalungan</option>
                  <option value="Pagatpat">Pagatpat</option>
                  <option value="Patag">Patag</option>
                  <option value="Pigsag-an">Pigsag-an</option>
                  <option value="Puerto">Puerto</option>
                  <option value="Puntod">Puntod</option>
                  <option value="San Simon">San Simon</option>
                  <option value="Tablon">Tablon</option>
                  <option value="Taglimao">Taglimao</option>
                  <option value="Tagpangi">Tagpangi</option>
                  <option value="Tignapoloan">Tignapoloan</option>
                  <option value="Tuburan">Tuburan</option>
                  <option value="Tumpagon">Tumpagon</option>
                </select>
                {touched.barangay && validationErrors.barangay && (
                  <div className="validation-error">{validationErrors.barangay}</div>
                )}
              </div>
              )}
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
              <button type="submit" className="btn" style={{ marginBottom: "30px" }} disabled={loading}>
                {loading ? "Registering..." : "REGISTER"}
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

export default SignUpOrg;