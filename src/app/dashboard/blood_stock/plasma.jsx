import React, { useState, useEffect } from "react";

const Plasma = () => {
  const [plasmaData, setPlasmaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showReleaseDetailsModal, setShowReleaseDetailsModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([
    {
      serialId: "",
      bloodType: "O",
      rhFactor: "+",
      volume: 100,
      collection: "",
      expiration: "",
      status: "Stored",
    },
  ]);
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

  // Load data from database on component mount
  useEffect(() => {
    // Debug logging
    console.log("Plasma component mounted");
    console.log("window.electronAPI:", window.electronAPI);
    console.log("typeof window.electronAPI:", typeof window.electronAPI);

    if (window.electronAPI) {
      console.log("electronAPI methods:", Object.keys(window.electronAPI));
      // Test the API
      try {
        const testResult = window.electronAPI.test();
        console.log("API test result:", testResult);
      } catch (err) {
        console.error("API test failed:", err);
      }
    }

    loadPlasmaData();
  }, []);

  const loadPlasmaData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if electronAPI is available
      if (!window.electronAPI) {
        throw new Error(
          "Electron API not available. Make sure you are running this in an Electron environment and that preload.js is properly configured."
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

  // Handle search
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      if (value.trim() === "") {
        // If search is empty, reload all data
        await loadPlasmaData();
      } else {
        // Search with the term
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

  // Toggle selection for all rows
  const toggleAllSelection = () => {
    const allSelected = plasmaData.every((item) => item.selected);
    setPlasmaData((prevData) =>
      prevData.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  // Clear all selections
  const clearAllSelection = () => {
    setPlasmaData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  // Calculate expiration date (365 days from collection for plasma)
  const calculateExpiration = (collectionDate) => {
    if (!collectionDate) return "";
    const collection = new Date(collectionDate);
    const expiration = new Date(collection);
    expiration.setDate(collection.getDate() + 365); // Plasma lasts 1 year
    return expiration.toISOString().split("T")[0];
  };

  // Handle stock item changes
  const handleStockItemChange = (id, field, value) => {
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Auto-calculate expiration when collection date changes
          if (field === "collection") {
            updated.expiration = calculateExpiration(value);
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Add new row
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
      },
    ]);
  };

  // Remove row
  const removeRow = (id) => {
    if (stockItems.length > 1) {
      setStockItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Handle save all stock items
  const handleSaveAllStock = async (e) => {
    e.preventDefault();
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      // Validate all items
      for (const item of stockItems) {
        if (!item.serial_id || !item.collection) {
          setError("Please fill in all required fields for all items");
          return;
        }
      }

      // Save all items
      for (const item of stockItems) {
        const stockData = {
          serial_id: item.serial_id,
          type: item.type,
          rhFactor: item.rhFactor,
          volume: item.volume,
          collection: item.collection,
          expiration: item.expiration,
          status: item.status,
        };
        await window.electronAPI.addPlasmaStock(stockData);
      }

      setShowAddModal(false);
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
        },
      ]);
      await loadPlasmaData();
      setError(null);
    } catch (err) {
      console.error("Error adding plasma stock:", err);
      setError(`Failed to add plasma stock: ${err.message}`);
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
      setError(null);
    } catch (err) {
      console.error("Error deleting items:", err);
      setError("Failed to delete items");
    }
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
      },
    ]);
  };

  const handleReleaseItemChange = async (index, field, value) => {
    if (field === "serialId" && value.trim() !== "") {
      try {
        if (!window.electronAPI) {
          setError("Electron API not available");
          return;
        }

        const stockData =
          await window.electronAPI.getPlasmaStockBySerialId(value);

        if (stockData && !Array.isArray(stockData)) {
          // Single exact match found
          setSelectedItems((prev) =>
            prev.map((item, i) =>
              i === index
                ? {
                    ...item,
                    serialId: value,
                    bloodType: stockData.type,
                    rhFactor: stockData.rhFactor,
                    volume: stockData.volume,
                    collection: stockData.collection,
                    expiration: stockData.expiration,
                    status: stockData.status,
                    found: true,
                  }
                : item
            )
          );
          setError(null);
        } else if (Array.isArray(stockData) && stockData.length > 0) {
          // Multiple partial matches found, use first one
          const firstMatch = stockData[0];
          setSelectedItems((prev) =>
            prev.map((item, i) =>
              i === index
                ? {
                    ...item,
                    serialId: value,
                    bloodType: firstMatch.type,
                    rhFactor: firstMatch.rhFactor,
                    volume: firstMatch.volume,
                    collection: firstMatch.collection,
                    expiration: firstMatch.expiration,
                    status: firstMatch.status,
                    found: true,
                  }
                : item
            )
          );
          setError(null);
        } else {
          // No match found
          setSelectedItems((prev) =>
            prev.map((item, i) =>
              i === index
                ? {
                    ...item,
                    serialId: value,
                    bloodType: "O",
                    rhFactor: "+",
                    volume: 100,
                    collection: "",
                    expiration: "",
                    status: "Stored",
                    found: false,
                  }
                : item
            )
          );
          setError(`No blood stock found with serial ID: ${value}`);
        }
      } catch (err) {
        console.error("Error fetching blood stock by serial ID:", err);
        setError("Failed to fetch blood stock data");
        setSelectedItems((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, [field]: value, found: false } : item
          )
        );
      }
    } else {
      setSelectedItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    }
  };

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
    // Filter only items that have valid serial IDs and were found in database
    const validItems = selectedItems.filter(
      (item) => item.serialId && item.found
    );

    if (validItems.length === 0) {
      setError("Please select at least one valid item with a found serial ID");
      return;
    }

    // Update selectedItems to only include valid items
    setSelectedItems(validItems);
    setShowReleaseModal(false);
    setShowReleaseDetailsModal(true);
  };

  const handleReleaseDataChange = (field, value) => {
    setReleaseData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Replace the confirmRelease function in Plasma.jsx with this fixed version:

const confirmRelease = async () => {
  try {
    if (!window.electronAPI) {
      setError("Electron API not available");
      return;
    }

    // Get only the valid items that were found in the database
    const validItems = selectedItems.filter(
      (item) => item.found && item.serialId
    );

    if (validItems.length === 0) {
      setError("No valid items to release");
      return;
    }

    const serialIds = validItems.map((item) => item.serialId);
    const releasePayload = {
      ...releaseData,
      serialIds: serialIds,
    };

    console.log("Releasing multiple plasma items:", releasePayload);

    // FIXED: Call the correct method for plasma release
    const result = await window.electronAPI.releasePlasmaStock(releasePayload);

    if (result.success) {
      setShowReleaseDetailsModal(false);
      setShowReleaseModal(false);

      // Reset selected items to initial state
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

      // Reload the plasma data to reflect the released items are removed from stock
      await loadPlasmaData();
      setError(null);

      // Show success message with count
      alert(
        `Successfully released ${result.releasedCount} plasma stock item(s).`
      );
    }
  } catch (err) {
    console.error("Error releasing plasma stock:", err);
    setError(`Failed to release plasma stock: ${err.message}`);
  }
};

  const selectedCount = plasmaData.filter((item) => item.selected).length;

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
    },
    buttonHover: {
      backgroundColor: "#f9fafb",
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
    tr: {
      borderBottom: "1px solid #A3A3A3",
    },
    trEven: {
      backgroundColor: "#f9fafb",
    },
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
    pagination: {
      backgroundColor: "white",
      padding: "12px 16px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    paginationButton: {
      fontSize: "14px",
      color: "#6b7280",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
    },
    paginationButtonNext: {
      fontSize: "14px",
      color: "#2563eb",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
    },
    paginationText: {
      fontSize: "14px",
      color: "#374151",
    },
    checkbox: {
      width: "16px",
      height: "16px",
      cursor: "pointer",
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
      fontFamily: "Barlow",
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
    releaseModal: {
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
    releaseDetailsModal: {
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
    tableHeader: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr",
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
    rowsContainer: {
      marginBottom: "20px",
    },
    dataRow: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1.5fr",
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
      fontSize: "14px",
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
    proceedButton: {
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
    releaseFormGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "20px",
      marginBottom: "20px",
    },
    releaseFormGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "5px",
    },
    releaseFormLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      fontFamily: "Barlow",
    },
    releaseFormInput: {
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      fontFamily: "Barlow",
      outline: "none",
      backgroundColor: "white",
    },
    releaseFormSelect: {
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      fontFamily: "Barlow",
      outline: "none",
      backgroundColor: "white",
      cursor: "pointer",
    },
  };

  // Check if all rows are selected
  const allSelected =
    plasmaData.length > 0 && plasmaData.every((item) => item.selected);
  // Check if some rows are selected (for indeterminate state)
  const someSelected = plasmaData.some((item) => item.selected) && !allSelected;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading plasma stock data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Plasma</h2>
        <p style={styles.subtitle}>Blood Stock</p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorContainer}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            />
          </svg>
          <span>{error}</span>
          <button style={styles.refreshButton} onClick={loadPlasmaData}>
            Retry
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.leftControls}>
          {/* Search */}
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
          {/* Sort By */}
          <button style={styles.button}>
            <span>Sort by</span>
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
                d="m19 9-7 7-7-7"
              />
            </svg>
          </button>

          {/* Filter */}
          <button style={styles.button}>
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
          </button>

          {/* Release Stock */}
          <button style={styles.releaseButton} onClick={handleReleaseStock}>
            Release Stock
          </button>

          {/* Add Stock */}
          <button
            style={styles.addButton}
            onClick={() => setShowAddModal(true)}
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

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: "4%" }}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={toggleAllSelection}
                />
              </th>
              <th style={{ ...styles.th, width: "14%" }}>SERIAL ID</th>
              <th style={{ ...styles.th, width: "8%" }}>BLOOD TYPE</th>
              <th style={{ ...styles.th, width: "7%" }}>RH FACTOR</th>
              <th style={{ ...styles.th, width: "8%" }}>VOLUME (ML)</th>
              <th style={{ ...styles.th, width: "12%" }}>DATE OF COLLECTION</th>
              <th style={{ ...styles.th, width: "12%" }}>EXPIRATION DATE</th>
              <th style={{ ...styles.th, width: "8%" }}>STATUS</th>
              <th style={{ ...styles.th, width: "13%" }}>CREATED AT</th>
              <th style={{ ...styles.th, width: "13%" }}>MODIFIED AT</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {plasmaData.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  style={{ ...styles.td, textAlign: "center", padding: "40px" }}
                >
                  No plasma stock records found
                </td>
              </tr>
            ) : (
              plasmaData.map((item, index) => (
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
                      checked={item.selected}
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
                  <td style={styles.td}>{item.created}</td>
                  <td style={styles.td}>{item.modified}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={styles.pagination}>
          <button style={styles.paginationButton}>Previous</button>
          <span style={styles.paginationText}>
            Page 1 of {Math.ceil(plasmaData.length / 20)}
          </span>
          <button style={styles.paginationButtonNext}>Next</button>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedCount > 0 && (
        <div style={styles.actionBar}>
          <button style={styles.closeButton} onClick={clearAllSelection}>
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

          <button style={styles.editButton}>
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

          <button style={styles.deleteButton} onClick={handleDelete}>
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

      {/* Add Stock Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Plasma</h3>
                <p style={styles.modalSubtitle}>Add New Stock</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={styles.modalContent}>
              {/* Barcode Scanner Section */}
              <div style={styles.barcodeSection}>
                <img
                  src="/src/assets/scanner.gif"
                  alt="Barcode Scanner"
                  style={styles.barcodeIcon}
                />
              </div>

              {/* Table Header */}
              <p style={styles.barcodeText}>(if scanner is unavailable)</p>
              <div style={styles.tableHeader}>
                <div style={styles.tableHeaderCell}>Barcode Serial ID</div>
                <div style={styles.tableHeaderCell}>Blood Type</div>
                <div style={styles.tableHeaderCell}>Rh Factor</div>
                <div style={styles.tableHeaderCell}>Volume (mL)</div>
                <div style={styles.tableHeaderCell}>Date of Collection</div>
                <div style={styles.tableHeaderCell}>Expiration Date</div>
              </div>

              {/* Stock Items Rows */}
              <div style={styles.rowsContainer}>
                {stockItems.map((item) => (
                  <div key={item.id} style={styles.dataRow}>
                    <input
                      type="text"
                      style={styles.fieldInput}
                      value={item.serial_id}
                      onChange={(e) =>
                        handleStockItemChange(
                          item.id,
                          "serial_id",
                          e.target.value
                        )
                      }
                      placeholder=""
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
                      style={styles.fieldInput}
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
                  </div>
                ))}
              </div>

              {/* Add New Row Button */}
              <button
                type="button"
                style={styles.addRowButton}
                onClick={addNewRow}
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

            {/* Modal Footer */}
            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.saveButton}
                onClick={handleSaveAllStock}
              >
                Save
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
          <div style={styles.releaseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Plasma</h3>
                <p style={styles.modalSubtitle}>Release Stock</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowReleaseModal(false)}
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
                    {/* Serial ID Input with Search */}
                    <div style={{ position: "relative" }}>
                    <>
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
                        handleReleaseItemChange(index, "serialId", e.target.value)
                      }
                      placeholder="Enter Serial ID"
                    />
                  </>
                      {/* Status Indicator */}
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

                    {/* Blood Type */}
                    <>
                    <style>{`
                      .no-arrow {
                        /* remove the default dropdown/chevron icon */
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        appearance: none;
                        background: none;      /* no background image */
                        background-color: transparent; /* keep your own color if you want */
                      }
                    `}</style>

                    <select
                      className="no-arrow"
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
                      className="no-arrow"
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
                  </>

                    {/* Volume */}
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

                    {/* Collection Date */}
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

                    {/* Expiration Date */}
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

                    {/* Status Badge */}
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

                    {/* Remove Button */}
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
                      onClick={() => removeReleaseItem(index)}
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
                onClick={addReleaseItem}
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

              {/* Summary */}
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
                style={styles.saveButton}
                onClick={proceedToReleaseDetails}
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
          <div
            style={styles.releaseDetailsModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleSection}>
                <h3 style={styles.modalTitle}>Plasma</h3>
                <p style={styles.modalSubtitle}>Release Stock</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowReleaseDetailsModal(false)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Items Summary */}
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
                    .reduce((sum, item) => sum + item.volume, 0)}{" "}
                  mL
                </div>
              </div>

              {/* Release Form */}
              <div style={styles.releaseFormGrid}>
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>
                    Receiving Facility
                  </label>
                  <input
                    type="text"
                    style={styles.releaseFormInput}
                    value={releaseData.receivingFacility}
                    onChange={(e) =>
                      handleReleaseDataChange(
                        "receivingFacility",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>Classification</label>
                  <select
                    style={styles.releaseFormSelect}
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
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>
                    Authorized Recipient
                  </label>
                  <input
                    type="text"
                    style={styles.releaseFormInput}
                    value={releaseData.authorizedRecipient}
                    onChange={(e) =>
                      handleReleaseDataChange(
                        "authorizedRecipient",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div style={styles.releaseFormGrid}>
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>Address</label>
                  <input
                    type="text"
                    style={styles.releaseFormInput}
                    value={releaseData.address}
                    onChange={(e) =>
                      handleReleaseDataChange("address", e.target.value)
                    }
                  />
                </div>
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>Contact Number</label>
                  <input
                    type="tel"
                    style={styles.releaseFormInput}
                    value={releaseData.contactNumber}
                    onChange={(e) =>
                      handleReleaseDataChange("contactNumber", e.target.value)
                    }
                    placeholder="+ 63"
                  />
                </div>
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>
                    Authorized Recipient Designation
                  </label>
                  <input
                    type="text"
                    style={styles.releaseFormInput}
                    value={releaseData.recipientDesignation}
                    onChange={(e) =>
                      handleReleaseDataChange(
                        "recipientDesignation",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div style={styles.releaseFormGrid}>
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>Date of Release</label>
                  <input
                    type="date"
                    style={styles.releaseFormInput}
                    value={releaseData.dateOfRelease}
                    onChange={(e) =>
                      handleReleaseDataChange("dateOfRelease", e.target.value)
                    }
                  />
                </div>
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>
                    Condition Upon Release
                  </label>
                  <select
                    style={styles.releaseFormSelect}
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
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>
                    Request Reference Number
                  </label>
                  <input
                    type="text"
                    style={styles.releaseFormInput}
                    value={releaseData.requestReference}
                    onChange={(e) =>
                      handleReleaseDataChange(
                        "requestReference",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div style={styles.releaseFormGrid}>
                <div style={styles.releaseFormGroup}>
                  <label style={styles.releaseFormLabel}>Released by</label>
                  <input
                    type="text"
                    style={styles.releaseFormInput}
                    value={releaseData.releasedBy}
                    onChange={(e) =>
                      handleReleaseDataChange("releasedBy", e.target.value)
                    }
                  />
                </div>
                <div style={styles.releaseFormGroup}></div>
                <div style={styles.releaseFormGroup}></div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.confirmButton}
                onClick={confirmRelease}
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