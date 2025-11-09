import React, { useState } from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemCount, itemName = 'item' }) => {
  const [hoverStates, setHoverStates] = useState({});

  const handleMouseEnter = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: true }));
  };

  const handleMouseLeave = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: false }));
  };

  if (!isOpen) {
    return null;
  }

  const styles = {
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
      zIndex: 3000,
    },
    confirmModal: {
      backgroundColor: "white",
      borderRadius: "11px",
      width: "90%",
      maxWidth: "400px",
      padding: "30px",
      boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "Barlow, sans-serif",
      gap: "20px",
    },
    confirmTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#165C3C",
      textAlign: "center",
      margin: 0,
    },
    confirmDescription: {
      fontSize: "14px",
      color: "#6b7280",
      textAlign: "center",
      lineHeight: "1.5",
      margin: 0,
    },
    confirmButtonGroup: {
      display: "flex",
      gap: "12px",
      width: "100%",
    },
    cancelButton: {
      flex: 1,
      padding: "10px 20px",
      backgroundColor: "#e5e7eb",
      color: "#374151",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      fontFamily: "Barlow, sans-serif",
      transition: "all 0.2s ease",
    },
    cancelButtonHover: {
      backgroundColor: "#d1d5db",
    },
    deleteConfirmButton: {
      flex: 1,
      padding: "10px 20px",
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: "Barlow, sans-serif",
      transition: "all 0.2s ease",
    },
    deleteConfirmButtonHover: {
      backgroundColor: "#dc2626",
    },
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.confirmTitle}>Confirm Delete</h3>
        <p style={styles.confirmDescription}>
          Are you sure you want to delete {itemCount} {itemName}{itemCount > 1 ? 's' : ''}? This action cannot be undone.
        </p>
        <div style={styles.confirmButtonGroup}>
          <button
            style={{
              ...styles.cancelButton,
              ...(hoverStates.cancelDelete ? styles.cancelButtonHover : {}),
            }}
            onClick={onClose}
            onMouseEnter={() => handleMouseEnter("cancelDelete")}
            onMouseLeave={() => handleMouseLeave("cancelDelete")}
          >
            Cancel
          </button>
          <button
            style={{
              ...styles.deleteConfirmButton,
              ...(hoverStates.confirmDelete ? styles.deleteConfirmButtonHover : {}),
            }}
            onClick={onConfirm}
            onMouseEnter={() => handleMouseEnter("confirmDelete")}
            onMouseLeave={() => handleMouseLeave("confirmDelete")}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
