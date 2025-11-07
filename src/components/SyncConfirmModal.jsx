import React from 'react';

const SyncConfirmModal = ({ isOpen, onConfirm, onCancel, donorCount = 0 }) => {
  const styles = {
    dialogOverlay: {
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
      animation: 'fadeIn 0.2s ease-out',
    },
    dialogContent: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '0.5rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      maxWidth: '450px',
      width: '90%',
      textAlign: 'center',
      animation: 'slideIn 0.3s ease-out',
    },
    dialogTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#059669',
      margin: '0 0 0.75rem 0',
    },
    dialogMessage: {
      color: '#6b7280',
      margin: '0 0 1.5rem 0',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    },
    dialogActions: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'center',
    },
    dialogButton: {
      padding: '0.5rem 1.5rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid',
    },
    cancelButton: {
      backgroundColor: 'white',
      color: '#059669',
      borderColor: '#059669',
    },
    confirmButton: {
      backgroundColor: '#059669',
      color: 'white',
      borderColor: '#059669',
    },
  };

  if (!isOpen) return null;

  return (
    <div style={styles.dialogOverlay}>
      <div style={styles.dialogContent}>
        <h3 style={styles.dialogTitle}>Confirm Sync</h3>
        <p style={styles.dialogMessage}>
          Click Yes to Confirm Syncing {donorCount > 0 ? `${donorCount} donor record${donorCount > 1 ? 's' : ''}` : 'donor records'}.
          This will be approved first in our main server.
        </p>
        <div style={styles.dialogActions}>
          <button
            style={{...styles.dialogButton, ...styles.cancelButton}}
            onClick={onCancel}
            className="cancel-button"
          >
            No
          </button>
          <button
            style={{...styles.dialogButton, ...styles.confirmButton}}
            onClick={onConfirm}
            className="confirm-button"
          >
            Yes
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .cancel-button:hover {
          background-color: #f0fdf4 !important;
        }

        .confirm-button:hover {
          background-color: #047857 !important;
        }
      `}</style>
    </div>
  );
};

export default SyncConfirmModal;
