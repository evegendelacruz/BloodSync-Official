import React, { useState, useEffect, useRef } from "react";
import { ArchiveRestore } from "lucide-react";

const ReleasedBlood = () => {
  const [bloodData, setBloodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmRestoreModal, setShowConfirmRestoreModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "releasedAt",
    direction: "desc",
  });
  const [filterConfig, setFilterConfig] = useState({ field: "", value: "" });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    loadReleasedBloodData();
  }, []);

  useEffect(() => {
    return () => {
      if (window.searchTimeouts) {
        Object.values(window.searchTimeouts).forEach((timeout) => {
          clearTimeout(timeout);
        });
        window.searchTimeouts = {};
      }
    };
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

  const loadReleasedBloodData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.electronAPI) {
        throw new Error(
          "Electron API not available. Make sure you are running this in an Electron environment and that preload.js is properly configured."
        );
      }

      const [rbcData, plasmaData, plateletData] = await Promise.all([
        window.electronAPI.getReleasedBloodStock(),
        window.electronAPI.getReleasedPlasmaStock(),
        window.electronAPI.getReleasedPlateletStock()
      ]);

      const combinedData = [...rbcData, ...plasmaData, ...plateletData].sort((a, b) => {
        const dateA = new Date(a.releasedAt);
        const dateB = new Date(b.releasedAt);
        return dateB - dateA;
      });
      
      setBloodData(combinedData);
    } catch (err) {
      console.error("Error loading released blood data:", err);
      setError(`Failed to load released blood data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const filteredData = bloodData.filter(item => 
    item.serial_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.rhFactor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const toggleRowSelection = (id) => {
    setBloodData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = displayData.every(item => item.selected);
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
    setBloodData(prevData => 
      prevData.map(item => ({ ...item, selected: false }))
    );
  };

  const selectedCount = displayData.filter(item => item.selected).length;
  const singleSelected = selectedCount === 1;

  const getCategoryBadgeStyle = (category) => {
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      fontSize: "12px",
      fontWeight: "500",
      borderRadius: "9999px",
    };

    switch (category) {
      case 'Red Blood Cell':
        return {
          ...baseStyle,
          backgroundColor: "#fef2f2",
          color: "#991b1b",
        };
      case 'Plasma':
        return {
          ...baseStyle,
          backgroundColor: "#eff6ff",
          color: "#1e40af",
        };
      case 'Platelet':
        return {
          ...baseStyle,
          backgroundColor: "#f0fdf4",
          color: "#065f46",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: "#f3f4f6",
          color: "#374151",
        };
    }
  };

  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'Red Blood Cell':
        return 'RBC';
      case 'Plasma':
        return 'Plasma';
      case 'Platelet':
        return 'Platelet';
      default:
        return category;
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

  const calculateExpiration = (collectionDate) => {
    if (!collectionDate) return "";
    const collection = new Date(collectionDate);
    const expiration = new Date(collection);
    expiration.setDate(collection.getDate() + 35);
    return expiration.toISOString().split("T")[0];
  };

  const handleEditItemChange = (field, value) => {
    const updated = { ...editingItem, [field]: value };
    if (field === "collection") {
      updated.expiration = calculateExpiration(value);
    }
    setEditingItem(updated);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      if (!editingItem.serial_id || !editingItem.collection) {
        setError("Please fill in all required fields");
        return;
      }

      const stockData = {
        serial_id: editingItem.serial_id,
        type: editingItem.type,
        rhFactor: editingItem.rhFactor,
        volume: editingItem.volume,
        source: editingItem.source || 'Walk-In',
        collection: editingItem.collection,
        expiration: editingItem.expiration,
        status: editingItem.status,
      };

      // Update released blood directly without restoring
      // Use the correct API function names based on your backend
      if (editingItem.category === 'Red Blood Cell') {
        await window.electronAPI.updateReleasedBloodStock(editingItem.id, stockData);
      } else if (editingItem.category === 'Plasma') {
        await window.electronAPI.updateReleasedPlasmaStock(editingItem.id, stockData);
      } else if (editingItem.category === 'Platelet') {
        await window.electronAPI.updateReleasedPlateletStock(editingItem.id, stockData);
      }

      setShowEditModal(false);
      setEditingItem(null);
      await loadReleasedBloodData();
      clearAllSelection();
      setError(null);

      setSuccessMessage({
        title: "Updated Successfully!",
        description: "Released blood record has been updated.",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error updating released blood stock:", err);
      setError(`Failed to update released blood stock: ${err.message}`);
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

      const selectedIds = bloodData
        .filter((item) => item.selected)
        .map((item) => ({ id: item.id, category: item.category }));
      
      if (selectedIds.length === 0) return;

      // Group by category
      const itemsByCategory = {
        'Red Blood Cell': [],
        'Plasma': [],
        'Platelet': []
      };

      selectedIds.forEach(item => {
        if (itemsByCategory[item.category]) {
          itemsByCategory[item.category].push(item.id);
        }
      });

      // Delete from each category
      if (itemsByCategory['Red Blood Cell'].length > 0) {
        await window.electronAPI.deleteReleasedBloodStock(itemsByCategory['Red Blood Cell']);
      }
      if (itemsByCategory['Plasma'].length > 0) {
        await window.electronAPI.deleteReleasedPlasmaStock(itemsByCategory['Plasma']);
      }
      if (itemsByCategory['Platelet'].length > 0) {
        await window.electronAPI.deleteReleasedPlateletStock(itemsByCategory['Platelet']);
      }

      setShowConfirmDeleteModal(false);
      await loadReleasedBloodData();
      clearAllSelection();
      setError(null);

      setSuccessMessage({
        title: "Deleted Successfully!",
        description: `${selectedIds.length} released blood record(s) have been deleted.`,
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error deleting items:", err);
      setError("Failed to delete items");
    }
  };

  const handleRestoreStock = () => {
    setShowRestoreModal(true);
    setSelectedItems([
      {
        serialId: "",
        bloodType: "O",
        rhFactor: "+",
        volume: 100,
        source: "Walk-In",
        collection: "",
        expiration: "",
        status: "Released",
        category: "Red Blood Cell",
        found: false,
      },
    ]);
  };

  const handleRestoreItemChange = async (index, field, value) => {
    if (field === "serialId") {
      setSelectedItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value, found: false } : item
        )
      );

      if (window.searchTimeouts && window.searchTimeouts[index]) {
        clearTimeout(window.searchTimeouts[index]);
      }

      if (!window.searchTimeouts) {
        window.searchTimeouts = {};
      }

      if (!value || value.trim() === "") {
        setError(null);
        return;
      }

      window.searchTimeouts[index] = setTimeout(async () => {
        try {
          if (!window.electronAPI) {
            setError("Electron API not available");
            return;
          }

          const [rbcData, plasmaData, plateletData] = await Promise.all([
            window.electronAPI.getReleasedBloodStock(),
            window.electronAPI.getReleasedPlasmaStock(),
            window.electronAPI.getReleasedPlateletStock()
          ]);

          const allReleasedData = [...rbcData, ...plasmaData, ...plateletData];
          
          let stockData = allReleasedData.find(item => 
            item.serial_id === value.trim()
          );

          if (!stockData) {
            const partialMatches = allReleasedData.filter(item =>
              item.serial_id.toLowerCase().includes(value.trim().toLowerCase())
            );
            if (partialMatches.length > 0) {
              stockData = partialMatches[0];
            }
          }

          if (stockData) {
            setSelectedItems((prev) =>
              prev.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      serialId: value.trim(),
                      bloodType: stockData.type,
                      rhFactor: stockData.rhFactor,
                      volume: stockData.volume,
                      source: stockData.source || 'Walk-In',
                      collection: stockData.collection,
                      expiration: stockData.expiration,
                      status: stockData.status,
                      category: stockData.category,
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
                      source: "Walk-In",
                      collection: "",
                      expiration: "",
                      status: "Released",
                      category: "Red Blood Cell",
                      found: false,
                    }
                  : item
              )
            );
            setError(`No released blood stock found with serial ID: ${value.trim()}`);
          }
        } catch (err) {
          console.error("Error fetching released blood stock by serial ID:", err);
          setError("Failed to fetch released blood stock data");
          setSelectedItems((prev) =>
            prev.map((item, i) =>
              i === index ? { ...item, found: false } : item
            )
          );
        }
      }, 300);
    }
  };

  const addRestoreItem = () => {
    setSelectedItems((prev) => [
      ...prev,
      {
        serialId: "",
        bloodType: "O",
        rhFactor: "+",
        volume: 100,
        source: "Walk-In",
        collection: "",
        expiration: "",
        status: "Released",
        category: "Red Blood Cell",
        found: false,
      },
    ]);
  };

  const removeRestoreItem = (index) => {
    if (selectedItems.length > 1) {
      setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const proceedToConfirmRestore = () => {
    const validItems = selectedItems.filter(
      (item) => item.found && item.serialId
    );

    if (validItems.length === 0) {
      setError("No valid items to restore");
      return;
    }

    setShowRestoreModal(false);
    setShowConfirmRestoreModal(true);
  };

  const confirmRestore = async () => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }
  
      const validItems = selectedItems.filter(
        (item) => item.found && item.serialId
      );
  
      if (validItems.length === 0) {
        setError("No valid items to restore");
        return;
      }
  
      const itemsByCategory = {
        'Red Blood Cell': [],
        'Plasma': [],
        'Platelet': []
      };
  
      validItems.forEach(item => {
        if (itemsByCategory[item.category]) {
          itemsByCategory[item.category].push(item.serialId);
        }
      });
  
      let totalRestored = 0;
      const results = [];
  
      if (itemsByCategory['Red Blood Cell'].length > 0) {
        try {
          const result = await window.electronAPI.restoreBloodStock(itemsByCategory['Red Blood Cell']);
          totalRestored += result.restoredCount;
          results.push(`RBC: ${result.restoredCount}`);
        } catch (err) {
          console.error("Error restoring RBC:", err);
          setError(`Failed to restore Red Blood Cell items: ${err.message}`);
        }
      }
  
      if (itemsByCategory['Plasma'].length > 0) {
        try {
          const result = await window.electronAPI.restorePlasmaStock(itemsByCategory['Plasma']);
          totalRestored += result.restoredCount;
          results.push(`Plasma: ${result.restoredCount}`);
        } catch (err) {
          console.error("Error restoring Plasma:", err);
          setError(`Failed to restore Plasma items: ${err.message}`);
        }
      }
  
      if (itemsByCategory['Platelet'].length > 0) {
        try {
          const result = await window.electronAPI.restorePlateletStock(itemsByCategory['Platelet']);
          totalRestored += result.restoredCount;
          results.push(`Platelet: ${result.restoredCount}`);
        } catch (err) {
          console.error("Error restoring Platelet:", err);
          setError(`Failed to restore Platelet items: ${err.message}`);
        }
      }
  
      setShowConfirmRestoreModal(false);
      setSelectedItems([
        {
          serialId: "",
          bloodType: "O",
          rhFactor: "+",
          volume: 100,
          source: "Walk-In",
          collection: "",
          expiration: "",
          status: "Released",
          category: "Red Blood Cell",
          found: false,
        },
      ]);
  
      await loadReleasedBloodData();
      
      if (totalRestored > 0) {
        setError(null);
        setSuccessMessage({
          title: "Stock Restored Successfully!",
          description: `${totalRestored} blood stock item(s) have been restored to inventory. ${results.join(', ')}`,
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Error restoring blood stock:", err);
      setError(`Failed to restore blood stock: ${err.message}`);
    }
  };

  const getSortLabel = () => {
    const labels = {
      serial_id: "Serial ID",
      type: "Blood Type",
      rhFactor: "RH Factor",
      volume: "Volume",
      status: "Status",
      category: "Category",
      releasedAt: "Sort by",
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
    header: {
      margin: 0,
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "1px",
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginTop: "-7px",
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
    },
    leftControls: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    searchContainer: {
      position: "relative",
    },
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
      width: "256px",
      fontSize: "14px",
      outline: "none",
      fontFamily: "Barlow",
    },
    rightControls: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
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
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    thead: {
      backgroundColor: "#f9fafb",
      borderBottom: "1px solid #e5e7eb",
    },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "11px",
      fontWeight: "500",
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    tbody: {
      backgroundColor: "white",
    },
    td: {
      padding: "12px 16px",
      fontSize: "12px",
      color: "#111827",
      fontFamily: 'Arial',
      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      fontSize: "12px",
      fontWeight: "500",
      backgroundColor: "#dcfdf4",
      color: "#065f46",
      borderRadius: "9999px",
    },
  
    checkbox: {
      width: "16px",
      height: "16px",
      cursor: "pointer",
    },
    trEven: {
      backgroundColor: "#f9fafb",
    },
    trSelected: {
      backgroundColor: "#e6f7ff",
    },
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
      color: 'white',
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
      borderRadius: "8px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
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
    restoreModal: {
      backgroundColor: "white",
      borderRadius: "8px",
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
    modalTitleSection: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
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
    },
    modalContent: {
      flex: 1,
      padding: "30px",
      overflowY: "auto",
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
    barcodeText: {
      color: "#dc2626",
      fontSize: "12px",
      fontStyle: "italic",
      marginBottom: "10px",
      fontFamily: "Barlow",
    },
    tableHeaderCell: {
      fontSize: "12px",
      fontWeight: "500",
      color: "#374151",
      fontFamily: "Barlow",
      textAlign: "left",
    },
    rowsContainer: {
      marginBottom: "20px",
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
    },
    modalFooter: {
      padding: "20px 30px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "center",
      backgroundColor: "white",
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
    },
    dropdownContainer: {
      position: "relative",
    },
    tableHeader: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr",
      gap: "15px",
      marginBottom: "15px",
      padding: "0 5px",
    },
    dataRow: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr",
      gap: "15px",
      marginBottom: "15px",
      alignItems: "center",
    },
  };

  const allSelected = displayData.length > 0 && displayData.every(item => item.selected);
  const someSelected = displayData.some(item => item.selected) && !allSelected;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading released blood data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Released Blood</h2>
        <p style={styles.subtitle}>Blood Stock</p>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            />
          </svg>
          <span>{error}</span>
          <button style={styles.refreshButton} onClick={loadReleasedBloodData}>
            Retry
          </button>
        </div>
      )}

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
              placeholder="Search by serial ID, blood type, category, or status"
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
                ...(showSortDropdown ? styles.buttonActive : {}),
              }}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
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
                  { key: "category", label: "Category" },
                  { key: "releasedAt", label: "Sort by" },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      ...styles.dropdownItem,
                      ...(sortConfig.key === item.key
                        ? styles.dropdownItemActive
                        : {}),
                    }}
                    onClick={() => handleSort(item.key)}
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
                ...(showFilterDropdown ? styles.buttonActive : {}),
              }}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
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
                      <option value="category">Category</option>
                      <option value="volume">Volume</option>
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

          <button style={styles.releaseButton} onClick={handleRestoreStock}>
            <ArchiveRestore size={16} style={{ marginRight: "4px" }} />
            Restore
          </button>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={{...styles.th, width: "3%"}}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={allSelected}
                  ref={input => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={toggleAllSelection}
                />
              </th>
              <th style={{...styles.th, width: "11%"}}>SERIAL ID</th>
              <th style={{...styles.th, width: "8%"}}>CATEGORY</th>
              <th style={{...styles.th, width: "7%"}}>BLOOD TYPE</th>
              <th style={{...styles.th, width: "6%"}}>RH FACTOR</th>
              <th style={{...styles.th, width: "7%"}}>VOLUME (ML)</th>
              <th style={{...styles.th, width: "7%"}}>SOURCE</th>
              <th style={{...styles.th, width: "10%"}}>DATE OF COLLECTION</th>
              <th style={{...styles.th, width: "10%"}}>EXPIRATION DATE</th>
              <th style={{...styles.th, width: "7%"}}>STATUS</th>
              <th style={{...styles.th, width: "10%"}}>RELEASED AT</th>
              <th style={{...styles.th, width: "10%"}}>MODIFIED AT</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan="11"
                  style={{ ...styles.td, textAlign: "center", padding: "40px" }}
                >
                  {searchTerm || filterConfig.value ? "No released blood records found matching your criteria" : "No released blood records found"}
                </td>
              </tr>
            ) : (
              displayData.map((item, index) => (
                <tr 
                  key={item.id} 
                  style={{
                    ...(index % 2 === 1 ? styles.trEven : {}),
                    ...(item.selected ? styles.trSelected : {})
                  }}
                >
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={item.selected}
                      onChange={() => toggleRowSelection(item.id)}
                    />
                  </td>
                  <td style={styles.td}>{item.serial_id}</td>
                  <td style={styles.td}>
                    <span style={getCategoryBadgeStyle(item.category)}>
                      {getCategoryDisplayName(item.category)}
                    </span>
                  </td>
                  <td style={styles.td}>{item.type}</td>
                  <td style={styles.td}>{item.rhFactor}</td>
                  <td style={styles.td}>{item.volume}</td>
                  <td style={styles.td}>{item.source || 'Walk-In'}</td>
                  <td style={styles.td}>{item.collection}</td>
                  <td style={styles.td}>{item.expiration}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>{item.status}</span>
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
          <button style={styles.closeButton} onClick={clearAllSelection}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div style={styles.counterSection}>
            <span style={styles.counterText}>
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>
          
          {singleSelected && (
            <button style={styles.editButton} onClick={handleEditClick}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          )}
          
          <button style={styles.deleteButton} onClick={handleDeleteClick}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              style={styles.successCloseButton}
              onClick={() => setShowSuccessModal(false)}
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
              style={styles.successOkButton}
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowEditModal(false)}
        >
          <div style={styles.restoreModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Edit Released Blood</h3>
                <p style={styles.modalSubtitle}>Update released blood record</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowEditModal(false)}
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
                <div style={styles.tableHeaderCell}>Source</div>
                <div style={styles.tableHeaderCell}>Date of Collection</div>
                <div style={styles.tableHeaderCell}>Expiration Date</div>
              </div>

              <div style={styles.dataRow}>
                <input
                  type="text"
                  style={styles.fieldInput}
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
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.saveButton}
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Stock Modal */}
      {showRestoreModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowRestoreModal(false)}
        >
          <div style={styles.restoreModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Restore Blood Stock</h3>
                <p style={styles.modalSubtitle}>Return released items to blood stock</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowRestoreModal(false)}
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
                <div style={styles.tableHeaderCell}>Category</div>
                <div style={styles.tableHeaderCell}>Blood Type</div>
                <div style={styles.tableHeaderCell}>RH Factor</div>
                <div style={styles.tableHeaderCell}>Volume</div>
                <div style={styles.tableHeaderCell}>Source</div>
                <div style={styles.tableHeaderCell}>Collection</div>
                <div style={styles.tableHeaderCell}>Status</div>
                <div style={styles.tableHeaderCell}>Action</div>
              </div>

              <div style={styles.rowsContainer}>
                {selectedItems.map((item, index) => (
                  <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr 1fr 1fr",
                    gap: "6px",
                    marginBottom: "15px",
                    alignItems: "center",
                    backgroundColor: item.found ? "#f0f9ff" : "#fef2f2",
                    padding: "8px 5px",
                    borderRadius: "4px",
                  }}
                >
                    <div style={{ position: "relative" }}>
                      <style>{`
                        .serial-input::placeholder {
                          font-size: 12px;
                        }
                      `}</style>
                      <input
                        type="text"
                        className="serial-input"
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
                          handleRestoreItemChange(
                            index,
                            "serialId",
                            e.target.value
                          )
                        }
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData
                            .getData("text")
                            .trim();
                          handleRestoreItemChange(
                            index,
                            "serialId",
                            pastedText
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (
                              window.searchTimeouts &&
                              window.searchTimeouts[index]
                            ) {
                              clearTimeout(window.searchTimeouts[index]);
                            }
                            setTimeout(() => {
                              const currentValue = e.target.value.trim();
                              if (currentValue) {
                                handleRestoreItemChange(
                                  index,
                                  "serialId",
                                  currentValue
                                );
                              }
                            }, 0);
                          }
                        }}
                        placeholder="Enter Serial ID"
                        autoComplete="off"
                        spellCheck="false"
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

                    <span
                      style={{
                        padding: "4px 8px",
                        ...getCategoryBadgeStyle(item.category),
                        fontSize: "11px",
                        textAlign: "center",
                      }}
                    >
                      {getCategoryDisplayName(item.category)}
                    </span>

                    <input
                      type="text"
                      style={{
                        ...styles.fieldInputDisabled,
                        backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                        color: item.found ? "#374151" : "#9ca3af",
                      }}
                      value={item.bloodType}
                      readOnly
                      disabled
                    />

                    <input
                      type="text"
                      style={{
                        ...styles.fieldInputDisabled,
                        backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                        color: item.found ? "#374151" : "#9ca3af",
                      }}
                      value={item.rhFactor}
                      readOnly
                      disabled
                    />

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
                        type="text"
                        style={{
                          ...styles.fieldInputDisabled,
                          backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                          color: item.found ? "#374151" : "#9ca3af",
                        }}
                        value={item.source || 'Walk-In'}
                        readOnly
                        disabled
                      />

                    <input
                      type="text"
                      style={{
                        ...styles.fieldInputDisabled,
                        backgroundColor: item.found ? "#f0f9ff" : "#f9fafb",
                        color: item.found ? "#374151" : "#9ca3af",
                      }}
                      value={item.collection}
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
                      }}
                      onClick={() => removeRestoreItem(index)}
                      disabled={selectedItems.length === 1}
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
              </div>

              <button
                type="button"
                style={styles.addRowButton}
                onClick={addRestoreItem}
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
                  Restore Summary:
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  {selectedItems.filter((item) => item.found).length} of{" "}
                  {selectedItems.length} items ready to restore
                </p>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.confirmButton}
                onClick={proceedToConfirmRestore}
              >
                Proceed (
                {selectedItems.filter((item) => item.found).length} items)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Restore Modal */}
      {showConfirmRestoreModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowConfirmRestoreModal(false)}
        >
          <div style={styles.restoreModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Confirm Restore</h3>
                <p style={styles.modalSubtitle}>Review items before restoring to blood stock</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowConfirmRestoreModal(false)}
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
                  Items to Restore (
                  {selectedItems.filter((item) => item.found).length})
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
                  <div>Category</div>
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
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
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
                      <div>
                        <span
                          style={{
                            padding: "2px 6px",
                            ...getCategoryBadgeStyle(item.category),
                            fontSize: "10px",
                          }}
                        >
                          {getCategoryDisplayName(item.category)}
                        </span>
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
                    .reduce((sum, item) => sum + item.volume, 0)}{" "}
                  mL
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fbbf24",
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
                  fill="#f59e0b"
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
                      color: "#92400e",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Confirm Restore Action
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#78350f",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    These items will be moved from Released Blood back to the active Blood Stock inventory. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.confirmButton}
                onClick={confirmRestore}
              >
                Confirm Restore (
                {selectedItems.filter((item) => item.found).length} items)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowConfirmDeleteModal(false)}
        >
          <div style={styles.restoreModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Confirm Delete</h3>
                <p style={styles.modalSubtitle}>Review items before deletion</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowConfirmDeleteModal(false)}
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
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                    gap: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  <div>Serial ID</div>
                  <div>Category</div>
                  <div>Blood Type</div>
                  <div>RH Factor</div>
                  <div>Volume (mL)</div>
                </div>
                {bloodData
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
                      <div>
                        <span
                          style={{
                            padding: "2px 6px",
                            ...getCategoryBadgeStyle(item.category),
                            fontSize: "10px",
                          }}
                        >
                          {getCategoryDisplayName(item.category)}
                        </span>
                      </div>
                      <div>{item.type}</div>
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
                  {bloodData
                    .filter((item) => item.selected)
                    .reduce((sum, item) => sum + item.volume, 0)}{" "}
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
                    These items will be permanently deleted from the Released Blood records. This action cannot be undone.
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
                }}
                onClick={confirmDelete}
              >
                Confirm Delete (
                {bloodData.filter((item) => item.selected).length} items)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleasedBlood;