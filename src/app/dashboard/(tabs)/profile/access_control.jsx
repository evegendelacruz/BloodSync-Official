import React, { useState, useEffect } from "react";

const PermissionsModal = ({ isOpen, onClose, user, onSave, isAdmin }) => {
  const [permissions, setPermissions] = useState({
    "Blood Stock": {
      view: true,
      create: true,
      edit: true,
      delete: true,
      visibility: true,
    },
    "Released Blood": {
      view: true,
      create: false,
      edit: true,
      delete: true,
      visibility: true,
    },
    "Non-Conforming": {
      view: false,
      create: false,
      edit: false,
      delete: false,
      visibility: false,
    },
    "Donor Record": {
      view: false,
      create: false,
      edit: false,
      delete: false,
      visibility: false,
    },
    Invoice: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      visibility: true,
    },
    Reports: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      visibility: true,
    },
    "Recent Activity": {
      view: true,
      create: false,
      edit: false,
      delete: false,
      visibility: true,
    },
  });

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

  const handleSave = () => {
    if (!isAdmin) return;
    onSave(user.id, permissions);
    onClose();
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
      maxWidth: "900px",
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
    },
    checkbox: {
      width: "20px",
      height: "20px",
      cursor: "pointer",
      appearance: "none",
      border: "2px solid #d1d5db",
      borderRadius: "4px",
      backgroundColor: "white",
      transition: "all 0.2s",
    },
    checkboxChecked: {
      backgroundColor: "#22c55e",
      borderColor: "#22c55e",
    },
    checkboxDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
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
      cursor: isAdmin ? "pointer" : "not-allowed",
      fontFamily: "Barlow",
      opacity: isAdmin ? 1 : 0.6,
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
              Roles and Permissions
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
                <th style={styles.th}>SCREEN</th>
                <th style={{ ...styles.th, textAlign: "center" }}>VIEW</th>
                <th style={{ ...styles.th, textAlign: "center" }}>CREATE</th>
                <th style={{ ...styles.th, textAlign: "center" }}>EDIT</th>
                <th style={{ ...styles.th, textAlign: "center" }}>DELETE</th>
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
                    <input
                      type="checkbox"
                      style={{
                        ...styles.checkbox,
                        ...(perms.view ? styles.checkboxChecked : {}),
                        ...(!isAdmin || !perms.visibility ? styles.checkboxDisabled : {}),
                      }}
                      checked={perms.view}
                      onChange={() => handlePermissionChange(screen, "view")}
                      disabled={!isAdmin || !perms.visibility}
                    />
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      style={{
                        ...styles.checkbox,
                        ...(perms.create ? styles.checkboxChecked : {}),
                        ...(!isAdmin || !perms.visibility ? styles.checkboxDisabled : {}),
                      }}
                      checked={perms.create}
                      onChange={() => handlePermissionChange(screen, "create")}
                      disabled={!isAdmin || !perms.visibility}
                    />
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      style={{
                        ...styles.checkbox,
                        ...(perms.edit ? styles.checkboxChecked : {}),
                        ...(!isAdmin || !perms.visibility ? styles.checkboxDisabled : {}),
                      }}
                      checked={perms.edit}
                      onChange={() => handlePermissionChange(screen, "edit")}
                      disabled={!isAdmin || !perms.visibility}
                    />
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      style={{
                        ...styles.checkbox,
                        ...(perms.delete ? styles.checkboxChecked : {}),
                        ...(!isAdmin || !perms.visibility ? styles.checkboxDisabled : {}),
                      }}
                      checked={perms.delete}
                      onChange={() => handlePermissionChange(screen, "delete")}
                      disabled={!isAdmin || !perms.visibility}
                    />
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
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
            disabled={!isAdmin}
            onMouseEnter={(e) => {
              if (isAdmin) e.target.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              if (isAdmin) e.target.style.opacity = "1";
            }}
          >
            Save Changes
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

  const isAdmin = currentUser?.role === "Admin";

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const verified = await window.electronAPI.getVerifiedUsers();
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
        alert(`Successfully updated ${user.fullName}'s role to ${newRole}`);
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
    console.log("Saving permissions for user:", userId, permissions);
    alert("Permissions updated successfully!");
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