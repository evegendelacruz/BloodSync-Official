import React, { useState } from "react";
import { Search } from "lucide-react";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [reportData, setReportData] = useState([
    { id: 1, docId: "DOC-2025-001", quarter: "1st Quarter", year: "2025", dateCreated: "01/15/2025", createdBy: "Admin User", selected: false },
    { id: 2, docId: "DOC-2025-002", quarter: "2nd Quarter", year: "2025", dateCreated: "04/15/2025", createdBy: "Admin User", selected: false },
    { id: 3, docId: "DOC-2025-003", quarter: "3rd Quarter", year: "2025", dateCreated: "07/15/2025", createdBy: "Admin User", selected: false },
    { id: 4, docId: "DOC-2025-004", quarter: "4th Quarter", year: "2025", dateCreated: "10/15/2025", createdBy: "Admin User", selected: false },
  ]);

  const filteredReports = reportData.filter(report =>
    report.quarter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.year.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.docId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRowSelection = (id) => {
    setReportData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Toggle selection for all rows
  const toggleAllSelection = () => {
    const allSelected = filteredReports.every((item) => item.selected);
    setReportData((prevData) =>
      prevData.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  // Clear all selections
  const clearAllSelection = () => {
    setReportData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  // Delete selected items
  const deleteSelectedItems = () => {
    setReportData((prevData) => prevData.filter((item) => !item.selected));
  };

  // Handle edit functionality (placeholder)
  const editSelectedItems = () => {
    const selectedItems = reportData.filter((item) => item.selected);
    console.log("Editing items:", selectedItems);
    // Implement your edit logic here
  };

  const selectedCount = reportData.filter((item) => item.selected).length;

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f8f9fa",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif",
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
      fontFamily: 'Barlow',
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginTop: "-7px",
      fontFamily: 'Barlow',
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
      display: "flex",
      alignItems: "center",
    },
    searchInput: {
      paddingLeft: "40px",
      paddingRight: "16px",
      paddingTop: "8px",
      paddingBottom: "8px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      width: "300px",
      fontSize: "14px",
      outline: "none",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      zIndex: 1,
      color: "#9ca3af",
    },
    rightControls: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    sortButton: {
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
    },
    filterButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#e5f3ff",
      color: "#1e40af",
      border: "1px solid #93c5fd",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
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
    },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "11px",
      fontFamily: 'Barlow',
      fontWeight: "500",
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: "1px solid #e5e7eb",
    },
    tbody: {
      backgroundColor: "white",
    },
    tr: {
      borderBottom: "1px solid #f3f4f6",
    },
    trEven: {
      backgroundColor: "#f9fafb",
    },
    trSelected: {
      backgroundColor: "#e6f7ff",
    },
    td: {
      padding: "12px 16px",
      fontSize: "11px",
      color: "#111827",
      borderBottom: "1px solid #f3f4f6",
    },
    
    viewReportLink: {
      color: "#3b82f6",
      textDecoration: "none",
      fontSize: "11px",
      fontWeight: "400",
    },
    pagination: {
      backgroundColor: "white",
      padding: "16px 24px",
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
      padding: "4px 8px",
    },
    paginationButtonNext: {
      fontSize: "14px",
      color: "#3b82f6",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "4px 8px",
    },
    paginationText: {
      fontSize: "14px",
      color: "#374151",
      fontWeight: "500",
    },
    checkbox: {
      width: "16px",
      height: "16px",
      cursor: "pointer",
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
      fontFamily: "Arial",
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
  };

  
  // Check if all visible rows are selected
  const allSelected =
    filteredReports.length > 0 && filteredReports.every((item) => item.selected);
  // Check if some rows are selected (for indeterminate state)
  const someSelected =
    filteredReports.some((item) => item.selected) && !allSelected;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Reports</h1>
        <p style={styles.subtitle}>Blood Donation Documentation Report</p>
      </div>

      {/* Controls Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.leftControls}>
          {/* Search */}
          <div style={styles.searchContainer}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Reports"
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.rightControls}>
          {/* Sort By */}
          <button style={styles.sortButton}>
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
          <button style={styles.filterButton}>
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
              <th style={{ ...styles.th, width: "18%" }}>DOCUMENT ID</th>
              <th style={{ ...styles.th, width: "16%" }}>QUARTER</th>
              <th style={{ ...styles.th, width: "10%" }}>YEAR</th>
              <th style={{ ...styles.th, width: "16%" }}>CREATED BY</th>
              <th style={{ ...styles.th, width: "16%" }}>CREATED AT</th>
              <th style={{ ...styles.th, width: "12%" }}>REPORT</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {filteredReports.map((report, index) => (
              <tr
                key={report.id}
                style={{
                  ...(index % 2 === 1 ? styles.trEven : {}),
                  ...(report.selected ? styles.trSelected : {}),
                }}
              >
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={report.selected}
                    onChange={() => toggleRowSelection(report.id)}
                  />
                </td>
                <td style={styles.td}>{report.docId}</td>
                <td style={styles.td}>{report.quarter}</td>
                <td style={styles.td}>{report.year}</td>
                <td style={styles.td}>{report.createdBy}</td>
                <td style={styles.td}>{report.dateCreated}</td>
                <td style={styles.td}>
                  <a href="#" style={styles.viewReportLink}>
                    View Report
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.pagination}>
          <button style={styles.paginationButton}>Previous</button>
          <span style={styles.paginationText}>Page 1 of 1</span>
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

          <button style={styles.editButton} onClick={editSelectedItems}>
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

          <button style={styles.deleteButton} onClick={deleteSelectedItems}>
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
    </div>
  );
};

export default Reports;