// ProfileSettings.jsx
import React, { useState } from 'react';
// --- UPDATED: Added Pencil icon ---
import { Check, Eye, EyeOff, ArrowLeft, Pencil } from 'lucide-react';

// --- LOADER COMPONENT ---
const Loader = () => {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5000,
      fontFamily: 'Barlow'
    },
    spinner: {
      border: '4px solid #f3f3f3', // Light grey
      borderTop: '4px solid #165C3C', // Main app color
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    }
  };

  const styleSheetId = 'spin-animation';
  if (!document.getElementById(styleSheetId)) {
    const style = document.createElement('style');
    style.id = styleSheetId;
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.spinner}></div>
    </div>
  );
};
// --- END OF LOADER COMPONENT ---

const ProfileSettings = ({ profileData, handleInputChange, handleSaveChanges, handleCancel }) => {
  // Update Password States
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loadingPassword, setLoadingPassword] = useState(false);
  
  // Update Phone Number States
  const [showUpdatePhone, setShowUpdatePhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [phoneError, setPhoneError] = useState(''); 
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [hasExistingPhone, setHasExistingPhone] = useState(false);
  
  // --- NEW: Update Email States ---
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Unified Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });

  // Hover States
  const [hoverStates, setHoverStates] = useState({});

  const handleMouseEnter = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: true }));
  };

  const handleMouseLeave = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: false }));
  };

  // Password Verification
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    try {
      setLoadingPassword(true);
      const user = JSON.parse(localStorage.getItem('currentUser'));
      const isValid = await window.electronAPI.verifyPasswordRBC(user.userId, currentPassword);

      if (isValid) {
        setPasswordVerified(true);
        setPasswordError('');
        setNewPasswordError('');
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (error) {
      setPasswordError('Error verifying password');
    } finally {
      setLoadingPassword(false);
    }
  };

  // Forgot Password - Send OTP
  const handleForgotPassword = async () => {
    try {
      setLoadingPassword(true);
      const user = JSON.parse(localStorage.getItem('currentUser'));
      await window.electronAPI.sendPasswordResetOTPRBC(user.email);
      setShowForgotPasswordModal(true);
    } catch (error) {
      alert('Error sending OTP');
    } finally {
      setLoadingPassword(false);
    }
  };

  // Verify OTP for Password Reset
  const handleVerifyPasswordOTP = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    try {
      setLoadingPassword(true);
      const user = JSON.parse(localStorage.getItem('currentUser'));
      const isValid = await window.electronAPI.verifyPasswordResetOTPRBC(user.email, code);

      if (isValid) {
        setPasswordVerified(true);
        setShowForgotPasswordModal(false);
        setSuccessMessage({ 
          title: "Password Verified!", 
          description: "You can now set your new password." 
        });
        setShowSuccessModal(true);
      } else {
        alert('Invalid OTP code');
      }
    } catch (error) {
      alert('Error verifying OTP');
    } finally {
      setLoadingPassword(false);
    }
  };
  
  // Update Password
  const handleUpdatePassword = async () => {
    setPasswordError('');
    setNewPasswordError('');

    if (!newPassword || !confirmPassword) {
      setNewPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword === currentPassword) {
      setNewPasswordError('New password cannot be the same as the current password.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setNewPasswordError('Password must be 8+ characters and include an uppercase, lowercase, number, and special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setNewPasswordError('Passwords do not match');
      return;
    }

    setNewPasswordError('');
    
    try {
      setLoadingPassword(true);
      const user = JSON.parse(localStorage.getItem('currentUser'));
      await window.electronAPI.updateUserPasswordRBC(user.userId, newPassword);

      setSuccessMessage({
        title: "Password Updated!",
        description: "Your password has been updated successfully.",
      });
      setShowSuccessModal(true);
      
      setShowUpdatePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordVerified(false);
    } catch (error) {
      setPasswordError('Error updating password');
    } finally {
      setLoadingPassword(false);
    }
  };

  // Update Phone Number (NO OTP)
  const handleUpdatePhoneNumber = async () => {
    setPhoneError('');

    if (!phoneNumber.startsWith('+63')) {
      setPhoneError('Phone number must start with +63');
      return;
    }

    const phoneRegex = /^\+63\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError('Format must be +63 followed by 10 digits (e.g., +639171234567)');
      return;
    }

    try {
      setLoadingPhone(true);
      const user = JSON.parse(localStorage.getItem('currentUser'));

      const profile = await window.electronAPI.getUserProfileRBC(user.userId);
      const hasPhone = profile.phone_number && profile.phone_number.length > 0;
      setHasExistingPhone(hasPhone);

      await window.electronAPI.updatePhoneNumberRBC(user.userId, phoneNumber);
      
      // FIX: Update parent state so UI shows new number
      handleInputChange({ target: { name: 'phone_number', value: phoneNumber } });
      
      setSuccessMessage({
        title: hasPhone ? 'Phone Number Updated!' : 'Phone Number Registered!',
        description: `Your phone number has been ${hasPhone ? 'updated' : 'registered'} successfully.`,
      });
      setShowSuccessModal(true);

      setShowUpdatePhone(false);
    } catch (error) {
      setPhoneError('Error saving phone number. Please try again.');
    } finally {
      setLoadingPhone(false);
    }
  };

  // --- NEW: Update Email (NO OTP) ---
  const handleUpdateEmail = async () => {
    setEmailError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    try {
      setLoadingEmail(true);
      const user = JSON.parse(localStorage.getItem('currentUser'));

      // Call the new API function
      await window.electronAPI.updateEmailRBC(user.userId, newEmail);
      
      // Update parent state so UI shows new email
      handleInputChange({ target: { name: 'email', value: newEmail } });
      
      setSuccessMessage({
        title: 'Email Updated!',
        description: 'Your email has been updated successfully.',
      });
      setShowSuccessModal(true);

      setShowUpdateEmail(false);
    } catch (error) {
      setEmailError('Error saving email. It might already be in use.');
    } finally {
      setLoadingEmail(false);
    }
  };

  // OTP Input Handler (now only for password reset)
  const handleOtpChange = (index, value, setOtpFunc, otpArray) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpFunc(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // --- STYLES OBJECT (Includes new modal styles) ---
  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '32px'
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "-7px",
      fontFamily:'Barlow'
    },
    stepTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#1f2937",
      marginTop: "16px",
      marginBottom: "16px",
      paddingBottom: "8px",
      borderBottom: "1px solid #e5e7eb",
      fontFamily:'Barlow'
    },
    formGrid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '24px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '16px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px',
      fontFamily: 'Barlow'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      fontFamily: 'Barlow'
    },
    inputWithButton: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    inputFlex: {
      flex: 1,
      position: 'relative'
    },
    updateButton: {
      backgroundColor: '#165C3C',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'Barlow',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap'
    },
    updateIconButton: {
      backgroundColor: '#165C3C',
      color: 'white',
      padding: '12px',
      width: '44px',
      height: '44px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'Barlow',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    verifyButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'Barlow',
      transition: 'all 0.2s'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 20px 25px rgba(0, 0, 0, 0.25)',
      fontFamily: 'Barlow'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#165C3C',
      marginBottom: '24px',
      fontFamily: 'Barlow'
    },
    otpContainer: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      marginBottom: '24px'
    },
    otpInput: {
      width: '50px',
      height: '50px',
      textAlign: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      outline: 'none',
      fontFamily: 'Barlow'
    },
    statusMessage: {
      padding: '12px',
      borderRadius: '6px',
      marginTop: '12px',
      fontSize: '14px',
      fontFamily: 'Barlow',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    successMessage: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #22c55e'
    },
    errorMessage: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #ef4444'
    },
    forgotPasswordLink: {
      color: '#3b82f6',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '14px',
      fontFamily: 'Barlow'
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#6b7280',
      color: 'white',
      padding: '10px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'Barlow',
      marginBottom: '16px'
    },
    eyeIcon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#6b7280'
    },
    // --- UPDATED: This style is for the DOH ID field ---
    readOnlyInput: {
      backgroundColor: 'white',
      cursor: 'not-allowed',
      color: '#374151',
      border: '2px solid #e5e7eb',
    },
    // --- UPDATED: This style is for the Email/Phone fields (read-only part) ---
    readOnlyInputActive: {
      backgroundColor: 'white',
      color: '#374151',
      border: '2px solid #e5e7eb',
    },
    checkIcon: {
      color: '#22c55e',
      marginLeft: '8px'
    },
    buttonContainer: {
      display: 'flex',
      gap: '16px',
      marginTop: '32px',
      flexWrap: 'wrap'
    },
    saveButton: {
      backgroundColor: '#22c55e',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'Barlow',
      transition: 'background-color 0.2s'
    },
    cancelButton: {
      backgroundColor: '#9ca3af',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'Barlow',
      transition: 'background-color 0.2s'
    },
    
    // --- NEW MODAL STYLES (from plasma.jsx) ---
    successModalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: "10px",
    },
    successModal: {
      backgroundColor: "white",
      borderRadius: "11px",
      width: "30%",
      maxWidth: "350px",
      padding: "40px 30px 30px",
      boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "Barlow",
      position: "relative",
    },
    successCloseButton: {
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "none",
      border: "none",
      fontSize: "24px",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      borderRadius: "4px",
      transition: "background-color 0.2s ease",
    },
    successCloseButtonHover: {
      backgroundColor: "#f3f4f6",
    },
    successIcon: {
      width: "30px",
      height: "30px",
      backgroundColor: "#10b981",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    successTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#165C3C",
      textAlign: "center",
      fontFamily: "Barlow",
      marginTop: '16px',
    },
    successDescription: {
      fontSize: "13px",
      color: "#6b7280",
      textAlign: "center",
      lineHeight: "1.5",
      fontFamily: "Barlow",
      marginTop: "-5px",
      marginBottom: '20px',
      paddingLeft: "20px",
      paddingRight: "20px",
    },
    successOkButton: {
      padding: "12px 60px",
      backgroundColor: "#FFC200",
      color: "black",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
    },
    successOkButtonHover: {
      backgroundColor: "#ffb300",
    },
    // --- END OF NEW MODAL STYLES ---
  };

  // Mobile responsiveness
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    styles.container.padding = '24px';
    styles.formGrid2.gridTemplateColumns = '1fr';
  }

  return (
    <>
      <div style={styles.container}>
        <h2 style={styles.title}>Account Settings</h2>

        {!showUpdatePassword && !showUpdatePhone && !showUpdateEmail && (
          <>
            <div style={styles.formGrid2}>
              {/* --- DOH ID FIELD UPDATED --- */}
              <div style={styles.formGroup}>
                <label style={styles.label}>DOH ID</label>
                <input
                  type="text"
                  value={profileData.doh_id || 'N/A'}
                  readOnly
                  disabled
                  style={{...styles.input, ...styles.readOnlyInput}}
                />
              </div>
              {/* --- EMAIL FIELD UPDATED --- */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <div style={styles.inputWithButton}>
                  <input
                    type="email"
                    value={profileData.email}
                    readOnly
                    disabled
                    style={{...styles.input, ...styles.readOnlyInputActive, flex: 1}}
                  />
                  <button
                    onClick={() => {
                      setShowUpdateEmail(true);
                      setNewEmail(profileData.email);
                      setEmailError('');
                    }}
                    style={styles.updateIconButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#134a2f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.formGrid2}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWithButton}>
                  <input
                    type="password"
                    value="••••••••"
                    readOnly
                    style={styles.input}
                  />
                  <button
                    onClick={() => setShowUpdatePassword(true)}
                    style={styles.updateIconButton} 
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#134a2f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
                  >
                    <Pencil size={18} /> 
                  </button>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <div style={styles.inputWithButton}>
                  <input
                    type="tel"
                    value={profileData.phone_number || 'Not set'}
                    readOnly
                    style={{...styles.input, ...styles.readOnlyInputActive, flex: 1}}
                  />
                  <button
                    onClick={() => {
                      setShowUpdatePhone(true);
                      setPhoneNumber(profileData.phone_number || '+63');
                      setPhoneError('');
                    }}
                    style={styles.updateIconButton} 
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#134a2f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
                  >
                    <Pencil size={18} /> 
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button
                onClick={handleSaveChanges}
                style={styles.saveButton}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                style={styles.cancelButton}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#6b7280'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#9ca3af'}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* --- NEW: Update Email Section --- */}
        {showUpdateEmail && (
          <div>
            <button
              onClick={() => {
                setShowUpdateEmail(false);
                setEmailError('');
              }}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <h3 style={styles.stepTitle}>Update Email Address</h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>New Email</label>
              <div style={styles.inputWithButton}>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailError('');
                  }}
                  style={{...styles.input, flex: 1}}
                  placeholder="Enter your new email"
                />
                <button
                  onClick={handleUpdateEmail}
                  style={styles.updateButton}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#134a2f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
                >
                  Save Email
                </button>
              </div>
              {emailError && (
                <div style={{...styles.statusMessage, ...styles.errorMessage, marginTop: '8px'}}>
                  {emailError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Update Password Section */}
        {showUpdatePassword && (
          <div>
            <button
              onClick={() => {
                setShowUpdatePassword(false);
                setPasswordError('');
                setNewPasswordError('');
                setPasswordVerified(false);
                setCurrentPassword('');
              }}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            
            <h3 style={styles.stepTitle}>Step 1: Verify Your Identity</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Enter Current Password</label>
              <div style={{position: 'relative'}}>
                <div style={styles.inputWithButton}>
                  <div style={styles.inputFlex}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={passwordVerified}
                      style={{
                        ...styles.input,
                        ...(passwordVerified ? styles.disabledInput : {})
                      }}
                      placeholder="Enter your current password"
                    />
                    {!passwordVerified && (
                      <div
                        style={styles.eyeIcon}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </div>
                    )}
                    {passwordVerified && (
                      <Check size={20} style={{...styles.eyeIcon, color: '#22c55e', cursor: 'default'}} />
                    )}
                  </div>
                  {!passwordVerified && (
                    <button
                      onClick={handleVerifyCurrentPassword}
                      style={styles.verifyButton}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>

              {passwordError && (
                <div style={{...styles.statusMessage, ...styles.errorMessage}}>
                  {passwordError}
                  {passwordError === 'Incorrect password' && (
                    <>
                      {' '}
                      <span
                        style={styles.forgotPasswordLink}
                        onClick={handleForgotPassword}
                      >
                        Forgot Password?
                      </span>
                    </>
                  )}
                </div>
              )}

              {passwordVerified && (
                <div style={{...styles.statusMessage, ...styles.successMessage}}>
                  <Check size={16} />
                  Password Verified Successfully!
                </div>
              )}
            </div>

            {passwordVerified && (
              <>
                <h3 style={styles.stepTitle}>Step 2: Set Your New Password</h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Enter New Password</label>
                  <div style={{position: 'relative'}}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setNewPasswordError('');
                      }}
                      style={styles.input}
                      placeholder="Enter new password"
                    />
                    <div
                      style={styles.eyeIcon}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                  {newPasswordError && (
                    <div style={{...styles.statusMessage, ...styles.errorMessage, marginTop: '8px'}}>
                      {newPasswordError}
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm New Password</label>
                  <div style={{position: 'relative'}}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setNewPasswordError('');
                      }}
                      style={styles.input}
                      placeholder="Confirm new password"
                    />
                    <div
                      style={styles.eyeIcon}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                </div>

                <div style={styles.buttonContainer}>
                  <button
                    onClick={handleUpdatePassword}
                    style={styles.saveButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
                  >
                    Confirm Update Password
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Update Phone Number Section */}
        {showUpdatePhone && (
          <div>
            <button
              onClick={() => {
                setShowUpdatePhone(false);
                setPhoneError('');
              }}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <h3 style={styles.stepTitle}>Update Phone Number</h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number</label>
              <div style={styles.inputWithButton}>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneError('');
                  }}
                  style={{...styles.input, flex: 1}}
                  placeholder="+639123456789"
                />
                <button
                  onClick={handleUpdatePhoneNumber}
                  style={styles.updateButton}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#134a2f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
                >
                  Save Phone Number
                </button>
              </div>
              {phoneError && (
                <div style={{...styles.statusMessage, ...styles.errorMessage, marginTop: '8px'}}>
                  {phoneError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password OTP Modal */}
      {showForgotPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h3 style={styles.modalTitle}>Enter 6 Digit OTP Code</h3>
            <div style={styles.otpContainer}>
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value, setOtpCode, otpCode)}
                  style={styles.otpInput}
                />
              ))}
            </div>
            <button
              onClick={handleVerifyPasswordOTP}
              style={{...styles.saveButton, width: '100%'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
            >
              Verify Code
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlays */}
      {loadingPassword && <Loader />}
      {loadingPhone && <Loader />}
      {loadingEmail && <Loader />} {/* --- NEW --- */}

      {/* --- NEW UNIFIED SUCCESS MODAL (PLASMA STYLE) --- */}
      {showSuccessModal && (
        <div style={styles.successModalOverlay}>
          <div style={styles.successModal}>
            <button
              style={{
                ...styles.successCloseButton,
                ...(hoverStates.successClose
                  ? styles.successCloseButtonHover
                  : {}),
              }}
              onClick={() => setShowSuccessModal(false)}
              onMouseEnter={() => handleMouseEnter("successClose")}
              onMouseLeave={() => handleMouseLeave("successClose")}
            >
              ×
            </button>

            <div style={styles.successIcon}>
              <svg width="20" height="20" fill="white" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h3 style={styles.successTitle}>{successMessage.title}</h3>
            <p style={styles.successDescription}>
              {successMessage.description}
            </p>

            <button
              style={{
                ...styles.successOkButton,
                ...(hoverStates.successOk ? styles.successOkButtonHover : {}),
              }}
              onClick={() => setShowSuccessModal(false)}
              onMouseEnter={() => handleMouseEnter("successOk")}
              onMouseLeave={() => handleMouseLeave("successOk")}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* --- END OF NEW MODAL --- */}
    </>
  );
};

export default ProfileSettings;