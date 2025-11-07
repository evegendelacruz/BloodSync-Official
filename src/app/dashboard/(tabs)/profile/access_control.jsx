import React, { useState, useEffect } from 'react';
import { Search, UserX, RefreshCw, Trash2, X } from 'lucide-react';

const AccessControl = () => {
  const [rbcUsers, setRbcUsers] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentView, setCurrentView] = useState('rbc'); // 'rbc' or 'org'
  const [currentUser, setCurrentUser] = useState(null);
  const [hoverStates, setHoverStates] = useState({
    close: false,
    delete: false
  });

  useEffect(() => {
    // Get current logged-in user
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Load RBC users
      const activeRbcUsers = await window.electronAPI.getAllActiveUsers();
      setRbcUsers(activeRbcUsers.map(u => ({ ...u, selected: false })));

      // Load Organization users
      const activeOrgUsers = await window.electronAPI.getAllActiveOrgUsers();
      setOrgUsers(activeOrgUsers.map(u => ({ ...u, selected: false })));
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole, isOrg = false) => {
    try {
      if (isOrg) {
        await window.electronAPI.updateOrgUserRole(userId, newRole);
      } else {
        await window.electronAPI.updateUserRole(userId, newRole);
      }
      setSuccessMessage('Role updated successfully!');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userName, isOrg = false) => {
    const confirmed = window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`);

    if (confirmed) {
      try {
        if (isOrg) {
          await window.electronAPI.deleteOrgUser(userId);
        } else {
          await window.electronAPI.deleteUser(userId);
        }
        setSuccessMessage('User deleted successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleDeleteSelected = async () => {
    const currentUsers = getCurrentUsers();
    const selectedUsers = currentUsers.filter(u => u.selected);

    if (selectedUsers.length === 0) {
      alert('Please select at least one user to delete');
      return;
    }

    // Check if current user is in selection
    const hasCurrentUser = selectedUsers.some(u => isCurrentUser(u));
    if (hasCurrentUser) {
      alert('Cannot delete your own account');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const isOrg = currentView === 'org';

      // Delete all selected users
      for (const user of selectedUsers) {
        if (isOrg) {
          await window.electronAPI.deleteOrgUser(user.user_id);
        } else {
          await window.electronAPI.deleteUser(user.user_id);
        }
      }

      setSuccessMessage(`${selectedUsers.length} user(s) deleted successfully!`);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
      await loadUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('Failed to delete users');
    }
  };

  const toggleRowSelection = (userId) => {
    if (currentView === 'rbc') {
      setRbcUsers(prev =>
        prev.map(user =>
          user.user_id === userId ? { ...user, selected: !user.selected } : user
        )
      );
    } else {
      setOrgUsers(prev =>
        prev.map(user =>
          user.user_id === userId ? { ...user, selected: !user.selected } : user
        )
      );
    }
  };

  const toggleAllSelection = () => {
    const allSelected = filteredUsers.every(u => u.selected);

    if (currentView === 'rbc') {
      setRbcUsers(prev =>
        prev.map(user => {
          if (filteredUsers.find(f => f.user_id === user.user_id)) {
            return { ...user, selected: !allSelected };
          }
          return user;
        })
      );
    } else {
      setOrgUsers(prev =>
        prev.map(user => {
          if (filteredUsers.find(f => f.user_id === user.user_id)) {
            return { ...user, selected: !allSelected };
          }
          return user;
        })
      );
    }
  };

  const clearSelection = () => {
    if (currentView === 'rbc') {
      setRbcUsers(prev => prev.map(user => ({ ...user, selected: false })));
    } else {
      setOrgUsers(prev => prev.map(user => ({ ...user, selected: false })));
    }
  };

  const handleMouseEnter = (button) => {
    setHoverStates(prev => ({ ...prev, [button]: true }));
  };

  const handleMouseLeave = (button) => {
    setHoverStates(prev => ({ ...prev, [button]: false }));
  };

  const getCurrentUsers = () => {
    return currentView === 'rbc' ? rbcUsers : orgUsers;
  };

  const filteredUsers = getCurrentUsers().filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.doh_id && user.doh_id.toString().includes(searchTerm))
  );

  const selectedCount = getCurrentUsers().filter(u => u.selected).length;

  const isCurrentUser = (user) => {
    if (!currentUser) return false;
    return currentUser.email === user.email;
  };

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      fontFamily: 'Barlow'
    },
    headerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#165C3C',
      marginBottom: 0,
      fontFamily: 'Barlow'
    },
    switchButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: '#165C3C',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'Barlow'
    },
    tableTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '16px',
      fontFamily: 'Barlow'
    },
    searchContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
      marginTop: '8px'
    },
    searchWrapper: {
      position: 'relative',
      flex: 1,
      maxWidth: '400px'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280'
    },
    searchInput: {
      width: '100%',
      padding: '12px 12px 12px 40px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'Barlow'
    },
    actionBar: {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      background: '#4a5568',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
      zIndex: 1000,
      color: 'white',
      overflow: 'hidden'
    },
    closeButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 16px',
      backgroundColor: '#4a5568',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      borderRight: '1px solid #2d3748',
      transition: 'background-color 0.2s ease'
    },
    closeButtonHover: {
      backgroundColor: '#3a4556'
    },
    counterSection: {
      padding: '12px 24px',
      backgroundColor: '#4a5568',
      borderRight: '1px solid #2d3748'
    },
    counterText: {
      fontSize: '14px',
      fontWeight: '500',
      color: 'white',
      margin: 0,
      fontFamily: 'Barlow'
    },
    deleteButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: '#4a5568',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontFamily: 'Barlow',
      transition: 'background-color 0.2s ease'
    },
    deleteButtonHover: {
      backgroundColor: '#3a4556'
    },
    tableContainer: {
      overflowX: 'auto',
      border: '1px solid #e5e7eb',
      borderRadius: '8px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '16px',
      textAlign: 'left',
      backgroundColor: '#f9fafb',
      fontWeight: '600',
      fontSize: '14px',
      color: '#374151',
      borderBottom: '2px solid #e5e7eb',
      fontFamily: 'Barlow'
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px',
      color: '#374151',
      fontFamily: 'Barlow'
    },
    trSelected: {
      backgroundColor: '#f0fdf4'
    },
    checkbox: {
      width: '16px',
      height: '16px',
      cursor: 'pointer'
    },
    roleSelect: {
      padding: '8px 12px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      cursor: 'pointer',
      fontFamily: 'Barlow',
      backgroundColor: 'white'
    },
    roleSelectDisabled: {
      padding: '8px 12px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      cursor: 'not-allowed',
      fontFamily: 'Barlow',
      backgroundColor: '#f3f4f6',
      color: '#9ca3af'
    },
    actionButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#ef4444',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    actionButtonDisabled: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#d1d5db',
      cursor: 'not-allowed',
      padding: '8px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: '#6b7280',
      fontSize: '14px',
      fontFamily: 'Barlow'
    },
    successModal: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '24px 32px',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    successIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#10b981',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold'
    },
    successText: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#165C3C',
      fontFamily: 'Barlow'
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Access Control</h2>
        <div style={styles.emptyState}>Loading users...</div>
      </div>
    );
  }

  const tableTitle = currentView === 'rbc'
    ? 'Registered Regional Blood Center Accounts'
    : 'Registered Partnered Organization Accounts';

  return (
    <>
      <div style={styles.container}>
        <div style={styles.headerContainer}>
          <h2 style={styles.title}>Access Control</h2>
          <button
            onClick={() => setCurrentView(currentView === 'rbc' ? 'org' : 'rbc')}
            style={styles.switchButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#124a2f';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(22, 92, 60, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#165C3C';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <RefreshCw size={16} />
            <span>Switch</span>
          </button>
        </div>

        <div style={styles.tableTitle}>{tableTitle}</div>

        {/* Search Bar and Delete Button */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
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

        {/* Users Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '4%' }}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={filteredUsers.length > 0 && filteredUsers.every(u => u.selected)}
                    onChange={toggleAllSelection}
                  />
                </th>
                <th style={styles.th}>NAME</th>
                <th style={styles.th}>DOH ID</th>
                <th style={styles.th}>EMAIL</th>
                <th style={styles.th}>ROLE</th>
                <th style={styles.th}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyState}>
                    No active users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentUserRow = isCurrentUser(user);
                  return (
                    <tr
                      key={user.user_id}
                      style={user.selected ? styles.trSelected : {}}
                    >
                      <td style={styles.td}>
                        <input
                          type="checkbox"
                          style={styles.checkbox}
                          checked={user.selected || false}
                          onChange={() => toggleRowSelection(user.user_id)}
                          disabled={isCurrentUserRow}
                        />
                      </td>
                      <td style={styles.td}>{user.full_name}</td>
                      <td style={styles.td}>{user.doh_id || 'N/A'}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.user_id, e.target.value, currentView === 'org')}
                          style={isCurrentUserRow ? styles.roleSelectDisabled : styles.roleSelect}
                          disabled={isCurrentUserRow}
                          onFocus={(e) => {
                            if (!isCurrentUserRow) {
                              e.target.style.borderColor = '#059669';
                              e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.2)';
                            }
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          {currentView === 'rbc' ? (
                            <>
                              <option value="Admin">Admin</option>
                              <option value="Doctor">Doctor</option>
                              <option value="Medical Technologist">Medical Tech</option>
                              <option value="Scheduler">Scheduler</option>
                            </>
                          ) : (
                            <>
                              <option value="Barangay">Barangay</option>
                              <option value="Local Government Unit">Local Government Unit</option>
                              <option value="Non-Profit Organization">Non-Profit Organization</option>
                            </>
                          )}
                        </select>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => !isCurrentUserRow && handleDeleteUser(user.user_id, user.full_name, currentView === 'org')}
                          style={isCurrentUserRow ? styles.actionButtonDisabled : styles.actionButton}
                          disabled={isCurrentUserRow}
                          onMouseEnter={(e) => {
                            if (!isCurrentUserRow) {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title={isCurrentUserRow ? "Cannot delete current user" : "Delete User"}
                        >
                          <UserX size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedCount > 0 && (
        <div style={styles.actionBar}>
          <button
            style={{
              ...styles.closeButton,
              ...(hoverStates.close ? styles.closeButtonHover : {})
            }}
            onClick={clearSelection}
            onMouseEnter={() => handleMouseEnter('close')}
            onMouseLeave={() => handleMouseLeave('close')}
          >
            <X size={20} />
          </button>

          <div style={styles.counterSection}>
            <span style={styles.counterText}>
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <button
            style={{
              ...styles.deleteButton,
              ...(hoverStates.delete ? styles.deleteButtonHover : {})
            }}
            onClick={handleDeleteSelected}
            onMouseEnter={() => handleMouseEnter('delete')}
            onMouseLeave={() => handleMouseLeave('delete')}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <>
          <div style={styles.overlay} />
          <div style={styles.successModal}>
            <div style={styles.successIcon}>✓</div>
            <div style={styles.successText}>{successMessage}</div>
          </div>
        </>
      )}
    </>
  );
};

export default AccessControl;
