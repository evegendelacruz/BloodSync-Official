import React, { useState } from "react";
import { Calendar, Mail, Bell, User } from "lucide-react";
import SidePanel from "../../components/SidePanel";

import MailComponent from "./(tabs)/mail";
import CalendarComponent from "./(tabs)/calendar";
import NotificationComponent from "./(tabs)/notification";
import ProfileComponent from "././(tabs)/profile";
import Login from "../login";
import Plasma from "./blood_stock/plasma";
import Platelet from "./blood_stock/platelet";
import RedBloodCell from "./blood_stock/rbc";
import DonorRecord from "./donor_record";
import Invoice from "./invoice";
import RecentActivity from "./recent_activity";
import ReleasedBlood from "./released_blood";
import Reports from "./reports";
import PlasmaNC from "./non-conforming/plasma";
import PlateletNC from "./non-conforming/platelet";
import RedBloodCellNC from "./non-conforming/rbc";

const DashboardContent = () => {
  return (
    <div className="dashboard-content">
      {/* Main Stats Section */}
      <div className="main-stats-section">
        {/* Total Stored Blood - Large Card */}
        <div className="main-stats-card">
          <div className="blood-drop-icon">🩸</div>
          <div className="main-stats-number">628</div>
          <div className="main-stats-title">Total Stored Blood</div>
          <div className="main-stats-subtitle">Updated - 11 March 2025 at 1:00 PM</div>
        </div>

        {/* Blood Type Grid */}
        <div className="blood-type-grid">
          {[
            { type: "AB +", count: 85, date: "2025-03-11 13:00:00" },
            { type: "A +", count: 96, date: "2025-03-11 13:00:00" },
            { type: "B +", count: 102, date: "2025-03-11 13:00:00" },
            { type: "O +", count: 78, date: "2025-03-11 13:00:00" },
            { type: "AB -", count: 74, date: "2025-03-11 13:00:00" },
            { type: "A -", count: 58, date: "2025-03-11 13:00:00" },
            { type: "B -", count: 47, date: "2025-03-11 13:00:00" },
            { type: "O -", count: 88, date: "2025-03-11 13:00:00" },
          ].map((bloodType, index) => (
            <div key={index} className="blood-type-card">
              <div className="blood-type-icon">🩸</div>
              <div className="blood-type-count">{bloodType.count}</div>
              <div className="blood-type-label">Total Stored {bloodType.type}</div>
              <div className="blood-type-date">{bloodType.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Grid Section */}
      <div className="dashboard-grid">
        {/* Blood Expiration Report */}
        <div className="dashboard-card">
          <h3 className="card-title">Blood Expiration Report</h3>
          <p className="card-subtitle">Month of March 2025</p>
          <div className="expiration-section">
            <h4 className="expiration-title">Expiring Soon</h4>
            <div className="expiration-table">
              <div className="table-header">
                <span>Blood Type</span>
                <span>Component</span>
                <span>Units</span>
                <span>Expiration Date</span>
                <span>Status</span>
              </div>
              {[
                { type: "O +", component: "RBC", units: 17, date: "2025-03-16", status: "Alert" },
                { type: "A +", component: "Plasma", units: 8, date: "2025-03-17", status: "Alert" },
                { type: "B +", component: "Platelets", units: 15, date: "2025-03-19", status: "Urgent" },
                { type: "AB -", component: "RBC", units: 22, date: "2025-03-18", status: "Alert" },
              ].map((item, index) => (
                <div key={index} className="table-row">
                  <span>{item.type}</span>
                  <span>{item.component}</span>
                  <span>{item.units}</span>
                  <span>{item.date}</span>
                  <span className={`status-badge ${item.status === "Urgent" ? "status-urgent" : "status-alert"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Components Available */}
        <div className="dashboard-card">
          <h3 className="card-title">Components Available</h3>
          <p className="card-subtitle">Month of March 2025</p>
          <div className="components-list">
            <div className="component-item">
              <span className="component-label">RED BLOOD CELL</span>
              <span className="component-count">236</span>
            </div>
            <div className="component-item">
              <span className="component-label">PLASMA</span>
              <span className="component-count">205</span>
            </div>
            <div className="component-item">
              <span className="component-label">PLATELET</span>
              <span className="component-count">187</span>
            </div>
          </div>
        </div>

        {/* Blood Donation Analytics */}
        <div className="dashboard-card analytics-card">
          <h3 className="card-title">Blood Donation Analytics</h3>
          <p className="card-subtitle">Monthly participation as of 2025</p>
          <div className="chart-container">
            <svg className="analytics-chart" viewBox="0 0 300 150">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <path
                d="M 20 120 L 80 100 L 140 80 L 200 60 L 260 70 L 260 140 L 20 140 Z"
                fill="url(#areaGradient)"
              />
              <path
                d="M 20 120 L 80 100 L 140 80 L 200 60 L 260 70"
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
              />
              {[
                { x: 20, y: 120 },
                { x: 80, y: 100 },
                { x: 140, y: 80 },
                { x: 200, y: 60 },
                { x: 260, y: 70 },
              ].map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
              <text x="50" y="145" fontSize="12" fill="#6b7280" textAnchor="middle">January</text>
              <text x="110" y="145" fontSize="12" fill="#6b7280" textAnchor="middle">February</text>
              <text x="170" y="145" fontSize="12" fill="#6b7280" textAnchor="middle">March</text>
              <text x="230" y="145" fontSize="12" fill="#6b7280" textAnchor="middle">April</text>
              <text x="10" y="125" fontSize="12" fill="#6b7280">10</text>
              <text x="10" y="105" fontSize="12" fill="#6b7280">20</text>
              <text x="10" y="85" fontSize="12" fill="#6b7280">30</text>
              <text x="10" y="65" fontSize="12" fill="#6b7280">40</text>
              <text x="10" y="45" fontSize="12" fill="#6b7280">50</text>
            </svg>
          </div>
        </div>

        {/* Blood Released */}
        <div className="dashboard-card">
          <h3 className="card-title">Blood Released</h3>
          <p className="card-subtitle">Month of March 2025</p>
          <div className="released-stats">
            <div className="released-item">
              <span className="released-label">RBC</span>
              <span className="released-count">80</span>
            </div>
            <div className="released-item">
              <span className="released-label">Plasma</span>
              <span className="released-count">80</span>
            </div>
            <div className="released-item">
              <span className="released-label">Platelet</span>
              <span className="released-count">80</span>
            </div>
          </div>
        </div>

        {/* Upcoming Drive */}
        <div className="dashboard-card">
          <h3 className="card-title">Upcoming Drive</h3>
          <p className="card-subtitle">Month of March 2025</p>
          <div className="upcoming-drives">
            <div className="drive-item">
              <span className="drive-text">CDO Scholarship Office: 2025-03-10</span>
            </div>
            <div className="drive-item">
              <span className="drive-text">Barangay Patag: 2025-03-11</span>
            </div>
            <div className="see-more">
              <button className="see-more-btn">See more ⌄</button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-content {
          animation: fadeIn 0.5s ease-out;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem;
        }

        .main-stats-section {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .main-stats-card {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .blood-drop-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .main-stats-number {
          font-size: 4rem;
          font-weight: bold;
          color: #dc2626;
          line-height: 1;
        }

        .main-stats-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .main-stats-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .blood-type-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .blood-type-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .blood-type-icon {
          font-size: 1.25rem;
          color: #dc2626;
        }

        .blood-type-count {
          font-size: 1.5rem;
          font-weight: bold;
          color: #dc2626;
        }

        .blood-type-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #111827;
          line-height: 1.2;
        }

        .blood-type-date {
          font-size: 0.625rem;
          color: #6b7280;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 2fr;
          grid-template-rows: auto auto;
          gap: 1.5rem;
        }

        .dashboard-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .analytics-card {
          grid-row: span 2;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 1.5rem 0;
        }

        .expiration-section {
          margin-top: 1rem;
        }

        .expiration-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 1rem 0;
        }

        .expiration-table {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #111827;
          padding: 0.5rem 0;
          align-items: center;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.625rem;
          font-weight: 600;
          text-align: center;
        }

        .status-alert {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-urgent {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .components-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .component-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .component-item:last-child {
          border-bottom: none;
        }

        .component-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
        }

        .component-count {
          font-size: 1.5rem;
          font-weight: bold;
          color: #dc2626;
        }

        .chart-container {
          width: 100%;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .analytics-chart {
          width: 100%;
          height: 100%;
        }

        .released-stats {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 1rem;
        }

        .released-item {
          text-align: center;
          flex: 1;
        }

        .released-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .released-count {
          font-size: 2rem;
          font-weight: bold;
          color: #dc2626;
        }

        .upcoming-drives {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .drive-item {
          padding: 0.75rem;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          border-left: 4px solid #10b981;
        }

        .drive-text {
          font-size: 0.875rem;
          color: #111827;
        }

        .see-more {
          text-align: center;
          margin-top: 0.5rem;
        }

        .see-more-btn {
          background: none;
          border: none;
          color: #059669;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
        }

        .see-more-btn:hover {
          background-color: #f3f4f6;
        }

        @media (max-width: 1024px) {
          .main-stats-section {
            grid-template-columns: 1fr;
          }
          
          .blood-type-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .analytics-card {
            grid-row: span 1;
          }
        }

        @media (max-width: 768px) {
          .blood-type-grid {
            grid-template-columns: 1fr;
          }
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

const ScreenWrapper = ({ title, children }) => {
  return (
    <div className="screen-wrapper">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <div className="screen-content">{children}</div>

      <style jsx>{`
        .screen-wrapper {
          animation: fadeIn 0.5s ease-out;
        }

        .screen-content {
          background-color: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
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

// Main Dashboard Component
const Dashboard = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeScreen, setActiveScreen] = useState("dashboard");
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

  // Show login screen if logged out
  if (isLoggedOut) {
    return <Login />;
  }

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "mail":
        return <MailComponent />;
      case "calendar":
        return <CalendarComponent />;
      case "notification":
        return <NotificationComponent />;
      case "profile":
        return <ProfileComponent />;
      case "red-blood-cell":
        return <RedBloodCell />;
      case "plasma":
        return <Plasma />;
      case "platelet":
        return <Platelet />;
      case "released-blood":
        return <ReleasedBlood />;
      case "red-blood-cell-nc":
        return <RedBloodCellNC />;
      case "plasma-nc":
        return <PlasmaNC />;
      case "platelet-nc":
        return <PlateletNC />;
      case "donor-record":
        return <DonorRecord />;
      case "invoice":
        return <Invoice />;
      case "reports":
        return <Reports />;
      case "recent-activity":
        return <RecentActivity />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="dashboard-container">
      <SidePanel
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
                      <button className="footer-button" onClick={() => handleNavigate("calendar")}>
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
                      <button className="footer-button" onClick={() => handleNavigate("mail")}>
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
                      <button className="footer-button" onClick={() => handleNavigate("notification")}>
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

                  {isProfileDropdownOpen && (
                    <div className="dropdown-menu profile-dropdown">
                      <button
                        className="profile-menu-item"
                        onClick={() => handleProfileAction("edit-profile")}
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

export default Dashboard;