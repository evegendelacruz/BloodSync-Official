import React, { useState } from 'react';
import { User, Clock, Settings, Camera, Upload, Trash2, ChevronDown } from 'lucide-react';
import ProfileActivity from '../profile/profile_activity';
import ProfileSettings from '../profile/profile_settings';

const ProfileComponent = () => {
  const [activeTab, setActiveTab] = useState('information');
  const [showPhotoDropdown, setShowPhotoDropdown] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    role: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    civilStatus: '',
    barangay: '',
    bloodType: '',
    userId: '',
    email: '',
    password: '',
    phoneNumber: ''
  });

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = () => {
    console.log('Saving changes:', profileData);
  };

  const handleCancel = () => {
    console.log('Cancelled');
  };

  const handleUploadPhoto = () => {
    console.log('Upload photo');
    setShowPhotoDropdown(false);
  };

  const handleRemovePhoto = () => {
    console.log('Remove photo');
    setShowPhotoDropdown(false);
  };

  const styles = {
    mainWrapper: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      gap: '24px',
      alignItems: 'flex-start',
      fontFamily: 'Barlow'
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "-7px",
      fontFamily:'Barlow'
    },
    sidebar: {
      width: '320px',
      minWidth: '320px',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px 24px',
      height: 'fit-content',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      position: 'sticky',
    },
    profileSection: {
      textAlign: 'center',
      marginBottom: '28px',
    },
    profilePictureContainer: {
      position: 'relative',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'center',
      width: '140px',
      height: '140px',
      margin: '0 auto 24px auto'
    },
    profilePicture: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      overflow: 'hidden',
      border: '2px solid #059669',
      backgroundColor: '#e5e7eb'
    },
    profileImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    cameraButtonContainer: {
      position: 'absolute',
      bottom: '0',
      right: '0',
      zIndex: 10
    },
    cameraButton: {
      backgroundColor: '#059669',
      color: 'white',
      padding: '8px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      right: '0',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e5e7eb',
      minWidth: '160px',
      zIndex: 20,
      marginTop: '4px'
    },
    dropdownItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#374151',
      transition: 'background-color 0.2s',
      border: 'none',
      backgroundColor: 'transparent',
      width: '100%',
      textAlign: 'left'
    },
    dropdownItemHover: {
      backgroundColor: '#f3f4f6'
    },
    profileName: {
      fontSize: '18px',
      fontWeight: '700',
      color: "#165C3C",
      marginBottom: '8px',
      letterSpacing: '0.5px'
    },
    profileId: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '4px',
      fontWeight: '500'
    },
    profileRole: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '500'
    },
    navigation: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      margin: '0 -24px',
    },
    navButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 24px',
      textAlign: 'left',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: '500',
      fontSize: '14px',
      borderRadius: '0',
      borderRight: 'none',
      borderLeft: '4px solid transparent', 
      boxSizing: 'border-box', 
    },
    navButtonActive: {
      backgroundColor: 'rgba(147, 194, 66, 0.2)',
      color: '#165C3C',
      borderLeft: '4px solid #93C242'   
    },
    navButtonHover: {
      backgroundColor: 'rgba(147, 194, 66, 0.2)',
      color: '#374151'
    },
    contentArea: {
      flex: '1',
      minWidth: '0'
    },
    contentCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
    contentTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "-7px",
      fontFamily:'Barlow'
    },
    // Responsive form rows
    formRow3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '24px',
      marginBottom: '24px'
    },
    formRow2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
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
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s',
      backgroundColor: 'white',
      fontFamily: 'inherit',
      width: '100%',
      boxSizing: 'border-box'
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
      borderRadius: '8px',
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
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s'
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 5,
      backgroundColor: 'transparent'
    }
  };

  // Add media query styles for smaller screens
  const mediaQueries = `
    <style>
      @media (max-width: 768px) {
        .form-row-3 {
          grid-template-columns: 1fr !important;
        }
        .form-row-2 {
          grid-template-columns: 1fr !important;
        }
      }
      
      @media (max-width: 1024px) {
        .form-row-3 {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
    </style>
  `;

  const ProfileInformation = () => (
    <>
      <div dangerouslySetInnerHTML={{ __html: mediaQueries }} />
      <div style={styles.contentCard}>
        <h2 style={styles.contentTitle}>Profile Information</h2>
        
        {/* First Row - 3 columns */}
        <div style={styles.formRow3} className="form-row-3">
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={profileData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Role</label>
            <input
              type="text"
              value={profileData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Gender</label>
            <input
              type="text"
              value={profileData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Second Row - 3 columns */}
        <div style={styles.formRow3} className="form-row-3">
          <div style={styles.formGroup}>
            <label style={styles.label}>Date of Birth</label>
            <input
              type="text"
              value={profileData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nationality</label>
            <input
              type="text"
              value={profileData.nationality}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Civil Status</label>
            <input
              type="text"
              value={profileData.civilStatus}
              onChange={(e) => handleInputChange('civilStatus', e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Third Row - 2 columns */}
        <div style={styles.formRow2} className="form-row-2">
          <div style={styles.formGroup}>
            <label style={styles.label}>Barangay</label>
            <input
              type="text"
              value={profileData.barangay}
              onChange={(e) => handleInputChange('barangay', e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Blood Type</label>
            <input
              type="text"
              value={profileData.bloodType}
              onChange={(e) => handleInputChange('bloodType', e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
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
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'information':
        return <ProfileInformation />;
      case 'activity':
        return <ProfileActivity />;
      case 'settings':
        return <ProfileSettings profileData={profileData} handleInputChange={handleInputChange} handleSaveChanges={handleSaveChanges} handleCancel={handleCancel} />;
      default:
        return <ProfileInformation />;
    }
  };

  return (
      <div style={styles.mainWrapper}>
        {/* Overlay to close dropdown when clicking outside */}
        {showPhotoDropdown && (
          <div 
            style={styles.overlay} 
            onClick={() => setShowPhotoDropdown(false)}
          />
        )}
        
        {/* Left Sidebar */}
        <div style={styles.sidebar}>
        <h2 style={styles.title}>Profile</h2>
          <div style={styles.profileSection}>
            {/* Profile Picture */}
            <div style={styles.profilePictureContainer}>
              <div style={styles.profilePicture}>
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b5bb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80"
                  alt="Profile"
                  style={styles.profileImage}
                />
              </div>
              
              {/* Camera Button Container */}
              <div style={styles.cameraButtonContainer}>
                <button
                  onClick={() => setShowPhotoDropdown(!showPhotoDropdown)}
                  style={styles.cameraButton}
                  title="Change Profile Picture"
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <Camera size={14} />
                </button>

                {/* Dropdown Menu */}
                {showPhotoDropdown && (
                  <div style={styles.dropdown}>
                    <button
                      style={styles.dropdownItem}
                      onClick={handleUploadPhoto}
                      onMouseEnter={(e) => Object.assign(e.target.style, styles.dropdownItemHover)}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <Upload size={16} />
                      Upload Photo
                    </button>
                    <button
                      style={styles.dropdownItem}
                      onClick={handleRemovePhoto}
                      onMouseEnter={(e) => Object.assign(e.target.style, styles.dropdownItemHover)}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={16} />
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3 style={styles.profileName}>ALAIZA ROSE OLORES</h3>
            <p style={styles.profileId}>DOH000001</p>
            <p style={styles.profileRole}>MEDICAL TECHNOLOGIST</p>
          </div>

          {/* Navigation Menu */}
          <nav style={styles.navigation}>
            <button
              onClick={() => setActiveTab('information')}
              style={{
                ...styles.navButton,
                ...(activeTab === 'information' ? styles.navButtonActive : {})
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'information') {
                  Object.assign(e.target.style, styles.navButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'information') {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }
              }}
            >
              <User size={18} />
              <span>Profile Information</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              style={{
                ...styles.navButton,
                ...(activeTab === 'activity' ? styles.navButtonActive : {})
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'activity') {
                  Object.assign(e.target.style, styles.navButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'activity') {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }
              }}
            >
              <Clock size={18} />
              <span>Recent Activity</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                ...styles.navButton,
                ...(activeTab === 'settings' ? styles.navButtonActive : {})
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'settings') {
                  Object.assign(e.target.style, styles.navButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'settings') {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }
              }}
            >
              <Settings size={18} />
              <span>Account Settings</span>
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div style={styles.contentArea}>
          {renderContent()}
        </div>
    </div>
  );
};

export default ProfileComponent;