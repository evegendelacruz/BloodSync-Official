// ProfileSettings.jsx
import React from 'react';

const ProfileSettings = ({ profileData, handleInputChange, handleSaveChanges, handleCancel }) => {
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
    inputFocus: {
      borderColor: '#059669',
      boxShadow: '0 0 0 2px rgba(5, 150, 105, 0.2)'
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
      transition: 'background-color 0.2s'
    },
    saveButtonHover: {
      backgroundColor: '#16a34a'
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
    cancelButtonHover: {
      backgroundColor: '#6b7280'
    }
  };

  // Media query for mobile responsiveness
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    styles.container.padding = '24px';
    styles.formGrid2.gridTemplateColumns = '1fr';
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Account Settings</h2>
      
      <div style={styles.formGrid2}>
        <div style={styles.formGroup}>
          <label style={styles.label}>User ID</label>
          <input
            type="text"
            value={profileData.userId}
            onChange={(e) => handleInputChange('userId', e.target.value)}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = styles.inputFocus.borderColor;
              e.target.style.boxShadow = styles.inputFocus.boxShadow;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = styles.input.borderColor;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = styles.inputFocus.borderColor;
              e.target.style.boxShadow = styles.inputFocus.boxShadow;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = styles.input.borderColor;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div style={styles.formGrid2}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={profileData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = styles.inputFocus.borderColor;
              e.target.style.boxShadow = styles.inputFocus.boxShadow;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = styles.input.borderColor;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Phone Number</label>
          <input
            type="tel"
            value={profileData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = styles.inputFocus.borderColor;
              e.target.style.boxShadow = styles.inputFocus.boxShadow;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = styles.input.borderColor;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <button
          onClick={handleSaveChanges}
          style={styles.saveButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = styles.saveButtonHover.backgroundColor}
          onMouseLeave={(e) => e.target.style.backgroundColor = styles.saveButton.backgroundColor}
        >
          Save Changes
        </button>
        <button
          onClick={handleCancel}
          style={styles.cancelButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = styles.cancelButtonHover.backgroundColor}
          onMouseLeave={(e) => e.target.style.backgroundColor = styles.cancelButton.backgroundColor}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;