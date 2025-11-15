// ProfileActivity.jsx
import React from "react";
import { User } from "lucide-react";

const ProfileActivityOrg = () => {
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
      fontFamily: 'Arial'
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
    },
    paginationButtonHover: {
      color: "#047857",
    },
    paginationText: {
      fontSize: "12px",
      color: "#6b7280",
      fontFamily: "Arial",
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

  const activities = [
    {
      text: "Added 10 units of Type O+ Red Blood Cells to inventory",
      time: "08:12 AM",
    },
    {
      text: "Released 25 units of Type A- Plasma to Northern Mindanao Medical Center",
      time: "09:45 AM",
    },
    {
      text: "Approved donor information syncing from Barangay Carmen",
      time: "10:30 AM",
    },
    {
      text: "Modified blood stock details (Updated collection date for Type B+ Platelets)",
      time: "02:20 PM",
    },
    {
      text: "Released 10 unit of Type AB+ Red Blood Cells to Maria Reyna - Xavier University Hospital",
      time: "03:55 PM",
    },
    { text: "Added 5 units of Type O- Plasma to inventory", time: "05:10 PM" },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recent Activity</h2>

      <div style={styles.dateSection}>
        <h3 style={styles.dateTitle}>March 11, 2025</h3>

        <div style={styles.activityList}>
          {activities.map((activity, index) => (
            <div key={index} style={styles.activityItem}>
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

      <div style={styles.pagination}>
        <button
          style={styles.paginationButton}
          onMouseEnter={(e) =>
            (e.target.style.color = styles.paginationButtonHover.color)
          }
          onMouseLeave={(e) =>
            (e.target.style.color = styles.paginationButton.color)
          }
        >
          Previous
        </button>
        <span style={styles.paginationText}>Page 1 of 20</span>
        <button
          style={styles.paginationButton}
          onMouseEnter={(e) =>
            (e.target.style.color = styles.paginationButtonHover.color)
          }
          onMouseLeave={(e) =>
            (e.target.style.color = styles.paginationButton.color)
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProfileActivityOrg;
