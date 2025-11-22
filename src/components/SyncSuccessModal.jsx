import React from 'react';

const SyncSuccessModal = ({ isOpen, onClose, donorCount = 0 }) => {
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
    iconContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '1rem',
    },
    successIcon: {
      width: '80px',
      height: '80px',
      objectFit: 'contain',
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
    closeButton: {
      padding: '0.5rem 1.5rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: '#059669',
      color: 'white',
      border: '1px solid #059669',
    },
  };

  if (!isOpen) return null;

  return (
    <div style={styles.dialogOverlay}>
      <div style={styles.dialogContent}>
        <div style={styles.iconContainer}>
          <img
            src="/assets/success.png"
            alt="Success"
            style={styles.successIcon}
            onError={(e) => {
              // Fallback to checkmark if image not found
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div style="width: 80px; height: 80px; background-color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;">✓</div>';
            }}
          />
        </div>
        <h3 style={styles.dialogTitle}>Syncing Success</h3>
        <p style={styles.dialogMessage}>
          The following {donorCount} donor record{donorCount !== 1 ? 's have' : ' has'} been posted in our main server.
          You will be notified once it's approved by the main server.
        </p>
        <div style={styles.dialogActions}>
          <button
            style={styles.closeButton}
            onClick={onClose}
            className="close-button"
          >
            OK
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

        .close-button:hover {
          background-color: #047857 !important;
        }
      `}</style>
    </div>
  );
};

export default SyncSuccessModal;
