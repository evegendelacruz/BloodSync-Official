import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, Search, Calendar, Mail, Bell, User } from "lucide-react";
import SidePanelOrg from "../../../components/SidePanelOrg";

import MailOrg from "./(tabs)/mail";
import CalendarOrg from "./(tabs)/calendar";
import NotificationOrg from "./(tabs)/notification";
import AppointmentOrg from "./appointment";
import RecentActivityOrg from "./recent_activity";
import ProfileOrg from "./(tabs)/profile/profile";
import LoginOrg from "../login";

const DonorRecordContent = ({ currentUser }) => {
  const [donorData, setDonorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [barangaySearch, setBarangaySearch] = useState("");
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [editValidationErrors, setEditValidationErrors] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: "", description: "" });
  const [editingDonor, setEditingDonor] = useState(null);
  const [formData, setFormData] = useState({
    donorId: "", firstName: "", middleName: "", lastName: "", gender: "",
    birthdate: "", age: "", bloodType: "", rhFactor: "", contactNumber: "",
    address: "", recentDonation: "", donationCount: "",
  });

  // Get source organization based on user category
  const getSourceOrganization = () => {
    if (!currentUser) return null;
    if (currentUser.category === "Organization" || currentUser.u_category === "Organization") {
      return currentUser.organizationName || currentUser.u_organization_name;
    }
    if (currentUser.category === "Barangay" || currentUser.u_category === "Barangay") {
      const barangay = currentUser.barangay || currentUser.u_barangay;
      return `Barangay ${barangay}`;
    }
    return null;
  };

  const sourceOrganization = getSourceOrganization();

  const getEntityName = () => sourceOrganization || "Partner Organization";

  const barangays = [
    "Agusan", "Baikingon", "Balubal", "Balulang", "Barangay 1", "Barangay 2",
    "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6", "Barangay 7",
    "Barangay 8", "Barangay 9", "Barangay 10", "Barangay 11", "Barangay 12",
    "Barangay 13", "Barangay 14", "Barangay 15", "Barangay 16", "Barangay 17",
    "Barangay 18", "Barangay 19", "Barangay 20", "Barangay 21", "Barangay 22",
    "Barangay 23", "Barangay 24", "Barangay 25", "Barangay 26", "Barangay 27",
    "Barangay 28", "Barangay 29", "Barangay 30", "Barangay 31", "Barangay 32",
    "Barangay 33", "Barangay 34", "Barangay 35", "Barangay 36", "Barangay 37",
    "Barangay 38", "Barangay 39", "Barangay 40", "Bayabas", "Bayanga", "Besigan",
    "Bonbon", "Bugo", "Bulua", "Camaman-an", "Canito-an", "Carmen", "Consolacion",
    "Cugman", "Dansolihon", "F. S. Catanico", "Gusa", "Indahag", "Iponan",
    "Kauswagan", "Lapasan", "Lumbia", "Macabalan", "Macasandig", "Mambuaya",
    "Nazareth", "Pagalungan", "Pagatpat", "Patag", "Pigsag-an", "Puerto",
    "Puntod", "San Simon", "Tablon", "Taglimao", "Tagpangi", "Tignapoloan",
    "Tuburan", "Tumpagon",
  ];

  const filteredBarangays = barangaySearch
    ? barangays.filter((b) => b.toLowerCase().startsWith(barangaySearch.toLowerCase()))
    : [];

  // Load donor records on mount and when sourceOrganization changes
  useEffect(() => {
    if (sourceOrganization) {
      loadDonorRecords();
    }
  }, [sourceOrganization]);

  const loadDonorRecords = async () => {
    try {
      setLoading(true);
      if (window.electronAPI && sourceOrganization) {
        const records = await window.electronAPI.getDonorRecordsOrg(sourceOrganization);
        setDonorData(records || []);
      }
    } catch (error) {
      console.error("Error loading donor records:", error);
      setDonorData([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowSelection = (id) => {
    setDonorData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleAllSelection = () => {
    const allSelected = donorData.every((item) => item.selected);
    setDonorData((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const clearAllSelection = () => {
    setDonorData((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const selectedCount = donorData.filter((item) => item.selected).length;
  const allSelected = donorData.length > 0 && donorData.every((item) => item.selected);
  const someSelected = donorData.some((item) => item.selected) && !allSelected;
  const singleSelected = selectedCount === 1;

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "birthdate" && value) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        updated.age = age.toString();
      }
      return updated;
    });
    if (validationErrors[field]) {
      setValidationErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  const handleBarangayInputChange = (value) => {
    setFormData((prev) => ({ ...prev, address: value }));
    setBarangaySearch(value);
    setShowBarangayDropdown(value.length > 0);
  };

  const selectBarangay = (barangay) => {
    setFormData((prev) => ({ ...prev, address: barangay }));
    setBarangaySearch("");
    setShowBarangayDropdown(false);
  };

  const generateDonorId = async () => {
    try {
      if (window.electronAPI) {
        const nextId = await window.electronAPI.generateNextDonorIdOrg();
        console.log('Generated donor ID from backend:', nextId);
        setFormData((prev) => ({ ...prev, donorId: nextId }));
      } else {
        // Fallback: Generate a simple sequential ID
        // This should rarely be used as electronAPI should always be available
        const fallbackId = `DNR-${Date.now().toString().slice(-7)}`;
        console.warn('ElectronAPI not available, using fallback ID:', fallbackId);
        setFormData((prev) => ({ ...prev, donorId: fallbackId }));
      }
    } catch (err) {
      console.error("Error generating donor ID:", err);
      // On error, still try to generate something unique
      const errorFallbackId = `DNR-${Date.now().toString().slice(-7)}`;
      console.warn('Error occurred, using error fallback ID:', errorFallbackId);
      setFormData((prev) => ({ ...prev, donorId: errorFallbackId }));
    }
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    setValidationErrors({});
    setFormData({
      donorId: "", firstName: "", middleName: "", lastName: "", gender: "",
      birthdate: "", age: "", bloodType: "", rhFactor: "", contactNumber: "",
      address: "", recentDonation: "", donationCount: "",
    });
    await generateDonorId();
  };

  const handleAddDonor = async () => {
    const errors = {};
    if (!formData.firstName?.trim()) errors.firstName = "First Name is required";
    if (!formData.lastName?.trim()) errors.lastName = "Last Name is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.birthdate) errors.birthdate = "Birthdate is required";
    if (!formData.bloodType) errors.bloodType = "Blood Type is required";
    if (!formData.rhFactor) errors.rhFactor = "RH Factor is required";
    if (!formData.contactNumber?.trim()) errors.contactNumber = "Contact Number is required";
    if (!formData.address?.trim()) errors.address = "Address/Barangay is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      if (window.electronAPI && sourceOrganization) {
        await window.electronAPI.addDonorRecordOrg(formData, sourceOrganization);
        await loadDonorRecords();
      }
      setShowAddModal(false);
      setValidationErrors({});
      
      setSuccessMessage({
        title: "Donor Added Successfully!",
        description: "New donor record has been added to the system.",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error adding donor:", err);
      setValidationErrors({ save: `Failed to add donor: ${err.message}` });
    }
  };

  const handleEditClick = () => {
    const selected = donorData.find((item) => item.selected);
    if (selected) {
      const formatDate = (date) => {
        if (!date) return "";
        if (date === "No donations") return "";
        const d = new Date(date);
        const adjustedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return adjustedDate.toISOString().split("T")[0];
      };

      setEditingDonor({
        ...selected,
        birthdate: formatDate(selected.birthdate),
        recentDonation: formatDate(selected.recentDonation),
        donationCount: selected.donationCount || 0,
      });
      setShowEditModal(true);
      setEditValidationErrors({});
    }
  };

  const handleEditDonorChange = (field, value) => {
    const updated = { ...editingDonor, [field]: value };
    if (field === "birthdate" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      updated.age = age.toString();
    }
    setEditingDonor(updated);
    
    if (editValidationErrors[field]) {
      setEditValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSaveEdit = async () => {
    const errors = {};
    if (!editingDonor.firstName?.trim()) errors.firstName = "First Name is required";
    if (!editingDonor.lastName?.trim()) errors.lastName = "Last Name is required";
    if (!editingDonor.gender) errors.gender = "Gender is required";
    if (!editingDonor.birthdate) errors.birthdate = "Birthdate is required";
    if (!editingDonor.bloodType) errors.bloodType = "Blood Type is required";
    if (!editingDonor.rhFactor) errors.rhFactor = "RH Factor is required";
    if (!editingDonor.contactNumber?.trim()) errors.contactNumber = "Contact Number is required";
    if (!editingDonor.address?.trim()) errors.address = "Address/Barangay is required";

    if (Object.keys(errors).length > 0) {
      setEditValidationErrors(errors);
      return;
    }

    try {
      if (window.electronAPI && sourceOrganization) {
        const donorUpdateData = {
          donorId: editingDonor.donorId,
          firstName: editingDonor.firstName,
          middleName: editingDonor.middleName,
          lastName: editingDonor.lastName,
          gender: editingDonor.gender,
          birthdate: editingDonor.birthdate,
          age: editingDonor.age,
          bloodType: editingDonor.bloodType,
          rhFactor: editingDonor.rhFactor,
          contactNumber: editingDonor.contactNumber,
          address: editingDonor.address,
          recentDonation: editingDonor.recentDonation || null,
          donationCount: editingDonor.donationCount || 0,
        };

        await window.electronAPI.updateDonorRecordOrg(editingDonor.id, donorUpdateData, sourceOrganization);
        await loadDonorRecords();
      }
      setShowEditModal(false);
      setEditingDonor(null);
      setEditValidationErrors({});
      clearAllSelection();

      setSuccessMessage({
        title: "Donor Updated Successfully!",
        description: "The donor record information has been updated.",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error updating donor:", err);
      setEditValidationErrors({ save: `Failed to update donor: ${err.message}` });
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const selectedIds = donorData.filter((item) => item.selected).map((item) => item.id);
    if (selectedIds.length === 0) return;

    try {
      if (window.electronAPI && sourceOrganization) {
        await window.electronAPI.deleteDonorRecordsOrg(selectedIds, sourceOrganization);
        await loadDonorRecords();
      }
      setShowConfirmDeleteModal(false);
      clearAllSelection();

      setSuccessMessage({
        title: "Deleted Successfully!",
        description: `${selectedIds.length} donor record(s) have been deleted.`,
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error deleting donors:", err);
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    try {
      if (!term.trim()) {
        await loadDonorRecords();
        return;
      }
      if (window.electronAPI && sourceOrganization) {
        const results = await window.electronAPI.searchDonorRecordsOrg(term, sourceOrganization);
        setDonorData(results || []);
      }
    } catch (err) {
      console.error("Error searching donors:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
        Loading donor records...
      </div>
    );
  }

  return (
    <div className="donor-record-content">
      <div className="donor-header">
        <h1 className="donor-title">{getEntityName()}</h1>
        <p className="donor-subtitle">Local Donor Record</p>
      </div>

      <div className="controls-bar">
        <div className="left-controls">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              className="search-input"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="right-controls">
          <button className="sort-button">
            <span>Sort by</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
            </svg>
          </button>
          <button className="filter-button">
            <Filter size={16} /><span>Filter</span>
          </button>
          <button className="sync-button">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Request Sync</span>
          </button>
          <button className="add-button" onClick={openAddModal}>
            <Plus size={16} /><span>Add Donor</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="donor-table">
          <thead className="table-head">
            <tr>
              <th className="table-header">
                <input type="checkbox" className="checkbox" checked={allSelected}
                  ref={(input) => { if (input) input.indeterminate = someSelected; }}
                  onChange={toggleAllSelection} />
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
              <th className="table-header">DONATION COUNT</th>
              <th className="table-header">RECENT DONATION</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {donorData.length === 0 ? (
              <tr><td colSpan="16" style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                No donor records found
              </td></tr>
            ) : (
              donorData.map((item, index) => (
                <tr key={item.id} className={`table-row ${index % 2 === 1 ? 'row-even' : ''} ${item.selected ? 'row-selected' : ''}`}>
                  <td className="table-cell">
                    <input type="checkbox" className="checkbox" checked={item.selected} onChange={() => toggleRowSelection(item.id)} />
                  </td>
                  <td className="table-cell">{item.donorId}</td>
                  <td className="table-cell">{item.firstName}</td>
                  <td className="table-cell">{item.middleName || '-'}</td>
                  <td className="table-cell">{item.lastName}</td>
                  <td className="table-cell">{item.gender}</td>
                  <td className="table-cell">{item.birthdate}</td>
                  <td className="table-cell">{item.age}</td>
                  <td className="table-cell">{item.bloodType}</td>
                  <td className="table-cell">{item.rhFactor}</td>
                  <td className="table-cell">{item.contactNumber}</td>
                  <td className="table-cell">{item.address}</td>
                  <td className="table-cell">{item.donationCount || 0}</td>
                  <td className="table-cell">{item.recentDonation || 'No donations'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div className="action-bar">
          <button className="close-button" onClick={clearAllSelection}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="counter-section">
            <span className="counter-text">{selectedCount} {selectedCount === 1 ? "item" : "items"} selected</span>
          </div>
          {singleSelected && (
            <button className="edit-button" onClick={handleEditClick}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          )}
          <button className="delete-button" onClick={handleDeleteClick}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Add Donor Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowAddModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, width: '95%', maxWidth: 950, maxHeight: '95vh', overflow: 'hidden', boxShadow: '0 20px 25px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#165C3C', margin: 0, fontFamily: 'Barlow' }}>Donor Record</h2>
                <p style={{ fontSize: 16, color: '#6b7280', margin: '4px 0 0 0', fontFamily: 'Barlow' }}>Add Donor</p>
              </div>
              <button style={{ fontSize: 28, color: '#6b7280', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div style={{ padding: '24px 30px', maxHeight: 'calc(85vh - 160px)', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Donor ID (Auto-generated)</label>
                  <input type="text" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', backgroundColor: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }} value={formData.donorId} readOnly disabled />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>First Name</label>
                  <input type="text" style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', border: `1px solid ${validationErrors.firstName ? '#ef4444' : '#d1d5db'}` }} value={formData.firstName} onChange={(e) => handleFormChange('firstName', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Middle Name (Optional)</label>
                  <input type="text" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow' }} value={formData.middleName} onChange={(e) => handleFormChange('middleName', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Last Name</label>
                  <input type="text" style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', border: `1px solid ${validationErrors.lastName ? '#ef4444' : '#d1d5db'}` }} value={formData.lastName} onChange={(e) => handleFormChange('lastName', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Gender</label>
                  <select style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', cursor: 'pointer', backgroundColor: 'white', border: `1px solid ${validationErrors.gender ? '#ef4444' : '#d1d5db'}` }} value={formData.gender} onChange={(e) => handleFormChange('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Birthdate</label>
                  <input type="date" style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', border: `1px solid ${validationErrors.birthdate ? '#ef4444' : '#d1d5db'}` }} value={formData.birthdate} onChange={(e) => handleFormChange('birthdate', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Age (Auto-calculated)</label>
                  <input type="text" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', backgroundColor: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }} value={formData.age} readOnly disabled />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Blood Type</label>
                  <select style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', cursor: 'pointer', backgroundColor: 'white', border: `1px solid ${validationErrors.bloodType ? '#ef4444' : '#d1d5db'}` }} value={formData.bloodType} onChange={(e) => handleFormChange('bloodType', e.target.value)}>
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>RH Factor</label>
                  <select style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', cursor: 'pointer', backgroundColor: 'white', border: `1px solid ${validationErrors.rhFactor ? '#ef4444' : '#d1d5db'}` }} value={formData.rhFactor} onChange={(e) => handleFormChange('rhFactor', e.target.value)}>
                    <option value="">Select</option>
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Contact Number</label>
                  <input type="tel" maxLength={11} style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', border: `1px solid ${validationErrors.contactNumber ? '#ef4444' : '#d1d5db'}` }} value={formData.contactNumber} onChange={(e) => handleFormChange('contactNumber', e.target.value.replace(/\D/g, ''))} placeholder="09XXXXXXXXX" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Recent Donation</label>
                  <input type="date" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow' }} value={formData.recentDonation} onChange={(e) => handleFormChange('recentDonation', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Donation Count</label>
                  <input type="number" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow' }} value={formData.donationCount} onChange={(e) => handleFormChange('donationCount', e.target.value)} />
                </div>
                <div style={{ position: 'relative', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block', fontFamily: 'Barlow' }}>Barangay</label>
                  <input type="text" style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', width: '100%', boxSizing: 'border-box', border: `1px solid ${validationErrors.address ? '#ef4444' : '#d1d5db'}` }} value={formData.address || barangaySearch} onChange={(e) => handleBarangayInputChange(e.target.value)} onFocus={() => { if (barangaySearch) setShowBarangayDropdown(true); }} placeholder="Type to search barangay..." />
                  {showBarangayDropdown && filteredBarangays.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: 200, overflowY: 'auto', backgroundColor: 'white', border: '1px solid #d1d5db', borderTop: 'none', borderRadius: '0 0 4px 4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10 }}>
                      {filteredBarangays.map((b) => (
                        <div key={b} style={{ padding: '8px 10px', fontSize: 11, fontFamily: 'Barlow', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }} onClick={() => selectBarangay(b)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>{b}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(validationErrors).length > 0 && (
                <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 6, marginTop: 16, fontSize: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    {validationErrors.save && <div style={{ marginBottom: 4 }}>{validationErrors.save}</div>}
                    {Object.entries(validationErrors).filter(([k]) => k !== 'save').map(([k, msg]) => (
                      <div key={k} style={{ marginBottom: 4 }}>• {msg}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 30px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center', backgroundColor: 'white' }}>
              <button style={{ padding: '12px 48px', backgroundColor: '#FFC200', color: 'black', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600, fontFamily: 'Barlow' }} onClick={handleAddDonor}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Donor Modal */}
      {showEditModal && editingDonor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowEditModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, width: '95%', maxWidth: 950, maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 20px 25px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#165C3C', margin: 0, fontFamily: 'Barlow' }}>Donor Record</h2>
                <p style={{ fontSize: 16, color: '#6b7280', margin: '4px 0 0 0', fontFamily: 'Barlow' }}>Edit Donor</p>
              </div>
              <button style={{ fontSize: 28, color: '#6b7280', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }} onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <div style={{ padding: '24px 30px', maxHeight: 'calc(85vh - 160px)', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Donor ID</label>
                  <input type="text" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', backgroundColor: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }} value={editingDonor.donorId} readOnly disabled />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>First Name</label>
                  <input type="text" style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', border: `1px solid ${editValidationErrors.firstName ? '#ef4444' : '#d1d5db'}` }} value={editingDonor.firstName} onChange={(e) => handleEditDonorChange('firstName', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Middle Name (Optional)</label>
                  <input type="text" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow' }} value={editingDonor.middleName || ''} onChange={(e) => handleEditDonorChange('middleName', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Last Name</label>
                  <input type="text" style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', border: `1px solid ${editValidationErrors.lastName ? '#ef4444' : '#d1d5db'}` }} value={editingDonor.lastName} onChange={(e) => handleEditDonorChange('lastName', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Gender</label>
                  <select style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', cursor: 'pointer', backgroundColor: 'white', border: `1px solid ${editValidationErrors.gender ? '#ef4444' : '#d1d5db'}` }} value={editingDonor.gender} onChange={(e) => handleEditDonorChange('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Birthdate</label>
                  <input type="date" style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', border: `1px solid ${editValidationErrors.birthdate ? '#ef4444' : '#d1d5db'}` }} value={editingDonor.birthdate} onChange={(e) => handleEditDonorChange('birthdate', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Age (Auto-calculated)</label>
                  <input type="text" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', backgroundColor: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }} value={editingDonor.age} readOnly disabled />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Blood Type</label>
                  <select style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', cursor: 'pointer', backgroundColor: 'white', border: `1px solid ${editValidationErrors.bloodType ? '#ef4444' : '#d1d5db'}` }} value={editingDonor.bloodType} onChange={(e) => handleEditDonorChange('bloodType', e.target.value)}>
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>RH Factor</label>
                  <select style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', cursor: 'pointer', backgroundColor: 'white', border: `1px solid ${editValidationErrors.rhFactor ? '#ef4444' : '#d1d5db'}` }} value={editingDonor.rhFactor} onChange={(e) => handleEditDonorChange('rhFactor', e.target.value)}>
                    <option value="">Select</option>
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Contact Number</label>
                  <input type="tel" maxLength={11} style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', border: `1px solid ${editValidationErrors.contactNumber ? '#ef4444' : '#d1d5db'}` }} value={editingDonor.contactNumber} onChange={(e) => handleEditDonorChange('contactNumber', e.target.value.replace(/\D/g, ''))} placeholder="09XXXXXXXXX" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Recent Donation</label>
                  <input type="date" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow' }} value={editingDonor.recentDonation || ''} onChange={(e) => handleEditDonorChange('recentDonation', e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, fontFamily: 'Barlow' }}>Donation Count</label>
                  <input type="number" style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow' }} value={editingDonor.donationCount || 0} onChange={(e) => handleEditDonorChange('donationCount', e.target.value)} />
                </div>
                <div style={{ position: 'relative', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block', fontFamily: 'Barlow' }}>Barangay</label>
                  <input type="text" style={{ padding: '7px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'Barlow', width: '100%', boxSizing: 'border-box', border: `1px solid ${editValidationErrors.address ? '#ef4444' : '#d1d5db'}` }} value={editingDonor.address} onChange={(e) => handleEditDonorChange('address', e.target.value)} placeholder="Type to search barangay..." />
                </div>
              </div>

              {Object.keys(editValidationErrors).length > 0 && (
                <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 6, marginTop: 16, fontSize: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    {editValidationErrors.save && <div style={{ marginBottom: 4 }}>{editValidationErrors.save}</div>}
                    {Object.entries(editValidationErrors).filter(([k]) => k !== 'save').map(([k, msg]) => (
                      <div key={k} style={{ marginBottom: 4 }}>• {msg}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 30px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center', backgroundColor: 'white' }}>
              <button style={{ padding: '12px 48px', backgroundColor: '#FFC200', color: 'black', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600, fontFamily: 'Barlow' }} onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowConfirmDeleteModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, width: '95%', maxWidth: 900, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 20px 25px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', fontFamily: 'Barlow' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 30px', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#165C3C', margin: 0, fontFamily: 'Barlow' }}>Confirm Delete</h3>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0, fontFamily: 'Barlow' }}>Review donors before deletion</p>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: 20, color: '#6b7280', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 4 }} onClick={() => setShowConfirmDeleteModal(false)}>×</button>
            </div>

            <div style={{ flex: 1, padding: 30, overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#991b1b', margin: '0 0 12px 0' }}>
                  Donors to Delete ({donorData.filter((item) => item.selected).length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr', gap: 12, fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                  <div>Donor ID</div>
                  <div>Full Name</div>
                  <div>Address</div>
                  <div>Blood Type</div>
                  <div>Contact</div>
                </div>
                {donorData.filter((item) => item.selected).map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr', gap: 12, fontSize: 12, color: '#6b7280', padding: '8px 0', borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                    <div style={{ fontWeight: 500, color: '#374151' }}>{item.donorId}</div>
                    <div>{`${item.firstName} ${item.middleName || ''} ${item.lastName}`.trim()}</div>
                    <div>{item.address}</div>
                    <div>{item.bloodType}{item.rhFactor}</div>
                    <div>{item.contactNumber}</div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444', borderRadius: 8, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <svg width="20" height="20" fill="#ef4444" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', margin: '0 0 4px 0' }}>Confirm Delete Action</p>
                  <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
                    These donors will be permanently deleted from the records. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 30px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center', gap: 12, backgroundColor: 'white' }}>
              <button style={{ padding: '12px 48px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600, fontFamily: 'Barlow', minWidth: 120 }} onClick={handleConfirmDelete}>
                Confirm Delete ({donorData.filter((item) => item.selected).length} donors)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 10 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 11, width: '30%', maxWidth: 350, padding: '40px 30px 30px', boxShadow: '0 20px 25px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Barlow', position: 'relative' }}>
            <button style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 4 }} onClick={() => setShowSuccessModal(false)}>×</button>

            <div style={{ width: 30, height: 30, backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="48" height="48" fill="white" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#165C3C', textAlign: 'center', fontFamily: 'Barlow' }}>{successMessage.title}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 1.5, fontFamily: 'Barlow', marginTop: -5, paddingLeft: 20, paddingRight: 20 }}>{successMessage.description}</p>

            <button style={{ padding: '12px 60px', backgroundColor: '#FFC200', color: 'black', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600, fontFamily: 'Barlow' }} onClick={() => setShowSuccessModal(false)}>OK</button>
          </div>
        </div>
      )}

      <style>{`
        .donor-record-content { padding: 24px; background-color: #f9fafb; min-height: 100vh; font-family: Barlow; border-radius: 8px; }
        .donor-header { margin: 0; }
        .donor-title { font-size: 24px; font-weight: bold; color: #165C3C; margin-top: 1px; font-family: Barlow; }
        .donor-subtitle { color: #6b7280; font-size: 14px; margin-top: -7px; font-family: Barlow; }
        .controls-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; background-color: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); }
        .left-controls { display: flex; align-items: center; gap: 16px; }
        .search-container { position: relative; display: flex; align-items: center; }
        .search-input { padding-left: 40px; padding-right: 16px; padding-top: 8px; padding-bottom: 8px; border: 1px solid #d1d5db; border-radius: 6px; width: 300px; font-size: 14px; outline: none; }
        .search-icon { position: absolute; left: 12px; z-index: 1; color: #9ca3af; }
        .right-controls { display: flex; align-items: center; gap: 12px; }
        .sort-button { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background-color: white; cursor: pointer; font-size: 14px; color: #374151; }
        .filter-button { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .sync-button { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: #2C58DC; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .add-button { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: #FFC200; color: black; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .table-container { 
          background-color: white; 
          border-radius: 8px; 
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); 
          overflow: hidden; 
          overflow-x: auto;  /* Changed from overflow-x: auto to just this */
        }
        .donor-table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        .table-head { background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .table-header { 
          padding: 12px 16px; 
          text-align: left; 
          font-size: 10px; 
          font-weight: 500; 
          color: #6b7280; 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
          border-bottom: 1px solid #e5e7eb; 
          white-space: nowrap; 
          width: auto;  /* Changed from width: 12% */
        }
        .donor-id-col { 
          width: auto;  /* Changed from width: 11% */
        }
        .table-body { background-color: white; }
        .table-row { border-bottom: 1px solid #A3A3A3; }
        .row-even { background-color: #f9fafb; }
        .row-selected { background-color: #e6f7ff; }
        .table-cell { padding: 12px 16px; font-size: 11px; font-family: Arial; color: #111827; border-bottom: 1px solid rgba(163,163,163,0.2); white-space: nowrap; }
        .checkbox { width: 16px; height: 16px; cursor: pointer; }
        .action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 0; background: #4a5568; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border-radius: 8px; z-index: 1000; color: white; overflow: hidden; }
        .close-button { display: flex; align-items: center; justify-content: center; padding: 12px 16px; background-color: #4a5568; color: white; border: none; cursor: pointer; font-size: 16px; border-right: 1px solid #2d3748; }
        .counter-section { padding: 12px 24px; background-color: #4a5568; border-right: 1px solid #2d3748; }
        .counter-text { font-size: 14px; font-weight: 500; color: white; margin: 0; }
        .edit-button { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background-color: #4a5568; color: white; border: none; cursor: pointer; font-size: 14px; border-right: 1px solid #2d3748; }
        .delete-button { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background-color: #4a5568; color: white; border: none; cursor: pointer; font-size: 14px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// Logout Confirmation Dialog Component
const LogoutDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onCancel}>×</button>
        <div className="icon-container">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h3 className="dialog-title">Confirm Logout</h3>
        <p className="dialog-message">Are you sure you want to logout from your account?</p>
        <div className="dialog-actions">
          <button className="dialog-button cancel-button" onClick={onCancel}>Cancel</button>
          <button className="dialog-button confirm-button" onClick={onConfirm}>Yes, Logout</button>
        </div>
      </div>
      <style>{`
        .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .dialog-content { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 400px; width: 90%; text-align: center; position: relative; }
        .close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; color: #9ca3af; cursor: pointer; }
        .icon-container { width: 64px; height: 64px; background-color: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .dialog-title { font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0 0 0.5rem 0; font-family: Barlow; }
        .dialog-message { color: #6b7280; margin: 0 0 2rem 0; font-size: 0.875rem; font-family: Barlow; }
        .dialog-actions { display: flex; gap: 0.75rem; justify-content: center; }
        .dialog-button { padding: 0.625rem 1.5rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; min-width: 100px; }
        .cancel-button { background-color: #f3f4f6; color: #374151; }
        .cancel-button:hover { background-color: #e5e7eb; }
        .confirm-button { background-color: #ef4444; color: white; }
        .confirm-button:hover { background-color: #dc2626; }
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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.id && window.electronAPI && typeof window.electronAPI.getUserById === 'function') {
            try {
              const freshUserData = await window.electronAPI.getUserById(user.id);
              if (freshUserData) {
                setCurrentUser(freshUserData);
                localStorage.setItem("user", JSON.stringify(freshUserData));
              } else {
                setCurrentUser(user);
              }
            } catch (error) {
              setCurrentUser(user);
            }
          } else {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error("Error loading current user:", error);
      }
    };
    loadCurrentUser();
  }, []);

  const toggleSidePanel = () => setIsSidePanelOpen(!isSidePanelOpen);
  const handleNavigate = (screen) => {
    setActiveScreen(screen);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };
  const toggleCalendarDropdown = () => { setIsCalendarDropdownOpen(!isCalendarDropdownOpen); setIsProfileDropdownOpen(false); setIsMailDropdownOpen(false); setIsNotificationDropdownOpen(false); };
  const toggleMailDropdown = () => { setIsMailDropdownOpen(!isMailDropdownOpen); setIsProfileDropdownOpen(false); setIsCalendarDropdownOpen(false); setIsNotificationDropdownOpen(false); };
  const toggleNotificationDropdown = () => { setIsNotificationDropdownOpen(!isNotificationDropdownOpen); setIsProfileDropdownOpen(false); setIsCalendarDropdownOpen(false); setIsMailDropdownOpen(false); };
  const toggleProfileDropdown = () => { setIsProfileDropdownOpen(!isProfileDropdownOpen); setIsCalendarDropdownOpen(false); setIsMailDropdownOpen(false); setIsNotificationDropdownOpen(false); };

  const handleProfileAction = (action) => {
    if (action === "edit-profile") setActiveScreen("profile");
    else if (action === "logout") setShowLogoutDialog(true);
    setIsProfileDropdownOpen(false);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    localStorage.removeItem("user_org");
    localStorage.removeItem("user");
    navigate("/login-org", { replace: true });
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "mail-org": return <MailOrg />;
      case "calendar-org": return <CalendarOrg />;
      case "notification-org": return <NotificationOrg />;
      case "profile-org": return <ProfileOrg />;
      case "appointment-org": return <AppointmentOrg />;
      case "recent-activity-org": return <RecentActivityOrg />;
      default: return <DonorRecordContent currentUser={currentUser} />;
    }
  };

  return (
    <div className="dashboard-container">
      <SidePanelOrg isOpen={isSidePanelOpen} onToggle={toggleSidePanel} activeScreen={activeScreen} onNavigate={handleNavigate} />
      <div className="main-content-wrapper" style={{ marginLeft: isSidePanelOpen ? "15rem" : "4rem" }}>
        <nav className="nav-bar">
          <div className="nav-content">
            <div className="nav-left"></div>
            <div className="nav-right">
              <div className="dropdown-container">
                <button className={`nav-button ${activeScreen === "calendar" ? "nav-button-active" : ""}`} onClick={toggleCalendarDropdown}>
                  <Calendar className="w-5 h-5 text-gray-600" />
                </button>
                {isCalendarDropdownOpen && (
                  <div className="dropdown-menu requests-dropdown">
                    <div className="dropdown-header"><h3 className="dropdown-title">REQUESTS</h3></div>
                    <div className="dropdown-content">
                      <div className="dropdown-item"><div className="request-icon"><div className="icon-circle red-bg"><span>🩸</span></div></div><div className="request-details"><p className="request-title">Blood letting Drive Request</p><p className="request-subtitle">Tacloban would like to have a schedule...</p></div></div>
                    </div>
                    <div className="dropdown-footer"><button className="footer-button" onClick={() => handleNavigate("calendar-org")}>See All Requests</button></div>
                  </div>
                )}
              </div>
              <div className="dropdown-container">
                <button className={`nav-button ${activeScreen === "mail" ? "nav-button-active" : ""}`} onClick={toggleMailDropdown}>
                  <Mail className="w-5 h-5 text-gray-600" />
                </button>
                {isMailDropdownOpen && (
                  <div className="dropdown-menu messages-dropdown">
                    <div className="dropdown-header"><h3 className="dropdown-title">MESSAGES</h3></div>
                    <div className="dropdown-content">
                      <div className="dropdown-item"><div className="message-avatar blue-avatar">JS</div><div className="message-details"><p className="message-sender">John Smith</p><p className="message-preview">Thank you for the quick response...</p></div></div>
                    </div>
                    <div className="dropdown-footer"><button className="footer-button" onClick={() => handleNavigate("mail-org")}>View All Messages</button></div>
                  </div>
                )}
              </div>
              <div className="dropdown-container">
                <button className={`nav-button ${activeScreen === "notification" ? "nav-button-active" : ""}`} onClick={toggleNotificationDropdown}>
                  <Bell className="w-5 h-5 text-gray-600" /><span className="notification-badge">3</span>
                </button>
                {isNotificationDropdownOpen && (
                  <div className="dropdown-menu notifications-dropdown">
                    <div className="dropdown-header"><h3 className="dropdown-title">NOTIFICATIONS</h3></div>
                    <div className="dropdown-content">
                      <div className="dropdown-item"><div className="notification-icon"><div className="icon-circle red-bg"><span>🩸</span></div></div><div className="notification-details"><p className="notification-title">Blood Stock Update</p><p className="notification-subtitle">Current stored blood: 628 units.</p></div></div>
                    </div>
                    <div className="dropdown-footer"><button className="footer-button" onClick={() => handleNavigate("notification-org")}>See All Notifications</button></div>
                  </div>
                )}
              </div>
              <div className="user-section">
                <span className="user-name">{currentUser?.fullName || "Loading..."}</span>
                <div className="dropdown-container">
                  <div className={`user-avatar ${activeScreen === "profile" ? "user-avatar-active" : ""}`} onClick={toggleProfileDropdown}>
                    {currentUser?.profileImage ? (
                      <img src={currentUser.profileImage} alt={currentUser.fullName || "User"} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  {isProfileDropdownOpen && (
                    <div className="dropdown-menu profile-dropdown">
                      <button className="profile-menu-item" onClick={() => handleNavigate("profile-org")}>My Profile</button>
                      <button className="profile-menu-item" onClick={() => handleProfileAction("logout")}>Log Out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="main-content">{renderActiveScreen()}</main>
      </div>
      <LogoutDialog isOpen={showLogoutDialog} onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutDialog(false)} />
      <style>{`
        body { margin: 0; }
        .dashboard-container { min-height: 100vh; background-color: #edf4e6; position: relative; overflow-x: hidden; }
        .main-content-wrapper { position: relative; min-height: 100vh; transition: margin-left 0.3s ease-in-out; }
        .nav-bar { background-color: white; border-bottom: 1px solid #e5e7eb; padding: 0.75rem 1rem; position: sticky; top: 0; z-index: 30; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .nav-content { display: flex; align-items: center; justify-content: space-between; }
        .nav-left { display: flex; align-items: center; gap: 1rem; }
        .nav-right { display: flex; align-items: center; gap: 0.75rem; }
        .dropdown-container { position: relative; }
        .nav-button { padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s; border: none; background: none; cursor: pointer; position: relative; }
        .nav-button:hover { background-color: #f3f4f6; }
        .nav-button-active { background-color: #059669 !important; }
        .notification-badge { position: absolute; top: 2px; right: 2px; background-color: #ef4444; color: white; font-size: 0.625rem; font-weight: bold; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; }
        .dropdown-menu { position: absolute; right: 0; top: 100%; margin-top: 0.5rem; background: white; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; z-index: 50; overflow: hidden; }
        .requests-dropdown, .messages-dropdown { width: 320px; }
        .notifications-dropdown { width: 300px; }
        .profile-dropdown { width: 160px; }
        .dropdown-header { background-color: #059669; padding: 0.75rem 1rem; color: white; }
        .dropdown-title { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; color: white; margin: 0; }
        .dropdown-content { max-height: 300px; overflow-y: auto; }
        .dropdown-item { padding: 0.875rem 1rem; border-bottom: 1px solid #f3f4f6; display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; }
        .dropdown-item:hover { background-color: #f9fafb; }
        .icon-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .red-bg { background-color: #ef4444; color: white; }
        .request-details, .notification-details, .message-details { flex: 1; min-width: 0; }
        .request-title, .notification-title, .message-sender { font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0 0 0.25rem 0; }
        .request-subtitle, .notification-subtitle, .message-preview { font-size: 0.75rem; color: #6b7280; margin: 0; }
        .message-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.75rem; color: white; }
        .blue-avatar { background-color: #3b82f6; }
        .dropdown-footer { padding: 0.75rem 1rem; border-top: 1px solid #f3f4f6; background-color: #f9fafb; text-align: center; }
        .footer-button { background: none; border: none; color: #059669; font-size: 0.875rem; font-weight: 500; cursor: pointer; width: 100%; }
        .profile-menu-item { display: block; width: 100%; text-align: left; padding: 0.75rem 1rem; font-size: 0.875rem; color: #374151; background: none; border: none; cursor: pointer; border-bottom: 1px solid #f3f4f6; }
        .profile-menu-item:hover { background-color: #f3f4f6; }
        .user-section { display: flex; align-items: center; gap: 0.75rem; padding-left: 0.75rem; border-left: 1.4px solid #e5e7eb; }
        .user-name { font-size: 0.875rem; font-weight: 500; color: #374151; font-family: Barlow; }
        .user-avatar { width: 2rem; height: 2rem; background-color: #d1d5db; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .user-avatar:hover { background-color: #9ca3af; }
        .user-avatar-active { background-color: #059669 !important; }
        .main-content { padding: 1.5rem; }
      `}</style>
    </div>
  );
};

export default DonorRecordOrg;