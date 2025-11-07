
import React, { useState, useEffect } from "react";
import { Plus, Filter, Search, Calendar, Mail, Bell, User, CheckCircle, X, Clock, RefreshCw, MoreVertical } from "lucide-react";
import SidePanelOrg from "../../../components/SidePanelOrg";
import SyncConfirmModal from "../../../components/SyncConfirmModal";
import SyncSuccessModal from "../../../components/SyncSuccessModal";
import Loader from "../../../components/Loader";

// Import components for navigation
import MailOrg from "./(tabs)/mail_org";
import CalendarOrg from "./(tabs)/calendar_org";
import NotificationOrg from "./(tabs)/notification_org";
import AppointmentOrg from "./appointment_org";
import RecentActivityOrg from "./recent_activity_org";
import ProfileOrg from "./(tabs)/profile/profile";
import LoginOrg from "../login_org";

// Add Donor Modal Component
const AddDonorModal = ({ isOpen, onClose, onSave, donorData, onInputChange, isLoading, isEditMode }) => {
  if (!isOpen) return null;

  const handleSave = () => {
    if (!donorData.firstName || !donorData.lastName || !donorData.gender || 
        !donorData.birthdate || !donorData.bloodType || !donorData.rhFactor || 
        !donorData.contactNumber || !donorData.address) {
      alert('Please fill in all required fields.');
      return;
    }
    onSave();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Donor Record</h2>
            <p className="modal-subtitle">{isEditMode ? 'Edit Donor' : 'Add New Donor'}</p>
          </div>
          <button className="modal-close-button" onClick={onClose} disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                value={donorData.firstName}
                onChange={(e) => onInputChange('firstName', e.target.value)}
                placeholder=""
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Middle Name</label>
              <input
                type="text"
                className="form-input"
                value={donorData.middleName}
                onChange={(e) => onInputChange('middleName', e.target.value)}
                placeholder=""
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-input"
                value={donorData.lastName}
                onChange={(e) => onInputChange('lastName', e.target.value)}
                placeholder=""
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                className="form-select"
                value={donorData.gender}
                onChange={(e) => onInputChange('gender', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Birthdate *</label>
              <input
                type="date"
                className="form-input"
                value={donorData.birthdate}
                onChange={(e) => onInputChange('birthdate', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                value={donorData.age}
                onChange={(e) => onInputChange('age', e.target.value)}
                placeholder=""
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Type *</label>
              <select
                className="form-select"
                value={donorData.bloodType}
                onChange={(e) => onInputChange('bloodType', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">RH Factor *</label>
              <select
                className="form-select"
                value={donorData.rhFactor}
                onChange={(e) => onInputChange('rhFactor', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select</option>
                <option value="+">+</option>
                <option value="-">-</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number *</label>
              <input
                type="tel"
                className="form-input"
                value={donorData.contactNumber}
                onChange={(e) => onInputChange('contactNumber', e.target.value)}
                placeholder=""
                disabled={isLoading}
              />
            </div>

            <div className="form-group form-group-full">
              <label className="form-label">Address *</label>
              <textarea
                className="form-textarea"
                value={donorData.address}
                onChange={(e) => onInputChange('address', e.target.value)}
                placeholder=""
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-button modal-cancel-button" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button 
            className="modal-button modal-save-button" 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
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

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #165C3C;
          margin: 0;
          font-family: 'Barlow';
        }

        .modal-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0 0;
          font-family: 'Barlow';
        }

        .modal-close-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .modal-close-button:hover {
          background-color: #f3f4f6;
          color: #374151;
        }

        .modal-close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-body {
          padding: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group-full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
          font-family: 'Barlow';
        }

        .form-input, .form-select, .form-textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Barlow';
          color: #111827;
          background-color: white;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #165C3C;
          box-shadow: 0 0 0 3px rgba(22, 92, 60, 0.1);
        }

        .form-input[readonly], .form-input:disabled, .form-select:disabled, .form-textarea:disabled {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-select {
          cursor: pointer;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px 24px 24px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }

        .modal-button {
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid;
          font-family: 'Barlow';
        }

        .modal-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-cancel-button {
          background-color: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .modal-cancel-button:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .modal-save-button {
          background-color: #165C3C;
          color: white;
          border-color: #165C3C;
        }

        .modal-save-button:hover:not(:disabled) {
          background-color: #134e33;
          border-color: #134e33;
        }

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

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .modal-content {
            width: 95%;
            margin: 20px;
          }
          
          .modal-header, .modal-body {
            padding: 16px;
          }
          
          .modal-footer {
            padding: 12px 16px 16px 16px;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

// Save Donor Confirmation Modal Component
const SaveDonorConfirmModal = ({ isOpen, onClose, onConfirm, actionType }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="sync-modal-content">
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: '#059669' }}>Confirm {actionType === 'add' ? 'Add' : 'Update'} Donor</h2>
          <button className="modal-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: '16px', color: '#666', textAlign: 'center' }}>
            Click Yes to Confirm {actionType === 'add' ? 'Adding' : 'Updating'} this donor record.
          </p>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-button" onClick={onClose} style={{ backgroundColor: 'white', color: '#059669', border: '1px solid #059669' }}>
            No
          </button>
          <button className="modal-save-button" onClick={onConfirm} style={{ backgroundColor: '#059669', color: 'white', border: '1px solid #059669' }}>
            Yes
          </button>
        </div>

        <style>{`
          .sync-modal-content {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
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
        `}</style>
      </div>
    </div>
  );
};

// Save Donor Success Modal Component
const SaveDonorSuccessModal = ({ isOpen, onClose, actionType }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="sync-modal-content">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img
              src="/assets/success.png"
              alt="Success"
              style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div style="width: 80px; height: 80px; background-color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;">✓</div>';
              }}
            />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#059669', margin: '0 0 0.75rem 0' }}>
            {actionType === 'add' ? 'Donor Added' : 'Donor Updated'} Successfully
          </h3>
          <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0', fontSize: '0.875rem', lineHeight: '1.5' }}>
            The donor record has been {actionType === 'add' ? 'added' : 'updated'} successfully.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: '#059669',
              color: 'white',
              border: '1px solid #059669'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const DonorRecordContent = () => {
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false);
  const [newDonorData, setNewDonorData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    birthdate: '',
    age: '',
    bloodType: '',
    rhFactor: '',
    contactNumber: '',
    address: ''
  });

  const [donorData, setDonorData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDonorId, setEditingDonorId] = useState(null);

  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);
  const [showSyncSuccessModal, setShowSyncSuccessModal] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedDonorCount, setSyncedDonorCount] = useState(0);

  const [showSaveDonorConfirmModal, setShowSaveDonorConfirmModal] = useState(false);
  const [showSaveDonorSuccessModal, setShowSaveDonorSuccessModal] = useState(false);
  const [saveDonorActionType, setSaveDonorActionType] = useState('add'); // 'add' or 'update'

  useEffect(() => {
    const initializePage = async () => {
      setIsLoadingData(true);
      await loadDonors();
      // Show loader for 1 second minimum
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoadingData(false);
    };
    initializePage();
  }, []);

  const loadDonors = async () => {
    try {
      setError(null);

      if (typeof window !== 'undefined' && window.electronAPI) {
        const donors = await window.electronAPI.getAllDonors();
        setDonorData(donors);
      } else {
        console.warn('ElectronAPI not available - running in browser mode');
        setDonorData([]);
      }
    } catch (error) {
      console.error('Error loading donors:', error);
      setError('Failed to load donors. Please try again.');
    }
  };

  const handleSearch = async (term) => {
    try {
      setIsSearching(true);
      setError(null);
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        if (term.trim() === '') {
          await loadDonors();
        } else {
          const results = await window.electronAPI.searchDonors(term);
          setDonorData(results);
        }
      }
    } catch (error) {
      console.error('Error searching donors:', error);
      setError('Failed to search donors. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleRowSelection = (donorId) => {
    setDonorData((prevData) =>
      prevData.map((item) =>
        item.donor_id === donorId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = donorData.every((item) => item.selected);
    setDonorData((prevData) =>
      prevData.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const clearAllSelection = () => {
    setDonorData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  const selectedCount = donorData.filter((item) => item.selected).length;

  const allSelected =
    donorData.length > 0 && donorData.every((item) => item.selected);
  const someSelected = donorData.some((item) => item.selected) && !allSelected;

  const handleAddDonorClick = () => {
    setIsEditMode(false);
    setEditingDonorId(null);
    setIsAddDonorModalOpen(true);
  };

  const handleCloseAddDonorModal = () => {
    setIsAddDonorModalOpen(false);
    setIsEditMode(false);
    setEditingDonorId(null);
    setNewDonorData({
      firstName: '',
      middleName: '',
      lastName: '',
      gender: '',
      birthdate: '',
      age: '',
      bloodType: '',
      rhFactor: '',
      contactNumber: '',
      address: ''
    });
  };

  const handleNewDonorInputChange = (field, value) => {
    setNewDonorData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'birthdate' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setNewDonorData(prev => ({
        ...prev,
        age: age.toString()
      }));
    }
  };

  const handleSaveNewDonorClick = async () => {
    // Validate form
    if (!newDonorData.firstName || !newDonorData.lastName || !newDonorData.gender ||
        !newDonorData.birthdate || !newDonorData.bloodType || !newDonorData.rhFactor ||
        !newDonorData.contactNumber || !newDonorData.address) {
      alert('Please fill in all required fields.');
      return;
    }

    // Show loader first
    setShowLoader(true);
    setIsLoading(true);

    // Wait a moment then show confirmation
    await new Promise(resolve => setTimeout(resolve, 500));

    setShowLoader(false);
    setSaveDonorActionType(isEditMode ? 'update' : 'add');
    setShowSaveDonorConfirmModal(true);
    setIsLoading(false);
  };

  const handleConfirmSaveDonor = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Close confirmation and show loader
      setShowSaveDonorConfirmModal(false);
      setShowLoader(true);

      if (typeof window !== 'undefined' && window.electronAPI) {
        const donorPayload = {
          ...newDonorData,
          age: parseInt(newDonorData.age)
        };

        const user = JSON.parse(localStorage.getItem('currentOrgUser'));
        const currentUserName = user?.fullName || 'Unknown User';

        if (isEditMode && editingDonorId) {
          const updatedDonor = await window.electronAPI.updateDonor(editingDonorId, donorPayload, currentUserName);
          setDonorData(prev => prev.map(donor =>
            donor.id === editingDonorId ? updatedDonor : donor
          ));
        } else {
          const newDonor = await window.electronAPI.addDonor(donorPayload, currentUserName);
          setDonorData(prev => [newDonor, ...prev]);
        }

        // Wait 1 second for loader
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Hide loader and show success
        setShowLoader(false);
        setShowSaveDonorSuccessModal(true);

        // Close add donor modal
        handleCloseAddDonorModal();
      } else {
        throw new Error('Database not available');
      }
    } catch (error) {
      console.error('Error saving donor:', error);
      setError(`Failed to ${isEditMode ? 'update' : 'save'} donor. Please try again.`);
      setShowLoader(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDonor = (donor) => {
    setIsEditMode(true);
    setEditingDonorId(donor.id);
    
    let birthdateForInput = '';
    if (donor.birthdate) {
      const dateStr = donor.birthdate;
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        birthdateForInput = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        birthdateForInput = new Date(dateStr).toISOString().split('T')[0];
      }
    }
    
    setNewDonorData({
      firstName: donor.first_name || '',
      middleName: donor.middle_name || '',
      lastName: donor.last_name || '',
      gender: donor.gender || '',
      birthdate: birthdateForInput,
      age: donor.age?.toString() || '',
      bloodType: donor.blood_type || '',
      rhFactor: donor.rh_factor || '',
      contactNumber: donor.contact_number || '',
      address: donor.address || ''
    });
    
    setIsAddDonorModalOpen(true);
  };

  const handleDeleteSingleDonor = async (donorId) => {
    if (!confirm('Are you sure you want to delete this donor?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const user = JSON.parse(localStorage.getItem('currentOrgUser'));
        const currentUserName = user?.fullName || 'Unknown User';
        await window.electronAPI.deleteDonors([donorId], currentUserName);
        setDonorData(prev => prev.filter(donor => donor.donor_id !== donorId));
      }
    } catch (error) {
      console.error('Error deleting donor:', error);
      setError('Failed to delete donor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelectedDonors = async () => {
    const selectedDonors = donorData.filter(donor => donor.selected);

    if (selectedDonors.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedDonors.length} donor(s)?`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (typeof window !== 'undefined' && window.electronAPI) {
        const donorIds = selectedDonors.map(donor => donor.donor_id);
        const user = JSON.parse(localStorage.getItem('currentOrgUser'));
        const currentUserName = user?.fullName || 'Unknown User';
        await window.electronAPI.deleteDonors(donorIds, currentUserName);
        setDonorData(prev => prev.filter(donor => !donor.selected));
      }
    } catch (error) {
      console.error('Error deleting donors:', error);
      setError('Failed to delete donors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSyncClick = () => {
    const selectedDonors = donorData.filter(donor => donor.selected);

    if (selectedDonors.length === 0) {
      alert('Please select at least one donor to sync.');
      return;
    }

    setShowSyncConfirmModal(true);
  };

  const handleConfirmSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const selectedDonors = donorData.filter(donor => donor.selected);
      setSyncedDonorCount(selectedDonors.length);

      // Close confirm modal and show loader
      setShowSyncConfirmModal(false);
      setShowLoader(true);

      if (typeof window !== 'undefined' && window.electronAPI) {
        // Get current user info from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentOrgUser'));
        const sourceOrganization = currentUser?.barangay || 'Unknown Organization';
        const sourceUserId = currentUser?.userId || 0;
        const sourceUserName = currentUser?.fullName || 'Unknown User';

        // Request sync
        await window.electronAPI.requestDonorSync(
          selectedDonors,
          sourceOrganization,
          sourceUserId,
          sourceUserName
        );

        // Wait 1 second for loader animation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Deselect synced donors
        setDonorData(prev => prev.map(donor => ({
          ...donor,
          selected: false
        })));

        // Hide loader and show success modal
        setShowLoader(false);
        setShowSyncSuccessModal(true);
      }
    } catch (error) {
      console.error('Error requesting sync:', error);
      setError('Failed to request sync. Please try again.');
      setShowLoader(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Show loader while loading initial donor data
  if (isLoadingData) {
    return <Loader />;
  }

  return (
    <div className="donor-record-content">
      <div className="donor-header">
        <h1 className="donor-title" style={{color: '#165C3C', fontWeight: 'bold', fontFamily: 'Barlow'}}>Regional Blood Center</h1>
        <p className="donor-subtitle">Centralized Donor Record</p>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="controls-bar">
        <div className="left-controls">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search donors..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              disabled={isSearching || isLoadingData}
            />
            {isSearching && <div className="search-loading">Searching...</div>}
          </div>
        </div>

        <div className="right-controls">
          <button className="sort-button" disabled={isLoadingData}>
            <span>Sort by</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
            </svg>
          </button>

          <button className="filter-button" disabled={isLoadingData}>
            <Filter size={16} />
            <span>Filter</span>
          </button>

          <button className="sync-button" onClick={handleRequestSyncClick} disabled={isLoadingData || isSyncing}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isSyncing ? 'Syncing...' : 'Request Sync'}</span>
          </button>

          <button className="add-button" onClick={handleAddDonorClick} disabled={isLoadingData || isLoading}>
            <Plus size={16} />
            <span>Add Donor</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="donor-table">
          <thead className="table-head">
            <tr>
              <th className="table-header">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={toggleAllSelection}
                  disabled={isLoadingData || donorData.length === 0}
                />
              </th>
              <th className="table-header donor-id-col">DONOR ID</th>
              <th className="table-header">FIRST NAME</th>
              <th className="table-header">MIDDLE NAME</th>
              <th className="table-header">LAST NAME</th>
              <th className="table-header">GENDER</th>
              <th className="table-header">BIRTHDATE</th>
              <th className="table-header">AGE</th>
              <th className="table-header">BLOOD TYPE</th>
              <th className="table-header">RH FACTOR</th>
              <th className="table-header">CONTACT NUMBER</th>
              <th className="table-header">ADDRESS</th>
              <th className="table-header">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoadingData ? (
              <tr>
                <td colSpan="13" className="loading-state">
                  <div className="loading-content">
                    <RefreshCw size={24} className="loading-icon" />
                    <p className="loading-text">Loading donors...</p>
                  </div>
                </td>
              </tr>
            ) : donorData.length === 0 ? (
              <tr>
                <td colSpan="13" className="empty-state">
                  <div className="empty-content">
                    <User size={48} className="empty-icon" />
                    <h3 className="empty-title">No donors found</h3>
                    <p className="empty-description">
                      {searchTerm ? `No donors match your search for "${searchTerm}"` : 'Click "Add Donor" to add your first donor record'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              donorData.map((item, index) => (
                <tr
                  key={item.donor_id}
                  className={`table-row ${index % 2 === 1 ? 'row-even' : ''} ${item.selected ? 'row-selected' : ''}`}
                >
                  <td className="table-cell">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={item.selected || false}
                      onChange={() => toggleRowSelection(item.donor_id)}
                    />
                  </td>
                  <td className="table-cell">{item.donor_id}</td>
                  <td className="table-cell">{item.first_name}</td>
                  <td className="table-cell">{item.middle_name || '-'}</td>
                  <td className="table-cell">{item.last_name}</td>
                  <td className="table-cell">{item.gender}</td>
                  <td className="table-cell">{item.birthdate}</td>
                  <td className="table-cell">{item.age}</td>
                  <td className="table-cell">{item.blood_type}</td>
                  <td className="table-cell">{item.rh_factor}</td>
                  <td className="table-cell">{item.contact_number}</td>
                  <td className="table-cell">{item.address}</td>
                  <td className="table-cell actions-cell">
                    <div className="action-buttons">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEditDonor(item)}
                        disabled={isLoading}
                        title="Edit donor"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteSingleDonor(item.donor_id)}
                        disabled={isLoading}
                        title="Delete donor"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <button className="pagination-button" disabled={isLoadingData}>Previous</button>
          <span className="pagination-text">Page 1 of {Math.max(1, Math.ceil(donorData.length / 20))}</span>
          <button className="pagination-button-next" disabled={isLoadingData}>Next</button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="action-bar">
          <button className="close-button" onClick={clearAllSelection}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="counter-section">
            <span className="counter-text">
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>

          <button className="edit-button" disabled={selectedCount !== 1}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>

          <button 
            className="delete-button" 
            onClick={handleDeleteSelectedDonors}
            disabled={isLoading}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{isLoading ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      )}

      <AddDonorModal
        isOpen={isAddDonorModalOpen}
        onClose={handleCloseAddDonorModal}
        onSave={handleSaveNewDonorClick}
        donorData={newDonorData}
        onInputChange={handleNewDonorInputChange}
        isLoading={isLoading}
        isEditMode={isEditMode}
      />

      <SyncConfirmModal
        isOpen={showSyncConfirmModal}
        onCancel={() => setShowSyncConfirmModal(false)}
        onConfirm={handleConfirmSync}
        donorCount={donorData.filter(donor => donor.selected).length}
      />

      <SyncSuccessModal
        isOpen={showSyncSuccessModal}
        onClose={() => setShowSyncSuccessModal(false)}
        donorCount={syncedDonorCount}
      />

      <SaveDonorConfirmModal
        isOpen={showSaveDonorConfirmModal}
        onClose={() => setShowSaveDonorConfirmModal(false)}
        onConfirm={handleConfirmSaveDonor}
        actionType={saveDonorActionType}
      />

      <SaveDonorSuccessModal
        isOpen={showSaveDonorSuccessModal}
        onClose={() => setShowSaveDonorSuccessModal(false)}
        actionType={saveDonorActionType}
      />

      {showLoader && <Loader />}

      <style>{`
        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-Medium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-SemiBold.ttf') format('truetype');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-Bold.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        .donor-record-content {
          padding: 24px;
          background-color: #f9fafb;
          min-height: 100vh;
          font-family: 'Barlow';
          border-radius: 8px;
          animation: fadeIn 0.5s ease-out;
        }

        .donor-header {
          margin: 0;
        }

        .donor-title {
          font-size: 24px;
          font-weight: 700;
          color: #165C3C;
          margin-top: 1px;
          font-family: 'Barlow';
        }

        .donor-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-top: -7px;
          font-family: 'Barlow';
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Barlow';
        }

        .error-message button {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          margin-left: 8px;
        }

        .controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          background-color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .left-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding-left: 40px;
          padding-right: 16px;
          padding-top: 8px;
          padding-bottom: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          width: 300px;
          font-size: 14px;
          font-family: 'Barlow';
          outline: none;
        }

        .search-input:disabled {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          z-index: 1;
          color: #9ca3af;
        }

        .search-loading {
          position: absolute;
          right: 12px;
          font-size: 12px;
          color: #6b7280;
          font-family: 'Barlow';
        }

        .right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sort-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background-color: white;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Barlow';
          color: #374151;
        }

        .sort-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Barlow';
        }

        .filter-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sync-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #2C58DC;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Barlow';
        }

        .sync-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #FFC200;
          color: black;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Barlow';
        }

        .add-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .table-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .donor-table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-head {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-header {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
          font-family: 'Barlow';
        }

        .donor-id-col {
          width: 12%;
        }

        .table-body {
          background-color: white;
        }

        .table-row {
          border-bottom: 1px solid #A3A3A3;
        }

        .row-even {
          background-color: #f9fafb;
        }

        .row-selected {
          background-color: #e6f7ff;
        }

        .table-cell {
          padding: 12px 16px;
          font-size: 11px;
          font-family: 'Barlow';
          color: #111827;
          border-bottom: 1px solid rgba(163, 163, 163, 0.2);
        }

        .actions-cell {
          width: 100px;
          text-align: center;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
          justify-content: center;
          align-items: center;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .edit-btn {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .edit-btn:hover:not(:disabled) {
          background-color: #2563eb;
          color: white;
        }

        .delete-btn {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .delete-btn:hover:not(:disabled) {
          background-color: #dc2626;
          color: white;
        }

        .loading-state, .empty-state {
          padding: 60px 24px;
          text-align: center;
          background-color: white;
        }

        .loading-content, .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .loading-icon {
          color: #165C3C;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .loading-text {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
          font-family: 'Barlow';
        }

        .empty-icon {
          color: #d1d5db;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0;
          font-family: 'Barlow';
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          font-family: 'Barlow';
        }

        .checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .checkbox:disabled {
          cursor: not-allowed;
        }

        .pagination {
          background-color: white;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pagination-button {
          font-size: 14px;
          color: #6b7280;
          background-color: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          font-family: 'Barlow';
        }

        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-button-next {
          font-size: 14px;
          color: #3b82f6;
          background-color: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          font-family: 'Barlow';
        }

        .pagination-button-next:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-text {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
          font-family: 'Barlow';
        }

        .action-bar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 0;
          background: #4a5568;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          z-index: 1000;
          color: white;
          overflow: hidden;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          background-color: #4a5568;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 16px;
          border-right: 1px solid #2d3748;
        }

        .counter-section {
          padding: 12px 24px;
          background-color: #4a5568;
          border-right: 1px solid #2d3748;
        }

        .counter-text {
          font-size: 14px;
          font-weight: 500;
          color: white;
          margin: 0;
          font-family: 'Barlow';
        }

        .edit-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background-color: #4a5568;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Barlow';
          border-right: 1px solid #2d3748;
        }

        .edit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background-color: #4a5568;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Barlow';
        }

        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Logout Confirmation Dialog Component
const LogoutDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3 className="dialog-title">Confirm Logout</h3>
        <p className="dialog-message">Are you sure you want to logout?</p>
        <div className="dialog-actions">
          <button className="dialog-button cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="dialog-button confirm-button" onClick={onConfirm}>
            Yes, Logout
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
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 90%;
          text-align: center;
          animation: slideIn 0.3s ease-out;
        }

        .dialog-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem 0;
          font-family: 'Barlow';
        }

        .dialog-message {
          color: #6b7280;
          margin: 0 0 1.5rem 0;
          font-size: 0.875rem;
          font-family: 'Barlow';
        }

        .dialog-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .dialog-button {
          padding: 0.5rem 1.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid;
          font-family: 'Barlow';
        }

        .cancel-button {
          background-color: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .cancel-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .confirm-button {
          background-color: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .confirm-button:hover {
          background-color: #dc2626;
          border-color: #dc2626;
        }

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
      `}</style>
    </div>
  );
};

// Main DonorRecordOrg Component
const DonorRecordOrg = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeScreen, setActiveScreen] = useState("donor-record-org");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [isMailDropdownOpen, setIsMailDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeNotificationMenu, setActiveNotificationMenu] = useState(null);
  const [mailMessages, setMailMessages] = useState([]);
  const [isLoadingMail, setIsLoadingMail] = useState(false);
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('currentOrgUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Load notifications and set up periodic refresh
  useEffect(() => {
    loadNotifications();

    const notificationInterval = setInterval(loadNotifications, 30000);
    return () => clearInterval(notificationInterval);
  }, []);

  const loadNotifications = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const [notificationsData, appointmentsData] = await Promise.all([
          window.electronAPI.getAllOrgNotifications(),
          window.electronAPI.getAllAppointments()
        ]);
        
        const transformedNotifications = notificationsData.map(n => ({
          id: n.id,
          notificationId: n.notification_id,
          type: n.type || 'partnership_response',
          status: n.status,
          title: n.title,
          message: n.message,
          requestor: n.requestor || 'Regional Blood Center',
          timestamp: new Date(n.updated_at || n.created_at),
          read: n.read || false,
          appointmentId: n.appointment_id,
          declineReason: n.decline_reason,
          contactInfo: {
            email: n.contact_email,
            phone: n.contact_phone,
            address: n.contact_address,
            type: n.contact_type
          }
        }));

        const now = new Date();
        const upcomingAppointments = appointmentsData
          .filter(apt => {
            const aptDate = new Date(apt.date + 'T' + apt.time);
            const hoursDiff = (aptDate - now) / (1000 * 60 * 60);
            return hoursDiff > 0 && hoursDiff <= 72 && (apt.status === 'approved' || apt.status === 'confirmed');
          })
          .map(apt => {
            const aptDate = new Date(apt.date + 'T' + apt.time);
            const hoursDiff = Math.round((aptDate - now) / (1000 * 60 * 60));
            
            return {
              id: `event-${apt.id || apt.appointment_id}`,
              notificationId: `EVENT-${apt.id || apt.appointment_id}`,
              type: 'upcoming_event',
              status: 'info',
              title: `Upcoming Event: ${apt.title || 'Blood Drive Partnership'}`,
              message: `Your event "${apt.title || 'Blood Drive Partnership'}" is scheduled in ${hoursDiff} hours at ${apt.contactInfo?.address || 'TBD'}.`,
              requestor: 'Event Reminder',
              timestamp: new Date(apt.created_at || apt.date),
              read: false,
              appointmentId: apt.id || apt.appointment_id,
              eventDate: apt.date,
              eventTime: apt.time,
              contactInfo: apt.contactInfo
            };
          });

        const allNotifications = [...transformedNotifications, ...upcomingAppointments]
          .sort((a, b) => {
            if (a.read !== b.read) {
              return a.read ? 1 : -1;
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
          });

        setNotifications(allNotifications);
      } else {
        setNotifications([
          {
            id: 1,
            status: 'approved',
            title: 'Blood Drive Partnership Request Approved',
            message: 'Your blood drive partnership request with Metro Hospital has been approved.',
            requestor: 'Metro Hospital',
            timestamp: new Date(Date.now() - 30 * 60000),
            read: false
          },
          {
            id: 2,
            status: 'declined',
            title: 'Sync Request Declined',
            message: 'Your sync request with Butuan Blood Center has been declined.',
            requestor: 'Butuan Blood Center',
            timestamp: new Date(Date.now() - 2 * 60 * 60000),
            read: false
          },
          {
            id: 3,
            status: 'info',
            title: 'Profile Updated Successfully',
            message: 'Your profile information has been updated successfully.',
            requestor: 'System',
            timestamp: new Date(Date.now() - 3 * 60 * 60000),
            read: false
          },
          {
            id: 4,
            status: 'warning',
            title: 'Failed Login Attempts',
            message: 'Multiple failed login attempts detected on your account.',
            requestor: 'Security System',
            timestamp: new Date(Date.now() - 12 * 60 * 60000),
            read: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const handleNavigate = (screen) => {
    setActiveScreen(screen);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const toggleCalendarDropdown = () => {
    setIsCalendarDropdownOpen(!isCalendarDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleMailDropdown = () => {
    setIsMailDropdownOpen(!isMailDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsCalendarDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const handleProfileAction = (action) => {
    if (action === "edit-profile") {
      setActiveScreen("profile");
    } else if (action === "logout") {
      setShowLogoutDialog(true);
    }
    setIsProfileDropdownOpen(false);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    setIsLoggedOut(true);
    console.log("Logging out...");
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const handleRefreshNotifications = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const toggleNotificationReadStatus = (notificationId) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: !notification.read }
          : notification
      )
    );
    setActiveNotificationMenu(null);
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'declined': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'warning': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={14} />;
      case 'declined': return <X size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'info': return <Bell size={14} />;
      case 'warning': return <Bell size={14} />;
      default: return <Bell size={14} />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getLatestNotifications = () => {
    return notifications
      .sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 4);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    loadMailMessages();
    const mailInterval = setInterval(loadMailMessages, 30000);
    return () => clearInterval(mailInterval);
  }, []);

  const loadMailMessages = async () => {
    try {
      setIsLoadingMail(true);

      if (typeof window !== 'undefined' && window.electronAPI) {
        // Load from mail_org table instead of notifications
        const mails = await window.electronAPI.getAllMails();

        const formattedMails = mails
          .map(m => {
            return {
              id: m.id,
              mailId: m.mail_id,
              from: m.from_name || 'Regional Blood Center',
              fromEmail: m.from_email || 'admin@regionalbloodcenter.org',
              avatar: 'RBC',
              avatarColor: '#165C3C',
              subject: m.subject,
              preview: m.preview,
              timestamp: new Date(m.created_at),
              read: m.read || false,
              status: m.status,
              declineReason: m.decline_reason || null,
              appointmentId: m.appointment_id
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 3);

        setMailMessages(formattedMails);
      }
    } catch (error) {
      console.error('Error loading mail messages:', error);
    } finally {
      setIsLoadingMail(false);
    }
  };

  useEffect(() => {
    loadCalendarAppointments();
    
    const handleAppointmentsUpdate = (event) => {
      if (event.detail) {
        const upcomingAppts = event.detail
          .filter(apt => apt.status === 'approved' || apt.status === 'confirmed')
          .slice(0, 4)
          .map(apt => ({
            id: apt.id || apt.appointment_id,
            title: apt.title || `Blood Drive Partnership - ${apt.contactInfo?.lastName || 'Unknown'}`,
            subtitle: apt.notes || `${apt.contactInfo?.address || 'Location TBD'}`,
            date: apt.date,
            time: apt.time,
            type: apt.contactInfo?.type || 'organization'
          }));
        
        setCalendarAppointments(upcomingAppts);
      }
    };
    
    window.addEventListener('appointmentsUpdated', handleAppointmentsUpdate);
    const calendarInterval = setInterval(loadCalendarAppointments, 30000);
    
    return () => {
      window.removeEventListener('appointmentsUpdated', handleAppointmentsUpdate);
      clearInterval(calendarInterval);
    };
  }, []);

  const loadCalendarAppointments = async () => {
    try {
      setIsLoadingCalendar(true);
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const appointmentsData = await window.electronAPI.getAllAppointments();
        
        const upcomingAppts = appointmentsData
          .filter(apt => apt.status === 'approved' || apt.status === 'confirmed')
          .slice(0, 4)
          .map(apt => ({
            id: apt.id || apt.appointment_id,
            title: apt.title || `Blood Drive Partnership - ${apt.contactInfo?.lastName || 'Unknown'}`,
            subtitle: apt.notes || `${apt.contactInfo?.address || 'Location TBD'}`,
            date: apt.date,
            time: apt.time,
            type: apt.contactInfo?.type || 'organization'
          }));
        
        setCalendarAppointments(upcomingAppts);
      } else {
        setCalendarAppointments([
          {
            id: 1,
            title: 'Blood Drive Partnership - Santos',
            subtitle: 'Partnership meeting for community blood drive',
            date: '2025-10-21',
            time: '10:00',
            type: 'barangay'
          },
          {
            id: 2,
            title: 'Blood Drive Partnership - Cruz',
            subtitle: 'Partnership meeting for organization blood drive',
            date: '2025-10-13',
            time: '14:00',
            type: 'organization'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading calendar appointments:', error);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const getAppointmentIcon = (type) => {
    return '🩸';
  };

  const getAppointmentIconColor = (index) => {
    const colors = ['red-bg', 'blue-bg', 'green-bg', 'yellow-bg'];
    return colors[index % colors.length];
  };

  const getMailSubject = (status, title) => {
    switch (status) {
      case 'approved':
        return `Partnership Request Approved - ${title}`;
      case 'declined':
        return `Partnership Request Declined - ${title}`;
      case 'pending':
        return `Partnership Request Under Review - ${title}`;
      default:
        return `Partnership Request Update - ${title}`;
    }
  };

  const getMailPreview = (status, message) => {
    const preview = message.substring(0, 60);
    switch (status) {
      case 'approved':
        return `Your partnership request has been approved. ${preview}...`;
      case 'declined':
        return `Your partnership request has been declined. ${preview}...`;
      case 'pending':
        return `Your partnership request is under review. ${preview}...`;
      default:
        return `${preview}...`;
    }
  };

  const getMailStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'declined': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (isLoggedOut) {
    return <LoginOrg />;
  }

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "mail-org":
        return <MailOrg />;
      case "calendar-org":
        return <CalendarOrg />;
      case "notification-org":
        return <NotificationOrg />;
      case "profile-org":
        return <ProfileOrg />;
      case "appointment-org":
        return <AppointmentOrg />;
      case "recent-activity-org":
        return <RecentActivityOrg />;
      default:
        return <DonorRecordContent />;
    }
  };

  return (
    <div className="dashboard-container">
      <SidePanelOrg
        isOpen={isSidePanelOpen}
        onToggle={toggleSidePanel}
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
      />

      <div
        className="main-content-wrapper"
        style={{
          marginLeft: isSidePanelOpen ? "15rem" : "4rem",
        }}
      >
        <nav className="nav-bar">
          <div className="nav-content">
            <div className="nav-left"></div>

            <div className="nav-right">
              <div className="dropdown-container">
                <button
                  className={`nav-button ${activeScreen === "calendar" ? "nav-button-active" : ""}`}
                  onClick={toggleCalendarDropdown}
                >
                  <Calendar className="w-5 h-5 text-gray-600" />
                </button>
                {isCalendarDropdownOpen && (
                  <div className="dropdown-menu requests-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">UPCOMING EVENTS</h3>
                        <button 
                          className={`refresh-button ${isLoadingCalendar ? 'refreshing' : ''}`}
                          onClick={loadCalendarAppointments}
                          disabled={isLoadingCalendar}
                          title="Refresh appointments"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {isLoadingCalendar ? (
                        <div className="dropdown-item">
                          <div className="loading-mail-content">
                            <RefreshCw size={16} className="loading-icon" />
                            <span className="loading-text">Loading appointments...</span>
                          </div>
                        </div>
                      ) : calendarAppointments.length === 0 ? (
                        <div className="dropdown-item">
                          <div className="empty-mail-content">
                            <Calendar size={20} color="#d1d5db" />
                            <span className="empty-text">No upcoming events</span>
                          </div>
                        </div>
                      ) : (
                        calendarAppointments.map((appointment, index) => (
                          <div 
                            key={appointment.id} 
                            className="dropdown-item"
                            onClick={() => handleNavigate("calendar-org")}
                          >
                            <div className="request-icon">
                              <div className={`icon-circle ${getAppointmentIconColor(index)}`}>
                                <span className="icon-text">{getAppointmentIcon(appointment.type)}</span>
                              </div>
                            </div>
                            <div className="request-details">
                              <p className="request-title">{appointment.title}</p>
                              <p className="request-subtitle">{appointment.subtitle}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("calendar-org")}>
                        See All Events
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="dropdown-container">
                <button
                  className={`nav-button ${activeScreen === "mail" ? "nav-button-active" : ""}`}
                  onClick={toggleMailDropdown}
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  {mailMessages.filter(m => !m.read).length > 0 && (
                    <span className="notification-badge">{mailMessages.filter(m => !m.read).length}</span>
                  )}
                </button>
                {isMailDropdownOpen && (
                  <div className="dropdown-menu messages-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">MESSAGES</h3>
                        <button 
                          className={`refresh-button ${isLoadingMail ? 'refreshing' : ''}`}
                          onClick={loadMailMessages}
                          disabled={isLoadingMail}
                          title="Refresh messages"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {isLoadingMail ? (
                        <div className="dropdown-item">
                          <div className="loading-mail-content">
                            <RefreshCw size={16} className="loading-icon" />
                            <span className="loading-text">Loading messages...</span>
                          </div>
                        </div>
                      ) : mailMessages.length === 0 ? (
                        <div className="dropdown-item">
                          <div className="empty-mail-content">
                            <Mail size={20} color="#d1d5db" />
                            <span className="empty-text">No messages</span>
                          </div>
                        </div>
                      ) : (
                        mailMessages.map((mail) => (
                          <div 
                            key={mail.id} 
                            className={`dropdown-item ${!mail.read ? 'unread-mail' : ''}`}
                            onClick={() => handleNavigate("mail-org")}
                          >
                            <div 
                              className="message-avatar"
                              style={{ backgroundColor: mail.avatarColor }}
                            >
                              {mail.avatar}
                            </div>
                            <div className="message-details">
                              <div className="message-header-row">
                                <p className="message-sender">{mail.from}</p>
                                <div 
                                  className="mail-status-dot"
                                  style={{ backgroundColor: getMailStatusColor(mail.status) }}
                                  title={mail.status.toUpperCase()}
                                ></div>
                              </div>
                              <p className="message-subject">{mail.subject}</p>
                              <p className="message-preview">{mail.preview}</p>
                            </div>
                            {!mail.read && <div className="unread-dot-dropdown"></div>}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("mail-org")}>
                        View All Messages
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="dropdown-container">
                <button
                  className={`nav-button ${activeScreen === "notification-org" ? "nav-button-active" : ""}`}
                  onClick={toggleNotificationDropdown}
                > 
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                {isNotificationDropdownOpen && (
                  <div className="dropdown-menu notifications-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">NOTIFICATIONS</h3>
                        <div className="notification-header-actions">
                          <button 
                            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
                            onClick={handleRefreshNotifications}
                            disabled={isRefreshing}
                            title="Refresh notifications"
                          >
                            <RefreshCw size={14} />
                          </button>
                          {unreadCount > 0 && (
                            <button 
                              className="mark-all-read-button"
                              onClick={markAllAsRead}
                              title="Mark all as read"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {getLatestNotifications().map((notification) => (
                        <div key={notification.id} className={`dropdown-item notification-item ${!notification.read ? 'unread-notification' : ''}`}>
                          <div 
                            className="notification-icon"
                            style={{ color: getStatusColor(notification.status) }}
                          >
                            <div className="icon-circle" style={{ backgroundColor: `${getStatusColor(notification.status)}15`, border: `1px solid ${getStatusColor(notification.status)}30` }}>
                              {getStatusIcon(notification.status)}
                            </div>
                          </div>
                          <div className="notification-details">
                            <div className="notification-header-row">
                              <p className="notification-title">{notification.title}</p>
                              <div className="notification-actions">
                                <span className="notification-time">{getTimeAgo(notification.timestamp)}</span>
                                <div className="notification-menu-container">
                                  <button 
                                    className="notification-menu-button"
                                    onClick={() => setActiveNotificationMenu(activeNotificationMenu === notification.id ? null : notification.id)}
                                  >
                                    <MoreVertical size={12} />
                                  </button>
                                  {activeNotificationMenu === notification.id && (
                                    <div className="notification-menu">
                                      <button 
                                        className="notification-menu-item"
                                        onClick={() => toggleNotificationReadStatus(notification.id)}
                                      >
                                        Mark as {notification.read ? 'Unread' : 'Read'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="notification-subtitle">{notification.message && notification.message.length > 60 ? `${notification.message.substring(0, 60)}...` : notification.message || 'No message content'}</p>
                            <span className="notification-requestor">From: {notification.requestor}</span>
                          </div>
                          {!notification.read && <div className="unread-dot-dropdown"></div>}
                        </div>
                      ))}
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("notification-org")}>
                        See All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-section relative">
                <span className="user-name">{currentUser?.fullName || 'User'}</span>
                <div
                  className={`user-avatar cursor-pointer ${activeScreen === "profile" ? "user-avatar-active" : ""}`}
                  onClick={toggleProfileDropdown}
                  style={{
                    overflow: 'hidden',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: currentUser?.profilePhoto ? 'transparent' : '#f3f4f6'
                  }}
                >
                  {currentUser?.profilePhoto ? (
                    <img
                      src={currentUser.profilePhoto}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                
                {isProfileDropdownOpen && (
                  <div className="dropdown-menu profile-dropdown">
                    <button
                      className="profile-menu-item"
                      onClick={() => handleNavigate("profile-org")}
                    >
                      My Profile
                    </button>
                    <button
                      className="profile-menu-item"
                      onClick={() => handleProfileAction("logout")}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="main-content">{renderActiveScreen()}</main>
      </div>

      <LogoutDialog 
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      <style jsx>{`
        body {
          margin: 0;
        }
        .dashboard-container {
          min-height: 100vh;
          background-color: #edf4e6;
          position: relative;
          overflow-x: hidden;
        }

        .main-content-wrapper {
          position: relative;
          min-height: 100vh;
          transition: margin-left 0.3s ease-in-out;
        }

        .nav-bar {
          background-color: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          position: sticky;
          top: 0;
          z-index: 30;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .dropdown-container {
          position: relative;
        }

        .nav-button {
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background-color 0.2s;
          border: none;
          background: none;
          cursor: pointer;
          position: relative;
        }

        .nav-button:hover {
          background-color: #f3f4f6;
        }

        .nav-button-active {
          background-color: #059669 !important;
        }

        .nav-button-active:hover {
          background-color: #047857 !important;
        }

        .nav-button-active .lucide {
          color: white !important;
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: bold;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-family: 'Barlow';
        }

        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 0.5rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          z-index: 50;
          overflow: hidden;
          animation: dropdownSlide 0.15s ease-out;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .requests-dropdown {
          width: 320px;
        }

        .messages-dropdown {
          width: 320px;
        }

        .notifications-dropdown {
          width: 350px;
        }

        .profile-dropdown {
          width: 160px;
        }

        .dropdown-header {
          background-color: #059669;
          padding: 0.75rem 1rem;
          color: white;
        }

        .notification-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .notification-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .refresh-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .refresh-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .refresh-button.refreshing {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .mark-all-read-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.7rem;
          font-family: 'Barlow';
          font-weight: 500;
          transition: all 0.2s;
        }

        .mark-all-read-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .dropdown-title {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: white;
          margin: 0;
          font-family: 'Barlow';
        }

        .dropdown-content {
          max-height: 320px;
          overflow-y: auto;
        }

        .dropdown-item {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }

        .dropdown-item:hover {
          background-color: #f9fafb;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .notification-item.unread-notification {
          background-color: #fefffe;
          border-left: 3px solid #10b981;
        }

        .notification-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .icon-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .red-bg {
          background-color: #ef4444;
          color: white;
        }

        .yellow-bg {
          background-color: #eab308;
          color: white;
        }

        .blue-bg {
          background-color: #3b82f6;
          color: white;
        }

        .green-bg {
          background-color: #10b981;
          color: white;
        }

        .orange-bg {
          background-color: #f97316;
          color: white;
        }

        .icon-text {
          font-size: 0.875rem;
        }

        .request-details, .notification-details {
          flex: 1;
          min-width: 0;
        }

        .notification-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .notification-menu-container {
          position: relative;
        }

        .notification-menu-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 2px;
          border-radius: 2px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-menu-button:hover {
          color: #6b7280;
          background-color: #f3f4f6;
        }

        .notification-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 4px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          z-index: 100;
          min-width: 120px;
          overflow: hidden;
          animation: menuSlide 0.1s ease-out;
        }

        @keyframes menuSlide {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .notification-menu-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          font-size: 0.75rem;
          color: #374151;
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          font-family: 'Barlow';
          font-weight: 500;
        }

        .notification-menu-item:hover {
          background-color: #f3f4f6;
        }

        .request-title, .notification-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
          line-height: 1.25;
          font-family: 'Barlow';
          flex: 1;
        }

        .notification-time {
          font-size: 0.65rem;
          color: #6b7280;
          white-space: nowrap;
          font-family: 'Barlow';
          font-weight: 400;
        }

        .request-subtitle, .notification-subtitle {
          font-size: 0.75rem;
          color: #4b5563;
          margin: 0 0 4px 0;
          line-height: 1.33;
          font-family: 'Barlow';
        }

        .notification-requestor {
          font-size: 0.7rem;
          color: #6b7280;
          font-weight: 500;
          font-family: 'Barlow';
        }

        .unread-dot-dropdown {
          position: absolute;
          top: 12px;
          right: 8px;
          width: 6px;
          height: 6px;
          background-color: #10b981;
          border-radius: 50%;
          z-index: 1;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.75rem;
          color: white;
          flex-shrink: 0;
        }

        .blue-avatar {
          background-color: #3b82f6;
        }

        .green-avatar {
          background-color: #10b981;
        }

        .purple-avatar {
          background-color: #8b5cf6;
        }

        .message-details {
          flex: 1;
          min-width: 0;
        }

        .message-sender {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.25rem 0;
          line-height: 1.25;
          font-family: 'Barlow';
        }

        .message-preview {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
          font-family: 'Barlow';
        }

        .dropdown-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid #f3f4f6;
          background-color: #f9fafb;
          text-align: center;
        }

        .footer-button {
          background: none;
          border: none;
          color: #059669;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
          width: 100%;
          font-family: 'Barlow';
        }

        .footer-button:hover {
          background-color: #e5e7eb;
        }

        .profile-menu-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #374151;
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          border-bottom: 1px solid #f3f4f6;
          font-family: 'Barlow';
        }

        .profile-menu-item:last-child {
          border-bottom: none;
        }

        .profile-menu-item:hover {
          background-color: #f3f4f6;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-left: 0.75rem;
          border-left: 1.4px solid #e5e7eb;
          position: relative;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          font-family: 'Barlow';
        }

        .user-avatar {
          width: 2rem;
          height: 2rem;
          background-color: #d1d5db;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .user-avatar:hover {
          background-color: #9ca3af;
        }

        .user-avatar-active {
          background-color: #059669 !important;
        }

        .user-avatar-active:hover {
          background-color: #047857 !important;
        }

        .user-avatar-active .lucide {
          color: white !important;
        }

        .main-content {
          padding: 1.5rem;
        }

        @media (max-width: 768px) {
          .main-content-wrapper {
            margin-left: 0 !important;
          }

          .nav-content {
            flex-direction: column;
            gap: 1rem;
          }

          .nav-right {
            margin-left: 0;
            border-left: none;
            padding-left: 0;
          }

          .user-section {
            border-left: none;
            padding-left: 0;
          }

          .dropdown-menu {
            right: auto;
            left: 0;
          }

          .unread-mail {
  background-color: #fefffe;
  border-left: 3px solid #10b981;
}

.message-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.mail-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-subject {
  font-size: 0.8rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.2;
  font-family: 'Barlow';
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-mail-content,
.empty-mail-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  width: 100%;
}

.loading-text,
.empty-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: 'Barlow';
}

.loading-icon {
  animation: spin 1s linear infinite;
}

          .requests-dropdown, .notifications-dropdown, .messages-dropdown {
            width: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default DonorRecordOrg;