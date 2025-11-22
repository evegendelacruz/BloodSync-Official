import React from "react";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemCount = 1,
  itemName = "item",
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-icon-container">
          <div className="dialog-icon-warning">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <h3 className="dialog-title">Confirm Delete?</h3>
        <p className="dialog-message">
          Are you sure you want to delete {itemCount}{" "}
          {itemCount === 1 ? itemName : `${itemName}s`}? This action cannot be
          undone.
        </p>
        <div className="dialog-actions">
          <button
            className="dialog-button cancel-button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="dialog-button delete-confirm-button"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .dialog-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideIn 0.2s ease-out;
        }

        .dialog-icon-container {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }

        .dialog-icon-warning {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #fef3c7;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f59e0b;
        }

        .dialog-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          text-align: center;
          margin: 0 0 8px 0;
        }

        .dialog-message {
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .dialog-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .dialog-button {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .dialog-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-button {
          background-color: #f3f4f6;
          color: #374151;
        }

        .cancel-button:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .delete-confirm-button {
          background-color: #ef4444;
          color: white;
        }

        .delete-confirm-button:hover:not(:disabled) {
          background-color: #dc2626;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default DeleteConfirmationModal;
