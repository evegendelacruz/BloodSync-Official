// ProfileSettingsOrg.jsx
import React, { useState } from 'react';
import { Check, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Loader from '../../../../../components/Loader';

const ProfileSettingsOrg = ({ profileData, handleInputChange, handleSaveChanges, handleCancel }) => {
  // Update Password States
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  // Update Phone Number States
  const [showUpdatePhone, setShowUpdatePhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState(['', '', '', '', '', '']);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [showPhoneSuccess, setShowPhoneSuccess] = useState(false);
  const [hasExistingPhone, setHasExistingPhone] = useState(false);

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
      // Verify password with backend
      const user = JSON.parse(localStorage.getItem('currentOrgUser'));
      const isValid = await window.electronAPI.verifyPassword(user.userId, currentPassword);

      if (isValid) {
        setPasswordVerified(true);
        setPasswordError('');
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
      const user = JSON.parse(localStorage.getItem('currentOrgUser'));
      await window.electronAPI.sendPasswordResetOTP(user.email);
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
      const user = JSON.parse(localStorage.getItem('currentOrgUser'));
      const isValid = await window.electronAPI.verifyPasswordResetOTP(user.email, code);

      if (isValid) {
        setPasswordVerified(true);
        setShowForgotPasswordModal(false);
        setShowPasswordSuccess(true);
        setTimeout(() => setShowPasswordSuccess(false), 1500);
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
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setLoadingPassword(true);
      const user = JSON.parse(localStorage.getItem('currentOrgUser'));
      await window.electronAPI.updateUserPassword(user.userId, newPassword);

      // Show success modal
      setShowPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordSuccess(false);
        setShowUpdatePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordVerified(false);
      }, 1500);
    } catch (error) {
      setPasswordError('Error updating password');
    } finally {
      setLoadingPassword(false);
    }
  };

  // Update Phone Number
  const handleUpdatePhoneNumber = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    try {
      setLoadingPhone(true);
      const user = JSON.parse(localStorage.getItem('currentOrgUser'));

      // Check if user has existing phone number
      const profile = await window.electronAPI.getUserProfile(user.userId);
      const hasPhone = profile.phone_number && profile.phone_number.length > 0;
      setHasExistingPhone(hasPhone);

      // Send OTP
      await window.electronAPI.sendPhoneOTP(phoneNumber);
      setShowPhoneOtpModal(true);
    } catch (error) {
      alert('Error sending OTP');
    } finally {
      setLoadingPhone(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOTP = async () => {
    const code = phoneOtpCode.join('');
    if (code.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    try {
      setLoadingPhone(true);
      const user = JSON.parse(localStorage.getItem('currentOrgUser'));
      const isValid = await window.electronAPI.verifyPhoneOTP(phoneNumber, code);

      if (isValid) {
        await window.electronAPI.updateUserPhone(user.userId, phoneNumber);
        setShowPhoneOtpModal(false);
        setShowPhoneSuccess(true);
        setTimeout(() => {
          setShowPhoneSuccess(false);
          setShowUpdatePhone(false);
          setPhoneNumber('');
        }, 1500);
      } else {
        alert('Invalid OTP code');
      }
    } catch (error) {
      alert('Error verifying OTP');
    } finally {
      setLoadingPhone(false);
    }
  };

  // OTP Input Handler
  const handleOtpChange = (index, value, setOtpFunc, otpArray) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpFunc(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

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
    formGrid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '24px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
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
    disabledInput: {
      backgroundColor: '#f3f4f6',
      cursor: 'not-allowed',
      opacity: 0.6
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
    }
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

        {!showUpdatePassword && !showUpdatePhone && (
          <>
            <div style={styles.formGrid2}>
              <div style={styles.formGroup}>
                <label style={styles.label}>DOH ID</label>
                <input
                  type="text"
                  value={profileData.dohId || 'Generating...'}
                  readOnly
                  disabled
                  style={{...styles.input, ...styles.disabledInput}}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  readOnly
                  disabled
                  style={{...styles.input, ...styles.disabledInput}}
                />
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
                    style={styles.updateButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#134a2f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
                  >
                    Update Password
                  </button>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <div style={styles.inputWithButton}>
                  <input
                    type="tel"
                    value={profileData.phoneNumber || 'Not set'}
                    readOnly
                    style={styles.input}
                  />
                  <button
                    onClick={() => setShowUpdatePhone(true)}
                    style={styles.updateButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#134a2f'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
                  >
                    Update Phone Number
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

        {/* Update Password Section */}
        {showUpdatePassword && (
          <div>
            <button
              onClick={() => setShowUpdatePassword(false)}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back
            </button>

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
                <div style={styles.formGroup}>
                  <label style={styles.label}>Enter New Password</label>
                  <div style={{position: 'relative'}}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm New Password</label>
                  <div style={{position: 'relative'}}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
              onClick={() => setShowUpdatePhone(false)}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number</label>
              <div style={styles.inputWithButton}>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{...styles.input, flex: 1}}
                  placeholder="Enter phone number"
                />
                <button
                  onClick={handleUpdatePhoneNumber}
                  style={styles.updateButton}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#134a2f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
                >
                  {hasExistingPhone ? 'Send OTP' : 'Register'}
                </button>
              </div>
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

      {/* Phone OTP Modal */}
      {showPhoneOtpModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button
              onClick={() => setShowPhoneOtpModal(false)}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h3 style={styles.modalTitle}>Enter 6 Digit OTP Code</h3>
            <div style={styles.otpContainer}>
              {phoneOtpCode.map((digit, index) => (
                <input
                  key={index}
                  id={`phone-otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value, setPhoneOtpCode, phoneOtpCode)}
                  style={styles.otpInput}
                />
              ))}
            </div>
            <button
              onClick={handleVerifyPhoneOTP}
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

      {/* Success Modals */}
      {showPasswordSuccess && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, textAlign: 'center'}}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Check size={32} color="white" />
            </div>
            <h3 style={{...styles.modalTitle, marginBottom: '8px'}}>Password Updated!</h3>
            <p style={{color: '#6b7280', fontSize: '14px'}}>Your password has been updated successfully.</p>
          </div>
        </div>
      )}

      {showPhoneSuccess && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, textAlign: 'center'}}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Check size={32} color="white" />
            </div>
            <h3 style={{...styles.modalTitle, marginBottom: '8px'}}>
              {hasExistingPhone ? 'Phone Number Updated!' : 'Registration Successful!'}
            </h3>
            <p style={{color: '#6b7280', fontSize: '14px'}}>
              Your phone number has been {hasExistingPhone ? 'updated' : 'registered'} successfully.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSettingsOrg;
