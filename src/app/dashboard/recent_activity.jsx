import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ArchiveRestore, Filter, User, Calendar, UserPlus, Edit, Trash2, PackageX, CheckCircle, Clock, Eye, Droplet, Package, Users, Droplets } from 'lucide-react';

const Loader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb'
  }}>
    <div style={{
      animation: 'spin 1s linear infinite',
      width: '48px',
      height: '48px',
      border: '4px solid #e5e7eb',
      borderTopColor: '#165c3c',
      borderRadius: '50%'
    }} />
  </div>
);

const RecentActivity = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [viewMode, setViewMode] = useState('all');

  useEffect(() => {
    const initializePage = async () => {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserId(user.id);
          setIsAdmin(user.role === 'Admin');

          if (user.role !== 'Admin') {
            setViewMode('my');
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }

      setIsLoading(true);
      await loadActivities();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    initializePage();
  }, []);

  useEffect(() => {
    const reloadActivities = async () => {
      if (currentUserId !== null) {
        setIsLoading(true);
        await loadActivities();
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
        // ✅ CHANGED: null instead of 100 for unlimited
        activitiesData = await window.electronAPI.getAllActivities(null, 0);
      } else if (currentUserId) {
        // ✅ CHANGED: null instead of 100 for unlimited
        activitiesData = await window.electronAPI.getUserActivities(currentUserId, null, 0);
      } else {
        // ✅ CHANGED: null instead of 100 for unlimited
        activitiesData = await window.electronAPI.getAllActivities(null, 0);
      }

      console.log('Loaded activities:', activitiesData);
      setActivities(activitiesData || []);
    } else {
      console.warn('ElectronAPI not available');
      setActivities([]);
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
    setCurrentPage(1);

    if (typeof window !== 'undefined' && window.electronAPI) {
      if (term.trim() === '') {
        await loadActivities();
      } else {
        // ✅ CHANGED: null instead of 100 for unlimited
        const results = await window.electronAPI.searchActivities(term, null);
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
      setCurrentPage(1);
      await loadActivities();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing activities:', error);
      setError('Failed to refresh activities. Please try again.');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const getFilteredAndSortedActivities = () => {
    let filtered = [...activities];

    if (filterType !== 'all') {
      filtered = filtered.filter(activity => {
        const actionType = activity.action_type?.toLowerCase() || '';
        return actionType.includes(filterType.toLowerCase());
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'user':
          return (a.user_name || '').localeCompare(b.user_name || '');
        case 'action':
          return (a.action_type || '').localeCompare(b.action_type || '');
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

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

    const sortedGroups = Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .map(([date, activities]) => ({
        date,
        activities: activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }));

    return sortedGroups;
  };

  const getActivityIcon = (actionType) => {
  const type = (actionType || '').toLowerCase();
  if (type.includes('add')) return <Droplets size={20} />;
  if (type.includes('update') || type.includes('edit')) return <Edit size={20} />;
  if (type.includes('delete')) return <Trash2 size={20} />;
  if (type.includes('approve')) return <CheckCircle size={20} />;
  if (type.includes('release')) return <Package size={20} />;
  if (type.includes('restore')) return <ArchiveRestore size={20} />;
  return <PackageX size={20} />;
};

 const getActivityColor = (actionType) => {
  const type = (actionType || '').toLowerCase();
  if (type.includes('add')) return '#10b981';
  if (type.includes('update')) return '#3b82f6';
  if (type.includes('delete')) return '#ef4444';
  if (type.includes('release')) return '#f59e0b';
  if (type.includes('approve')) return '#8b5cf6';
  if (type.includes('restore')) return '#06b6d4'; 
  return '#6b7280';
};

  const getEntityDisplayName = (entityType) => {
    switch (entityType) {
      case 'donor': return 'Donor Management';
      case 'blood_stock_rbc': return 'Red Blood Cells';
      case 'blood_stock_plasma': return 'Plasma';
      case 'blood_stock_platelet': return 'Platelets';
      case 'non_conforming_rbc': return 'Non-Conforming RBC';
      case 'non_conforming_plasma': return 'Non-Conforming Plasma';
      case 'non_conforming_platelet': return 'Non-Conforming Platelet';
      case 'organization': return 'Organization';
      default: return 'General Activity';
    }
  };

  const filteredData = groupActivitiesByDate(getFilteredAndSortedActivities());
  const allActivities = filteredData.flatMap(group => group.activities);
  const totalPages = Math.ceil(allActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = allActivities.slice(startIndex, endIndex);
  const paginatedGroupedData = groupActivitiesByDate(paginatedActivities);

  const activityStats = {
    total: activities.length,
    today: activities.filter(a => {
      const activityDate = new Date(a.created_at);
      const today = new Date();
      return activityDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: activities.filter(a => {
      const activityDate = new Date(a.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate >= weekAgo;
    }).length
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: "'Barlow', sans-serif", borderRadius: '8px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#165C3C', marginTop: '1px' }}>
          Recent Activity
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '-7px' }}>
          Activity History
        </p>
      </div>

      {isAdmin && (
        <div style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>View:</span>
          <button
            style={{
              padding: '8px 16px',
              border: `1px solid ${viewMode === 'all' ? '#165C3C' : '#d1d5db'}`,
              borderRadius: '6px',
              backgroundColor: viewMode === 'all' ? '#165C3C' : 'white',
              cursor: 'pointer',
              fontSize: '14px',
              color: viewMode === 'all' ? 'white' : '#374151',
              fontWeight: viewMode === 'all' ? '600' : 'normal'
            }}
            onClick={() => { setViewMode('all'); setCurrentPage(1); }}
          >
            All Users' Activities
          </button>
          <button
            style={{
              padding: '8px 16px',
              border: `1px solid ${viewMode === 'my' ? '#165C3C' : '#d1d5db'}`,
              borderRadius: '6px',
              backgroundColor: viewMode === 'my' ? '#165C3C' : 'white',
              cursor: 'pointer',
              fontSize: '14px',
              color: viewMode === 'my' ? 'white' : '#374151',
              fontWeight: viewMode === 'my' ? '600' : 'normal'
            }}
            onClick={() => { setViewMode('my'); setCurrentPage(1); }}
          >
            My Activities
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', flex: '1', minWidth: '140px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#165C3C' }}>{activityStats.total}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Activities</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', flex: '1', minWidth: '140px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#165C3C' }}>{activityStats.today}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', flex: '1', minWidth: '140px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#165C3C' }}>{activityStats.thisWeek}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Week</div>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{
            background: 'none',
            border: 'none',
            color: '#dc2626',
            fontSize: '18px',
            cursor: 'pointer',
            padding: 0
          }}>×</button>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search Activity"
              style={{
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                width: '300px',
                fontSize: '14px',
                outline: 'none'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchTerm); }}
              disabled={isSearching || isLoading}
            />
          </div>
          <select
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              minWidth: '120px'
            }}
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Actions</option>
            <option value="add">Added</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
            <option value="release">Released</option>
            <option value="restore">Restored</option> 
            <option value="approve">Approved</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#165C3C',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <select
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              minWidth: '120px'
            }}
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="user">By User</option>
            <option value="action">By Action</option>
          </select>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {paginatedGroupedData.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', backgroundColor: 'white' }}>
            <User size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
              No activities found
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {searchTerm ? `No activities match your search for "${searchTerm}"` : 'No activities have been recorded yet'}
            </p>
          </div>
        ) : (
          paginatedGroupedData.map((dateGroup, dateIndex) => (
            <div key={dateGroup.date}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                padding: '20px 20px 16px 20px',
                borderBottom: '1px solid #f3f4f6',
                margin: 0,
                backgroundColor: '#f9fafb'
              }}>
                {dateGroup.date}
              </h3>
              <div>
                {dateGroup.activities.map((activity, activityIndex) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '16px 20px',
                      borderBottom: activityIndex === dateGroup.activities.length - 1 && dateIndex === paginatedGroupedData.length - 1 ? 'none' : '1px solid #f9fafb',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => { setSelectedActivity(activity); setShowActivityDetail(true); }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      marginRight: '16px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: getActivityColor(activity.action_type),
                      color: 'white'
                    }}>
                      {getActivityIcon(activity.action_type)}
                    </div>

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>
                          {activity.action_description}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          backgroundColor: '#e5f3ff',
                          color: '#1e40af',
                          fontSize: '11px',
                          fontWeight: '500',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          marginTop: '4px'
                        }}>
                          {getEntityDisplayName(activity.entity_type)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>
                          {activity.time}
                        </span>
                        <button style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
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

        {!isLoading && allActivities.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                style={{
                  fontSize: '14px',
                  color: currentPage === 1 ? '#d1d5db' : '#6b7280',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

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
                    style={{
                      fontSize: '14px',
                      color: pageNum === currentPage ? 'white' : '#6b7280',
                      backgroundColor: pageNum === currentPage ? '#165C3C' : '#f9fafb',
                      border: `1px solid ${pageNum === currentPage ? '#165C3C' : '#e5e7eb'}`,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                style={{
                  fontSize: '14px',
                  color: currentPage === totalPages ? '#d1d5db' : '#6b7280',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>

            <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
              Page {currentPage} of {totalPages} ({allActivities.length} total activities)
            </span>
          </div>
        )}
      </div>

      {showActivityDetail && selectedActivity && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowActivityDetail(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#165C3C', margin: 0 }}>
                Activity Details
              </h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onClick={() => setShowActivityDetail(false)}
              >
                ×
              </button>
            </div>

            <div style={{ lineHeight: '1.6' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#165C3C' }}>User:</strong>
                <div style={{ marginTop: '4px', color: '#374151' }}>{selectedActivity.user_name}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#165C3C' }}>Action:</strong>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: getActivityColor(selectedActivity.action_type),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getActivityIcon(selectedActivity.action_type)}
                  </div>
                  <span style={{ color: '#374151', textTransform: 'capitalize' }}>
                    {selectedActivity.action_type}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#165C3C' }}>Description:</strong>
                <div style={{
                  marginTop: '4px',
                  color: '#374151',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  {selectedActivity.action_description}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#165C3C' }}>Timestamp:</strong>
                <div style={{ marginTop: '4px', color: '#374151' }}>
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
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#165C3C' }}>Additional Details:</strong>
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {Object.entries(selectedActivity.details).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: '500', color: '#374151', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                style={{
                  backgroundColor: '#165C3C',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => setShowActivityDetail(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RecentActivity;