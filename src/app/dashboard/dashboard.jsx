import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Mail, Bell, User, Droplet, RefreshCw, CheckCircle, Clock, MapPin, Users } from "lucide-react";
import SidePanel from "../../components/SidePanel";

import MailComponent from "./(tabs)/mail";
import CalendarComponent from "./(tabs)/calendar";
import NotificationComponent from "./(tabs)/notification";
import ProfileComponent from "./(tabs)/profile/profile"; // FIXED: Removed extra dot
import Login from "../login";
import Plasma from "./blood_stock/plasma";
import Platelet from "./blood_stock/platelet";
import RedBloodCell from "./blood_stock/rbc";
import DonorRecord from "./donor_record";
import Discarded from "./invoice/discarded_blood";
import ReleasedInvoice from "./invoice/released_blood";
import RecentActivity from "./recent_activity";
import ReleasedBlood from "./released_blood";
import Reports from "./reports";
import PlasmaNC from "./non-conforming/plasma";
import PlateletNC from "./non-conforming/platelet";
import RedBloodCellNC from "./non-conforming/rbc";

const DashboardContent = () => {
  const [dashboardData, setDashboardData] = useState({
    totalStored: 0,
    bloodTypes: {
      "O+": 0,
      "O-": 0,
      "A+": 0,
      "A-": 0,
      "B+": 0,
      "B-": 0,
      "AB+": 0,
      "AB-": 0,
    },
    expiringSoon: [],
    components: {
      rbc: 0,
      plasma: 0,
      platelet: 0,
    },
    releasedThisMonth: {
      rbc: "",
      plasma: "",
      platelet: "",
    },
    walkInQuarterlyDonations: [0, 0, 0, 0],
    mobileQuarterlyDonations: [0, 0, 0, 0],
  });
  const [loading, setLoading] = useState(true);
  const [upcomingDrives, setUpcomingDrives] = useState([]);
  const [error, setError] = useState(null);
  const extractMonthFromDate = (dateString) => {
    if (!dateString) return null;
    
    // Handle YYYY-MM-DD format
    const [year, month, day] = dateString.split("-").map(num => parseInt(num, 10));
    return month; // Returns 1-12
  };
  
  const extractYearFromDate = (dateString) => {
    if (!dateString) return null;
    
    // Handle YYYY-MM-DD format
    const [year, month, day] = dateString.split("-").map(num => parseInt(num, 10));
    return year;
  };

  useEffect(() => {
  fetchUpcomingDrive();
}, []);

const fetchUpcomingDrive = async () => {
  try {
    if (window.electronAPI) {
      const appointments = await window.electronAPI.getAllAppointments();
      const partnershipRequests = await window.electronAPI.getAllPartnershipRequests(null);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingAppointments = appointments
        .filter(apt => {
          const eventDate = new Date(apt.date + 'T00:00:00');
          return (apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'scheduled') 
            && eventDate >= today;
        })
        .map(apt => ({
          title: apt.title || 'Blood Drive Event',
          date: apt.date,
          time: apt.time,
          location: apt.contactInfo?.address || 'Location TBD',
          organization: apt.contactInfo?.lastName || 'Unknown Organization',
        }));
      
      const upcomingPartnerships = partnershipRequests
        .filter(req => {
          const eventDate = new Date(req.event_date + 'T00:00:00');
          return (req.status === 'approved' || req.status === 'confirmed' || req.status === 'scheduled') 
            && eventDate >= today;
        })
        .map(req => ({
          title: `Blood Drive Partnership - ${req.contact_name}`,
          date: req.event_date,
          time: req.event_time,
          location: req.event_address || 'Location TBD',
          organization: req.contact_name,
        }));
      
      const allUpcoming = [...upcomingAppointments, ...upcomingPartnerships]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 2); // Get top 2
      
      setUpcomingDrives(allUpcoming);
    }
  } catch (error) {
    console.error('Error fetching upcoming drives:', error);
    setUpcomingDrives([]);
  }
};


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      let dbService;

      if (window.dbService) {
        dbService = window.dbService;
      } else if (window.electronAPI) {

        // Get stored blood data
        const [storedData, plasmaData, plateletData] = await Promise.all([
          window.electronAPI.getAllBloodStock(),
          window.electronAPI.getPlasmaStock(),
          window.electronAPI.getPlateletStock(),
        ]);

        // Get released blood data - THESE ALREADY HAVE release_month and release_year
        const releasedRBC = await window.electronAPI.getReleasedBloodStock();
        const releasedPlasma =
          await window.electronAPI.getReleasedPlasmaStock();
        const releasedPlatelet =
          await window.electronAPI.getReleasedPlateletStock();

    

        // Pass the data directly - no need to process
        processAndSetDashboardData(
          storedData,
          plasmaData,
          plateletData,
          releasedRBC,
          releasedPlasma,
          releasedPlatelet
        );
        return;
      } else if (typeof require !== "undefined") {
        try {
          dbService = require("./database/dbService");
        } catch (err) {
          console.error("Could not require dbService:", err);
        }
      }

      if (dbService) {
        const [
          storedData,
          plasmaData,
          plateletData,
          releasedRBC,
          releasedPlasma,
          releasedPlatelet,
        ] = await Promise.all([
          dbService.getAllBloodStock(),
          dbService.getPlasmaStock(),
          dbService.getPlateletStock(),
          dbService.getReleasedBloodStockItems(),
          dbService.getReleasedPlasmaStockItems(),
          dbService.getReleasedPlateletStockItems(),
        ]);

        processAndSetDashboardData(
          storedData,
          plasmaData,
          plateletData,
          releasedRBC,
          releasedPlasma,
          releasedPlatelet
        );
      } else {
        console.warn("Database service not available, using mock data");
        setDashboardData({
          totalStored: 145,
          bloodTypes: {
            "O+": 42,
            "O-": 18,
            "A+": 35,
            "A-": 12,
            "B+": 21,
            "B-": 8,
            "AB+": 7,
            "AB-": 2,
          },
          expiringSoon: [],
          components: {
            rbc: 145,
            plasma: 87,
            platelet: 56,
          },
          releasedThisMonth: {
            rbc: 23,
            plasma: 15,
            platelet: 9,
          },
          walkInQuarterlyDonations: [120, 135, 158, 145],
          mobileQuarterlyDonations: [80, 95, 102, 88],
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const processAndSetDashboardData = (
    storedData,
    plasmaData,
    plateletData,
    releasedRBC,
    releasedPlasma,
    releasedPlatelet
  ) => {
    try {
      // Count by blood type
      const bloodTypeCounts = {
        "O+": 0,
        "O-": 0,
        "A+": 0,
        "A-": 0,
        "B+": 0,
        "B-": 0,
        "AB+": 0,
        "AB-": 0,
      };
  
      storedData.forEach((item) => {
        const bloodType = `${item.type}${item.rhFactor}`;
        if (bloodTypeCounts.hasOwnProperty(bloodType)) {
          bloodTypeCounts[bloodType]++;
        }
      });
  
      const totalStored = storedData.length;
  
      // Fetch expiring blood (within 7 days)
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
  
      // Check RBC
      const rbcData = storedData.filter((item) => {
        const expirationDate = new Date(item.expiration);
        return expirationDate <= sevenDaysLater && expirationDate >= today;
      });
  
      // Check Plasma
      const expiringPlasma = plasmaData.filter((item) => {
        const expirationDate = new Date(item.expiration);
        return expirationDate <= sevenDaysLater && expirationDate >= today;
      });
  
      // Check Platelet
      const expiringPlatelet = plateletData.filter((item) => {
        const expirationDate = new Date(item.expiration);
        return expirationDate <= sevenDaysLater && expirationDate >= today;
      });
  
      // Group by blood type and component
      const expirationMap = new Map();
  
      rbcData.forEach((item) => {
        const key = `${item.type}${item.rhFactor}-RBC`;
        if (!expirationMap.has(key)) {
          expirationMap.set(key, {
            type: `${item.type}${item.rhFactor}`,
            component: "RBC",
            units: 0,
            expiration: item.expiration,
            daysUntilExpiry: Math.ceil(
              (new Date(item.expiration) - today) / (1000 * 60 * 60 * 24)
            ),
          });
        }
        expirationMap.get(key).units++;
      });
  
      expiringPlasma.forEach((item) => {
        const key = `${item.type}${item.rhFactor}-Plasma`;
        if (!expirationMap.has(key)) {
          expirationMap.set(key, {
            type: `${item.type}${item.rhFactor}`,
            component: "Plasma",
            units: 0,
            expiration: item.expiration,
            daysUntilExpiry: Math.ceil(
              (new Date(item.expiration) - today) / (1000 * 60 * 60 * 24)
            ),
          });
        }
        expirationMap.get(key).units++;
      });
  
      expiringPlatelet.forEach((item) => {
        const key = `${item.type}${item.rhFactor}-Platelet`;
        if (!expirationMap.has(key)) {
          expirationMap.set(key, {
            type: `${item.type}${item.rhFactor}`,
            component: "Platelet",
            units: 0,
            expiration: item.expiration,
            daysUntilExpiry: Math.ceil(
              (new Date(item.expiration) - today) / (1000 * 60 * 60 * 24)
            ),
          });
        }
        expirationMap.get(key).units++;
      });
  
      const expiringList = Array.from(expirationMap.values())
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
        .slice(0, 4);
  
      // Count components available
      const components = {
        rbc: storedData.length,
        plasma: plasmaData.length,
        platelet: plateletData.length,
      };

      // Count released this month
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();

      const releasedThisMonth = {
        rbc: 0,
        plasma: 0,
        platelet: 0,
      };

      // Count RBC released this month
      if (Array.isArray(releasedRBC) && releasedRBC.length > 0) {
        releasedRBC.forEach((item) => {
          if (item.dateofrelease) {
            // Split MM/DD/YYYY format (e.g., "11/15/2025")
            const [month, day, year] = item.dateofrelease.split('/').map(Number);
            
            if (month === currentMonth && year === currentYear) {
              releasedThisMonth.rbc++;
            }
          }
        });
      }

      // Count Plasma released this month
      if (Array.isArray(releasedPlasma) && releasedPlasma.length > 0) {
        releasedPlasma.forEach((item) => {
          if (item.dateofrelease) {
            // Split MM/DD/YYYY format (e.g., "11/15/2025")
            const [month, day, year] = item.dateofrelease.split('/').map(Number);
            
            if (month === currentMonth && year === currentYear) {
              releasedThisMonth.plasma++;
            }
          }
        });
      }

      // Count Platelet released this month
      if (Array.isArray(releasedPlatelet) && releasedPlatelet.length > 0) {
        releasedPlatelet.forEach((item) => {
          if (item.dateofrelease) {
            // Split MM/DD/YYYY format (e.g., "11/15/2025")
            const [month, day, year] = item.dateofrelease.split('/').map(Number);
            
            if (month === currentMonth && year === currentYear) {
              releasedThisMonth.platelet++;
            }
          }
        });
      }
          // Calculate quarterly data by source (Mobile vs Walk-In) from blood_stock_history
    const walkInQuarterlyData = [0, 0, 0, 0];
    const mobileQuarterlyData = [0, 0, 0, 0];

    // Fetch history data and count by quarter
    const fetchQuarterlyHistory = async () => {
      try {
        if (window.electronAPI) {
          const yearNumber = parseInt(currentYear, 10);
          
          const historyData = await window.electronAPI.getBloodStockHistory(yearNumber);
          
          // Process history data - group by quarter and source
          historyData.forEach((item) => {
            // Parse the bsh_timestamp field (YYYY-MM-DD format from database)
            const timestamp = new Date(item.bsh_timestamp);
            const month = timestamp.getMonth(); // 0-11
            const year = timestamp.getFullYear();
            
            if (year === currentYear) {
              const quarter = Math.floor(month / 3); // 0-3 (Q1, Q2, Q3, Q4)
              
              if (quarter >= 0 && quarter < 4) {
                // Check the source and increment the appropriate counter
                if (item.source === "Mobile") {
                  mobileQuarterlyData[quarter]++;
                } else {
                  // Default to Walk-In if not Mobile
                  walkInQuarterlyData[quarter]++;
                }
              }
            }
          });
        
          
          setDashboardData({
            totalStored,
            bloodTypes: bloodTypeCounts,
            expiringSoon: expiringList,
            components,
            releasedThisMonth,
            walkInQuarterlyDonations: walkInQuarterlyData,
            mobileQuarterlyDonations: mobileQuarterlyData,
          });
          
          setLoading(false);
        } else {
          // Fallback to current stored data if history not available
          parseCreatedDateFromStored();
        }
      } catch (error) {
        console.error("Error fetching quarterly history:", error);
        // Fallback to current stored data
        parseCreatedDateFromStored();
      }
    };

    // Fallback function using stored data's created dates
    const parseCreatedDateFromStored = () => {
      const parseCreatedDate = (dateString) => {
        if (!dateString) return null;
        const datePart = dateString.split("-")[0];
        const [month, day, year] = datePart
          .split("/")
          .map((num) => parseInt(num, 10));
        return new Date(year, month - 1, day);
      };

      // Count RBC by quarter and source
      storedData.forEach((item) => {
        const createdDate = parseCreatedDate(item.created);
        if (createdDate && createdDate.getFullYear() === currentYear) {
          const monthNum = createdDate.getMonth();
          const quarter = Math.floor(monthNum / 3);
          if (quarter >= 0 && quarter < 4) {
            if (item.source === "Mobile") {
              mobileQuarterlyData[quarter]++;
            } else {
              walkInQuarterlyData[quarter]++;
            }
          }
        }
      });

      // Count Plasma by quarter and source
      plasmaData.forEach((item) => {
        const createdDate = parseCreatedDate(item.created);
        if (createdDate && createdDate.getFullYear() === currentYear) {
          const monthNum = createdDate.getMonth();
          const quarter = Math.floor(monthNum / 3);
          if (quarter >= 0 && quarter < 4) {
            if (item.source === "Mobile") {
              mobileQuarterlyData[quarter]++;
            } else {
              walkInQuarterlyData[quarter]++;
            }
          }
        }
      });

      // Count Platelet by quarter and source
      plateletData.forEach((item) => {
        const createdDate = parseCreatedDate(item.created);
        if (createdDate && createdDate.getFullYear() === currentYear) {
          const monthNum = createdDate.getMonth();
          const quarter = Math.floor(monthNum / 3);
          if (quarter >= 0 && quarter < 4) {
            if (item.source === "Mobile") {
              mobileQuarterlyData[quarter]++;
            } else {
              walkInQuarterlyData[quarter]++;
            }
          }
        }
      });

      setDashboardData({
        totalStored,
        bloodTypes: bloodTypeCounts,
        expiringSoon: expiringList,
        components,
        releasedThisMonth,
        walkInQuarterlyDonations: walkInQuarterlyData,
        mobileQuarterlyDonations: mobileQuarterlyData,
      });

      setLoading(false);
    };

    // Call the async function to fetch quarterly history
    fetchQuarterlyHistory();
    
  } catch (error) {
    console.error("Error processing dashboard data:", error);
    setError(error.message);
    setLoading(false);
  }
};
  
  const formatDate = (dateString) => {
    if (dateString.includes("/")) {
      return dateString;
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusBadge = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 3) {
      return { label: "Urgent", style: styles.statusUrgent };
    }
    return { label: "Alert", style: styles.statusAlert };
  };

  const styles = {
    dashboardContainer: {
      minHeight: "100vh",
      backgroundColor: "#edf4e6",
      padding: "1rem",
    },
    dashboardContent: {
      animation: "fadeIn 0.5s ease-out",
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
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
      color: "#dc2626",
    },
    mainStatsNumber: {
      fontSize: "4rem",
      fontWeight: "bold",
      color: "#dc2626",
      lineHeight: 1,
      fontFamily: "Barlow, sans-serif",
    },
    mainStatsTitle: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#111827",
      marginBottom: "0.5rem",
      fontFamily: "Barlow, sans-serif",
    },
    mainStatsSubtitle: {
      fontSize: "0.875rem",
      color: "#6b7280",
      fontFamily: "Arial, sans-serif",
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
      color: "#dc2626",
      marginBottom: "0.25rem",
    },
    bloodTypeCount: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#dc2626",
      fontFamily: "Barlow, sans-serif",
    },
    bloodTypeLabel: {
      fontSize: "0.75rem",
      fontWeight: 500,
      color: "#111827",
      lineHeight: 1.2,
      fontFamily: "Arial, sans-serif",
    },
    bloodTypeDate: {
      fontSize: "0.625rem",
      color: "#6b7280",
      fontFamily: "Arial, sans-serif",
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

    cardTitle: {
      fontSize: "1.125rem",
      fontWeight: 600,
      color: "#111827",
      margin: "0 0 0.25rem 0",
      fontFamily: "Barlow, sans-serif",
    },
    cardSubtitle: {
      fontSize: "0.875rem",
      color: "#6b7280",
      margin: "0 0 1.5rem 0",
      fontFamily: "Arial, sans-serif",
    },
    expirationSection: {
      marginTop: "1rem",
    },
    expirationTitle: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: "#dc2626",
      margin: "0 0 1rem 0",
      fontFamily: "Barlow, sans-serif",
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
      fontWeight: 500,
      color: "#6b7280",
      paddingBottom: "0.5rem",
      borderBottom: "1px solid #e5e7eb",
      fontFamily: "Barlow",
    },
    tableRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 0.3fr 1fr 0.5fr",
      gap: "0.5rem",
      fontSize: "0.70rem",
      color: "#111827",
      padding: "0.5rem 0",
      alignItems: "center",
      fontFamily: "Arial, sans-serif",
    },
    statusBadge: {
      padding: "0.25rem 0.5rem",
      borderRadius: "0.25rem",
      fontSize: "0.625rem",
      fontWeight: 600,
      textAlign: "center",
      fontFamily: "Arial, sans-serif",
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
      fontSize: "0.7rem",
      fontWeight: 500,
      color: "#111827",
      fontFamily: "Arial, sans-serif",
    },
    componentCount: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#dc2626",
      fontFamily: "Barlow, sans-serif",
    },
    analyticsCard: {
      gridRow: "span 2",
      display: "flex",
      flexDirection: "column",
    },

    chartContainer: {
      width: "100%",
      flex: 1,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      padding: "0.5rem",
      minHeight: "0",
    },
    analyticsChart: {
      width: "90%",
      height: "70%",
      maxHeight: "70%",
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
      fontFamily: "Arial, sans-serif",
    },
    releasedCount: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#dc2626",
      fontFamily: "Barlow, sans-serif",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "white",
      borderRadius: "0.75rem",
      padding: "2rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    errorContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "white",
      borderRadius: "0.75rem",
      padding: "2rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      gap: "1rem",
    },
    errorText: {
      color: "#dc2626",
      fontSize: "1rem",
      textAlign: "center",
    },
    retryButton: {
      padding: "0.5rem 1.5rem",
      backgroundColor: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    noDataText: {
      textAlign: "center",
      color: "#6b7280",
      fontSize: "0.875rem",
      padding: "1rem",
      fontFamily: "Arial, sans-serif",
    },
  };

  if (loading) {
    return (
      <div style={styles.dashboardContainer}>
        <div style={styles.loadingContainer}>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.dashboardContainer}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Error loading dashboard: {error}</p>
          <button style={styles.retryButton} onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const maxQuarterValue = Math.max(
    ...dashboardData.walkInQuarterlyDonations,
    ...dashboardData.mobileQuarterlyDonations,
    1
  );
  const chartHeight = 130;
  const chartWidth = 320;
  const barWidth = 50;
  const spacing = 18;

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.dashboardContent}>
        {/* Main Stats Section */}
        <div style={styles.mainStatsSection}>
          {/* Total Stored Blood - Large Card */}
          <div style={styles.mainStatsCard}>
            <Droplet fill="#dc2626" size={48} style={styles.bloodDropIcon} />
            <div style={styles.mainStatsNumber}>
              {dashboardData.totalStored}
            </div>
            <div style={styles.mainStatsTitle}>Total Stored Blood</div>
            <div style={styles.mainStatsSubtitle}>Updated - {currentDate}</div>
          </div>

          {/* Blood Type Grid */}
          <div style={styles.bloodTypeGrid}>
            {Object.entries(dashboardData.bloodTypes).map(([type, count]) => (
              <div key={type} style={styles.bloodTypeCard}>
                <Droplet
                  fill="#dc2626"
                  size={24}
                  style={styles.bloodTypeIcon}
                />
                <div style={styles.bloodTypeCount}>{count}</div>
                <div style={styles.bloodTypeLabel}>Total Stored {type}</div>
                <div style={styles.bloodTypeDate}>{currentDate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Grid Section */}
        <div style={styles.dashboardGrid}>
          {/* Blood Expiration Report */}
          <div style={styles.dashboardCard}>
            <h3 style={styles.cardTitle}>Blood Expiration Report</h3>
            <p style={styles.cardSubtitle}>
              {new Date().toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
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
                {dashboardData.expiringSoon.length > 0 ? (
                  dashboardData.expiringSoon.map((item, index) => {
                    const status = getStatusBadge(item.daysUntilExpiry);
                    return (
                      <div key={index} style={styles.tableRow}>
                        <span>{item.type}</span>
                        <span>{item.component}</span>
                        <span>{item.units}</span>
                        <span>{formatDate(item.expiration)}</span>
                        <span
                          style={{ ...styles.statusBadge, ...status.style }}
                        >
                          {status.label}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={styles.noDataText}>
                    No blood units expiring soon
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Components Available */}
          <div style={styles.dashboardCard}>
            <h3 style={styles.cardTitle}>Components Available</h3>
            <p style={styles.cardSubtitle}>
              {new Date().toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <div style={styles.componentsList}>
              <div style={styles.componentItem}>
                <span style={styles.componentLabel}>RED BLOOD CELL</span>
                <span style={styles.componentCount}>
                  {dashboardData.components.rbc}
                </span>
              </div>
              <div style={styles.componentItem}>
                <span style={styles.componentLabel}>PLASMA</span>
                <span style={styles.componentCount}>
                  {dashboardData.components.plasma}
                </span>
              </div>
              <div style={styles.componentItem}>
                <span style={styles.componentLabel}>PLATELET</span>
                <span style={styles.componentCount}>
                  {dashboardData.components.platelet}
                </span>
              </div>
            </div>
          </div>

          {/* Blood Donation Analytics */}
          <div style={{ ...styles.dashboardCard, ...styles.analyticsCard }}>
            <h3 style={styles.cardTitle}>Blood Donation Analytics</h3>
            <p style={styles.cardSubtitle}>
              Quarterly participation as of {new Date().getFullYear()}
            </p>

            {/* Walk-In Graph */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#059669",
                  margin: "0 0 0.75rem 0",
                  fontFamily: "Barlow, sans-serif",
                }}
              >
                Walk-In Donations
              </h4>
              <div style={{ ...styles.chartContainer, minHeight: "160px", paddingTop: "20px" }}>
                <svg
                  style={styles.analyticsChart}
                  viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient
                      id="walkInGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="1" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis grid lines */}
                  {[0, 25, 50, 75, 100].map((percent) => {
                    const maxValue = Math.max(
                      ...dashboardData.walkInQuarterlyDonations,
                      1
                    );
                    const y = 20 + chartHeight - (percent / 100) * chartHeight;
                    return (
                      <g key={percent}>
                        <line
                          x1="30"
                          y1={y}
                          x2={chartWidth}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                        <text
                          x="5"
                          y={y + 4}
                          fontSize="10"
                          fill="#6b7280"
                          fontFamily="Arial, sans-serif"
                        >
                          {Math.round((percent / 100) * maxValue)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {dashboardData.walkInQuarterlyDonations.map((value, index) => {
                    const maxValue = Math.max(
                      ...dashboardData.walkInQuarterlyDonations,
                      1
                    );
                    const x = 40 + index * (barWidth + spacing);
                    const barHeight = (value / maxValue) * chartHeight;
                    const y = 20 + chartHeight - barHeight;

                    return (
                      <g key={index}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          fill="url(#walkInGradient)"
                          rx="4"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          fontSize="12"
                          fill="#059669"
                          textAnchor="middle"
                          fontWeight="600"
                          fontFamily="Barlow, sans-serif"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis labels */}
                  {["Q1", "Q2", "Q3", "Q4"].map((label, index) => {
                    const x = 40 + index * (barWidth + spacing) + barWidth / 2;
                    return (
                      <text
                        key={label}
                        x={x}
                        y={20 + chartHeight + 20}
                        fontSize="12"
                        fill="#6b7280"
                        textAnchor="middle"
                        fontFamily="Arial, sans-serif"
                      >
                        {label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Mobile Graph */}
            <div>
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#3b82f6",
                  margin: "0 0 0.75rem 0",
                  fontFamily: "Barlow, sans-serif",
                }}
              >
                Mobile Donations
              </h4>
              <div style={{ ...styles.chartContainer, minHeight: "160px", paddingTop: "20px" }}>
                <svg
                  style={styles.analyticsChart}
                  viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient
                      id="mobileGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis grid lines */}
                  {[0, 25, 50, 75, 100].map((percent) => {
                    const maxValue = Math.max(
                      ...dashboardData.mobileQuarterlyDonations,
                      1
                    );
                    const y = 20 + chartHeight - (percent / 100) * chartHeight;
                    return (
                      <g key={percent}>
                        <line
                          x1="30"
                          y1={y}
                          x2={chartWidth}
                          y2={y}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                        <text
                          x="5"
                          y={y + 4}
                          fontSize="10"
                          fill="#6b7280"
                          fontFamily="Arial, sans-serif"
                        >
                          {Math.round((percent / 100) * maxValue)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {dashboardData.mobileQuarterlyDonations.map((value, index) => {
                    const maxValue = Math.max(
                      ...dashboardData.mobileQuarterlyDonations,
                      1
                    );
                    const x = 40 + index * (barWidth + spacing);
                    const barHeight = (value / maxValue) * chartHeight;
                    const y = 20 + chartHeight - barHeight;

                    return (
                      <g key={index}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          fill="url(#mobileGradient)"
                          rx="4"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          fontSize="12"
                          fill="#3b82f6"
                          textAnchor="middle"
                          fontWeight="600"
                          fontFamily="Barlow, sans-serif"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis labels */}
                  {["Q1", "Q2", "Q3", "Q4"].map((label, index) => {
                    const x = 40 + index * (barWidth + spacing) + barWidth / 2;
                    return (
                      <text
                        key={label}
                        x={x}
                        y={20 + chartHeight + 20}
                        fontSize="12"
                        fill="#6b7280"
                        textAnchor="middle"
                        fontFamily="Arial, sans-serif"
                      >
                        {label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Blood Released */}
          <div style={styles.dashboardCard}>
            <h3 style={styles.cardTitle}>Blood Released</h3>
            <p style={styles.cardSubtitle}>
              {new Date().toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <div style={styles.releasedStats}>
              <div style={styles.releasedItem}>
                <span style={styles.releasedLabel}>RBC</span>
                <span style={styles.releasedCount}>
                  {typeof dashboardData.releasedThisMonth.rbc === 'number' 
                    ? dashboardData.releasedThisMonth.rbc 
                    : 0}
                </span>
              </div>
              <div style={styles.releasedItem}>
                <span style={styles.releasedLabel}>Plasma</span>
                <span style={styles.releasedCount}>
                  {typeof dashboardData.releasedThisMonth.plasma === 'number' 
                    ? dashboardData.releasedThisMonth.plasma 
                    : 0}
                </span>
              </div>
              <div style={styles.releasedItem}>
                <span style={styles.releasedLabel}>Platelet</span>
                <span style={styles.releasedCount}>
                  {typeof dashboardData.releasedThisMonth.platelet === 'number' 
                    ? dashboardData.releasedThisMonth.platelet 
                    : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Drives */}
          <div style={styles.dashboardCard}>
            <h3 style={styles.cardTitle}>Upcoming Drives</h3>
            <p style={styles.cardSubtitle}>
              {new Date().toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
            {upcomingDrives.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                padding: '12px 0',
                maxHeight: '280px',
                overflowY: 'auto'
              }}>
                {upcomingDrives.map((drive, index) => (
                  <div key={index} style={{ 
                    backgroundColor: '#f0f9ff', 
                    padding: '14px', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #3b82f6',
                    minHeight: '120px'
                  }}>
                    <h4 style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      margin: '0 0 10px 0',
                      fontFamily: 'Barlow, sans-serif',
                      lineHeight: '1.3'
                    }}>
                      {drive.title}
                    </h4>
                    <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.5', fontFamily: 'Arial, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Calendar size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <span>{new Date(drive.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Clock size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <span>{drive.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                        <MapPin size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ flex: 1 }}>{drive.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <span>{drive.organization}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noDataText}>No upcoming drives scheduled</div>
            )}
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
      borderRadius: "12px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      maxWidth: "400px",
      width: "90%",
      textAlign: "center",
      animation: "slideIn 0.3s ease-out",
      position: "relative",
    },
    closeButton: {
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
    iconContainer: {
      width: "64px",
      height: "64px",
      backgroundColor: "#fee2e2",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 1.5rem",
    },
    dialogTitle: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#111827",
      margin: "0 0 0.5rem 0",
      fontFamily: "Barlow, sans-serif",
    },
    dialogMessage: {
      color: "#6b7280",
      margin: "0 0 2rem 0",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      fontFamily: "Arial, sans-serif",
    },
    dialogActions: {
      display: "flex",
      gap: "0.75rem",
      justifyContent: "center",
    },
    dialogButton: {
      padding: "0.625rem 1.5rem",
      borderRadius: "6px",
      fontSize: "0.875rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s",
      border: "none",
      fontFamily: "Barlow, sans-serif",
      minWidth: "100px",
    },
    cancelButton: {
      backgroundColor: "#f3f4f6",
      color: "#374151",
    },
    confirmButton: {
      backgroundColor: "#ef4444",
      color: "white",
    },
  };

  if (!isOpen) return null;

  return (
    <div style={styles.dialogOverlay} onClick={onCancel}>
      <div style={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
        <button
          style={styles.closeButton}
          onClick={onCancel}
          className="close-button"
        >
          ×
        </button>

        <div style={styles.iconContainer}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <h3 style={styles.dialogTitle}>Confirm Logout</h3>
        <p style={styles.dialogMessage}>
          Are you sure you want to logout from your account?
        </p>
        <div style={styles.dialogActions}>
          <button
            style={{ ...styles.dialogButton, ...styles.cancelButton }}
            onClick={onCancel}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            style={{ ...styles.dialogButton, ...styles.confirmButton }}
            onClick={onConfirm}
            className="confirm-button"
          >
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

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .close-button:hover {
          background-color: #f3f4f6;
        }

        .cancel-button:hover {
          background-color: #e5e7eb;
        }

        .confirm-button:hover {
          background-color: #dc2626;
        }

        .cancel-button:active {
          background-color: #d1d5db;
        }

        .confirm-button:active {
          background-color: #b91c1c;
        }
      `}</style>
    </div>
  );
};

const Dashboard = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [isMailDropdownOpen, setIsMailDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [partnershipRequests, setPartnershipRequests] = useState([]);
  const [isLoadingMail, setIsLoadingMail] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();
  const [lastCheckedAlerts, setLastCheckedAlerts] = useState(new Set());
  const [notificationsViewed, setNotificationsViewed] = useState(false);
  const [lastCheckedMails, setLastCheckedMails] = useState(new Set());
  const [mailsViewed, setMailsViewed] = useState(false);
  const [hasNewMails, setHasNewMails] = useState(false);
  const [lastNotificationCheck, setLastNotificationCheck] = useState(Date.now());
  const [lastMailCheck, setLastMailCheck] = useState(Date.now());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [hasNewCalendarEvents, setHasNewCalendarEvents] = useState(false);
  const [lastCheckedEvents, setLastCheckedEvents] = useState(new Set());
  const [calendarEventsViewed, setCalendarEventsViewed] = useState(false);
  useEffect(() => {
    const handleNavigateToScreen = (event) => {
      const screen = event.detail;
      handleNavigate(screen);
    };

    window.addEventListener('navigate-to-screen', handleNavigateToScreen);

    return () => {
      window.removeEventListener('navigate-to-screen', handleNavigateToScreen);
    };
  }, []);

  useEffect(() => {
  loadCalendarEvents();
  
  const interval = setInterval(loadCalendarEvents, 30000); 
  
  return () => clearInterval(interval);
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
      color: "white",
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
      top: "calc(100% + 8px)",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      border: "1px solid #e5e7eb",
      zIndex: 50,
      overflow: "hidden",
      animation: "dropdownFadeIn 0.2s ease-out",
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
      fontFamily: 'Barlow',
    },
    dropdownTitle: {
      fontSize: "14px",
      fontWeight: 600,
      letterSpacing: "0.05em",
      color: "white",
      margin: 0,
      fontFamily: "Barlow, sans-serif",
    },
    notificationHeaderContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    notificationHeaderActions: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
    },
    refreshButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "4px",
      transition: "background-color 0.2s",
      color: "white",
    },
    markAllReadButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "4px",
      transition: "background-color 0.2s",
      color: "white",
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
      fontFamily: "Arial, sans-serif",
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
      overflow: "hidden",
      border: "1px solid #059669",
    },
    userAvatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    userAvatarActive: {
      backgroundColor: "#059669",
      color: "white",
    },
    mainContent: {
      padding: "1.5rem",
    },
  };


  const loadCalendarEvents = async () => {
  try {
    setIsLoadingCalendar(true);
    if (window.electronAPI) {
      const appointments = await window.electronAPI.getAllAppointments();
      const partnershipRequests = await window.electronAPI.getAllPartnershipRequests(null);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get upcoming approved/confirmed/scheduled appointments
      const upcomingAppointments = appointments
        .filter(apt => {
          const eventDate = new Date(apt.date + 'T00:00:00');
          return (apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'scheduled') 
            && eventDate >= today;
        })
        .map(apt => ({
          id: apt.appointmentId || apt.id,
          title: apt.title || 'Blood Drive Event',
          date: apt.date,
          time: apt.time,
          location: apt.contactInfo?.address || 'Location TBD',
          organization: apt.contactInfo?.lastName || 'Unknown Organization',
          type: 'appointment',
          is_viewed: apt.is_viewed || false
        }));
      
      // Get upcoming approved/confirmed/scheduled partnerships
      const upcomingPartnerships = partnershipRequests
        .filter(req => {
          const eventDate = new Date(req.event_date + 'T00:00:00');
          return (req.status === 'approved' || req.status === 'confirmed' || req.status === 'scheduled') 
            && eventDate >= today;
        })
        .map(req => ({
          id: req.id,
          title: `Blood Drive Partnership - ${req.contact_name}`,
          date: req.event_date,
          time: req.event_time,
          location: req.event_address || 'Location TBD',
          organization: req.contact_name,
          type: 'partnership',
          is_viewed: req.is_viewed || false
        }));
      
      const allUpcoming = [...upcomingAppointments, ...upcomingPartnerships]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5); // Get top 5
      
      // Check for new events
      const unreadEvents = allUpcoming.filter(evt => !evt.is_viewed);
      const currentEventIds = new Set(unreadEvents.map(e => `${e.type}-${e.id}`));
      
      const newEventsSinceLastCheck = Array.from(currentEventIds).filter(id => !lastCheckedEvents.has(id));
      
      setLastCheckedEvents(currentEventIds);
      
      if (newEventsSinceLastCheck.length > 0 && !isCalendarDropdownOpen) {
        setHasNewCalendarEvents(true);
        console.log(`📅 ${newEventsSinceLastCheck.length} new calendar event(s) detected`);
      } else if (unreadEvents.length === 0) {
        setHasNewCalendarEvents(false);
      }
      
      setCalendarEvents(allUpcoming);
      console.log(`📅 Loaded ${allUpcoming.length} upcoming calendar events (${unreadEvents.length} unread)`);
    }
  } catch (error) {
    console.error('Error loading calendar events:', error);
    setCalendarEvents([]);
  } finally {
    setIsLoadingCalendar(false);
  }
};

const handleCalendarDropdownClick = async () => {
  const wasOpen = isCalendarDropdownOpen;
  
  // Close other dropdowns first
  setIsProfileDropdownOpen(false);
  setIsMailDropdownOpen(false);
  setIsNotificationDropdownOpen(false);
  
  // Toggle the calendar dropdown
  setIsCalendarDropdownOpen(!wasOpen);
  
  if (!wasOpen) {
    console.log('📅 Opening calendar dropdown');
    setHasNewCalendarEvents(false);
    setCalendarEventsViewed(true);
    
    // Mark all visible events as viewed
    if (window.electronAPI) {
      try {
        for (const event of calendarEvents) {
          if (!event.is_viewed) {
            // Mark as viewed in localStorage as fallback
            const viewedIds = JSON.parse(localStorage.getItem('viewedCalendarEventIds') || '[]');
            const eventKey = `${event.type}-${event.id}`;
            if (!viewedIds.includes(eventKey)) {
              viewedIds.push(eventKey);
              localStorage.setItem('viewedCalendarEventIds', JSON.stringify(viewedIds));
            }
          }
        }
      } catch (err) {
        console.warn('Could not mark calendar events as viewed:', err.message);
      }
    }
    
    // Reload events to get fresh data
    await loadCalendarEvents();
  }
};

const handleCalendarItemClick = async (event) => {
  try {
    const eventKey = `${event.type}-${event.id}`;
    const viewedIds = JSON.parse(localStorage.getItem('viewedCalendarEventIds') || '[]');
    if (!viewedIds.includes(eventKey)) {
      viewedIds.push(eventKey);
      localStorage.setItem('viewedCalendarEventIds', JSON.stringify(viewedIds));
    }
    await loadCalendarEvents();
  } catch (error) {
    console.error('Error marking calendar event as viewed:', error);
  }
};

// Replace the loadNotificationCount function (around line 600)
const loadNotificationCount = async () => {
  try {
    if (window.electronAPI) {
      const count = await window.electronAPI.getUnreadNotificationCount();
      console.log('📊 Notification count loaded:', count);
      
      const currentTime = Date.now();
      const countIncreased = !isInitialLoad && count > lastAlertCount && count > 0;
      
      setNotificationCount(count);
    
      if (count > 0 && !isNotificationDropdownOpen) {
        if (countIncreased || currentTime > lastNotificationCheck) {
          setHasNewNotifications(true);
          
          // Play sound only when count increases
          if (countIncreased) {
            console.log('🔊 Playing alert sound for new notifications');
            playAlertSound();
          }
        }
      } else if (count === 0) {
        setHasNewNotifications(false);
      }
      
      setLastAlertCount(count);
      setIsInitialLoad(false);
    }
  } catch (error) {
    console.error('Error loading notification count:', error);
  }
};

const loadStockAlerts = async () => {
  try {
    if (window.electronAPI) {
      const alerts = await window.electronAPI.getStockAlerts();
      console.log('🔔 Stock alerts loaded:', alerts.length);
      
      // Filter out already read alerts
      const unreadAlerts = alerts.filter(alert => !alert.is_read);
      
      // Check for new alerts and play sound for each new one
      if (!isInitialLoad && unreadAlerts.length > 0) {
        const currentAlertIds = new Set(unreadAlerts.map(a => a.notification_id));
        const newAlerts = unreadAlerts.filter(a => !lastCheckedAlerts.has(a.notification_id));
        
        // Play sound for each new alert
        if (newAlerts.length > 0 && !isNotificationDropdownOpen) {
          console.log(`🔊 ${newAlerts.length} new alert(s) detected`);
          playAlertSound();
        }
        
        setLastCheckedAlerts(currentAlertIds);
      } else if (isInitialLoad && unreadAlerts.length > 0) {
        setLastCheckedAlerts(new Set(unreadAlerts.map(a => a.notification_id)));
      }
      
      // Only show unread alerts, limit to 5
      setStockAlerts(unreadAlerts.slice(0, 5));
    }
  } catch (error) {
    console.error('Error loading stock alerts:', error);
  }
};
const handleNotificationDropdownClick = async () => {
  const wasOpen = isNotificationDropdownOpen;
  
  // Close other dropdowns first
  setIsProfileDropdownOpen(false);
  setIsCalendarDropdownOpen(false);
  setIsMailDropdownOpen(false);
  
  // Toggle the notification dropdown
  setIsNotificationDropdownOpen(!wasOpen);
  
  if (!wasOpen) {
    console.log('🔔 Opening notification dropdown - marking as viewed');
    setHasNewNotifications(false);
    setNotificationsViewed(true);
    setLastNotificationCheck(Date.now());
    
    // Mark all visible notifications as read
    if (window.electronAPI && stockAlerts.length > 0) {
      try {
        // Check if the function exists before calling it
        if (typeof window.electronAPI.markNotificationAsRead === 'function') {
          for (const alert of stockAlerts) {
            if (!alert.is_read) {
              await window.electronAPI.markNotificationAsRead(alert.notification_id);
            }
          }
        } else {
          console.warn('markNotificationAsRead function not available, skipping marking as read');
        }
      } catch (err) {
        console.warn('Could not mark notifications as read:', err.message);
      }
    }
    
    // Reload counts and alerts
    await loadNotificationCount();
    await loadStockAlerts();
  }
};


const handleMailDropdownClick = async () => {
  const wasOpen = isMailDropdownOpen;
  
  // Close other dropdowns first
  setIsProfileDropdownOpen(false);
  setIsCalendarDropdownOpen(false);
  setIsNotificationDropdownOpen(false);
  
  // Toggle the mail dropdown
  setIsMailDropdownOpen(!wasOpen);
  
  if (!wasOpen) {
    console.log('📧 Opening mail dropdown');
    setHasNewMails(false);
    setMailsViewed(true);
    setLastMailCheck(Date.now());
    
    // Try to mark all visible items as viewed with better error handling
    if (window.electronAPI) {
      try {
        const unreadRequests = partnershipRequests.filter(req => !req.is_viewed);
        
        // Check if the handler exists before trying to use it
        if (typeof window.electronAPI.markPartnershipRequestAsViewed === 'function') {
          for (const request of unreadRequests) {
            try {
              await window.electronAPI.markPartnershipRequestAsViewed(request.id);
            } catch (err) {
              // Only log once instead of for each request
              if (err.message.includes('No handler registered')) {
                console.warn('⚠️ Backend handler not available, using fallback');
                break; // Stop trying after first failure
              }
            }
          }
        } else {
          console.warn('⚠️ markPartnershipRequestAsViewed function not available');
        }
        
        // Always use localStorage fallback
        const unreadIds = unreadRequests.map(req => req.id);
        const viewedIds = JSON.parse(localStorage.getItem('viewedMailIds') || '[]');
        const updatedViewedIds = [...new Set([...viewedIds, ...unreadIds])];
        localStorage.setItem('viewedMailIds', JSON.stringify(updatedViewedIds));
        
        console.log(`✅ Marked ${unreadIds.length} requests as viewed (localStorage)`);
      } catch (error) {
        console.warn('Error marking mails as viewed:', error.message);
        // Fallback: just track in frontend state
        const unreadIds = partnershipRequests
          .filter(req => !req.is_viewed)
          .map(req => req.id);
        
        const viewedIds = JSON.parse(localStorage.getItem('viewedMailIds') || '[]');
        const updatedViewedIds = [...new Set([...viewedIds, ...unreadIds])];
        localStorage.setItem('viewedMailIds', JSON.stringify(updatedViewedIds));
      }
    }
    
    // Reload mail to get fresh data
    await loadPartnershipRequests();
  }
};

const handleMailItemClick = async (mailId) => {
  try {
    // Try backend first if available
    if (window.electronAPI && typeof window.electronAPI.markPartnershipRequestAsViewed === 'function') {
      try {
        await window.electronAPI.markPartnershipRequestAsViewed(mailId);
        await loadPartnershipRequests();
        return;
      } catch (err) {
        if (err.message.includes('No handler registered')) {
          console.warn('Backend handler not available, using localStorage fallback');
        } else {
          throw err;
        }
      }
    }
    
    // Fallback to localStorage
    const viewedIds = JSON.parse(localStorage.getItem('viewedMailIds') || '[]');
    if (!viewedIds.includes(mailId)) {
      viewedIds.push(mailId);
      localStorage.setItem('viewedMailIds', JSON.stringify(viewedIds));
    }
    await loadPartnershipRequests();
  } catch (error) {
    console.error('Error marking mail as viewed:', error);
  }
};

useEffect(() => {
  if (!isNotificationDropdownOpen && notificationCount > 0) {
    // Only show badge if there are truly NEW notifications after dropdown was closed
    const checkForNewNotifications = async () => {
      const currentCount = await window.electronAPI?.getUnreadNotificationCount();
      if (currentCount > lastAlertCount) {
        setHasNewNotifications(true);
      }
    };
    checkForNewNotifications();
  }
}, [isNotificationDropdownOpen]);

// Check stock alerts on mount and periodically
useEffect(() => {
  const checkStockAlerts = async () => {
    try {
      console.log('🔍 Checking stock alerts...');
      if (window.electronAPI) {
        const result = await window.electronAPI.checkAndCreateStockAlerts();
        console.log('✅ Stock alerts check result:', result);
        
        await loadNotificationCount();
        await loadStockAlerts();
      }
    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  };

  const initialCheck = setTimeout(() => {
    console.log('🚀 Initial stock alert check on login...');
    checkStockAlerts();
  }, 500);

  const interval = setInterval(() => {
    console.log('⏰ Periodic stock alert check...');
    checkStockAlerts();
  }, 5 * 60 * 1000);

  return () => {
    clearTimeout(initialCheck);
    clearInterval(interval);
  };
}, []);

// Play alert sound
const playAlertSound = () => {
  try {
    const audio = new Audio('/assets/alert-notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play failed:", e));
  } catch (error) {
    console.log("Could not play alert sound:", error);
  }
};

// Replace the loadPartnershipRequests function
const loadPartnershipRequests = async () => {
  try {
    setIsLoadingMail(true);
    if (window.electronAPI) {
      const requests = await window.electronAPI.getAllPartnershipRequests(null);
      
      // Get viewed IDs from localStorage as fallback
      const viewedIdsFromStorage = JSON.parse(localStorage.getItem('viewedMailIds') || '[]');
      
      const mappedRequests = requests.map(req => {
        let displayName = 'Unknown Organization';
        let organizationType = 'organization';
        
        if (req.contact_name && 
            req.contact_name.trim() !== '' && 
            req.contact_name !== 'N/A' &&
            req.contact_name.toLowerCase() !== 'null') {
          displayName = req.contact_name;
          organizationType = 'organization';
        } 
        else if (req.organization_barangay && 
                 req.organization_barangay.trim() !== '' && 
                 req.organization_barangay !== 'N/A' &&
                 req.organization_barangay.toLowerCase() !== 'null') {
          displayName = req.organization_barangay;
          organizationType = 'barangay';
        } 
        else if (req.contact_name && req.contact_name.trim() !== '') {
          displayName = req.contact_name;
          organizationType = 'individual';
        }
        
        // Check both database flag and localStorage fallback
        const isViewedInStorage = viewedIdsFromStorage.includes(req.id);
        const isViewed = req.is_viewed || isViewedInStorage;
        
        return {
          ...req,
          displayName: displayName,
          displayTitle: `Blood Drive Partnership - ${displayName}`,
          organizationType: organizationType,
          profile_photo: req.profile_photo || null,
          is_viewed: isViewed // Use combined viewed status
        };
      });
      
      // Count truly unread mails
      const unreadMails = mappedRequests.filter(req => !req.is_viewed);
      const currentMailIds = new Set(unreadMails.map(m => m.id));
      
      // Detect NEW mails
      const newMailsSinceLastCheck = Array.from(currentMailIds).filter(id => !lastCheckedMails.has(id));
      
      setLastCheckedMails(currentMailIds);
      
      // Show badge ONLY for NEW unread mails
      if (newMailsSinceLastCheck.length > 0 && !isMailDropdownOpen) {
        setHasNewMails(true);
        console.log(`📬 ${newMailsSinceLastCheck.length} new mail(s) detected`);
      } else if (unreadMails.length === 0) {
        setHasNewMails(false);
        console.log('📭 No unread mails');
      }
      
      setPartnershipRequests(mappedRequests.slice(0, 5));
      
      console.log(`📊 Loaded ${mappedRequests.length} partnership requests (${unreadMails.length} unread)`);
    }
  } catch (error) {
    console.error("Error loading partnership requests:", error);
  } finally {
    setIsLoadingMail(false);
  }
};



  useEffect(() => {
  loadPartnershipRequests();
  
  const interval = setInterval(loadPartnershipRequests, 5000);
  
  return () => clearInterval(interval);
  }, []);

useEffect(() => {
  if (!isMailDropdownOpen && partnershipRequests.filter(req => !req.is_viewed).length > 0) {
    // Only show badge if there are truly NEW mails after dropdown was closed
    const unreadCount = partnershipRequests.filter(req => !req.is_viewed).length;
    const currentMailIds = new Set(partnershipRequests.filter(req => !req.is_viewed).map(m => m.id));
    const hasNewItems = Array.from(currentMailIds).some(id => !lastCheckedMails.has(id));
    
    if (hasNewItems) {
      setHasNewMails(true);
    }
  }
}, [isMailDropdownOpen]);

  // Load current user and permissions
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userStr = localStorage.getItem("user");

        if (userStr) {
          const user = JSON.parse(userStr);

          // Check if electronAPI exists and has the getUserById method
          if (user.id && window.electronAPI && typeof window.electronAPI.getUserById === 'function') {
            try {
              const freshUserData = await window.electronAPI.getUserById(user.id);

              if (freshUserData) {
                setCurrentUser(freshUserData);
                setUserPermissions(freshUserData.permissions);
                localStorage.setItem("user", JSON.stringify(freshUserData));
              } else {
                // If no fresh data, use cached data
                setCurrentUser(user);
                setUserPermissions(user.permissions);
              }
            } catch (error) {
              console.warn("❌ Could not fetch fresh user data:", error);
              // Fallback to cached data
              setCurrentUser(user);
              setUserPermissions(user.permissions);
            }
          } else {
            setCurrentUser(user);
            setUserPermissions(user.permissions);
          }
        }
      } catch (error) {
        console.error("💥 Error loading current user:", error);
      }
    };

    loadCurrentUser();

    // Listen for permission updates
    const handlePermissionUpdate = async (event) => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.id && window.electronAPI) {
          try {
            const freshUserData = await window.electronAPI.getUserById(user.id);
            if (freshUserData) {
              setCurrentUser(freshUserData);
              setUserPermissions(freshUserData.permissions);
              localStorage.setItem("user", JSON.stringify(freshUserData));
            }
          } catch (error) {
            console.warn("Could not fetch fresh user data on permission update:", error);
          }
        }
      }
    };

    window.addEventListener('userPermissionsUpdated', handlePermissionUpdate);
    
    return () => {
      window.removeEventListener('userPermissionsUpdated', handlePermissionUpdate);
    };
  }, []);


  // Screen permission mapping
  const screenPermissionMap = {
    "dashboard": null,
    "red-blood-cell": "Blood Stock",
    "plasma": "Blood Stock",
    "platelet": "Blood Stock",
    "released-blood": "Released Blood",
    "red-blood-cell-nc": "Non-Conforming",
    "plasma-nc": "Non-Conforming",
    "platelet-nc": "Non-Conforming",
    "donor-record": "Donor Record",
    "released-invoice": "Invoice",
    "discard-invoice-nc": "Invoice",
    "reports": "Reports",
    "recent-activity": "Recent Activity",
  };

  // Updated handleNavigate function for Dashboard.jsx

const handleNavigate = (screen) => {
  // Check if navigating away from profile - refresh user data
  if (activeScreen === "profile" && screen !== "profile") {
    const refreshUserData = async () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.id) {
          try {
            let freshUserData = null;
            
            if (window.electronAPI) {
              freshUserData = await window.electronAPI.getUserById(user.id);
            } else if (window.dbService) {
              freshUserData = await window.dbService.getUserById(user.id);
            }

            if (freshUserData) {
              setCurrentUser(freshUserData);
              setUserPermissions(freshUserData.permissions);
              localStorage.setItem("user", JSON.stringify(freshUserData));
            }
          } catch (error) {
            console.warn("Could not refresh user data:", error);
          }
        }
      }
    };
    
    refreshUserData();
  }

  // SIMPLIFIED permission check - only check visibility
  const permissionKey = screenPermissionMap[screen];
  
  if (permissionKey && userPermissions) {
    const permission = userPermissions[permissionKey];
    // Only check visibility now
    if (!permission || !permission.visibility) {
      console.warn(`🚫 Access denied: Screen not visible - ${screen}`);
      alert(`You don't have permission to access the ${screen.replace('-', ' ')} screen.`);
      return;
    }
  } else if (permissionKey && !userPermissions) {
    console.warn("⚠️ No user permissions found, checking localStorage...");
    // Fallback to localStorage permissions
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const permission = user.permissions?.[permissionKey];
      // Only check visibility
      if (!permission || !permission.visibility) {
        alert(`You don't have permission to access the ${screen.replace('-', ' ')} screen.`);
        return;
        }
      }
    }
   setActiveScreen(screen);
  setIsCalendarDropdownOpen(false);
  setIsMailDropdownOpen(false);
  setIsNotificationDropdownOpen(false);
  setIsProfileDropdownOpen(false);

  // If closing notification dropdown while navigating, ensure badge stays hidden
  if (isNotificationDropdownOpen && notificationsViewed) {
    setHasNewNotifications(false);
  }
  };

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
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
  handleNotificationDropdownClick();
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
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
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
      case "released-invoice":
        return <ReleasedInvoice />;
      case "discard-invoice-nc":
        return <Discarded />;
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
        userPermissions={userPermissions}  
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
                    onClick={handleCalendarDropdownClick}
                  >
                    <Calendar className="w-5 h-5 text-gray-600" />
                    {!isCalendarDropdownOpen && hasNewCalendarEvents && calendarEvents.filter(evt => !evt.is_viewed).length > 0 && (
                      <span style={styles.notificationBadge}>
                        {calendarEvents.filter(evt => !evt.is_viewed).length}
                      </span>
                    )}
                  </button>
                  {isCalendarDropdownOpen && (
                    <div
                      style={{
                        ...styles.dropdownMenu,
                        ...styles.requestsDropdown,
                      }}
                    >
                      <div style={styles.dropdownHeader}>
                        <div style={styles.notificationHeaderContent}>
                          <h3 style={styles.dropdownTitle}>UPCOMING EVENTS</h3>
                          <div style={styles.notificationHeaderActions}>
                            <button
                              style={styles.refreshButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                loadCalendarEvents();
                              }}
                              disabled={isLoadingCalendar}
                              title="Refresh calendar events"
                            >
                              <RefreshCw size={14} style={{
                                animation: isLoadingCalendar ? "spin 1s linear infinite" : "none"
                              }} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={styles.dropdownContent}>
                        {calendarEvents.length > 0 ? (
                          calendarEvents.map((event, index) => {
                            const isUnread = !event.is_viewed;
                            const eventKey = `${event.type}-${event.id}`;
                            const viewedIds = JSON.parse(localStorage.getItem('viewedCalendarEventIds') || '[]');
                            const isViewedInStorage = viewedIds.includes(eventKey);
                            const actuallyUnread = isUnread && !isViewedInStorage;
                            
                            return (
                              <div 
                                key={`${event.type}-${event.id}`}
                                style={{
                                  ...styles.dropdownItem,
                                  backgroundColor: actuallyUnread ? '#f0f9ff' : 'white',
                                  position: 'relative',
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleCalendarItemClick(event)}
                              >
                                {/* Icon */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                  <div
                                    style={{
                                      ...styles.iconCircle,
                                      backgroundColor: actuallyUnread ? '#3b82f6' : '#e5e7eb',
                                      border: `2px solid ${actuallyUnread ? '#3b82f6' : '#9ca3af'}`
                                    }}
                                  >
                                    <svg 
                                      width="16" 
                                      height="16" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke={actuallyUnread ? "white" : "#6b7280"}
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                      <line x1="16" y1="2" x2="16" y2="6"/>
                                      <line x1="8" y1="2" x2="8" y2="6"/>
                                      <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                  </div>
                                </div>
                                
                                {/* Event Details */}
                                <div style={{...styles.requestDetails, flex: 1}}>
                                  <p style={{
                                    ...styles.requestTitle,
                                    fontWeight: actuallyUnread ? '600' : '400',
                                    color: actuallyUnread ? '#111827' : '#6b7280',
                                    fontFamily: 'Barlow'
                                  }}>
                                    {event.title}
                                  </p>
                                  <p style={{
                                    ...styles.requestSubtitle,
                                    color: actuallyUnread ? '#6b7280' : '#9ca3af',
                                    fontFamily: 'Barlow'
                                  }}>
                                    {new Date(event.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })} at {event.time}
                                  </p>
                                  {event.location && (
                                    <p style={{
                                      ...styles.requestSubtitle,
                                      fontSize: '11px',
                                      marginTop: '2px',
                                      color: actuallyUnread ? '#9ca3af' : '#bababaff',
                                      fontFamily: 'Barlow'
                                    }}>
                                      Location: {event.location}
                                    </p>
                                  )}
                                  {event.organization && (
                                    <p style={{
                                      ...styles.requestSubtitle,
                                      fontSize: '11px',
                                      marginTop: '2px',
                                      color: actuallyUnread ? '#9ca3af' : '#bababaff',
                                      fontFamily: 'Barlow'
                                    }}>
                                      Organizer: {event.organization}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Unread indicator (green dot) */}
                                {actuallyUnread && (
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    backgroundColor: '#10b981',
                                    borderRadius: '50%',
                                    marginLeft: '8px',
                                    flexShrink: 0
                                  }} />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div style={styles.dropdownItem}>
                            <div style={styles.requestDetails}>
                              <p style={{...styles.requestSubtitle, fontFamily: 'Arial, sans-serif'}}>
                                No upcoming events
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={styles.dropdownFooter}>
                        <button
                          style={styles.footerButton}
                          onClick={() => {
                            handleNavigate("calendar");
                            setIsCalendarDropdownOpen(false);
                          }}
                        >
                          See All Events
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
                  onClick={handleMailDropdownClick}
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  {!isMailDropdownOpen && hasNewMails && partnershipRequests.filter(req => !req.is_viewed).length > 0 && (
                    <span style={styles.notificationBadge}>
                      {partnershipRequests.filter(req => !req.is_viewed).length}
                    </span>
                  )}
                </button>
                {isMailDropdownOpen && (
                  <div
                    style={{
                      ...styles.dropdownMenu,
                      ...styles.messagesDropdown,
                    }}
                  >
                    <div style={styles.dropdownHeader}>
                      <div style={styles.notificationHeaderContent}>
                        <h3 style={styles.dropdownTitle}>PARTNERSHIP REQUESTS</h3>
                        <div style={styles.notificationHeaderActions}>
                          <button
                            style={styles.refreshButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              loadPartnershipRequests();
                            }}
                            disabled={isLoadingMail}
                            title="Refresh partnership requests"
                          >
                            <RefreshCw size={14} style={{
                              animation: isLoadingMail ? "spin 1s linear infinite" : "none"
                            }} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={styles.dropdownContent}>
                      {partnershipRequests.length > 0 ? (
                      partnershipRequests.map((request) => {
                        const displayName = request.displayName;
                        const organizationType = request.organizationType;
                        
                        const avatar = displayName
                          .split(' ')
                          .map(word => word[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase();
                        
                        // Check if this mail is truly unread from database
                        const isUnread = !request.is_viewed;
                        
                        return (
                          <div 
                            key={request.id} 
                            style={{
                              ...styles.dropdownItem,
                              backgroundColor: isUnread ? '#f0f9ff' : 'white',
                              position: 'relative',
                              cursor: 'pointer'
                            }}
                            onClick={async () => {
                              // Mark as viewed when clicked
                              if (isUnread) {
                                try {
                                  if (window.electronAPI && typeof window.electronAPI.markPartnershipRequestAsViewed === 'function') {
                                    await window.electronAPI.markPartnershipRequestAsViewed(request.id);
                                  } else {
                                    // Fallback: store in localStorage
                                    const viewedIds = JSON.parse(localStorage.getItem('viewedMailIds') || '[]');
                                    if (!viewedIds.includes(request.id)) {
                                      viewedIds.push(request.id);
                                      localStorage.setItem('viewedMailIds', JSON.stringify(viewedIds));
                                    }
                                  }
                                  await loadPartnershipRequests();
                                } catch (err) {
                                  console.warn('Could not mark as viewed:', err.message);
                                  // Still reload to update UI
                                  await loadPartnershipRequests();
                                }
                              }
                            }}
                          >
                            {/* Avatar/Profile Photo */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              {request.profile_photo ? (
                                <img
                                  src={request.profile_photo}
                                  alt={displayName}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                style={{
                                  ...styles.messageAvatar,
                                  ...styles.blueAvatar,
                                  display: request.profile_photo ? 'none' : 'flex',
                                  fontFamily: 'Barlow', 
                                  fontWeight: 'bold',
                                  fontSize: '12px', 
                                }}
                              >
                                {avatar}
                              </div>
                            </div>
                            
                            {/* Message Details */}
                            <div style={{...styles.requestDetails, flex: 1}}>
                              <p style={{
                                ...styles.requestTitle,
                                fontWeight: isUnread ? '600' : '400',
                                color: isUnread ? '#111827' : '#6b7280',
                                fontFamily: 'Barlow'
                              }}>
                                {displayName}
                                {organizationType === 'barangay' && (
                                  <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '6px' }}>
                                    (Barangay)
                                  </span>
                                )}
                              </p>
                              <p style={{
                                ...styles.requestSubtitle,
                                color: isUnread ? '#6b7280' : '#9ca3af',
                                fontFamily: 'Barlow'
                              }}>
                                Blood Drive - {new Date(request.event_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              {request.event_address && (
                                <p style={{
                                  ...styles.requestSubtitle,
                                  fontSize: '11px',
                                  marginTop: '2px',
                                  color: isUnread ? '#9ca3af' : '#d1d5db',
                                  fontFamily: 'Barlow'
                                }}>
                                  Organization: {request.event_address}
                                </p>
                              )}
                            </div>
                            
                            {/* Unread indicator - only show if truly unread */}
                            {isUnread && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                marginLeft: '8px',
                                flexShrink: 0
                              }} />
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div style={styles.dropdownItem}>
                        <div style={styles.requestDetails}>
                          <p style={{...styles.requestSubtitle, fontFamily: 'Barlow'}}>
                            No partnership requests
                          </p>
                        </div>
                      </div>
                    )}
                    </div>
                    <div style={styles.dropdownFooter}>
                      <button
                        style={styles.footerButton}
                        onClick={() => handleNavigate("mail")}
                      >
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
                  {/* FIXED: Change the condition here */}
                  {!isNotificationDropdownOpen && hasNewNotifications && notificationCount > 0 && (
                    <span style={styles.notificationBadge}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>
                {isNotificationDropdownOpen && (
                  <div
                    style={{
                      ...styles.dropdownMenu,
                      ...styles.notificationsDropdown,
                    }}
                  >
                    <div style={styles.dropdownHeader}>
                      <div style={styles.notificationHeaderContent}>
                        <h3 style={styles.dropdownTitle}>NOTIFICATIONS</h3>
                        <div style={styles.notificationHeaderActions}>
                          <button
                            style={styles.refreshButton}
                            onClick={async (e) => {
                              e.stopPropagation();
                              await window.electronAPI.checkAndCreateStockAlerts();
                              await loadNotificationCount();
                              await loadStockAlerts();
                            }}
                            title="Refresh notifications"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={styles.dropdownContent}>
                      {stockAlerts.length > 0 ? (
                        stockAlerts.map((alert, index) => {
                          const iconColor = 
                            alert.priority === 'critical' ? '#ef4444' :
                            alert.priority === 'urgent' ? '#eab308' :
                            '#f97316';
                          
                          const isUnread = !alert.is_read;
                          
                          return (
                            <div 
                              key={alert.notification_id || index}
                              style={{
                                ...styles.dropdownItem,
                                backgroundColor: isUnread ? '#f0f9ff' : 'white',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                                 onClick={async () => {
                                // Mark as read when clicked
                                if (isUnread && window.electronAPI) {
                                  try {
                                    // Check if the function exists before calling it
                                    if (typeof window.electronAPI.markNotificationAsRead === 'function') {
                                      await window.electronAPI.markNotificationAsRead(alert.notification_id);
                                      await loadNotificationCount();
                                      await loadStockAlerts();
                                    } else {
                                      console.warn('markNotificationAsRead function not available');
                                      // Fallback: Just reload the data
                                      await loadNotificationCount();
                                      await loadStockAlerts();
                                    }
                                  } catch (err) {
                                    console.warn('Could not mark notification as read:', err);
                                    // Still try to reload data
                                    await loadNotificationCount();
                                    await loadStockAlerts();
                                  }
                                }
                                handleNavigate('notification');
                                setIsNotificationDropdownOpen(false);
                              }}
                            >
                              <div>
                                <div style={{ 
                                  ...styles.iconCircle, 
                                  backgroundColor: 'transparent',
                                  border: `2px solid ${iconColor}`
                                }}>
                                  <svg 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke={iconColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                  </svg>
                                </div>
                              </div>
                              <div style={{...styles.requestDetails, flex: 1}}>
                                <p style={{
                                  ...styles.requestTitle,
                                  fontFamily: 'Barlow',
                                  fontWeight: isUnread ? '600' : '400',
                                  color: isUnread ? '#111827' : '#6b7280'
                                }}>
                                  {alert.title}
                                </p>
                                <p style={{
                                  ...styles.requestSubtitle,
                                  fontFamily: 'Barlow',
                                  color: isUnread ? '#6b7280' : '#9ca3af'
                                }}>
                                  {alert.message.substring(0, 50)}...
                                </p>
                              </div>
                              {/* Unread indicator (red dot) */}
                              {isUnread && (
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  backgroundColor: '#ef4444',
                                  borderRadius: '50%',
                                  marginLeft: '8px',
                                  flexShrink: 0
                                }} />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div style={styles.dropdownItem}>
                          <div style={styles.requestDetails}>
                            <p style={{...styles.requestSubtitle, fontFamily: 'Barlow'}}>
                              No new notifications
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={styles.dropdownFooter}>
                      <button
                        style={styles.footerButton}
                        onClick={() => {
                          handleNavigate("notification");
                          setIsNotificationDropdownOpen(false);
                        }}
                      >
                        See All Notifications ({notificationCount})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Section - FIXED */}
              <div style={styles.userSection}>
                <span style={styles.userName}>
                  {currentUser?.fullName || "Loading..."}
                </span>
                <div style={styles.dropdownContainer}>
                  <div
                    style={{
                      ...styles.userAvatar,
                      ...(activeScreen === "profile" ? styles.userAvatarActive : {}),
                    }}
                    onClick={toggleProfileDropdown}
                  >
                    {currentUser?.profileImage ? (
                      <img
                        src={currentUser.profileImage}
                        alt={currentUser.fullName || "User"}
                        style={styles.userAvatarImage}
                        onError={(e) => {
                          console.error("Failed to load profile image");
                          // Hide broken image and show default icon
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>

                  {isProfileDropdownOpen && (
                    <div style={{ ...styles.dropdownMenu, ...styles.profileDropdown }}>
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

        .user-avatar {
          position: relative;
        }
        
        .user-avatar img {
          transition: opacity 0.3s ease;
        }
        
        .user-avatar .default-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: none;
        }
        
        .user-avatar img:error + .default-icon {
          display: block;
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

export default Dashboard;
