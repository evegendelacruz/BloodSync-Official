import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const StockExpirationModal = ({ isOpen, onClose, stockData }) => {
  console.log('[StockExpirationModal] isOpen:', isOpen, 'stockData:', stockData);

  if (!isOpen || !stockData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${month}/${day}/${year}-${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <AlertTriangle size={24} color="#dc2626" />
            <h2 className="modal-title">Stock Information</h2>
          </div>
          <button className="modal-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">CATEGORY OF STOCK:</span>
              <span className="info-value">{stockData.category || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">STOCK TYPE:</span>
              <span className="info-value">{stockData.stockType || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">SERIAL ID:</span>
              <span className="info-value info-value-serial">{stockData.serialId || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">BLOOD TYPE:</span>
              <span className="info-value">{stockData.bloodType || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">RH FACTOR:</span>
              <span className="info-value">{stockData.rhFactor || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">VOLUME (ML):</span>
              <span className="info-value">{stockData.volumeMl || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">DATE OF COLLECTION:</span>
              <span className="info-value">{formatDate(stockData.dateOfCollection)}</span>
            </div>

            <div className="info-row">
              <span className="info-label">EXPIRATION DATE:</span>
              <span className="info-value info-value-expiry">{formatDate(stockData.expirationDate)}</span>
            </div>

            <div className="info-row">
              <span className="info-label">STATUS:</span>
              <span className="info-value">{stockData.status || 'N/A'}</span>
            </div>

            <div className="info-row">
              <span className="info-label">CREATED AT:</span>
              <span className="info-value">{formatDateTime(stockData.createdAt)}</span>
            </div>

            {stockData.modifiedAt && (
              <div className="info-row">
                <span className="info-label">MODIFIED AT:</span>
                <span className="info-value">{formatDateTime(stockData.modifiedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-button modal-button-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 0 12px 12px 0;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 2px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          font-family: 'Barlow', sans-serif;
        }

        .modal-close-button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #6b7280;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close-button:hover {
          background-color: #e5e7eb;
          color: #111827;
        }

        .modal-body {
          padding: 24px;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .info-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .info-label {
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Barlow', sans-serif;
        }

        .info-value {
          font-size: 16px;
          font-weight: 500;
          color: #111827;
          font-family: 'Barlow', sans-serif;
        }

        .info-value-serial {
          font-weight: 700;
          color: #165C3C;
          font-size: 18px;
        }

        .info-value-expiry {
          font-weight: 700;
          color: #dc2626;
          font-size: 20px;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background-color: #f9fafb;
        }

        .modal-button {
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Barlow', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .modal-button-close {
          background-color: #6b7280;
          color: white;
        }

        .modal-button-close:hover {
          background-color: #4b5563;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 640px) {
          .modal-content {
            width: 95%;
            max-height: 90vh;
          }

          .modal-header {
            padding: 20px;
          }

          .modal-title {
            font-size: 18px;
          }

          .modal-body {
            padding: 20px;
          }

          .info-value {
            font-size: 14px;
          }

          .info-value-serial {
            font-size: 16px;
          }

          .info-value-expiry {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default StockExpirationModal;
