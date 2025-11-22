import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Helper function to set default permissions when toggling visibility ON
const getDefaultPermissions = (role, screen) => {
  // Base: View-only
  const defaults = { can_view: true, can_create: false, can_edit: false, can_delete: false };

  switch (role) {
    case 'Admin':
      defaults.can_create = true;
      defaults.can_edit = true;
      defaults.can_delete = true;
      if (screen === 'Reports') {
        defaults.can_create = false;
        defaults.can_edit = false;
        defaults.can_delete = false;
      }
      if (screen === 'Invoice') {
        defaults.can_create = false;
        defaults.can_edit = false;
        defaults.can_delete = true;
      }
      break;
    
    case 'Inventory Staff':
      if (screen === 'Blood Stock') {
        defaults.can_create = true;
        defaults.can_edit = true;
        defaults.can_delete = true;
      }
      if (screen === 'Released Blood') {
        defaults.can_edit = true;
        defaults.can_delete = true;
      }
      if (screen === 'Non-Conforming') {
        // View only
      }
      if (screen === 'Donor Record') {
        defaults.can_create = true;
        defaults.can_edit = true;
        defaults.can_delete = true;
      }
      if (screen === 'Invoice') {
        defaults.can_delete = true;
      }
      // 'Reports' remains view-only
      break;

    case 'Non-Conforming Staff':
      if (screen === 'Blood Stock') {
        defaults.can_create = true;
        defaults.can_edit = true;
        defaults.can_delete = true;
      }
      if (screen === 'Released Blood') {
        defaults.can_edit = true;
        defaults.can_delete = true;
      }
      if (screen === 'Non-Conforming') {
        defaults.can_create = true;
        defaults.can_edit = true;
        defaults.can_delete = true;
      }
      if (screen === 'Donor Record') {
        defaults.can_create = true;
        defaults.can_edit = true;
        defaults.can_delete = true;
      }
      if (screen === 'Invoice') {
        defaults.can_delete = true;
      }
      // 'Reports' remains view-only
      break;

    case 'Scheduler':
      // All screens are view-only
      break;
  }
  return defaults;
};

// Helper function to check if a screen should be visible by default for a role
const isScreenVisibleByDefault = (role, screen) => {
  switch (role) {
    case 'Admin':
      // All screens visible by default for Admin
      return true;
    
    case 'Inventory Staff':
      // Non-Conforming and Donor Record are OFF by default
      if (screen === 'Non-Conforming' || screen === 'Donor Record') {
        return false;
      }
      return true; // All other screens visible

    case 'Non-Conforming Staff':
      // All screens visible by default (including Non-Conforming and Donor Record)
      return true;

    case 'Scheduler':
      // All screens OFF by default for Scheduler
      return false;
  }
  return true; // Default to visible
};


const UserPermissionsModal = ({ user, isOpen, onClose, onSuccess }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadPermissions();
    } else if (!isOpen) {
      setPermissions([]);
      setLoading(true);
    }
  }, [isOpen, user]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const perms = await window.electronAPI.getUserPermissions(user.user_id);
      
      // Filter out Dashboard and Recent Activity
      const filteredPerms = perms.filter(
        p => p.screen !== 'Dashboard' && p.screen !== 'Recent Activity'
      );

      // Apply default visibility and permissions based on role
      const adjustedPerms = filteredPerms.map(perm => {
        const shouldBeVisible = isScreenVisibleByDefault(user.role, perm.screen);
        
        if (shouldBeVisible && !perm.is_visible) {
          // Screen should be visible by default but isn't - apply defaults
          const defaults = getDefaultPermissions(user.role, perm.screen);
          return {
            ...perm,
            is_visible: true,
            can_view: defaults.can_view,
            can_create: defaults.can_create,
            can_edit: defaults.can_edit,
            can_delete: defaults.can_delete
          };
        }
        
        if (!shouldBeVisible && perm.is_visible) {
          // Screen should NOT be visible by default but is - turn it off
          return {
            ...perm,
            is_visible: false,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false
          };
        }
        
        return perm;
      });

      setPermissions(adjustedPerms);

    } catch (error) {
      console.error('Error loading permissions:', error);
      alert('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (screen, permType, value) => {
    setPermissions(prev =>
      prev.map(perm => {
        if (perm.screen === screen) {
          const newPerm = { ...perm, [permType]: value };

          if (permType === 'is_visible') {
            if (value) {
              // When turning visibility ON
              const defaults = getDefaultPermissions(user.role, screen);
              newPerm.can_view = defaults.can_view;
              newPerm.can_create = defaults.can_create;
              newPerm.can_edit = defaults.can_edit;
              newPerm.can_delete = defaults.can_delete;

            } else {
              // When turning visibility OFF
              newPerm.can_view = false;
              newPerm.can_create = false;
              newPerm.can_edit = false;
              newPerm.can_delete = false;
            }
          }
          
          // This logic is for the 'View' checkbox.
          if (permType === 'can_view') {
            if (!value) {
              // If 'View' is unchecked, all other perms must be off
              newPerm.is_visible = false;
              newPerm.can_create = false;
              newPerm.can_edit = false;
              newPerm.can_delete = false;
            } else {
              // If 'View' is checked, 'Visibility' must be on
              newPerm.is_visible = true;
            }
          }
          
          return newPerm;
        }
        return perm;
      })
    );
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      await window.electronAPI.updateUserPermissions(user.user_id, permissions);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  // This function determines if a C/E/D checkbox is permanently disabled
  const isImmutable = (screen, permType) => {
    // 'can_view' is ALWAYS immutable (unclickable), it's just an indicator
    if (permType === 'can_view') {
      return true;
    }

    // --- Role: Admin ---
    if (user.role === 'Admin') {
      if (screen === 'Reports' && (permType === 'can_create' || permType === 'can_edit' || permType === 'can_delete')) {
        return true; // Reports is view-only
      }
      if (screen === 'Invoice' && (permType === 'can_create' || permType === 'can_edit')) {
        return true; // Invoice is View/Delete only
      }
      return false; // Admin can do all other C/E/D
    }

    // --- Role: Scheduler ---
    if (user.role === 'Scheduler') {
      return true; // Schedulers can't C/E/D anything
    }

    // --- Role: Non-Conforming Staff ---
    if (user.role === 'Non-Conforming Staff') {
      if (screen === 'Blood Stock') {
        return false; // All perms allowed
      }
      if (screen === 'Released Blood') {
        if (permType === 'can_create') return true; // Cannot Create
        return false; // Can Edit, Delete
      }
      if (screen === 'Non-Conforming') {
        return false; // All perms allowed
      }
      if (screen === 'Donor Record') {
        return false; // All perms allowed
      }
      if (screen === 'Invoice') {
        if (permType === 'can_create' || permType === 'can_edit') return true; // Cannot Create, Edit
        return false; // Can Delete
      }
      if (screen === 'Reports') {
        return true; // C/E/D are immutable (view-only)
      }
      return true; // Default to immutable
    }

    // --- Role: Inventory Staff ---
    if (user.role === 'Inventory Staff') {
      if (screen === 'Blood Stock') {
        return false; // All perms allowed
      }
      if (screen === 'Released Blood') {
        if (permType === 'can_create') return true; // Cannot Create
        return false; // Can Edit, Delete
      }
      if (screen === 'Non-Conforming') {
        return true; // C/E/D are immutable
      }
      if (screen === 'Donor Record') {
        return false; // All perms allowed
      }
      if (screen === 'Invoice') {
        if (permType === 'can_create' || permType === 'can_edit') return true; // Cannot Create, Edit
        return false; // Can Delete
      }
      if (screen === 'Reports') {
        return true; // C/E/D are immutable
      }
      return true; // Default to immutable
    }

    // Default for any other role
    return true;
  };

  // --- STYLING FIX ---
  // This function now returns GREEN for checked,
  // WHITE-WITH-BORDER for unchecked-enabled,
  // and GRAY for disabled.
  const getCheckboxStyle = (isChecked, isDisabled) => {
    if (isDisabled) {
      // State: Disabled (muted gray box)
      // This is for perms a role can NEVER have OR for the "View" column
      return {
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        backgroundColor: isChecked ? '#10b981' : '#f3f4f6', // Green if (View + Visible), gray if not
        border: isChecked ? '2px solid #10b981' : '2px solid #e5e7eb',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isChecked ? 'white' : '#d1d5db',
        opacity: 0.7,
      };
    }

    if (isChecked) {
      // State: Enabled AND Checked (Green box)
      return {
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        backgroundColor: '#10b981', // Green fill
        border: '2px solid #10b981', // Green border
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white', // White checkmark
      };
    }

    // State: Enabled AND Unchecked (White box with gray border)
    // This is the style from your image_7485ac.png
    return {
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      backgroundColor: 'white',
      border: '2px solid #d1d5db',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const PermissionCheckbox = ({ screen, permType, value }) => {
    const perm = permissions.find(p => p.screen === screen);
    const isRowVisible = perm ? perm.is_visible : false;
    
    // The "View" checkbox is special. It just mirrors the visibility toggle.
    // It's not clickable, and its style is based *only* on visibility.
    if (permType === 'can_view') {
      value = isRowVisible; // View checkbox just reflects visibility
      const isDisabled = true; // Always disabled from direct clicks
      const checkboxStyle = getCheckboxStyle(value, isDisabled); 
      return (
        <div style={{...checkboxStyle, cursor: 'default'}}>
          {value && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      );
    }

    // For C/E/D checkboxes:
    const roleImmutable = isImmutable(screen, permType);
    const isDisabled = roleImmutable || !isRowVisible;
    
    // If the row is not visible, force C/E/D to be unchecked
    if (!isRowVisible) {
      value = false;
    }
    
    const checkboxStyle = getCheckboxStyle(value, isDisabled);

    return (
      <div
        style={checkboxStyle}
        onClick={() => !isDisabled && handlePermissionChange(screen, permType, !value)}
      >
        {value && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    );
  };

  const VisibilityToggle = ({ screen, value }) => {
    // No screens are immutable for visibility anymore
    const immutable = false; 
    
    return (
      <div
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          backgroundColor: value ? '#10b981' : '#d1d5db',
          position: 'relative',
          cursor: immutable ? 'not-allowed' : 'pointer',
          opacity: immutable ? 0.5 : 1,
          transition: 'background-color 0.2s'
        }}
        onClick={() => !immutable && handlePermissionChange(screen, 'is_visible', !value)}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'white',
            position: 'absolute',
            top: '2px',
            left: value ? '22px' : '2px',
            transition: 'left 0.2s'
          }}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: 'Barlow'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      padding: '24px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    titleSection: {
      flex: 1
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#165C3C',
      margin: 0,
      marginBottom: '4px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0
    },
    closeButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      padding: '4px'
    },
    content: {
      padding: '24px',
      overflowY: 'auto',
      flex: 1
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      backgroundColor: '#f9fafb',
      fontWeight: '600',
      fontSize: '12px',
      color: '#374151',
      borderBottom: '2px solid #e5e7eb',
      textTransform: 'uppercase'
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px',
      color: '#374151'
    },
    footer: {
      padding: '24px',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'flex-end'
    },
    saveButton: {
      backgroundColor: '#165C3C',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <h2 style={styles.title}>Access Control</h2>
            <p style={styles.subtitle}>Roles and Permissions</p>
            <p style={styles.subtitle}>
              User: <strong>{user?.full_name}</strong> ({user?.role})
            </p>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading permissions...
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>SCREEN</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>VIEW</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>CREATE</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>EDIT</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>DELETE</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>VISIBILITY</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.screen}>
                    <td style={styles.td}>{perm.screen}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PermissionCheckbox
                          screen={perm.screen}
                          permType="can_view"
                          value={perm.can_view}
                        />
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PermissionCheckbox
                          screen={perm.screen}
                          permType="can_create"
                          value={perm.can_create}
                        />
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PermissionCheckbox
                          screen={perm.screen}
                          permType="can_edit"
                          value={perm.can_edit}
                        />
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PermissionCheckbox
                          screen={perm.screen}
                          permType="can_delete"
                          value={perm.can_delete}
                        />
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <VisibilityToggle
                          screen={perm.screen}
                          value={perm.is_visible}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.footer}>
          <button
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
            onClick={handleSaveChanges}
            disabled={saving}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#124a2f';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#165C3C';
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsModal;