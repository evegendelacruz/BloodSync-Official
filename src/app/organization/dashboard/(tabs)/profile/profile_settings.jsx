// ProfileSettingsOrg.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const ProfileSettingsOrg = ({ profileData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log('Loaded user data from localStorage:', userData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);


  // Use currentUser if profileData is not available
  const displayData = currentUser;

  console.log('ProfileSettingsOrg - Display Data:', displayData);

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
    fieldError: {
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '4px',
      display: 'block'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
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
      boxSizing: 'border-box'
    },
    inputDisabled: {
      backgroundColor: '#f3f4f6',
      cursor: 'not-allowed',
      color: '#6b7280'
    },
    passwordWrapper: {
      position: 'relative',
      width: '100%'
    },
    eyeButton: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    buttonContainer: {
      display: 'flex',
      gap: '16px',
      marginTop: '32px',
      flexWrap: 'wrap'
    },
    editButton: {
      backgroundColor: '#165C3C',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s'
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
      transition: 'background-color 0.2s'
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
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      maxWidth: '400px',
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    modalIcon: {
      marginBottom: '16px'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#1f2937'
    },
    modalMessage: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '24px'
    },
    modalButton: {
      backgroundColor: '#165C3C',
      color: 'white',
      padding: '12px 32px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s'
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFieldErrors({ currentPassword: '', newPassword: '' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      currentPassword: '',
      newPassword: ''
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setFieldErrors({ currentPassword: '', newPassword: '' });
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handlePasswordChange = (field, value) => {
    setFormData({...formData, [field]: value});
    
    if (fieldErrors[field]) {
      setFieldErrors({...fieldErrors, [field]: ''});
    }
    
    if (field === 'newPassword' && value) {
      if (value.length < 8) {
        setFieldErrors({...fieldErrors, newPassword: 'Password must be at least 8 characters long'});
      } else if (!validatePassword(value)) {
        setFieldErrors({...fieldErrors, newPassword: 'Password must contain uppercase, lowercase, number and special character'});
      } else {
        setFieldErrors({...fieldErrors, newPassword: ''});
      }
    }
  };

  const showModalMessage = (type, message) => {
    setModalContent({ type, message });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    if (modalContent.type === 'success') {
      handleCancel();
    }
  };
const handleSaveChanges = async () => {
  let errors = { currentPassword: '', newPassword: '' };
  let hasError = false;

  if (!formData.currentPassword) {
    errors.currentPassword = 'Current password is required';
    hasError = true;
  }

  if (!formData.newPassword) {
    errors.newPassword = 'New password is required';
    hasError = true;
  } else if (formData.newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters long';
    hasError = true;
  } else if (!validatePassword(formData.newPassword)) {
    errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
    hasError = true;
  }

  if (hasError) {
    setFieldErrors(errors);
    return;
  }

  try {
    if (!currentUser || !currentUser.id) {
      showModalMessage('error', 'User session not found. Please login again.');
      return;
    }

    const result = await window.electronAPI.updateUserPasswordOrg(
      currentUser.id, 
      formData.currentPassword,
      formData.newPassword
    );

    if (!result || !result.success) {
      const errorMessage = result?.message || 'Failed to update password. Please try again.';
      
      if (errorMessage.toLowerCase().includes('incorrect')) {
        setFieldErrors({ ...errors, currentPassword: 'Current password is incorrect' });
      } else {
        showModalMessage('error', errorMessage);
      }
      return;
    }

    showModalMessage('success', 'Password updated successfully!');
    
    setFormData({
      currentPassword: '',
      newPassword: ''
    });
    
  } catch (error) {
    showModalMessage('error', error.message || 'Failed to update password. Please try again.');
  }
};

  return (
    <>
      <div style={styles.container}>
        <h2 style={styles.title}>Account Settings</h2>
        
        <div style={styles.formGrid2}>
          <div style={styles.formGroup}>
              <label style={styles.label}>ORG ID</label>
              <input
                type="text"
                value={displayData?.orgId || 'Loading...'}
                disabled
                style={{
                  ...styles.input,
                  ...styles.inputDisabled
                }}
              />
            </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={displayData?.email || ''}
              disabled
              style={{
                ...styles.input,
                ...styles.inputDisabled
              }}
            />
          </div>
        </div>

        <div style={styles.formGrid2}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Current Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                disabled={!isEditing}
                placeholder={isEditing ? "Enter current password" : ""}
                style={{
                  ...styles.input,
                  paddingRight: '45px',
                  ...(!isEditing && styles.inputDisabled),
                  ...(fieldErrors.currentPassword && { borderColor: '#dc2626' })
                }}
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeButton}
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
            {fieldErrors.currentPassword && (
              <span style={styles.fieldError}>{fieldErrors.currentPassword}</span>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                disabled={!isEditing}
                placeholder={isEditing ? "Enter new password" : ""}
                style={{
                  ...styles.input,
                  paddingRight: '45px',
                  ...(!isEditing && styles.inputDisabled),
                  ...(fieldErrors.newPassword && { borderColor: '#dc2626' })
                }}
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
            {fieldErrors.newPassword && (
              <span style={styles.fieldError}>{fieldErrors.newPassword}</span>
            )}
          </div>
        </div>

        <div style={styles.buttonContainer}>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              style={styles.editButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
            >
              Edit Account Password
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              {modalContent.type === 'success' ? (
                <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto' }} />
              ) : (
                <XCircle size={64} color="#ef4444" style={{ margin: '0 auto' }} />
              )}
            </div>
            <h3 style={styles.modalTitle}>
              {modalContent.type === 'success' ? 'Success!' : 'Error'}
            </h3>
            <p style={styles.modalMessage}>{modalContent.message}</p>
            <button
              onClick={closeModal}
              style={styles.modalButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSettingsOrg;