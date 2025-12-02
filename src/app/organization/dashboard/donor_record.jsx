import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Mail,
  Bell,
  User,
  CheckCircle,
  X,
  Clock,
  RefreshCw,
  MoreVertical,
  Handshake,
  Droplet
} from "lucide-react";
import SidePanelOrg from "../../../components/SidePanelOrg";

import MailOrg from "./(tabs)/mail";
import CalendarOrg from "./(tabs)/calendar";
import NotificationOrg from "./(tabs)/notification";
import AppointmentOrg from "./appointment";
import ProfileOrg from "./(tabs)/profile/profile";
import LoginOrg from "../login";

const DonorRecordContent = ({ currentUser }) => {
  const [sortConfig, setSortConfig] = useState({
  key: "sortby",
  direction: "asc",
  });
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const [filterConfig, setFilterConfig] = useState({ field: "", value: "" });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
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
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);
  const [syncConfirmCount, setSyncConfirmCount] = useState(0);
  const [editingDonor, setEditingDonor] = useState(null);
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
    contactNumber: "",
    address: "",
    recentDonation: "",
    donationCount: "",
  });
  

  // Get source organization based on user category
  const getSourceOrganization = () => {
    if (!currentUser) {
      console.warn("No currentUser found when getting source organization");
      return "Unknown Organization";
    }

    const category = currentUser.category || currentUser.u_category;
    console.log("User category:", category);
    console.log("Current user:", currentUser);

    if (category === "Organization") {
      const orgName = currentUser.organizationName || currentUser.u_organization_name;
      console.log("Organization name:", orgName);
      return orgName || "Unknown Organization";
    }

    if (category === "Barangay") {
      const barangay = currentUser.barangay || currentUser.u_barangay;
      console.log("Barangay name:", barangay);
      return barangay ? `Barangay ${barangay}` : "Unknown Barangay";
    }

    console.warn("User category not recognized:", category);
    return currentUser.organizationName || currentUser.u_organization_name || "Unknown Organization";
  };

  const sourceOrganization = getSourceOrganization();
  console.log("Source organization for sync:", sourceOrganization);

  const getEntityName = () => sourceOrganization || "Partner Organization";

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
          const records =
            await window.electronAPI.getDonorRecordsOrg(sourceOrganization);
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
        prev.map((item) =>
          item.id === id ? { ...item, selected: !item.selected } : item
        )
      );
    };

    const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setShowSortDropdown(false);
  };

  const getSortLabel = () => {
    const labels = {
      sortby: "Sort by",
      donorId: "Donor ID",
      firstName: "First Name",
      lastName: "Last Name",
      bloodType: "Blood Type",
      age: "Age",
      gender: "Gender",
      address: "Address",
      recentDonation: "Recent Donation",
      donationCount: "Donation Count",
    };
    return labels[sortConfig.key] || "Sort by";
  };

  const getSortedAndFilteredData = () => {
    let filtered = [...donorData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.donorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.middleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.bloodType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filter config
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

    // Apply sorting
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


  const toggleAllSelection = () => {
    const allSelected = donorData.every((item) => item.selected);
    setDonorData((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const clearAllSelection = () => {
    setDonorData((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const selectedCount = donorData.filter((item) => item.selected).length;
  const allSelected =
    donorData.length > 0 && donorData.every((item) => item.selected);
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
      setValidationErrors((prev) => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
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
        console.log("Generated donor ID from backend:", nextId);
        setFormData((prev) => ({ ...prev, donorId: nextId }));
      } else {
        // Fallback: Generate a simple sequential ID
        // This should rarely be used as electronAPI should always be available
        const fallbackId = `DNR-${Date.now().toString().slice(-7)}`;
        console.warn(
          "ElectronAPI not available, using fallback ID:",
          fallbackId
        );
        setFormData((prev) => ({ ...prev, donorId: fallbackId }));
      }
    } catch (err) {
      console.error("Error generating donor ID:", err);
      // On error, still try to generate something unique
      const errorFallbackId = `DNR-${Date.now().toString().slice(-7)}`;
      console.warn("Error occurred, using error fallback ID:", errorFallbackId);
      setFormData((prev) => ({ ...prev, donorId: errorFallbackId }));
    }
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    setValidationErrors({});
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
      recentDonation: "",
      donationCount: "",
    });
    await generateDonorId();
  };

  const handleAddDonor = async () => {
    const errors = {};
    if (!formData.firstName?.trim())
      errors.firstName = "First Name is required";
    if (!formData.lastName?.trim()) errors.lastName = "Last Name is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.birthdate) errors.birthdate = "Birthdate is required";
    if (!formData.bloodType) errors.bloodType = "Blood Type is required";
    if (!formData.rhFactor) errors.rhFactor = "RH Factor is required";
    if (!formData.contactNumber?.trim())
      errors.contactNumber = "Contact Number is required";
    if (!formData.address?.trim())
      errors.address = "Address/Barangay is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      if (window.electronAPI && sourceOrganization) {
        await window.electronAPI.addDonorRecordOrg(
          formData,
          sourceOrganization
        );
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
        const adjustedDate = new Date(
          d.getTime() - d.getTimezoneOffset() * 60000
        );
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
    if (!editingDonor.firstName?.trim())
      errors.firstName = "First Name is required";
    if (!editingDonor.lastName?.trim())
      errors.lastName = "Last Name is required";
    if (!editingDonor.gender) errors.gender = "Gender is required";
    if (!editingDonor.birthdate) errors.birthdate = "Birthdate is required";
    if (!editingDonor.bloodType) errors.bloodType = "Blood Type is required";
    if (!editingDonor.rhFactor) errors.rhFactor = "RH Factor is required";
    if (!editingDonor.contactNumber?.trim())
      errors.contactNumber = "Contact Number is required";
    if (!editingDonor.address?.trim())
      errors.address = "Address/Barangay is required";

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

        await window.electronAPI.updateDonorRecordOrg(
          editingDonor.id,
          donorUpdateData,
          sourceOrganization
        );
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
      setEditValidationErrors({
        save: `Failed to update donor: ${err.message}`,
      });
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const selectedIds = donorData
      .filter((item) => item.selected)
      .map((item) => item.id);
    if (selectedIds.length === 0) return;

    try {
      if (window.electronAPI && sourceOrganization) {
        await window.electronAPI.deleteDonorRecordsOrg(
          selectedIds,
          sourceOrganization
        );
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
        const results = await window.electronAPI.searchDonorRecordsOrg(
          term,
          sourceOrganization
        );
        setDonorData(results || []);
      }
    } catch (err) {
      console.error("Error searching donors:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
        Loading donor records...
      </div>
    );
  }
  // In the DonorRecordContent component, add this function:

  const handleRequestSync = () => {
    const selectedDonors = donorData.filter((item) => item.selected);

    if (selectedDonors.length === 0) {
      alert("Please select at least one donor record to sync");
      return;
    }

    // Show custom confirmation modal
    setSyncConfirmCount(selectedDonors.length);
    setShowSyncConfirmModal(true);
  };

  const handleConfirmSyncRequest = async () => {
    const selectedDonors = donorData.filter((item) => item.selected);
    setShowSyncConfirmModal(false);

    try {
      if (window.electronAPI && sourceOrganization) {
        // Get current user info
        const userStr =
          localStorage.getItem("currentOrgUser") ||
          localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user || !user.id) {
          throw new Error("User not authenticated");
        }

        const userName =
          user.fullName || user.u_full_name || "Organization User";
        const userId = user.id || user.u_id;
        const donorIds = selectedDonors.map((d) => d.id);

        const result = await window.electronAPI.createSyncRequest(
          sourceOrganization,
          userName,
          userId,
          donorIds
        );

        if (result.success) {
          setSuccessMessage({
            title: "Sync Request Sent!",
            description: `${result.count} donor record(s) have been sent for approval to the Regional Blood Center.`,
          });
          setShowSuccessModal(true);
          clearAllSelection();
        }
      }
    } catch (error) {
      console.error("Error requesting sync:", error);
      alert(`Failed to send sync request: ${error.message}`);
    }
  };
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="right-controls">
        {/* SORT DROPDOWN */}
    <div style={{ position: "relative" }} ref={sortDropdownRef}>
      <button
        className="sort-button"
        style={{
          backgroundColor: showSortDropdown ? "#2C58DC" : "white",
          color: showSortDropdown ? "white" : "#374151",
          transition: "all 0.2s ease",
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
            transform: showSortDropdown ? "rotate(180deg)" : "rotate(0deg)",
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
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            minWidth: "200px",
            marginTop: "4px",
          }}
        >
          {[
            { key: "sortby", label: "Sort by" },
            { key: "donorId", label: "Donor ID" },
            { key: "firstName", label: "First Name" },
            { key: "lastName", label: "Last Name" },
            { key: "bloodType", label: "Blood Type" },
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
                fontWeight: sortConfig.key === item.key ? "600" : "normal",
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
          className="filter-button"
          style={{
            backgroundColor: showFilterDropdown ? "#2C58DC" : "white",
            color: showFilterDropdown ? "white" : "#374151",
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
              transform: showFilterDropdown ? "rotate(180deg)" : "rotate(0deg)",
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
              border: "1px solid #e5e7eb",
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
          <button className="sync-button" onClick={handleRequestSync}>
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Request Sync</span>
          </button>
          <button className="add-button" onClick={openAddModal}>
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
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={toggleAllSelection}
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
              <th className="table-header">DONATION COUNT</th>
              <th className="table-header">RECENT DONATION</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {getSortedAndFilteredData().length === 0 ? (
              <tr>
                <td
                  colSpan="16"
                  style={{ textAlign: "center", padding: 40, color: "#6b7280" }}
                >
                  No donor records found
                </td>
              </tr>
            ) : (
              getSortedAndFilteredData().map((item, index) => (
                <tr
                  key={item.id}
                  className={`table-row ${index % 2 === 1 ? "row-even" : ""} ${item.selected ? "row-selected" : ""}`}
                >
                  <td className="table-cell">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={item.selected}
                      onChange={() => toggleRowSelection(item.id)}
                    />
                  </td>
                  <td className="table-cell">{item.donorId}</td>
                  <td className="table-cell">{item.firstName}</td>
                  <td className="table-cell">{item.middleName || "-"}</td>
                  <td className="table-cell">{item.lastName}</td>
                  <td className="table-cell">{item.gender}</td>
                  <td className="table-cell">{item.birthdate}</td>
                  <td className="table-cell">{item.age}</td>
                  <td className="table-cell">{item.bloodType}</td>
                  <td className="table-cell">{item.rhFactor}</td>
                  <td className="table-cell">{item.contactNumber}</td>
                  <td className="table-cell">{item.address}</td>
                  <td className="table-cell">{item.donationCount || 0}</td>
                  <td className="table-cell">
                    {item.recentDonation || "No donations"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div className="action-bar">
          <button className="close-button" onClick={clearAllSelection}>
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
          <div className="counter-section">
            <span className="counter-text">
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>
          {singleSelected && (
            <button className="edit-button" onClick={handleEditClick}>
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
          <button className="delete-button" onClick={handleDeleteClick}>
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

      {/* Add Donor Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
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
              borderRadius: 12,
              width: "95%",
              maxWidth: 950,
              maxHeight: "95vh",
              overflow: "hidden",
              boxShadow: "0 20px 25px rgba(0,0,0,0.25)",
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
              <div>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#165C3C",
                    margin: 0,
                    fontFamily: "Barlow",
                  }}
                >
                  Donor Record
                </h2>
                <p
                  style={{
                    fontSize: 16,
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
                  fontSize: 28,
                  color: "#6b7280",
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  padding: 0,
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      border: `1px solid ${validationErrors.firstName ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      border: `1px solid ${validationErrors.lastName ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Gender
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      cursor: "pointer",
                      backgroundColor: "white",
                      border: `1px solid ${validationErrors.gender ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Birthdate
                  </label>
                  <input
                    type="date"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      border: `1px solid ${validationErrors.birthdate ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Blood Type
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      cursor: "pointer",
                      backgroundColor: "white",
                      border: `1px solid ${validationErrors.bloodType ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    RH Factor
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      cursor: "pointer",
                      backgroundColor: "white",
                      border: `1px solid ${validationErrors.rhFactor ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      border: `1px solid ${validationErrors.contactNumber ? "#ef4444" : "#d1d5db"}`,
                    }}
                    value={formData.contactNumber}
                    onChange={(e) =>
                      handleFormChange(
                        "contactNumber",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      display: "block",
                      fontFamily: "Barlow",
                    }}
                  >
                    Barangay
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      width: "100%",
                      boxSizing: "border-box",
                      border: `1px solid ${validationErrors.address ? "#ef4444" : "#d1d5db"}`,
                    }}
                    value={formData.address || barangaySearch}
                    onChange={(e) => handleBarangayInputChange(e.target.value)}
                    onFocus={() => {
                      if (barangaySearch) setShowBarangayDropdown(true);
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
                        maxHeight: 200,
                        overflowY: "auto",
                        backgroundColor: "white",
                        border: "1px solid #d1d5db",
                        borderTop: "none",
                        borderRadius: "0 0 4px 4px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 10,
                      }}
                    >
                      {filteredBarangays.map((b) => (
                        <div
                          key={b}
                          style={{
                            padding: "8px 10px",
                            fontSize: 11,
                            fontFamily: "Barlow",
                            cursor: "pointer",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                          onClick={() => selectBarangay(b)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f3f4f6")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "white")
                          }
                        >
                          {b}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(validationErrors).length > 0 && (
                <div
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    padding: "12px 16px",
                    borderRadius: 6,
                    marginTop: 16,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    {validationErrors.save && (
                      <div style={{ marginBottom: 4 }}>
                        {validationErrors.save}
                      </div>
                    )}
                    {Object.entries(validationErrors)
                      .filter(([k]) => k !== "save")
                      .map(([k, msg]) => (
                        <div key={k} style={{ marginBottom: 4 }}>
                          • {msg}
                        </div>
                      ))}
                  </div>
                </div>
              )}
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
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
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

      {/* Edit Donor Modal */}
      {showEditModal && editingDonor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
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
              borderRadius: 12,
              width: "95%",
              maxWidth: 950,
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 20px 25px rgba(0,0,0,0.25)",
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
              <div>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#165C3C",
                    margin: 0,
                    fontFamily: "Barlow",
                  }}
                >
                  Donor Record
                </h2>
                <p
                  style={{
                    fontSize: 16,
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
                  fontSize: 28,
                  color: "#6b7280",
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  padding: 0,
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
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      border: `1px solid ${editValidationErrors.firstName ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      border: `1px solid ${editValidationErrors.lastName ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Gender
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      cursor: "pointer",
                      backgroundColor: "white",
                      border: `1px solid ${editValidationErrors.gender ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Birthdate
                  </label>
                  <input
                    type="date"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      border: `1px solid ${editValidationErrors.birthdate ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Blood Type
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      cursor: "pointer",
                      backgroundColor: "white",
                      border: `1px solid ${editValidationErrors.bloodType ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    RH Factor
                  </label>
                  <select
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      cursor: "pointer",
                      backgroundColor: "white",
                      border: `1px solid ${editValidationErrors.rhFactor ? "#ef4444" : "#d1d5db"}`,
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      fontFamily: "Barlow",
                    }}
                  >
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      border: `1px solid ${editValidationErrors.contactNumber ? "#ef4444" : "#d1d5db"}`,
                    }}
                    value={editingDonor.contactNumber}
                    onChange={(e) =>
                      handleEditDonorChange(
                        "contactNumber",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                    }}
                    value={editingDonor.recentDonation || ""}
                    onChange={(e) =>
                      handleEditDonorChange("recentDonation", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
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
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
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
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                      display: "block",
                      fontFamily: "Barlow",
                    }}
                  >
                    Barangay
                  </label>
                  <input
                    type="text"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "Barlow",
                      width: "100%",
                      boxSizing: "border-box",
                      border: `1px solid ${editValidationErrors.address ? "#ef4444" : "#d1d5db"}`,
                    }}
                    value={editingDonor.address}
                    onChange={(e) =>
                      handleEditDonorChange("address", e.target.value)
                    }
                    placeholder="Type to search barangay..."
                  />
                </div>
              </div>

              {Object.keys(editValidationErrors).length > 0 && (
                <div
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    padding: "12px 16px",
                    borderRadius: 6,
                    marginTop: 16,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    {editValidationErrors.save && (
                      <div style={{ marginBottom: 4 }}>
                        {editValidationErrors.save}
                      </div>
                    )}
                    {Object.entries(editValidationErrors)
                      .filter(([k]) => k !== "save")
                      .map(([k, msg]) => (
                        <div key={k} style={{ marginBottom: 4 }}>
                          • {msg}
                        </div>
                      ))}
                  </div>
                </div>
              )}
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
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
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

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowConfirmDeleteModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              width: "95%",
              maxWidth: 900,
              maxHeight: "90vh",
              overflow: "hidden",
              boxShadow: "0 20px 25px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              fontFamily: "Barlow",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 30px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "white",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#165C3C",
                    margin: 0,
                    fontFamily: "Barlow",
                  }}
                >
                  Confirm Delete
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    margin: 0,
                    fontFamily: "Barlow",
                  }}
                >
                  Review donors before deletion
                </p>
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                }}
                onClick={() => setShowConfirmDeleteModal(false)}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, padding: 30, overflowY: "auto" }}>
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #ef4444",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <h4
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#991b1b",
                    margin: "0 0 12px 0",
                  }}
                >
                  Donors to Delete (
                  {donorData.filter((item) => item.selected).length})
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr",
                    gap: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  <div>Donor ID</div>
                  <div>Full Name</div>
                  <div>Address</div>
                  <div>Blood Type</div>
                  <div>Contact</div>
                </div>
                {donorData
                  .filter((item) => item.selected)
                  .map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr",
                        gap: 12,
                        fontSize: 12,
                        color: "#6b7280",
                        padding: "8px 0",
                        borderTop: index > 0 ? "1px solid #e5e7eb" : "none",
                      }}
                    >
                      <div style={{ fontWeight: 500, color: "#374151" }}>
                        {item.donorId}
                      </div>
                      <div>
                        {`${item.firstName} ${item.middleName || ""} ${item.lastName}`.trim()}
                      </div>
                      <div>{item.address}</div>
                      <div>
                        {item.bloodType}
                        {item.rhFactor}
                      </div>
                      <div>{item.contactNumber}</div>
                    </div>
                  ))}
              </div>

              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #ef4444",
                  borderRadius: 8,
                  padding: 16,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="#ef4444"
                  viewBox="0 0 20 20"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#991b1b",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Confirm Delete Action
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#7f1d1d",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    These donors will be permanently deleted from the records.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "20px 30px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "center",
                gap: 12,
                backgroundColor: "white",
              }}
            >
              <button
                style={{
                  padding: "12px 48px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "Barlow",
                  minWidth: 120,
                }}
                onClick={handleConfirmDelete}
              >
                Confirm Delete (
                {donorData.filter((item) => item.selected).length} donors)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Confirmation Modal */}
      {showSyncConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: 10,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 11,
              width: "30%",
              maxWidth: 400,
              padding: "40px 30px 30px",
              boxShadow: "0 20px 25px rgba(0,0,0,0.25)",
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
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 24,
                color: "#9ca3af",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 4,
              }}
              onClick={() => setShowSyncConfirmModal(false)}
            >
              ×
            </button>

            <div
              style={{
                width: 60,
                height: 60,
                backgroundColor: "#FEF3C7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>

            <h3
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#165C3C",
                textAlign: "center",
                fontFamily: "Barlow",
                marginBottom: 10,
              }}
            >
              Confirm Donor Record Sync Request
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
                lineHeight: 1.6,
                fontFamily: "Barlow",
                marginBottom: 30,
                paddingLeft: 10,
                paddingRight: 10,
              }}
            >
              Are you sure you want to request sync for{" "}
              <strong style={{ color: "#165C3C" }}>
                {syncConfirmCount} donor record(s)
              </strong>{" "}
              to the Regional Blood Center?
              <br />
              <br />
              This action will send the selected donor records for approval.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor: "#F3F4F6",
                  color: "#6B7280",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "Barlow",
                  transition: "all 0.2s",
                }}
                onClick={() => setShowSyncConfirmModal(false)}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#E5E7EB";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#F3F4F6";
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor: "#2C58DC",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "Barlow",
                  transition: "all 0.2s",
                }}
                onClick={handleConfirmSyncRequest}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#1E40AF";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#2C58DC";
                }}
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: 10,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 11,
              width: "30%",
              maxWidth: 350,
              padding: "40px 30px 30px",
              boxShadow: "0 20px 25px rgba(0,0,0,0.25)",
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
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 24,
                color: "#9ca3af",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 4,
              }}
              onClick={() => setShowSuccessModal(false)}
            >
              ×
            </button>

            <div
              style={{
                width: 30,
                height: 30,
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
                fontSize: 20,
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
                fontSize: 13,
                color: "#6b7280",
                textAlign: "center",
                lineHeight: 1.5,
                fontFamily: "Barlow",
                marginTop: -5,
                paddingLeft: 20,
                paddingRight: 20,
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
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "Barlow",
              }}
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
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
        .sync-button { font-family: "Barlow"; display: flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: #2C58DC; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .add-button { font-family: "Barlow"; display: flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: #FFC200; color: black; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .table-container { 
          background-color: white; 
          border-radius: 8px; 
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); 
          overflow: hidden; 
          overflow-x: auto;
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
          width: auto;
        }
        .donor-id-col { 
          width: auto;
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
        .message-time {
          font-size: 0.65rem;
          color: #6b7280;
          white-space: nowrap;
          font-family: 'Barlow';
          font-weight: 400;
        }
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
        <button className="close-btn" onClick={onCancel}>
          ×
        </button>
        <div className="icon-container">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h3 className="dialog-title">Confirm Logout</h3>
        <p className="dialog-message">
          Are you sure you want to logout from your account?
        </p>
        <div className="dialog-actions">
          <button className="dialog-button cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="dialog-button confirm-button" onClick={onConfirm}>
            Yes, Logout
          </button>
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
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeNotificationMenu, setActiveNotificationMenu] = useState(null);
  const [mailMessages, setMailMessages] = useState([]);
  const [userName, setUserName] = useState("Loading...");
  const [userPhoto, setUserPhoto] = useState(null);
  const [isLoadingMail, setIsLoadingMail] = useState(false);
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [lastViewedMailTime, setLastViewedMailTime] = useState(
  localStorage.getItem('lastViewedMailTime_org') || new Date(0).toISOString()
);
  const navigate = useNavigate();
  const [lastViewedNotificationTime, setLastViewedNotificationTime] = useState(
  localStorage.getItem('lastViewedNotificationTime_org') || new Date(0).toISOString()
);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Check multiple possible storage locations
        const userStr =
          localStorage.getItem("user") || localStorage.getItem("user_org");

        if (userStr) {
          const user = JSON.parse(userStr);

          // If we have electronAPI and can get fresh data, use it
          if (
            user.id &&
            window.electronAPI &&
            typeof window.electronAPI.getUserById === "function"
          ) {
            try {
              const freshUserData = await window.electronAPI.getUserById(
                user.id
              );
              if (freshUserData) {
                setCurrentUser(freshUserData);
                localStorage.setItem("user", JSON.stringify(freshUserData));

                // Also update the display name and photo immediately
                const userName =
                  freshUserData.fullName ||
                  freshUserData.u_full_name ||
                  freshUserData.organizationName ||
                  freshUserData.u_organization_name ||
                  "Organization User";
                const userPhoto =
                  freshUserData.profileImage ||
                  freshUserData.u_profile_image ||
                  null;

                setUserName(userName);
                setUserPhoto(userPhoto);
              } else {
                setCurrentUser(user);
              }
            } catch (error) {
              console.error("Error fetching fresh user data:", error);
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

  // Load notifications from database
  useEffect(() => {
    loadNotifications();

    const notificationInterval = setInterval(loadNotifications, 30000);

    return () => clearInterval(notificationInterval);
  }, []);

  const loadNotifications = async () => {
  try {
    if (typeof window !== "undefined" && window.electronAPI) {
      const notificationsData = await window.electronAPI.getAllNotificationsOrg();
      
      const readLocalIds = JSON.parse(
        localStorage.getItem("orgReadNotificationIds") || "[]"
      );
      
      const transformedNotifications = notificationsData.map((n) => {
        const notifType = n.notification_type || n.type;
        const derivedStatus =
          notifType === "stock_expired"
            ? "expired"
            : notifType === "stock_expiring_urgent"
              ? "urgent"
              : notifType === "stock_expiring_soon"
                ? "alert"
                : n.status || "info";

        return {
          id: n.id,
          notificationId: n.notification_id,
          type: notifType || "notification",
          status: derivedStatus,
          priority: n.priority,
          title: n.title,
          message: n.message || n.description,
          requestor: n.requestor || "Regional Blood Center",
          timestamp: new Date(n.updated_at || n.created_at),
          read:
            n.read ||
            n.is_read ||
            false ||
            readLocalIds.includes(n.notification_id) ||
            readLocalIds.includes(n.id),
          appointmentId: n.appointment_id,
          eventDate: n.event_date,
          eventTime: n.event_time,
          eventLocation: n.event_location,
          declineReason: n.decline_reason,
          contactInfo: {
            email: n.contact_email,
            phone: n.contact_phone,
            address: n.event_location || n.contact_address,
            type: n.contact_type,
          },
        };
      });

      // Load appointments for event notifications
      let appointmentsData = [];
      try {
        appointmentsData = await window.electronAPI.getAllAppointments?.() || [];
      } catch (error) {
        console.warn("Could not load appointments for notifications:", error);
      }

      const now = new Date();
      const upcomingAppointments = appointmentsData
        .filter((apt) => {
          const aptDate = new Date(apt.date + "T" + (apt.time || "00:00:00"));
          const hoursDiff = (aptDate - now) / (1000 * 60 * 60);
          return (
            hoursDiff > 0 &&
            hoursDiff <= 72 &&
            (apt.status === "approved" || apt.status === "scheduled" || apt.status === "confirmed")
          );
        })
        .map((apt) => {
          const aptDate = new Date(apt.date + "T00:00:00");
          const formattedDate = aptDate.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const formattedTime = apt.time 
            ? new Date(`1970-01-01T${apt.time}`).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "TBD";

          return {
            id: `event-${apt.id || apt.appointment_id}`,
            notificationId: `EVENT-${apt.id || apt.appointment_id}`,
            type: "upcoming_event",
            status: "approved",
            title: "Partner, your Blood Drive is Scheduled!",
            message: `Your blood drive event "${apt.title || "Blood Drive"}" is confirmed for ${formattedDate} at ${formattedTime}.`,
            requestor: "Regional Blood Center",
            timestamp: new Date(apt.created_at || apt.date),
            read: false,
            appointmentId: apt.id || apt.appointment_id,
            eventDate: apt.date,
            eventTime: apt.time,
            contactInfo: apt.contactInfo,
            rbcContactInfo: {
              email: "admin@regionalbloodcenter.org",
              phone: "+63 (85) 225-1234",
              address:
                "J.V Serina St., Carmen, Cagayan de Oro City, Misamis Oriental.",
            },
          };
        });

      const finishedEventNotifications = appointmentsData
        .filter((apt) => {
          const endOfDay = new Date(apt.date + "T23:59:59");
          const diffMs = now - endOfDay;
          return (
            diffMs >= 0 &&
            diffMs <= 10 * 60 * 1000 &&
            (apt.status === "approved" || apt.status === "confirmed" || apt.status === "completed")
          );
        })
        .map((apt) => ({
          id: `event-finished-${apt.id || apt.appointment_id}`,
          notificationId: `EVENT-FINISHED-${apt.id || apt.appointment_id}`,
          type: "upcoming_event",
          status: "info",
          title: "Blood Drive Partnership event now Completed",
          message: `The event "${apt.title || "Blood Drive Partnership"}" has ended at 12:00 midnight.`,
          requestor: "Event Reminder",
          timestamp: new Date(),
          read:
            readLocalIds.includes(
              `EVENT-FINISHED-${apt.id || apt.appointment_id}`
            ) ||
            readLocalIds.includes(
              `event-finished-${apt.id || apt.appointment_id}`
            ),
          appointmentId: apt.id || apt.appointment_id,
          eventDate: apt.date,
          eventTime: apt.time,
          contactInfo: apt.contactInfo,
        }));

      const testFinished = {
        id: "event-finished-test",
        notificationId: "EVENT-FINISHED-TEST",
        type: "upcoming_event",
        status: "info",
        title: "Blood Drive Partnership event now Completed",
        message:
          'The event "Blood Drive Partnership" has ended at 12:00 midnight.',
        requestor: "Event Reminder",
        timestamp: new Date(),
        read: readLocalIds.includes("EVENT-FINISHED-TEST"),
      };

      const merged = [
        ...transformedNotifications,
        ...upcomingAppointments,
        ...finishedEventNotifications,
        testFinished,
      ];
      
      const deduped = Array.from(
        new Map(merged.map((n) => [n.notificationId || n.id, n])).values()
      );
      
      const allNotifications = deduped.sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setNotifications(allNotifications);
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
};

  useEffect(() => {
    loadMailMessages();
    const mailInterval = setInterval(loadMailMessages, 30000);
    return () => clearInterval(mailInterval);
  }, []);

 const loadMailMessages = async () => {
  try {
    setIsLoadingMail(true);

    if (typeof window !== "undefined" && window.electronAPI) {
      console.log("[DONOR_RECORD_ORG] Loading mail messages...");
      
      // Load regular mails
      const mailData = await window.electronAPI.getAllMails();
      console.log("[DONOR_RECORD_ORG] Regular mails:", mailData);

      // Load sync notifications
      let syncNotifications = [];
      try {
        if (typeof window.electronAPI.getAllSyncNotifications === 'function') {
          syncNotifications = await window.electronAPI.getAllSyncNotifications();
          console.log("[DONOR_RECORD_ORG] Sync notifications:", syncNotifications);
        }
      } catch (syncError) {
        console.error("[DONOR_RECORD_ORG] Error loading sync notifications:", syncError);
      }

      // Transform regular mails
      const mailsFromNotifications = mailData
        .map((n) => {
          const avatar = "RBC";
          const status = n.status || "pending";

          return {
            id: n.id,
            notificationId: n.mail_id || n.id,
            from: "Regional Blood Center",
            fromEmail: "admin@regionalbloodcenter.org",
            avatar: avatar,
            avatarColor: "#165C3C",
            avatarFontFamily: "Barlow",
            subject: n.subject || `Partnership Request Update`,
            preview: n.preview || n.message || `Partnership request ${status}`,
            timestamp: new Date(n.created_at || Date.now()),
            read: n.read || n.is_read || false,
            status: status,
            declineReason: n.decline_reason || null,
            type: 'mail',
          };
        });

      // Transform sync notifications into mail format
      const syncMails = syncNotifications.map((sync) => {
        const displayStatus = sync.status === 'rejected' ? 'declined' : 
                             sync.status === 'approved' ? 'approved' : 'pending';
        
        const subject = displayStatus === 'approved' 
          ? `Sync Request Approved - ${sync.donor_count} Record(s)`
          : displayStatus === 'declined'
          ? `Sync Request Declined - ${sync.donor_count} Record(s)`
          : `Sync Request Pending - ${sync.donor_count} Record(s)`;
        
        const preview = displayStatus === 'approved'
          ? `Your sync request for ${sync.donor_count} donor record(s) has been approved.`
          : displayStatus === 'declined'
          ? `Your sync request for ${sync.donor_count} donor record(s) was declined.`
          : `Your sync request for ${sync.donor_count} donor record(s) is pending review.`;

        return {
          id: `sync-${sync.id}`,
          notificationId: `SYNC-${sync.id}`,
          from: "Regional Blood Center - Sync Team",
          fromEmail: "sync@regionalbloodcenter.org",
          avatar: "RBC",
          avatarColor: "#2563eb",
          subject: subject,
          preview: preview,
          timestamp: new Date(sync.updated_at || sync.created_at || Date.now()),
          read: sync.is_read || sync.read || false,
          status: displayStatus,
          declineReason: sync.rejection_reason || null,
          syncData: {
            donorCount: sync.donor_count,
            requestedBy: sync.requested_by,
            rejectionReason: sync.rejection_reason,
            approvedBy: sync.approved_by,
          },
          type: 'sync',
        };
      });

      // Combine and sort all mails - prioritize unread
      const allMails = [...mailsFromNotifications, ...syncMails]
        .sort((a, b) => {
          // Show unread first
          if (a.read !== b.read) {
            return a.read ? 1 : -1;
          }
          // Then sort by timestamp
          return new Date(b.timestamp) - new Date(a.timestamp);
        })
        .slice(0, 4); // Show only 4 most recent in dropdown

      console.log("[DONOR_RECORD_ORG] Combined mails for dropdown:", allMails);
      setMailMessages(allMails);
    }
  } catch (error) {
    console.error("[DONOR_RECORD_ORG] Error loading mail messages:", error);
  } finally {
    setIsLoadingMail(false);
  }
};

  useEffect(() => {
    loadCalendarAppointments();

    const handleAppointmentsUpdate = (event) => {
      if (event.detail) {
        const upcomingAppts = event.detail
          .filter(
            (apt) => apt.status === "approved" || apt.status === "confirmed"
          )
          .slice(0, 4)
          .map((apt) => ({
            id: apt.id || apt.appointment_id,
            title:
              apt.title ||
              `Blood Drive Partnership - ${apt.contactInfo?.lastName || "Unknown"}`,
            subtitle:
              apt.notes || `${apt.contactInfo?.address || "Location TBD"}`,
            date: apt.date,
            time: apt.time,
            type: apt.contactInfo?.type || "organization",
          }));

        setCalendarAppointments(upcomingAppts);
      }
    };

    window.addEventListener("appointmentsUpdated", handleAppointmentsUpdate);
    const calendarInterval = setInterval(loadCalendarAppointments, 30000);

    return () => {
      window.removeEventListener(
        "appointmentsUpdated",
        handleAppointmentsUpdate
      );
      clearInterval(calendarInterval);
    };
  }, []);

  const loadCalendarAppointments = async () => {
    try {
      setIsLoadingCalendar(true);

      if (typeof window !== "undefined" && window.electronAPI) {
        const partnershipRequests =
          await window.electronAPI.getAllPartnershipRequests(null);
        const localAppointments = await window.electronAPI.getAllAppointments();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingPartnerships = partnershipRequests
          .filter((req) => {
            const eventDate = new Date(req.event_date + "T00:00:00");
            return (
              (req.status === "approved" ||
                req.status === "confirmed" ||
                req.status === "pending") &&
              eventDate >= today
            );
          })
          .map((req) => ({
            id: `partnership-${req.id}`,
            title: req.organization_name || "Blood Drive Partnership",
            subtitle: `${req.event_address || req.organization_barangay} - ${req.event_time}`,
            date: req.event_date,
            time: req.event_time,
            type: "partnership",
          }));

        const upcomingLocal = localAppointments
          .filter((apt) => {
            const eventDate = new Date(apt.date + "T00:00:00");
            return (
              (apt.status === "approved" ||
                apt.status === "confirmed" ||
                apt.status === "pending" ||
                apt.status === "scheduled") &&
              eventDate >= today
            );
          })
          .map((apt) => ({
            id: apt.id || apt.appointment_id,
            title:
              apt.title ||
              `Blood Drive - ${apt.contactInfo?.lastName || "Event"}`,
            subtitle: `${apt.contactInfo?.address || "Location TBD"} - ${apt.time}`,
            date: apt.date,
            time: apt.time,
            type: apt.contactInfo?.type || "organization",
          }));

        const allUpcoming = [...upcomingPartnerships, ...upcomingLocal]
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);

        setCalendarAppointments(allUpcoming);
      } else {
        setCalendarAppointments([]);
      }
    } catch (error) {
      console.error("Error loading calendar appointments:", error);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  useEffect(() => {
    // Load user info from localStorage - check multiple possible storage keys
    const loadUserData = () => {
      let userData = null;

      // Try different localStorage keys that might contain user data
      const userStr =
        localStorage.getItem("user") ||
        localStorage.getItem("user_org") ||
        localStorage.getItem("currentOrgUser");

      if (userStr) {
        try {
          userData = JSON.parse(userStr);

          // Handle different user data structures from your authentication system
          const userName =
            userData.fullName ||
            userData.u_full_name ||
            userData.organizationName ||
            userData.u_organization_name ||
            "Organization User";
          const userPhoto =
            userData.profileImage ||
            userData.u_profile_image ||
            userData.profilePhoto ||
            null;

          setUserName(userName);
          setUserPhoto(userPhoto);

          // Also update currentUser state if needed
          if (!currentUser && userData) {
            setCurrentUser(userData);
          }

          return;
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      // Fallback if no user is found
      setUserName("Organization User");
      setUserPhoto(null);
    };

    loadUserData();

    // Listen for profile updates from other tabs
    const handleProfileUpdate = () => {
      loadUserData();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate); // Also listen to storage events

    // Clean up the event listeners
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, [currentUser]);

  const toggleSidePanel = () => setIsSidePanelOpen(!isSidePanelOpen);

      const getUnreadNotificationCount = () => {
      const lastViewed = new Date(lastViewedNotificationTime);
      return notifications.filter((n) => !n.read && new Date(n.timestamp) > lastViewed).length;
    };
    const handleNavigate = (screen) => {
    setActiveScreen(screen);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsProfileDropdownOpen(false);
    
    // Reload notifications when navigating to notification screen
    if (screen === 'notification-org') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('notificationsRefreshed'));
      }, 100);
    }
  };

  const toggleCalendarDropdown = () => {
    setIsCalendarDropdownOpen(!isCalendarDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleMailDropdown = () => {
  if (!isMailDropdownOpen) {
    // Opening the dropdown - mark current time as last viewed
    const now = new Date().toISOString();
    setLastViewedMailTime(now);
    localStorage.setItem('lastViewedMailTime_org', now);
  }
  setIsMailDropdownOpen(!isMailDropdownOpen);
  setIsProfileDropdownOpen(false);
  setIsCalendarDropdownOpen(false);
  setIsNotificationDropdownOpen(false);
};

 const toggleNotificationDropdown = () => {
  if (!isNotificationDropdownOpen) {
    // Opening the dropdown - mark current time as last viewed
    const now = new Date().toISOString();
    setLastViewedNotificationTime(now);
    localStorage.setItem('lastViewedNotificationTime_org', now);
  }
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

  const handleRefreshNotifications = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const toggleNotificationReadStatus = async (notificationId) => {
  const notification = notifications.find((n) => n.id === notificationId);
  if (!notification) return;

  const isReadNow = !notification.read;
  
  // Optimistically update UI
  setNotifications((prevNotifications) =>
    prevNotifications.map((n) =>
      n.id === notificationId ? { ...n, read: isReadNow } : n
    )
  );
  setActiveNotificationMenu(null);

  try {
    // Update localStorage
    const readLocalIds = JSON.parse(
      localStorage.getItem("orgReadNotificationIds") || "[]"
    );
    const notifId = notification.notificationId || notification.id;
    
    if (isReadNow && !readLocalIds.includes(notifId)) {
      readLocalIds.push(notifId);
      localStorage.setItem("orgReadNotificationIds", JSON.stringify(readLocalIds));
    } else if (!isReadNow) {
      const filtered = readLocalIds.filter(id => id !== notifId);
      localStorage.setItem("orgReadNotificationIds", JSON.stringify(filtered));
    }

    // Handle different notification types
    if (notification.id.toString().startsWith('sync-')) {
      const syncId = parseInt(notification.id.replace('sync-', ''));
      if (window.electronAPI.markSyncNotificationAsRead) {
        await window.electronAPI.markSyncNotificationAsRead(syncId);
      }
    } else if (notification.id.toString().startsWith('event-')) {
      // Event notifications are stored in localStorage only
      console.log("[DonorRecordOrg] Event notification marked as read in localStorage");
    } else {
      // Regular notifications
      if (window.electronAPI) {
        await window.electronAPI.markOrgNotificationAsRead(notificationId);
      }
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    // Revert UI on error
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) =>
        n.id === notificationId ? { ...n, read: !isReadNow } : n
      )
    );
  }
};

  const markAllAsRead = async () => {
  // Optimistically update UI first
  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  
  try {
    if (typeof window !== "undefined" && window.electronAPI) {
      // Update localStorage
      const readLocalIds = JSON.parse(
        localStorage.getItem("orgReadNotificationIds") || "[]"
      );
      const allIds = notifications.map((n) => n.notificationId || n.id);
      const mergedIds = Array.from(new Set([...readLocalIds, ...allIds]));
      localStorage.setItem("orgReadNotificationIds", JSON.stringify(mergedIds));

      // Mark regular notifications as read in database
      const regularNotifications = notifications.filter(
        (n) => !n.id.toString().startsWith('sync-') && 
               !n.id.toString().startsWith('event-')
      );
      
      if (regularNotifications.length > 0) {
        const unreadDbIds = regularNotifications
          .filter((n) => !n.read && typeof n.id === "number")
          .map((n) => n.id);
        
        await Promise.all(
          unreadDbIds.map((id) =>
            window.electronAPI.markOrgNotificationAsRead(id)
          )
        );
      }

      // Mark sync notifications as read
      const syncNotifications = notifications.filter((n) => 
        n.id.toString().startsWith('sync-')
      );
      
      if (syncNotifications.length > 0 && window.electronAPI.markSyncNotificationAsRead) {
        const syncIds = syncNotifications.map((n) => 
          parseInt(n.id.replace('sync-', ''))
        );
        await Promise.all(
          syncIds.map((id) => window.electronAPI.markSyncNotificationAsRead(id))
        );
      }
    }
  } catch (error) {
    console.error("Error marking all notifications as read (Org):", error);
    // Reload to ensure consistency
    await loadNotifications();
  }
};

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "declined":
        return "#ef4444";
      case "cancelled":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      case "warning":
        return "#f97316";
      case "alert":
        return "#f97316";
      case "urgent":
        return "#ef4444";
      case "expired":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={14} />;
      case "declined":
        return <X size={14} />;
      case "cancelled":
        return <X size={14} />;
      case "pending":
        return <Clock size={14} />;
      case "info":
        return <Bell size={14} />;
      case "warning":
        return <Bell size={14} />;
      case "alert":
      case "urgent":
        return (
          <img
            src="/assets/urgent-blood.png"
            alt="Blood Alert"
            style={{ width: "16px", height: "16px" }}
          />
        );
      case "expired":
        return (
          <img
            src="/assets/expired-blood.png"
            alt="Expired Blood"
            style={{ width: "16px", height: "16px" }}
          />
        );
      default:
        return <Bell size={14} />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const handleNotificationClick = async (notification) => {
  // Mark as read when clicked
  if (!notification.read) {
    await toggleNotificationReadStatus(notification.id);
  }
  
  // Navigate to full notification page
  handleNavigate("notification-org");
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

  const unreadCount = getUnreadNotificationCount();

  const getEventStatus = (dateStr, status) => {
    if (status === "cancelled" || status === "declined") return status;
    if (status === "pending") return "pending";

    const eventDate = new Date(dateStr + "T23:59:59");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return eventDate < today ? "finished" : "scheduled";
  };

  const getEventStatusColor = (status, dateString) => {
    const dynamicStatus = getEventStatus(dateString, status);

    switch (dynamicStatus) {
      case "scheduled":
        return "#3b82f6";
      case "finished":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "cancelled":
        return "#ef4444";
      case "declined":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getAppointmentIcon = (type) => {
    return "🩸";
  };

  const getAppointmentIconColor = (index) => {
    const colors = ["red-bg", "blue-bg", "green-bg", "yellow-bg"];
    return colors[index % colors.length];
  };

  const getNewMailCount = () => {
  const lastViewed = new Date(lastViewedMailTime);
  return mailMessages.filter((m) => !m.read && new Date(m.timestamp) > lastViewed).length;
};

  const getMailSubject = (status, title) => {
    switch (status) {
      case "approved":
        return `Partnership Request Approved - ${title}`;
      case "declined":
        return `Partnership Request Declined - ${title}`;
      case "pending":
        return `Partnership Request Under Review - ${title}`;
      default:
        return `Partnership Request Update - ${title}`;
    }
  };

  const getMailPreview = (status, message) => {
    const preview = message.substring(0, 60);
    switch (status) {
      case "approved":
        return `Your partnership request has been approved. ${preview}...`;
      case "declined":
        return `Your partnership request has been declined. ${preview}...`;
      case "pending":
        return `Your partnership request is under review. ${preview}...`;
      default:
        return `${preview}...`;
    }
  };

  const getMailStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "declined":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

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
      default:
        return <DonorRecordContent currentUser={currentUser} />;
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
        style={{ marginLeft: isSidePanelOpen ? "15rem" : "4rem" }}
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
                        className={`refresh-button ${isLoadingCalendar ? "refreshing" : ""}`}
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
                          <span className="loading-text">Loading events...</span>
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
                      calendarAppointments.map((appointment, index) => {
                        const eventDate = new Date(appointment.date + "T00:00:00");
                        const formattedDate = eventDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                        
                        // Determine event type icon and color
                        const isPartnership = appointment.type === "partnership";
                        
                        return (
                          <div
                            key={appointment.id}
                            className="dropdown-item calendar-event-item"
                            onClick={() => handleNavigate("calendar-org")}
                            style={{ cursor: "pointer", position: "relative" }}
                          >
                            <div className="request-icon">
                              <div 
                                className="icon-circle"
                                style={{
                                  backgroundColor: isPartnership ? "#dbeafe" : "#fee2e2",
                                  border: `1px solid ${isPartnership ? "#3b82f6" : "#ef4444"}`,
                                }}
                              >
                                {isPartnership ? (
                                  <Handshake size={16} color="#3b82f6" strokeWidth={2.5} />
                                ) : (
                                  <Droplet size={16} color="#ef4444" strokeWidth={2.5} />
                                )}
                              </div>
                            </div>
                            <div className="request-details">
                              <p className="request-title" style={{ marginBottom: "4px" }}>
                                {appointment.title}
                              </p>
                              <p className="request-subtitle" style={{ fontSize: "0.7rem", color: "#6b7280", marginBottom: "2px" }}>
                                {appointment.subtitle}
                              </p>
                              <p className="request-subtitle" style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "600" }}>
                                {formattedDate}
                              </p>
                            </div>
                            {appointment.status === "approved" && (
                              <div 
                                className="approval-badge"
                                style={{
                                  position: "absolute",
                                  top: "8px",
                                  right: "8px",
                                  backgroundColor: "#dcfce7",
                                  color: "#059669",
                                  fontSize: "0.65rem",
                                  fontWeight: "600",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontFamily: "Barlow",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "2px",
                                }}
                                title="Approved by DOH"
                              >
                                <CheckCircle size={10} />
                                <span>Approved</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="dropdown-footer">
                    <button
                      className="footer-button"
                      onClick={() => handleNavigate("calendar-org")}
                    >
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
                {getNewMailCount() > 0 && (
                  <span className="notification-badge">
                    {getNewMailCount()}
                  </span>
                )}
              </button>
                {isMailDropdownOpen && (
                  <div className="dropdown-menu messages-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">MESSAGES</h3>
                        <div className="notification-header-actions">
                          <button
                            className={`refresh-button ${isLoadingMail ? "refreshing" : ""}`}
                            onClick={loadMailMessages}
                            disabled={isLoadingMail}
                            title="Refresh messages"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            className="mark-all-read-button"
                            onClick={async () => {
                              try {
                                const unreadMails = mailMessages.filter((m) => !m.read);
                                if (unreadMails.length > 0) {
                                  // Mark regular mails as read
                                  const regularUnreadIds = unreadMails
                                    .filter((m) => m.type === 'mail')
                                    .map((m) => m.id);
                                  
                                  // Mark sync notifications as read
                                  const syncUnreadIds = unreadMails
                                    .filter((m) => m.type === 'sync')
                                    .map((m) => parseInt(m.id.replace('sync-', '')));
                                  
                                  if (regularUnreadIds.length > 0) {
                                    await Promise.all(
                                      regularUnreadIds.map((id) =>
                                        window.electronAPI.markMailAsRead(id)
                                      )
                                    );
                                  }
                                  
                                  if (syncUnreadIds.length > 0 && window.electronAPI.markSyncNotificationAsRead) {
                                    await Promise.all(
                                      syncUnreadIds.map((id) =>
                                        window.electronAPI.markSyncNotificationAsRead(id)
                                      )
                                    );
                                  }
                                  
                                  await loadMailMessages();
                                }
                              } catch (e) {
                                console.error("Error marking all mails as read:", e);
                              }
                            }}
                            disabled={mailMessages.filter((m) => !m.read).length === 0}
                            title="Mark all as read"
                          >
                            <CheckCircle size={14} />
                          </button>
                        </div>
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
                            className={`dropdown-item ${!mail.read ? "unread-mail" : ""}`}
                            onClick={() => handleNavigate("mail-org")}
                            style={{ cursor: "pointer" }}
                          >
                            <div
                              className="message-avatar"
                              style={{ 
                                backgroundColor: mail.avatarColor,
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'Barlow'
                              }}
                            >
                              {mail.avatar}
                            </div>
                            <div className="message-details">
                              <div className="message-header-row">
                                <p className="message-sender">{mail.from}</p>
                                <div className="mail-badges">
                                  {mail.type === 'sync' && (
                                    <span className="sync-badge" title="Sync Request">
                                      <RefreshCw size={10} /> Sync
                                    </span>
                                  )}
                                  <div
                                    className="mail-status-dot"
                                    style={{
                                      backgroundColor: mail.status === 'approved' ? '#10b981' : 
                                                    mail.status === 'declined' ? '#ef4444' : '#f59e0b',
                                    }}
                                    title={mail.status.toUpperCase()}
                                  ></div>
                                </div>
                              </div>
                              <p className="message-subject">{mail.subject}</p>
                              <p className="message-preview">{mail.preview}</p>
                              <span className="message-time">
                                {getTimeAgo(mail.timestamp)}
                              </span>
                            </div>
                            {!mail.read && <div className="unread-dot-dropdown"></div>}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="dropdown-footer">
                      <button
                        className="footer-button"
                        onClick={() => handleNavigate("mail-org")}
                      >
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
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                {isNotificationDropdownOpen && (
                  <div className="dropdown-menu notifications-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">NOTIFICATIONS</h3>
                        <div className="notification-header-actions">
                          <button
                            className={`refresh-button ${isRefreshing ? "refreshing" : ""}`}
                            onClick={handleRefreshNotifications}
                            disabled={isRefreshing}
                            title="Refresh notifications"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            className={`refresh-button ${isRefreshing ? "refreshing" : ""}`}
                            onClick={async () => {
                              try {
                                if (
                                  typeof window !== "undefined" &&
                                  window.electronAPI
                                ) {
                                  await window.electronAPI.checkAndCreateExpirationNotifications();
                                  await handleRefreshNotifications();
                                }
                              } catch (e) {
                                console.error(
                                  "Error running expiration check (Org):",
                                  e
                                );
                              }
                            }}
                            title="Run expiration check"
                          >
                            <Bell size={14} />
                          </button>
                          <button
                            className="mark-all-read-button"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            title="Mark all as read"
                          >
                            Mark all read
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {getLatestNotifications().map((notification) => (
                      <div
                        key={notification.id}
                        className={`dropdown-item notification-item ${!notification.read ? "unread-notification" : ""}`}
                        onClick={() => handleNotificationClick(notification)}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className="notification-icon"
                          style={{
                            color: getStatusColor(notification.status),
                          }}
                        >
                          <div
                            className="icon-circle"
                            style={{
                              backgroundColor: `${getStatusColor(notification.status)}15`,
                              border: `1px solid ${getStatusColor(notification.status)}30`,
                            }}
                          >
                            {getStatusIcon(notification.status)}
                          </div>
                        </div>
                        <div className="notification-details">
                          <div className="notification-header-row">
                            <p className="notification-title">
                              {notification.title}
                            </p>
                            <div className="notification-actions">
                              <span className="notification-time">
                                {getTimeAgo(notification.timestamp)}
                              </span>
                              <div className="notification-menu-container">
                                <button
                                  className="notification-menu-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNotificationMenu(
                                      activeNotificationMenu === notification.id
                                        ? null
                                        : notification.id
                                    );
                                  }}
                                >
                                  <MoreVertical size={12} />
                                </button>
                                {activeNotificationMenu === notification.id && (
                                  <div className="notification-menu">
                                    <button
                                      className="notification-menu-item"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await toggleNotificationReadStatus(notification.id);
                                      }}
                                    >
                                      Mark as {notification.read ? "Unread" : "Read"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="notification-subtitle">
                            {notification.message.length > 60
                              ? `${notification.message.substring(0, 60)}...`
                              : notification.message}
                          </p>
                          <span className="notification-requestor">
                            From: {notification.requestor}
                          </span>
                        </div>
                        {!notification.read && (
                          <div className="unread-dot-dropdown"></div>
                        )}
                      </div>
                    ))}
                    </div>
                    <div className="dropdown-footer">
                      <button
                        className="footer-button"
                        onClick={() => handleNavigate("notification-org")}
                      >
                        See All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-section relative">
                <span className="user-name">{userName}</span>
                <div
                  className={`user-avatar cursor-pointer ${activeScreen === "profile" ? "user-avatar-active" : ""}`}
                  onClick={toggleProfileDropdown}
                >
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                        border: "1px solid #059669",
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
        onCancel={() => setShowLogoutDialog(false)}
      />

      <style>{`
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
          border: "1px solid #059669",
          font-family: 'Barlow';
        }

        .user-avatar:hover {
          background-color: #9ca3af;
          border: "1px solid #059669",
        }

        .user-avatar-active {
          background-color: #059669 !important;
          border: "1px solid #059669",
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

          .requests-dropdown, .notifications-dropdown, .messages-dropdown {
            width: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default DonorRecordOrg;
