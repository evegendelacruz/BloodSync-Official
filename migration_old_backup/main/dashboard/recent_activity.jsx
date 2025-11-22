import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Filter, User, Calendar, UserPlus, Edit, Trash2, CheckCircle, Clock, Eye, Droplet, Package, Users } from 'lucide-react';
import Loader from '../../components/Loader';

const RecentActivity = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'

  // Load user info and activities on component mount
  useEffect(() => {
    const initializePage = async () => {
      // Get current user from localStorage
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserId(user.id);
          setIsAdmin(user.role === 'Admin');

          // If not admin, default to showing only their activities
          if (user.role !== 'Admin') {
            setViewMode('my');
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }

      setIsLoading(true);
      await loadActivities();
      // Show loader for 1 second minimum
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    initializePage();
  }, []);

  // Reload activities when view mode changes
  useEffect(() => {
    const reloadActivities = async () => {
      if (currentUserId !== null) {
        setIsLoading(true);
        await loadActivities();
        // Show loader for 1 second minimum
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      }
    };
    reloadActivities();
  }, [viewMode]);

  const loadActivities = async () => {
    try {
      setError(null);

      if (typeof window !== 'undefined' && window.electronAPI) {
        let activitiesData;

        if (isAdmin && viewMode === 'all') {
          // Admin viewing all activities
          activitiesData = await window.electronAPI.getAllActivitiesRBC(100, 0);
        } else if (currentUserId) {
          // Admin viewing their activities OR non-admin user
          activitiesData = await window.electronAPI.getUserActivitiesRBC(currentUserId, 100, 0);
        } else {
          // Fallback to all activities
          activitiesData = await window.electronAPI.getAllActivitiesRBC(100, 0);
        }

        setActivities(activitiesData || []);
      } else {
        console.warn('ElectronAPI not available - running in browser mode');
        // Mock data for browser testing
        setActivities([
          {
            id: 1,
            user_name: 'Alaiza Rose Olores',
            action_type: 'add',
            entity_type: 'blood_stock',
            entity_id: '123',
            action_description: 'Added 10 units of Type O+ Red Blood Cells to inventory',
            details: {
              bloodType: 'O+',
              component: 'Red Blood Cells',
              units: 10
            },
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Failed to load activities. Please try again.');
    }
  };

  const handleSearch = async (term) => {
    try {
      setIsSearching(true);
      setError(null);
      setCurrentPage(1); // Reset to first page when searching

      if (typeof window !== 'undefined' && window.electronAPI) {
        if (term.trim() === '') {
          // If search term is empty, load all activities
          await loadActivities();
        } else {
          // Search for specific term
          const results = await window.electronAPI.searchActivities(term, 100);

          // Filter results based on view mode
          let filteredResults = results || [];
          if (viewMode === 'my' && currentUserId) {
            filteredResults = filteredResults.filter(a => a.user_id === currentUserId);
          }

          setActivities(filteredResults);
        }
      }
    } catch (error) {
      console.error('Error searching activities:', error);
      setError('Failed to search activities. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setIsLoading(true);
      setCurrentPage(1); // Reset to first page when refreshing
      await loadActivities();
      // Show loader for 1 second minimum
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing activities:', error);
      setError('Failed to refresh activities. Please try again.');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setShowActivityDetail(true);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  // Filter and sort activities
  const getFilteredAndSortedActivities = () => {
    let filtered = [...activities];

    // Apply filters
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.action_type === filterType);
    }

    if (filterEntity !== 'all') {
      filtered = filtered.filter(activity => activity.entity_type === filterEntity);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'user':
          return a.user_name.localeCompare(b.user_name);
        case 'action':
          return a.action_type.localeCompare(b.action_type);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

  // Group activities by date
  const groupActivitiesByDate = (activities) => {
    const groups = {};

    activities.forEach(activity => {
      const date = new Date(activity.created_at);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push({
        ...activity,
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      });
    });

    // Sort groups by date (most recent first)
    const sortedGroups = Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .map(([date, activities]) => ({
        date,
        activities: activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }));

    return sortedGroups;
  };

  const getActivityIcon = (actionType, entityType) => {
    if (entityType === 'donor') {
      switch (actionType) {
        case 'add':
          return <UserPlus size={20} />;
        case 'update':
          return <Edit size={20} />;
        case 'delete':
          return <Trash2 size={20} />;
        case 'approve':
          return <CheckCircle size={20} />;
        default:
          return <User size={20} />;
      }
    } else if (entityType === 'blood_stock') {
      switch (actionType) {
        case 'add':
          return <Droplet size={20} />;
        case 'update':
          return <Edit size={20} />;
        case 'release':
          return <Package size={20} />;
        case 'delete':
          return <Trash2 size={20} />;
        default:
          return <Droplet size={20} />;
      }
    } else if (entityType === 'organization') {
      return <Users size={20} />;
    }
    return <Clock size={20} />;
  };

  const getActivityColor = (actionType) => {
    switch (actionType) {
      case 'add':
        return '#10b981'; // Green for additions
      case 'update':
        return '#3b82f6'; // Blue for updates
      case 'delete':
        return '#ef4444'; // Red for deletions
      case 'release':
        return '#f59e0b'; // Orange for releases
      case 'approve':
        return '#8b5cf6'; // Purple for approvals
      default:
        return '#6b7280'; // Gray for other actions
    }
  };

  const getEntityDisplayName = (entityType) => {
    switch (entityType) {
      case 'donor':
        return 'Donor Management';
      case 'blood_stock':
        return 'Blood Stock Management';
      case 'organization':
        return 'Organization Management';
      default:
        return entityType;
    }
  };

  // Format activity description with highlighted keywords
  const formatActivityDescription = (activity) => {
    const { entity_type, action_type, details, user_name } = activity;

    // Helper function to create highlighted text
    const highlight = (text) => (
      <span style={{ color: '#1e40af', fontWeight: '500' }}>{text}</span>
    );

    // Blood Stock - Add
    if ((entity_type === 'blood_stock_rbc' || entity_type === 'blood_stock_plasma' || entity_type === 'blood_stock_platelet') && action_type === 'add') {
      const componentMap = {
        'blood_stock_rbc': 'Red Blood Cell',
        'blood_stock_plasma': 'Plasma',
        'blood_stock_platelet': 'Platelets'
      };
      const component = componentMap[entity_type];
      const count = details?.count || 1;

      return (
        <span>
          {user_name} Currently Added {count} {component} in the {highlight('Blood Stock')}.
        </span>
      );
    }

    // Non-Conforming - Add
    if ((entity_type === 'non_conforming_rbc' || entity_type === 'non_conforming_plasma' || entity_type === 'non_conforming_platelet') && action_type === 'add') {
      const componentMap = {
        'non_conforming_rbc': 'Red Blood Cell',
        'non_conforming_plasma': 'Plasma',
        'non_conforming_platelet': 'Platelets'
      };
      const component = componentMap[entity_type];
      const count = details?.count || 1;

      return (
        <span>
          {user_name} Currently Added {count} {component} in the {highlight('Non-Conforming')}.
        </span>
      );
    }

    // Released Blood
    if ((entity_type === 'blood_stock_rbc' || entity_type === 'blood_stock_plasma' || entity_type === 'blood_stock_platelet') && action_type === 'release') {
      const componentMap = {
        'blood_stock_rbc': 'Red Blood Cell',
        'blood_stock_plasma': 'Plasma',
        'blood_stock_platelet': 'Platelets'
      };
      const component = componentMap[entity_type];
      const count = details?.count || details?.serialNumbers?.length || 1;

      return (
        <span>
          {user_name} Currently Released {count} {component} in the {highlight('Released Blood')}.
        </span>
      );
    }

    // Donor Record - Approve
    if (entity_type === 'donor_sync' && action_type === 'approve') {
      const count = details?.donorCount || details?.totalProcessed || details?.count || 1;

      return (
        <span>
          {user_name} Approved {count} {count === 1 ? 'Donor' : 'Donors'} in the {highlight('Donor Record')}.
        </span>
      );
    }

    // Fallback to original description
    return activity.action_description;
  };

  // Pagination logic
  const filteredData = groupActivitiesByDate(getFilteredAndSortedActivities());
  const allActivities = filteredData.flatMap(group => group.activities);
  const totalPages = Math.ceil(allActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = allActivities.slice(startIndex, endIndex);

  // Group paginated activities by date
  const paginatedGroupedData = groupActivitiesByDate(paginatedActivities);

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f9fafb",
      minHeight: "100vh",
      fontFamily: "'Barlow', sans-serif",
      borderRadius: "8px",
    },
    header: {
      margin: 0,
      marginBottom: "24px"
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "1px",
      fontFamily: "'Barlow', sans-serif",
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginTop: "-7px",
      fontFamily: "'Barlow', sans-serif",
    },
    errorMessage: {
      backgroundColor: "#fee2e2",
      border: "1px solid #fecaca",
      color: "#dc2626",
      padding: "12px 16px",
      borderRadius: "6px",
      marginBottom: "16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "'Barlow', sans-serif",
    },
    viewModeContainer: {
      marginBottom: "20px",
      display: "flex",
      gap: "12px",
      backgroundColor: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      alignItems: "center"
    },
    viewModeLabel: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      fontFamily: "'Barlow', sans-serif",
    },
    viewModeButton: {
      padding: "8px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      backgroundColor: "white",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "'Barlow', sans-serif",
      transition: "all 0.2s",
      color: "#374151"
    },
    viewModeButtonActive: {
      padding: "8px 16px",
      border: "1px solid #165C3C",
      borderRadius: "6px",
      backgroundColor: "#165C3C",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "'Barlow', sans-serif",
      transition: "all 0.2s",
      color: "white",
      fontWeight: "600"
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
      flexWrap: "wrap",
      gap: "16px"
    },
    leftControls: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap"
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
      fontFamily: "'Barlow', sans-serif",
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
      flexWrap: "wrap"
    },
    refreshButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#165C3C",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "'Barlow', sans-serif",
      transition: "background-color 0.2s",
    },
    refreshIcon: {
      animation: isRefreshing ? "spin 1s linear infinite" : "none",
    },
    filterSelect: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      backgroundColor: "white",
      fontSize: "14px",
      fontFamily: "'Barlow', sans-serif",
      color: "#374151",
      cursor: "pointer",
      minWidth: "120px"
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
      fontFamily: "'Barlow', sans-serif",
      color: "#374151",
    },
    contentContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
    },
    loadingState: {
      padding: "60px 24px",
      textAlign: "center",
      backgroundColor: "white",
    },
    loadingContent: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
    },
    loadingIcon: {
      color: "#165C3C",
      animation: "spin 1s linear infinite",
    },
    loadingText: {
      fontSize: "16px",
      color: "#6b7280",
      margin: 0,
      fontFamily: "'Barlow', sans-serif",
    },
    emptyState: {
      padding: "60px 24px",
      textAlign: "center",
      backgroundColor: "white",
    },
    emptyContent: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
    },
    emptyIcon: {
      color: "#d1d5db",
    },
    emptyTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#374151",
      margin: 0,
      fontFamily: "'Barlow', sans-serif",
    },
    emptyDescription: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
      fontFamily: "'Barlow', sans-serif",
    },
    statsContainer: {
      display: "flex",
      gap: "16px",
      marginBottom: "20px",
      flexWrap: "wrap"
    },
    statCard: {
      backgroundColor: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      flex: "1",
      minWidth: "140px"
    },
    statNumber: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#165C3C",
      fontFamily: "'Barlow', sans-serif",
    },
    statLabel: {
      fontSize: "12px",
      color: "#6b7280",
      fontFamily: "'Barlow', sans-serif",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    dateHeader: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#374151",
      padding: "20px 20px 16px 20px",
      borderBottom: "1px solid #f3f4f6",
      margin: 0,
      fontFamily: "'Barlow', sans-serif",
      backgroundColor: "#f9fafb"
    },
    activityList: {
      padding: "0",
    },
    activityItem: {
      display: "flex",
      alignItems: "flex-start",
      padding: "16px 20px",
      borderBottom: "1px solid #f9fafb",
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    activityItemHover: {
      backgroundColor: "#f9fafb"
    },
    activityItemLast: {
      borderBottom: "none",
    },
    avatar: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      marginRight: "16px",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
      fontFamily: "'Barlow', sans-serif",
    },
    actionText: {
      fontSize: "14px",
      color: "#6b7280",
      lineHeight: "1.4",
      fontFamily: "'Barlow', sans-serif",
    },
    entityBadge: {
      display: "inline-block",
      backgroundColor: "#e5f3ff",
      color: "#1e40af",
      fontSize: "11px",
      fontWeight: "500",
      padding: "2px 6px",
      borderRadius: "12px",
      marginTop: "4px",
      fontFamily: "'Barlow', sans-serif",
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
      fontFamily: "'Barlow', sans-serif",
    },
    viewButton: {
      padding: "6px 12px",
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "none",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "500",
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      transition: "background-color 0.2s"
    },
    pagination: {
      backgroundColor: "white",
      padding: "16px 24px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "16px"
    },
    paginationButton: {
      fontSize: "14px",
      color: "#6b7280",
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      padding: "8px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
      transition: "all 0.2s"
    },
    paginationButtonActive: {
      fontSize: "14px",
      color: "white",
      backgroundColor: "#165C3C",
      border: "1px solid #165C3C",
      padding: "8px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
    },
    paginationText: {
      fontSize: "14px",
      color: "#374151",
      fontWeight: "500",
      fontFamily: "'Barlow', sans-serif",
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "24px",
      maxWidth: "600px",
      width: "90%",
      maxHeight: "80vh",
      overflow: "auto",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      paddingBottom: "16px",
      borderBottom: "1px solid #e5e7eb"
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#165C3C",
      fontFamily: "'Barlow', sans-serif",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#666",
      padding: "4px",
      borderRadius: "4px",
      transition: "background-color 0.2s"
    }
  };

  // Calculate activity statistics
  const activityStats = {
    total: activities.length,
    today: activities.filter(a => {
      const activityDate = new Date(a.created_at);
      const today = new Date();
      return activityDate.toDateString() === today.toDateString();
    }).length,
    donors: activities.filter(a => a.entity_type === 'donor').length,
    bloodStock: activities.filter(a => a.entity_type === 'blood_stock').length
  };

  // Show loader while loading initial data
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Recent Activity</h1>
        <p style={styles.subtitle}>Activity History</p>
      </div>

      {/* Admin View Mode Toggle */}
      {isAdmin && (
        <div style={styles.viewModeContainer}>
          <span style={styles.viewModeLabel}>View:</span>
          <button
            style={viewMode === 'all' ? styles.viewModeButtonActive : styles.viewModeButton}
            onClick={() => handleViewModeChange('all')}
          >
            All Users' Activities
          </button>
          <button
            style={viewMode === 'my' ? styles.viewModeButtonActive : styles.viewModeButton}
            onClick={() => handleViewModeChange('my')}
          >
            My Activities
          </button>
        </div>
      )}

      {/* Activity Statistics */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{activityStats.total}</div>
          <div style={styles.statLabel}>Total Activities</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{activityStats.today}</div>
          <div style={styles.statLabel}>Today's Activities</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{activityStats.donors}</div>
          <div style={styles.statLabel}>Donor Actions</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{activityStats.bloodStock}</div>
          <div style={styles.statLabel}>Blood Stock Actions</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorMessage}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              color: "#dc2626",
              fontSize: "18px",
              cursor: "pointer",
              padding: 0,
              marginLeft: "8px"
            }}
          >
            ×
          </button>
        </div>
      )}

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
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchTerm);
                }
              }}
              onBlur={() => {
                handleSearch(searchTerm);
              }}
              disabled={isSearching || isLoading}
            />
            {isSearching && (
              <div style={{
                position: "absolute",
                right: "12px",
                fontSize: "12px",
                color: "#6b7280",
                fontFamily: "'Barlow', sans-serif"
              }}>
                Searching...
              </div>
            )}
          </div>

          <select
            style={styles.filterSelect}
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Actions</option>
            <option value="add">Added</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
            <option value="release">Released</option>
            <option value="approve">Approved</option>
          </select>

          <select
            style={styles.filterSelect}
            value={filterEntity}
            onChange={(e) => {
              setFilterEntity(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Entities</option>
            <option value="donor">Donors</option>
            <option value="blood_stock">Blood Stock</option>
            <option value="organization">Organizations</option>
          </select>
        </div>

        <div style={styles.rightControls}>
          <button
            style={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#134e33'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
          >
            <RefreshCw size={16} style={styles.refreshIcon} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <select
            style={styles.filterSelect}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="user">By User</option>
            <option value="action">By Action</option>
          </select>
        </div>
      </div>

      {/* Activity Content */}
      <div style={styles.contentContainer}>
        {isLoading ? (
          <div style={styles.loadingState}>
            <div style={styles.loadingContent}>
              <RefreshCw size={24} style={styles.loadingIcon} />
              <p style={styles.loadingText}>Loading activities...</p>
            </div>
          </div>
        ) : paginatedGroupedData.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyContent}>
              <User size={48} style={styles.emptyIcon} />
              <h3 style={styles.emptyTitle}>No activities found</h3>
              <p style={styles.emptyDescription}>
                {searchTerm ? `No activities match your search for "${searchTerm}"` : 'No activities have been recorded yet'}
              </p>
            </div>
          </div>
        ) : (
          paginatedGroupedData.map((dateGroup, dateIndex) => (
            <div key={dateGroup.date}>
              <h3 style={styles.dateHeader}>{dateGroup.date}</h3>
              <div style={styles.activityList}>
                {dateGroup.activities.map((activity, activityIndex) => (
                  <div
                    key={activity.id}
                    style={{
                      ...styles.activityItem,
                      ...(activityIndex === dateGroup.activities.length - 1 &&
                          dateIndex === paginatedGroupedData.length - 1
                          ? styles.activityItemLast : {})
                    }}
                    onClick={() => handleActivityClick(activity)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.activityItemHover.backgroundColor}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div
                      style={{
                        ...styles.avatar,
                        backgroundColor: getActivityColor(activity.action_type),
                        color: "white"
                      }}
                    >
                      {getActivityIcon(activity.action_type, activity.entity_type)}
                    </div>

                    <div style={styles.activityContent}>
                      <div style={styles.activityDetails}>
                        <div style={styles.actionText}>{formatActivityDescription(activity)}</div>
                        <div style={styles.entityBadge}>
                          {getEntityDisplayName(activity.entity_type)}
                        </div>
                      </div>

                      <div style={styles.timeAndActions}>
                        <span style={styles.timeText}>{activity.time}</span>
                        <button
                          style={styles.viewButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivityClick(activity);
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        >
                          <Eye size={12} />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {!isLoading && allActivities.length > 0 && (
          <div style={styles.pagination}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                style={currentPage === 1 ? { ...styles.paginationButton, opacity: 0.5, cursor: 'not-allowed' } : styles.paginationButton}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                Previous
              </button>

              {/* Page numbers */}
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }

                return (
                  <button
                    key={pageNum}
                    style={pageNum === currentPage ? styles.paginationButtonActive : styles.paginationButton}
                    onClick={() => setCurrentPage(pageNum)}
                    onMouseEnter={(e) => {
                      if (pageNum !== currentPage) {
                        e.target.style.backgroundColor = '#f3f4f6';
                        e.target.style.borderColor = '#d1d5db';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pageNum !== currentPage) {
                        e.target.style.backgroundColor = '#f9fafb';
                        e.target.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                style={currentPage === totalPages ? { ...styles.paginationButton, opacity: 0.5, cursor: 'not-allowed' } : styles.paginationButton}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                Next
              </button>
            </div>

            <span style={styles.paginationText}>
              Page {currentPage} of {totalPages} ({allActivities.length} total activities)
            </span>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      {showActivityDetail && selectedActivity && (
        <div style={styles.modal} onClick={() => setShowActivityDetail(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Activity Details</h3>
              <button
                style={styles.closeButton}
                onClick={() => setShowActivityDetail(false)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            <div style={{ fontFamily: "'Barlow', sans-serif", lineHeight: "1.6" }}>
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#165C3C" }}>User:</strong>
                <div style={{ marginTop: "4px", color: "#374151" }}>{selectedActivity.user_name}</div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#165C3C" }}>Action:</strong>
                <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: getActivityColor(selectedActivity.action_type),
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {getActivityIcon(selectedActivity.action_type, selectedActivity.entity_type)}
                  </div>
                  <span style={{ color: "#374151", textTransform: "capitalize" }}>
                    {selectedActivity.action_type} {selectedActivity.entity_type}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#165C3C" }}>Description:</strong>
                <div style={{
                  marginTop: "4px",
                  color: "#374151",
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb"
                }}>
                  {selectedActivity.action_description}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#165C3C" }}>Entity ID:</strong>
                <div style={{ marginTop: "4px", color: "#374151", fontFamily: "monospace", fontSize: "14px" }}>
                  {selectedActivity.entity_id || 'N/A'}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#165C3C" }}>Timestamp:</strong>
                <div style={{ marginTop: "4px", color: "#374151" }}>
                  {new Date(selectedActivity.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>

              {selectedActivity.details && Object.keys(selectedActivity.details).length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <strong style={{ color: "#165C3C" }}>Additional Details:</strong>
                  <div style={{
                    marginTop: "8px",
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb"
                  }}>
                    {Object.entries(selectedActivity.details).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: "8px" }}>
                        <span style={{ fontWeight: "500", color: "#374151", textTransform: "capitalize" }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span style={{ marginLeft: "8px", color: "#6b7280" }}>
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
              <button
                style={{
                  backgroundColor: "#165C3C",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "'Barlow', sans-serif",
                  transition: "background-color 0.2s"
                }}
                onClick={() => setShowActivityDetail(false)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#134e33'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#165C3C'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default RecentActivity;
