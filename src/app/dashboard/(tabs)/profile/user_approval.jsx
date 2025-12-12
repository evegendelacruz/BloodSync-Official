import React, { useState, useEffect } from "react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, icon, type = "warning" }) => {
  if (!isOpen) return null;

  const iconColors = {
    warning: "#f59e0b",
    danger: "#ef4444",
    success: "#22c55e",
    info: "#3b82f6",
  };

  const icons = {
    warning: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={iconColors[type]} strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    danger: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={iconColors[type]} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    success: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={iconColors[type]} strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    info: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={iconColors[type]} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    role: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={iconColors[type]} strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
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
      fontFamily: "Barlow",
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "32px",
      maxWidth: "400px",
      width: "90%",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      animation: "slideDown 0.3s ease-out",
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
    cancelButton: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
    },
    confirmButton: {
      backgroundColor: iconColors[type],
      color: "white",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.iconContainer}>
          {icons[icon] || icons.warning}
        </div>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.buttonContainer}>
          <button
            style={{ ...styles.button, ...styles.cancelButton }}
            onClick={onClose}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#e5e7eb"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#f3f4f6"}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.confirmButton }}
            onClick={onConfirm}
            onMouseEnter={(e) => e.target.style.opacity = "0.9"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

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
      animation: "slideDown 0.3s ease-out",
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
    <div style={styles.overlay} onClick={onClose}>
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
  );
};

const UserApproval = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    icon: "warning",
    type: "warning",
    onConfirm: null,
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const pending = await window.electronAPI.getPendingUsers();
      const verified = await window.electronAPI.getVerifiedUsers();
      
      setPendingUsers(pending || []);
      setVerifiedUsers(verified || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const showConfirmation = (title, message, icon, type, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      icon,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handleRoleChange = async (userId, newRole, userName) => {
    showConfirmation(
      "Change User Role?",
      `Are you sure you want to change ${userName}'s role to ${newRole}? This will update their access permissions.`,
      "role",
      "success",
      async () => {
        try {
          const result = await window.electronAPI.updateUserRole(userId, newRole);
          
          if (result.success) {
            setSuccessModal({ isOpen: true, message: `User role updated to ${newRole} successfully!` });
            loadUsers();
          }
        } catch (error) {
          console.error("Error updating user role:", error);
        }
      }
    );
  };

  const handleAcceptUser = async (userId, userName) => {
    showConfirmation(
      "Accept User?",
      `Are you sure you want to accept ${userName}? They will gain access to the system.`,
      "success",
      "success",
      async () => {
        try {
          const result = await window.electronAPI.verifyUserById(userId);
          
          if (result.success) {
            setSuccessModal({ isOpen: true, message: `${userName} has been successfully verified!` });
            loadUsers();
          }
        } catch (error) {
          console.error("Error accepting user:", error);
        }
      }
    );
  };

  const handleDeclineUser = async (userId, userName) => {
    showConfirmation(
      "Decline User?",
      `Are you sure you want to decline ${userName}? This will permanently remove their registration request.`,
      "danger",
      "danger",
      async () => {
        try {
          await window.electronAPI.rejectUser(userId);
          setSuccessModal({ isOpen: true, message: `${userName} has been rejected successfully` });
          loadUsers();
        } catch (error) {
          console.error("Error declining user:", error);
        }
      }
    );
  };

  const handleRemoveUser = async (userId, userName) => {
    showConfirmation(
      "Remove User Access?",
      `Are you sure you want to remove ${userName}'s access? This will revoke all their permissions and they will need to re-register.`,
      "danger",
      "danger",
      async () => {
        try {
          await window.electronAPI.removeUser(userId);
          setSuccessModal({ isOpen: true, message: `${userName}'s access has been removed successfully` });
          loadUsers();
        } catch (error) {
          console.error("Error removing user:", error);
        }
      }
    );
  };

  const filterUsers = (users) => {
    return users.filter(user => {
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
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginTop: "-10px",
    },
    controlsBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px",
      backgroundColor: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    },
    searchContainer: { position: "relative" },
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
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#165C3C",
      marginBottom: "16px",
      marginTop: "32px",
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      marginBottom: "40px",
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
    tr: { borderBottom: "1px solid #A3A3A3" },
    trEven: { backgroundColor: "#f9fafb" },
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
      cursor: "pointer",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 8px center",
      fontFamily: "Arial",
    },
    actionButtons: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      justifyContent: "center",
    },
    iconButton: {
      width: "15px",
      height: "15px",
      borderRadius: "50%",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      transition: "all 0.2s",
      padding: 0,
    },
    acceptButton: {
      backgroundColor: "#22c55e",
      color: "white",
    },
    declineButton: {
      backgroundColor: "#ef4444",
      color: "white",
    },
    removeButton: {
      backgroundColor: "transparent",
      color: "#9ca3af",
      border: "none",
      cursor: "pointer",
      padding: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
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
      fontFamily: 'Arial',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}>Loading users...</div>
      </div>
    );
  }

  const filteredPendingUsers = filterUsers(pendingUsers);
  const filteredVerifiedUsers = filterUsers(verifiedUsers);

  return (
    <div style={styles.container}>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        icon={confirmModal.icon}
        type={confirmModal.type}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
        message={successModal.message}
      />

      <div style={styles.header}>
        <h2 style={styles.title}>User Approval</h2>
        <p style={styles.subtitle}>Manage User Verification</p>
      </div>

      <div style={styles.controlsBar}>
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
      </div>

      <h2 style={styles.sectionTitle}>Pending Verification</h2>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>NAME</th>
              <th style={styles.th}>ID NUMBER</th>
              <th style={styles.th}>EMAIL</th>
              <th style={styles.th}>ROLE</th>
              <th style={styles.th}>DATE</th>
              <th style={{ ...styles.th, textAlign: "center" }}>ACTION</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {filteredPendingUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.noData}>
                  No pending user verification yet
                </td>
              </tr>
            ) : (
              filteredPendingUsers.map((user, index) => (
                <tr
                  key={user.id}
                  style={{
                    ...(index % 2 === 1 ? styles.trEven : {}),
                  }}
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
                      onChange={(e) => handleRoleChange(user.id, e.target.value, user.fullName)}
                    >
                      <option value="Inventory Staff">Inventory Staff</option>
                      <option value="Non-Conforming Staff">Non-Conforming Staff</option>
                      <option value="Scheduler">Scheduler</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td style={styles.td}>{user.createdAt}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleAcceptUser(user.id, user.fullName)}
                        style={{ ...styles.iconButton, ...styles.acceptButton }}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#16a34a")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = "#22c55e")
                        }
                        title="Accept"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeclineUser(user.id, user.fullName)}
                        style={{
                          ...styles.iconButton,
                          ...styles.declineButton,
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#dc2626")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor = "#ef4444")
                        }
                        title="Decline"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={styles.sectionTitle}>Verified User</h2>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>NAME</th>
              <th style={styles.th}>ID NUMBER</th>
              <th style={styles.th}>EMAIL</th>
              <th style={styles.th}>ROLE</th>
              <th style={styles.th}>DATE</th>
              <th style={{ ...styles.th, textAlign: "center" }}>ACTION</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {filteredVerifiedUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.noData}>
                  No verified users yet
                </td>
              </tr>
            ) : (
              filteredVerifiedUsers.map((user, index) => (
                <tr
                  key={user.id}
                  style={{
                    ...(index % 2 === 1 ? styles.trEven : {}),
                  }}
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
                      onChange={(e) => handleRoleChange(user.id, e.target.value, user.fullName)}
                    >
                      <option value="Inventory Staff">Inventory Staff</option>
                      <option value="Non-Conforming Staff">Non-Conforming Staff</option>
                      <option value="Scheduler">Scheduler</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td style={styles.td}>
                    {user.verifiedAt || user.createdAt}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      onClick={() => handleRemoveUser(user.id, user.fullName)}
                      style={styles.removeButton}
                      onMouseEnter={(e) => {
                        e.target.style.color = "#ef4444";
                        e.target.style.backgroundColor = "#fee2e2";
                        e.target.style.borderRadius = "4px";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = "#9ca3af";
                        e.target.style.backgroundColor = "transparent";
                      }}
                      title="Remove user access"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="17" y1="8" x2="22" y2="13" />
                        <line x1="22" y1="8" x2="17" y2="13" />
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

export default UserApproval;