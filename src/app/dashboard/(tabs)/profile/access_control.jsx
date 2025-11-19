import React, { useState, useEffect } from "react";

const SuccessModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  const styles = {
    overlay: {
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
      fontFamily: "Barlow",
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "32px",
      maxWidth: "400px",
      width: "90%",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    },
    iconContainer: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "20px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#111827",
      textAlign: "center",
      marginBottom: "12px",
    },
    message: {
      fontSize: "14px",
      color: "#6b7280",
      textAlign: "center",
      lineHeight: "1.5",
      marginBottom: "24px",
    },
    buttonContainer: {
      display: "flex",
      gap: "12px",
      justifyContent: "center",
    },
    button: {
      padding: "10px 24px",
      borderRadius: "6px",
      border: "none",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
      fontFamily: "Barlow",
    },
  };

  return (
    <>
      <div 
        style={styles.overlay} 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.iconContainer}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 style={styles.title}>Success!</h3>
          <p style={styles.message}>{message}</p>
          <div style={styles.buttonContainer}>
            <button
              style={{ ...styles.button, backgroundColor: "#22c55e", color: "white" }}
              onClick={onClose}
              onMouseEnter={(e) => e.target.style.opacity = "0.9"}
              onMouseLeave={(e) => e.target.style.opacity = "1"}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const LoaderModal = ({ isOpen }) => {
  if (!isOpen) return null;

  const styles = {
    overlay: {
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
    spinner: {
      width: "48px",
      height: "48px",
      border: "4px solid rgba(255, 255, 255, 0.3)",
      borderTop: "4px solid #22c55e",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.overlay}>
        <div style={styles.spinner}></div>
      </div>
    </>
  );
};

const PermissionsModal = ({ isOpen, onClose, user, onSave, isAdmin }) => {
  const [permissions, setPermissions] = useState({
    "Blood Stock": {
      visibility: true,
    },
    "Released Blood": {
      visibility: true,
    },
    "Non-Conforming": {
      visibility: false,
    },
    "Donor Record": {
      visibility: false,
    },
    Invoice: {
      visibility: true,
    },
    Reports: {
      visibility: true,
    },
    "Recent Activity": {
      visibility: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions);
    }
  }, [user]);

  if (!isOpen) return null;

  const handlePermissionChange = (screen, permission) => {
    if (!isAdmin) return;

    setPermissions((prev) => ({
      ...prev,
      [screen]: {
        ...prev[screen],
        [permission]: !prev[screen][permission],
      },
    }));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      await onSave(user.id, permissions);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const styles = {
    overlay: {
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
      width: "90%",
      maxWidth: "600px",
      maxHeight: "80vh",
      overflow: "auto",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    },
    header: {
      padding: "24px",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#165C3C",
    },
    subtitle: {
      fontSize: "14px",
      color: "#6b7280",
      marginTop: "4px",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#6b7280",
      padding: "0",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: "24px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    thead: {
      backgroundColor: "#f9fafb",
    },
    th: {
      padding: "12px",
      textAlign: "left",
      fontSize: "11px",
      fontWeight: "500",
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: "1px solid #e5e7eb",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #e5e7eb",
      fontSize: "14px",
      verticalAlign: "middle", 
    },
    toggle: {
      position: "relative",
      width: "44px",
      height: "24px",
      backgroundColor: "#d1d5db",
      borderRadius: "12px",
      cursor: isAdmin ? "pointer" : "not-allowed",
      transition: "background-color 0.2s",
      opacity: isAdmin ? 1 : 0.5,
    },
    toggleContainer: { 
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    toggleActive: {
      backgroundColor: "#22c55e",
    },
    toggleThumb: {
      position: "absolute",
      top: "2px",
      left: "2px",
      width: "20px",
      height: "20px",
      backgroundColor: "white",
      borderRadius: "50%",
      transition: "transform 0.2s",
    },
    toggleThumbActive: {
      transform: "translateX(20px)",
    },
    footer: {
      padding: "24px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "center",
      position: "sticky",
      bottom: 0,
      background: "#fff",
      zIndex: 10,
    },
    saveButton: {
      backgroundColor: isAdmin ? "#22c55e" : "#9ca3af",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "10px 24px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: isAdmin && !isSaving ? "pointer" : "not-allowed",
      fontFamily: "Barlow",
      opacity: isAdmin && !isSaving ? 1 : 0.6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "140px",
    },
    restrictedBanner: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "16px",
      fontSize: "14px",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Access Control</div>
            <div style={styles.subtitle}>
              Screen Visibility for {user?.fullName}
            </div>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={styles.content}>
          {!isAdmin && (
            <div style={styles.restrictedBanner}>
              ⚠️ Only administrators can modify permissions
            </div>
          )}

          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>SCREEN NAME</th>
                <th style={{ ...styles.th, textAlign: "center" }}>
                  VISIBILITY
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissions).map(([screen, perms]) => (
                <tr key={screen}>
                  <td style={styles.td}>{screen}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <div style={styles.toggleContainer}>
                      <div
                        style={{
                          ...styles.toggle,
                          ...(perms.visibility ? styles.toggleActive : {}),
                        }}
                        onClick={() =>
                          isAdmin && handlePermissionChange(screen, "visibility")
                        }
                      >
                        <div
                          style={{
                            ...styles.toggleThumb,
                            ...(perms.visibility ? styles.toggleThumbActive : {}),
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.footer}>
          <button
            style={styles.saveButton}
            onClick={handleSave}
            disabled={!isAdmin || isSaving}
            onMouseEnter={(e) => {
              if (isAdmin && !isSaving) e.target.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              if (isAdmin && !isSaving) e.target.style.opacity = "1";
            }}
          >
            {isSaving ? (
              <>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AccessControl = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: ""
  });

  const isAdmin = currentUser?.role === "Admin";

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const verified = await window.electronAPI.getVerifiedUsersWithPermissions();
      setUsers(verified || []);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!isAdmin) {
      alert("Only administrators can change user roles");
      return;
    }

    try {
      const user = users.find((u) => u.id === userId);
      const result = await window.electronAPI.updateUserRole(userId, newRole);

      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setSuccessModal({ 
          isOpen: true, 
          message: `Successfully updated ${user.fullName}'s role to ${newRole}` 
        });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const handleRowClick = (user) => {
    if (!isAdmin) {
      alert("Only administrators can modify permissions");
      return;
    }
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async (userId, permissions) => {
    try {
      const result = await window.electronAPI.saveUserPermissions(userId, permissions);
      
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, permissions } : u))
        );
        
        if (currentUser && currentUser.id === userId) {
          const updatedUser = { ...currentUser, permissions };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          
          window.dispatchEvent(new CustomEvent('userPermissionsUpdated', { 
            detail: { userId, permissions } 
          }));
          
          window.dispatchEvent(new CustomEvent('permissionsChanged', { 
            detail: { userId, permissions } 
          }));
          
        } else {
          window.dispatchEvent(new CustomEvent('userPermissionsUpdated', { 
            detail: { userId, permissions } 
          }));
        }
        
        // Show loader
        setShowLoader(true);
        
        // Wait 300ms then show success modal
        setTimeout(() => {
          setShowLoader(false);
          setSuccessModal({ 
            isOpen: true, 
            message: "Permissions updated successfully!" 
          });
        }, 300);
        
        setTimeout(() => {
          loadUsers();
        }, 300);
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("Failed to save permissions");
    }
  };

  const filterUsers = () => {
    return users.filter((user) => {
      const matchesSearch =
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.dohId?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  };

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "white",
      minHeight: "100vh",
      fontFamily: "Barlow",
      borderRadius: "8px",
    },
    header: { margin: 0 },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "1px",
      marginBottom: "24px",
    },
    searchContainer: {
      position: "relative",
      marginBottom: "20px",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9ca3af",
      width: "16px",
      height: "16px",
    },
    searchInput: {
      paddingLeft: "40px",
      paddingRight: "16px",
      paddingTop: "8px",
      paddingBottom: "8px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      width: "320px",
      fontSize: "14px",
      outline: "none",
      fontFamily: "Barlow",
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    thead: { backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "11px",
      fontWeight: "500",
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    tbody: { backgroundColor: "white" },
    tr: {
      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
      cursor: isAdmin ? "pointer" : "default",
      transition: "background-color 0.2s",
    },
    td: {
      padding: "12px 16px",
      fontSize: "12px",
      color: "#111827",
      fontFamily: "Arial",
      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
    },
    roleSelect: {
      padding: "6px 32px 6px 12px",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      backgroundColor: "#f9fafb",
      fontSize: "12px",
      color: "#374151",
      cursor: isAdmin ? "pointer" : "not-allowed",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 8px center",
      fontFamily: "Arial",
      opacity: isAdmin ? 1 : 0.6,
    },
    actionButton: {
      background: "none",
      border: "none",
      cursor: isAdmin ? "pointer" : "not-allowed",
      padding: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: isAdmin ? 1 : 0.4,
    },
    userIcon: {
      width: "20px",
      height: "20px",
      color: "#9ca3af",
    },
    loader: {
      textAlign: "center",
      padding: "40px",
      fontSize: "16px",
      color: "#6b7280",
    },
    noData: {
      textAlign: "center",
      padding: "40px",
      color: "#9ca3af",
      fontFamily: "Arial",
    },
    adminBadge: {
      display: "inline-block",
      backgroundColor: "#22c55e",
      color: "white",
      fontSize: "10px",
      padding: "2px 8px",
      borderRadius: "4px",
      marginLeft: "8px",
      fontWeight: "500",
    },
    restrictedMessage: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "16px",
      fontSize: "14px",
      textAlign: "center",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>Loading users...</div>
      </div>
    );
  }

  const filteredUsers = filterUsers();

  return (
    <div style={styles.container}>
      <LoaderModal isOpen={showLoader} />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
        message={successModal.message}
      />

      <PermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        user={selectedUser}
        onSave={handleSavePermissions}
        isAdmin={isAdmin}
      />

      <div style={styles.header}>
        <h2 style={styles.title}>
          Access Control
          {isAdmin && <span style={styles.adminBadge}>ADMIN</span>}
        </h2>
      </div>

      {!isAdmin && (
        <div style={styles.restrictedMessage}>
         Only administrators can modify user roles and permissions
        </div>
      )}

      <div style={styles.searchContainer}>
        <svg
          style={styles.searchIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search User"
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>NAME</th>
              <th style={styles.th}>ID NUMBER</th>
              <th style={styles.th}>EMAIL</th>
              <th style={styles.th}>ROLE</th>
              <th style={{ ...styles.th, textAlign: "center" }}>ACTION</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.noData}>
                  No verified users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  style={styles.tr}
                  onMouseEnter={(e) => {
                    if (isAdmin) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                  onClick={() => handleRowClick(user)}
                >
                  <td style={styles.td}>{user.fullName}</td>
                  <td style={styles.td}>{user.dohId}</td>
                  <td style={{ ...styles.td, color: "#3b82f6" }}>
                    {user.email}
                  </td>
                  <td style={styles.td}>
                    <select
                      style={styles.roleSelect}
                      value={user.role}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (isAdmin) {
                          handleRoleChange(user.id, e.target.value);
                        }
                      }}
                      disabled={!isAdmin}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="Inventory Staff">Inventory Staff</option>
                      <option value="Non-Conforming Staff">Non-Conforming Staff</option>
                      <option value="Scheduler">Scheduler</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      style={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(user);
                      }}
                      disabled={!isAdmin}
                      title={
                        isAdmin ? "Edit permissions" : "Admin access required"
                      }
                    >
                      <svg
                        style={styles.userIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccessControl;