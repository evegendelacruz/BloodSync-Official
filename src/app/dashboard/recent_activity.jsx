import React, { useState } from 'react';
import { Search } from 'lucide-react';

const RecentActivity = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Sample activity data matching the UI
  const activityData = [
    {
      id: 1,
      date: "March 11, 2025",
      activities: [
        {
          id: 11,
          user: "Alaiza Rose Olores",
          action: "Added 10 units of Type O+ Red Blood Cells to inventory",
          time: "08:12 AM"
        },
        {
          id: 12,
          user: "Alaiza Rose Olores",
          action: "Released 25 units of Type A- Plasma to Northern Mindanao Medical Center",
          time: "09:45 AM"
        },
        {
          id: 13,
          user: "Alaiza Rose Olores",
          action: "Approved donor information syncing from Barangay Carmen",
          time: "10:30 AM"
        },
        {
          id: 14,
          user: "Alaiza Rose Olores",
          action: "Modified blood stock details (Updated collection date for Type B+ Platelet)",
          time: "02:20 PM"
        },
        {
          id: 15,
          user: "Alaiza Rose Olores",
          action: "Released 10 unit of Type AB+ Red Blood Cells to Maria Reyna - Xavier University Hospital",
          time: "03:55 PM"
        },
        {
          id: 16,
          user: "Alaiza Rose Olores",
          action: "Added 5 units of Type O- Plasma to inventory",
          time: "05:10 PM"
        },
        {
          id: 17,
          user: "Alaiza Rose Olores",
          action: "Modified blood stock details (Updated collection date for Type A+ Platelet)",
          time: "06:30 PM"
        },
        {
          id: 18,
          user: "Alaiza Rose Olores",
          action: "Approved donor information syncing from Barangay Balulang",
          time: "07:48 PM"
        }
      ]
    },
    {
      id: 2,
      date: "March 10, 2025",
      activities: [
        {
          id: 21,
          user: "Alaiza Rose Olores",
          action: "Added 10 units of Type O+ Red Blood Cells to inventory",
          time: "08:12 AM"
        },
        {
          id: 22,
          user: "Alaiza Rose Olores",
          action: "Released 25 units of Type A- Plasma to Northern Mindanao Medical Center",
          time: "09:45 AM"
        },
        {
          id: 23,
          user: "Alaiza Rose Olores",
          action: "Approved donor information syncing from Barangay Carmen",
          time: "10:30 AM"
        },
        {
          id: 24,
          user: "Alaiza Rose Olores",
          action: "Modified blood stock details (Updated collection date for Type B+ Platelet)",
          time: "02:20 PM"
        },
        {
          id: 25,
          user: "Alaiza Rose Olores",
          action: "Released 10 unit of Type AB+ Red Blood Cells to Maria Reyna - Xavier University Hospital",
          time: "03:55 PM"
        },
        {
          id: 26,
          user: "Alaiza Rose Olores",
          action: "Added 5 units of Type O- Plasma to inventory",
          time: "05:10 PM"
        }
      ]
    }
  ];

  const filteredData = activityData.map(dateGroup => ({
    ...dateGroup,
    activities: dateGroup.activities.filter(activity =>
      activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(dateGroup => dateGroup.activities.length > 0);

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
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginTop: "-7px",
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
    contentContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
    },
    dateHeader: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#374151",
      padding: "20px 20px 16px 20px",
      borderBottom: "1px solid #f3f4f6",
      margin: 0,
    },
    activityList: {
      padding: "0",
    },
    activityItem: {
      display: "flex",
      alignItems: "flex-start",
      padding: "16px 20px",
      borderBottom: "1px solid #f9fafb",
    },
    activityItemLast: {
      borderBottom: "none",
    },
    avatar: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      backgroundColor: "#6b7280",
      marginRight: "16px",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarIcon: {
      width: "20px",
      height: "20px",
      color: "white",
    },
    activityContent: {
      flex: 1,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    activityDetails: {
      flex: 1,
      marginRight: "16px",
    },
    userName: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "4px",
    },
    actionText: {
      fontSize: "14px",
      color: "#6b7280",
      lineHeight: "1.4",
    },
    timeAndActions: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexShrink: 0,
    },
    timeText: {
      fontSize: "12px",
      color: "#9ca3af",
      fontWeight: "500",
    },
    viewButton: {
      padding: "6px 16px",
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "none",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "500",
      cursor: "pointer",
    },
    moreButton: {
      padding: "6px 8px",
      backgroundColor: "transparent",
      color: "#9ca3af",
      border: "none",
      cursor: "pointer",
      borderRadius: "4px",
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
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Recent Activity</h1>
        <p style={styles.subtitle}>Activity History</p>
      </div>

      {/* Controls Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.leftControls}>
          <div style={styles.searchContainer}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Activity"
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.rightControls}>
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

      {/* Activity Content */}
      <div style={styles.contentContainer}>
        {filteredData.map((dateGroup, dateIndex) => (
          <div key={dateGroup.id}>
            <h3 style={styles.dateHeader}>{dateGroup.date}</h3>
            <div style={styles.activityList}>
              {dateGroup.activities.map((activity, activityIndex) => (
                <div
                  key={activity.id}
                  style={{
                    ...styles.activityItem,
                    ...(activityIndex === dateGroup.activities.length - 1 && 
                        dateIndex === filteredData.length - 1 
                        ? styles.activityItemLast : {})
                  }}
                >
                  <div style={styles.avatar}>
                    <svg
                      style={styles.avatarIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  
                  <div style={styles.activityContent}>
                    <div style={styles.activityDetails}>
                      <div style={styles.userName}>{activity.user}</div>
                      <div style={styles.actionText}>{activity.action}</div>
                    </div>
                    
                    <div style={styles.timeAndActions}>
                      <span style={styles.timeText}>{activity.time}</span>
                      <button style={styles.viewButton}>View</button>
                      <button style={styles.moreButton}>
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
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div style={styles.pagination}>
          <button style={styles.paginationButton}>Previous</button>
          <span style={styles.paginationText}>Page 1 of 20</span>
          <button style={styles.paginationButtonNext}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;