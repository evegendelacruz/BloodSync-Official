import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';

const UserApproval = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const users = await window.electronAPI.getPendingUsers();
      // Add selected property to each user
      setPendingUsers(users.map(u => ({ ...u, selected: false })));
    } catch (error) {
      console.error('Error loading pending users:', error);
      alert('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userName) => {
    try {
      await window.electronAPI.approveUser(userId);
      setSuccessMessage('User Approved Successfully!');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
      await loadPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const handleReject = async (userId, userName) => {
    const confirmed = window.confirm(`Are you sure you want to reject user "${userName}"? This will delete their account.`);

    if (confirmed) {
      try {
        await window.electronAPI.rejectUser(userId);
        setSuccessMessage('User Rejected');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        await loadPendingUsers();
      } catch (error) {
        console.error('Error rejecting user:', error);
        alert('Failed to reject user');
      }
    }
  };

  // Checkbox selection functions
  const toggleRowSelection = (userId) => {
    setPendingUsers(prev =>
      prev.map(user =>
        user.user_id === userId ? { ...user, selected: !user.selected } : user
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = filteredUsers.every(u => u.selected);
    setPendingUsers(prev =>
      prev.map(user => {
        // Only toggle users that are in the filtered list
        if (filteredUsers.find(f => f.user_id === user.user_id)) {
          return { ...user, selected: !allSelected };
        }
        return user;
      })
    );
  };

  const filteredUsers = pendingUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toString().includes(searchTerm)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      fontFamily: 'Barlow'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#165C3C',
      marginBottom: '24px',
      fontFamily: 'Barlow'
    },
    searchContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px'
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
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#059669'
    },
    selectedRow: {
      backgroundColor: '#f0fdf4'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px'
    },
    approveButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#10b981',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    rejectButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#ef4444',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
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
        <h2 style={styles.title}>User Approval</h2>
        <div style={styles.emptyState}>Loading pending users...</div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.container}>
        <h2 style={styles.title}>User Approval</h2>

        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Activity"
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

        {/* Pending Users Table */}
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
                <th style={styles.th}>ID NUMBER</th>
                <th style={styles.th}>EMAIL</th>
                <th style={styles.th}>ROLE</th>
                <th style={styles.th}>DATE</th>
                <th style={styles.th}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.emptyState}>
                    No pending users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    style={user.selected ? styles.selectedRow : {}}
                  >
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={user.selected || false}
                        onChange={() => toggleRowSelection(user.user_id)}
                      />
                    </td>
                    <td style={styles.td}>{user.full_name}</td>
                    <td style={styles.td}>2022300{user.user_id}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.role}</td>
                    <td style={styles.td}>{formatDate(user.created_at)}</td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleApprove(user.user_id, user.full_name)}
                          style={styles.approveButton}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#d1fae5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Approve User"
                        >
                          <CheckCircle size={24} />
                        </button>
                        <button
                          onClick={() => handleReject(user.user_id, user.full_name)}
                          style={styles.rejectButton}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Reject User"
                        >
                          <XCircle size={24} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

export default UserApproval;
