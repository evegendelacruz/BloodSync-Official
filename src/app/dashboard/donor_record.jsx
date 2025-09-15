import React, { useState } from "react";
import { Plus, Filter, Search } from "lucide-react";

const DonorRecord = () => {
  const [donorData, setDonorData] = useState([
    {
      id: "DNR-0001-ON",
      firstName: "Juan",
      middleName: "Reyes",
      lastName: "Abas",
      gender: "Male",
      birthdate: "04/18/1990",
      age: 34,
      bloodType: "A",
      rhFactor: "+",
      contactNumber: "9198654210",
      address: "Carmen",
      selected: false,
    },
    {
      id: "DNR-0002-ON",
      firstName: "Maria",
      middleName: "Dela Cruz",
      lastName: "Babagtas",
      gender: "Female",
      birthdate: "06/03/1985",
      age: 39,
      bloodType: "O",
      rhFactor: "+",
      contactNumber: "9203234667",
      address: "Kapalong",
      selected: false,
    },
    {
      id: "DNR-0003-ON",
      firstName: "Jose",
      middleName: "Bautista",
      lastName: "Cordero",
      gender: "Male",
      birthdate: "09/27/1996",
      age: 28,
      bloodType: "B",
      rhFactor: "-",
      contactNumber: "9157892454",
      address: "Laipaan",
      selected: false,
    },
    {
      id: "DNR-0004-ON",
      firstName: "Andrea",
      middleName: "Santos",
      lastName: "Daghoy",
      gender: "Female",
      birthdate: "12/10/2002",
      age: 22,
      bloodType: "AB",
      rhFactor: "+",
      contactNumber: "9274567890",
      address: "Macanasag",
      selected: false,
    },
    {
      id: "DNR-0005-ON",
      firstName: "Luningning",
      middleName: "Garcia",
      lastName: "Encarnacion",
      gender: "Female",
      birthdate: "08/22/1995",
      age: 29,
      bloodType: "A",
      rhFactor: "-",
      contactNumber: "9102345678",
      address: "Paang",
      selected: false,
    },
    {
      id: "DNR-0006-ON",
      firstName: "Emilio",
      middleName: "Mendoza",
      lastName: "Fajardo",
      gender: "Male",
      birthdate: "03/05/1986",
      age: 37,
      bloodType: "B",
      rhFactor: "-",
      contactNumber: "9127896001",
      address: "Bago",
      selected: false,
    },
    {
      id: "DNR-0007-ON",
      firstName: "Rosalinda",
      middleName: "Ramos",
      lastName: "Galvez",
      gender: "Female",
      birthdate: "07/16/2000",
      age: 24,
      bloodType: "O",
      rhFactor: "+",
      contactNumber: "9208978543",
      address: "Balusong",
      selected: false,
    },
    {
      id: "DNR-0008-ON",
      firstName: "Delfin",
      middleName: "Flores",
      lastName: "Hidalgo",
      gender: "Male",
      birthdate: "10/30/1992",
      age: 32,
      bloodType: "A",
      rhFactor: "-",
      contactNumber: "9185456789",
      address: "Nazareth",
      selected: false,
    },
    {
      id: "DNR-0009-ON",
      firstName: "Ligaya",
      middleName: "Castillo",
      lastName: "Ilagan",
      gender: "Female",
      birthdate: "05/08/1963",
      age: 61,
      bloodType: "AB",
      rhFactor: "+",
      contactNumber: "9185678901",
      address: "Puntod",
      selected: false,
    },
    {
      id: "DNR-0010-ON",
      firstName: "Benigno",
      middleName: "Villanueva",
      lastName: "Jacinto",
      gender: "Male",
      birthdate: "01/25/1997",
      age: 28,
      bloodType: "B",
      rhFactor: "+",
      contactNumber: "9227890123",
      address: "Bukaa",
      selected: false,
    },
    {
      id: "DNR-0011-ON",
      firstName: "Amihan",
      middleName: "Ocampo",
      lastName: "Katigbak",
      gender: "Female",
      birthdate: "11/16/1988",
      age: 36,
      bloodType: "O",
      rhFactor: "-",
      contactNumber: "9258901234",
      address: "Iponan",
      selected: false,
    },
    {
      id: "DNR-0012-ON",
      firstName: "Fernando",
      middleName: "Navarro",
      lastName: "Labrador",
      gender: "Male",
      birthdate: "02/07/1999",
      age: 24,
      bloodType: "A",
      rhFactor: "-",
      contactNumber: "9240123456",
      address: "Damasenan",
      selected: false,
    },
    {
      id: "DNR-0013-ON",
      firstName: "Isagani",
      middleName: "Aquino",
      lastName: "Macasaet",
      gender: "Male",
      birthdate: "06/29/1994",
      age: 30,
      bloodType: "AB",
      rhFactor: "+",
      contactNumber: "9259123456",
      address: "Guila",
      selected: false,
    },
    {
      id: "DNR-0014-ON",
      firstName: "Corazon",
      middleName: "Hernandez",
      lastName: "Noriega",
      gender: "Female",
      birthdate: "09/12/1989",
      age: 35,
      bloodType: "B",
      rhFactor: "+",
      contactNumber: "9281234567",
      address: "Tiblan",
      selected: false,
    },
    {
      id: "DNR-0015-ON",
      firstName: "Bayani",
      middleName: "Gutierrez",
      lastName: "Olivares",
      gender: "Female",
      birthdate: "12/03/1991",
      age: 33,
      bloodType: "O",
      rhFactor: "+",
      contactNumber: "9282345678",
      address: "Macabalan",
      selected: false,
    },
    {
      id: "DNR-0016-ON",
      firstName: "Estrella",
      middleName: "Salazar",
      lastName: "Panganiban",
      gender: "Male",
      birthdate: "05/20/1999",
      age: 25,
      bloodType: "A",
      rhFactor: "-",
      contactNumber: "9285456789",
      address: "Carmen",
      selected: false,
    },
    {
      id: "DNR-0017-ON",
      firstName: "Renato",
      middleName: "Magbanquil",
      lastName: "Patumambang",
      gender: "Female",
      birthdate: "08/07/1984",
      age: 40,
      bloodType: "B",
      rhFactor: "+",
      contactNumber: "9346567890",
      address: "Kapalong",
      selected: false,
    },
    {
      id: "DNR-0018-ON",
      firstName: "Salvador",
      middleName: "Pascual",
      lastName: "Razon",
      gender: "Male",
      birthdate: "03/28/1996",
      age: 28,
      bloodType: "O",
      rhFactor: "-",
      contactNumber: "9345678901",
      address: "Laipaan",
      selected: false,
    },
    {
      id: "DNR-0019-ON",
      firstName: "Diverta",
      middleName: "Alonzo",
      lastName: "Sarmad",
      gender: "Female",
      birthdate: "07/10/1980",
      age: 44,
      bloodType: "AB",
      rhFactor: "-",
      contactNumber: "9347890123",
      address: "Macanasag",
      selected: false,
    },
  ]);

  const toggleRowSelection = (id) => {
    setDonorData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Toggle selection for all rows
  const toggleAllSelection = () => {
    const allSelected = donorData.every((item) => item.selected);
    setDonorData((prevData) =>
      prevData.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  // Clear all selections
  const clearAllSelection = () => {
    setDonorData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  const selectedCount = donorData.filter((item) => item.selected).length;

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
      fontFamily:'Barlow'
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginTop: "-7px",
      fontFamily:'Barlow'
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
      backgroundColor: "white",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
    },
    syncButton: {
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
      borderBottom: "1px solid #e5e7eb",
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
    trSelected: {
      backgroundColor: "#e6f7ff",
    },
    td: {
      padding: "12px 16px",
      fontSize: "11px",
      fontFamily: 'Arial',
      color: "#111827",
      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
    },
    checkbox: {
      width: "16px",
      height: "16px",
      cursor: "pointer",
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

  // Check if all rows are selected
  const allSelected =
    donorData.length > 0 && donorData.every((item) => item.selected);
  // Check if some rows are selected (for indeterminate state)
  const someSelected = donorData.some((item) => item.selected) && !allSelected;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Regional Blood Center</h1>
        <p style={styles.subtitle}>Centralized Donor Record</p>
      </div>

      {/* Controls Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.leftControls}>
          {/* Search */}
          <div style={styles.searchContainer}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search"
              style={styles.searchInput}
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
            <Filter size={16} />
            <span>Filter</span>
          </button>

          {/* Approve Sync */}
          <button style={styles.syncButton}>
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
            <span>Approve Sync</span>
          </button>

          {/* Add Donor */}
          <button style={styles.addButton}>
            <Plus size={16} />
            <span>Add Donor</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>
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
              <th style={{ ...styles.th, width: "12%" }}>DONOR ID</th>
              <th style={styles.th}>FIRST NAME</th>
              <th style={styles.th}>MIDDLE NAME</th>
              <th style={styles.th}>LAST NAME</th>
              <th style={styles.th}>GENDER</th>
              <th style={styles.th}>BIRTHDATE</th>
              <th style={styles.th}>AGE</th>
              <th style={styles.th}>BLOOD TYPE</th>
              <th style={styles.th}>RH FACTOR</th>
              <th style={styles.th}>CONTACT NUMBER</th>
              <th style={styles.th}>ADDRESS</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {donorData.map((item, index) => (
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
                <td style={styles.td}>{item.id}</td>
                <td style={styles.td}>{item.firstName}</td>
                <td style={styles.td}>{item.middleName}</td>
                <td style={styles.td}>{item.lastName}</td>
                <td style={styles.td}>{item.gender}</td>
                <td style={styles.td}>{item.birthdate}</td>
                <td style={styles.td}>{item.age}</td>
                <td style={styles.td}>{item.bloodType}</td>
                <td style={styles.td}>{item.rhFactor}</td>
                <td style={styles.td}>{item.contactNumber}</td>
                <td style={styles.td}>{item.address}</td>
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

          <button style={styles.deleteButton}>
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

export default DonorRecord;
