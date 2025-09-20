import React, { useState, useEffect } from "react";

const RedBloodCell = () => {
  const [bloodData, setBloodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBloodStock, setNewBloodStock] = useState({
    serial_id: '',
    type: 'O',
    rhFactor: '+',
    volume: 100,
    collection: '',
    expiration: '',
    status: 'Stored'
  });

  // Load data from database on component mount
  useEffect(() => {
    // Debug logging
    console.log('Component mounted');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('typeof window.electronAPI:', typeof window.electronAPI);
    
    if (window.electronAPI) {
      console.log('electronAPI methods:', Object.keys(window.electronAPI));
      // Test the API
      try {
        const testResult = window.electronAPI.test();
        console.log('API test result:', testResult);
      } catch (err) {
        console.error('API test failed:', err);
      }
    }
    
    loadBloodData();
  }, []);

  const loadBloodData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if electronAPI is available
      if (!window.electronAPI) {
        throw new Error('Electron API not available. Make sure you are running this in an Electron environment and that preload.js is properly configured.');
      }
      
      const data = await window.electronAPI.getAllBloodStock();
      setBloodData(data);
    } catch (err) {
      console.error('Error loading blood data:', err);
      setError(`Failed to load blood data: ${err.message}`);
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
        setError('Electron API not available');
        return;
      }
      
      if (value.trim() === '') {
        // If search is empty, reload all data
        await loadBloodData();
      } else {
        // Search with the term
        const searchResults = await window.electronAPI.searchBloodStock(value);
        setBloodData(searchResults);
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError('Search failed');
    }
  };

  const toggleRowSelection = (id) => {
    setBloodData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Toggle selection for all rows
  const toggleAllSelection = () => {
    const allSelected = bloodData.every(item => item.selected);
    setBloodData(prevData => 
      prevData.map(item => ({ ...item, selected: !allSelected }))
    );
  };

  // Clear all selections
  const clearAllSelection = () => {
    setBloodData(prevData => 
      prevData.map(item => ({ ...item, selected: false }))
    );
  };

  // Handle add new blood stock
  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      if (!window.electronAPI) {
        setError('Electron API not available');
        return;
      }

      // Validate required fields
      if (!newBloodStock.serial_id || !newBloodStock.collection || !newBloodStock.expiration) {
        setError('Please fill in all required fields');
        return;
      }

      await window.electronAPI.addBloodStock(newBloodStock);
      setShowAddModal(false);
      setNewBloodStock({
        serial_id: '',
        type: 'O',
        rhFactor: '+',
        volume: 100,
        collection: '',
        expiration: '',
        status: 'Stored'
      });
      await loadBloodData(); // Reload data after adding
      setError(null);
    } catch (err) {
      console.error('Error adding blood stock:', err);
      setError(`Failed to add blood stock: ${err.message}`);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBloodStock(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleDelete = async () => {
    try {
      if (!window.electronAPI) {
        setError('Electron API not available');
        return;
      }
      
      const selectedIds = bloodData.filter(item => item.selected).map(item => item.id);
      if (selectedIds.length === 0) return;

      const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} item(s)?`);
      if (!confirmed) return;

      await window.electronAPI.deleteBloodStock(selectedIds);
      await loadBloodData(); // Reload data after deletion
      setError(null);
    } catch (err) {
      console.error('Error deleting items:', err);
      setError('Failed to delete items');
    }
  };

  const selectedCount = bloodData.filter(item => item.selected).length;

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
      fontFamily: 'Arial',
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
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "24px",
      width: "500px",
      maxWidth: "90vw",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
    },
    modalHeader: {
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "20px",
      color: "#165C3C",
    },
    formRow: {
      display: "flex",
      gap: "16px",
      marginBottom: "16px",
    },
    formGroup: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "4px",
      color: "#374151",
    },
    input: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      outline: "none",
      fontFamily: "Barlow",
    },
    select: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      outline: "none",
      fontFamily: "Barlow",
      backgroundColor: "white",
    },
    modalActions: {
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
      marginTop: "24px",
    },
    cancelButton: {
      padding: "8px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      backgroundColor: "white",
      cursor: "pointer",
      fontSize: "14px",
      color: "#374151",
      fontFamily: "Barlow",
    },
    saveButton: {
      padding: "8px 16px",
      backgroundColor: "#165C3C",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Barlow",
    },
  };

  // Check if all rows are selected
  const allSelected = bloodData.length > 0 && bloodData.every(item => item.selected);
  // Check if some rows are selected (for indeterminate state)
  const someSelected = bloodData.some(item => item.selected) && !allSelected;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          Loading blood stock data...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Red Blood Cell</h2>
        <p style={styles.subtitle}>Blood Stock</p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorContainer}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
          <span>{error}</span>
          <button style={styles.refreshButton} onClick={loadBloodData}>
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
          <button style={styles.releaseButton}>Release Stock</button>

          {/* Add Stock */}
          <button style={styles.addButton} onClick={() => setShowAddModal(true)}>
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
              <th style={{...styles.th, width: "4%"}}>
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
              <th style={{...styles.th, width: "14%"}}>SERIAL ID</th>
              <th style={{...styles.th, width: "8%"}}>BLOOD TYPE</th>
              <th style={{...styles.th, width: "7%"}}>RH FACTOR</th>
              <th style={{...styles.th, width: "8%"}}>VOLUME (ML)</th>
              <th style={{...styles.th, width: "12%"}}>DATE OF COLLECTION</th>
              <th style={{...styles.th, width: "12%"}}>EXPIRATION DATE</th>
              <th style={{...styles.th, width: "8%"}}>STATUS</th>
              <th style={{...styles.th, width: "13%"}}>CREATED AT</th>
              <th style={{...styles.th, width: "13%"}}>MODIFIED AT</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {bloodData.length === 0 ? (
              <tr>
                <td colSpan="10" style={{...styles.td, textAlign: "center", padding: "40px"}}>
                  No blood stock records found
                </td>
              </tr>
            ) : (
              bloodData.map((item, index) => (
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
          <span style={styles.paginationText}>Page 1 of {Math.ceil(bloodData.length / 20)}</span>
          <button style={styles.paginationButtonNext}>Next</button>
        </div>
      </div>

      {/* Floating Action Bar */}
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
          
          <button style={styles.editButton}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
          
          <button style={styles.deleteButton} onClick={handleDelete}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalHeader}>Add New Blood Stock</h3>
            <form onSubmit={handleAddStock}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Serial ID *</label>
                  <input
                    type="text"
                    name="serial_id"
                    value={newBloodStock.serial_id}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="e.g., BL00-0020-ON"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Blood Type *</label>
                  <select
                    name="type"
                    value={newBloodStock.type}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="O">O</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>RH Factor *</label>
                  <select
                    name="rhFactor"
                    value={newBloodStock.rhFactor}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Volume (ml) *</label>
                  <input
                    type="number"
                    name="volume"
                    value={newBloodStock.volume}
                    onChange={handleInputChange}
                    style={styles.input}
                    min="1"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Collection Date *</label>
                  <input
                    type="date"
                    name="collection"
                    value={newBloodStock.collection}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Expiration Date *</label>
                  <input
                    type="date"
                    name="expiration"
                    value={newBloodStock.expiration}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    name="status"
                    value={newBloodStock.status}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="Stored">Stored</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.saveButton}>
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedBloodCell;