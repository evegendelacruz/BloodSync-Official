import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Mail, Bell, User } from "lucide-react";
import SidePanel from "../../components/SidePanel";
import Loader from "../../components/Loader";

import MailComponent from "./(tabs)/mail";
import CalendarComponent from "./(tabs)/calendar";
import NotificationComponent from "./(tabs)/notification";
import ProfileComponent from "././(tabs)/profile/profile";
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
  const [bloodCounts, setBloodCounts] = useState({
    redBloodCell: 0,
    platelet: 0,
    plasma: 0
  });
  const [bloodTypeCounts, setBloodTypeCounts] = useState({
    'AB+': 0,
    'AB-': 0,
    'A+': 0,
    'A-': 0,
    'B+': 0,
    'B-': 0,
    'O+': 0,
    'O-': 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBloodCounts = async () => {
      const start = Date.now();
      try {
        const counts = await window.electronAPI.getBloodStockCounts();
        setBloodCounts(counts);

        const typeCounts = await window.electronAPI.getBloodStockCountsByType();
        setBloodTypeCounts(typeCounts);
      } catch (error) {
        console.error('Error fetching blood counts:', error);
      } finally {
        const elapsed = Date.now() - start;
        const remaining = 1000 - elapsed;
        if (remaining > 0) {
          await new Promise((res) => setTimeout(res, remaining));
        }
        setLoading(false);
      }
    };

    fetchBloodCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchBloodCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalStored = bloodCounts.redBloodCell + bloodCounts.platelet + bloodCounts.plasma;

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-wrapper">
          <Loader />
        </div>
        <style jsx>{`
          .loading-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            gap: 0.5rem;
          }
          .loading-text {
            color: #6b7280;
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  const styles = {
    dashboardContent: {
      animation: "fadeIn 0.5s ease-out",
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
      padding: "1rem",
    },
    mainStatsSection: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: "1.5rem",
      marginBottom: "2rem",
    },
    mainStatsCard: {
      backgroundColor: "white",
      borderRadius: "1rem",
      padding: "2rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
    },
    bloodDropIcon: {
      fontSize: "2rem",
      marginBottom: "0.5rem",
    },
    mainStatsNumber: {
      fontSize: "4rem",
      fontWeight: "bold",
      color: "#dc2626",
      lineHeight: 1,
    },
    mainStatsTitle: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#111827",
      marginBottom: "0.5rem",
    },
    mainStatsSubtitle: {
      fontSize: "0.875rem",
      color: "#6b7280",
    },
    bloodTypeGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "1rem",
    },
    bloodTypeCard: {
      backgroundColor: "white",
      borderRadius: "0.75rem",
      padding: "1rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.25rem",
    },
    bloodTypeIcon: {
      fontSize: "1.25rem",
      color: "#dc2626",
    },
    bloodTypeCount: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#dc2626",
    },
    bloodTypeLabel: {
      fontSize: "0.75rem",
      fontWeight: 500,
      color: "#111827",
      lineHeight: 1.2,
    },
    bloodTypeDate: {
      fontSize: "0.625rem",
      color: "#6b7280",
    },
    dashboardGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 2fr",
      gridTemplateRows: "auto auto",
      gap: "1.5rem",
    },
    dashboardCard: {
      backgroundColor: "white",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    analyticsCard: {
      gridRow: "span 2",
    },
    cardTitle: {
      fontSize: "1.125rem",
      fontWeight: 600,
      color: "#111827",
      margin: "0 0 0.25rem 0",
    },
    cardSubtitle: {
      fontSize: "0.875rem",
      color: "#6b7280",
      margin: "0 0 1.5rem 0",
    },
    expirationSection: {
      marginTop: "1rem",
    },
    expirationTitle: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: "#dc2626",
      margin: "0 0 1rem 0",
    },
    expirationTable: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    tableHeader: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
      gap: "0.5rem",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#6b7280",
      paddingBottom: "0.5rem",
      borderBottom: "1px solid #e5e7eb",
    },
    tableRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
      gap: "0.5rem",
      fontSize: "0.75rem",
      color: "#111827",
      padding: "0.5rem 0",
      alignItems: "center",
    },
    statusBadge: {
      padding: "0.25rem 0.5rem",
      borderRadius: "0.25rem",
      fontSize: "0.625rem",
      fontWeight: 600,
      textAlign: "center",
    },
    statusAlert: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    statusUrgent: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
    componentsList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    componentItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 0",
      borderBottom: "1px solid #f3f4f6",
    },
    componentLabel: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#111827",
    },
    componentCount: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#dc2626",
    },
    chartContainer: {
      width: "100%",
      height: "200px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    analyticsChart: {
      width: "100%",
      height: "100%",
    },
    releasedStats: {
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      gap: "1rem",
    },
    releasedItem: {
      textAlign: "center",
      flex: 1,
    },
    releasedLabel: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#6b7280",
      marginBottom: "0.5rem",
    },
    releasedCount: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#dc2626",
    },
    upcomingDrives: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    driveItem: {
      padding: "0.75rem",
      backgroundColor: "#f9fafb",
      borderRadius: "0.5rem",
      borderLeft: "4px solid #10b981",
    },
    driveText: {
      fontSize: "0.875rem",
      color: "#111827",
    },
    seeMore: {
      textAlign: "center",
      marginTop: "0.5rem",
    },
    seeMoreBtn: {
      backgroundColor: "transparent",
      border: "none",
      color: "#059669",
      fontSize: "0.875rem",
      cursor: "pointer",
      padding: "0.5rem",
      borderRadius: "0.25rem",
      transition: "background-color 0.2s",
    },
  };

  return (
    <div style={styles.dashboardContent}>
      {/* Main Stats Section */}
      <div style={styles.mainStatsSection}>
        {/* Total Stored Blood - Large Card */}
        <div style={styles.mainStatsCard}>
          <div style={styles.bloodDropIcon}>🩸</div>
          <div style={styles.mainStatsNumber}>{loading ? '...' : totalStored}</div>
          <div style={styles.mainStatsTitle}>Total Stored Blood</div>
          <div style={styles.mainStatsSubtitle}>Updated - {new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</div>
        </div>

        {/* Blood Type Grid */}
        <div style={styles.bloodTypeGrid}>
          {[
            { type: "AB+", displayType: "AB +" },
            { type: "A+", displayType: "A +" },
            { type: "B+", displayType: "B +" },
            { type: "O+", displayType: "O +" },
            { type: "AB-", displayType: "AB -" },
            { type: "A-", displayType: "A -" },
            { type: "B-", displayType: "B -" },
            { type: "O-", displayType: "O -" },
          ].map((bloodType, index) => (
            <div key={index} style={styles.bloodTypeCard}>
              <div style={styles.bloodTypeIcon}>🩸</div>
              <div style={styles.bloodTypeCount}>{loading ? '...' : bloodTypeCounts[bloodType.type]}</div>
              <div style={styles.bloodTypeLabel}>Total Stored {bloodType.displayType}</div>
              <div style={styles.bloodTypeDate}>{new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Grid Section */}
      <div style={styles.dashboardGrid}>
        {/* Blood Expiration Report */}
        <div style={styles.dashboardCard}>
          <h3 style={styles.cardTitle}>Blood Expiration Report</h3>
          <p style={styles.cardSubtitle}>Month of March 2025</p>
          <div style={styles.expirationSection}>
            <h4 style={styles.expirationTitle}>Expiring Soon</h4>
            <div style={styles.expirationTable}>
              <div style={styles.tableHeader}>
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
                <div key={index} style={styles.tableRow}>
                  <span>{item.type}</span>
                  <span>{item.component}</span>
                  <span>{item.units}</span>
                  <span>{item.date}</span>
                  <span style={{...styles.statusBadge, ...(item.status === "Urgent" ? styles.statusUrgent : styles.statusAlert)}}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Components Available */}
        <div style={styles.dashboardCard}>
          <h3 style={styles.cardTitle}>Components Available</h3>
          <p style={styles.cardSubtitle}>{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
          <div style={styles.componentsList}>
            <div style={styles.componentItem}>
              <span style={styles.componentLabel}>RED BLOOD CELL</span>
              <span style={styles.componentCount}>{loading ? '...' : bloodCounts.redBloodCell}</span>
            </div>
            <div style={styles.componentItem}>
              <span style={styles.componentLabel}>PLASMA</span>
              <span style={styles.componentCount}>{loading ? '...' : bloodCounts.plasma}</span>
            </div>
            <div style={styles.componentItem}>
              <span style={styles.componentLabel}>PLATELET</span>
              <span style={styles.componentCount}>{loading ? '...' : bloodCounts.platelet}</span>
            </div>
          </div>
        </div>

        {/* Blood Donation Analytics */}
        <div style={{...styles.dashboardCard, ...styles.analyticsCard}}>
          <h3 style={styles.cardTitle}>Blood Donation Analytics</h3>
          <p style={styles.cardSubtitle}>Monthly participation as of 2025</p>
          <div style={styles.chartContainer}>
            <svg style={styles.analyticsChart} viewBox="0 0 300 150">
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
        <div style={styles.dashboardCard}>
          <h3 style={styles.cardTitle}>Blood Released</h3>
          <p style={styles.cardSubtitle}>Month of March 2025</p>
          <div style={styles.releasedStats}>
            <div style={styles.releasedItem}>
              <span style={styles.releasedLabel}>RBC</span>
              <span style={styles.releasedCount}>0</span>
            </div>
            <div style={styles.releasedItem}>
              <span style={styles.releasedLabel}>Plasma</span>
              <span style={styles.releasedCount}>0</span>
            </div>
            <div style={styles.releasedItem}>
              <span style={styles.releasedLabel}>Platelet</span>
              <span style={styles.releasedCount}>0</span>
            </div>
          </div>
        </div>

        {/* Upcoming Drive */}
        <div style={styles.dashboardCard}>
          <h3 style={styles.cardTitle}>Upcoming Drive</h3>
          <p style={styles.cardSubtitle}>Month of March 2025</p>
          <div style={styles.upcomingDrives}>
            <div style={styles.driveItem}>
              <span style={styles.driveText}>CDO Scholarship Office: 2025-03-10</span>
            </div>
            <div style={styles.driveItem}>
              <span style={styles.driveText}>Barangay Patag: 2025-03-11</span>
            </div>
            <div style={styles.seeMore}>
              <button style={styles.seeMoreBtn}>See more ⌄</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
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

        @media (max-width: 1024px) {
          .main-stats-section {
            grid-template-columns: 1fr !important;
          }
          
          .blood-type-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .blood-type-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const ScreenWrapper = ({ title, children }) => {
  const styles = {
    screenWrapper: {
      animation: "fadeIn 0.5s ease-out",
    },
    screenContent: {
      backgroundColor: "white",
      padding: "1.5rem",
      borderRadius: "0.5rem",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
  };

  return (
    <div style={styles.screenWrapper}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <div style={styles.screenContent}>{children}</div>

      <style>{`
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

const LogoutDialog = ({ isOpen, onConfirm, onCancel }) => {
  const styles = {
    dialogOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      animation: "fadeIn 0.2s ease-out",
    },
    dialogContent: {
      backgroundColor: "white",
      padding: "2rem",
      borderRadius: "0.5rem",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      maxWidth: "400px",
      width: "90%",
      textAlign: "center",
      animation: "slideIn 0.3s ease-out",
    },
    dialogTitle: {
      fontSize: "1.125rem",
      fontWeight: 600,
      color: "#111827",
      margin: "0 0 0.75rem 0",
    },
    dialogMessage: {
      color: "#6b7280",
      margin: "0 0 1.5rem 0",
      fontSize: "0.875rem",
    },
    dialogActions: {
      display: "flex",
      gap: "0.75rem",
      justifyContent: "center",
    },
    dialogButton: {
      padding: "0.5rem 1.5rem",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s",
      border: "1px solid",
    },
    cancelButton: {
      backgroundColor: "white",
      color: "#6b7280",
      borderColor: "#d1d5db",
    },
    confirmButton: {
      backgroundColor: "#ef4444",
      color: "white",
      borderColor: "#ef4444",
    },
  };

  if (!isOpen) return null;

  return (
    <div style={styles.dialogOverlay}>
      <div style={styles.dialogContent}>
        <h3 style={styles.dialogTitle}>Confirm Logout</h3>
        <p style={styles.dialogMessage}>Are you sure you want to logout?</p>
        <div style={styles.dialogActions}>
          <button style={{...styles.dialogButton, ...styles.cancelButton}} onClick={onCancel}>
            Cancel
          </button>
          <button style={{...styles.dialogButton, ...styles.confirmButton}} onClick={onConfirm}>
            Yes, Logout
          </button>
        </div>
      </div>
      
      <style>{`
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [isMailDropdownOpen, setIsMailDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        // If user data is corrupted, redirect to login
        navigate('/login');
      }
    } else {
      // No user data found, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Listen for profile updates to refresh the user photo
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        try {
          setCurrentUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    // Listen for storage events (from other tabs) and custom profile update events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const styles = {
    dashboardContainer: {
      minHeight: "100vh",
      backgroundColor: "#edf4e6",
      position: "relative",
      overflowX: "hidden",
    },
    mainContentWrapper: {
      position: "relative",
      minHeight: "100vh",
      transition: "margin-left 0.3s ease-in-out",
    },
    navBar: {
      backgroundColor: "white",
      borderBottom: "1px solid #e5e7eb",
      padding: "0.75rem 1rem",
      position: "sticky",
      top: 0,
      zIndex: 30,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    navContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    navLeft: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    navRight: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    dropdownContainer: {
      position: "relative",
    },
    navButton: {
      padding: "0.5rem",
      borderRadius: "0.5rem",
      transition: "background-color 0.2s",
      border: "none",
      backgroundColor: "transparent",
      cursor: "pointer",
      position: "relative",
    },
    navButtonActive: {
      backgroundColor: "#059669",
      color: 'white'
    },
    notificationBadge: {
      position: "absolute",
      top: "2px",
      right: "2px",
      backgroundColor: "#ef4444",
      color: "white",
      fontSize: "0.625rem",
      fontWeight: "bold",
      borderRadius: "50%",
      width: "16px",
      height: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    },
    dropdownMenu: {
      position: "absolute",
      right: 0,
      top: "100%",
      marginTop: "0.5rem",
      backgroundColor: "white",
      borderRadius: "0.5rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      border: "1px solid #e5e7eb",
      zIndex: 50,
      overflow: "hidden",
    },
    requestsDropdown: {
      width: "320px",
    },
    messagesDropdown: {
      width: "320px",
    },
    notificationsDropdown: {
      width: "300px",
    },
    profileDropdown: {
      width: "160px",
    },
    dropdownHeader: {
      backgroundColor: "#059669",
      padding: "0.75rem 1rem",
      color: "white",
    },
    dropdownTitle: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      color: "white",
      margin: 0,
    },
    dropdownContent: {
      maxHeight: "300px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "0.875rem 1rem",
      borderBottom: "1px solid #f3f4f6",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    iconCircle: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
    },
    redBg: {
      backgroundColor: "#ef4444",
      color: "white",
    },
    yellowBg: {
      backgroundColor: "#eab308",
      color: "white",
    },
    blueBg: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    greenBg: {
      backgroundColor: "#10b981",
      color: "white",
    },
    orangeBg: {
      backgroundColor: "#f97316",
      color: "white",
    },
    iconText: {
      fontSize: "0.875rem",
    },
    requestDetails: {
      flex: 1,
      minWidth: 0,
    },
    requestTitle: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#111827",
      margin: "0 0 0.25rem 0",
      lineHeight: 1.25,
    },
    requestSubtitle: {
      fontSize: "0.75rem",
      color: "#6b7280",
      margin: 0,
      lineHeight: 1.33,
    },
    messageAvatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "0.75rem",
      color: "white",
      flexShrink: 0,
    },
    blueAvatar: {
      backgroundColor: "#3b82f6",
    },
    greenAvatar: {
      backgroundColor: "#10b981",
    },
    purpleAvatar: {
      backgroundColor: "#8b5cf6",
    },
    dropdownFooter: {
      padding: "0.75rem 1rem",
      borderTop: "1px solid #f3f4f6",
      backgroundColor: "#f9fafb",
      textAlign: "center",
    },
    footerButton: {
      backgroundColor: "transparent",
      border: "none",
      color: "#059669",
      fontSize: "0.875rem",
      fontWeight: 500,
      cursor: "pointer",
      padding: "0.5rem",
      borderRadius: "0.25rem",
      transition: "background-color 0.2s",
      width: "100%",
    },
    profileMenuItem: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "0.75rem 1rem",
      fontSize: "0.875rem",
      color: "#374151",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s",
      borderBottom: "1px solid #f3f4f6",
    },
    userSection: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      paddingLeft: "0.75rem",
      borderLeft: "1.4px solid #e5e7eb",
      position: "relative",
    },
    userName: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#374151",
      fontFamily: "Barlow",
    },
    userAvatar: {
      width: "2rem",
      height: "2rem",
      backgroundColor: "#d1d5db",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s",
      cursor: "pointer",
    },
    userAvatarActive: {
      backgroundColor: "#059669",
      color: "white"
    },
    mainContent: {
      padding: "1.5rem",
    },
  };

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const handleNavigate = (screen) => {
    setActiveScreen(screen);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const toggleCalendarDropdown = () => {
    setIsCalendarDropdownOpen(!isCalendarDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleMailDropdown = () => {
    setIsMailDropdownOpen(!isMailDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsCalendarDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
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
    // Clear user session data from localStorage
    localStorage.removeItem('currentUser');
    console.log("Logging out...");
    navigate("/login");
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

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
    <div style={styles.dashboardContainer}>
      <SidePanel
        isOpen={isSidePanelOpen}
        onToggle={toggleSidePanel}
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
      />

      <div
        style={{
          ...styles.mainContentWrapper,
          marginLeft: isSidePanelOpen ? "15rem" : "4rem",
        }}
      >
        <nav style={styles.navBar}>
          <div style={styles.navContent}>
            <div style={styles.navLeft}></div>

            <div style={styles.navRight}>
              {/* Calendar Button with Dropdown */}
              <div style={styles.dropdownContainer}>
                <button
                  style={{
                    ...styles.navButton,
                    ...(activeScreen === "calendar" ? styles.navButtonActive : {}),
                  }}
                  onClick={toggleCalendarDropdown}
                >
                  <Calendar className="w-5 h-5 text-gray-600" />
                </button>
                {isCalendarDropdownOpen && (
                  <div style={{...styles.dropdownMenu, ...styles.requestsDropdown}}>
                    <div style={styles.dropdownHeader}>
                      <h3 style={styles.dropdownTitle}>REQUESTS</h3>
                    </div>
                    <div style={styles.dropdownContent}>
                      <div style={styles.dropdownItem}>
                        <div>
                          <div style={{...styles.iconCircle, ...styles.redBg}}>
                            <span style={styles.iconText}>🩸</span>
                          </div>
                        </div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Blood letting Drive Partnership Request</p>
                          <p style={styles.requestSubtitle}>Tacloban would like to have a schedule for bl...</p>
                        </div>
                      </div>
                      <div style={styles.dropdownItem}>
                        <div>
                          <div style={{...styles.iconCircle, ...styles.yellowBg}}>
                            <span style={styles.iconText}>S</span>
                          </div>
                        </div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Request Sync</p>
                          <p style={styles.requestSubtitle}>Butuan Tokyo 39.3 would like to request an appraisal...</p>
                        </div>
                      </div>
                      <div style={styles.dropdownItem}>
                        <div>
                          <div style={{...styles.iconCircle, ...styles.blueBg}}>
                            <span style={styles.iconText}>🩸</span>
                          </div>
                        </div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Blood letting Drive Partnership Request</p>
                          <p style={styles.requestSubtitle}>City Government Butuan would like to have a schedule...</p>
                        </div>
                      </div>
                      <div style={styles.dropdownItem}>
                        <div>
                          <div style={{...styles.iconCircle, ...styles.greenBg}}>
                            <span style={styles.iconText}>S</span>
                          </div>
                        </div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Request Sync</p>
                          <p style={styles.requestSubtitle}>Philippine Eagles would like to request an approval...</p>
                        </div>
                      </div>
                    </div>
                    <div style={styles.dropdownFooter}>
                      <button style={styles.footerButton} onClick={() => handleNavigate("calendar")}>
                        See All Requests
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mail Button with Dropdown */}
              <div style={styles.dropdownContainer}>
                <button
                  style={{
                    ...styles.navButton,
                    ...(activeScreen === "mail" ? styles.navButtonActive : {}),
                  }}
                  onClick={toggleMailDropdown}
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                </button>
                {isMailDropdownOpen && (
                  <div style={{...styles.dropdownMenu, ...styles.messagesDropdown}}>
                    <div style={styles.dropdownHeader}>
                      <h3 style={styles.dropdownTitle}>MESSAGES</h3>
                    </div>
                    <div style={styles.dropdownContent}>
                      <div style={styles.dropdownItem}>
                        <div style={{...styles.messageAvatar, ...styles.blueAvatar}}>JS</div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>John Smith</p>
                          <p style={styles.requestSubtitle}>Thank you for the quick response regarding...</p>
                        </div>
                      </div>
                      <div style={styles.dropdownItem}>
                        <div style={{...styles.messageAvatar, ...styles.greenAvatar}}>MH</div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Metro Hospital</p>
                          <p style={styles.requestSubtitle}>Urgent blood request for emergency surgery...</p>
                        </div>
                      </div>
                      <div style={styles.dropdownItem}>
                        <div style={{...styles.messageAvatar, ...styles.purpleAvatar}}>DR</div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Dr. Rodriguez</p>
                          <p style={styles.requestSubtitle}>Weekly blood inventory report is ready...</p>
                        </div>
                      </div>
                    </div>
                    <div style={styles.dropdownFooter}>
                      <button style={styles.footerButton} onClick={() => handleNavigate("mail")}>
                        View All Messages
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Button with Dropdown */}
              <div style={styles.dropdownContainer}>
                <button
                  style={{
                    ...styles.navButton,
                    ...(activeScreen === "notification" ? styles.navButtonActive : {}),
                  }}
                  onClick={toggleNotificationDropdown}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span style={styles.notificationBadge}>3</span>
                </button>
                {isNotificationDropdownOpen && (
                  <div style={{...styles.dropdownMenu, ...styles.notificationsDropdown}}>
                    <div style={styles.dropdownHeader}>
                      <h3 style={styles.dropdownTitle}>NOTIFICATIONS</h3>
                    </div>
                    <div style={styles.dropdownContent}>
                      <div style={styles.dropdownItem}>
                        <div>
                          <div style={{...styles.iconCircle, ...styles.redBg}}>
                            <span style={styles.iconText}>🩸</span>
                          </div>
                        </div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Blood Stock Update</p>
                          <p style={styles.requestSubtitle}>Current stored blood: 628 units. Updated on March 1, 2025, at 1:00 PM.</p>
                        </div>
                      </div>
                      <div style={styles.dropdownItem}>
                        <div>
                          <div style={{...styles.iconCircle, ...styles.orangeBg}}>
                            <span style={styles.iconText}>⚠️</span>
                          </div>
                        </div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Blood Expiration Alert</p>
                          <p style={styles.requestSubtitle}>Warning: 10 units of blood (Type A+) will expire in 3 days.</p>
                        </div>
                      </div>
                      <div style={styles.dropdownItem}>
                        <div>
                          <div style={{...styles.iconCircle, ...styles.greenBg}}>
                            <span style={styles.iconText}>✓</span>
                          </div>
                        </div>
                        <div style={styles.requestDetails}>
                          <p style={styles.requestTitle}>Blood Release Confirmation</p>
                          <p style={styles.requestSubtitle}>30 units of blood (Type B+) were successfully released</p>
                        </div>
                      </div>
                    </div>
                    <div style={styles.dropdownFooter}>
                      <button style={styles.footerButton} onClick={() => handleNavigate("notification")}>
                        See All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Section with Dropdown */}
              <div style={styles.userSection}>
                <span style={styles.userName}>{currentUser?.fullName || 'Loading...'}</span>
                <div
                  style={{
                    ...styles.userAvatar,
                    ...(activeScreen === "profile" ? styles.userAvatarActive : {}),
                  }}
                  onClick={toggleProfileDropdown}
                >
                  {currentUser?.profilePhoto ? (
                    <img
                      src={currentUser.profilePhoto}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}

                  {isProfileDropdownOpen && (
                    <div style={{...styles.dropdownMenu, ...styles.profileDropdown}}>
                      <button
                        style={styles.profileMenuItem}
                        onClick={() => handleProfileAction("edit-profile")}
                      >
                        My Profile
                      </button>
                      <button
                        style={styles.profileMenuItem}
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

        <main style={styles.mainContent}>{renderActiveScreen()}</main>
      </div>

      <LogoutDialog 
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      <style>{`
        body {
          margin: 0;
        }

        .nav-button:hover {
          background-color: #f3f4f6;
        }

        .nav-button-active:hover {
          background-color: #047857 !important;
        }

        .nav-button-active .lucide {
          color: white !important;
        }

        .dropdown-item:hover {
          background-color: #f9fafb;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .footer-button:hover {
          background-color: #e5e7eb;
        }

        .profile-menu-item:last-child {
          border-bottom: none;
        }

        .profile-menu-item:hover {
          background-color: #f3f4f6;
        }

        .user-avatar:hover {
          background-color: #9ca3af;
        }

        .user-avatar-active:hover {
          background-color: #047857 !important;
        }

        .user-avatar-active .lucide {
          color: white !important;
        }

        @media (max-width: 768px) {
          .main-content-wrapper {
            margin-left: 0 !important;
          }

          .dropdown-menu {
            right: auto;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard