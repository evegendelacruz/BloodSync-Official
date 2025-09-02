import React, { useState } from "react";

const RedBloodCell = () => {
  const [bloodData, setBloodData] = useState([
    {
      id: "BL00-0001-ON",
      type: "O",
      rhFactor: "-",
      volume: 100,
      collection: "03/02/2025",
      expiration: "04/15/2025",
      status: "Stored",
      created: "03/02/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0002-ON",
      type: "A",
      rhFactor: "-",
      volume: 100,
      collection: "03/02/2025",
      expiration: "04/15/2025",
      status: "Stored",
      created: "03/02/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0003-ON",
      type: "A",
      rhFactor: "+",
      volume: 100,
      collection: "03/02/2025",
      expiration: "04/15/2025",
      status: "Stored",
      created: "03/02/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0004-ON",
      type: "AB",
      rhFactor: "-",
      volume: 100,
      collection: "03/02/2025",
      expiration: "04/15/2025",
      status: "Stored",
      created: "03/02/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0005-ON",
      type: "O",
      rhFactor: "+",
      volume: 100,
      collection: "03/03/2025",
      expiration: "04/16/2025",
      status: "Stored",
      created: "03/03/2025-03-11 13:00:00",
      modified: "04/15/2025-03-11 15:00:00",
      selected: false
    },
    {
      id: "BL00-0006-ON",
      type: "O",
      rhFactor: "-",
      volume: 100,
      collection: "03/03/2025",
      expiration: "04/16/2025",
      status: "Stored",
      created: "03/03/2025-03-11 13:00:00",
      modified: "04/15/2025-03-11 15:00:00",
      selected: false
    },
    {
      id: "BL00-0007-ON",
      type: "O",
      rhFactor: "-",
      volume: 100,
      collection: "03/03/2025",
      expiration: "04/16/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0008-ON",
      type: "O",
      rhFactor: "+",
      volume: 100,
      collection: "03/04/2025",
      expiration: "04/16/2025",
      status: "Stored",
      created: "04/15-03-11 13:00:00",
      modified: "04/15/2025-03-11 13:00:00",
      selected: false
    },
    {
      id: "BL00-0009-ON",
      type: "B",
      rhFactor: "+",
      volume: 100,
      collection: "03/04/2025",
      expiration: "04/16/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "04/15/2025-03-11 13:00:00",
      selected: false
    },
    {
      id: "BL00-0010-ON",
      type: "B",
      rhFactor: "-",
      volume: 100,
      collection: "03/04/2025",
      expiration: "04/16/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "04/15/2025-03-11 13:00:00",
      selected: false
    },
    {
      id: "BL00-0011-ON",
      type: "A",
      rhFactor: "+",
      volume: 100,
      collection: "03/06/2025",
      expiration: "04/18/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0012-ON",
      type: "O",
      rhFactor: "+",
      volume: 100,
      collection: "03/06/2025",
      expiration: "04/18/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "04/15/2025-03-11 19:00:00",
      selected: false
    },
    {
      id: "BL00-0013-ON",
      type: "AB",
      rhFactor: "-",
      volume: 100,
      collection: "03/08/2025",
      expiration: "04/18/2025",
      status: "Stored",
      created: "04/15/2025-04-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0014-ON",
      type: "AB",
      rhFactor: "-",
      volume: 100,
      collection: "03/08/2025",
      expiration: "04/17/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "04/15/2025-03-11 19:00:00",
      selected: false
    },
    {
      id: "BL00-0015-ON",
      type: "B",
      rhFactor: "+",
      volume: 100,
      collection: "03/08/2025",
      expiration: "04/17/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "04/15/2025-03-11 19:00:00",
      selected: false
    },
    {
      id: "BL00-0016-ON",
      type: "A",
      rhFactor: "-",
      volume: 100,
      collection: "04/07/2025",
      expiration: "04/18/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0017-ON",
      type: "A",
      rhFactor: "-",
      volume: 100,
      collection: "04/07/2025",
      expiration: "04/18/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0018-ON",
      type: "A",
      rhFactor: "-",
      volume: 100,
      collection: "04/08/2025",
      expiration: "04/18/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "-",
      selected: false
    },
    {
      id: "BL00-0019-ON",
      type: "B",
      rhFactor: "+",
      volume: 100,
      collection: "04/08/2025",
      expiration: "04/18/2025",
      status: "Stored",
      created: "04/15/2025-03-11 13:00:00",
      modified: "04/15/2025-03-11 15:00:00",
      selected: false
    },
  ]);

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
  };

  // Check if all rows are selected
  const allSelected = bloodData.length > 0 && bloodData.every(item => item.selected);
  // Check if some rows are selected (for indeterminate state)
  const someSelected = bloodData.some(item => item.selected) && !allSelected;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Red Blood Cell</h2>
        <p style={styles.subtitle}>Blood Stock</p>
      </div>

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
              placeholder="Search"
              style={styles.searchInput}
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
          <button style={styles.addButton}>
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
            {bloodData.map((item, index) => (
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
                <td style={styles.td}>{item.id}</td>
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
            ))}
          </tbody>
        </table>

        <div style={styles.pagination}>
          <button style={styles.paginationButton}>Previous</button>
          <span style={styles.paginationText}>Page 1 of 20</span>
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
          
          <button style={styles.deleteButton}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RedBloodCell;