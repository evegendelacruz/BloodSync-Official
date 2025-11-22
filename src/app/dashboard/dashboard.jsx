import React, { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Mail, Bell, User, Droplet, RefreshCw, MoreVertical, CheckCircle, XCircle, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const [error, setError] = useState(null);
  const [upcomingDrives, setUpcomingDrives] = useState([]);
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
        console.log("✅ Using window.electronAPI");

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

        console.log("✅ Raw Released Data:", {
          rbc: releasedRBC,
          plasma: releasedPlasma,
          platelet: releasedPlatelet,
        });

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
        console.log("✅ Using dbService directly");
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
          console.log('Fetching history for year:', yearNumber);
          
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
          
          console.log('Walk-In Quarterly Data:', walkInQuarterlyData);
          console.log('Mobile Quarterly Data:', mobileQuarterlyData);
          
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

      console.log('Walk-In Quarterly Data (Fallback):', walkInQuarterlyData);
      console.log('Mobile Quarterly Data (Fallback):', mobileQuarterlyData);

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

  // Upcoming drives helper functions
  const getEventDisplay = (status, dateString) => {
    const eventDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today && (status === 'confirmed' || status === 'approved' || status === 'scheduled')) {
      return { text: 'Finished', className: 'finished' };
    }

    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'scheduled':
        return { text: 'Upcoming', className: 'upcoming' };
      case 'declined':
      case 'cancelled':
        return { text: 'Declined', className: 'declined' };
      default:
        return { text: status, className: 'default' };
    }
  };

  const getEventStatus = (dateStr, status) => {
    if (status === 'cancelled' || status === 'declined') return status;
    const eventDate = new Date(dateStr + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today ? 'finished' : 'confirmed';
  };

  const getEventStatusColor = (status, dateString) => {
    const dynamicStatus = getEventStatus(dateString, status);
    switch (dynamicStatus) {
      case 'confirmed': return '#3b82f6';
      case 'finished': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'declined': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes || '00'} ${ampm}`;
  };

  // Fetch upcoming drives
  useEffect(() => {
    const fetchUpcomingDrives = async () => {
      try {
        if (!window.electronAPI) {
          setUpcomingDrives([]);
          return;
        }

        const partnershipRequests = await window.electronAPI.getAllPartnershipRequests(null);
        const localAppointments = await window.electronAPI.getAllAppointments();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingPartnerships = (partnershipRequests || [])
          .filter(req => {
            const eventDate = new Date(req.event_date + 'T00:00:00');
            return (req.status === 'approved' || req.status === 'confirmed' || req.status === 'scheduled') && eventDate >= today;
          })
          .map(req => ({
            id: `partnership-${req.id}`,
            event_date: req.event_date,
            event_time: req.event_time,
            organization_name: req.organization_name,
            event_address: req.event_address,
            organization_barangay: req.organization_barangay,
            status: req.status
          }));

        const upcomingLocal = (localAppointments || [])
          .filter(apt => {
            const eventDate = new Date(apt.date + 'T00:00:00');
            return (apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'scheduled') && eventDate >= today;
          })
          .map(apt => ({
            id: apt.id || apt.appointment_id,
            event_date: apt.date,
            event_time: apt.time,
            organization_name: apt.title || `Blood Drive - ${apt.contactInfo?.lastName || 'Event'}`,
            event_address: apt.contactInfo?.address || apt.address,
            organization_barangay: apt.contactInfo?.barangay || '',
            status: apt.status
          }));

        const allUpcoming = [...upcomingPartnerships, ...upcomingLocal]
          .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
          .slice(0, 3);

        setUpcomingDrives(allUpcoming);
      } catch (error) {
        console.error('[Dashboard] Error fetching upcoming drives:', error);
        setUpcomingDrives([]);
      }
    };

    fetchUpcomingDrives();
  }, []);

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
    upcomingDrives: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      maxHeight: "200px",
      overflowY: "auto",
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

          {/* Upcoming Drive */}
          <div style={styles.dashboardCard}>
            <h3 style={styles.cardTitle}>Upcoming Drive</h3>
            <p style={styles.cardSubtitle}>Next 3 scheduled events</p>
            <div style={styles.upcomingDrives}>
              {loading ? (
                <div style={{ ...styles.driveText, color: '#6b7280' }}>Loading events...</div>
              ) : upcomingDrives.length === 0 ? (
                <div style={{ ...styles.driveText, color: '#6b7280', textAlign: 'center' }}>
                  No upcoming drives scheduled.
                </div>
              ) : (
                upcomingDrives.map(event => {
                  const eventDisplay = getEventDisplay(event.status, event.event_date);
                  const eventDate = new Date(event.event_date + 'T00:00:00');

                  return (
                    <div
                      key={event.id}
                      className="event-card"
                      style={{ borderLeftColor: getEventStatusColor(event.status, event.event_date) }}
                    >
                      <div className="event-card-header">
                        <h4 className="event-title">{event.organization_name}</h4>
                        <span className={`event-status status-${eventDisplay.className}`}>
                          {eventDisplay.text}
                        </span>
                      </div>

                      <div className="event-details">
                        <div className="event-detail">
                          <Calendar size={14} />
                          <span>{eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="event-detail">
                          <Clock size={14} />
                          <span>{formatTime(event.event_time)}</span>
                        </div>
                        <div className="event-detail">
                          <MapPin size={14} />
                          <span>{event.event_address || event.organization_barangay}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Event card styles */
        .event-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          border-left-width: 4px;
        }

        .event-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .event-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          line-height: 1.4;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          flex: 1;
          margin-right: 12px;
        }

        .event-status {
          font-size: 11px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          white-space: nowrap;
        }

        .status-upcoming {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .status-finished {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-declined {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .status-default {
          background-color: #f3f4f6;
          color: #4b5563;
        }

        .event-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .event-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #6b7280;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
        }

        .event-detail svg {
          color: #9ca3af;
          flex-shrink: 0;
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
  const navigate = useNavigate();

  // Enhanced dropdown states
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeNotificationMenu, setActiveNotificationMenu] = useState(null);
  const [mailMessages, setMailMessages] = useState([]);
  const mailIntervalRef = useRef(null);
  const [isLoadingMail, setIsLoadingMail] = useState(false);
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Helper functions for dropdowns
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'declined': return '#ef4444';
      case 'info': return '#3b82f6';
      case 'warning': return '#f97316';
      case 'CRITICAL': return '#dc2626';
      case 'URGENT': return '#f59e0b';
      case 'STOCK ALERT': return '#fb923c';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={14} />;
      case 'declined': return <XCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return <Bell size={14} />;
    }
  };

  useEffect(() => {
    // Function to load user data
    const loadUser = () => {
      // Check for 'user' key (based on your logout function) or 'currentUser'
      const userStr = localStorage.getItem("user") || localStorage.getItem("currentUser");
      
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setCurrentUser(userData);
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
    };

    // Load immediately
    loadUser();
  }, []);

  const getNotificationMainIcon = (notification) => {
    return getStatusIcon(notification.status);
  };

  const getNotificationIconStyle = (notification) => {
    const statusColor = getStatusColor(notification.status);
    return {
      backgroundColor: `${statusColor}15`,
      border: `1px solid ${statusColor}30`
    };
  };

  const getMailStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'declined': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      if (window.electronAPI) {
        // Get current user ID from localStorage
        const userStr = localStorage.getItem("user") || localStorage.getItem("currentUser");
        let userId = null;
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            userId = userData?.u_id || userData?.id;
          } catch (e) {
            console.error("Error parsing user data for notifications", e);
          }
        }
        const notificationsData = await window.electronAPI.getAllNotifications(userId);

        const transformedNotifications = (notificationsData || []).map(n => ({
          id: n.id,
          type: n.notification_type || n.type || 'info',
          title: n.title || 'Notification',
          message: n.message,
          description: n.description,
          status: n.status || 'unread',
          priority: n.priority,
          timestamp: new Date(n.created_at),
          read: n.is_read === true || n.is_read === 1,
          requestor: n.requestor || 'System'
        }));

        const allNotifications = transformedNotifications.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return b.timestamp - a.timestamp;
        });

        setNotifications(allNotifications);
        setUnreadNotificationCount(allNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  const getLatestNotifications = () => {
    return notifications
      .sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return b.timestamp - a.timestamp;
      })
      .slice(0, 5);
  };

  // Load mail messages
  const loadMailMessages = async () => {
    try {
      setIsLoadingMail(true);
      if (window.electronAPI) {
        // Load partnership requests
        const requests = await window.electronAPI.getAllPartnershipRequests();

        // Load pending donor record sync requests
        const syncRequests = await window.electronAPI.getPendingSyncRequests();

        const readMailIds = JSON.parse(localStorage.getItem('rbcReadMailIds') || '[]');

        // Map partnership requests
        const mailsFromRequests = (requests || []).map(r => {
          const avatar = r.organization_name ? r.organization_name.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase() : 'UN';
          const avatarColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
          const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

          return {
            id: `partnership-${r.id}`,
            from: `${r.organization_name} (${r.organization_barangay})`,
            subject: `Blood Drive Partnership Request`,
            preview: `${r.organization_name} has requested a blood drive partnership for ${new Date(r.event_date).toLocaleDateString()}.`,
            avatar: avatar,
            avatarColor: avatarColor,
            read: readMailIds.includes(`partnership-${r.id}`) || r.status !== 'pending',
            status: r.status || 'pending',
            type: 'partnership'
          };
        });

        // Group sync requests by source organization and user
        const groupedSyncRequests = (syncRequests || []).reduce((acc, record) => {
          const key = `${record.source_organization}-${record.source_user_id}`;
          if (!acc[key]) {
            acc[key] = {
              source_organization: record.source_organization,
              source_user_name: record.source_user_name,
              donors: []
            };
          }
          acc[key].donors.push(record);
          return acc;
        }, {});

        // Map donor record sync requests
        const mailsFromSyncRequests = Object.values(groupedSyncRequests).map(group => {
          const orgType = group.source_organization?.toLowerCase().includes('barangay') ? 'Barangay' : 'Organization';
          const avatar = group.source_user_name ? group.source_user_name.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase() : 'SR';
          const avatarColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
          const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

          return {
            id: `sync-${group.source_user_name}-${group.source_organization}`,
            from: `${group.source_user_name} (${orgType})`,
            subject: `Incoming Record Sync Request`,
            preview: `This partner ${group.source_user_name} (${orgType}) would like to approve their new ${group.donors.length} pending donor records. Proceed to Donor Record Page.`,
            avatar: avatar,
            avatarColor: avatarColor,
            read: readMailIds.includes(`sync-${group.source_user_name}-${group.source_organization}`),
            status: 'pending',
            type: 'sync'
          };
        });

        // Combine both types and show the 5 most recent
        const allMails = [...mailsFromRequests, ...mailsFromSyncRequests]
          .sort((a, b) => {
            // Sort by unread first, then by type (sync requests first among unread)
            if (a.read === b.read) {
              return a.type === 'sync' ? -1 : 1;
            }
            return a.read ? 1 : -1;
          })
          .slice(0, 5);

        setMailMessages(allMails);
      }
    } catch (error) {
      console.error('Error loading mail messages:', error);
    } finally {
      setIsLoadingMail(false);
    }
  };

  // Load calendar appointments
  const loadCalendarAppointments = async () => {
    try {
      setIsLoadingCalendar(true);
      if (window.electronAPI) {
        const partnershipRequests = await window.electronAPI.getAllPartnershipRequests(null);
        const localAppointments = await window.electronAPI.getAllAppointments();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingPartnerships = (partnershipRequests || [])
          .filter(req => {
            const eventDate = new Date(req.event_date + 'T00:00:00');
            return (req.status === 'approved' || req.status === 'confirmed' || req.status === 'scheduled') && eventDate >= today;
          })
          .map(req => ({
            id: `partnership-${req.id}`,
            event_date: req.event_date,
            event_time: req.event_time,
            organization_name: req.organization_name,
            status: req.status
          }));

        const upcomingLocal = (localAppointments || [])
          .filter(apt => {
            const eventDate = new Date(apt.date + 'T00:00:00');
            return (apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'scheduled') && eventDate >= today;
          })
          .map(apt => ({
            id: apt.id || apt.appointment_id,
            event_date: apt.date,
            event_time: apt.time,
            organization_name: apt.title || `Blood Drive - ${apt.contactInfo?.lastName || 'Event'}`,
            status: apt.status
          }));

        const allUpcoming = [...upcomingPartnerships, ...upcomingLocal]
          .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
          .slice(0, 5);

        setCalendarAppointments(allUpcoming);
      }
    } catch (error) {
      console.error('Error loading calendar appointments:', error);
      setCalendarAppointments([]);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Dropdown action handlers
  const handleRefreshNotifications = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const markAllAsRead = async () => {
    try {
      if (window.electronAPI) {
        const userId = currentUser?.u_id || currentUser?.id;
        await window.electronAPI.markAllNotificationsAsRead(userId);
      }
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const markAllMailAsRead = async () => {
    try {
      const ids = mailMessages.map(m => m.id);
      const existing = JSON.parse(localStorage.getItem('rbcReadMailIds') || '[]');
      const mergedIds = Array.from(new Set([...existing, ...ids]));
      localStorage.setItem('rbcReadMailIds', JSON.stringify(mergedIds));
      setMailMessages(prev => prev.map(m => ({ ...m, read: true })));
    } catch (e) {
      console.error('Error marking all messages as read:', e);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadNotifications();
    loadMailMessages();
    loadCalendarAppointments();

    const notifInterval = setInterval(loadNotifications, 30000);
    mailIntervalRef.current = setInterval(loadMailMessages, 30000);
    const calendarInterval = setInterval(loadCalendarAppointments, 30000);

    return () => {
      clearInterval(notifInterval);
      if (mailIntervalRef.current) clearInterval(mailIntervalRef.current);
      clearInterval(calendarInterval);
    };
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

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
      top: "100%",
      marginTop: "0.5rem",
      backgroundColor: "white",
      borderRadius: "0.5rem",
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
      color: "white",
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
    localStorage.removeItem("user"); // Clear user session
    console.log("Logging out...");
    navigate("/login"); // Navigate to login page
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
                  <div className="dropdown-menu requests-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">UPCOMING EVENTS</h3>
                        <button
                          className={`refresh-button ${isLoadingCalendar ? 'refreshing' : ''}`}
                          onClick={loadCalendarAppointments}
                          disabled={isLoadingCalendar}
                          title="Refresh appointments"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {isLoadingCalendar ? (
                        <div className="dropdown-item">
                          <div className="loading-mail-content">
                            <RefreshCw size={16} className="loading-icon" />
                            <span className="loading-text">Loading appointments...</span>
                          </div>
                        </div>
                      ) : calendarAppointments.length === 0 ? (
                        <div className="dropdown-item">
                          <div className="empty-mail-content">
                            <Calendar size={20} color="#d1d5db" />
                            <span className="empty-text">No upcoming events</span>
                          </div>
                        </div>
                      ) : (
                        calendarAppointments.map((appointment) => {
                          const eventDate = new Date(appointment.event_date + 'T00:00:00');
                          const formattedDate = eventDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                          return (
                            <div
                              key={appointment.id}
                              className="dropdown-item"
                              onClick={() => handleNavigate("calendar")}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="request-icon">
                                <div className="icon-circle" style={{ backgroundColor: '#165C3C' }}>
                                  <span style={{ fontSize: '14px' }}>🩸</span>
                                </div>
                              </div>
                              <div className="request-details">
                                <p className="request-title" style={{ marginBottom: '4px' }}>
                                  Blood Drive Partnership - {appointment.organization_name}
                                </p>
                                <p className="request-subtitle" style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                                  Date: {formattedDate}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("calendar")}>
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
                  onClick={toggleMailDropdown}
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  {mailMessages.filter(m => !m.read).length > 0 && (
                    <span className="notification-badge">{mailMessages.filter(m => !m.read).length}</span>
                  )}
                </button>
                {isMailDropdownOpen && (
                  <div className="dropdown-menu messages-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">MESSAGES</h3>
                        <div className="notification-header-actions">
                          <button
                            className={`refresh-button ${isLoadingMail ? 'refreshing' : ''}`}
                            onClick={loadMailMessages}
                            disabled={isLoadingMail}
                            title="Refresh messages"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            className="mark-all-read-button"
                            onClick={markAllMailAsRead}
                            disabled={mailMessages.filter(m => !m.read).length === 0}
                            title="Mark all as read"
                          >
                            <CheckCircle size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {isLoadingMail ? (
                        <div className="dropdown-item">
                          <div className="loading-mail-content">
                            <RefreshCw size={16} className="loading-icon" />
                            <span className="loading-text">Loading messages...</span>
                          </div>
                        </div>
                      ) : mailMessages.length === 0 ? (
                        <div className="dropdown-item">
                          <div className="empty-mail-content">
                            <Mail size={20} color="#d1d5db" />
                            <span className="empty-text">No messages</span>
                          </div>
                        </div>
                      ) : (
                        mailMessages.map((mail) => (
                          <div
                            key={mail.id}
                            className={`dropdown-item ${!mail.read ? 'unread-mail' : ''}`}
                            onClick={() => handleNavigate("mail")}
                          >
                            <div
                              className="message-avatar"
                              style={{ backgroundColor: mail.avatarColor }}
                            >
                              {mail.avatar}
                            </div>
                            <div className="message-details">
                              <div className="message-header-row">
                                <p className="message-sender">{mail.from}</p>
                                <div
                                  className="mail-status-dot"
                                  style={{ backgroundColor: getMailStatusColor(mail.status) }}
                                  title={mail.status.toUpperCase()}
                                ></div>
                              </div>
                              <p className="message-subject">{mail.subject}</p>
                              <p className="message-preview">{mail.preview}</p>
                            </div>
                            {!mail.read && <div className="unread-dot-dropdown"></div>}
                          </div>
                        ))
                      )}
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
              <div style={styles.dropdownContainer}>
                <button
                  style={{
                    ...styles.navButton,
                    ...(activeScreen === "notification" ? styles.navButtonActive : {}),
                  }}
                  onClick={toggleNotificationDropdown}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                {isNotificationDropdownOpen && (
                  <div className="dropdown-menu notifications-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">NOTIFICATIONS</h3>
                        <div className="notification-header-actions">
                          <button
                            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
                            onClick={handleRefreshNotifications}
                            disabled={isRefreshing}
                            title="Refresh notifications"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            className="mark-all-read-button"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            title="Mark all as read"
                          >
                            Mark all read
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {getLatestNotifications().map((notification) => (
                        <div
                          key={notification.id}
                          className={`dropdown-item notification-item ${!notification.read ? 'unread-notification' : ''}`}
                          onClick={() => handleNavigate("notification")}
                          style={{ cursor: 'pointer' }}
                        >
                          <div
                            className="notification-icon"
                            style={{ color: getStatusColor(notification.status) }}
                          >
                            <div className="icon-circle" style={getNotificationIconStyle(notification)}>
                              {getNotificationMainIcon(notification)}
                            </div>
                          </div>
                          <div className="notification-details">
                            <div className="notification-header-row">
                              <p className="notification-title">{notification.title}</p>
                              <div className="notification-actions">
                                <span className="notification-time">{getTimeAgo(notification.timestamp)}</span>
                              </div>
                            </div>
                            <p className="notification-subtitle">
                              {notification.description && notification.description.length > 60
                                ? `${notification.description.substring(0, 60)}...`
                                : notification.description || notification.message || 'No message content'}
                            </p>
                            <span className="notification-requestor">From: {notification.requestor || 'System'}</span>
                          </div>
                          {!notification.read && <div className="unread-dot-dropdown"></div>}
                        </div>
                      ))}
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
          font-family: 'Barlow', sans-serif;
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
          width: 350px;
          max-height: 500px;
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
          font-family: 'Barlow', sans-serif;
        }

        .dropdown-content {
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown-content::-webkit-scrollbar {
          width: 6px;
        }

        .dropdown-content::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .dropdown-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .dropdown-item {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }

        .dropdown-item:hover {
          background-color: #f9fafb;
        }

        .dropdown-item:last-child {
          border-bottom: none;
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

        .request-icon, .notification-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
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
          font-family: 'Barlow', sans-serif;
        }

        .request-subtitle, .notification-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
          font-family: 'Barlow', sans-serif;
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
          font-family: 'Barlow', sans-serif;
        }

        .message-details {
          flex: 1;
          min-width: 0;
        }

        .message-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .message-sender {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin: 0;
          line-height: 1.25;
          font-family: 'Barlow', sans-serif;
          flex: 1;
        }

        .message-subject {
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 4px 0;
          font-family: 'Barlow', sans-serif;
        }

        .message-preview {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
          font-family: 'Barlow', sans-serif;
        }

        .mail-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
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
          font-family: 'Barlow', sans-serif;
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

        /* Enhanced Dropdown Styles */
        .notification-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .notification-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .refresh-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .refresh-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .refresh-button.refreshing {
          animation: spin 1s linear infinite;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .mark-all-read-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.7rem;
          font-family: 'Barlow';
          font-weight: 500;
          transition: all 0.2s;
        }

        .mark-all-read-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .notification-item {
          position: relative;
        }

        .notification-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .notification-time {
          font-size: 0.6875rem;
          color: #9ca3af;
          font-family: 'Barlow';
          white-space: nowrap;
        }

        .notification-requestor {
          font-size: 0.6875rem;
          color: #9ca3af;
          font-family: 'Barlow';
        }

        .unread-notification {
          background-color: #f0fdf4;
        }

        .unread-mail {
          background-color: #f0fdf4;
        }

        .unread-dot-dropdown {
          position: absolute;
          top: 12px;
          right: 8px;
          width: 6px;
          height: 6px;
          background-color: #10b981;
          border-radius: 50%;
          z-index: 1;
        }

        .loading-mail-content, .empty-mail-content {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 1rem;
          color: #6b7280;
          font-size: 0.875rem;
          font-family: 'Barlow', sans-serif;
        }

        .loading-icon {
          animation: spin 1s linear infinite;
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
