// ProfileActivity.jsx
import React, { useState, useEffect } from "react";
import { User, ChevronLeft, ChevronRight } from "lucide-react";

const ProfileActivityOrg = ({ userId }) => {
  const [activities, setActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 6;

  const styles = {
    container: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "32px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "-7px",
      fontFamily: "Barlow",
    },
    dateSection: {
      marginBottom: "24px",
    },
    dateTitle: {
      fontSize: "14px",
      marginBottom: "24px",
      color: "#1f2937",
    },
    activityList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      minHeight: "400px",
    },
    activityItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "16px",
      padding: "0",
    },
    iconContainer: {
      width: "32px",
      height: "32px",
      backgroundColor: "#f3f4f6",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    activityContent: {
      flex: "1",
      paddingTop: "4px",
    },
    activityText: {
      fontSize: "12px",
      color: "#1f2937",
      margin: "0",
      lineHeight: "1.4",
      fontFamily: "Arial",
    },
    activityTime: {
      fontSize: "12px",
      color: "#6b7280",
      paddingTop: "4px",
      flexShrink: 0,
      fontFamily: "Arial",
    },
    pagination: {
      backgroundColor: "white",
      padding: "11px 2px",
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
      display: "flex",
      alignItems: "center",
      gap: "4px",
      transition: "color 0.2s",
    },
    paginationButtonDisabled: {
      fontSize: "14px",
      color: "#d1d5db",
      backgroundColor: "transparent",
      border: "none",
      cursor: "not-allowed",
      padding: "4px 8px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    paginationText: {
      fontSize: "12px",
      color: "#6b7280",
      fontFamily: "Arial",
    },
    loadingText: {
      textAlign: "center",
      color: "#6b7280",
      fontSize: "14px",
      padding: "40px",
    },
    emptyText: {
      textAlign: "center",
      color: "#6b7280",
      fontSize: "14px",
      padding: "40px",
    },
  };

  useEffect(() => {
    if (userId) {
      fetchActivities();
    }
  }, [currentPage, userId]);

  const fetchActivities = async () => {
  setLoading(true);
  try {
    const offset = (currentPage - 1) * itemsPerPage;
    
    console.log('🔍 Fetching activities for user:', userId, 'Page:', currentPage);
    
    // Use Electron IPC to call database methods
    const logs = await window.electronAPI.getUserActivityLogOrg(userId, itemsPerPage, offset);
    const count = await window.electronAPI.getUserActivityLogCountOrg(userId);
    
    console.log('✅ Fetched activities:', logs);
    console.log('✅ Total count:', count);
    
    setActivities(logs || []);
    setTotalCount(count);
    setTotalPages(Math.ceil(count / itemsPerPage));
    
    // Set current date
    const today = new Date();
    setCurrentDate(
      today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  } catch (error) {
    console.error("❌ Error fetching activities:", error);
    setActivities([]);
    setTotalCount(0);
    setTotalPages(1);
  } finally {
    setLoading(false);
  }
};

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>User Log</h2>

      <div style={styles.dateSection}>
        <h3 style={styles.dateTitle}>{currentDate}</h3>

        <div style={styles.activityList}>
          {loading ? (
            <div style={styles.loadingText}>Loading activity log...</div>
          ) : activities.length === 0 ? (
            <div style={styles.emptyText}>No activity log found</div>
          ) : (
            activities.map((activity, index) => (
              <div key={activity.id || index} style={styles.activityItem}>
                <div style={styles.iconContainer}>
                  <User size={16} color="#6b7280" />
                </div>
                <div style={styles.activityContent}>
                  <p style={styles.activityText}>{activity.description}</p>
                </div>
                <span style={styles.activityTime}>
                  {activity.date} {activity.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileActivityOrg;