import React, { useState, useEffect, useRef } from "react";
import { Plus, Filter, Search } from "lucide-react";

const DonorRecord = () => {
  const [donorData, setDonorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchDonorTerm, setSearchDonorTerm] = useState("");
  const [barangaySearch, setBarangaySearch] = useState("");
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "sortby", direction: "asc" });
  const [filterConfig, setFilterConfig] = useState({ field: "", value: "" });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: "", description: "" });
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
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
    contactNumber: "",
    address: "",
  });

  const barangays = [
    "Agusan", "Baikingon", "Balubal", "Balulang", "Barangay 1", "Barangay 2", 
    "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6", "Barangay 7", 
    "Barangay 8", "Barangay 9", "Barangay 10", "Barangay 11", "Barangay 12", 
    "Barangay 13", "Barangay 14", "Barangay 15", "Barangay 16", "Barangay 17", 
    "Barangay 18", "Barangay 19", "Barangay 20", "Barangay 21", "Barangay 22", 
    "Barangay 23", "Barangay 24", "Barangay 25", "Barangay 26", "Barangay 27", 
    "Barangay 28", "Barangay 29", "Barangay 30", "Barangay 31", "Barangay 32", 
    "Barangay 33", "Barangay 34", "Barangay 35", "Barangay 36", "Barangay 37", 
    "Barangay 38", "Barangay 39", "Barangay 40", "Bayabas", "Bayanga", 
    "Besigan", "Bonbon", "Bugo", "Bulua", "Camaman-an", "Canito-an", "Carmen", 
    "Consolacion", "Cugman", "Dansolihon", "F. S. Catanico", "Gusa", "Indahag", 
    "Iponan", "Kauswagan", "Lapasan", "Lumbia", "Macabalan", "Macasandig", 
    "Mambuaya", "Nazareth", "Pagalungan", "Pagatpat", "Patag", "Pigsag-an", 
    "Puerto", "Puntod", "San Simon", "Tablon", "Taglimao", "Tagpangi", 
    "Tignapoloan", "Tuburan", "Tumpagon"
  ];

  const filteredBarangays = barangaySearch
    ? barangays.filter(b => b.toLowerCase().startsWith(barangaySearch.toLowerCase()))
    : [];

  useEffect(() => {
    loadDonorData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDonorData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!window.electronAPI) {
        throw new Error("Electron API not available. Make sure you are running this in an Electron environment.");
      }
      const data = await window.electronAPI.getAllDonorRecords();
      setDonorData(data);
    } catch (err) {
      console.error("Error loading donor data:", err);
      setError(`Failed to load donor data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const filteredData = donorData.filter(item => 
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
  const allSelected = displayData.length > 0 && displayData.every((item) => item.selected);
  const someSelected = displayData.some((item) => item.selected) && !allSelected;
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
    setShowConfirmDeleteModal(true);
  };
  
  const handleDelete = async () => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }
      const selectedIds = donorData.filter((item) => item.selected).map((item) => item.id);
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
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
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
        const d = new Date(date);
        const adjustedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return adjustedDate.toISOString().split("T")[0];
      };
  
      setEditingDonor({
        ...selected,
        birthdate: formatDate(selected.birthdate),
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
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
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
        contactNumber: editingDonor.contactNumber,
        address: editingDonor.address,
      };
  
      await window.electronAPI.updateDonorRecord(editingDonor.id, donorUpdateData);
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
    setFormData(prev => ({ ...prev, address: barangay }));
    setBarangaySearch("");
    setShowBarangayDropdown(false);
  };

  const handleBarangayInputChange = (value) => {
    setFormData(prev => ({ ...prev, address: value }));
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
        donorId: "", firstName: "", middleName: "", lastName: "", gender: "", birthdate: "",
        age: "", bloodType: "", rhFactor: "", contactNumber: "", address: "",
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

  if (loading || saving) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f9fafb", minHeight: "100vh", fontFamily: "Barlow" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px", fontSize: "16px", color: "#6b7280" }}>
          Loading donor records...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f9fafb", minHeight: "100vh", fontFamily: "Barlow", borderRadius: "8px" }}>
      <div style={{ margin: 0 }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#165C3C", marginTop: "1px", fontFamily: "Barlow" }}>
          Regional Blood Center
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "-7px", fontFamily: "Barlow" }}>
          Centralized Donor Record
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
          <span>{error}</span>
          <button style={{ backgroundColor: "#059669", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }} onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", backgroundColor: "white", padding: "16px", borderRadius: "8px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", zIndex: 1, color: "#9ca3af" }} />
            <input type="text" placeholder="Search" style={{ paddingLeft: "40px", paddingRight: "16px", paddingTop: "8px", paddingBottom: "8px", border: "1px solid #d1d5db", borderRadius: "6px", width: "300px", fontSize: "14px", outline: "none" }} value={searchTerm} onChange={handleSearch} />
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
                minWidth: "100px"
              }}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <span>{getSortLabel()}</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: showSortDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
              </svg>
            </button>
            {showSortDropdown && (
              <div style={{ position: "absolute", top: "100%", left: 0, backgroundColor: "white", border: "#8daef2", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", zIndex: 1000, minWidth: "200px", marginTop: "4px" }}>
                {[
                  { key: "sort", label: "Sort by" },
                  { key: "donorId", label: "Donor ID" },
                  { key: "firstName", label: "First Name" },
                  { key: "lastName", label: "Last Name" },
                  { key: "bloodType", label: "Blood Type" },
                  { key: "age", label: "Age" },
                  { key: "gender", label: "Gender" },
                  { key: "address", label: "Address" },
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
                      backgroundColor: sortConfig.key === item.key ? "#dbeafe" : "transparent",
                      fontWeight: sortConfig.key === item.key ? "600" : "normal",
                    }}
                    onClick={() => handleSort(item.key)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sortConfig.key === item.key ? "#dbeafe" : "#f3f4f6"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = sortConfig.key === item.key ? "#dbeafe" : "transparent"; }}
                  >
                    {item.label} {sortConfig.key === item.key && (sortConfig.direction === "asc" ? "↑" : "↓")}
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
                transition: "all 0.2s ease"
              }}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter size={16} />
              <span>Filter</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: showFilterDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
              </svg>
            </button>
            {showFilterDropdown && (
              <div style={{ position: "absolute", top: "100%", left: 0, backgroundColor: "white", border: "#8daef2", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", zIndex: 1000, minWidth: "300px", marginTop: "4px" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Filter Field</label>
                    <select
                      style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", fontFamily: "Barlow", outline: "none", backgroundColor: "white", cursor: "pointer", width: "100%", boxSizing: "border-box" }}
                      value={filterConfig.field}
                      onChange={(e) => setFilterConfig({ ...filterConfig, field: e.target.value })}
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
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Filter Value</label>
                    <input
                      type="text"
                      style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", fontFamily: "Barlow", outline: "none", backgroundColor: "white", width: "100%", boxSizing: "border-box" }}
                      value={filterConfig.value}
                      onChange={(e) => setFilterConfig({ ...filterConfig, value: e.target.value })}
                      placeholder="Enter value to filter"
                    />
                  </div>
                </div>
                <div style={{ padding: "8px", display: "flex", gap: "8px" }}>
                  <button
                    style={{ flex: 1, padding: "8px 12px", fontSize: "12px", backgroundColor: "#9ca3af", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "Barlow" }}
                    onClick={() => {
                      setFilterConfig({ field: "", value: "" });
                      setShowFilterDropdown(false);
                    }}
                  >
                    Clear
                  </button>
                  <button
                    style={{ flex: 1, padding: "8px 12px", fontSize: "12px", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "Barlow" }}
                    onClick={() => setShowFilterDropdown(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "#2C58DC", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Approve Sync</span>
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "#FFC200", color: "black", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }} onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Donor</span>
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <tr>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>
                <input type="checkbox" style={{ width: "16px", height: "16px", cursor: "pointer" }} checked={allSelected} ref={(input) => { if (input) input.indeterminate = someSelected; }} onChange={toggleAllSelection} />
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb", width: "12%" }}>DONOR ID</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>FIRST NAME</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>MIDDLE NAME</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>LAST NAME</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>GENDER</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>BIRTHDATE</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>AGE</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>BLOOD TYPE</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>RH FACTOR</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>CONTACT NUMBER</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>ADDRESS</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: "white" }}>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ padding: "40px", fontSize: "11px", fontFamily: "Arial", color: "#111827", textAlign: "center" }}>
                  {searchTerm || filterConfig.value ? "No donor records found matching your criteria" : "No donor records found"}
                </td>
              </tr>
            ) : (
              displayData.map((item, index) => (
                <tr key={item.id} style={{ backgroundColor: index % 2 === 1 ? "#f9fafb" : "white", ...(item.selected && { backgroundColor: "#e6f7ff" }) }}>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>
                    <input type="checkbox" style={{ width: "16px", height: "16px", cursor: "pointer" }} checked={item.selected} onChange={() => toggleRowSelection(item.id)} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.donorId}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.firstName}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.middleName || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.lastName}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.gender}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.birthdate}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.age}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.bloodType}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.rhFactor}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.contactNumber}</td>
                  <td style={{ padding: "12px 16px", fontSize: "11px", fontFamily: "Arial", color: "#111827", borderBottom: "1px solid rgba(163, 163, 163, 0.2)" }}>{item.address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0", background: "#4a5568", boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)", borderRadius: "8px", zIndex: 1000, color: "white", overflow: "hidden" }}>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", backgroundColor: "#4a5568", color: "white", border: "none", cursor: "pointer", fontSize: "16px", borderRight: "1px solid #2d3748" }} onClick={clearAllSelection}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div style={{ padding: "12px 24px", backgroundColor: "#4a5568", borderRight: "1px solid #2d3748" }}>
            <span style={{ fontSize: "14px", fontWeight: "500", color: "white", margin: 0 }}>
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>
          {singleSelected && (
            <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", backgroundColor: "#4a5568", color: "white", border: "none", cursor: "pointer", fontSize: "14px", borderRight: "1px solid #2d3748" }} onClick={handleEditClick}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          )}
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", backgroundColor: "#4a5568", color: "white", border: "none", cursor: "pointer", fontSize: "14px" }} onClick={handleDeleteClick}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowAddModal(false)}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", width: "95%", maxWidth: "950px", maxHeight: "85vh", overflow: "hidden", boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 30px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#165C3C", margin: 0, fontFamily: "Barlow" }}>Donor Record</h2>
                <p style={{ fontSize: "16px", color: "#6b7280", margin: "4px 0 0 0", fontFamily: "Barlow" }}>Add Donor</p>
              </div>
              <button style={{ fontSize: "28px", color: "#6b7280", cursor: "pointer", border: "none", background: "none", padding: "0", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div style={{ padding: "24px 30px", maxHeight: "calc(85vh - 160px)", overflowY: "auto" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "6px", display: "block", fontFamily: "Barlow" }}>Donor ID or Donor Name</label>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input type="text" placeholder="Find Donor ID or Donor Name" style={{ width: "100%", padding: "8px 16px", paddingLeft: "36px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "11px", fontFamily: "Arial", outline: "none", boxSizing: "border-box" }} value={searchDonorTerm} onChange={(e) => setSearchDonorTerm(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Donor ID (Auto-generated)</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", backgroundColor: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" }} value={formData.donorId} readOnly disabled />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>First Name *</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={formData.firstName} onChange={(e) => handleFormChange("firstName", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Middle Name (Optional)</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={formData.middleName} onChange={(e) => handleFormChange("middleName", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Last Name *</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={formData.lastName} onChange={(e) => handleFormChange("lastName", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Gender *</label>
                  <select style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", cursor: "pointer", backgroundColor: "white" }} value={formData.gender} onChange={(e) => handleFormChange("gender", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Birthdate *</label>
                  <input type="date" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={formData.birthdate} onChange={(e) => handleFormChange("birthdate", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Age (Auto-calculated)</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", backgroundColor: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" }} value={formData.age} readOnly disabled />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Blood Type *</label>
                  <select style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", cursor: "pointer", backgroundColor: "white" }} value={formData.bloodType} onChange={(e) => handleFormChange("bloodType", e.target.value)}>
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>RH Factor *</label>
                  <select style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", cursor: "pointer", backgroundColor: "white" }} value={formData.rhFactor} onChange={(e) => handleFormChange("rhFactor", e.target.value)}>
                    <option value="">Select</option>
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Contact Number *</label>
                  <input type="tel" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={formData.contactNumber} onChange={(e) => handleFormChange("contactNumber", e.target.value)} placeholder="09XXXXXXXXX" />
                </div>
                <div style={{ position: "relative", gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", display: "block", fontFamily: "Barlow" }}>Barangay *</label>
                  <input 
                    type="text" 
                    style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", width: "100%", boxSizing: "border-box" }} 
                    value={formData.address || barangaySearch} 
                    onChange={(e) => handleBarangayInputChange(e.target.value)}
                    onFocus={() => { if (barangaySearch) { setShowBarangayDropdown(true); }}} 
                    placeholder="Type to search barangay..." 
                  />
                  {showBarangayDropdown && filteredBarangays.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "200px", overflowY: "auto", backgroundColor: "white", border: "1px solid #d1d5db", borderTop: "none", borderRadius: "0 0 4px 4px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", zIndex: 10 }}>
                      {filteredBarangays.map((barangay) => (
                        <div key={barangay} style={{ padding: "8px 10px", fontSize: "11px", fontFamily: "Barlow", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }} onClick={() => selectBarangay(barangay)} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>
                          {barangay}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 30px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "center", backgroundColor: "white" }}>
              <button style={{ padding: "12px 48px", backgroundColor: "#FFC200", color: "black", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "600", fontFamily: "Barlow" }} onClick={handleAddDonor}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowConfirmDeleteModal(false)}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", width: "95%", maxWidth: "900px", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", fontFamily: "Barlow" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 30px", borderBottom: "1px solid #e5e7eb", backgroundColor: "white" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#165C3C", margin: 0, fontFamily: "Barlow" }}>Confirm Delete</h3>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, fontFamily: "Barlow" }}>Review donors before deletion</p>
              </div>
              <button style={{ background: "none", border: "none", fontSize: "20px", color: "#6b7280", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "4px" }} onClick={() => setShowConfirmDeleteModal(false)}>×</button>
            </div>

            <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #ef4444", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#991b1b", margin: "0 0 12px 0" }}>
                  Donors to Delete ({donorData.filter((item) => item.selected).length})
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr", gap: "12px", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                  <div>Donor ID</div>
                  <div>Full Name</div>
                  <div>Address</div>
                  <div>Blood Type</div>
                  <div>Contact</div>
                </div>
                {donorData.filter((item) => item.selected).map((item, index) => (
                  <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr", gap: "12px", fontSize: "12px", color: "#6b7280", padding: "8px 0", borderTop: index > 0 ? "1px solid #e5e7eb" : "none" }}>
                    <div style={{ fontWeight: "500", color: "#374151" }}>{item.donorId}</div>
                    <div>{`${item.firstName} ${item.middleName || ''} ${item.lastName}`.trim()}</div>
                    <div>{item.address}</div>
                    <div>{item.bloodType}{item.rhFactor}</div>
                    <div>{item.contactNumber}</div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #ef4444", borderRadius: "8px", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <svg width="20" height="20" fill="#ef4444" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#991b1b", margin: "0 0 4px 0" }}>Confirm Delete Action</p>
                  <p style={{ fontSize: "13px", color: "#7f1d1d", margin: 0, lineHeight: "1.5" }}>
                    These donors will be permanently deleted from the records. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: "20px 30px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "center", gap: "12px", backgroundColor: "white" }}>
              <button type="button" style={{ padding: "12px 48px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "600", fontFamily: "Barlow", minWidth: "120px" }} onClick={handleDelete}>
                Confirm Delete ({donorData.filter((item) => item.selected).length} donors)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Donor Modal */}
      {showEditModal && editingDonor && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowEditModal(false)}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", width: "95%", maxWidth: "950px", maxHeight: "85vh", overflow: "hidden", boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 30px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#165C3C", margin: 0, fontFamily: "Barlow" }}>Donor Record</h2>
                <p style={{ fontSize: "16px", color: "#6b7280", margin: "4px 0 0 0", fontFamily: "Barlow" }}>Edit Donor</p>
              </div>
              <button style={{ fontSize: "28px", color: "#6b7280", cursor: "pointer", border: "none", background: "none", padding: "0", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <div style={{ padding: "24px 30px", maxHeight: "calc(85vh - 160px)", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Donor ID</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", backgroundColor: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" }} value={editingDonor.donorId} readOnly disabled />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>First Name *</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={editingDonor.firstName} onChange={(e) => handleEditDonorChange("firstName", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Middle Name (Optional)</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={editingDonor.middleName || ""} onChange={(e) => handleEditDonorChange("middleName", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Last Name *</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={editingDonor.lastName} onChange={(e) => handleEditDonorChange("lastName", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Gender *</label>
                  <select style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", cursor: "pointer", backgroundColor: "white" }} value={editingDonor.gender} onChange={(e) => handleEditDonorChange("gender", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Birthdate *</label>
                  <input type="date" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={editingDonor.birthdate} onChange={(e) => handleEditDonorChange("birthdate", e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Age (Auto-calculated)</label>
                  <input type="text" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", backgroundColor: "#f9fafb", color: "#9ca3af", cursor: "not-allowed" }} value={editingDonor.age} readOnly disabled />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Blood Type *</label>
                  <select style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", cursor: "pointer", backgroundColor: "white" }} value={editingDonor.bloodType} onChange={(e) => handleEditDonorChange("bloodType", e.target.value)}>
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>RH Factor *</label>
                  <select style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", cursor: "pointer", backgroundColor: "white" }} value={editingDonor.rhFactor} onChange={(e) => handleEditDonorChange("rhFactor", e.target.value)}>
                    <option value="">Select</option>
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", fontFamily: "Barlow" }}>Contact Number *</label>
                  <input type="tel" style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none" }} value={editingDonor.contactNumber} onChange={(e) => handleEditDonorChange("contactNumber", e.target.value)} placeholder="09XXXXXXXXX" />
                </div>
                <div style={{ position: "relative", gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#374151", marginBottom: "4px", display: "block", fontFamily: "Barlow" }}>Barangay *</label>
                  <input 
                    type="text" 
                    style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontFamily: "Barlow", outline: "none", width: "100%", boxSizing: "border-box" }} 
                    value={editingDonor.address} 
                    onChange={(e) => handleEditDonorChange("address", e.target.value)}
                    placeholder="Type to search barangay..." 
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 30px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "center", backgroundColor: "white" }}>
              <button style={{ padding: "12px 48px", backgroundColor: "#FFC200", color: "black", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "600", fontFamily: "Barlow" }} onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "10px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "11px", width: "30%", maxWidth: "350px", padding: "40px 30px 30px", boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Barlow", position: "relative" }}>
            <button
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "24px", color: "#9ca3af", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "4px" }}
              onClick={() => setShowSuccessModal(false)}
            >
              ×
            </button>

            <div style={{ width: "30px", height: "30px", backgroundColor: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="48" height="48" fill="white" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#165C3C", textAlign: "center", fontFamily: "Barlow" }}>{successMessage.title}</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", lineHeight: "1.5", fontFamily: "Barlow", marginTop: "-5px", paddingLeft: "20px", paddingRight: "20px" }}>
              {successMessage.description}
            </p>

            <button
              style={{ padding: "12px 60px", backgroundColor: "#FFC200", color: "black", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "600", fontFamily: "Barlow" }}
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorRecord;