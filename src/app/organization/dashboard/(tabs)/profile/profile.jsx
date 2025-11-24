import React, { useState, useEffect } from "react";
import {
  User,
  Clock,
  Settings,
  Camera,
  Upload,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  UserCheck,
  X,
  CheckCircle,
} from "lucide-react";
import ProfileActivity from "../profile/profile_activity";
import ProfileSettings from "../profile/profile_settings";

// CRITICAL FIX: Move ProfileInformation OUTSIDE ProfileComponent
const ProfileInformation = ({
  profileData,
  handleInputChange,
  isEditing,
  handleEditProfile,
  handleSaveChanges,
  handleCancel,
  isSaving,
  styles,
}) => {
  const handleFocus = (e) => {
    if (isEditing) {
      e.target.style.borderColor = "#059669";
      e.target.style.boxShadow = "0 0 0 2px rgba(5, 150, 105, 0.2)";
    }
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = "#e5e7eb";
    e.target.style.boxShadow = "none";
  };

  return (
    <>
      <style>
        {`
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
        `}
      </style>
      <div style={styles.contentCard}>
        <h2 style={styles.contentTitle}>Profile Information</h2>

        <div style={styles.formRow3} className="form-row-3">
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={profileData.fullName}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Role</label>
            <input
              type="text"
              value={profileData.role}
              disabled={true}
              style={{
                ...styles.input,
                ...styles.inputDisabled,
              }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Gender</label>
            <select
              name="gender"
              value={profileData.gender}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                ...styles.select,
                ...(isEditing ? {} : styles.selectDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div style={styles.formRow3} className="form-row-3">
          <div style={styles.formGroup}>
            <label style={styles.label}>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={profileData.dateOfBirth}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nationality</label>
            <input
              type="text"
              name="nationality"
              value={profileData.nationality}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Civil Status</label>
            <select
              name="civilStatus"
              value={profileData.civilStatus}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                ...styles.select,
                ...(isEditing ? {} : styles.selectDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="">Select Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>
        </div>

        <div style={styles.formRow2} className="form-row-2">
          <div style={styles.formGroup}>
            <label style={styles.label}>Barangay</label>
            <input
              type="text"
              name="barangay"
              value={profileData.barangay}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={profileData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers and limit to 11 digits
                if (/^\d{0,11}$/.test(value)) {
                  handleInputChange(e);
                }
              }}
              disabled={!isEditing}
              style={{
                ...styles.input,
                ...(isEditing ? {} : styles.inputDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="09XXXXXXXXX"
              maxLength={11}
            />
          </div>
        </div>

        <div style={styles.formRow2} className="form-row-2">
          <div style={styles.formGroup}>
            <label style={styles.label}>Blood Type</label>
            <select
              name="bloodType"
              value={profileData.bloodType}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                ...styles.select,
                ...(isEditing ? {} : styles.selectDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="">Select Blood Type</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Rh Factor</label>
            <select
              name="rhFactor"
              value={profileData.rhFactor}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                ...styles.select,
                ...(isEditing ? {} : styles.selectDisabled),
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="">Select Rh Factor</option>
              <option value="+">Positive (+)</option>
              <option value="-">Negative (-)</option>
            </select>
          </div>
        </div>

        <div style={styles.buttonContainer}>
          {!isEditing ? (
            <button
              onClick={handleEditProfile}
              style={styles.editButton}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#047857")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#059669")}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                style={{
                  ...styles.saveButton,
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) =>
                  !isSaving && (e.target.style.backgroundColor = "#16a34a")
                }
                onMouseLeave={(e) =>
                  !isSaving && (e.target.style.backgroundColor = "#22c55e")
                }
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                style={{
                  ...styles.cancelButton,
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) =>
                  !isSaving && (e.target.style.backgroundColor = "#6b7280")
                }
                onMouseLeave={(e) =>
                  !isSaving && (e.target.style.backgroundColor = "#9ca3af")
                }
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const ProfileComponentOrg = () => {
  const dbService = window.electronAPI;
  const [activeTab, setActiveTab] = useState("information");
  const [showPhotoDropdown, setShowPhotoDropdown] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    role: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    civilStatus: "",
    barangay: "",
    bloodType: "",
    rhFactor: "",
    userId: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log("User from localStorage:", user);
          setCurrentUser(user);

          // Fetch fresh data directly from database
          if (user.id) {
            console.log("Fetching user profile for ID:", user.id);
            const dbUser = await dbService.getUserProfileById(user.id);
            console.log("DB User data:", dbUser);

            if (dbUser) {
              setProfileImage(dbUser.profileImage);
              setProfileData({
                fullName: dbUser.fullName || "",
                role: dbUser.role || "",
                email: dbUser.email || "",
                userId: dbUser.dohId || "",
                gender: dbUser.gender || "",
                dateOfBirth: dbUser.dateOfBirth || "",
                nationality: dbUser.nationality || "",
                civilStatus: dbUser.civilStatus || "",
                barangay: dbUser.barangay || "",
                phoneNumber: dbUser.phoneNumber || "",
                bloodType: dbUser.bloodType || "",
                rhFactor: dbUser.rhFactor || "",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading current user:", error);
      }
    };

    loadCurrentUser();
  }, [dbService]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);

    try {
      console.log("Saving profile data:", profileData);
      console.log("Current user ID:", currentUser.id);

      const result = await dbService.updateUserProfile(currentUser.id, {
        ...profileData,
        profileImage: profileImage,
      });

      console.log("Update result:", result);

      if (result.success) {
        // Update localStorage with new data
        const updatedUser = {
          ...currentUser,
          fullName: profileData.fullName,
          gender: profileData.gender,
          dateOfBirth: profileData.dateOfBirth,
          nationality: profileData.nationality,
          civilStatus: profileData.civilStatus,
          barangay: profileData.barangay,
          phoneNumber: profileData.phoneNumber,
          bloodType: profileData.bloodType,
          rhFactor: profileData.rhFactor,
          profileImage: profileImage,
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        setSuccessMessage("Profile updated successfully!");
        setShowSuccessModal(true);
        setIsEditing(false);
      } else {
        alert("Failed to save changes. Please try again.");
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) {
      setProfileData({
        fullName: currentUser.fullName || "",
        role: currentUser.role || "",
        email: currentUser.email || "",
        userId: currentUser.dohId || "",
        gender: currentUser.gender || "",
        dateOfBirth: currentUser.dateOfBirth || "",
        nationality: currentUser.nationality || "",
        civilStatus: currentUser.civilStatus || "",
        barangay: currentUser.barangay || "",
        phoneNumber: currentUser.phoneNumber || "",
        bloodType: currentUser.bloodType || "",
        rhFactor: currentUser.rhFactor || "",
      });
      if (currentUser.profileImage) {
        setProfileImage(currentUser.profileImage);
      }
    }
    setIsEditing(false);
  };

  const handleUploadPhoto = () => {
    console.log('=== UPLOAD PHOTO CLICKED ===');
    console.log('Current user:', currentUser);
    
    setShowPhotoDropdown(false);
    
    console.log('Creating input element...');
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    console.log('Input element created:', input);
    console.log('Input type:', input.type);
    console.log('Input accept:', input.accept);
  
    input.onchange = async (e) => {
      console.log('=== FILE SELECTED ===');
      console.log('Event:', e);
      console.log('Files:', e.target.files);
      const file = e.target.files?.[0];
      
      if (!file) {
        console.log('No file selected - user cancelled');
        return;
      }
  
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
  
      if (file.size > 5 * 1024 * 1024) {
        alert("File must be less than 5MB");
        return;
      }
  
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64Image = event.target.result;
        console.log('Image converted to base64, length:', base64Image.length);
  
        try {
          console.log('Updating profile image for user:', currentUser.id);
          const result = await dbService.updateUserProfileImage(currentUser.id, base64Image);
          console.log('Update image result:', result);
  
          if (result.success) {
            setProfileImage(base64Image);
            const updatedUser = { ...currentUser, profileImage: base64Image };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            setSuccessMessage("Profile photo uploaded successfully!");
            setShowSuccessModal(true);
          } else {
            alert("Failed to upload photo. Please try again.");
          }
        } catch (error) {
          console.error("Error uploading photo:", error);
          alert("Failed to upload photo: " + error.message);
        }
      };
  
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        alert("Failed to read image file");
      };
  
      reader.readAsDataURL(file);
    };
  
    console.log('About to click input...');
    
    // Try multiple approaches
    try {
      input.click();
      console.log('✓ Input clicked successfully');
    } catch (error) {
      console.error('✗ Error clicking input:', error);
    }
    
    console.log('=== END UPLOAD PHOTO FUNCTION ===');
  };

  const handleRemovePhoto = async () => {
    setShowPhotoDropdown(false); // Close dropdown first

    try {
      const result = await dbService.updateUserProfileImage(
        currentUser.id,
        null
      );

      if (result.success) {
        setProfileImage(null);

        const updatedUser = { ...currentUser, profileImage: null };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        setSuccessMessage("Profile photo removed successfully!");
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      alert("Failed to remove photo. Please try again.");
    }
  };

  const handleUserManagementClick = () => {
    setIsUserManagementOpen(!isUserManagementOpen);
  };

  const handleSubMenuClick = (tab) => {
    setActiveTab(tab);
    if (!isUserManagementOpen) {
      setIsUserManagementOpen(true);
    }
  };

  const styles = {
    mainWrapper: {
      maxWidth: "1400px",
      margin: "0 auto",
      display: "flex",
      gap: "24px",
      alignItems: "flex-start",
      fontFamily: "Barlow",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "-7px",
      fontFamily: "Barlow",
    },
    sidebar: {
      width: "250px",
      minWidth: "250px",
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "32px 24px",
      height: "fit-content",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      position: "sticky",
    },
    profileSection: {
      textAlign: "center",
      marginBottom: "28px",
    },
    profilePictureContainer: {
      position: "relative",
      marginBottom: "24px",
      display: "flex",
      justifyContent: "center",
      width: "120px",
      height: "120px",
      margin: "0 auto 24px auto",
    },
    profilePicture: {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      overflow: "hidden",
      border: "2px solid #059669",
      backgroundColor: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    profileImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    profilePlaceholder: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "48px",
      fontWeight: "bold",
      color: "#059669",
      backgroundColor: "#f0fdf4",
    },
    cameraButtonContainer: {
      position: "absolute",
      bottom: "0",
      right: "0",
      zIndex: 10,
    },
    cameraButton: {
      backgroundColor: "#059669",
      color: "white",
      padding: "8px",
      borderRadius: "50%",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "28px",
      height: "28px",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      right: "0",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      border: "1px solid #e5e7eb",
      minWidth: "160px",
      zIndex: 1000, 
      marginTop: "4px",
    },
    dropdownItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 16px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#374151",
      transition: "background-color 0.2s",
      border: "none",
      backgroundColor: "transparent",
      width: "100%",
      textAlign: "left",
    },
    dropdownItemHover: {
      backgroundColor: "#f3f4f6",
    },
    profileName: {
      fontSize: "15px",
      fontWeight: "700",
      color: "#165C3C",
      marginBottom: "8px",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    profileId: {
      fontSize: "12px",
      color: "#6b7280",
      marginBottom: "4px",
      fontWeight: "500",
    },
    profileRole: {
      fontSize: "12px",
      color: "#6b7280",
      fontWeight: "500",
      textTransform: "uppercase",
    },
    navigation: {
      display: "flex",
      flexDirection: "column",
      gap: "0",
      margin: "0 -24px",
    },
    navButton: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "16px 24px",
      textAlign: "left",
      border: "none",
      backgroundColor: "transparent",
      color: "#6b7280",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontWeight: "500",
      fontSize: "14px",
      borderRadius: "0",
      borderRight: "none",
      borderLeft: "4px solid transparent",
      boxSizing: "border-box",
    },
    navButtonActive: {
      backgroundColor: "rgba(147, 194, 66, 0.2)",
      color: "#165C3C",
      borderLeft: "4px solid #93C242",
    },
    navButtonHover: {
      backgroundColor: "rgba(147, 194, 66, 0.2)",
      color: "#374151",
    },
    navButtonParentActive: {
      backgroundColor: "rgba(147, 194, 66, 0.3)",
      color: "#165C3C",
      borderLeft: "4px solid #93C242",
    },
    subMenuContainer: {
      overflow: "hidden",
      transition: "max-height 0.3s ease-in-out",
      backgroundColor: "rgba(147, 194, 66, 0.1)",
    },
    subMenuItem: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 24px 12px 52px",
      textAlign: "left",
      border: "none",
      backgroundColor: "transparent",
      color: "#165C3C",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontWeight: "500",
      fontSize: "14px",
      borderLeft: "4px solid transparent",
      boxSizing: "border-box",
    },
    subMenuItemActive: {
      backgroundColor: "#93C242",
      color: "white",
      borderLeft: "4px solid #7ba935",
    },
    subMenuItemHover: {
      backgroundColor: "rgba(147, 194, 66, 0.5)",
      color: "#165C3C",
    },
    chevronIcon: {
      marginLeft: "auto",
      transition: "transform 0.3s ease",
    },
    chevronIconRotated: {
      transform: "rotate(90deg)",
    },
    contentArea: {
      flex: "1",
      minWidth: "0",
    },
    contentCard: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "32px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    },
    contentTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "-7px",
      fontFamily: "Barlow",
      marginBottom: "24px",
    },
    formRow3: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "24px",
      marginBottom: "24px",
    },
    formRow2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
      marginBottom: "24px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "8px",
    },
    input: {
      padding: "12px 16px",
      border: "2px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      transition: "all 0.2s",
      backgroundColor: "white",
      fontFamily: "inherit",
      width: "100%",
      boxSizing: "border-box",
    },
    inputDisabled: {
      backgroundColor: "#f9fafb",
      cursor: "not-allowed",
      color: "#6b7280",
    },
    select: {
      padding: "12px 16px",
      border: "2px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      transition: "all 0.2s",
      backgroundColor: "white",
      fontFamily: "inherit",
      width: "100%",
      boxSizing: "border-box",
      cursor: "text",
    },
    selectDisabled: {
      backgroundColor: "#f9fafb",
      color: "#6b7280",
    },
    buttonContainer: {
      display: "flex",
      gap: "16px",
      marginTop: "32px",
      flexWrap: "wrap",
    },
    editButton: {
      backgroundColor: "#059669",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background-color 0.2s",
    },
    saveButton: {
      backgroundColor: "#22c55e",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background-color 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    cancelButton: {
      backgroundColor: "#9ca3af",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background-color 0.2s",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999, 
      backgroundColor: "transparent",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "32px",
      maxWidth: "400px",
      width: "90%",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    },
    modalContent: {
      textAlign: "center",
    },
    modalIcon: {
      width: "64px",
      height: "64px",
      margin: "0 auto 16px",
      color: "#22c55e",
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#165C3C",
      marginBottom: "8px",
    },
    modalMessage: {
      fontSize: "14px",
      color: "#6b7280",
      marginBottom: "24px",
    },
    modalButton: {
      backgroundColor: "#059669",
      color: "white",
      padding: "10px 24px",
      borderRadius: "8px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background-color 0.2s",
    },
  };

  const renderContent = () => {
    switch (activeTab) {
      case "information":
        return (
          <ProfileInformation
            profileData={profileData}
            handleInputChange={handleInputChange}
            isEditing={isEditing}
            handleEditProfile={handleEditProfile}
            handleSaveChanges={handleSaveChanges}
            handleCancel={handleCancel}
            isSaving={isSaving}
            styles={styles}
          />
        );
      case "activity":
        return <ProfileActivity userId={currentUser?.id} />;
      case "settings":
        return (
          <ProfileSettings
            profileData={profileData}
            handleInputChange={handleInputChange}
            handleSaveChanges={handleSaveChanges}
            handleCancel={handleCancel}
          />
        );
      default:
        return (
          <ProfileInformation
            profileData={profileData}
            handleInputChange={handleInputChange}
            isEditing={isEditing}
            handleEditProfile={handleEditProfile}
            handleSaveChanges={handleSaveChanges}
            handleCancel={handleCancel}
            isSaving={isSaving}
            styles={styles}
          />
        );
    }
  };

  const isUserManagementActive =
    activeTab === "user-approval" || activeTab === "access-control";
  const isAdmin = currentUser?.role === "Admin";

  return (
    <div style={styles.mainWrapper}>
      {showPhotoDropdown && (
        <div
          style={{
            ...styles.overlay,
            pointerEvents: 'none' // Don't capture clicks
          }}
          onClick={() => setShowPhotoDropdown(false)}
        />
      )}

      {showSuccessModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowSuccessModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalContent}>
              <CheckCircle style={styles.modalIcon} />
              <h3 style={styles.modalTitle}>Success!</h3>
              <p style={styles.modalMessage}>{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={styles.modalButton}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#047857")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#059669")
                }
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.sidebar}>
        <h2 style={styles.title}>Profile</h2>
        <div style={styles.profileSection}>
          <div style={styles.profilePictureContainer}>
            <div style={styles.profilePicture}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  style={styles.profileImage}
                />
              ) : (
                <div style={styles.profilePlaceholder}>
                  {currentUser?.fullName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <div style={styles.cameraButtonContainer}>
              <button
                onClick={() => setShowPhotoDropdown(!showPhotoDropdown)}
                style={styles.cameraButton}
                title="Change Profile Picture"
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                <Camera size={14} />
              </button>

              {showPhotoDropdown && (
                <div
                  style={styles.dropdown}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    style={styles.dropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadPhoto();
                    }}
                    onMouseEnter={(e) =>
                      Object.assign(e.target.style, styles.dropdownItemHover)
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    <Upload size={16} />
                    Upload Photo
                  </button>
                  <button
                    style={styles.dropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto();
                    }}
                    onMouseEnter={(e) =>
                      Object.assign(e.target.style, styles.dropdownItemHover)
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    <Trash2 size={16} />
                    Remove Photo
                  </button>
                </div>
              )}
            </div>
          </div>

          <h3 style={styles.profileName}>
            {currentUser?.fullName || "LOADING..."}
          </h3>
          <p style={styles.profileId}>{currentUser?.dohId || "DOH000000"}</p>
          <p style={styles.profileRole}>{currentUser?.role || "Loading..."}</p>
        </div>

        <nav style={styles.navigation}>
          <button
            onClick={() => setActiveTab("information")}
            style={{
              ...styles.navButton,
              ...(activeTab === "information" ? styles.navButtonActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "information") {
                Object.assign(e.target.style, styles.navButtonHover);
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "information") {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#6b7280";
              }
            }}
          >
            <User size={18} />
            <span>Profile Information</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            style={{
              ...styles.navButton,
              ...(activeTab === "activity" ? styles.navButtonActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "activity") {
                Object.assign(e.target.style, styles.navButtonHover);
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "activity") {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#6b7280";
              }
            }}
          >
            <Clock size={18} />
            <span>User Log</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            style={{
              ...styles.navButton,
              ...(activeTab === "settings" ? styles.navButtonActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== "settings") {
                Object.assign(e.target.style, styles.navButtonHover);
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== "settings") {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#6b7280";
              }
            }}
          >
            <Settings size={18} />
            <span>Account Settings</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={handleUserManagementClick}
                style={{
                  ...styles.navButton,
                  ...(isUserManagementActive
                    ? styles.navButtonParentActive
                    : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isUserManagementActive) {
                    Object.assign(e.target.style, styles.navButtonHover);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUserManagementActive) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#6b7280";
                  }
                }}
              >
                <Users size={18} />
                <span>User Management</span>
                <ChevronRight
                  size={16}
                  style={{
                    ...styles.chevronIcon,
                    ...(isUserManagementOpen ? styles.chevronIconRotated : {}),
                  }}
                />
              </button>

              <div
                style={{
                  ...styles.subMenuContainer,
                  maxHeight: isUserManagementOpen ? "200px" : "0",
                }}
              >
                <button
                  onClick={() => handleSubMenuClick("access-control")}
                  style={{
                    ...styles.subMenuItem,
                    ...(activeTab === "access-control"
                      ? styles.subMenuItemActive
                      : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "access-control") {
                      Object.assign(e.target.style, styles.subMenuItemHover);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "access-control") {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#165C3C";
                    }
                  }}
                >
                  <Shield size={16} />
                  <span>Access Control</span>
                </button>

                <button
                  onClick={() => handleSubMenuClick("user-approval")}
                  style={{
                    ...styles.subMenuItem,
                    ...(activeTab === "user-approval"
                      ? styles.subMenuItemActive
                      : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "user-approval") {
                      Object.assign(e.target.style, styles.subMenuItemHover);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "user-approval") {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#165C3C";
                    }
                  }}
                >
                  <UserCheck size={16} />
                  <span>User Approval</span>
                </button>
              </div>
            </>
          )}
        </nav>
      </div>

      <div style={styles.contentArea}>{renderContent()}</div>
    </div>
  );
};

export default ProfileComponentOrg;
