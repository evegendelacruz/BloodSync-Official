import React, { useState, useEffect, useRef } from "react";
import { Plus, Filter, Search } from "lucide-react";
// --- ADD THESE IMPORTS ---
import Loader from "../../components/Loader";
import SyncConfirmModal from "../../components/SyncConfirmModal";
import SyncSuccessModal from "../../components/SyncSuccessModal";

const DonorRecord = () => {
  const [donorData, setDonorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchDonorTerm, setSearchDonorTerm] = useState("");
  const [barangaySearch, setBarangaySearch] = useState("");
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "sortby",
    direction: "asc",
  });
  const [filterConfig, setFilterConfig] = useState({ field: "", value: "" });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });
  // --- ADD THESE NEW STATES ---
  const [pendingSyncRequests, setPendingSyncRequests] = useState([]);
  const [isApprovingSync, setIsApprovingSync] = useState(false);
  const [showApproveSyncConfirmModal, setShowApproveSyncConfirmModal] = useState(false);
  const [showApproveSyncSuccessModal, setShowApproveSyncSuccessModal] = useState(false);
  const [showApproveLoader, setShowApproveLoader] = useState(false);
  const [approvedDonorCount, setApprovedDonorCount] = useState(0);
  // --- END OF NEW STATES ---
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState(null);
  const [editingDonor, setEditingDonor] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    donorId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    birthdate: "",
    age: "",
    bloodType: "",
    rhFactor: "",
    status: "Non-Reactive",
    contactNumber: "",
    address: "",
    recentDonation: "",
    donationCount: "",
  });

  const barangays = [
    "Agusan",
    "Baikingon",
    "Balubal",
    "Balulang",
    "Barangay 1",
    "Barangay 2",
    "Barangay 3",
    "Barangay 4",
    "Barangay 5",
    "Barangay 6",
    "Barangay 7",
    "Barangay 8",
    "Barangay 9",
    "Barangay 10",
    "Barangay 11",
    "Barangay 12",
    "Barangay 13",
    "Barangay 14",
    "Barangay 15",
    "Barangay 16",
    "Barangay 17",
    "Barangay 18",
    "Barangay 19",
    "Barangay 20",
    "Barangay 21",
    "Barangay 22",
    "Barangay 23",
    "Barangay 24",
    "Barangay 25",
    "Barangay 26",
    "Barangay 27",
    "Barangay 28",
    "Barangay 29",
    "Barangay 30",
    "Barangay 31",
    "Barangay 32",
    "Barangay 33",
    "Barangay 34",
    "Barangay 35",
    "Barangay 36",
    "Barangay 37",
    "Barangay 38",
    "Barangay 39",
    "Barangay 40",
    "Bayabas",
    "Bayanga",
    "Besigan",
    "Bonbon",
    "Bugo",
    "Bulua",
    "Camaman-an",
    "Canito-an",
    "Carmen",
    "Consolacion",
    "Cugman",
    "Dansolihon",
    "F. S. Catanico",
    "Gusa",
    "Indahag",
    "Iponan",
    "Kauswagan",
    "Lapasan",
    "Lumbia",
    "Macabalan",
    "Macasandig",
    "Mambuaya",
    "Nazareth",
    "Pagalungan",
    "Pagatpat",
    "Patag",
    "Pigsag-an",
    "Puerto",
    "Puntod",
    "San Simon",
    "Tablon",
    "Taglimao",
    "Tagpangi",
    "Tignapoloan",
    "Tuburan",
    "Tumpagon",
  ];

  const filteredBarangays = barangaySearch
    ? barangays.filter((b) =>
        b.toLowerCase().startsWith(barangaySearch.toLowerCase())
      )
    : [];

  useEffect(() => {
    loadDonorData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target)
      ) {
        setShowSortDropdown(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDonorData = async () => {
    const startTime = Date.now(); // For minimum load time

    try {
      setLoading(true);
      setError(null);
      if (!window.electronAPI) {
        throw new Error(
          "Electron API not available. Make sure you are running this in an Electron environment."
        );
      }

      // Load from main donor_records table
      const data = await window.electronAPI.getAllDonorRecords();
      setDonorData(data);

      // Load pending sync requests
      const pendingRequests = await window.electronAPI.getPendingSyncRequests();
      setPendingSyncRequests(pendingRequests);

    } catch (err) {
      console.error("Error loading donor data:", err);
      setError(`Failed to load donor data: ${err.message}`);
    } finally {
      // Ensure minimum 1 second loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      setLoading(false);
    }
  };
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const filteredData = donorData.filter(
    (item) =>
      item.donorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.middleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bloodType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setShowSortDropdown(false);
  };

  const getSortedAndFilteredData = () => {
    let filtered = [...filteredData];

    if (filterConfig.field && filterConfig.value) {
      filtered = filtered.filter((item) => {
        const value = item[filterConfig.field];
        if (value === null || value === undefined) return false;
        return value
          .toString()
          .toLowerCase()
          .includes(filterConfig.value.toLowerCase());
      });
    }

    const sorted = filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number") {
        comparison = aVal - bVal;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  const displayData = getSortedAndFilteredData();
  const selectedCount = displayData.filter((item) => item.selected).length;
  const allSelected =
    displayData.length > 0 && displayData.every((item) => item.selected);
  const someSelected =
    displayData.some((item) => item.selected) && !allSelected;
  const singleSelected = selectedCount === 1;

  const getSortLabel = () => {
    const labels = {
      sort: "Sort by",
      donorId: "Donor ID",
      firstName: "First Name",
      lastName: "Last Name",
      bloodType: "Blood Type",
      age: "Age",
      gender: "Gender",
      address: "Address",
    };
    return labels[sortConfig.key] || "Sort by";
  };

  const toggleRowSelection = (id) => {
    setDonorData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = displayData.every((item) => item.selected);
    setDonorData((prevData) =>
      prevData.map((item) => {
        if (displayData.find((d) => d.id === item.id)) {
          return { ...item, selected: !allSelected };
        }
        return item;
      })
    );
  };

  const clearAllSelection = () => {
    setDonorData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  const handleDeleteClick = () => {
    const selectedDonors = donorData.filter((item) => item.selected);
    if (selectedDonors.length > 0) {
      setDonorToDelete(selectedDonors);
    }
    setShowConfirmDeleteModal(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }
      const selectedIds = donorData
        .filter((item) => item.selected)
        .map((item) => item.id);
      if (selectedIds.length === 0) return;

      await window.electronAPI.deleteDonorRecords(selectedIds);
      setShowConfirmDeleteModal(false);
      await loadDonorData();
      clearAllSelection();
      setError(null);

      setSuccessMessage({
        title: "Deleted Successfully!",
        description: `${selectedIds.length} donor record(s) have been deleted.`,
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error deleting donors:", err);
      setError("Failed to delete donors");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "birthdate" && value) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        updated.age = age.toString();
      }
      return updated;
    });
  };

  const handleEditClick = () => {
    const selected = donorData.find((item) => item.selected);
    if (selected) {
      const formatDate = (date) => {
        if (!date) return "";
        // Handle "No donations" text
        if (date === "No donations") return "";
        const d = new Date(date);
        const adjustedDate = new Date(
          d.getTime() - d.getTimezoneOffset() * 60000
        );
        return adjustedDate.toISOString().split("T")[0];
      };

      setEditingDonor({
        ...selected,
        status: selected.status || "Non-Reactive",
        birthdate: formatDate(selected.birthdate),
        recentDonation: formatDate(selected.recentDonation),
        donationCount: selected.donationCount || 0,
      });
      setShowEditModal(true);
    }
  };

  const handleEditDonorChange = (field, value) => {
    const updated = { ...editingDonor, [field]: value };
    if (field === "birthdate" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      updated.age = age.toString();
    }
    setEditingDonor(updated);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      if (!editingDonor.firstName?.trim()) {
        setError("First Name is required");
        setSaving(false);
        return;
      }
      if (!editingDonor.lastName?.trim()) {
        setError("Last Name is required");
        setSaving(false);
        return;
      }
      if (!editingDonor.gender) {
        setError("Gender is required");
        setSaving(false);
        return;
      }
      if (!editingDonor.birthdate) {
        setError("Birthdate is required");
        setSaving(false);
        return;
      }
      if (!editingDonor.bloodType) {
        setError("Blood Type is required");
        setSaving(false);
        return;
      }
      if (!editingDonor.rhFactor) {
        setError("RH Factor is required");
        setSaving(false);
        return;
      }
      if (!editingDonor.contactNumber?.trim()) {
        setError("Contact Number is required");
        setSaving(false);
        return;
      }
      if (!editingDonor.address?.trim()) {
        setError("Address/Barangay is required");
        setSaving(false);
        return;
      }

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
        status: editingDonor.status,
        contactNumber: editingDonor.contactNumber,
        address: editingDonor.address,
        recentDonation: editingDonor.recentDonation || null,
        donationCount: editingDonor.donationCount || 0,
      };

      await window.electronAPI.updateDonorRecord(
        editingDonor.id,
        donorUpdateData
      );
      setShowEditModal(false);
      setEditingDonor(null);
      await loadDonorData();
      clearAllSelection();
      setError(null);

      setSuccessMessage({
        title: "Donor Updated Successfully!",
        description: "The donor record information has been updated.",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error updating donor:", err);
      setError(`Failed to update donor: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBarangaySearch = (value) => {
    setBarangaySearch(value);
    setShowBarangayDropdown(value.length > 0);
  };

  const selectBarangay = (barangay) => {
    setFormData((prev) => ({ ...prev, address: barangay }));
    setBarangaySearch("");
    setShowBarangayDropdown(false);
  };

  const handleBarangayInputChange = (value) => {
    setFormData((prev) => ({ ...prev, address: value }));
    setBarangaySearch(value);
    setShowBarangayDropdown(value.length > 0);
  };

  const handleAddDonor = async () => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      console.log("Form Data before validation:", formData);

      if (!formData.firstName?.trim()) {
        setError("First Name is required");
        return;
      }
      if (!formData.lastName?.trim()) {
        setError("Last Name is required");
        return;
      }
      if (!formData.gender) {
        setError("Gender is required");
        return;
      }
      if (!formData.birthdate) {
        setError("Birthdate is required");
        return;
      }
      if (!formData.bloodType) {
        setError("Blood Type is required");
        return;
      }
      if (!formData.rhFactor) {
        setError("RH Factor is required");
        return;
      }
      if (!formData.contactNumber?.trim()) {
        setError("Contact Number is required");
        return;
      }
      if (!formData.address?.trim()) {
        setError("Address/Barangay is required");
        return;
      }

      if (!formData.donorId) {
        setError("Donor ID not generated. Please try again.");
        return;
      }

      console.log("Validation passed, saving donor:", formData);

      await window.electronAPI.addDonorRecord(formData);

      setFormData({
        donorId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "",
        birthdate: "",
        age: "",
        bloodType: "",
        rhFactor: "",
        contactNumber: "",
        address: "",
      });
      setShowAddModal(false);
      setSearchDonorTerm("");
      setBarangaySearch("");
      await loadDonorData();
      setError(null);

      setSuccessMessage({
        title: "Donor Added Successfully!",
        description: "New donor record has been added to the system.",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error adding donor:", err);
      setError("Failed to add donor: " + err.message);
    }
  };

  const generateDonorId = async () => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }
      const nextId = await window.electronAPI.generateNextDonorId();
      setFormData((prev) => ({ ...prev, donorId: nextId }));
    } catch (err) {
      console.error("Error generating donor ID:", err);
      setError("Failed to generate donor ID");
    }
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    setError(null);
    await generateDonorId();
  };

  // --- ADD THESE NEW FUNCTIONS ---
  const handleApproveSyncClick = () => {
    if (pendingSyncRequests.length === 0) {
      setError("No pending sync requests to approve.");
      return;
    }
    setShowApproveSyncConfirmModal(true);
  };

  const handleApproveSync = async () => {
    try {
      setIsApprovingSync(true);
      setError(null);
      setShowApproveSyncConfirmModal(false);
      setShowApproveLoader(true); // Show full-screen loader

      const currentUserData = localStorage.getItem('currentUser');
      let approvedBy = 'System Admin';

      if (currentUserData) {
        try {
          const userData = JSON.parse(currentUserData);
          approvedBy = userData.fullName || 'System Admin';
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      const organizations = [...new Set(pendingSyncRequests.map(r => r.source_user_name))];
      const result = await window.electronAPI.approveDonorSync(approvedBy);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Loader animation

      setApprovedDonorCount(result.totalProcessed);

      // Create notification for partnered organization
      try {
        console.log('[APPROVAL SYNC] Creating notification for organization...');

        const notificationMessage = `Your donor records sync request has been approved by the Regional Blood Center. ${result.totalProcessed} donor record${result.totalProcessed > 1 ? 's have' : ' has'} been successfully synced to the Regional Blood Center system.`;

        await window.electronAPI.createOrgNotification({
          notificationId: `SYNC-APPROVED-${Date.now()}`,
          type: 'sync_response',
          status: 'approved',
          title: 'Donor Records Sync Request Approved',
          message: notificationMessage,
          requestorName: approvedBy,
          requestorOrganization: 'Regional Blood Center',
          donorCount: result.totalProcessed,
          contactEmail: 'admin@regionalbloodcenter.org',
          contactPhone: '+63 (85) 225-1234',
          contactAddress: 'J.V Serina St., Carmen, Cagayan de Oro City, Misamis Oriental.'
        });

        console.log('[APPROVAL SYNC] Notification created successfully');
      } catch (notifError) {
        console.error('Error creating notification for organization:', notifError);
        // Don't fail the whole operation if notification fails
      }

      // Log activity
      try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const userName = user?.fullName || 'Unknown User';

        await window.electronAPI.logActivityRBC({
          user_name: userName,
          action_type: 'approve',
          entity_type: 'donor_sync',
          entity_id: `sync_${Date.now()}`,
          action_description: `${userName} approved donor information syncing from ${organizations.join(', ')}`,
          details: {
            organizations: organizations,
            donorCount: result.totalProcessed,
            newRecords: result.newRecords.length,
            mergedRecords: result.mergedRecords.length
          }
        });
      } catch (logErr) {
        console.error("Error logging sync approval activity:", logErr);
      }

      await loadDonorData(); // Reload all data
      setShowApproveLoader(false);
      setShowApproveSyncSuccessModal(true);

    } catch (err) {
      console.error("Error approving sync:", err);
      setError(`Failed to approve sync: ${err.message}`);
      setShowApproveLoader(false);
    } finally {
      setIsApprovingSync(false);
    }
  };
  
  // Get unique organization names for the alert
  const pendingOrganizations = [...new Set(pendingSyncRequests.map(r => r.source_user_name))];
  // --- END OF NEW FUNCTIONS ---

  if (loading || saving) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
          fontFamily: "Barlow",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          Loading donor records...
        </div>
      </div>
    );
  }

  return (
    <div className="donor-record-container"
      style={{
        padding: "24px",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        fontFamily: "Barlow",
        borderRadius: "8px",
      }}
    >
      {/* --- PASTE THE NEW STYLE BLOCK HERE --- */}
      <style jsx>{`
        .tooltip-container {
          position: relative;
          cursor: help;
        }

        .tooltip {
          position: absolute;
          bottom: 100%; /* Position above the cell */
          left: 50%;
          transform: translateX(-50%);
          background-color: #333;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-family: Arial, sans-serif;
          z-index: 10;
          width: 200px; /* Set a width */
          visibility: hidden; /* Hidden by default */
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        
        .tooltip-container:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }

        .tooltip-history {
          margin: 0;
          padding: 0;
          list-style: none;
          max-height: 150px;
          overflow-y: auto;
        }
        
        .tooltip-history li {
          padding: 2px 0;
          border-bottom: 1px solid #555;
        }
        
        .tooltip-history li:last-child {
          border-bottom: none;
        }

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

        .dialog-icon-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .dialog-icon-warning {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #fef2f2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
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
          border: none;
        }

        .cancel-button {
          background-color: #f3f4f6;
          color: #374151;
        }

        .cancel-button:hover {
          background-color: #e5e7eb;
        }

        .delete-confirm-button {
          background-color: #ef4444;
          color: white;
        }

        .delete-confirm-button:hover {
          background-color: #dc2626;
        }

        .dialog-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div style={{ margin: 0 }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#165C3C",
            marginTop: "1px",
            fontFamily: "Barlow",
          }}
        >
          Regional Blood Center
        </h1>
        <p
          style={{
            color: "#6b7280",
            fontSize: "14px",
            marginTop: "-7px",
            fontFamily: "Barlow",
          }}
        >
          Centralized Donor Record
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            />
          </svg>
          <span>{error}</span>
          <button
            style={{
              backgroundColor: "#059669",
              color: "white",
              border: "none",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --- ADD THIS ALERT BOX --- */}
      {pendingSyncRequests.length > 0 && (
        <div style={{
          backgroundColor: "#d1fae5", color: "#065f46", padding: "16px 20px",
          borderRadius: "8px", marginBottom: "20px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          border: "1px solid #059669", animation: "fadeIn 0.3s ease-in-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>
                Incoming Donor Records from {pendingOrganizations.join(', ')}
              </div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>
                {pendingSyncRequests.length} pending donor record{pendingSyncRequests.length > 1 ? 's' : ''}. Click Approve Sync to confirm.
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- END OF ALERT BOX --- */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                zIndex: 1,
                color: "#9ca3af",
              }}
            />
            <input
              type="text"
              placeholder="Search"
              style={{
                paddingLeft: "40px",
                paddingRight: "16px",
                paddingTop: "8px",
                paddingBottom: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                width: "300px",
                fontSize: "14px",
                outline: "none",
              }}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }} ref={sortDropdownRef}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                backgroundColor: showSortDropdown ? "#2C58DC" : "white",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "Barlow",
                color: showSortDropdown ? "white" : "#374151",
                transition: "all 0.2s ease",
                minWidth: "100px",
              }}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <span>{getSortLabel()}</span>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  transform: showSortDropdown
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m19 9-7 7-7-7"
                />
              </svg>
            </button>
            {showSortDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  backgroundColor: "white",
                  border: "#8daef2",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  zIndex: 1000,
                  minWidth: "200px",
                  marginTop: "4px",
                }}
              >
                {[
                  { key: "sort", label: "Sort by" },
                  { key: "donorId", label: "Donor ID" },
                  { key: "firstName", label: "First Name" },
                  { key: "lastName", label: "Last Name" },
                  { key: "bloodType", label: "Blood Type" },
                  { key: "status", label: "Status" },
                  { key: "age", label: "Age" },
                  { key: "gender", label: "Gender" },
                  { key: "address", label: "Address" },
                  { key: "recentDonation", label: "Recent Donation" },
                  { key: "donationCount", label: "Donation Count" },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#374151",
                      transition: "background-color 0.2s ease",
                      borderBottom: "1px solid #e5e7eb",
                      fontFamily: "Barlow",
                      backgroundColor:
                        sortConfig.key === item.key ? "#dbeafe" : "transparent",
                      fontWeight:
                        sortConfig.key === item.key ? "600" : "normal",
                    }}
                    onClick={() => handleSort(item.key)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        sortConfig.key === item.key ? "#dbeafe" : "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        sortConfig.key === item.key ? "#dbeafe" : "transparent";
                    }}
                  >
                    {item.label}{" "}
                    {sortConfig.key === item.key &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "relative" }} ref={filterDropdownRef}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: showFilterDropdown ? "#2C58DC" : "white",
                color: showFilterDropdown ? "white" : "#374151",
                border: "1px solid #d1d5db",
                fontFamily: "Barlow",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter size={16} />
              <span>Filter</span>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  transform: showFilterDropdown
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m19 9-7 7-7-7"
                />
              </svg>
            </button>
            {showFilterDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  backgroundColor: "white",
                  border: "#8daef2",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  zIndex: 1000,
                  minWidth: "300px",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                      }}
                    >
                      Filter Field
                    </label>
                    <select
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Barlow",
                        outline: "none",
                        backgroundColor: "white",
                        cursor: "pointer",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                      value={filterConfig.field}
                      onChange={(e) =>
                        setFilterConfig({
                          ...filterConfig,
                          field: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a field</option>
                      <option value="donorId">Donor ID</option>
                      <option value="firstName">First Name</option>
                      <option value="lastName">Last Name</option>
                      <option value="bloodType">Blood Type</option>
                      <option value="gender">Gender</option>
                      <option value="address">Address</option>
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                      }}
                    >
                      Filter Value
                    </label>
                    <input
                      type="text"
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "Barlow",
                        outline: "none",
                        backgroundColor: "white",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                      value={filterConfig.value}
                      onChange={(e) =>
                        setFilterConfig({
                          ...filterConfig,
                          value: e.target.value,
                        })
                      }
                      placeholder="Enter value to filter"
                    />
                  </div>
                </div>
                <div style={{ padding: "8px", display: "flex", gap: "8px" }}>
                  <button
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "12px",
                      backgroundColor: "#9ca3af",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "Barlow",
                    }}
                    onClick={() => {
                      setFilterConfig({ field: "", value: "" });
                      setShowFilterDropdown(false);
                    }}
                  >
                    Clear
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "12px",
                      backgroundColor: "#059669",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "Barlow",
                    }}
                    onClick={() => setShowFilterDropdown(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: pendingSyncRequests.length > 0 ? "#059669" : "#d1d5db",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: pendingSyncRequests.length > 0 ? "pointer" : "not-allowed",
              fontSize: "14px",
              opacity: isApprovingSync ? 0.6 : 1,
              fontFamily: "Barlow"
            }}
            onClick={handleApproveSyncClick}
            disabled={pendingSyncRequests.length === 0 || isApprovingSync}
            title={pendingSyncRequests.length === 0 ? "No pending sync requests" : `Approve ${pendingSyncRequests.length} pending request(s)`}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isApprovingSync ? 'Approving...' : 'Approve Sync'}</span>
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "#FFC200",
              color: "black",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Add Donor</span>
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead
            style={{
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <tr>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <input
                  type="checkbox"
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={toggleAllSelection}
                />
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                  width: "12%",
                }}
              >
                DONOR ID
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                FIRST NAME
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                MIDDLE NAME
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                LAST NAME
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                GENDER
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                BIRTHDATE
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                AGE
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                BLOOD TYPE
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                RH FACTOR
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                STATUS
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                CONTACT NUMBER
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                ADDRESS
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                DONATION COUNT
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                RECENT DONATION
              </th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: "white" }}>
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan="14"
                  style={{
                    padding: "40px",
                    fontSize: "11px",
                    fontFamily: "Arial",
                    color: "#111827",
                    textAlign: "center",
                  }}
                >
                  {searchTerm || filterConfig.value
                    ? "No donor records found matching your criteria"
                    : "No donor records found"}
                </td>
              </tr>
            ) : (
              displayData.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    backgroundColor: index % 2 === 1 ? "#f9fafb" : "white",
                    ...(item.selected && { backgroundColor: "#e6f7ff" }),
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                      checked={item.selected}
                      onChange={() => toggleRowSelection(item.id)}
                    />
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.donorId}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.firstName}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.middleName || "-"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.lastName}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.gender}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.birthdate}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.age}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.bloodType}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.rhFactor}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 14px",
                        borderRadius: "16px",
                        fontSize: "9px",
                        backgroundColor:
                          item.status === "Non-Reactive"
                            ? "#d1fae5"
                            : "#e9d5ff",
                        color:
                          item.status === "Non-Reactive"
                            ? "#065f46"
                            : "#7c3aed",
                      }}
                    >
                      {item.status || "Non-Reactive"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.contactNumber}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.address}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    {item.donationCount}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "10px",
                      fontFamily: "Arial",
                      color: "#111827",
                      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
                    }}
                  >
                    <div className="tooltip-container">
                      {item.recentDonation || 'No donations'}

                      {/* The Tooltip for Donation History */}
                      {item.donationDates && item.donationDates.length > 0 && (
                        <div className="tooltip">
                          <strong>Donation History:</strong>
                          <ul className="tooltip-history">
                            {item.donationDates
                              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort newest first
                              .map((donation, index) => (
                                <li key={index}>
                                  {new Date(donation.date).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "0",
            background: "#4a5568",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
            borderRadius: "8px",
            zIndex: 1000,
            color: "white",
            overflow: "hidden",
          }}
        >
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 16px",
              backgroundColor: "#4a5568",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              borderRight: "1px solid #2d3748",
            }}
            onClick={clearAllSelection}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#4a5568",
              borderRight: "1px solid #2d3748",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "white",
                margin: 0,
              }}
            >
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>
          {singleSelected && (
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                backgroundColor: "#4a5568",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                borderRight: "1px solid #2d3748",
              }}
              onClick={handleEditClick}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Edit</span>
            </button>
          )}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              backgroundColor: "#4a5568",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
            onClick={handleDeleteClick}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "95%",
              maxWidth: "950px",
              maxHeight: "95vh",
              overflow: "hidden",
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "20px 30px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#165C3C",
                    margin: 0,
                    fontFamily: "Barlow",
                  }}
                >
                  Donor Record
                </h2>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#6b7280",
                    margin: "4px 0 0 0",
                    fontFamily: "Barlow",
                  }}
                >
                  Add Donor
                </p>
              </div>
              <button
                style={{
                  fontSize: "28px",
                  color: "#6b7280",
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: "24px 30px",
                maxHeight: "calc(85vh - 160px)",
                overflowY: "auto",
              }}
            >
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                    display: "block",
                    fontFamily: "Barlow",
                  }}
                >
                  Donor ID or Donor Name
                </label>
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Find Donor ID or Donor Name"
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      paddingLeft: "36px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontFamily: "Arial",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    value={searchDonorTerm}
                    onChange={(e) => setSearchDonorTerm(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Donor ID (Auto-generated)
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      backgroundColor: "#f9fafb",
                      color: "#9ca3af",
                      cursor: "not-allowed",
                    }}
                    value={formData.donorId}
                    readOnly
                    disabled
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={formData.firstName}
                    onChange={(e) =>
                      handleFormChange("firstName", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Middle Name (Optional)
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={formData.middleName}
                    onChange={(e) =>
                      handleFormChange("middleName", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={formData.lastName}
                    onChange={(e) =>
                      handleFormChange("lastName", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Gender *
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                    value={formData.gender}
                    onChange={(e) => handleFormChange("gender", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Birthdate *
                  </label>
                  <input
                    type="date"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={formData.birthdate}
                    onChange={(e) =>
                      handleFormChange("birthdate", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Age (Auto-calculated)
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      backgroundColor: "#f9fafb",
                      color: "#9ca3af",
                      cursor: "not-allowed",
                    }}
                    value={formData.age}
                    readOnly
                    disabled
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Blood Type *
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                    value={formData.bloodType}
                    onChange={(e) =>
                      handleFormChange("bloodType", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    RH Factor *
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                    value={formData.rhFactor}
                    onChange={(e) =>
                      handleFormChange("rhFactor", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Status *
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                  >
                    <option value="Non-Reactive">Non-Reactive</option>
                    <option value="Reactive">Reactive</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={formData.contactNumber}
                    onChange={(e) =>
                      handleFormChange("contactNumber", e.target.value)
                    }
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Recent Donation
                  </label>
                  <input
                    type="date"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={formData.recentDonation}
                    onChange={(e) =>
                      handleFormChange("recentDonation", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Donation Count
                  </label>
                  <input
                    type="number"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={formData.donationCount}
                    onChange={(e) =>
                      handleFormChange("donationCount", e.target.value)
                    }
                  />
                </div>
                <div style={{ position: "relative", gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      display: "block",
                      fontFamily: "Barlow",
                    }}
                  >
                    Barangay *
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                    value={formData.address || barangaySearch}
                    onChange={(e) => handleBarangayInputChange(e.target.value)}
                    onFocus={() => {
                      if (barangaySearch) {
                        setShowBarangayDropdown(true);
                      }
                    }}
                    placeholder="Type to search barangay..."
                  />
                  {showBarangayDropdown && filteredBarangays.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        maxHeight: "200px",
                        overflowY: "auto",
                        backgroundColor: "white",
                        border: "1px solid #d1d5db",
                        borderTop: "none",
                        borderRadius: "0 0 4px 4px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        zIndex: 10,
                      }}
                    >
                      {filteredBarangays.map((barangay) => (
                        <div
                          key={barangay}
                          style={{
                            padding: "8px 10px",
                            fontSize: "11px",
                            fontFamily: "Barlow",
                            cursor: "pointer",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                          onClick={() => selectBarangay(barangay)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                          }}
                        >
                          {barangay}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "16px 30px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "white",
              }}
            >
              <button
                style={{
                  padding: "12px 48px",
                  backgroundColor: "#FFC200",
                  color: "black",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  fontFamily: "Barlow",
                }}
                onClick={handleAddDonor}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && (
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
              Are you sure you want to delete {selectedCount}{" "}
              {selectedCount === 1 ? "donor" : "donors"}? This action cannot be
              undone.
            </p>
            <div className="dialog-actions">
              <button className="dialog-button cancel-button" onClick={() => setShowConfirmDeleteModal(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="dialog-button delete-confirm-button" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/*END: Confirm Delete Modal*/}

      {/* Edit Donor Modal */}
      {showEditModal && editingDonor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "95%",
              maxWidth: "950px",
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "20px 30px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#165C3C",
                    margin: 0,
                    fontFamily: "Barlow",
                  }}
                >
                  Donor Record
                </h2>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#6b7280",
                    margin: "4px 0 0 0",
                    fontFamily: "Barlow",
                  }}
                >
                  Edit Donor
                </p>
              </div>
              <button
                style={{
                  fontSize: "28px",
                  color: "#6b7280",
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: "24px 30px",
                maxHeight: "calc(85vh - 160px)",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Donor ID
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      backgroundColor: "#f9fafb",
                      color: "#9ca3af",
                      cursor: "not-allowed",
                    }}
                    value={editingDonor.donorId}
                    readOnly
                    disabled
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={editingDonor.firstName}
                    onChange={(e) =>
                      handleEditDonorChange("firstName", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Middle Name (Optional)
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={editingDonor.middleName || ""}
                    onChange={(e) =>
                      handleEditDonorChange("middleName", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={editingDonor.lastName}
                    onChange={(e) =>
                      handleEditDonorChange("lastName", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Gender *
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                    value={editingDonor.gender}
                    onChange={(e) =>
                      handleEditDonorChange("gender", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Birthdate *
                  </label>
                  <input
                    type="date"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={editingDonor.birthdate}
                    onChange={(e) =>
                      handleEditDonorChange("birthdate", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Age (Auto-calculated)
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      backgroundColor: "#f9fafb",
                      color: "#9ca3af",
                      cursor: "not-allowed",
                    }}
                    value={editingDonor.age}
                    readOnly
                    disabled
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Blood Type *
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                    value={editingDonor.bloodType}
                    onChange={(e) =>
                      handleEditDonorChange("bloodType", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    RH Factor *
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                    value={editingDonor.rhFactor}
                    onChange={(e) =>
                      handleEditDonorChange("rhFactor", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Status *
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                    value={editingDonor.status}
                    onChange={(e) =>
                      handleEditDonorChange("status", e.target.value)
                    }
                  >
                    <option value="Non-Reactive">Non-Reactive</option>
                    <option value="Reactive">Reactive</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={editingDonor.contactNumber}
                    onChange={(e) =>
                      handleEditDonorChange("contactNumber", e.target.value)
                    }
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Recent Donation
                  </label>
                  <input
                    type="date"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                  
                    }}
                    value={
                      editingDonor.recentDonation
                        ? (() => {
                            const date = new Date(editingDonor.recentDonation);
                            return new Date(
                              date.getTime() - date.getTimezoneOffset() * 60000
                            )
                              .toISOString()
                              .split("T")[0];
                          })()
                        : ""
                    }
                    onChange={(e) =>
                      handleEditDonorChange("recentDonation", e.target.value)
                    }
                  />
                </div>

                
                
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      fontFamily: "Barlow",
                    }}
                  >
                    Donation Count
                  </label>
                  <input
                    type="number"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                    }}
                    value={editingDonor.donationCount || 0}
                    onChange={(e) =>
                      handleEditDonorChange("donationCount", e.target.value)
                    }
                  />
                </div>
                <div style={{ position: "relative", gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                      display: "block",
                      fontFamily: "Barlow",
                    }}
                  >
                    Barangay *
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "Barlow",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                    value={editingDonor.address}
                    onChange={(e) =>
                      handleEditDonorChange("address", e.target.value)
                    }
                    placeholder="Type to search barangay..."
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "16px 30px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "white",
              }}
            >
              <button
                style={{
                  padding: "12px 48px",
                  backgroundColor: "#FFC200",
                  color: "black",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  fontFamily: "Barlow",
                }}
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div
          style={{
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
            padding: "10px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "11px",
              width: "30%",
              maxWidth: "350px",
              padding: "40px 30px 30px",
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily: "Barlow",
              position: "relative",
            }}
          >
            <button
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "24px",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "4px",
              }}
              onClick={() => setShowSuccessModal(false)}
            >
              ×
            </button>

            <div
              style={{
                width: "30px",
                height: "30px",
                backgroundColor: "#10b981",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="48" height="48" fill="white" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h3
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#165C3C",
                textAlign: "center",
                fontFamily: "Barlow",
              }}
            >
              {successMessage.title}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
                lineHeight: "1.5",
                fontFamily: "Barlow",
                marginTop: "-5px",
                paddingLeft: "20px",
                paddingRight: "20px",
              }}
            >
              {successMessage.description}
            </p>

            <button
              style={{
                padding: "12px 60px",
                backgroundColor: "#FFC200",
                color: "black",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                fontFamily: "Barlow",
              }}
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* --- ADD THESE MODALS --- */}
      <SyncConfirmModal
        isOpen={showApproveSyncConfirmModal}
        onCancel={() => setShowApproveSyncConfirmModal(false)}
        onConfirm={handleApproveSync}
        donorCount={pendingSyncRequests.length}
      />

      <SyncSuccessModal
        isOpen={showApproveSyncSuccessModal}
        onClose={() => setShowApproveSyncSuccessModal(false)}
        donorCount={approvedDonorCount}
      />


      {showApproveLoader && <Loader />}
    </div>
  );
};

export default DonorRecord;
