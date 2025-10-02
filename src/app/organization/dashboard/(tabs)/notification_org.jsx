import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, X, Clock, Search, Check, Filter, ArrowUpDown } from 'lucide-react';

const NotificationOrg = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  
  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sample notifications data
  const notifications = [
    {
      id: 1,
      status: 'approved',
      title: 'Blood Drive Partnership Request Approved',
      message: 'Your blood drive partnership request with Metro Hospital has been approved.',
      requestor: 'Metro Hospital',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: false
    },
    {
      id: 2,
      status: 'declined',
      title: 'Sync Request Declined',
      message: 'Your sync request with Butuan Blood Center has been declined.',
      requestor: 'Butuan Blood Center',
      timestamp: new Date(Date.now() - 2 * 60 * 60000),
      read: false
    },
    {
      id: 3,
      status: 'info',
      title: 'Profile Updated Successfully',
      message: 'Your profile information has been updated successfully. Changes include contact number and address.',
      requestor: 'System',
      timestamp: new Date(Date.now() - 3 * 60 * 60000),
      read: false
    },
    {
      id: 4,
      status: 'info',
      title: 'Password Changed',
      message: 'Your password has been changed successfully. If this was not you, please contact support immediately.',
      requestor: 'Security System',
      timestamp: new Date(Date.now() - 4 * 60 * 60000),
      read: true
    },
    {
      id: 5,
      status: 'pending',
      title: 'Blood Drive Partnership Request Pending',
      message: 'Your blood drive partnership request with Xavier University is under review.',
      requestor: 'Xavier University',
      timestamp: new Date(Date.now() - 5 * 60 * 60000),
      read: true
    },
    {
      id: 6,
      status: 'info',
      title: 'Account Login Detected',
      message: 'New login detected from Chrome on Windows at 192.168.1.100. Login time: 2:30 PM.',
      requestor: 'Security System',
      timestamp: new Date(Date.now() - 6 * 60 * 60000),
      read: true
    },
    {
      id: 7,
      status: 'approved',
      title: 'Sync Request Approved',
      message: 'Your sync request with Iligan Medical Center has been approved.',
      requestor: 'Iligan Medical Center',
      timestamp: new Date(Date.now() - 7 * 60 * 60000),
      read: false
    },
    {
      id: 8,
      status: 'info',
      title: 'Email Verification Complete',
      message: 'Your email address has been successfully verified. You can now receive important notifications.',
      requestor: 'System',
      timestamp: new Date(Date.now() - 8 * 60 * 60000),
      read: true
    },
    {
      id: 9,
      status: 'warning',
      title: 'Failed Login Attempts',
      message: 'Multiple failed login attempts detected on your account. Please ensure your password is secure.',
      requestor: 'Security System',
      timestamp: new Date(Date.now() - 12 * 60 * 60000),
      read: false
    },
    {
      id: 10,
      status: 'info',
      title: 'Profile Photo Updated',
      message: 'Your profile photo has been updated successfully.',
      requestor: 'System',
      timestamp: new Date(Date.now() - 24 * 60 * 60000),
      read: true
    }
  ];

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(n => n.status === activeFilter);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.requestor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'unread':
          if (a.read !== b.read) {
            return a.read ? 1 : -1; // Unread first
          }
          return new Date(b.timestamp) - new Date(a.timestamp); // Then by newest
        case 'status':
          const statusOrder = { 'pending': 0, 'warning': 1, 'approved': 2, 'declined': 3, 'info': 4 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          return new Date(b.timestamp) - new Date(a.timestamp); // Then by newest
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    return sorted;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return timestamp.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'declined': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'warning': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />;
      case 'declined': return <X size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'info': return <Bell size={16} />;
      case 'warning': return <Bell size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getCounts = () => {
    return {
      all: notifications.length,
      approved: notifications.filter(n => n.status === 'approved').length,
      pending: notifications.filter(n => n.status === 'pending').length,
      declined: notifications.filter(n => n.status === 'declined').length,
      info: notifications.filter(n => n.status === 'info').length,
      warning: notifications.filter(n => n.status === 'warning').length
    };
  };

  const getSortLabel = (sortKey) => {
    switch (sortKey) {
      case 'newest': return 'Latest';
      case 'oldest': return 'Oldest ';
      case 'unread': return 'Unread';
      case 'status': return 'By Status';
      default: return 'Latest';
    }
  };

  const getFilterLabel = (filter) => {
    if (filter === 'all') return 'All';
    return filter.charAt(0).toUpperCase() + filter.slice(1);
  };

  const filteredNotifications = getFilteredNotifications();
  const counts = getCounts();

  return (
    <div className="notification-org-content">
      {/* Header */}
      <div className="notification-header">
        <h1 className="notification-title" style={{fontSize: '24px', color: '#165C3C', fontWeight: 'bold', fontFamily: 'Barlow'}}>Regional Blood Center</h1>
        <p className="notification-subtitle">Notification</p>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="left-controls">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search notifications"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="right-controls">
          {/* Filter Dropdown */}
          <div className="filter-dropdown-container" ref={filterDropdownRef}>
            <button 
              className="filter-dropdown-button"
              onClick={() => {
                setIsFilterDropdownOpen(!isFilterDropdownOpen);
                setIsSortDropdownOpen(false);
              }}
            >
              <Filter size={16} />
              <span>Filter: {getFilterLabel(activeFilter)}</span>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className={`dropdown-arrow ${isFilterDropdownOpen ? 'rotated' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m19 9-7 7-7-7"
                />
              </svg>
            </button>
            {isFilterDropdownOpen && (
              <div className="filter-dropdown-menu">
                <div className="dropdown-section">
                  <h4 className="dropdown-section-title">Filter by Status</h4>
                  <button 
                    className={`dropdown-item ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('all'); setIsFilterDropdownOpen(false); }}
                  >
                    All ({counts.all})
                  </button>
                  <button 
                    className={`dropdown-item ${activeFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('approved'); setIsFilterDropdownOpen(false); }}
                  >
                    Approved ({counts.approved})
                  </button>
                  <button 
                    className={`dropdown-item ${activeFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('pending'); setIsFilterDropdownOpen(false); }}
                  >
                    Pending ({counts.pending})
                  </button>
                  <button 
                    className={`dropdown-item ${activeFilter === 'declined' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('declined'); setIsFilterDropdownOpen(false); }}
                  >
                    Declined ({counts.declined})
                  </button>
                  <button 
                    className={`dropdown-item ${activeFilter === 'info' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('info'); setIsFilterDropdownOpen(false); }}
                  >
                    Info ({counts.info})
                  </button>
                  <button 
                    className={`dropdown-item ${activeFilter === 'warning' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('warning'); setIsFilterDropdownOpen(false); }}
                  >
                    Warning ({counts.warning})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="sort-dropdown-container" ref={sortDropdownRef}>
            <button 
              className="sort-dropdown-button"
              onClick={() => {
                setIsSortDropdownOpen(!isSortDropdownOpen);
                setIsFilterDropdownOpen(false);
              }}
            >
              <ArrowUpDown size={16} />
              <span>Sort: {getSortLabel(sortBy)}</span>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className={`dropdown-arrow ${isSortDropdownOpen ? 'rotated' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m19 9-7 7-7-7"
                />
              </svg>
            </button>
            {isSortDropdownOpen && (
              <div className="sort-dropdown-menu">
                <div className="dropdown-section">
                  <h4 className="dropdown-section-title">Sort Options</h4>
                  <button 
                    className={`dropdown-item ${sortBy === 'newest' ? 'active' : ''}`}
                    onClick={() => { setSortBy('newest'); setIsSortDropdownOpen(false); }}
                  >
                    Latest
                  </button>
                  <button 
                    className={`dropdown-item ${sortBy === 'oldest' ? 'active' : ''}`}
                    onClick={() => { setSortBy('oldest'); setIsSortDropdownOpen(false); }}
                  >
                    Oldest
                  </button>
                  <button 
                    className={`dropdown-item ${sortBy === 'unread' ? 'active' : ''}`}
                    onClick={() => { setSortBy('unread'); setIsSortDropdownOpen(false); }}
                  >
                    Unread
                  </button>
                  <button 
                    className={`dropdown-item ${sortBy === 'status' ? 'active' : ''}`}
                    onClick={() => { setSortBy('status'); setIsSortDropdownOpen(false); }}
                  >
                    By Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-container">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <h3>No notifications found</h3>
            <p>No {activeFilter === 'all' ? '' : activeFilter} notifications available</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div 
                  className="notification-icon"
                  style={{ color: getStatusColor(notification.status) }}
                >
                  {getStatusIcon(notification.status)}
                </div>

                <div className="notification-content">
                  <div className="notification-main">
                    <h4 className="notification-title-text">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-requestor">From: {notification.requestor}</span>
                  </div>
                  
                  <div className="notification-meta">
                    <span className="notification-time">{getTimeAgo(notification.timestamp)}</span>
                    <span 
                      className="status-badge"
                      style={{ 
                        color: getStatusColor(notification.status),
                        backgroundColor: `${getStatusColor(notification.status)}15`
                      }}
                    >
                      {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                    </span>
                  </div>
                </div>

                {!notification.read && <div className="unread-dot"></div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-Medium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-SemiBold.ttf') format('truetype');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-Bold.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        .notification-org-content {
          padding: 24px;
          background-color: #f9fafb;
          min-height: 100vh;
          font-family: 'Barlow';
          border-radius: 8px;
        }

        .notification-header {
          margin-bottom: 24px;
        }

        .notification-title {
          font-size: 24px;
          font-weight: 700;
          color: #165C3C;
          margin: 0 0 4px 0;
          font-family: 'Barlow', sans-serif;
        }

        .notification-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
          font-family: 'Barlow', sans-serif;
        }

        .controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          background-color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 10;
        }

        .left-controls {
          display: flex;
          align-items: center;
        }

        .right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-dropdown-container,
        .sort-dropdown-container {
          position: relative;
        }

        .filter-dropdown-button,
        .sort-dropdown-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
          font-weight: 500;
          transition: all 0.2s;
          min-width: 160px;
          justify-content: space-between;
        }

        .filter-dropdown-button:hover,
        .sort-dropdown-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .dropdown-arrow {
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }

        .filter-dropdown-menu,
        .sort-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
          z-index: 1000;
          min-width: 200px;
          overflow: hidden;
          animation: dropdownSlide 0.15s ease-out;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-section {
          padding: 8px 0;
        }

        .dropdown-section-title {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 8px 0;
          padding: 0 16px;
          font-family: 'Barlow', sans-serif;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 16px;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
          font-weight: 400;
          color: #374151;
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .dropdown-item:hover {
          background-color: #f3f4f6;
        }

        .dropdown-item.active {
          background-color: #165C3C;
          color: white;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding-left: 40px;
          padding-right: 16px;
          padding-top: 8px;
          padding-bottom: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          width: 300px;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
          font-weight: 400;
          outline: none;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
        }

        .notifications-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .notifications-list {
          max-height: 600px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
          position: relative;
          transition: background-color 0.2s;
          gap: 16px;
        }

        .notification-item:hover {
          background-color: #f9fafb;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item.unread {
          background-color: #fefffe;
          border-left: 4px solid #10b981;
          padding-right: 28px;
        }

        .notification-icon {
          margin-top: 2px;
          flex-shrink: 0;
        }

        .notification-content {
          display: flex;
          flex: 1;
          min-width: 0;
          gap: 16px;
        }

        .notification-main {
          flex: 1;
          min-width: 0;
        }

        .notification-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
          text-align: right;
        }

        .notification-title-text {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
          line-height: 1.4;
          font-family: 'Barlow', sans-serif;
        }

        .notification-message {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
          margin: 0 0 8px 0;
          font-family: 'Barlow', sans-serif;
          font-weight: 400;
        }

        .notification-requestor {
          font-size: 13px;
          color: #374151;
          font-weight: 500;
          font-family: 'Barlow', sans-serif;
        }

        .notification-time {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          font-family: 'Barlow', sans-serif;
          font-weight: 400;
        }

        .status-badge {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 8px;
          border-radius: 12px;
          border: 1px solid currentColor;
          font-family: 'Barlow', sans-serif;
        }

        .unread-dot {
          position: absolute;
          top: 24px;
          right: 12px;
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          z-index: 1;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          text-align: center;
          color: #6b7280;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 16px 0 8px 0;
          color: #374151;
          font-family: 'Barlow', sans-serif;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0;
          font-family: 'Barlow', sans-serif;
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .controls-bar {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .right-controls {
            justify-content: space-between;
          }

          .search-input {
            width: 100%;
          }

          .filter-dropdown-button,
          .sort-dropdown-button {
            min-width: 140px;
          }

          .notification-content {
            flex-direction: column;
            gap: 12px;
          }

          .notification-meta {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .notification-item {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationOrg;