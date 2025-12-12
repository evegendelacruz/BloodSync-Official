import React, { useState, useEffect, useRef } from "react";
import Loader from "../../../components/Loader";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Plasma = () => {
  const [plasmaData, setPlasmaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showReleaseDetailsModal, setShowReleaseDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewInvoiceData, setPreviewInvoiceData] = useState(null);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created",
    direction: "desc",
  });
  const [filterConfig, setFilterConfig] = useState({ field: "", value: "" });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [editValidationErrors, setEditValidationErrors] = useState({});
  const [releaseValidationErrors, setReleaseValidationErrors] = useState({});
  const [stockItems, setStockItems] = useState([
    {
      id: 1,
      serial_id: "",
      type: "O",
      rhFactor: "+",
      volume: 100,
      collection: "",
      expiration: "",
      status: "Stored",
      source: "Walk-In",
    },
  ]);
  const [releaseData, setReleaseData] = useState({
    receivingFacility: "",
    address: "",
    contactNumber: "",
    classification: "",
    authorizedRecipient: "",
    recipientDesignation: "",
    dateOfRelease: "",
    conditionUponRelease: "",
    requestReference: "",
    releasedBy: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const facilityAddresses = {
  "Northern Mindanao Medical Center": "Capitol Compound, Cagayan de Oro City, Misamis Oriental",
  "J.R. Borja General Hospital": "J.V. Serina St., Carmen, Cagayan de Oro City, Misamis Oriental",
  "Cagayan de Oro Medical Center, Inc.": "Tiano-Nacalaban Sts., Cagayan de Oro City, Misamis Oriental",
  "Maria Reyna‑Xavier University Hospital, Inc.": "Msgr. Santiago Hayes St., Cagayan de Oro City, Misamis Oriental",
  "Madonna and Child Medical Center": "J. Serina St., Carmen, Cagayan de Oro City, Misamis Oriental",
  "Sabal Hospital, Inc.": "292 Don Apolinar Velez St., Cagayan de Oro City, Misamis Oriental",
  "Cagayan de Oro Polymedic General Hospital, Inc.": "Don Apolinar Velez St., Cagayan de Oro City, Misamis Oriental",
  "Capitol University Medical Center Foundation of Cagayan, Inc.": "San Pedro, Gusa, Cagayan de Oro City, Misamis Oriental",
  "Adventist Medical Center–Iligan City, Inc.": "Andres Bonifacio Ave., Brgy. San Miguel, Iligan City, Lanao del Norte",
  "Mercy Community Hospital, Inc.": "Sisters of Mercy Road, Camague, Iligan City, Lanao del Norte",
  "Iligan Medical Center Hospital": "San Miguel Village, Pala-o, Iligan City, Lanao del Norte",
  "Gregorio T. Lluch Memorial Hospital": "Quezon Ave. Extension, Pala-o, Iligan City, Lanao del Norte",
  "Lanao del Norte Provincial Hospital": "Lower Sagadan, Baroy, Lanao del Norte",
  "Bukidnon Provincial Hospital - Manolo Fortich": "San Miguel, Manolo Fortich, Bukidnon",
  "Valencia Polymedic General Hospital, Inc.": "P-13, Sayre Highway, Poblacion, Valencia, Bukidnon",
  "Camiguin General Hospital": "Lacas, Poblacion, Mambajao, Camiguin Province",
  "Mayor Hilarion A. Ramiro Sr. Medical Center": "Maningcol, Ozamiz City, Misamis Occidental",
  "Tobias Feliciano Faith General Hospital, Inc.": "Feliciano St., Las Aguadas, Ozamiz City, Misamis Occidental",
  "Medina General Hospital": "Gov. Angel N. Medina Sr. Avenue, Carmen Annex, Ozamiz City, Misamis Occidental"
};

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Current user loaded:', {
          id: user.id || user.u_id,
          fullName: user.fullName || user.u_full_name,
          role: user.role || user.u_role
        });
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      console.warn('No user found in localStorage');
    }
    
    if (window.electronAPI) {
      try {
        const testResult = window.electronAPI.test();
        console.log("API test result:", testResult);
      } catch (err) {
        console.error("API test failed:", err);
      }
    }
    loadPlasmaData();
  }, []);

  const getUserData = () => {
    if (!currentUser) {
      console.warn('No current user available');
      return null;
    }
    
    // Support both field naming conventions
    const userData = {
      id: currentUser.id || currentUser.u_id,
      fullName: currentUser.fullName || currentUser.u_full_name || currentUser.full_name
    };
    
    console.log('Using userData:', userData);
    
    if (!userData.id || !userData.fullName) {
      console.error('Invalid user data:', userData);
      return null;
    }
    
    return userData;
  };
  

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

  const searchTimeoutsRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(searchTimeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
      searchTimeoutsRef.current = {};
    };
  }, []);

  const loadPlasmaData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.electronAPI) {
        throw new Error(
          "Electron API not available. Make sure you are running this in an Electron environment."
        );
      }

      const data = await window.electronAPI.getPlasmaStock();
      setPlasmaData(data);
    } catch (err) {
      console.error("Error loading plasma data:", err);
      setError(`Failed to load plasma data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      if (value.trim() === "") {
        await loadPlasmaData();
      } else {
        const searchResults = await window.electronAPI.searchPlasmaStock(value);
        setPlasmaData(searchResults);
      }
    } catch (err) {
      console.error("Error searching:", err);
      setError("Search failed");
    }
  };

  const toggleRowSelection = (id) => {
    setPlasmaData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = displayData.every((item) => item.selected);
    setPlasmaData((prevData) =>
      prevData.map((item) => {
        if (displayData.find((d) => d.id === item.id)) {
          return { ...item, selected: !allSelected };
        }
        return item;
      })
    );
  };

  const clearAllSelection = () => {
    setPlasmaData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  const calculateExpiration = (collectionDate) => {
    if (!collectionDate) return "";
    const collection = new Date(collectionDate);
    const expiration = new Date(collection);
    expiration.setDate(collection.getDate() + 365);
    return expiration.toISOString().split("T")[0];
  };

  const handleStockItemChange = (id, field, value) => {
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "collection") {
            updated.expiration = calculateExpiration(value);
          }
          return updated;
        }
        return item;
      })
    );
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[`${id}-${field}`]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${id}-${field}`];
        return newErrors;
      });
    }
  };

  const handleEditItemChange = (field, value) => {
    const updated = { ...editingItem, [field]: value };
    if (field === "collection") {
      updated.expiration = calculateExpiration(value);
    }
    setEditingItem(updated);
    
    // Clear validation error for this field when user starts typing
    if (editValidationErrors[field]) {
      setEditValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addNewRow = () => {
    const newId = Math.max(...stockItems.map((item) => item.id)) + 1;
    setStockItems((prev) => [
      ...prev,
      {
        id: newId,
        serial_id: "",
        type: "O",
        rhFactor: "+",
        volume: 100,
        collection: "",
        expiration: "",
        status: "Stored",
        source: "Walk-In", 
      },
    ]);
    setValidationErrors({});
  };

  const removeRow = (id) => {
    if (stockItems.length > 1) {
      setStockItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSaveAllStock = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    stockItems.forEach((item) => {
      if (!item.serial_id || item.serial_id.trim() === "") {
        errors[`${item.id}-serial_id`] = "Serial ID is required";
      }
      if (!item.collection) {
        errors[`${item.id}-collection`] = "Collection date is required";
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      setSaving(true);
      if (!window.electronAPI) {
        setValidationErrors({ api: "Electron API not available" });
        return;
      }

      // Get userData using helper function
      const userData = getUserData();
      
      if (!userData) {
        setValidationErrors({ api: "User information not available. Please log in again." });
        return;
      }

      console.log('Saving plasma stock with userData:', userData);
  
      for (const item of stockItems) {
        const stockData = {
          serial_id: item.serial_id,
          type: item.type,
          rhFactor: item.rhFactor,
          volume: item.volume,
          collection: item.collection,
          expiration: item.expiration,
          status: item.status,
          source: item.source,
        };
        await window.electronAPI.addPlasmaStock(stockData, userData);
      }

      // ADDED: Record activity for each added item
    for (const item of stockItems) {
      await window.electronAPI.recordActivity(
        userData.id,
        userData.fullName,
        'ADD',
        `Added plasma stock with Serial ID: ${item.serial_id}, Blood Type: ${item.type}${item.rhFactor}, Volume: ${item.volume}mL`,
        'blood_stock_plasma',
        null,
        {
          serial_id: item.serial_id,
          type: item.type,
          rhFactor: item.rhFactor,
          volume: item.volume,
          source: item.source
        }
      );
    }

  
      setShowAddModal(false);
      setValidationErrors({});
      setStockItems([
        {
          id: 1,
          serial_id: "",
          type: "O",
          rhFactor: "+",
          volume: 100,
          collection: "",
          expiration: "",
          status: "Stored",
          source: "Walk-In",
        },
      ]);
      await loadPlasmaData();
      setError(null);
  
      setSuccessMessage({
        title: "Stock Added Successfully!",
        description:
          "Plasma units have been added to the inventory. Check the stock report for details.",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error adding plasma stock:", err);
      
      // Extract the error message
      let errorMessage = err.message;
      
      // Check if it's a duplicate serial ID error
      if (errorMessage.includes("already exists")) {
        // Extract serial ID from error message
        const serialIdMatch = errorMessage.match(/Serial ID (\S+) already exists/);
        if (serialIdMatch) {
          const duplicateSerialId = serialIdMatch[1];
          // Find which item has the duplicate serial ID and mark it with specific error
          const duplicateErrors = {};
          stockItems.forEach((item) => {
            if (item.serial_id === duplicateSerialId) {
              duplicateErrors[`${item.id}-serial_id`] = `Serial ID ${duplicateSerialId} already exists`;
            }
          });
          setValidationErrors(duplicateErrors);
        } else {
          setValidationErrors({ save: errorMessage });
        }
      } else {
        setValidationErrors({ save: `Failed to add plasma stock: ${errorMessage}` });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      // Get userData using helper function
      const userData = getUserData();
      
      if (!userData) {
        setError("User information not available. Please log in again.");
        return;
      }

      for (const item of selectedItems) {
        await window.electronAPI.recordActivity(
          userData.id,
          userData.fullName,
          'DELETE',
          `Deleted platelet stock with Serial ID: ${item.serial_id}, Blood Type: ${item.type}${item.rhFactor}`,
          'blood_stock_platelet',
          item.id,
          {
            serial_id: item.serial_id,
            type: item.type,
            rhFactor: item.rhFactor,
            volume: item.volume,
            source: item.source
          }
        );
      }

      console.log('Deleting platelet stock with userData:', userData);

      const selectedIds = plasmaData
        .filter((item) => item.selected)
        .map((item) => item.id);
      if (selectedIds.length === 0) return;
  
      // Get the items to be deleted for activity logging
      const itemsToDelete = plasmaData.filter((item) => item.selected);

      // ADDED: Record activity for each deleted item BEFORE deleting
      for (const item of itemsToDelete) {
        await window.electronAPI.recordActivity(
          userData.id,
          userData.fullName,
          'DELETE',
          `Deleted plasma stock with Serial ID: ${item.serial_id}, Blood Type: ${item.type}${item.rhFactor}`,
          'blood_stock_plasma',
          item.id,
          {
            serial_id: item.serial_id,
            type: item.type,
            rhFactor: item.rhFactor,
            volume: item.volume,
            source: item.source
          }
        );
      }

      console.log('Deleting plasma stock with userData:', userData);

      // FIXED: Pass userData parameter
      await window.electronAPI.deletePlasmaStock(selectedIds, userData);
      setShowConfirmDeleteModal(false);
      await loadPlasmaData();
      clearAllSelection();
      setError(null);
  
      setSuccessMessage({
        title: "Deleted Successfully!",
        description: `${selectedIds.length} plasma stock record(s) have been deleted.`,
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error deleting items:", err);
      setError("Failed to delete items");
    }
  };

  const handleEditClick = () => {
    const selected = plasmaData.find((item) => item.selected);
    if (selected) {
      const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const adjustedDate = new Date(
          d.getTime() - d.getTimezoneOffset() * 60000
        );
        return adjustedDate.toISOString().split("T")[0];
      };

      const editItem = {
        ...selected,
        collection: formatDate(selected.collection),
        expiration: formatDate(selected.expiration),
      };

      setEditingItem(editItem);
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    if (!editingItem.serial_id || editingItem.serial_id.trim() === "") {
      errors.serial_id = "Serial ID is required";
    }
    if (!editingItem.collection) {
      errors.collection = "Collection date is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setEditValidationErrors(errors);
      return;
    }
    
    try {
      setSaving(true);
      if (!window.electronAPI) {
        setEditValidationErrors({ api: "Electron API not available" });
        return;
      }

      // Get userData using helper function
      const userData = getUserData();
      
      if (!userData) {
        setEditValidationErrors({ api: "User information not available. Please log in again." });
        return;
      }
  
      const stockData = {
        serial_id: editingItem.serial_id,
        type: editingItem.type,
        rhFactor: editingItem.rhFactor,
        volume: editingItem.volume,
        collection: editingItem.collection,
        expiration: editingItem.expiration,
        status: editingItem.status,
        source: editingItem.source,
      };

      // ADDED: Record activity BEFORE updating
    await window.electronAPI.recordActivity(
      userData.id,
      userData.fullName,
      'UPDATE',
      `Updated plasma stock with Serial ID: ${editingItem.serial_id}, Blood Type: ${editingItem.type}${editingItem.rhFactor}`,
      'blood_stock_plasma',
      editingItem.id,
      {
        serial_id: editingItem.serial_id,
        type: editingItem.type,
        rhFactor: editingItem.rhFactor,
        volume: editingItem.volume,
        source: editingItem.source
      }
    );

      // FIXED: Pass userData parameter
      await window.electronAPI.updatePlasmaStock(editingItem.id, stockData, userData);
      setShowEditModal(false);
      setEditingItem(null);
      setEditValidationErrors({});
      await loadPlasmaData();
      clearAllSelection();
      setError(null);
  
      setSuccessMessage({
        title: "Stock Updated Successfully!",
        description: "The plasma stock information has been updated.",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error updating plasma stock:", err);
      
      let errorMessage = err.message;
      
      if (errorMessage.includes("already exists")) {
        const serialIdMatch = errorMessage.match(/Serial ID (\S+) already exists/);
        if (serialIdMatch) {
          const duplicateSerialId = serialIdMatch[1];
          setEditValidationErrors({ 
            serial_id: `Serial ID ${duplicateSerialId} already exists`
          });
        } else {
          setEditValidationErrors({ save: errorMessage });
        }
      } else {
        setEditValidationErrors({ save: `Failed to update plasma stock: ${errorMessage}` });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      const selectedIds = plasmaData
        .filter((item) => item.selected)
        .map((item) => item.id);
      if (selectedIds.length === 0) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedIds.length} item(s)?`
      );
      if (!confirmed) return;

      await window.electronAPI.deletePlasmaStock(selectedIds);
      await loadPlasmaData();
      clearAllSelection();
      setError(null);
    } catch (err) {
      console.error("Error deleting items:", err);
      setError("Failed to delete items");
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setShowSortDropdown(false);
  };

  const getSortedAndFilteredData = () => {
    let filtered = [...plasmaData];

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

  const handleReleaseStock = () => {
    setShowReleaseModal(true);
    setSelectedItems([
      {
        serialId: "",
        bloodType: "O",
        rhFactor: "+",
        volume: 100,
        collection: "",
        expiration: "",
        status: "Stored",
        found: false,
        source: "Walk-In", 
      },
    ]);
  };

  const handleReleaseItemChange = async (index, field, value) => {
    if (field === "serialId") {
      setSelectedItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value, found: false } : item
        )
      );

      if (searchTimeoutsRef.current[index]) {
        clearTimeout(searchTimeoutsRef.current[index]);
      }

      if (!value || value.trim() === "") {
        setError(null);
        return;
      }

      searchTimeoutsRef.current[index] = setTimeout(async () => {
        try {
          if (!window.electronAPI) {
            setError("Electron API not available");
            return;
          }

          const stockData = await window.electronAPI.getPlasmaStockBySerialId(
            value.trim()
          );

          if (stockData && !Array.isArray(stockData)) {
            setSelectedItems((prev) =>
              prev.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      serialId: value.trim(),
                      bloodType: stockData.type,
                      rhFactor: stockData.rhFactor,
                      volume: stockData.volume,
                      collection: stockData.collection,
                      expiration: stockData.expiration,
                      status: stockData.status,
                      source: stockData.source, 
                      found: true,
                    }
                  : item
              )
            );
            setError(null);
          } else if (Array.isArray(stockData) && stockData.length > 0) {
            const firstMatch = stockData[0];
            setSelectedItems((prev) =>
              prev.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      serialId: value.trim(),
                      bloodType: firstMatch.type,
                      rhFactor: firstMatch.rhFactor,
                      volume: firstMatch.volume,
                      collection: firstMatch.collection,
                      expiration: firstMatch.expiration,
                      status: firstMatch.status,
                      source: firstMatch.source,
                      found: true,
                    }
                  : item
              )
            );
            setError(null);
          } else {
            setSelectedItems((prev) =>
              prev.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      serialId: value.trim(),
                      bloodType: "O",
                      rhFactor: "+",
                      volume: 100,
                      collection: "",
                      expiration: "",
                      status: "Stored",
                      source: "Walk-In", 
                      found: false,
                    }
                  : item
              )
            );
            setError(
              `No plasma stock found with serial ID: ${value.trim()}`
            );
          }
        } catch (err) {
          console.error(
            "Error fetching plasma stock by serial ID:",
            err
          );
          setError("Failed to fetch plasma stock data");
          setSelectedItems((prev) =>
            prev.map((item, i) =>
              i === index ? { ...item, found: false } : item
            )
          );
        }
      }, 300);
    } else {
      setSelectedItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    }
  };

  // Add this useEffect near the other useEffect hooks
  const generateNextReferenceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `REF-PLS-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  };

  useEffect(() => {
      if (showReleaseDetailsModal) {
        const userData = getUserData();
        
        // Get current date in YYYY-MM-DD format
        const today = new Date();
        const currentDate = today.toISOString().split('T')[0];
        
        setReleaseData((prev) => ({
          ...prev,
          requestReference: generateNextReferenceNumber(),
          releasedBy: userData ? userData.fullName : '', // Auto-fill with current user's name
          dateOfRelease: currentDate, // Auto-fill with current date but editable
        }));
      }
    }, [showReleaseDetailsModal, currentUser]);

  const addReleaseItem = () => {
    setSelectedItems((prev) => [
      ...prev,
      {
        serialId: "",
        bloodType: "O",
        rhFactor: "+",
        volume: 100,
        collection: "",
        expiration: "",
        status: "Stored",
        source: "Walk-In", 
        found: false,
      },
    ]);
  };

  const removeReleaseItem = (index) => {
    if (selectedItems.length > 1) {
      setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const proceedToReleaseDetails = () => {
    const validItems = selectedItems.filter(
      (item) => item.serialId && item.found
    );

    if (validItems.length === 0) {
      setError("Please select at least one valid item with a found serial ID");
      return;
    }

    setSelectedItems(validItems);
    setShowReleaseModal(false);
    setShowReleaseDetailsModal(true);
  };

  const handleReleaseDataChange = (field, value) => {
  if (field === "receivingFacility") {
    // Auto-fill address when facility is selected
    const address = facilityAddresses[value] || "";
    setReleaseData((prev) => ({
      ...prev,
      receivingFacility: value,
      address: address,
    }));
    
    // Clear validation errors for both fields
    if (releaseValidationErrors.receivingFacility) {
      setReleaseValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.receivingFacility;
        delete newErrors.address;
        return newErrors;
      });
    }
  } else {
    setReleaseData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error for this field when user starts typing
    if (releaseValidationErrors[field]) {
      setReleaseValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }
};

  const confirmRelease = async () => {
  // Validate all fields
  const errors = {};
  if (!releaseData.receivingFacility || releaseData.receivingFacility.trim() === "") {
    errors.receivingFacility = "Receiving facility is required";
  }
  if (!releaseData.classification) {
    errors.classification = "Classification is required";
  }
  if (!releaseData.authorizedRecipient || releaseData.authorizedRecipient.trim() === "") {
    errors.authorizedRecipient = "Authorized recipient is required";
  }
  if (!releaseData.address || releaseData.address.trim() === "") {
    errors.address = "Address is required";
  }
  if (!releaseData.contactNumber || releaseData.contactNumber === "+63") {
    errors.contactNumber = "Contact number is required";
  }
  if (!releaseData.recipientDesignation || releaseData.recipientDesignation.trim() === "") {
    errors.recipientDesignation = "Recipient designation is required";
  }
  if (!releaseData.dateOfRelease) {
    errors.dateOfRelease = "Date of release is required";
  }
  if (!releaseData.conditionUponRelease) {
    errors.conditionUponRelease = "Condition upon release is required";
  }
  if (!releaseData.releasedBy || releaseData.releasedBy.trim() === "") {
    errors.releasedBy = "Released by is required";
  }
  
  if (Object.keys(errors).length > 0) {
    setReleaseValidationErrors(errors);
    return;
  }
  
  try {
    setReleasing(true);
    if (!window.electronAPI) {
      setReleaseValidationErrors({ api: "Electron API not available" });
      return;
    }

    const validItems = selectedItems.filter(
      (item) => item.found && item.serialId
    );

    if (validItems.length === 0) {
      setReleaseValidationErrors({ items: "No valid items to release" });
      setReleasing(false);
      return;
    }

    const serialIds = validItems.map((item) => item.serialId);
    
    // Get userData using helper function
    const userData = getUserData();
    
    if (!userData) {
      setReleaseValidationErrors({ api: "User information not available. Please log in again." });
      return;
    }
  
    
    // FIXED: Pass releaseData and userData as SEPARATE parameters
    const releasePayload = {
      ...releaseData,
      serialIds: serialIds,
      verifiedBy: releaseData.recipientDesignation,
    };

      const result = await window.electronAPI.releasePlasmaStock(releasePayload, userData);
  
      if (result.success) {
      // Close release modals
      setShowReleaseDetailsModal(false);
      setShowReleaseModal(false);
      setReleaseValidationErrors({});

      // Reset selected items
      setSelectedItems([
        {
          serialId: "",
          bloodType: "O",
          rhFactor: "+",
          volume: 100,
          collection: "",
          expiration: "",
          status: "Stored",
          found: false,
        },
      ]);

      // Reset release data
      setReleaseData({
        receivingFacility: "",
        address: "",
        contactNumber: "",
        classification: "",
        authorizedRecipient: "",
        recipientDesignation: "",
        dateOfRelease: "",
        conditionUponRelease: "",
        requestReference: "",
        releasedBy: "",
      });
        await loadPlasmaData();
        setError(null);
  
        try {
        const invoiceDetails = await window.electronAPI.viewReleasedBloodInvoice(result.invoiceDbId);
        setPreviewInvoiceData(invoiceDetails);
        setShowInvoicePreview(true);
      } catch (invoiceError) {
        console.error("Error loading invoice for preview:", invoiceError);
        // Fallback to success modal if invoice fetch fails
        setSuccessMessage({
          title: "Stock Released Successfully!",
          description:
            "Blood units have been released to receiving facility. Check the invoice for details.",
        });
        setShowSuccessModal(true);
      }
    }
  } catch (err) {
    console.error("Error releasing blood stock:", err);
    setReleaseValidationErrors({ save: `Failed to release blood stock: ${err.message}` });
  } finally {
    setReleasing(false);
  }
};

// 3. Add this new function to generate PDF from the preview
const generateInvoicePDFFromPreview = () => {
  if (!previewInvoiceData) return;

  const { header, items } = previewInvoiceData;

  // Create PDF with folio size (8.5 x 13 inches)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: [8.5, 13],
  });

  // Load logos
  const dohMainLogo = "./assets/doh-main-logo.jpg";
  const dohPurpleLogo = "./assets/doh-purple-logo.png";
  const bagongPilipinasLogo = "./assets/bagong-pilipinas-logo.png";

  // Add logos at the top - THREE LOGOS IN A ROW
  try {
    doc.addImage(dohMainLogo, "JPEG", 0.5, 0.3, 1.0, 1.0);
    doc.addImage(dohPurpleLogo, "PNG", 1.7, 0.3, 0.97, 0.97);
    doc.addImage(bagongPilipinasLogo, "PNG", 2.7, 0.15, 1.4, 1.3);
  } catch (e) {
    console.error("Error loading logos:", e);
  }

  // Header text section
  const textStartX = 4.25;
  const textStartY = 0.4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("DEPARTMENT OF HEALTH", textStartX, textStartY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CENTER FOR HEALTH DEVELOPMENT- NORTHERN MINDANAO", textStartX, textStartY + 0.16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("J. V. Serina Street, Carmen, Cagayan de Oro City", textStartX, textStartY + 0.32);

  doc.setFontSize(6.5);
  doc.text("PABX (088) 8587123/ (088) 858 4000/ (088) 855 0430/ (+63) 917-148-3298/", textStartX, textStartY + 0.46);
  doc.text("(+63) 968-882-4092/ (088) 858-7132/ (088) 858-2639/ (088)-1601", textStartX, textStartY + 0.57);

  doc.setTextColor(0, 0, 0);
  doc.text("Email address: ", textStartX, textStartY + 0.68);
  const emailLabelWidth = doc.getTextWidth("Email address: ");
  doc.setTextColor(0, 115, 230);
  doc.text("pacd@ro10.doh.gov.ph", textStartX + emailLabelWidth, textStartY + 0.68);

  doc.setTextColor(0, 0, 0);
  doc.text("Website: ", textStartX, textStartY + 0.79);
  const websiteLabelWidth = doc.getTextWidth("Website: ");
  doc.setTextColor(0, 115, 230);
  doc.text("http://www.ro10.doh.gov.ph", textStartX + websiteLabelWidth, textStartY + 0.79);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text("NORTHERN MINDANAO REGIONAL BLOOD CENTER HUBBING FORM", 4.25, 1.75, { align: "center" });

  // Date and Reference info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Date:", 0.5, 2.1);
  doc.setFont("helvetica", "normal");
  const dateText = header.dateOfRelease;
  doc.text(dateText, 0.9, 2.1);
  const dateWidth = doc.getTextWidth(dateText);
  doc.setLineWidth(0.01);
  doc.line(0.9, 2.13, 0.9 + dateWidth, 2.13);

  doc.setFont("helvetica", "bold");
  doc.text("Reference no:", 4.7, 2.1);
  doc.setFont("helvetica", "normal");
  const refText = header.referenceNumber || header.invoiceId;
  const refStartX = 5.8;
  const maxRefWidth = 8.0 - refStartX;
  
  let displayRefText = refText;
  let refWidth = doc.getTextWidth(displayRefText);
  
  if (refWidth > maxRefWidth) {
    while (refWidth > maxRefWidth && displayRefText.length > 0) {
      displayRefText = displayRefText.slice(0, -1);
      refWidth = doc.getTextWidth(displayRefText + "...");
    }
    displayRefText += "...";
  }
  
  doc.text(displayRefText, refStartX, 2.1);
  refWidth = doc.getTextWidth(displayRefText);
  doc.line(refStartX, 2.13, refStartX + refWidth, 2.13);

  // Hospital info
  doc.setFont("helvetica", "bold");
  doc.text("Hospital:", 0.5, 2.35);
  doc.setFont("helvetica", "normal");
  const hospitalText = header.receivingFacility;
  doc.text(hospitalText, 1.15, 2.35);
  const hospitalWidth = doc.getTextWidth(hospitalText);
  doc.line(1.15, 2.38, 1.15 + hospitalWidth, 2.38);

  // Table data
  const tableData = items.map((item, index) => [
    index + 1,
    item.serialId,
    `${item.bloodType}${item.rhFactor}`,
    item.dateOfCollection,
    item.dateOfExpiration,
    `${item.volume} ML`,
    item.remarks || "",
  ]);

  // Create table using autoTable
  autoTable(doc, {
    startY: 2.55,
    head: [["NO.", "SERIAL NO.", "BLOOD\nTYPE", "DATE OF\nCOLLECTION", "DATE OF\nEXPIRY", "VOLUME", "REMARKS"]],
    body: tableData,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 0.05,
      lineColor: [0, 0, 0],
      lineWidth: 0.01,
      halign: "center",
      valign: "middle",
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [201, 201, 201],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      fontSize: 8,
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 0.4 },
      1: { cellWidth: 1.5 },
      2: { cellWidth: 0.7 },
      3: { cellWidth: 1.1 },
      4: { cellWidth: 1.1 },
      5: { cellWidth: 0.7 },
      6: { cellWidth: "auto" },
    },
    margin: { left: 0.5, right: 0.5 },
  });

  // Footer section
  const finalY = doc.lastAutoTable.finalY + 40 / 72;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  // Left side
  doc.text("PREPARED BY:", 0.5, finalY);
  doc.setFont("helvetica", "normal");
  doc.text(header.preparedBy || "", 0.5, finalY + 0.25);
  doc.line(0.5, finalY + 0.28, 3.0, finalY + 0.28);

  doc.setFont("helvetica", "bold");
  doc.text("VERIFIED BY:", 0.5, finalY + 0.65);
  doc.setFont("helvetica", "normal");
  doc.text(header.verifiedBy || "", 0.5, finalY + 0.9);
  doc.line(0.5, finalY + 0.93, 3.0, finalY + 0.93);

  // Right side
  doc.setFont("helvetica", "bold");
  doc.text("RECEIVED BY:", 5.3, finalY);
  doc.setFont("helvetica", "normal");
  doc.text(header.receivedBy || header.authorizedRecipient || "", 5.3, finalY + 0.25);
  doc.line(5.3, finalY + 0.28, 7.9, finalY + 0.28);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Name/Signature/Date", 6.6, finalY + 0.45, { align: "center" });

  // Note at bottom
  const noteY = 12.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("NOTE:", 4.25 - doc.getTextWidth("NOTE: All blood bags are properly screened and are NON-REACTIVE to HIV, HBV, HCV, SYPHILIS AND MALARIA") / 2, noteY);
  
  doc.setFont("helvetica", "normal");
  doc.text(" All blood bags are properly screened and are NON-REACTIVE to HIV, HBV, HCV, SYPHILIS AND MALARIA", 4.25 - doc.getTextWidth("NOTE: All blood bags are properly screened and are NON-REACTIVE to HIV, HBV, HCV, SYPHILIS AND MALARIA") / 2 + doc.getTextWidth("NOTE:"), noteY);

  // Save PDF
  doc.save(`Invoice-${header.invoiceId}.pdf`);

  // Close modal after download
  setShowInvoicePreview(false);
};


  const displayData = getSortedAndFilteredData();
  const selectedCount = plasmaData.filter((item) => item.selected).length;
  const singleSelected = selectedCount === 1;

  const getSortLabel = () => {
    const labels = {
      serial_id: "Serial ID",
      type: "Blood Type",
      rhFactor: "RH Factor",
      volume: "Volume",
      status: "Status",
      created: "Sort by",
      source: "Source",
    };
    return labels[sortConfig.key] || "Sort";
  };

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f9fafb",
      minHeight: "100vh",
      fontFamily: "Barlow",
      borderRadius: "8px",
    },
    header: { margin: 0 },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "1px",
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginTop: "-10px",
    },
    controlsBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px",
      backgroundColor: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      flexWrap: "wrap",
      gap: "12px",
    },
    leftControls: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      flex: "1 1 auto",
      minWidth: "200px",

    },
    searchContainer: { position: "relative" },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9ca3af",
      width: "16px",
      height: "16px",
    },
    searchInput: {
      paddingLeft: "40px",
      paddingRight: "16px",
      paddingTop: "8px",
      paddingBottom: "8px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      width: "100%", 
      fontSize: "14px",
      outline: "none",
      fontFamily: "Barlow",
      minWidth: "200px", 
      maxWidth: "400px",
    },
    rightControls: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
    button: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      backgroundColor: "white",
      cursor: "pointer",
      fontSize: "14px",
      color: "#374151",
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
      position: "relative",
      minWidth: "100px",
      whiteSpace: "nowrap",
    },
    buttonHover: {
      backgroundColor: "white",
      borderColor: "#8daef2",
    },
    buttonActive: {
      backgroundColor: "#2C58DC",
      borderColor: "#2C58DC",
      color: "white",
    },
    releaseButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#2C58DC",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap"
    },
    releaseButtonHover: {
      backgroundColor: "#1e40af",
    },
    releaseButtonActive: {
      backgroundColor: "#1d3a8a",
    },
    addButton: {
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
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    },
    addButtonHover: {
      backgroundColor: "#ffb300",
    },
    addButtonActive: {
      backgroundColor: "#ff9800",
    },
    dropdown: {
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
    },
    dropdownItem: {
      padding: "10px 16px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#374151",
      transition: "background-color 0.2s ease",
      borderBottom: "1px solid #e5e7eb",
      fontFamily: "Barlow",
    },
    dropdownItemHover: {
      backgroundColor: "#f3f4f6",
    },
    dropdownItemActive: {
      backgroundColor: "#dbeafe",
      color: "#1e40af",
      fontWeight: "600",
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      overflowX: "auto",
    },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "1200px", },
    thead: { backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "11px",
      fontWeight: "500",
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      cursor: "pointer",
      userSelect: "none",
    },
    tbody: { backgroundColor: "white" },
    tr: { borderBottom: "1px solid #A3A3A3" },
    trEven: { backgroundColor: "#f9fafb" },
    td: {
      padding: "12px 16px",
      fontSize: "12px",
      color: "#111827",
      fontFamily: "Arial",
      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      fontSize: "12px",
      fontWeight: "500",
      backgroundColor: "#fef2f2",
      color: "#991b1b",
      borderRadius: "9999px",
    },
    checkbox: { width: "16px", height: "16px", cursor: "pointer" },
    trSelected: { backgroundColor: "#e6f7ff" },
    actionBar: {
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
    },
    closeButton: {
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
      transition: "background-color 0.2s ease",
    },
    closeButtonHover: {
      backgroundColor: "#3a4556",
    },
    counterSection: {
      padding: "12px 24px",
      backgroundColor: "#4a5568",
      borderRight: "1px solid #2d3748",
    },
    counterText: {
      fontSize: "14px",
      fontWeight: "500",
      color: "white",
      margin: 0,
    },
    editButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 16px",
      backgroundColor: "#4a5568",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Barlow",
      borderRight: "1px solid #2d3748",
      transition: "background-color 0.2s ease",
    },
    editButtonHover: {
      backgroundColor: "#3a4556",
    },
    editButtonDisabled: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 16px",
      backgroundColor: "#4a5568",
      color: "#9ca3af",
      border: "none",
      cursor: "not-allowed",
      fontSize: "14px",
      fontFamily: "Barlow",
      borderRight: "1px solid #2d3748",
      opacity: 0.5,
    },
    deleteButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 16px",
      backgroundColor: "#4a5568",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Barlow",
      transition: "background-color 0.2s ease",
    },
    deleteButtonHover: {
      backgroundColor: "#3a4556",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
      fontSize: "16px",
      color: "#6b7280",
    },
    errorContainer: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      padding: '12px 16px',
      borderRadius: '6px',
      marginTop: '16px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px'
    },
    refreshButton: {
      backgroundColor: "#059669",
      color: "white",
      border: "none",
      padding: "4px 8px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
      transition: "background-color 0.2s ease",
    },
    refreshButtonHover: {
      backgroundColor: "#047857",
    },
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
      zIndex: 2000,
      padding: "20px",
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      width: "95%",
      maxWidth: "900px",
      maxHeight: "90vh",
      overflow: "hidden",
      boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Barlow",
    },
    modalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 30px",
      borderBottom: "1px solid #e5e7eb",
      backgroundColor: "white",
    },
    modalTitleSection: { display: "flex", flexDirection: "column", gap: "2px" },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#165C3C",
      margin: 0,
      fontFamily: "Barlow",
    },
    modalSubtitle: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
      fontFamily: "Barlow",
    },
    modalCloseButton: {
      background: "none",
      border: "none",
      fontSize: "20px",
      color: "#6b7280",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "28px",
      height: "28px",
      borderRadius: "4px",
      transition: "background-color 0.2s ease",
    },
    modalCloseButtonHover: {
      backgroundColor: "#f3f4f6",
    },
    modalContent: { flex: 1, padding: "30px", overflowY: "auto" },
    barcodeText: {
      color: "#dc2626",
      fontSize: "12px",
      fontStyle: "italic",
      marginBottom: "10px",
      fontFamily: "Barlow",
    },
    barcodeSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "15px",
      padding: "10px 10px",
      border: "2px dashed #d1d5db",
      borderRadius: "8px",
      backgroundColor: "white",
      justifyContent: "center",
    },
    barcodeIcon: {
      width: "100px",
      height: "100px",
      objectFit: "contain",
    },
    tableHeader: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr",
      gap: "15px",
      marginBottom: "15px",
      padding: "0 5px",
    },
    tableHeaderCell: {
      fontSize: "12px",
      fontWeight: "500",
      color: "#374151",
      fontFamily: "Barlow",
      textAlign: "left",
    },
    dataRow: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr",
      gap: "15px",
      marginBottom: "15px",
      alignItems: "center",
    },
    fieldInput: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      fontSize: "14px",
      fontFamily: "Barlow",
      outline: "none",
      backgroundColor: "white",
      width: "100%",
      boxSizing: "border-box",
      transition: "border-color 0.2s ease",
    },
    fieldInputFocus: {
      borderColor: "#3b82f6",
    },
    fieldSelect: {
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
      transition: "border-color 0.2s ease",
    },
    fieldSelectFocus: {
      borderColor: "#3b82f6",
    },
    fieldInputDisabled: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily: "Barlow",
      outline: "none",
      backgroundColor: "#f9fafb",
      color: "#9ca3af",
      cursor: "not-allowed",
      width: "100%",
      boxSizing: "border-box",
    },
    addRowButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#f3f4f6",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      cursor: "pointer",
      color: "#374151",
      fontSize: "14px",
      fontFamily: "Barlow",
      marginBottom: "20px",
      transition: "all 0.2s ease",
    },
    addRowButtonHover: {
      backgroundColor: "#e5e7eb",
      borderColor: "#9ca3af",
    },
    addRowButtonActive: {
      backgroundColor: "#d1d5db",
    },
    modalFooter: {
      padding: "20px 30px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "center",
      gap: "12px",
      backgroundColor: "white",
    },

    modalFooterRelease: {
      padding: "20px 30px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "right",
      gap: "12px",
      backgroundColor: "white",
    },
    saveButton: {
      padding: "12px 48px",
      backgroundColor: "#FFC200",
      color: "black",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      fontFamily: "Barlow",
      minWidth: "120px",
      transition: "all 0.2s ease",
    },
    saveButtonHover: {
      backgroundColor: "#ffb300",
    },
    saveButtonActive: {
      backgroundColor: "#ff9800",
    },
    filterContainer: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "20px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
    },
    filterButton: {
      padding: "12px 24px",
      backgroundColor: "#059669",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
    },
    filterButtonHover: {
      backgroundColor: "#047857",
    },
    filterButtonActive: {
      backgroundColor: "#065f46",
    },
    clearFilterButton: {
      padding: "12px 24px",
      backgroundColor: "#9ca3af",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
    },
    clearFilterButtonHover: {
      backgroundColor: "#8b91a0",
    },
    clearFilterButtonActive: {
      backgroundColor: "#6b7280",
    },
    rowsContainer: {
      marginBottom: "20px",
    },
    dropdownContainer: {
      position: "relative",
    },
    successModalOverlay: {
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
    },
    successModal: {
      backgroundColor: "white",
      borderRadius: "11px",
      width: "30%",
      hegith: "10%",
      maxWidth: "350px",
      padding: "40px 30px 30px",
      boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "Barlow",
      position: "relative",
    },
    successCloseButton: {
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
      transition: "background-color 0.2s ease",
    },
    successCloseButtonHover: {
      backgroundColor: "#f3f4f6",
    },
    successIcon: {
      width: "30px",
      height: "30px",
      backgroundColor: "#10b981",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    successTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#165C3C",
      textAlign: "center",
      fontFamily: "Barlow",
    },
    successDescription: {
      fontSize: "13px",
      color: "#6b7280",
      textAlign: "center",
      lineHeight: "1.5",
      fontFamily: "Barlow",
      marginTop: "-5px",
      paddingLeft: "20px",
      paddingRight: "20px",
    },
    successOkButton: {
      padding: "12px 60px",
      backgroundColor: "#FFC200",
      color: "black",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
    },
    successOkButtonHover: {
      backgroundColor: "#ffb300",
    },
    confirmButton: {
      padding: "12px 48px",
      backgroundColor: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      fontFamily: "Barlow",
      minWidth: "120px",
      transition: "all 0.2s ease",
    },
  };

  const [hoverStates, setHoverStates] = useState({});

  const handleMouseEnter = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: true }));
  };

  const handleMouseLeave = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: false }));
  };

  if (loading || saving || releasing) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Plasma</h2>
        <p style={styles.subtitle}>Blood Stock</p>
      </div>

      <div style={styles.controlsBar}>
        <div style={styles.leftControls}>
          <div style={styles.searchContainer}>
            <svg
              style={styles.searchIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by serial ID, blood type, or status"
              style={styles.searchInput}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div style={styles.rightControls}>
          <div style={styles.dropdownContainer} ref={sortDropdownRef}>
            <button
              style={{
                ...styles.button,
                ...(hoverStates.sort ? styles.buttonHover : {}),
                ...(showSortDropdown ? styles.buttonActive : {}),
              }}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              onMouseEnter={() => handleMouseEnter("sort")}
              onMouseLeave={() => handleMouseLeave("sort")}
              title="Sort"
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
              <div style={styles.dropdown}>
                {[
                  { key: "serial_id", label: "Serial ID" },
                  { key: "type", label: "Blood Type" },
                  { key: "rhFactor", label: "RH Factor" },
                  { key: "volume", label: "Volume" },
                  { key: "status", label: "Status" },
                  { key: "source", label: "Source" },
                  { key: "created", label: "Sort by" },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      ...styles.dropdownItem,
                      ...(sortConfig.key === item.key
                        ? styles.dropdownItemActive
                        : {}),
                      ...(hoverStates[`sort-${item.key}`] &&
                      sortConfig.key !== item.key
                        ? styles.dropdownItemHover
                        : {}),
                    }}
                    onClick={() => handleSort(item.key)}
                    onMouseEnter={() => handleMouseEnter(`sort-${item.key}`)}
                    onMouseLeave={() => handleMouseLeave(`sort-${item.key}`)}
                  >
                    {item.label}{" "}
                    {sortConfig.key === item.key &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.dropdownContainer} ref={filterDropdownRef}>
            <button
              style={{
                ...styles.button,
                ...(hoverStates.filter ? styles.buttonHover : {}),
                ...(showFilterDropdown ? styles.buttonActive : {}),
              }}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              onMouseEnter={() => handleMouseEnter("filter")}
              onMouseLeave={() => handleMouseLeave("filter")}
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
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
              <div style={{ ...styles.dropdown, minWidth: "300px" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Filter Field</label>
                    <select
                      style={styles.fieldSelect}
                      value={filterConfig.field}
                      onChange={(e) =>
                        setFilterConfig({
                          ...filterConfig,
                          field: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a field</option>
                      <option value="serial_id">Serial ID</option>
                      <option value="type">Blood Type</option>
                      <option value="rhFactor">RH Factor</option>
                      <option value="status">Status</option>
                      <option value="volume">Volume</option>
                      <option value="source">Source</option>
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Filter Value</label>
                    <input
                      type="text"
                      style={styles.fieldInput}
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
                      ...styles.clearFilterButton,
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "12px",
                      ...(hoverStates.clearFilter
                        ? styles.clearFilterButtonHover
                        : {}),
                    }}
                    onClick={() => {
                      setFilterConfig({ field: "", value: "" });
                      setShowFilterDropdown(false);
                    }}
                    onMouseEnter={() => handleMouseEnter("clearFilter")}
                    onMouseLeave={() => handleMouseLeave("clearFilter")}
                  >
                    Clear
                  </button>
                  <button
                    style={{
                      ...styles.filterButton,
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "12px",
                      ...(hoverStates.applyFilter
                        ? styles.filterButtonHover
                        : {}),
                    }}
                    onClick={() => setShowFilterDropdown(false)}
                    onMouseEnter={() => handleMouseEnter("applyFilter")}
                    onMouseLeave={() => handleMouseLeave("applyFilter")}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            style={{
              ...styles.releaseButton,
              ...(hoverStates.release ? styles.releaseButtonHover : {}),
            }}
            onClick={handleReleaseStock}
            onMouseEnter={() => handleMouseEnter("release")}
            onMouseLeave={() => handleMouseLeave("release")}
          >
            Release Stock
          </button>

          <button
            style={{
              ...styles.addButton,
              ...(hoverStates.add ? styles.addButtonHover : {}),
            }}
            onClick={() => setShowAddModal(true)}
            onMouseEnter={() => handleMouseEnter("add")}
            onMouseLeave={() => handleMouseLeave("add")}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: "4%" }}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={
                    displayData.length > 0 &&
                    displayData.every((item) => item.selected)
                  }
                  onChange={toggleAllSelection}
                />
              </th>
              <th
                style={{ ...styles.th, width: "14%", cursor: "pointer" }}
                onClick={() => handleSort("serial_id")}
              >
                SERIAL ID{" "}
                {sortConfig.key === "serial_id" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={{ ...styles.th, width: "8%", cursor: "pointer" }}
                onClick={() => handleSort("type")}
              >
                BLOOD TYPE{" "}
                {sortConfig.key === "type" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={{ ...styles.th, width: "7%", cursor: "pointer" }}
                onClick={() => handleSort("rhFactor")}
              >
                RH FACTOR{" "}
                {sortConfig.key === "rhFactor" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={{ ...styles.th, width: "8%", cursor: "pointer" }}
                onClick={() => handleSort("volume")}
              >
                VOLUME (ML){" "}
                {sortConfig.key === "volume" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th style={{ ...styles.th, width: "12%" }}>DATE OF COLLECTION</th>
              <th style={{ ...styles.th, width: "12%" }}>EXPIRATION DATE</th>
              <th
                style={{ ...styles.th, width: "8%", cursor: "pointer" }}
                onClick={() => handleSort("status")}
              >
                STATUS{" "}
                {sortConfig.key === "status" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={{ ...styles.th, width: "7%", cursor: "pointer" }}
                onClick={() => handleSort("source")}
              >
                SOURCE{" "}
                {sortConfig.key === "source" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th style={{ ...styles.th, width: "8%" }}>REMARKS</th>
              <th style={{ ...styles.th, width: "13%" }}>CREATED AT</th>
              <th style={{ ...styles.th, width: "13%" }}>MODIFIED AT</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  style={{ ...styles.td, textAlign: "center", padding: "40px" }}
                >
                  No plasma stock records found
                </td>
              </tr>
            ) : (
              displayData.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    ...(index % 2 === 1 ? styles.trEven : {}),
                    ...(item.selected ? styles.trSelected : {}),
                  }}
                >
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={item.selected || false}
                      onChange={() => toggleRowSelection(item.id)}
                    />
                  </td>
                  <td style={styles.td}>{item.serial_id}</td>
                  <td style={styles.td}>{item.type}</td>
                  <td style={styles.td}>{item.rhFactor}</td>
                  <td style={styles.td}>{item.volume}</td>
                  <td style={styles.td}>{item.collection}</td>
                  <td style={styles.td}>{item.expiration}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>{item.status}</span>
                  </td>
                  <td style={styles.td}>{item.source}</td>
                  <td style={styles.td}>
                    {item.remarks && (
                      <span style={{
                        padding: "4px 8px",
                        backgroundColor: "#dbeafe",
                        color: "#1e40af",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "500",
                      }}>
                        {item.remarks}
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>{item.created}</td>
                  <td style={styles.td}>{item.modified}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div style={styles.actionBar}>
          <button
            style={styles.closeButton}
            onClick={clearAllSelection}
            onMouseEnter={() => handleMouseEnter("close")}
            onMouseLeave={() => handleMouseLeave("close")}
            onMouseDown={() => handleMouseEnter("closeActive")}
            onMouseUp={() => handleMouseLeave("closeActive")}
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

          <div style={styles.counterSection}>
            <span style={styles.counterText}>
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>

          {singleSelected && (
            <button
              style={{
                ...styles.editButton,
                ...(hoverStates.edit ? styles.editButtonHover : {}),
              }}
              onClick={handleEditClick}
              onMouseEnter={() => handleMouseEnter("edit")}
              onMouseLeave={() => handleMouseLeave("edit")}
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
              ...styles.deleteButton,
              ...(hoverStates.delete ? styles.deleteButtonHover : {}),
            }}
            onClick={handleDeleteClick}
            onMouseEnter={() => handleMouseEnter("delete")}
            onMouseLeave={() => handleMouseLeave("delete")}
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

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowConfirmDeleteModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Confirm Delete</h3>
                <p style={styles.modalSubtitle}>Review items before deletion</p>
              </div>
              <button
                style={{
                  ...styles.modalCloseButton,
                  ...(hoverStates.closeDeleteModal
                    ? styles.modalCloseButtonHover
                    : {}),
                }}
                onClick={() => setShowConfirmDeleteModal(false)}
                onMouseEnter={() => handleMouseEnter("closeDeleteModal")}
                onMouseLeave={() => handleMouseLeave("closeDeleteModal")}
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #ef4444",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#991b1b",
                    margin: "0 0 12px 0",
                  }}
                >
                  Items to Delete ({plasmaData.filter((item) => item.selected).length})
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    gap: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  <div>Serial ID</div>
                  <div>Blood Type</div>
                  <div>RH Factor</div>
                  <div>Volume (mL)</div>
                  <div>Source</div>
                </div>
                {plasmaData
                  .filter((item) => item.selected)
                  .map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                        gap: "12px",
                        fontSize: "12px",
                        color: "#6b7280",
                        padding: "8px 0",
                        borderTop: index > 0 ? "1px solid #e5e7eb" : "none",
                      }}
                    >
                      <div style={{ fontWeight: "500", color: "#374151" }}>
                        {item.serial_id}
                      </div>
                      <div>{item.type}</div>
                      <div>{item.rhFactor}</div>
                      <div>{item.volume}</div>
                      <div>{item.source || 'Walk-In'}</div>
                    </div>
                  ))}
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid #ef4444",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#991b1b",
                  }}
                >
                  Total Volume:{" "}
                  {plasmaData
                    .filter((item) => item.selected)
                    .reduce((sum, item) => sum + parseInt(item.volume || 0), 0)}{" "}
                  mL
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #ef4444",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="#ef4444"
                  viewBox="0 0 20 20"
                  style={{ flexShrink: 0, marginTop: "2px" }}
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
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#991b1b",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Confirm Delete Action
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#7f1d1d",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    These items will be permanently deleted from the Plasma stock records. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={{
                  ...styles.confirmButton,
                  backgroundColor: "#ef4444",
                  ...(hoverStates.confirmDelete ? { backgroundColor: "#dc2626" } : {}),
                }}
                onClick={confirmDelete}
                onMouseEnter={() => handleMouseEnter("confirmDelete")}
                onMouseLeave={() => handleMouseLeave("confirmDelete")}
              >
                Confirm Delete (
                {plasmaData.filter((item) => item.selected).length} items)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div style={styles.successModalOverlay}>
          <div style={styles.successModal}>
            <button
              style={{
                ...styles.successCloseButton,
                ...(hoverStates.successClose
                  ? styles.successCloseButtonHover
                  : {}),
              }}
              onClick={() => setShowSuccessModal(false)}
              onMouseEnter={() => handleMouseEnter("successClose")}
              onMouseLeave={() => handleMouseLeave("successClose")}
            >
              ×
            </button>

            <div style={styles.successIcon}>
              <svg width="48" height="48" fill="white" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h3 style={styles.successTitle}>{successMessage.title}</h3>
            <p style={styles.successDescription}>
              {successMessage.description}
            </p>

            <button
              style={{
                ...styles.successOkButton,
                ...(hoverStates.successOk ? styles.successOkButtonHover : {}),
              }}
              onClick={() => setShowSuccessModal(false)}
              onMouseEnter={() => handleMouseEnter("successOk")}
              onMouseLeave={() => handleMouseLeave("successOk")}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal - NEW */}
      {showInvoicePreview && previewInvoiceData && (
      <div style={styles.modalOverlay} onClick={() => setShowInvoicePreview(false)}>
        <div style={{ ...styles.modal, maxWidth: "1000px" }} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <div style={styles.modalTitleSection}>
              <h3 style={styles.modalTitle}>Invoice Preview</h3>
              <p style={styles.modalSubtitle}>Blood Hubbing Form</p>
            </div>
            <button
              style={{
                ...styles.modalCloseButton,
                ...(hoverStates.closeInvoicePreview ? styles.modalCloseButtonHover : {}),
              }}
              onClick={() => setShowInvoicePreview(false)}
              onMouseEnter={() => handleMouseEnter("closeInvoicePreview")}
              onMouseLeave={() => handleMouseLeave("closeInvoicePreview")}
            >
              ×
            </button>
          </div>

          <div style={{
            flex: 1,
            padding: "40px 20px",
            overflowY: "auto",
            overflowX: "auto",
            backgroundColor: "#f3f4f6",
            display: "flex",
            justifyContent: "center",
          }}>
            <div style={{
              backgroundColor: "white",
              width: "8.5in",
              height: "13in",
              padding: "0.5in",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              fontFamily: "Arial, sans-serif",
              margin: "0 auto",
              boxSizing: "border-box",
              position: "relative",
            }}>
              {/* Header with logos */}
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "20px", gap: "15px" }}>
                <img src="./assets/doh-main-logo.jpg" alt="DOH Logo" style={{ width: "100px", height: "100px" }} />
                <img src="./assets/doh-purple-logo.png" alt="DOH Purple" style={{ width: "97px", height: "97px" }} />
                <img src="./assets/bagong-pilipinas-logo.png" alt="Bagong Pilipinas" style={{ width: "140px", height: "130px", marginTop: "-15px" }} />
                <div style={{ flex: 1, paddingTop: "8px", paddingLeft: "10px" }}>
                  <div style={{ fontSize: "11px", margin: "3px 0", color: "#000" }}>DEPARTMENT OF HEALTH</div>
                  <div style={{ fontSize: "10px", fontWeight: "bold", margin: "3px 0", color: "#000" }}>CENTER FOR HEALTH DEVELOPMENT- NORTHERN MINDANAO</div>
                  <div style={{ fontSize: "8.5px", margin: "2px 0", color: "#000", lineHeight: "1.4" }}>J. V. Serina Street, Carmen, Cagayan de Oro City</div>
                  <div style={{ fontSize: "7.5px", margin: "2px 0", color: "#000", lineHeight: "1.4" }}>PABX (088) 8587123/ (088) 858 4000/ (088) 855 0430/ (+63) 917-148-3298/</div>
                  <div style={{ fontSize: "7.5px", margin: "2px 0", color: "#000", lineHeight: "1.4" }}>(+63) 968-882-4092/ (088) 858-7132/ (088) 858-2639/ (088)-1601</div>
                  <div style={{ fontSize: "7.5px", margin: "2px 0", color: "#000", lineHeight: "1.4" }}>
                    Email address: <span style={{ color: "#0073e6" }}>pacd@ro10.doh.gov.ph</span>
                  </div>
                  <div style={{ fontSize: "7.5px", margin: "2px 0", color: "#000", lineHeight: "1.4" }}>
                    Website: <span style={{ color: "#0073e6" }}>http://www.ro10.doh.gov.ph</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "15px", marginBottom: "20px", textAlign: "center" }}>
                NORTHERN MINDANAO REGIONAL BLOOD CENTER HUBBING FORM
              </div>

              {/* Info section */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "11px" }}>
                <div><strong>Date:</strong> <span style={{ borderBottom: "1px solid #000" }}>{previewInvoiceData.header.dateOfRelease}</span></div>
                <div><strong>Reference no:</strong> <span style={{ borderBottom: "1px solid #000" }}>{previewInvoiceData.header.referenceNumber || previewInvoiceData.header.invoiceId}</span></div>
              </div>

              <div style={{ marginBottom: "15px", fontSize: "11px" }}>
                <strong>Hospital:</strong> <span style={{ borderBottom: "1px solid #000" }}>{previewInvoiceData.header.receivingFacility}</span>
              </div>

              {/* Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px", fontSize: "10px" }}>
                <thead>
                  <tr>
                    <th style={{ backgroundColor: "#c9c9c9", fontWeight: "bold", border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>NO.</th>
                    <th style={{ backgroundColor: "#c9c9c9", fontWeight: "bold", border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>SERIAL NO.</th>
                    <th style={{ backgroundColor: "#c9c9c9", fontWeight: "bold", border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>BLOOD<br/>TYPE</th>
                    <th style={{ backgroundColor: "#c9c9c9", fontWeight: "bold", border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>DATE OF<br/>COLLECTION</th>
                    <th style={{ backgroundColor: "#c9c9c9", fontWeight: "bold", border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>DATE OF<br/>EXPIRY</th>
                    <th style={{ backgroundColor: "#c9c9c9", fontWeight: "bold", border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>VOLUME</th>
                    <th style={{ backgroundColor: "#c9c9c9", fontWeight: "bold", border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoiceData.items.map((item, index) => (
                    <tr key={index}>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>{index + 1}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>{item.serialId}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>{item.bloodType}{item.rhFactor}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>{item.dateOfCollection}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>{item.dateOfExpiration}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>{item.volume} ML</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontSize: "9px" }}>{item.remarks || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer signatures */}
              <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <div style={{ width: "45%" }}>
                  <div style={{ marginBottom: "25px" }}>
                    <div style={{ fontWeight: "bold" }}>PREPARED BY:</div>
                    <div style={{ marginTop: "15px" }}>{previewInvoiceData.header.preparedBy || ""}</div>
                    <div style={{ borderBottom: "1px solid #000", marginTop: "2px" }}></div>
                  </div>
                  <div>
                    <div style={{ fontWeight: "bold" }}>VERIFIED BY:</div>
                    <div style={{ marginTop: "15px" }}>{previewInvoiceData.header.verifiedBy || previewInvoiceData.header.authorizedRecipient || ""}</div>
                    <div style={{ borderBottom: "1px solid #000", marginTop: "2px" }}></div>
                  </div>
                </div>
                <div style={{ width: "45%" }}>
                  <div style={{ fontWeight: "bold" }}>RECEIVED BY:</div>
                  <div style={{ marginTop: "15px" }}>{previewInvoiceData.header.receivedBy || previewInvoiceData.header.authorizedRecipient || ""}</div>
                  <div style={{ borderBottom: "1px solid #000", marginTop: "2px" }}></div>
                  <div style={{ fontSize: "9px", fontStyle: "italic", marginTop: "5px", textAlign: "center" }}>Name/Signature/Date</div>
                </div>
              </div>

              {/* Note */}
              <div style={{ position: "absolute", bottom: "0.5in", left: "0.5in", right: "0.5in", fontSize: "9px", textAlign: "center" }}>
                <strong>NOTE:</strong> All blood bags are properly screened and are NON-REACTIVE to HIV, HBV, HCV, SYPHILIS AND MALARIA
              </div>
            </div>
          </div>

          <div style={styles.modalFooterRelease}>
            <button
              style={{
                padding: "10px 24px",
                backgroundColor: "white",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Barlow",
                ...(hoverStates.cancelInvoice ? { backgroundColor: "#f3f4f6" } : {}),
              }}
              onClick={() => setShowInvoicePreview(false)}
              onMouseEnter={() => handleMouseEnter("cancelInvoice")}
              onMouseLeave={() => handleMouseLeave("cancelInvoice")}
            >
              Close
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                backgroundColor: "#FFC200",
                color: "black",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "Barlow",
                ...(hoverStates.downloadInvoice ? { backgroundColor: "#ffb300" } : {}),
              }}
              onClick={generateInvoicePDFFromPreview}
              onMouseEnter={() => handleMouseEnter("downloadInvoice")}
              onMouseLeave={() => handleMouseLeave("downloadInvoice")}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Plasma</h3>
                <p style={styles.modalSubtitle}>Add New Stock</p>
              </div>
              <button
                style={{
                  ...styles.modalCloseButton,
                  ...(hoverStates.closeModal
                    ? styles.modalCloseButtonHover
                    : {}),
                }}
                onClick={() => setShowAddModal(false)}
                onMouseEnter={() => handleMouseEnter("closeModal")}
                onMouseLeave={() => handleMouseLeave("closeModal")}
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
            <div style={styles.barcodeSection}>
                <img
                  src="/src/assets/scanner.gif"
                  alt="Barcode Scanner"
                  style={styles.barcodeIcon}
                />
              </div>
              <p style={styles.barcodeText}>(if scanner is unavailable)</p>
              <div style={styles.tableHeader}>
                <div style={styles.tableHeaderCell}>Barcode Serial ID</div>
                <div style={styles.tableHeaderCell}>Blood Type</div>
                <div style={styles.tableHeaderCell}>Rh Factor</div>
                <div style={styles.tableHeaderCell}>Volume (mL)</div>
                <div style={styles.tableHeaderCell}>Date of Collection</div>
                <div style={styles.tableHeaderCell}>Expiration Date</div>
                <div style={styles.tableHeaderCell}>Source</div>
              </div>

              <div style={styles.rowsContainer}>
                {stockItems.map((item) => (
                  <div key={item.id} style={styles.dataRow}>
                    <input
                      type="text"
                      style={{
                        ...styles.fieldInput,
                        borderColor: validationErrors[`${item.id}-serial_id`] ? '#ef4444' : '#d1d5db'
                      }}
                      value={item.serial_id}
                      onChange={(e) =>
                        handleStockItemChange(
                          item.id,
                          "serial_id",
                          e.target.value
                        )
                      }
                      placeholder="Enter Serial ID"
                    />
                    <select
                      style={styles.fieldSelect}
                      value={item.type}
                      onChange={(e) =>
                        handleStockItemChange(item.id, "type", e.target.value)
                      }
                    >
                      <option value="O">O</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                    </select>
                    <select
                      style={styles.fieldSelect}
                      value={item.rhFactor}
                      onChange={(e) =>
                        handleStockItemChange(
                          item.id,
                          "rhFactor",
                          e.target.value
                        )
                      }
                    >
                      <option value="+">+</option>
                      <option value="-">-</option>
                    </select>
                    <input
                      type="number"
                      style={styles.fieldInput}
                      value={item.volume}
                      onChange={(e) =>
                        handleStockItemChange(item.id, "volume", e.target.value)
                      }
                      min="1"
                    />
                    <input
                      type="date"
                      style={{
                        ...styles.fieldInput,
                        borderColor: validationErrors[`${item.id}-collection`] ? '#ef4444' : '#d1d5db'
                      }}
                      value={item.collection}
                      onChange={(e) =>
                        handleStockItemChange(
                          item.id,
                          "collection",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="date"
                      style={styles.fieldInputDisabled}
                      value={item.expiration}
                      readOnly
                      disabled
                    />

                    <select
                      style={styles.fieldSelect}
                      value={item.source}
                      onChange={(e) =>
                        handleStockItemChange(item.id, "source", e.target.value)
                      }
                    >
                      <option value="Walk-In">Walk-In</option>
                      <option value="Mobile">Mobile</option>
                    </select>
                  </div>
                ))}
              </div>

              {Object.keys(validationErrors).length > 0 && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '6px',
                marginTop: '16px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  {validationErrors.api && (
                    <div style={{ marginBottom: '4px' }}>{validationErrors.api}</div>
                  )}
                  {validationErrors.save && (
                    <div style={{ marginBottom: '4px' }}>{validationErrors.save}</div>
                  )}
                  {/* Show specific field errors */}
                  {Object.entries(validationErrors)
                    .filter(([key]) => key.includes('-serial_id') || key.includes('-collection'))
                    .map(([key, message]) => (
                      <div key={key} style={{ marginBottom: '4px' }}>
                        • {message}
                      </div>
                    ))
                  }
                  {/* Show generic message only if there are validation errors but no specific messages shown */}
                  {!validationErrors.api && 
                  !validationErrors.save && 
                  Object.keys(validationErrors).length > 0 &&
                  Object.keys(validationErrors).every(key => !validationErrors[key].includes('already exists')) && (
                    <div>Please fill in all required fields (Serial ID and Collection Date)</div>
                  )}
                </div>
              </div>
            )}

              <button
                type="button"
                style={{
                  ...styles.addRowButton,
                  ...(hoverStates.addRow ? styles.addRowButtonHover : {}),
                }}
                onClick={addNewRow}
                onMouseEnter={() => handleMouseEnter("addRow")}
                onMouseLeave={() => handleMouseLeave("addRow")}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add New Row</span>
              </button>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={{
                  ...styles.saveButton,
                  ...(hoverStates.saveStock ? styles.saveButtonHover : {}),
                }}
                onClick={handleSaveAllStock}
                onMouseEnter={() => handleMouseEnter("saveStock")}
                onMouseLeave={() => handleMouseLeave("saveStock")}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
        {showEditModal && editingItem && (
          <div
            style={styles.modalOverlay}
            onClick={() => setShowEditModal(false)}
          >
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={styles.modalTitleSection}>
                  <h3 style={styles.modalTitle}>Plasma</h3>
                  <p style={styles.modalSubtitle}>Edit Stock</p>
                </div>
                <button
                  style={{
                    ...styles.modalCloseButton,
                    ...(hoverStates.closeEditModal
                      ? styles.modalCloseButtonHover
                      : {}),
                  }}
                  onClick={() => setShowEditModal(false)}
                  onMouseEnter={() => handleMouseEnter("closeEditModal")}
                  onMouseLeave={() => handleMouseLeave("closeEditModal")}
                >
                  ×
                </button>
              </div>

              <div style={styles.modalContent}>
                <div style={styles.tableHeader}>
                  <div style={styles.tableHeaderCell}>Barcode Serial ID</div>
                  <div style={styles.tableHeaderCell}>Blood Type</div>
                  <div style={styles.tableHeaderCell}>Rh Factor</div>
                  <div style={styles.tableHeaderCell}>Volume (mL)</div>
                  <div style={styles.tableHeaderCell}>Date of Collection</div>
                  <div style={styles.tableHeaderCell}>Expiration Date</div>
                  <div style={styles.tableHeaderCell}>Source</div>
                </div>

                <div style={styles.dataRow}>
                <input
                    type="text"
                    style={{
                      ...styles.fieldInput,
                      borderColor: editValidationErrors.serial_id ? '#ef4444' : '#d1d5db'
                    }}
                    value={editingItem.serial_id}
                    onChange={(e) =>
                      handleEditItemChange("serial_id", e.target.value)
                    }
                    placeholder="Enter Serial ID"
                  />
                  <select
                    style={styles.fieldSelect}
                    value={editingItem.type}
                    onChange={(e) => handleEditItemChange("type", e.target.value)}
                  >
                    <option value="O">O</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                  </select>
                  <select
                    style={styles.fieldSelect}
                    value={editingItem.rhFactor}
                    onChange={(e) =>
                      handleEditItemChange("rhFactor", e.target.value)
                    }
                  >
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                  <input
                    type="number"
                    style={styles.fieldInput}
                    value={editingItem.volume}
                    onChange={(e) =>
                      handleEditItemChange("volume", e.target.value)
                    }
                    min="1"
                  />
                  <input
                    type="date"
                    style={styles.fieldInput}
                    value={editingItem.collection}
                    onChange={(e) =>
                      handleEditItemChange("collection", e.target.value)
                    }
                  />
                  <input
                  type="date"
                  style={styles.fieldInputDisabled}
                  value={editingItem.expiration}
                  readOnly
                  disabled
                />
                  <select
                    style={styles.fieldSelect}
                    value={editingItem.source || 'Walk-In'} 
                    onChange={(e) =>
                      handleEditItemChange("source", e.target.value)  
                    }
                  >
                    <option value="Walk-In">Walk-In</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>
              </div>
              {/* Error message display for Edit Modal */}
              {Object.keys(editValidationErrors).length > 0 && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    {editValidationErrors.api && (
                      <div style={{ marginBottom: '4px' }}>{editValidationErrors.api}</div>
                    )}
                    {editValidationErrors.save && (
                      <div style={{ marginBottom: '4px' }}>{editValidationErrors.save}</div>
                    )}
                    {editValidationErrors.serial_id && (
                      <div style={{ marginBottom: '4px' }}>• {editValidationErrors.serial_id}</div>
                    )}
                    {editValidationErrors.collection && (
                      <div style={{ marginBottom: '4px' }}>• {editValidationErrors.collection}</div>
                    )}
                    {!editValidationErrors.api && 
                    !editValidationErrors.save && 
                    !editValidationErrors.serial_id &&
                    !editValidationErrors.collection &&
                    Object.keys(editValidationErrors).length > 0 && (
                      <div>Please fill in all required fields</div>
                    )}
                  </div>
                </div>
              )}
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={{
                    ...styles.saveButton,
                    ...(hoverStates.saveEdit ? styles.saveButtonHover : {}),
                  }}
                  onClick={handleSaveEdit}
                  onMouseEnter={() => handleMouseEnter("saveEdit")}
                  onMouseLeave={() => handleMouseLeave("saveEdit")}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Release Stock Modal */}
      {showReleaseModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowReleaseModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Plasma</h3>
                <p style={styles.modalSubtitle}>Release Stock</p>
              </div>
              <button
                style={{
                  ...styles.modalCloseButton,
                  ...(hoverStates.closeReleaseModal
                    ? styles.modalCloseButtonHover
                    : {}),
                }}
                onClick={() => setShowReleaseModal(false)}
                onMouseEnter={() => handleMouseEnter("closeReleaseModal")}
                onMouseLeave={() => handleMouseLeave("closeReleaseModal")}
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
            <div style={styles.barcodeSection}>
                <img
                  src="/src/assets/scanner.gif"
                  alt="Barcode Scanner"
                  style={styles.barcodeIcon}
                />
              </div>
              <p style={styles.barcodeText}>(if scanner is unavailable)</p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                  padding: "0 5px",
                }}
              >
                <div style={styles.tableHeaderCell}>Barcode Serial ID</div>
                <div style={styles.tableHeaderCell}>Blood Type</div>
                <div style={styles.tableHeaderCell}>RH Factor</div>
                <div style={styles.tableHeaderCell}>Volume</div>
                <div style={styles.tableHeaderCell}>Date of Collection</div>
                <div style={styles.tableHeaderCell}>Expiration Date</div>
                <div style={styles.tableHeaderCell}>Status</div>
                <div style={styles.tableHeaderCell}>Action</div>
              </div>

              <div style={styles.rowsContainer}>
                {selectedItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr",
                      gap: "6px",
                      marginBottom: "15px",
                      alignItems: "center",
                      backgroundColor: item.found ? "#f0f9ff" : "#fef2f2",
                      padding: "8px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        style={{
                          ...styles.fieldInput,
                          paddingRight: "30px",
                          border: item.found
                            ? "1px solid #0ea5e9"
                            : item.serialId && !item.found
                              ? "1px solid #ef4444"
                              : "1px solid #d1d5db",
                        }}
                        value={item.serialId}
                        onChange={(e) =>
                          handleReleaseItemChange(
                            index,
                            "serialId",
                            e.target.value
                          )
                        }
                        placeholder="Enter Serial ID"
                        autoComplete="off"
                      />
                      <div
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      >
                        {item.serialId &&
                          (item.found ? (
                            <svg
                              width="16"
                              height="16"
                              fill="#059669"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              fill="#ef4444"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ))}
                      </div>
                    </div>

                    <select
                      style={{
                        ...styles.fieldSelect,
                        fontSize: "12px",
                        backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                        color: item.found ? "#374151" : "#9ca3af",
                      }}
                      value={item.bloodType}
                      disabled
                    >
                      <option value="O">O</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                    </select>

                    <select
                      style={{
                        ...styles.fieldSelect,
                        fontSize: "12px",
                        backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                        color: item.found ? "#374151" : "#9ca3af",
                      }}
                      value={item.rhFactor}
                      disabled
                    >
                      <option value="+">+</option>
                      <option value="-">-</option>
                    </select>

                    <input
                      type="number"
                      style={{
                        ...styles.fieldInputDisabled,
                        backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                        color: item.found ? "#374151" : "#9ca3af",
                      }}
                      value={item.volume}
                      readOnly
                      disabled
                    />

                    <input
                      type="date"
                      style={{
                        ...styles.fieldInputDisabled,
                        backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                        color: item.found ? "#374151" : "#9ca3af",
                      }}
                      value={item.collection}
                      readOnly
                      disabled
                    />

                    <input
                      type="date"
                      style={{
                        ...styles.fieldInputDisabled,
                        backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                        color: item.found ? "#374151" : "#9ca3af",
                      }}
                      value={item.expiration}
                      readOnly
                      disabled
                    />
                
                    <span
                      style={{
                        padding: "4px 8px",
                        backgroundColor: item.found ? "#dcfdf4" : "#fee2e2",
                        color: item.found ? "#065f46" : "#991b1b",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.found ? item.status : "Not Found"}
                    </span>

                    <button
                      type="button"
                      style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                        transition: "background-color 0.2s ease",
                        ...(hoverStates[`removeRelease-${index}`]
                          ? { backgroundColor: "#dc2626" }
                          : {}),
                      }}
                      onClick={() => removeReleaseItem(index)}
                      disabled={selectedItems.length === 1}
                      onMouseEnter={() =>
                        handleMouseEnter(`removeRelease-${index}`)
                      }
                      onMouseLeave={() =>
                        handleMouseLeave(`removeRelease-${index}`)
                      }
                    >
                      <svg
                        width="12"
                        height="12"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>
                ))}

                {error && (
                  <div style={styles.errorContainer}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                style={{
                  ...styles.addRowButton,
                  ...(hoverStates.addRelease ? styles.addRowButtonHover : {}),
                }}
                onClick={addReleaseItem}
                onMouseEnter={() => handleMouseEnter("addRelease")}
                onMouseLeave={() => handleMouseLeave("addRelease")}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add Another Item</span>
              </button>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "12px 16px",
                  marginTop: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    margin: "0 0 4px 0",
                  }}
                >
                  Release Summary:
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  {selectedItems.filter((item) => item.found).length} of{" "}
                  {selectedItems.length} items ready for release
                </p>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={{
                  ...styles.saveButton,
                  ...(hoverStates.proceedRelease ? styles.saveButtonHover : {}),
                }}
                onClick={proceedToReleaseDetails}
                onMouseEnter={() => handleMouseEnter("proceedRelease")}
                onMouseLeave={() => handleMouseLeave("proceedRelease")}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Details Modal */}
      {showReleaseDetailsModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowReleaseDetailsModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Plasma</h3>
                <p style={styles.modalSubtitle}>Release Stock - Details</p>
              </div>
              <button
                style={{
                  ...styles.modalCloseButton,
                  ...(hoverStates.closeDetailsModal
                    ? styles.modalCloseButtonHover
                    : {}),
                }}
                onClick={() => setShowReleaseDetailsModal(false)}
                onMouseEnter={() => handleMouseEnter("closeDetailsModal")}
                onMouseLeave={() => handleMouseLeave("closeDetailsModal")}
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
            <div
              style={{
                backgroundColor: "#f0f9ff",
                border: "1px solid #0ea5e9",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e40af",
                  margin: "0 0 12px 0",
                }}
              >
                Items to Release (
                {selectedItems.filter((item) => item.found).length})
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  gap: "12px",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                <div>Serial ID</div>
                <div>Blood Type</div>
                <div>RH Factor</div>
                <div>Volume (mL)</div>
              </div>
              {selectedItems
                .filter((item) => item.found)
                .map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      gap: "12px",
                      fontSize: "12px",
                      color: "#6b7280",
                      padding: "8px 0",
                      borderTop: index > 0 ? "1px solid #e5e7eb" : "none",
                    }}
                  >
                    <div style={{ fontWeight: "500", color: "#374151" }}>
                      {item.serialId}
                    </div>
                    <div>{item.bloodType}</div>
                    <div>{item.rhFactor}</div>
                    <div>{item.volume}</div>
                  </div>
                ))}
              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #0ea5e9",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1e40af",
                }}
              >
                Total Volume:{" "}
                {selectedItems
                  .filter((item) => item.found)
                  .reduce((sum, item) => sum + parseInt(item.volume || 0), 0)}{" "}
                mL
              </div>
            </div>

              <div style={styles.filterContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Receiving Facility</label>
                  <select
                    style={{
                      ...styles.fieldSelect,
                      borderColor: releaseValidationErrors.receivingFacility ? '#ef4444' : '#d1d5db'
                    }}
                    value={releaseData.receivingFacility}
                    onChange={(e) =>
                      handleReleaseDataChange("receivingFacility", e.target.value)
                    }
                  >
                    <option value="">Select Receiving Facility</option>
                    <option value="Northern Mindanao Medical Center">Northern Mindanao Medical Center</option>
                    <option value="J.R. Borja General Hospital">J.R. Borja General Hospital</option>
                    <option value="Cagayan de Oro Medical Center, Inc.">Cagayan de Oro Medical Center, Inc.</option>
                    <option value="Maria Reyna‑Xavier University Hospital, Inc.">Maria Reyna‑Xavier University Hospital, Inc.</option>
                    <option value="Madonna and Child Medical Center">Madonna and Child Medical Center</option>
                    <option value="Sabal Hospital, Inc.">Sabal Hospital, Inc.</option>
                    <option value="Cagayan de Oro Polymedic General Hospital, Inc.">Cagayan de Oro Polymedic General Hospital, Inc.</option>
                    <option value="Capitol University Medical Center Foundation of Cagayan, Inc.">Capitol University Medical Center Foundation of Cagayan, Inc.</option>
                    <option value="Adventist Medical Center–Iligan City, Inc.">Adventist Medical Center–Iligan City, Inc.</option>
                    <option value="Mercy Community Hospital, Inc.">Mercy Community Hospital, Inc.</option>
                    <option value="Iligan Medical Center Hospital">Iligan Medical Center Hospital</option>
                    <option value="Gregorio T. Lluch Memorial Hospital">Gregorio T. Lluch Memorial Hospital</option>
                    <option value="Lanao del Norte Provincial Hospital">Lanao del Norte Provincial Hospital</option>
                    <option value="Bukidnon Provincial Hospital - Manolo Fortich">Bukidnon Provincial Hospital - Manolo Fortich</option>
                    <option value="Valencia Polymedic General Hospital, Inc.">Valencia Polymedic General Hospital, Inc.</option>
                    <option value="Camiguin General Hospital">Camiguin General Hospital</option>
                    <option value="Mayor Hilarion A. Ramiro Sr. Medical Center">Mayor Hilarion A. Ramiro Sr. Medical Center</option>
                    <option value="Tobias Feliciano Faith General Hospital, Inc.">Tobias Feliciano Faith General Hospital, Inc.</option>
                    <option value="Medina General Hospital">Medina General Hospital</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Address</label>
                  <input
                    type="text"
                    style={{
                      ...styles.fieldInput,
                      borderColor: releaseValidationErrors.address ? '#ef4444' : '#d1d5db'
                    }}
                    value={releaseData.address}
                    onChange={(e) =>
                      handleReleaseDataChange("address", e.target.value)
                    }
                  />
                </div>
                </div>
                <div style={styles.filterContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Classification</label>
                <select
                  style={{
                    ...styles.fieldSelect,
                    borderColor: releaseValidationErrors.classification ? '#ef4444' : '#d1d5db'
                  }}
                  value={releaseData.classification}
                  onChange={(e) =>
                    handleReleaseDataChange("classification", e.target.value)
                  }
                >
                  <option value="">Select classification</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Condition Upon Release</label>
                <select
                  style={{
                    ...styles.fieldSelect,
                    borderColor: releaseValidationErrors.conditionUponRelease ? '#ef4444' : '#d1d5db'
                  }}
                  value={releaseData.conditionUponRelease}
                  onChange={(e) =>
                    handleReleaseDataChange(
                      "conditionUponRelease",
                      e.target.value
                    )
                  }
                >
                  <option value="">Select Condition</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            </div>

            <div style={styles.filterContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Authorized Recipient</label>
                <input
                  type="text"
                  style={{
                    ...styles.fieldInput,
                    borderColor: releaseValidationErrors.authorizedRecipient ? '#ef4444' : '#d1d5db'
                  }}
                  value={releaseData.authorizedRecipient}
                  onChange={(e) =>
                    handleReleaseDataChange(
                      "authorizedRecipient",
                      e.target.value
                    )
                  }
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Contact Number</label>
                <input
                  type="tel"
                  style={{
                    ...styles.fieldInput,
                    borderColor: releaseValidationErrors.contactNumber ? '#ef4444' : '#d1d5db'
                  }}
                  value={releaseData.contactNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numberPart = value
                      .replace("+63", "")
                      .replace(/\D/g, "");
                    const limitedNumber = numberPart.slice(0, 10);
                    handleReleaseDataChange(
                      "contactNumber",
                      limitedNumber ? `+63${limitedNumber}` : "+63"
                    );
                  }}
                  placeholder="+63"
                  maxLength={13}
                />
              </div>
            </div>

            <div style={styles.filterContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Released by</label>
                <input
                  type="text"
                  style={{
                    ...styles.fieldInput,
                    backgroundColor: "#f9fafb",
                    cursor: "not-allowed",
                  }}
                  value={releaseData.releasedBy}
                  readOnly
                  disabled
                  onChange={(e) =>
                    handleReleaseDataChange("releasedBy", e.target.value)
                  }
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Verified by
                </label>
                <select
                  style={{
                    ...styles.fieldSelect,
                    borderColor: releaseValidationErrors.recipientDesignation ? '#ef4444' : '#d1d5db'
                  }}
                  value={releaseData.recipientDesignation}
                  onChange={(e) =>
                    handleReleaseDataChange("recipientDesignation", e.target.value)
                  }
                >
                  <option value="">Select Verifier</option>
                  <option value="Mr. Michille V. Flaviano, RMT">Mr. Michille V. Flaviano, RMT</option>
                  <option value="Mr. Roeben Dem P. Perez, RMT">Mr. Roeben Dem P. Perez, RMT</option>
                  <option value="Mrs. Sheila Marie P. Ybañez, RMTM MSHHM">Mrs. Sheila Marie P. Ybañez, RMTM MSHHM</option>
                </select>
              </div>
            </div>

            <div style={styles.filterContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Request Reference Number</label>
                <input
                  type="text"
                  style={{
                    ...styles.fieldInput,
                    backgroundColor: "#f9fafb",
                    cursor: "not-allowed",
                  }}
                  value={releaseData.requestReference}
                  readOnly
                  disabled
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date of Release</label>
                <input
                  type="date"
                  style={{
                    ...styles.fieldInput,
                    borderColor: releaseValidationErrors.dateOfRelease ? '#ef4444' : '#d1d5db'
                  }}
                  value={releaseData.dateOfRelease}
                  onChange={(e) =>
                    handleReleaseDataChange("dateOfRelease", e.target.value)
                  }
                />
              </div>
            </div>
              {/* Error message display for Release Modal */}
              {Object.keys(releaseValidationErrors).length > 0 && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    {releaseValidationErrors.api && (
                      <div style={{ marginBottom: '4px' }}>{releaseValidationErrors.api}</div>
                    )}
                    {releaseValidationErrors.save && (
                      <div style={{ marginBottom: '4px' }}>{releaseValidationErrors.save}</div>
                    )}
                    {releaseValidationErrors.items && (
                      <div style={{ marginBottom: '4px' }}>{releaseValidationErrors.items}</div>
                    )}
                    {Object.entries(releaseValidationErrors)
                      .filter(([key]) => !['api', 'save', 'items'].includes(key))
                      .map(([key, message]) => (
                        <div key={key} style={{ marginBottom: '4px' }}>
                          • {message}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={{
                  ...styles.saveButton,
                  ...(hoverStates.confirmRelease ? styles.saveButtonHover : {}),
                }}
                onClick={confirmRelease}
                onMouseEnter={() => handleMouseEnter("confirmRelease")}
                onMouseLeave={() => handleMouseLeave("confirmRelease")}
              >
                Confirm Release (
                {selectedItems.filter((item) => item.found).length} items)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plasma;