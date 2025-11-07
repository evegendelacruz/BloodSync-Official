// ProfileActivity.jsx
import React, { useState, useEffect } from "react";
import { User, LogIn } from "lucide-react";

const ProfileActivityOrg = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userProfile, setUserProfile] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUserActivities();
    loadUserProfile();
  }, [currentPage]);

  const loadUserProfile = async () => {
    try {
      const userStr = localStorage.getItem('currentOrgUser');
      if (!userStr) return;

      const user = JSON.parse(userStr);

      // Fetch user profile to get photo
      const profile = await window.electronAPI.getUserProfile(user.userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserActivities = async () => {
    try {
      setIsLoading(true);
      const userStr = localStorage.getItem('currentOrgUser');
      if (!userStr) {
        console.error('No user found in localStorage');
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const offset = (currentPage - 1) * itemsPerPage;

      // Use Electron API to get user activities
      const activities = await window.electronAPI.getUserActivities(user.userId, itemsPerPage, offset);

      if (activities && activities.length > 0) {
        setActivities(activities);
        // Calculate total pages
        setTotalPages(Math.max(1, Math.ceil(activities.length / itemsPerPage)));
      } else {
        setActivities([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading user activities:', error);
      setActivities([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
      overflow: "hidden",
    },
    profileImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
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

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = formatDate(activity.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>User Logs</h2>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          No activities found. Your actions will appear here.
        </div>
      ) : (
        <>
          {Object.entries(groupedActivities).map(([date, dateActivities]) => (
            <div key={date} style={styles.dateSection}>
              <h3 style={styles.dateTitle}>{date}</h3>

              <div style={styles.activityList}>
                {dateActivities.map((activity, index) => {
                  const isLoginActivity = activity.action_type === 'login';
                  return (
                    <div
                      key={activity.id || index}
                      style={{
                        ...styles.activityItem,
                        ...(isLoginActivity ? {
                          backgroundColor: '#f0fdf4',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #10b981'
                        } : {})
                      }}
                    >
                      <div style={{
                        ...styles.iconContainer,
                        ...(isLoginActivity ? {
                          backgroundColor: '#10b981',
                          border: '2px solid #059669',
                          position: 'relative'
                        } : {})
                      }}>
                        {userProfile?.profile_photo ? (
                          <>
                            <img
                              src={userProfile.profile_photo}
                              alt="User"
                              style={styles.profileImage}
                            />
                            {isLoginActivity && (
                              <div style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white'
                              }}>
                                <LogIn size={10} color="#ffffff" />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <User size={16} color={isLoginActivity ? "#ffffff" : "#6b7280"} />
                            {isLoginActivity && (
                              <div style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                backgroundColor: '#10b981',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white'
                              }}>
                                <LogIn size={10} color="#ffffff" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div style={styles.activityContent}>
                        <p style={{
                          ...styles.activityText,
                          ...(isLoginActivity ? {
                            fontWeight: '600',
                            color: '#047857'
                          } : {})
                        }}>
                          {isLoginActivity ? '🔐 ' : ''}{activity.action_description}
                        </p>
                      </div>
                      <span style={{
                        ...styles.activityTime,
                        ...(isLoginActivity ? {
                          color: '#047857',
                          fontWeight: '600'
                        } : {})
                      }}>
                        {formatTimestamp(activity.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={styles.pagination}>
            <button
              style={{
                ...styles.paginationButton,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              onMouseEnter={(e) => {
                if (currentPage > 1) {
                  e.target.style.color = styles.paginationButtonHover.color;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.color = styles.paginationButton.color;
              }}
            >
              Previous
            </button>
            <span style={styles.paginationText}>Page {currentPage} of {totalPages}</span>
            <button
              style={{
                ...styles.paginationButton,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              onMouseEnter={(e) => {
                if (currentPage < totalPages) {
                  e.target.style.color = styles.paginationButtonHover.color;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.color = styles.paginationButton.color;
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileActivityOrg;
