import React, { useState, useEffect, useRef } from 'react';
import { User, Clock, Settings, Camera, Upload, Trash2, ChevronDown, X, ZoomIn, ZoomOut } from 'lucide-react';
import ProfileActivityOrg from '../profile/profile_activity';
import ProfileSettingsOrg from '../profile/profile_settings';

// Barangay list for CDO
const BARANGAY_LIST = [
  "Agusan", "Baikingon", "Balubal", "Balulang",
  "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5",
  "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9", "Barangay 10",
  "Barangay 11", "Barangay 12", "Barangay 13", "Barangay 14", "Barangay 15",
  "Barangay 16", "Barangay 17", "Barangay 18", "Barangay 19", "Barangay 20",
  "Barangay 21", "Barangay 22", "Barangay 23", "Barangay 24", "Barangay 25",
  "Barangay 26", "Barangay 27", "Barangay 28", "Barangay 29", "Barangay 30",
  "Barangay 31", "Barangay 32", "Barangay 33", "Barangay 34", "Barangay 35",
  "Barangay 36", "Barangay 37", "Barangay 38", "Barangay 39", "Barangay 40",
  "Bayabas", "Bayanga", "Besigan", "Bonbon", "Bugo", "Bulua", "Camaman-an",
  "Canito-an", "Carmen", "Consolacion", "Cugman", "Dansolihon", "Gusa",
  "Indahag", "Iponan", "Kauswagan", "Lapasan", "Lumbia", "Macabalan",
  "Macasandig", "Mambuaya", "Nazareth", "Pagalungan", "Pagatpat", "Patag",
  "Pigsag-an", "Puerto", "Puntod", "San Simon", "Tablon", "Taglimao",
  "Tagpangi", "Tignapoloan", "Tuburan", "Tugbok"
];

const ProfileOrg = () => {
  const [activeTab, setActiveTab] = useState('information');
  const [showPhotoDropdown, setShowPhotoDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [profileData, setProfileData] = useState({
    fullName: '',
    role: '',
    dohId: '',
    gender: '',
    dateOfBirth: '',
    nationality: 'Filipino',
    civilStatus: '',
    barangay: '',
    bloodType: '',
    userId: '',
    email: '',
    password: '',
    phoneNumber: '',
    profilePhoto: null,
    lastLogin: null
  });

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      // Get current user from localStorage (set during login)
      const userStr = localStorage.getItem('currentOrgUser');
      if (!userStr) {
        console.error('No user found in localStorage');
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      console.log('Loaded user from localStorage:', user);
      setCurrentUser(user);

      // Fetch profile from backend using Electron API
      const profile = await window.electronAPI.getUserProfile(user.userId);

      console.log('Profile data from Electron API:', profile);

      if (profile) {
        setProfileData({
          fullName: profile.full_name || user.fullName || '',
          role: profile.role || user.role || '',
          dohId: profile.doh_id || '',
          gender: profile.gender || '',
          dateOfBirth: profile.date_of_birth || '',
          nationality: profile.nationality || 'Filipino',
          civilStatus: profile.civil_status || '',
          barangay: profile.barangay || user.barangay || '',
          bloodType: profile.blood_type || '',
          userId: profile.user_id || user.userId || '',
          email: profile.email || user.email || '',
          password: '',
          phoneNumber: '',
          profilePhoto: profile.profile_photo || null,
          lastLogin: profile.last_login || null
        });
      } else {
        // If no profile data in database yet, use data from localStorage
        setProfileData({
          fullName: user.fullName || '',
          role: user.role || '',
          dohId: '',
          gender: '',
          dateOfBirth: '',
          nationality: 'Filipino',
          civilStatus: '',
          barangay: user.barangay || '',
          bloodType: '',
          userId: user.userId || '',
          email: user.email || '',
          password: '',
          phoneNumber: '',
          profilePhoto: null
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to localStorage data
      const userStr = localStorage.getItem('currentOrgUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setProfileData({
          fullName: user.fullName || '',
          role: user.role || '',
          gender: '',
          dateOfBirth: '',
          nationality: 'Filipino',
          civilStatus: '',
          barangay: user.barangay || '',
          bloodType: '',
          userId: user.userId || '',
          email: user.email || '',
          password: '',
          phoneNumber: '',
          profilePhoto: null
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      if (!currentUser) {
        alert('User not logged in');
        return;
      }

      setIsLoading(true);

      // Use Electron API to update profile
      const profileDataToSave = {
        profilePhoto: profileData.profilePhoto,
        dohId: profileData.dohId,
        gender: profileData.gender,
        dateOfBirth: profileData.dateOfBirth,
        nationality: profileData.nationality,
        civilStatus: profileData.civilStatus,
        bloodType: profileData.bloodType,
        barangay: profileData.barangay,
        role: profileData.role
      };

      console.log('Saving profile data:', profileDataToSave);

      const result = await window.electronAPI.updateUserProfile(
        currentUser.userId,
        profileDataToSave,
        profileData.fullName
      );

      console.log('Update result:', result);

      alert('Profile updated successfully!');

      // Update localStorage with new data
      const updatedUser = {
        ...currentUser,
        fullName: profileData.fullName,
        role: profileData.role,
        barangay: profileData.barangay,
        profilePhoto: profileData.profilePhoto
      };
      localStorage.setItem('currentOrgUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // Dispatch custom event to notify other components about the profile update
      window.dispatchEvent(new Event('profileUpdated'));

      await loadUserProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    loadUserProfile(); // Reload original data
  };

  const handleUploadPhoto = () => {
    console.log('Upload photo clicked!');
    setShowPhotoDropdown(false); // Close dropdown first

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      console.log('File selected:', file);
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            console.log('Image loaded, opening crop modal');
            setSelectedImage(event.target.result);
            // Calculate initial crop position to center the image
            const size = Math.min(img.width, img.height);
            setCropPosition({
              x: (img.width - size) / 2,
              y: (img.height - size) / 2
            });
            setZoom(1);
            setShowCropModal(true);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };

    // Trigger click after a small delay to ensure dropdown closes
    setTimeout(() => {
      input.click();
    }, 100);
  };

  const handleCropImage = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas to 1:1 square (400x400 for good quality)
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate the crop size based on zoom
    const cropSize = Math.min(img.naturalWidth, img.naturalHeight) / zoom;

    // Draw the cropped and scaled image
    ctx.drawImage(
      img,
      cropPosition.x,
      cropPosition.y,
      cropSize,
      cropSize,
      0,
      0,
      outputSize,
      outputSize
    );

    // Get the cropped image as base64
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9);

    setProfileData(prev => ({
      ...prev,
      profilePhoto: croppedImage
    }));

    setShowCropModal(false);
    setSelectedImage(null);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropPosition.x,
      y: e.clientY - cropPosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return;

    const img = imageRef.current;
    const cropSize = Math.min(img.naturalWidth, img.naturalHeight) / zoom;

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    // Constrain movement within image bounds
    newX = Math.max(0, Math.min(newX, img.naturalWidth - cropSize));
    newY = Math.max(0, Math.min(newY, img.naturalHeight - cropSize));

    setCropPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 1));
  };

  const handleRemovePhoto = () => {
    setProfileData(prev => ({
      ...prev,
      profilePhoto: null
    }));
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
      zIndex: 9999,
      marginTop: '4px',
      pointerEvents: 'auto'
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
      textAlign: 'left',
      pointerEvents: 'auto'
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
      fontWeight: '700'
    },
    profileRole: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    },
    lastLogin: {
      fontSize: '12px',
      color: '#9ca3af',
      marginTop: '8px',
      fontStyle: 'italic'
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
      zIndex: 100,
      backgroundColor: 'transparent',
      pointerEvents: 'none'
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
            <label style={styles.label}>Full Name *</label>
            <input
              type="text"
              value={profileData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              style={styles.input}
              disabled={isLoading}
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
            <label style={styles.label}>Role *</label>
            <select
              value={profileData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              style={styles.input}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select Role</option>
              <option value="Barangay">Barangay</option>
              <option value="Local Government Unit">Local Government Unit</option>
              <option value="Non-Profit Organization">Non-Profit Organization</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Gender *</label>
            <select
              value={profileData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              style={styles.input}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Prefer Not to Say">Prefer Not to Say</option>
            </select>
          </div>
        </div>

        {/* Second Row - 3 columns */}
        <div style={styles.formRow3} className="form-row-3">
          <div style={styles.formGroup}>
            <label style={styles.label}>Date of Birth *</label>
            <input
              type="date"
              value={profileData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              style={styles.input}
              disabled={isLoading}
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
            <label style={styles.label}>Nationality *</label>
            <select
              value={profileData.nationality}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              style={styles.input}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="Filipino">Filipino</option>
              <option value="American">American</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Civil Status *</label>
            <select
              value={profileData.civilStatus}
              onChange={(e) => handleInputChange('civilStatus', e.target.value)}
              style={styles.input}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Divorced">Divorced</option>
              <option value="Separated">Separated</option>
            </select>
          </div>
        </div>

        {/* Third Row - 2 columns */}
        <div style={styles.formRow2} className="form-row-2">
          <div style={styles.formGroup}>
            <label style={styles.label}>Barangay (CDO) *</label>
            <select
              value={profileData.barangay}
              onChange={(e) => handleInputChange('barangay', e.target.value)}
              style={styles.input}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select Barangay</option>
              {BARANGAY_LIST.map((barangay) => (
                <option key={barangay} value={barangay}>
                  {barangay}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Blood Type *</label>
            <select
              value={profileData.bloodType}
              onChange={(e) => handleInputChange('bloodType', e.target.value)}
              style={styles.input}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select Blood Type</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
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
        return <ProfileActivityOrg />;
      case 'settings':
        return <ProfileSettingsOrg profileData={profileData} handleInputChange={handleInputChange} handleSaveChanges={handleSaveChanges} handleCancel={handleCancel} />;
      default:
        return <ProfileInformation />;
    }
  };

  // Close dropdown when clicking anywhere on the page
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPhotoDropdown) {
        // Check if click is outside the dropdown
        const dropdown = document.getElementById('photo-dropdown');
        const cameraButton = document.getElementById('camera-button');

        if (dropdown && !dropdown.contains(event.target) &&
            cameraButton && !cameraButton.contains(event.target)) {
          setShowPhotoDropdown(false);
        }
      }
    };

    if (showPhotoDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPhotoDropdown]);

  return (
      <div style={styles.mainWrapper}>

        {/* Image Crop Modal */}
        {showCropModal && selectedImage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#165C3C' }}>
                  Crop Profile Photo
                </h2>
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setSelectedImage(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={24} color="#6b7280" />
                </button>
              </div>

              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                Drag to reposition and use zoom controls to adjust the crop area.
              </p>

              {/* Crop Area */}
              <div style={{
                position: 'relative',
                width: '400px',
                height: '400px',
                margin: '0 auto 20px',
                overflow: 'hidden',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: isDragging ? 'grabbing' : 'grab',
                backgroundColor: '#f3f4f6'
              }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Crop preview"
                  style={{
                    position: 'absolute',
                    left: `-${cropPosition.x}px`,
                    top: `-${cropPosition.y}px`,
                    width: `${100 * zoom}%`,
                    height: 'auto',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                />
                {/* Crop guide overlay */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%',
                  height: '100%',
                  border: '2px dashed #059669',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }} />
              </div>

              {/* Zoom Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={handleZoomOut}
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  disabled={zoom <= 1}
                >
                  <ZoomOut size={20} color={zoom <= 1 ? '#d1d5db' : '#374151'} />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{
                    width: '200px',
                    cursor: 'pointer'
                  }}
                />
                <button
                  onClick={handleZoomIn}
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  disabled={zoom >= 3}
                >
                  <ZoomIn size={20} color={zoom >= 3 ? '#d1d5db' : '#374151'} />
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setSelectedImage(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropImage}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Apply Crop
                </button>
              </div>

              {/* Hidden canvas for cropping */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>
        )}
        
        {/* Left Sidebar */}
        <div style={styles.sidebar}>
        <h2 style={styles.title}>Profile</h2>
          <div style={styles.profileSection}>
            {/* Profile Picture */}
            <div style={styles.profilePictureContainer}>
              <div style={styles.profilePicture}>
                {profileData.profilePhoto ? (
                  <img
                    src={profileData.profilePhoto}
                    alt="Profile"
                    style={styles.profileImage}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e5e7eb',
                    color: '#6b7280',
                    fontSize: '48px',
                    fontWeight: 'bold'
                  }}>
                    {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              
              {/* Camera Button Container */}
              <div style={styles.cameraButtonContainer}>
                <button
                  id="camera-button"
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
                  <div
                    id="photo-dropdown"
                    style={styles.dropdown}
                  >
                    <button
                      type="button"
                      style={styles.dropdownItem}
                      onClick={(e) => {
                        console.log('Upload button clicked!');
                        handleUploadPhoto();
                      }}
                      onMouseEnter={(e) => {
                        console.log('Upload hover');
                        e.target.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Upload size={16} />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      style={styles.dropdownItem}
                      onClick={(e) => {
                        console.log('Remove button clicked!');
                        handleRemovePhoto();
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Trash2 size={16} />
                      <span>Remove Photo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3 style={styles.profileName}>{profileData.fullName || 'Loading...'}</h3>
            <p style={styles.profileId}>{profileData.dohId || 'DOH-Generating...'}</p>
            <p style={styles.profileRole}>{profileData.role || 'Role'}</p>
            {profileData.lastLogin && (
              <p style={styles.lastLogin}>
                Last login: {new Date(profileData.lastLogin).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            )}
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
              <span>User Logs</span>
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

export default ProfileOrg;