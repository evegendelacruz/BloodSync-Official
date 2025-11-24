import React, { useState, useEffect } from "react";
import { User, Loader2, AlertCircle } from "lucide-react";

const ProfileActivityOrg = ({ userId }) => {
  const [activities, setActivities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  const styles = {
    container: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "32px",
      minHeight: "400px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "-7px",
      fontFamily: "Barlow",
      marginBottom: "24px",
    },
    dateSection: {
      marginBottom: "24px",
    },
    dateTitle: {
      fontSize: "14px",
      marginBottom: "16px",
      color: "#1f2937",
      fontWeight: "600",
    },
    activityList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
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
      marginTop: "20px",
    },
    paginationButton: {
      fontSize: "14px",
      color: "#6b7280",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "4px 8px",
      transition: "color 0.2s",
    },
    paginationButtonDisabled: {
      color: "#d1d5db",
      cursor: "not-allowed",
    },
    paginationText: {
      fontSize: "12px",
      color: "#6b7280",
      fontFamily: "Arial",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "300px",
      flexDirection: "column",
      gap: "12px",
    },
    loadingText: {
      color: "#6b7280",
      fontSize: "14px",
    },
    errorContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "300px",
      flexDirection: "column",
      gap: "12px",
      color: "#dc2626",
    },
    errorText: {
      fontSize: "14px",
    },
    noDataContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "300px",
      flexDirection: "column",
      gap: "12px",
      color: "#6b7280",
    },
    noDataText: {
      fontSize: "14px",
    },
  };

  // Media query for mobile responsiveness
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    styles.container.padding = "24px";
    styles.activityItem.flexWrap = "wrap";
    styles.activityTime.paddingTop = "8px";
    styles.activityTime.width = "100%";
    styles.activityTime.order = "2";
    styles.activityContent.order = "1";
    styles.pagination.justifyContent = "center";
  }

  // Fetch activities
  const fetchActivities = async (page) => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if window.electronAPI exists
      if (!window.electronAPI) {
        throw new Error("Electron API not available");
      }

      // Fetch activities
      const activitiesResult = await window.electronAPI.getUserActivityLogOrg(
        userId,
        page,
        itemsPerPage
      );

      if (!activitiesResult.success) {
        throw new Error(activitiesResult.error || "Failed to fetch activities");
      }

      // Fetch total count for pagination
      const countResult = await window.electronAPI.getUserActivityLogCountOrg(userId);

      if (!countResult.success) {
        throw new Error(countResult.error || "Failed to fetch activity count");
      }

      setActivities(activitiesResult.activities || {});
      setTotalPages(Math.ceil(countResult.count / itemsPerPage) || 1);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err.message || "Failed to load activities");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(currentPage);
  }, [currentPage, userId]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Recent Activity</h2>
        <div style={styles.loadingContainer}>
          <Loader2 size={32} className="animate-spin" color="#165C3C" />
          <span style={styles.loadingText}>Loading activities...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Recent Activity</h2>
        <div style={styles.errorContainer}>
          <AlertCircle size={32} />
          <span style={styles.errorText}>{error}</span>
        </div>
      </div>
    );
  }

  // No data state
  if (Object.keys(activities).length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Recent Activity</h2>
        <div style={styles.noDataContainer}>
          <User size={32} />
          <span style={styles.noDataText}>No activities yet</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recent Activity</h2>

      {Object.entries(activities).map(([date, dateActivities]) => (
        <div key={date} style={styles.dateSection}>
          <h3 style={styles.dateTitle}>{date}</h3>

          <div style={styles.activityList}>
            {dateActivities.map((activity) => (
              <div key={activity.id} style={styles.activityItem}>
                <div style={styles.iconContainer}>
                  <User size={16} color="#6b7280" />
                </div>
                <div style={styles.activityContent}>
                  <p style={styles.activityText}>{activity.text}</p>
                </div>
                <span style={styles.activityTime}>{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileActivityOrg;