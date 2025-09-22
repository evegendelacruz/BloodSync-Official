import React, { useState } from "react";
import { Plus, Filter, Search, Calendar, Mail, Bell, User } from "lucide-react";
import SidePanelOrg from "../../../components/SidePanelOrg";

// Import components for navigation (you'll need to create these or import from actual files)
import MailOrg from "./(tabs)/mail";
import CalendarOrg from "./(tabs)/calendar";
import NotificationOrg from "./(tabs)/notification";
import AppointmentOrg from "./appointment";
import RecentActivityOrg from "./recent_activity";
import ProfileOrg from "./(tabs)/profile/profile";
import LoginOrg from "../login";

const DonorRecordContent = () => {
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

  const toggleAllSelection = () => {
    const allSelected = donorData.every((item) => item.selected);
    setDonorData((prevData) =>
      prevData.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const clearAllSelection = () => {
    setDonorData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  const selectedCount = donorData.filter((item) => item.selected).length;

  const allSelected =
    donorData.length > 0 && donorData.every((item) => item.selected);
  const someSelected = donorData.some((item) => item.selected) && !allSelected;

  return (
    <div className="donor-record-content">
      {/* Header */}
      <div className="donor-header">
        <h1 className="donor-title">Regional Blood Center</h1>
        <p className="donor-subtitle">Centralized Donor Record</p>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="left-controls">
          {/* Search */}
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              className="search-input"
            />
          </div>
        </div>

        <div className="right-controls">
          {/* Sort By */}
          <button className="sort-button">
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
          <button className="filter-button">
            <Filter size={16} />
            <span>Filter</span>
          </button>

          {/* Approve Sync */}
          <button className="sync-button">
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
          <button className="add-button">
            <Plus size={16} />
            <span>Add Donor</span>
          </button>
        </div>
      </div>

      {/* Table */}
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
                    if (input) {
                      input.indeterminate = someSelected;
                    }
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
            </tr>
          </thead>
          <tbody className="table-body">
            {donorData.map((item, index) => (
              <tr
                key={item.id}
                className={`table-row ${index % 2 === 1 ? 'row-even' : ''} ${item.selected ? 'row-selected' : ''}`}
              >
                <td className="table-cell">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={item.selected}
                    onChange={() => toggleRowSelection(item.id)}
                  />
                </td>
                <td className="table-cell">{item.id}</td>
                <td className="table-cell">{item.firstName}</td>
                <td className="table-cell">{item.middleName}</td>
                <td className="table-cell">{item.lastName}</td>
                <td className="table-cell">{item.gender}</td>
                <td className="table-cell">{item.birthdate}</td>
                <td className="table-cell">{item.age}</td>
                <td className="table-cell">{item.bloodType}</td>
                <td className="table-cell">{item.rhFactor}</td>
                <td className="table-cell">{item.contactNumber}</td>
                <td className="table-cell">{item.address}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button className="pagination-button">Previous</button>
          <span className="pagination-text">Page 1 of 20</span>
          <button className="pagination-button-next">Next</button>
        </div>
      </div>

      {/* Floating Action Bar */}
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

          <button className="edit-button">
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

          <button className="delete-button">
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

      <style jsx>{`
        .donor-record-content {
          padding: 24px;
          background-color: #f9fafb;
          min-height: 100vh;
          font-family: Barlow;
          border-radius: 8px;
          animation: fadeIn 0.5s ease-out;
        }

        .donor-header {
          margin: 0;
        }

        .donor-title {
          font-size: 24px;
          font-weight: bold;
          color: #165C3C;
          margin-top: 1px;
          font-family: Barlow;
        }

        .donor-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-top: -7px;
          font-family: Barlow;
        }

        .controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          background-color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .left-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding-left: 40px;
          padding-right: 16px;
          padding-top: 8px;
          padding-bottom: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          width: 300px;
          font-size: 14px;
          outline: none;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          z-index: 1;
          color: #9ca3af;
        }

        .right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sort-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background-color: white;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .sync-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #2C58DC;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .add-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #FFC200;
          color: black;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .table-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .donor-table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-head {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-header {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }

        .donor-id-col {
          width: 12%;
        }

        .table-body {
          background-color: white;
        }

        .table-row {
          border-bottom: 1px solid #A3A3A3;
        }

        .row-even {
          background-color: #f9fafb;
        }

        .row-selected {
          background-color: #e6f7ff;
        }

        .table-cell {
          padding: 12px 16px;
          font-size: 11px;
          font-family: Arial;
          color: #111827;
          border-bottom: 1px solid rgba(163, 163, 163, 0.2);
        }

        .checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .pagination {
          background-color: white;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pagination-button {
          font-size: 14px;
          color: #6b7280;
          background-color: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
        }

        .pagination-button-next {
          font-size: 14px;
          color: #3b82f6;
          background-color: transparent;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
        }

        .pagination-text {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .action-bar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 0;
          background: #4a5568;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          z-index: 1000;
          color: white;
          overflow: hidden;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          background-color: #4a5568;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 16px;
          border-right: 1px solid #2d3748;
        }

        .counter-section {
          padding: 12px 24px;
          background-color: #4a5568;
          border-right: 1px solid #2d3748;
        }

        .counter-text {
          font-size: 14px;
          font-weight: 500;
          color: white;
          margin: 0;
        }

        .edit-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background-color: #4a5568;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 14px;
          border-right: 1px solid #2d3748;
        }

        .delete-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background-color: #4a5568;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Logout Confirmation Dialog Component
const LogoutDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3 className="dialog-title">Confirm Logout</h3>
        <p className="dialog-message">Are you sure you want to logout?</p>
        <div className="dialog-actions">
          <button className="dialog-button cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="dialog-button confirm-button" onClick={onConfirm}>
            Yes, Logout
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .dialog-content {
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 90%;
          text-align: center;
          animation: slideIn 0.3s ease-out;
        }

        .dialog-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem 0;
        }

        .dialog-message {
          color: #6b7280;
          margin: 0 0 1.5rem 0;
          font-size: 0.875rem;
        }

        .dialog-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .dialog-button {
          padding: 0.5rem 1.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid;
        }

        .cancel-button {
          background-color: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .cancel-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .confirm-button {
          background-color: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .confirm-button:hover {
          background-color: #dc2626;
          border-color: #dc2626;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
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
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const handleNavigate = (screen) => {
    setActiveScreen(screen);
    // Close all dropdowns when navigating
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const toggleCalendarDropdown = () => {
    setIsCalendarDropdownOpen(!isCalendarDropdownOpen);
    // Close other dropdowns
    setIsProfileDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleMailDropdown = () => {
    setIsMailDropdownOpen(!isMailDropdownOpen);
    // Close other dropdowns
    setIsProfileDropdownOpen(false);
    setIsCalendarDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    // Close other dropdowns
    setIsProfileDropdownOpen(false);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    // Close other dropdowns
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const handleProfileAction = (action) => {
    if (action === "edit-profile") {
      setActiveScreen("profile");
    } else if (action === "logout") {
      setShowLogoutDialog(true);
    }
    setIsProfileDropdownOpen(false);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    setIsLoggedOut(true);
    console.log("Logging out...");
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  if (isLoggedOut) {
    return <LoginOrg />;
  }

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
      case "recent-activity-org":
        return <RecentActivityOrg />;
      default:
        return <DonorRecordContent />;
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

      {/* Main Content Area */}
      <div
        className="main-content-wrapper"
        style={{
          marginLeft: isSidePanelOpen ? "15rem" : "4rem",
        }}
      >
        {/* Top Navigation */}
        <nav className="nav-bar">
          <div className="nav-content">
            {/* Left side */}
            <div className="nav-left"></div>

            {/* Right side */}
            <div className="nav-right">
              {/* Calendar Button with Dropdown */}
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
                      <h3 className="dropdown-title">REQUESTS</h3>
                    </div>
                    <div className="dropdown-content">
                      <div className="dropdown-item">
                        <div className="request-icon red-icon">
                          <div className="icon-circle red-bg">
                            <span className="icon-text">🩸</span>
                          </div>
                        </div>
                        <div className="request-details">
                          <p className="request-title">Blood letting Drive Partnership Request</p>
                          <p className="request-subtitle">Tacloban would like to have a schedule for bl...</p>
                        </div>
                      </div>
                      <div className="dropdown-item">
                        <div className="request-icon yellow-icon">
                          <div className="icon-circle yellow-bg">
                            <span className="icon-text">S</span>
                          </div>
                        </div>
                        <div className="request-details">
                          <p className="request-title">Request Sync</p>
                          <p className="request-subtitle">Butuan Tokyo 39.3 would like to request an appraisal...</p>
                        </div>
                      </div>
                      <div className="dropdown-item">
                        <div className="request-icon blue-icon">
                          <div className="icon-circle blue-bg">
                            <span className="icon-text">🩸</span>
                          </div>
                        </div>
                        <div className="request-details">
                          <p className="request-title">Blood letting Drive Partnership Request</p>
                          <p className="request-subtitle">City Government Butuan would like to have a schedule...</p>
                        </div>
                      </div>
                      <div className="dropdown-item">
                        <div className="request-icon green-icon">
                          <div className="icon-circle green-bg">
                            <span className="icon-text">S</span>
                          </div>
                        </div>
                        <div className="request-details">
                          <p className="request-title">Request Sync</p>
                          <p className="request-subtitle">Philippine Eagles would like to request an approval...</p>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("calendar-org")}>
                        See All Requests
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mail Button with Dropdown */}
              <div className="dropdown-container">
                <button
                  className={`nav-button ${activeScreen === "mail" ? "nav-button-active" : ""}`}
                  onClick={toggleMailDropdown}
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                </button>
                {isMailDropdownOpen && (
                  <div className="dropdown-menu messages-dropdown">
                    <div className="dropdown-header">
                      <h3 className="dropdown-title">MESSAGES</h3>
                    </div>
                    <div className="dropdown-content">
                      <div className="dropdown-item">
                        <div className="message-avatar blue-avatar">JS</div>
                        <div className="message-details">
                          <p className="message-sender">John Smith</p>
                          <p className="message-preview">Thank you for the quick response regarding...</p>
                        </div>
                      </div>
                      <div className="dropdown-item">
                        <div className="message-avatar green-avatar">MH</div>
                        <div className="message-details">
                          <p className="message-sender">Metro Hospital</p>
                          <p className="message-preview">Urgent blood request for emergency surgery...</p>
                        </div>
                      </div>
                      <div className="dropdown-item">
                        <div className="message-avatar purple-avatar">DR</div>
                        <div className="message-details">
                          <p className="message-sender">Dr. Rodriguez</p>
                          <p className="message-preview">Weekly blood inventory report is ready...</p>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("mail-org")}>
                        View All Messages
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Button with Dropdown */}
              <div className="dropdown-container">
                <button
                  className={`nav-button ${activeScreen === "notification" ? "nav-button-active" : ""}`}
                  onClick={toggleNotificationDropdown}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="notification-badge">3</span>
                </button>
                {isNotificationDropdownOpen && (
                  <div className="dropdown-menu notifications-dropdown">
                    <div className="dropdown-header">
                      <h3 className="dropdown-title">NOTIFICATIONS</h3>
                    </div>
                    <div className="dropdown-content">
                      <div className="dropdown-item">
                        <div className="notification-icon red-icon">
                          <div className="icon-circle red-bg">
                            <span className="icon-text">🩸</span>
                          </div>
                        </div>
                        <div className="notification-details">
                          <p className="notification-title">Blood Stock Update</p>
                          <p className="notification-subtitle">Current stored blood: 628 units. Updated on March 1, 2025, at 1:00 PM.</p>
                        </div>
                      </div>
                      <div className="dropdown-item">
                        <div className="notification-icon orange-icon">
                          <div className="icon-circle orange-bg">
                            <span className="icon-text">⚠️</span>
                          </div>
                        </div>
                        <div className="notification-details">
                          <p className="notification-title">Blood Expiration Alert</p>
                          <p className="notification-subtitle">Warning: 10 units of blood (Type A+) will expire in 3 days.</p>
                        </div>
                      </div>
                      <div className="dropdown-item">
                        <div className="notification-icon green-icon">
                          <div className="icon-circle green-bg">
                            <span className="icon-text">✓</span>
                          </div>
                        </div>
                        <div className="notification-details">
                          <p className="notification-title">Blood Release Confirmation</p>
                          <p className="notification-subtitle">30 units of blood (Type B+) were successfully released</p>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("notification-org")}>
                        See All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Section with Dropdown */}
              <div className="user-section relative">
                <span className="user-name">Alaiza Rose Olores</span>
                <div
                  className={`user-avatar cursor-pointer ${activeScreen === "profile" ? "user-avatar-active" : ""}`}
                  onClick={toggleProfileDropdown}
                >
                  <User className="w-4 h-4 text-gray-600" />
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

        {/* Main Content */}
        <main className="main-content">{renderActiveScreen()}</main>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog 
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      <style jsx>{`
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
        }

        .requests-dropdown {
          width: 320px;
        }

        .messages-dropdown {
          width: 320px;
        }

        .notifications-dropdown {
          width: 300px;
        }

        .profile-dropdown {
          width: 160px;
        }

        .dropdown-header {
          background-color: #059669;
          padding: 0.75rem 1rem;
          color: white;
        }

        .dropdown-title {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: white;
          margin: 0;
        }

        .dropdown-content {
          max-height: 300px;
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
        }

        .dropdown-item:hover {
          background-color: #f9fafb;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .request-icon, .notification-icon {
          flex-shrink: 0;
        }

        .icon-circle {
          width: 32px;
          height: 32px;
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

        .request-title, .notification-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.25rem 0;
          line-height: 1.25;
        }

        .request-subtitle, .notification-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
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
        }

        .message-preview {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
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
          font-family: Barlow;
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
        }

        .user-avatar:hover {
          background-color: #9ca3af;
        }

        .user-avatar-active {
          background-color: #059669 !important;
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