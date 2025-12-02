import React, { useState, useEffect, useRef } from "react";
import { Trash2, Plus } from "lucide-react";

const Loader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <div style={{ fontSize: "18px", color: "#6b7280" }}>Loading...</div>
  </div>
);

const RedBloodCellNC = () => {
  const [bloodData, setBloodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDiscardDetailsModal, setShowDiscardDetailsModal] = useState(false);
  const [discardItems, setDiscardItems] = useState([
    {
      id: 1,
      serialId: "",
      bloodType: "O",
      rhFactor: "+",
      volume: 100,
      collection: "",
      expiration: "",
      status: "Stored",
      category: "",
      source: "Walk-In",
      found: false,
    },
  ]);
  const [discardFormData, setDiscardFormData] = useState({
    responsiblePersonnel: "",
    reasonForDiscarding: "",
    authorizedBy: "",
    dateOfDiscard: "",
    timeOfDiscard: "",
    methodOfDisposal: "",
    remarks: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [showDiscardConfirmModal, setShowDiscardConfirmModal] = useState(false);
  const [showDiscardSuccessModal, setShowDiscardSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [editValidationErrors, setEditValidationErrors] = useState({});
  const [discardValidationErrors, setDiscardValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created",
    direction: "desc",
  });
  const [filterConfig, setFilterConfig] = useState({ field: "", value: "" });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [nonConformingItems, setNonConformingItems] = useState([
    {
      id: 1,
      serialId: "",
      bloodType: "O",
      rhFactor: "+",
      volume: 100,
      collection: "",
      expiration: "",
      status: "Stored",
      category: "",
      source: "Walk-In",
      found: false,
    },
  ]);
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const searchTimeoutsRef = useRef({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(userData);
    loadNonConformingData();
  }, []);


  useEffect(() => {
    if (window.electronAPI) {
      try {
        const testResult = window.electronAPI.test();
        console.log("API test result:", testResult);
      } catch (err) {
        console.error("API test failed:", err);
      }
    }
    loadNonConformingData();
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

  useEffect(() => {
    return () => {
      Object.values(searchTimeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
      searchTimeoutsRef.current = {};
    };
  }, []);

  const loadNonConformingData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.electronAPI) {
        throw new Error(
          "Electron API not available. Make sure you are running this in an Electron environment."
        );
      }

      const data = await window.electronAPI.getAllNonConforming();
      setBloodData(data);
    } catch (err) {
      console.error("Error loading non-conforming data:", err);
      setError(`Failed to load non-conforming data: ${err.message}`);
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
        await loadNonConformingData();
      } else {
        const searchResults =
          await window.electronAPI.searchNonConforming(value);
        setBloodData(searchResults);
      }
    } catch (err) {
      console.error("Error searching:", err);
      setError("Search failed");
    }
  };

  const toggleRowSelection = (id) => {
    setBloodData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = displayData.every((item) => item.selected);
    setBloodData((prevData) =>
      prevData.map((item) => {
        if (displayData.find((d) => d.id === item.id)) {
          return { ...item, selected: !allSelected };
        }
        return item;
      })
    );
  };

  const clearAllSelection = () => {
    setBloodData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  const calculateExpiration = (collectionDate) => {
    if (!collectionDate) return "";
    const collection = new Date(collectionDate);
    const expiration = new Date(collection);
    expiration.setDate(collection.getDate() + 35);
    return expiration.toISOString().split("T")[0];
  };

  const handleNonConformingItemChange = async (index, field, value) => {
    if (field === "serialId") {
      setNonConformingItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value, found: false } : item
        )
      );
  
      // Clear validation error for this field
      if (validationErrors[`${index}-${field}`]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`${index}-${field}`];
          return newErrors;
        });
      }
  
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
  
          const stockData =
            await window.electronAPI.getBloodStockBySerialIdForNC(value.trim());
  
          if (
            stockData &&
            !Array.isArray(stockData) &&
            stockData.category === "Red Blood Cell"
          ) {
            setNonConformingItems((prev) =>
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
                      category: stockData.category,
                      source: stockData.source,
                      found: true,
                    }
                  : item
              )
            );
            setError(null);
          } else if (Array.isArray(stockData) && stockData.length > 0) {
            const rbcMatch = stockData.find(
              (item) => item.category === "Red Blood Cell"
            );
  
            if (rbcMatch) {
              setNonConformingItems((prev) =>
                prev.map((item, i) =>
                  i === index
                    ? {
                        ...item,
                        serialId: value.trim(),
                        bloodType: rbcMatch.type,
                        rhFactor: rbcMatch.rhFactor,
                        volume: rbcMatch.volume,
                        collection: rbcMatch.collection,
                        expiration: rbcMatch.expiration,
                        status: rbcMatch.status,
                        category: rbcMatch.category,
                        source: rbcMatch.source,
                        found: true,
                      }
                    : item
                )
              );
              setError(null);
            } else {
              setNonConformingItems((prev) =>
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
                        category: "",
                        found: false,
                      }
                    : item
                )
              );
              setError(
                `No Red Blood Cell stock found with serial ID: ${value.trim()}`
              );
            }
          } else {
            setNonConformingItems((prev) =>
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
                      category: "",
                      source: "Walk-In",
                      found: false,
                    }
                  : item
              )
            );
            setError(
              `No Red Blood Cell stock found with serial ID: ${value.trim()}`
            );
          }
        } catch (err) {
          console.error("Error fetching blood stock by serial ID:", err);
          setError("Failed to fetch blood stock data");
          setNonConformingItems((prev) =>
            prev.map((item, i) =>
              i === index ? { ...item, found: false } : item
            )
          );
        }
      }, 300);
    } else {
      setNonConformingItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    }
  };

  const handleNonConformingDiscardChange = async (index, field, value) => {
    if (field === "serialId") {
      setDiscardItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value, found: false } : item
        )
      );
  
      if (searchTimeoutsRef.current[`discard-${index}`]) {
        clearTimeout(searchTimeoutsRef.current[`discard-${index}`]);
      }
  
      if (!value || value.trim() === "") {
        setError(null);
        return;
      }
  
      searchTimeoutsRef.current[`discard-${index}`] = setTimeout(async () => {
        try {
          if (!window.electronAPI) {
            setError("Electron API not available");
            return;
          }
  
          // FIXED: Use the correct API method for non-conforming discard
          const ncData = await window.electronAPI.getNonConformingBySerialIdForDiscard(
            value.trim()
          );
  
          if (ncData && !Array.isArray(ncData) && ncData.category === 'Red Blood Cell') {
            setDiscardItems((prev) =>
              prev.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      serialId: value.trim(),
                      bloodType: ncData.type,
                      rhFactor: ncData.rhFactor,
                      volume: ncData.volume,
                      collection: ncData.collection,
                      expiration: ncData.expiration,
                      status: ncData.status,
                      category: ncData.category,
                      source: ncData.source || "Walk-In",
                      found: true,
                    }
                  : item
              )
            );
            setError(null);
          } else if (Array.isArray(ncData) && ncData.length > 0) {
            const rbcMatch = ncData.find(item => item.category === "Red Blood Cell");
  
            if (rbcMatch) {
              setDiscardItems((prev) =>
                prev.map((item, i) =>
                  i === index
                    ? {
                        ...item,
                        serialId: value.trim(),
                        bloodType: rbcMatch.type,
                        rhFactor: rbcMatch.rhFactor,
                        volume: rbcMatch.volume,
                        collection: rbcMatch.collection,
                        expiration: rbcMatch.expiration,
                        status: rbcMatch.status,
                        category: rbcMatch.category,
                        source: rbcMatch.source || "Walk-In",
                        found: true,
                      }
                    : item
                )
              );
              setError(null);
            } else {
              setDiscardItems((prev) =>
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
                        category: "",
                        source: "Walk-In",
                        found: false,
                      }
                    : item
                )
              );
              setError(`No Red Blood Cell non-conforming stock found with serial ID: ${value.trim()}`);
            }
          } else {
            setDiscardItems((prev) =>
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
                      category: "",
                      source: "Walk-In",
                      found: false,
                    }
                  : item
              )
            );
            setError(`No Red Blood Cell non-conforming stock found with serial ID: ${value.trim()}`);
          }
        } catch (err) {
          console.error("Error fetching non-conforming stock by serial ID:", err);
          setError("Failed to fetch non-conforming stock data");
          setDiscardItems((prev) =>
            prev.map((item, i) =>
              i === index ? { ...item, found: false } : item
            )
          );
        }
      }, 300);
    } else {
      setDiscardItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    }
  };

  const addNewDiscardRow = () => {
    const newId = Math.max(...discardItems.map((item) => item.id), 0) + 1;
    setDiscardItems((prev) => [
      ...prev,
      {
        id: newId,
        serialId: "",
        bloodType: "O",
        rhFactor: "+",
        volume: 100,
        collection: "",
        expiration: "",
        status: "Stored",
        category: "",
        source: "Walk-In",
        found: false,
      },
    ]);
  };

  const removeDiscardRow = (index) => {
    if (discardItems.length > 1) {
      setDiscardItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleDiscardFormDataChange = (field, value) => {
    setDiscardFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error for this field when user starts typing
    if (discardValidationErrors[field]) {
      setDiscardValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  

  const handleDiscardProceed = async (e) => {
    e.preventDefault();
    const validItems = discardItems.filter(
      (item) => item.serialId && item.found
    );
    if (validItems.length === 0) {
      setError("Please select at least one valid item with a found serial ID");
      return;
    }
    setDiscardItems(validItems);
    setShowDiscardModal(false);
    setShowDiscardDetailsModal(true);
  };

  const confirmDiscard = async () => {
    // Validate all fields
    const errors = {};
    if (!discardFormData.responsiblePersonnel || discardFormData.responsiblePersonnel.trim() === "") {
      errors.responsiblePersonnel = "Responsible personnel is required";
    }
    if (!discardFormData.reasonForDiscarding) {
      errors.reasonForDiscarding = "Reason for discarding is required";
    }
    if (!discardFormData.authorizedBy || discardFormData.authorizedBy.trim() === "") {
      errors.authorizedBy = "Authorized by is required";
    }
    if (!discardFormData.dateOfDiscard) {
      errors.dateOfDiscard = "Date of discard is required";
    }
    if (!discardFormData.timeOfDiscard) {
      errors.timeOfDiscard = "Time of discard is required";
    }
    if (!discardFormData.methodOfDisposal) {
      errors.methodOfDisposal = "Method of disposal is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setDiscardValidationErrors(errors);
      return;
    }
    
    try {
      setSaving(true);
      if (!window.electronAPI) {
        setDiscardValidationErrors({ api: "Electron API not available" });
        return;
      }
      
      const validItems = discardItems.filter(
        (item) => item.serialId && item.found
      );
      if (validItems.length === 0) {
        setDiscardValidationErrors({ items: "No valid items to discard" });
        setSaving(false);
        return;
      }
      
      const discardData = {
        serialIds: validItems.map((item) => item.serialId),
        responsiblePersonnel: discardFormData.responsiblePersonnel,
        reasonForDiscarding: discardFormData.reasonForDiscarding,
        authorizedBy: discardFormData.authorizedBy,
        dateOfDiscard: discardFormData.dateOfDiscard,
        timeOfDiscard: discardFormData.timeOfDiscard,
        methodOfDisposal: discardFormData.methodOfDisposal,
        remarks: discardFormData.remarks,
      };
      
      // ADDED: Pass currentUser to the discard function
      const result = await window.electronAPI.discardNonConformingStock(discardData, currentUser);
      
      if (result.success) {
        setShowDiscardDetailsModal(false);
        setShowDiscardModal(false);
        setDiscardValidationErrors({});
        setDiscardItems([
          {
            id: 1,
            serialId: "",
            bloodType: "O",
            rhFactor: "+",
            volume: 100,
            collection: "",
            expiration: "",
            status: "Stored",
            category: "",
            found: false,
          },
        ]);
        setDiscardFormData({
          responsiblePersonnel: "",
          reasonForDiscarding: "",
          authorizedBy: "",
          dateOfDiscard: "",
          timeOfDiscard: "",
          methodOfDisposal: "",
          remarks: "",
        });
        await loadNonConformingData();
        setError(null);
        setSuccessMessage({
          title: "Non-Conforming Records Discarded!",
          description: `${result.discardedCount} blood unit(s) have been successfully discarded.`,
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Error discarding non-conforming stock:", err);
      setDiscardValidationErrors({ save: `Failed to discard non-conforming stock: ${err.message}` });
    } finally {
      setSaving(false);
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
    const newId = Math.max(...nonConformingItems.map((item) => item.id)) + 1;
    setNonConformingItems((prev) => [
      ...prev,
      {
        id: newId,
        serialId: "",
        bloodType: "O",
        rhFactor: "+",
        volume: 100,
        collection: "",
        expiration: "",
        status: "Stored",
        category: "",
        source: "Walk-In",
        found: false,
      },
    ]);
    setValidationErrors({});
  };
  

  const removeRow = (index) => {
    if (nonConformingItems.length > 1) {
      setNonConformingItems((prev) => prev.filter((_, i) => i !== index));
    }
  };
  const handleSaveAllStock = async (e) => {
    e.preventDefault();
    
    // Validate all items
    const errors = {};
    let hasInvalidItems = false;
    
    nonConformingItems.forEach((item, index) => {
      if (!item.serialId || item.serialId.trim() === "") {
        errors[`${index}-serialId`] = "Serial ID is required";
        hasInvalidItems = true;
      } else if (!item.found) {
        errors[`${index}-serialId`] = "Serial ID not found or invalid";
        hasInvalidItems = true;
      }
    });
    
    if (hasInvalidItems || Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Please ensure all items have valid serial IDs");
      return;
    }
    
    try {
      setSaving(true);
      if (!window.electronAPI) {
        setValidationErrors({ api: "Electron API not available" });
        return;
      }
  
      const validItems = nonConformingItems.filter(
        (item) => item.serialId && item.found
      );
  
      if (validItems.length === 0) {
        setValidationErrors({ items: "Please add at least one valid item with a found serial ID" });
        setSaving(false);
        return;
      }
  
      const serialIds = validItems.map((item) => item.serialId);

      const result = await window.electronAPI.transferToNonConforming(
        serialIds,
        currentUser 
      );
  
      if (result.success) {
        setShowAddModal(false);
        setValidationErrors({});
        setNonConformingItems([
          {
            id: 1,
            serialId: "",
            bloodType: "O",
            rhFactor: "+",
            volume: 100,
            collection: "",
            expiration: "",
            status: "Stored",
            category: "",
            found: false,
          },
        ]);
        await loadNonConformingData();
        setError(null);
  
        setSuccessMessage({
          title: "Non-Conforming Records Added!",
          description: `${result.transferredCount} blood unit(s) have been transferred to non-conforming inventory.`,
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Error transferring to non-conforming:", err);
      
      let errorMessage = err.message;
      
      if (errorMessage.includes("already exists")) {
        const serialIdMatch = errorMessage.match(/Serial ID (\S+) already exists/);
        if (serialIdMatch) {
          const duplicateSerialId = serialIdMatch[1];
          const duplicateErrors = {};
          nonConformingItems.forEach((item, index) => {
            if (item.serialId === duplicateSerialId) {
              duplicateErrors[`${index}-serialId`] = `Serial ID ${duplicateSerialId} already exists in non-conforming`;
            }
          });
          setValidationErrors(duplicateErrors);
        } else {
          setValidationErrors({ save: errorMessage });
        }
      } else {
        setValidationErrors({ save: `Failed to transfer to non-conforming: ${errorMessage}` });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = () => {
    const selected = bloodData.find((item) => item.selected);
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
  
      const ncData = {
        serial_id: editingItem.serial_id,
        type: editingItem.type,
        rhFactor: editingItem.rhFactor,
        volume: editingItem.volume,
        collection: editingItem.collection,
        expiration: editingItem.expiration,
        status: "Non-Conforming",
        category: editingItem.category,
        source: editingItem.source 
      };
  
      await window.electronAPI.updateNonConforming(editingItem.id, ncData, currentUser);

      setShowEditModal(false);
      setEditingItem(null);
      setEditValidationErrors({});
      await loadNonConformingData();
      clearAllSelection();
      setError(null);
  
      setSuccessMessage({
        title: "Non-Conforming Record Updated!",
        description: "The non-conforming record has been successfully updated.",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error updating non-conforming record:", err);
      
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
        setEditValidationErrors({ save: `Failed to update non-conforming record: ${errorMessage}` });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const selectedIds = bloodData
      .filter((item) => item.selected)
      .map((item) => item.id);

    if (selectedIds.length === 0) return;

    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      setSaving(true);
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      const selectedIds = bloodData
        .filter((item) => item.selected)
        .map((item) => item.id);

      await window.electronAPI.deleteNonConforming(selectedIds, currentUser);
      setShowDeleteConfirmModal(false);
      await loadNonConformingData();
      clearAllSelection();
      setError(null);

      setSuccessMessage({
        title: "Records Deleted Successfully!",
        description: `${selectedIds.length} non-conforming record(s) have been deleted.`,
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error deleting items:", err);
      setError("Failed to delete items");
      setShowDeleteConfirmModal(false);
    } finally {
      setSaving(false);
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
    let filtered = [...bloodData];

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
  const selectedCount = bloodData.filter((item) => item.selected).length;
  const singleSelected = selectedCount === 1;

  const getSortLabel = () => {
    const labels = {
      serial_id: "Serial ID",
      type: "Blood Type",
      rhFactor: "RH Factor",
      volume: "Volume",
      status: "Status",
      category: "Category",
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
    releaseButton: {
      display: "flex",
      alignItems: "center",
      gap: "1px",
      padding: "8px 16px",
      backgroundColor: "#E53C3C",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Barlow",
      whiteSpace: "nowrap",
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
      fontSize: "10px",
      fontWeight: "500",
      backgroundColor: "#F7D8FF",
      color: "#B612DF",
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
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "12px 16px",
      borderRadius: "6px",
      marginTop: "16px",
      fontSize: "14px",
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
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
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr 1fr",
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
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr",
      gap: "6px",
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
    modalFooter: {
      padding: "20px 30px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "center",
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
      fontFamily: "Barlow",
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
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
    },
    cancelButtonHover: {
      backgroundColor: "#d1d5db",
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
    confirmButtonHover: {
      backgroundColor: "#ffb300",
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
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
    },
    deleteConfirmButtonHover: {
      backgroundColor: "#dc2626",
    },
  };

  const [hoverStates, setHoverStates] = useState({});

  const handleMouseEnter = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: true }));
  };

  const handleMouseLeave = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: false }));
  };

  if (loading || saving) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Red Blood Cell</h2>
        <p style={styles.subtitle}>Non-Conforming</p>
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
              placeholder="Search by serial ID, blood type, or category"
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
                  { key: "category", label: "Category" },
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
                      <option value="category">Category</option>
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
            style={styles.releaseButton}
            onClick={() => setShowDiscardModal(true)}
          >
            <Trash2 size={16} style={{ marginRight: "4px" }} />
            Discard
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
              <th style={{ ...styles.th, width: "3%" }}>
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
                style={{ ...styles.th, width: "9%", cursor: "pointer" }}
                onClick={() => handleSort("serial_id")}
              >
                SERIAL ID{" "}
                {sortConfig.key === "serial_id" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={{ ...styles.th, width: "6%", cursor: "pointer" }}
                onClick={() => handleSort("type")}
              >
                BLOOD TYPE{" "}
                {sortConfig.key === "type" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={{ ...styles.th, width: "6%", cursor: "pointer" }}
                onClick={() => handleSort("rhFactor")}
              >
                RH FACTOR{" "}
                {sortConfig.key === "rhFactor" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={{ ...styles.th, width: "7%", cursor: "pointer" }}
                onClick={() => handleSort("volume")}
              >
                VOLUME (ML){" "}
                {sortConfig.key === "volume" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th style={{ ...styles.th, width: "10%" }}>DATE OF COLLECTION</th>
              <th style={{ ...styles.th, width: "10%" }}>EXPIRATION DATE</th>
              <th
                style={{ ...styles.th, width: "10%", cursor: "pointer" }}
                onClick={() => handleSort("status")}
              >
                STATUS{" "}
                {sortConfig.key === "status" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={{ ...styles.th, width: "10%", cursor: "pointer" }}
                onClick={() => handleSort("category")}
              >
                CATEGORY{" "}
                {sortConfig.key === "category" &&
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
              <th style={{ ...styles.th, width: "11%" }}>CREATED AT</th>
              <th style={{ ...styles.th, width: "11%" }}>MODIFIED AT</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan="12"
                  style={{ ...styles.td, textAlign: "center", padding: "40px" }}
                >
                  No non-conforming records found
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
                  <td style={styles.td}>{item.category}</td>
                  <td style={styles.td}>{item.source}</td>
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
            onClick={handleDelete}
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

      {/* EDIT CONFIRMATION MODAL */}
      {showEditConfirmModal && (
        <div style={styles.successModalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.confirmTitle}>Confirm Update</h3>
            <p style={styles.confirmDescription}>
              Are you sure you want to update this non-conforming record?
            </p>
            <div style={styles.confirmButtonGroup}>
              <button
                style={{
                  ...styles.cancelButton,
                  ...(hoverStates.cancelEdit ? styles.cancelButtonHover : {}),
                }}
                onClick={() => setShowEditConfirmModal(false)}
                onMouseEnter={() => handleMouseEnter("cancelEdit")}
                onMouseLeave={() => handleMouseLeave("cancelEdit")}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.confirmButton,
                  ...(hoverStates.confirmEdit ? styles.confirmButtonHover : {}),
                }}
                onClick={confirmEdit}
                onMouseEnter={() => handleMouseEnter("confirmEdit")}
                onMouseLeave={() => handleMouseLeave("confirmEdit")}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirmModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowDeleteConfirmModal(false)}
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
                onClick={() => setShowDeleteConfirmModal(false)}
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
                  Items to Delete ({bloodData.filter((item) => item.selected).length})
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
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
                  <div>Category</div>
                  <div>Source</div>
                </div>
                {bloodData
                  .filter((item) => item.selected)
                  .map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
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
                      <div>{item.category}</div>
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
                  {bloodData
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
                    These items will be permanently deleted from the non-conforming records. This action cannot be undone.
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
                {bloodData.filter((item) => item.selected).length} items)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCARD MODAL*/}
      {showDiscardModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowDiscardModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Red Blood Cell</h3>
                <p style={styles.modalSubtitle}>Discard Stock</p>
              </div>
              <button
                style={{
                  ...styles.modalCloseButton,
                  ...(hoverStates.closeDiscardModal
                    ? styles.modalCloseButtonHover
                    : {}),
                }}
                onClick={() => setShowDiscardModal(false)}
                onMouseEnter={() => handleMouseEnter("closeDiscardModal")}
                onMouseLeave={() => handleMouseLeave("closeDiscardModal")}
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
                <div style={styles.tableHeaderCell}>Category</div>
                <div style={styles.tableHeaderCell}>Source</div>
                <div style={styles.tableHeaderCell}>Action</div>
              </div>

              <div style={styles.rowsContainer}>
                {discardItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.dataRow,
                      gridTemplateColumns:
                        "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr 1fr",
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
                          handleNonConformingDiscardChange(
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
                          fontSize: "10px",
                          fontWeight: "500",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.found ? item.category : "Not Found"}
                      </span>

                      <span
                        style={{
                          padding: "4px 8px",
                          backgroundColor: item.found ? "#dbeafe" : "#f9fafb",
                          color: item.found ? "#1e40af" : "#9ca3af",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "500",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.found ? item.source || "Walk-In" : "-"}
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
                        ...(hoverStates[`removeRow-${index}`]
                          ? { backgroundColor: "#dc2626" }
                          : {}),
                      }}
                      onClick={() => removeDiscardRow(index)}
                        disabled={discardItems.length === 1}
                        onMouseEnter={() =>
                          handleMouseEnter(`removeDiscardRow-${index}`)
                        }
                        onMouseLeave={() =>
                          handleMouseLeave(`removeDiscardRow-${index}`)
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
                  ...(hoverStates.addDiscardRow
                    ? styles.addRowButtonHover
                    : {}),
                }}
                onClick={addNewDiscardRow}
                onMouseEnter={() => handleMouseEnter("addDiscardRow")}
                onMouseLeave={() => handleMouseLeave("addDiscardRow")}
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
                  Discard Summary:
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  {discardItems.filter((item) => item.found).length} of{" "}
                  {discardItems.length} items ready to discard
                </p>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={{
                  ...styles.saveButton,
                  ...(hoverStates.discardProceed ? styles.saveButtonHover : {}),
                }}
                onClick={handleDiscardProceed}
                onMouseEnter={() => handleMouseEnter("discardProceed")}
                onMouseLeave={() => handleMouseLeave("discardProceed")}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCARD MODAL - STEP 2: Details Form */}
      {showDiscardDetailsModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowDiscardDetailsModal(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Red Blood Cell</h3>
                <p style={styles.modalSubtitle}>Discard Stock - Details</p>
              </div>
              <button
                style={{
                  ...styles.modalCloseButton,
                  ...(hoverStates.closeDiscardDetailsModal
                    ? styles.modalCloseButtonHover
                    : {}),
                }}
                onClick={() => setShowDiscardDetailsModal(false)}
                onMouseEnter={() =>
                  handleMouseEnter("closeDiscardDetailsModal")
                }
                onMouseLeave={() =>
                  handleMouseLeave("closeDiscardDetailsModal")
                }
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Items Summary */}
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
                  Items to Discard (
                  {discardItems.filter((item) => item.found).length})
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
                {discardItems
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
                    borderTop: "1px solid #ef4444",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#991b1b",
                  }}
                >
                  Total Volume:{" "}
                  {discardItems
                    .filter((item) => item.found)
                    .reduce((sum, item) => sum + item.volume, 0)}{" "}
                  mL
                </div>
              </div>

              {/* Form Fields */}
              <div style={styles.filterContainer}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Responsible Personnel</label>
                  <input
                    type="text"
                    style={{
                      ...styles.fieldInput,
                      borderColor: discardValidationErrors.responsiblePersonnel ? '#ef4444' : '#d1d5db'
                    }}
                    value={discardFormData.responsiblePersonnel}
                    onChange={(e) =>
                      handleDiscardFormDataChange("responsiblePersonnel", e.target.value)
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Reason for Discarding</label>
                  <select
                    style={{
                      ...styles.fieldSelect,
                      borderColor: discardValidationErrors.reasonForDiscarding ? '#ef4444' : '#d1d5db'
                    }}
                    value={discardFormData.reasonForDiscarding}
                    onChange={(e) =>
                      handleDiscardFormDataChange("reasonForDiscarding", e.target.value)
                    }
                  >
                    <option value="">Select classification</option>
                    <option value="Expired">Expired</option>
                    <option value="Reactive">Reactive</option>
                    <option value="TTI (Transfusion Transmitted Infection)">
                      TTI (Transfusion Transmitted Infection)
                    </option>
                    <option value="Chylous">Chylous</option>
                    <option value="Under Volume">Under Volume</option>
                    <option value="Icteric">Icteric</option>
                    <option value="Greenish">Greenish</option>
                    <option value="Punctured/Open">Punctured/Open</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={styles.filterContainer}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Authorized by</label>
                  <input
                    type="text"
                    style={{
                      ...styles.fieldInput,
                      borderColor: discardValidationErrors.authorizedBy ? '#ef4444' : '#d1d5db'
                    }}
                    value={discardFormData.authorizedBy}
                    onChange={(e) =>
                      handleDiscardFormDataChange("authorizedBy", e.target.value)
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date of Discard</label>
                  <input
                    type="date"
                    style={{
                      ...styles.fieldInput,
                      borderColor: discardValidationErrors.dateOfDiscard ? '#ef4444' : '#d1d5db'
                    }}
                    value={discardFormData.dateOfDiscard}
                    onChange={(e) =>
                      handleDiscardFormDataChange("dateOfDiscard", e.target.value)
                    }
                  />
                </div>
              </div>

              <div style={styles.filterContainer}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Time of Discard</label>
                  <input
                    type="time"
                    style={{
                      ...styles.fieldInput,
                      borderColor: discardValidationErrors.timeOfDiscard ? '#ef4444' : '#d1d5db'
                    }}
                    value={discardFormData.timeOfDiscard}
                    onChange={(e) =>
                      handleDiscardFormDataChange("timeOfDiscard", e.target.value)
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Method of Disposal</label>
                  <select
                    style={{
                      ...styles.fieldSelect,
                      borderColor: discardValidationErrors.methodOfDisposal ? '#ef4444' : '#d1d5db'
                    }}
                    value={discardFormData.methodOfDisposal}
                    onChange={(e) =>
                      handleDiscardFormDataChange("methodOfDisposal", e.target.value)
                    }
                  >
                    <option value="">Select classification</option>
                    <option value="Incineration">Incineration</option>
                    <option value="Autoclaving">Autoclaving</option>
                    <option value="Chemical Treatment">
                      Chemical Treatment
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Remarks/Additional Notes</label>
                <textarea
                  style={{
                    ...styles.fieldInput,
                    minHeight: "100px",
                    fontFamily: "Barlow",
                  }}
                  value={discardFormData.remarks}
                  onChange={(e) =>
                    setDiscardFormData({
                      ...discardFormData,
                      remarks: e.target.value,
                    })
                  }
                  placeholder="Enter any additional notes"
                />
              </div>
              {Object.keys(discardValidationErrors).length > 0 && (
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
                  {discardValidationErrors.api && (
                    <div style={{ marginBottom: '4px' }}>{discardValidationErrors.api}</div>
                  )}
                  {discardValidationErrors.save && (
                    <div style={{ marginBottom: '4px' }}>{discardValidationErrors.save}</div>
                  )}
                  {discardValidationErrors.items && (
                    <div style={{ marginBottom: '4px' }}>{discardValidationErrors.items}</div>
                  )}
                  {Object.entries(discardValidationErrors)
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
                  ...(hoverStates.confirmDiscard ? styles.saveButtonHover : {}),
                }}
                onClick={confirmDiscard}
                onMouseEnter={() => handleMouseEnter("confirmDiscard")}
                onMouseLeave={() => handleMouseLeave("confirmDiscard")}
              >
                Confirm Discard (
                {discardItems.filter((item) => item.found).length} items)
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
                <h3 style={styles.modalTitle}>Non-Conforming</h3>
                <p style={styles.modalSubtitle}>Add Non-Conforming Stock</p>
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
                <div style={styles.tableHeaderCell}>Category</div>
                <div style={styles.tableHeaderCell}>Source</div>
                <div style={styles.tableHeaderCell}>Action</div>
              </div>

              <div style={styles.rowsContainer}>
                {nonConformingItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.dataRow,
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr 1fr",
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
                          border: validationErrors[`${index}-serialId`]
                            ? "1px solid #ef4444"
                            : item.found
                              ? "1px solid #0ea5e9"
                              : item.serialId && !item.found
                                ? "1px solid #ef4444"
                                : "1px solid #d1d5db",
                        }}
                        value={item.serialId}
                        onChange={(e) =>
                          handleNonConformingItemChange(
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
                          fontSize: "10px",
                          fontWeight: "500",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.found ? item.category : "Not Found"}
                      </span>

                      <span
                        style={{
                          padding: "4px 8px",
                          backgroundColor: item.found ? "#dbeafe" : "#f9fafb",
                          color: item.found ? "#1e40af" : "#9ca3af",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "500",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.found ? item.source || "Walk-In" : "-"}
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
                        ...(hoverStates[`removeDiscardRow-${index}`]
                          ? { backgroundColor: "#dc2626" }
                          : {}),
                      }}
                      onClick={() => removeRow(index)}
                      disabled={nonConformingItems.length === 1}
                      onMouseEnter={() =>
                        handleMouseEnter(`removeRow-${index}`)
                      }
                      onMouseLeave={() =>
                        handleMouseLeave(`removeRow-${index}`)
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
                      {validationErrors.items && (
                        <div style={{ marginBottom: '4px' }}>{validationErrors.items}</div>
                      )}
                      {Object.entries(validationErrors)
                        .filter(([key]) => key.includes('-serialId'))
                        .map(([key, message]) => (
                          <div key={key} style={{ marginBottom: '4px' }}>
                            • {message}
                          </div>
                        ))
                      }
                      {!validationErrors.api && 
                      !validationErrors.save && 
                      !validationErrors.items &&
                      Object.keys(validationErrors).length > 0 &&
                      Object.keys(validationErrors).every(key => !validationErrors[key].includes('already exists')) && (
                        <div>Please ensure all items have valid serial IDs</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                  Summary:
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  {nonConformingItems.filter((item) => item.found).length} of{" "}
                  {nonConformingItems.length} items ready to add
                </p>
              </div>
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
                <h3 style={styles.modalTitle}>Non-Conforming</h3>
                <p style={styles.modalSubtitle}>Edit Non-Conforming Stock</p>
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr",
                  gap: "6px",
                  marginBottom: "15px",
                  padding: "0 5px",
                  alignItems: "center",
                }}
              >
                <div style={styles.tableHeaderCell}>Barcode Serial ID</div>
                <div style={styles.tableHeaderCell}>Blood Type</div>
                <div style={styles.tableHeaderCell}>Rh Factor</div>
                <div style={styles.tableHeaderCell}>Volume (mL)</div>
                <div style={styles.tableHeaderCell}>Date of Collection</div>
                <div style={styles.tableHeaderCell}>Expiration Date</div>
                <div style={styles.tableHeaderCell}>Category</div>
                <div style={styles.tableHeaderCell}>Source</div>
              </div>

              <div
                style={{
                  ...styles.dataRow,
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr",
                }}
              >
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
                  style={{
                    ...styles.fieldInput,
                    borderColor: editValidationErrors.collection ? '#ef4444' : '#d1d5db'
                  }}
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
                <input
                  type="text"
                  style={styles.fieldInputDisabled}
                  value={editingItem.category}
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
            </div>

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
    </div>
  );
};

export default RedBloodCellNC;
