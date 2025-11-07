import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, Calendar, Trash2, MoreVertical, Mail, Users, Check, X, AlertTriangle } from 'lucide-react';
import StockExpirationModal from '../../../components/StockExpirationModal';

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeNotificationMenu, setActiveNotificationMenu] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockData, setSelectedStockData] = useState(null);

  const filterDropdownRef = useRef(null);
  const notificationMenuRef = useRef(null);

  useEffect(() => {
    loadNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setActiveNotificationMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }

      if (typeof window !== 'undefined' && window.electronAPI) {
        // Load notifications and appointments (expiration notifications are created automatically by backend scheduler)
        const [notificationsData, appointmentsData] = await Promise.all([
          window.electronAPI.getAllNotifications(),
          window.electronAPI.getAllAppointments()
        ]);

        // Transform notifications
        const transformedNotifications = notificationsData.map(n => {
          // Parse stock data if it exists in link_to field
          let stockData = null;
          let expirationDate = null;
          let serialId = null;

          if (n.link_to) {
            try {
              // Only parse if it looks like JSON (starts with '{')
              if (n.link_to.trim().startsWith('{')) {
                stockData = JSON.parse(n.link_to);
                expirationDate = stockData.expirationDate;
                serialId = stockData.serialId;
                console.log('[Notification] Parsed stock data for notification', n.id, ':', stockData);
                console.log('[Notification] Notification type:', n.notification_type, 'Title:', n.title);
              }
            } catch (e) {
              console.warn('[Notification] Failed to parse stock data for notification', n.id, ':', e);
            }
          }

          return {
            id: n.id,
            notificationId: n.notification_id,
            type: n.notification_type || n.type || 'partnership_request',
            status: n.status,
            title: n.title,
            message: n.message || n.description,
            requestor: n.requestor || 'System',
            timestamp: new Date(n.updated_at || n.created_at),
            read: n.read || n.is_read || false,
            appointmentId: n.appointment_id,
            declineReason: n.decline_reason,
            expirationDate: expirationDate,
            serialId: serialId,
            stockData: stockData,
            contactInfo: {
              email: n.contact_email,
              phone: n.contact_phone,
              address: n.contact_address,
              type: n.contact_type
            }
          };
        });

        // Create event notifications from upcoming appointments
        const now = new Date();
        const upcomingAppointments = appointmentsData
          .filter(apt => {
            const aptDate = new Date(apt.date + 'T' + apt.time);
            const hoursDiff = (aptDate - now) / (1000 * 60 * 60);
            return hoursDiff > 0 && hoursDiff <= 72 && (apt.status === 'approved' || apt.status === 'confirmed');
          })
          .map(apt => {
            const aptDate = new Date(apt.date + 'T' + apt.time);
            const hoursDiff = Math.round((aptDate - now) / (1000 * 60 * 60));

            return {
              id: `event-${apt.id || apt.appointment_id}`,
              notificationId: `EVENT-${apt.id || apt.appointment_id}`,
              type: 'upcoming_event',
              status: 'info',
              title: `Upcoming Event: ${apt.title || 'Blood Drive Partnership'}`,
              message: `Your event "${apt.title || 'Blood Drive Partnership'}" is scheduled in ${hoursDiff} hours at ${apt.contactInfo?.address || 'TBD'}.`,
              requestor: 'Event Reminder',
              timestamp: new Date(apt.created_at || apt.date),
              read: false,
              appointmentId: apt.id || apt.appointment_id,
              eventDate: apt.date,
              eventTime: apt.time,
              contactInfo: apt.contactInfo
            };
          });

        // Combine and sort all notifications
        const allNotifications = [...transformedNotifications, ...upcomingAppointments]
          .sort((a, b) => {
            // Unread first
            if (a.read !== b.read) {
              return a.read ? 1 : -1;
            }
            // Then by timestamp
            return new Date(b.timestamp) - new Date(a.timestamp);
          });

        setNotifications(allNotifications);
      } else {
        // Sample data for browser mode
        setNotifications([
          {
            id: 1,
            notificationId: 'NOTIF-001',
            type: 'partnership_request',
            status: 'pending',
            title: 'Blood Drive Partnership Request',
            message: 'Santos (Barangay) has requested a blood drive partnership for 2025-09-25 at 9:00 AM.',
            requestor: 'Santos - Barangay San Roque',
            timestamp: new Date(Date.now() - 30 * 60000),
            read: false,
            appointmentId: 'APT001'
          },
          {
            id: 2,
            notificationId: 'NOTIF-002',
            type: 'partnership_request',
            status: 'pending',
            title: 'Blood Drive Partnership Request',
            message: 'Cruz (Organization) has requested a blood drive partnership for 2025-09-28 at 2:00 PM.',
            requestor: 'Cruz - XYZ Organization',
            timestamp: new Date(Date.now() - 2 * 60 * 60000),
            read: false
          },
          {
            id: 3,
            notificationId: 'EVENT-001',
            type: 'upcoming_event',
            status: 'info',
            title: 'Upcoming Event: Blood Drive at Community Center',
            message: 'Your event "Blood Drive at Community Center" is scheduled in 24 hours at 123 Main Street.',
            requestor: 'Event Reminder',
            timestamp: new Date(Date.now() - 3 * 60 * 60000),
            read: false,
            eventDate: '2025-10-21',
            eventTime: '10:00',
            appointmentId: 'APT001'
          },
          {
            id: 4,
            notificationId: 'NOTIF-003',
            type: 'partnership_request',
            status: 'approved',
            title: 'Blood Drive Partnership Request Approved',
            message: 'Partnership request from Metro Hospital has been approved.',
            requestor: 'Metro Hospital',
            timestamp: new Date(Date.now() - 5 * 60 * 60000),
            read: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
  };

  const handleAcceptRequest = async (notification) => {
    if (!confirm(`Accept partnership request from ${notification.requestor}?`)) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const fullAppointment = await window.electronAPI.getAppointmentById(notification.appointmentId);

        if (!fullAppointment) {
          alert('Appointment not found. It may have been deleted.');
          return;
        }

        // Update the appointment status
        await window.electronAPI.updateAppointment(
          notification.appointmentId,
          {
            title: fullAppointment.title,
            date: fullAppointment.date,
            time: fullAppointment.time,
            type: fullAppointment.type,
            status: 'approved',
            notes: 'Partnership request approved by centralized system.',
            contactInfo: fullAppointment.contactInfo
          },
          'Central System Admin'
        );

        // Create mail for the organization
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        const dateSubmitted = new Date(notification.timestamp || notification.createdAt);
        const formattedSubmitDate = dateSubmitted.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });

        const subject = `Partnership Request Approved – ${fullAppointment.title}`;
        const preview = 'Your Partnership Request has been APPROVED…';

        const body = `${subject}
(${formattedDate})

Dear Partner,

We are pleased to inform you that your partnership request has been APPROVED by the Regional Blood Center.

Request Details:
Title: ${fullAppointment.title}
Requestor: ${notification.requestor || fullAppointment.contactInfo?.name || 'N/A'}
Date Submitted: ${formattedSubmitDate}
Status: APPROVED

Next Steps:
- Our team will contact you shortly to coordinate the blood drive details.
- Please Prepare the necessary documentation and venue arrangements.
- Check your calendar for the scheduled appointment.

Related Appointment ID: ${notification.appointmentId}

If you have any questions, please contact us at admin@regionalbloodcenter.org

Best regards,
Regional Blood Center Team`;

        console.log('[APPROVAL] Creating mail for organization...');
        const mailResult = await window.electronAPI.createMail({
          from_name: 'Regional Blood Center',
          from_email: 'admin@regionalbloodcenter.org',
          subject: subject,
          preview: preview,
          body: body,
          status: 'approved',
          appointment_id: notification.appointmentId,
          request_title: fullAppointment.title,
          requestor: notification.requestor || fullAppointment.contactInfo?.name || 'N/A',
          request_organization: 'Organization',
          date_submitted: dateSubmitted
        });
        console.log('[APPROVAL] Mail created successfully:', mailResult);
      }

      const updatedNotifications = notifications.map(n =>
        n.id === notification.id
          ? {
              ...n,
              status: 'approved',
              read: true,
              message: `Partnership request from ${notification.requestor} has been approved.`
            }
          : n
      );
      setNotifications(updatedNotifications);

      alert('Partnership request accepted successfully!');
      await loadNotifications();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = async (notification) => {
    if (!confirm(`Decline partnership request from ${notification.requestor}?`)) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const fullAppointment = await window.electronAPI.getAppointmentById(notification.appointmentId);

        if (!fullAppointment) {
          alert('Appointment not found. It may have been deleted.');
          return;
        }

        await window.electronAPI.updateNotificationStatus(
          notification.notificationId,
          'declined',
          'Central System Admin'
        );

        await window.electronAPI.updateAppointment(
          notification.appointmentId,
          {
            title: fullAppointment.title,
            date: fullAppointment.date,
            time: fullAppointment.time,
            type: fullAppointment.type,
            status: 'cancelled',
            notes: 'Partnership request declined by centralized system.',
            contactInfo: fullAppointment.contactInfo
          },
          'Central System Admin'
        );
      }

      const updatedNotifications = notifications.map(n =>
        n.id === notification.id
          ? {
              ...n,
              status: 'declined',
              read: true,
              message: `Partnership request from ${notification.requestor} has been declined.`
            }
          : n
      );
      setNotifications(updatedNotifications);

      alert('Partnership request declined.');
      await loadNotifications();
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { bg: '#ecfdf5', border: '#10b981', text: '#059669' };
      case 'declined': return { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' };
      case 'pending': return { bg: '#fef3c7', border: '#f59e0b', text: '#d97706' };
      case 'info': return { bg: '#dbeafe', border: '#3b82f6', text: '#2563eb' };
      default: return { bg: '#f3f4f6', border: '#6b7280', text: '#4b5563' };
    }
  };

  // Get notification icon colors (background and border)
  const getNotificationIconColor = (notification) => {
    const type = notification.type;
    const statusColors = getStatusColor(notification.status);

    // White background for new notification types (keep the original border color)
    if (type === 'expiration_warning' || type === 'stock_expiring_soon' || type === 'stock_expiring_urgent' ||
        type === 'blood_release' || type === 'blood_adding' || type === 'blood_restoring' ||
        type === 'blood_discarding' || type === 'nonconforming_adding' ||
        type === 'blood_stock_update' || type === 'nonconforming_update' || type === 'released_update') {
      return { bg: '#FFFFFF', border: statusColors.border, text: statusColors.text };
    }

    // Default to status color for other notifications
    return statusColors;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={20} />;
      case 'declined': return <XCircle size={20} />;
      case 'pending': return <Clock size={20} />;
      case 'info': return <Calendar size={20} />;
      default: return <Bell size={20} />;
    }
  };

  // Get the main notification icon (the big circle icon on the left)
  const getNotificationMainIcon = (notification) => {
    const type = notification.type;

    // Stock expiration notifications
    if (type === 'expiration_warning' || type === 'stock_expiring_soon' || type === 'stock_expiring_urgent') {
      return <img src="/assets/urgent-blood.png" alt="Blood Alert" style={{ width: '24px', height: '24px' }} />;
    }

    // Blood operation confirmations
    if (type === 'blood_release' || type === 'blood_adding' || type === 'blood_restoring' ||
        type === 'blood_discarding' || type === 'nonconforming_adding') {
      return <img src="/assets/release-done.png" alt="Confirmation" style={{ width: '24px', height: '24px' }} />;
    }

    // Stock update notifications
    if (type === 'blood_stock_update' || type === 'nonconforming_update' || type === 'released_update') {
      return <img src="/assets/blood-update.png" alt="Stock Update" style={{ width: '24px', height: '24px' }} />;
    }

    // Default to status icon for other notifications
    return getStatusIcon(notification.status);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'partnership_request': return <Mail size={16} />;
      case 'upcoming_event': return <Calendar size={16} />;
      case 'expiration_warning':
      case 'stock_expiring_soon':
      case 'stock_expiring_urgent':
      case 'blood_release':
      case 'blood_adding':
      case 'blood_restoring':
      case 'blood_discarding':
      case 'nonconforming_adding':
      case 'blood_stock_update':
      case 'nonconforming_update':
      case 'released_update':
        return <AlertTriangle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const formatEventDateTime = (date, time) => {
    if (!date || !time) return '';
    const dateObj = new Date(date + 'T' + time);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const toggleNotificationReadStatus = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: !n.read } : n
      )
    );
    setActiveNotificationMenu(null);
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setActiveNotificationMenu(null);
      if (selectedNotification && selectedNotification.id === notificationId) {
        setSelectedNotification(null);
      }
    }
  };

  const handleNotificationClick = (notification) => {
    console.log('[handleNotificationClick] Selected notification:', notification);
    console.log('[handleNotificationClick] Notification type:', notification.type);
    console.log('[handleNotificationClick] Stock data:', notification.stockData);
    setSelectedNotification(notification);

    // Mark as read
    if (!notification.read) {
      toggleNotificationReadStatus(notification.id);
    }
  };

  const handleViewStockDetails = (notification) => {
    console.log('[handleViewStockDetails] notification:', notification);
    console.log('[handleViewStockDetails] stockData:', notification.stockData);

    if (notification.stockData) {
      setSelectedStockData(notification.stockData);
      setIsStockModalOpen(true);
    } else {
      console.warn('[handleViewStockDetails] No stock data available');
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else if (activeFilter === 'partnership_request') {
        filtered = filtered.filter(n => n.type === 'partnership_request');
      } else if (activeFilter === 'upcoming_event') {
        filtered = filtered.filter(n => n.type === 'upcoming_event');
      } else if (activeFilter === 'stock_expiration') {
        filtered = filtered.filter(n =>
          n.type === 'expiration_warning' ||
          n.type === 'stock_expiring_soon' ||
          n.type === 'stock_expiring_urgent'
        );
      } else if (activeFilter === 'blood_operations') {
        filtered = filtered.filter(n =>
          n.type === 'blood_release' ||
          n.type === 'blood_adding' ||
          n.type === 'blood_restoring' ||
          n.type === 'blood_discarding' ||
          n.type === 'nonconforming_adding'
        );
      } else if (activeFilter === 'stock_updates') {
        filtered = filtered.filter(n =>
          n.type === 'blood_stock_update' ||
          n.type === 'nonconforming_update' ||
          n.type === 'released_update'
        );
      } else {
        filtered = filtered.filter(n => n.status === activeFilter);
      }
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(n =>
        (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.message && n.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.requestor && n.requestor.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const getCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      approved: notifications.filter(n => n.status === 'approved').length,
      declined: notifications.filter(n => n.status === 'declined').length,
      pending: notifications.filter(n => n.status === 'pending').length,
      partnership_request: notifications.filter(n => n.type === 'partnership_request').length,
      upcoming_event: notifications.filter(n => n.type === 'upcoming_event').length,
      stock_expiration: notifications.filter(n =>
        n.type === 'expiration_warning' ||
        n.type === 'stock_expiring_soon' ||
        n.type === 'stock_expiring_urgent'
      ).length,
      blood_operations: notifications.filter(n =>
        n.type === 'blood_release' ||
        n.type === 'blood_adding' ||
        n.type === 'blood_restoring' ||
        n.type === 'blood_discarding' ||
        n.type === 'nonconforming_adding'
      ).length,
      stock_updates: notifications.filter(n =>
        n.type === 'blood_stock_update' ||
        n.type === 'nonconforming_update' ||
        n.type === 'released_update'
      ).length
    };
  };

  const getFilterLabel = (filter) => {
    const labels = {
      all: 'All',
      unread: 'Unread',
      approved: 'Approved',
      declined: 'Declined',
      pending: 'Pending',
      partnership_request: 'Requests',
      upcoming_event: 'Events',
      stock_expiration: 'Stock Alerts',
      blood_operations: 'Operations',
      stock_updates: 'Updates'
    };
    return labels[filter] || filter;
  };

  const filteredNotifications = getFilteredNotifications();
  const counts = getCounts();

  if (isLoading) {
    return (
      <div className="notification-content">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
        <style>{`
          .notification-content {
            padding: 24px;
            background-color: #f9fafb;
            min-height: 100vh;
            font-family: 'Barlow', sans-serif;
          }

          .loading-state {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            gap: 16px;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top-color: #165C3C;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-state p {
            color: #6b7280;
            font-size: 14px;
            font-family: 'Barlow', sans-serif;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="notification-content">
      {/* Header */}
      <div className="notification-header">
        <h1 className="notification-title">Regional Blood Center</h1>
        <p className="notification-subtitle">Notifications</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <Bell size={20} color="#2563eb" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total</div>
            <div className="stat-value">{counts.all}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <Mail size={20} color="#d97706" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Unread</div>
            <div className="stat-value">{counts.unread}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef2f2' }}>
            <AlertTriangle size={20} color="#dc2626" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Stock Alerts</div>
            <div className="stat-value">{counts.stock_expiration}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <Calendar size={20} color="#2563eb" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Events</div>
            <div className="stat-value">{counts.upcoming_event}</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="left-controls">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search notifications..."
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
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
              </svg>
            </button>
            {isFilterDropdownOpen && (
              <div className="filter-dropdown-menu">
                <div className="dropdown-section">
                  <h4 className="dropdown-section-title">By Status</h4>
                  <button
                    className={`dropdown-item ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('all'); setIsFilterDropdownOpen(false); }}
                  >
                    All ({counts.all})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('unread'); setIsFilterDropdownOpen(false); }}
                  >
                    Unread ({counts.unread})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('approved'); setIsFilterDropdownOpen(false); }}
                  >
                    Approved ({counts.approved})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'declined' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('declined'); setIsFilterDropdownOpen(false); }}
                  >
                    Declined ({counts.declined})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('pending'); setIsFilterDropdownOpen(false); }}
                  >
                    Pending ({counts.pending})
                  </button>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-section">
                  <h4 className="dropdown-section-title">By Type</h4>
                  <button
                    className={`dropdown-item ${activeFilter === 'partnership_request' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('partnership_request'); setIsFilterDropdownOpen(false); }}
                  >
                    Partnership Requests ({counts.partnership_request})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'upcoming_event' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('upcoming_event'); setIsFilterDropdownOpen(false); }}
                  >
                    Upcoming Events ({counts.upcoming_event})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'stock_expiration' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('stock_expiration'); setIsFilterDropdownOpen(false); }}
                  >
                    Stock Alerts ({counts.stock_expiration})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'blood_operations' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('blood_operations'); setIsFilterDropdownOpen(false); }}
                  >
                    Blood Operations ({counts.blood_operations})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'stock_updates' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('stock_updates'); setIsFilterDropdownOpen(false); }}
                  >
                    Stock Updates ({counts.stock_updates})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mark All Read Button */}
          {counts.unread > 0 && (
            <button className="mark-all-read-button" onClick={markAllAsRead}>
              <CheckCircle size={16} />
              <span>Mark All Read</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh notifications"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Notifications Layout */}
      <div className="notifications-layout">
        {/* Notifications List */}
        <div className="notifications-list-container">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <h3>No notifications found</h3>
              <p>{searchQuery ? 'Try adjusting your search' : `No ${activeFilter === 'all' ? '' : activeFilter} notifications available`}</p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map(notification => {
                const colors = getNotificationIconColor(notification);
                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''} ${selectedNotification && selectedNotification.id === notification.id ? 'selected' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className="notification-icon"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                    >
                      <div style={{ color: colors.text }}>
                        {getNotificationMainIcon(notification)}
                      </div>
                    </div>

                    <div className="notification-item-content">
                      <div className="notification-item-header">
                        <div className="notification-type-badge">
                          {getTypeIcon(notification.type)}
                          <span>{notification.type === 'partnership_request' ? 'Request' : 'Event'}</span>
                        </div>
                        <span className="notification-time">{getTimeAgo(notification.timestamp)}</span>
                      </div>
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-preview">
                        {notification.message && notification.message.length > 100
                          ? `${notification.message.substring(0, 100)}...`
                          : notification.message || 'No message content'}
                      </div>
                      <div className="notification-requestor">From: {notification.requestor}</div>
                    </div>

                    <div className="notification-actions">
                      <button
                        className="notification-menu-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNotificationMenu(
                            activeNotificationMenu === notification.id ? null : notification.id
                          );
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeNotificationMenu === notification.id && (
                        <div className="notification-menu" ref={notificationMenuRef}>
                          <button
                            className="notification-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNotificationReadStatus(notification.id);
                            }}
                          >
                            Mark as {notification.read ? 'Unread' : 'Read'}
                          </button>
                          <button
                            className="notification-menu-item delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {!notification.read && <div className="unread-dot"></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Detail View */}
        {selectedNotification ? (
          <div className="notification-detail">
            <div className="notification-detail-header">
              <div
                className="notification-detail-icon"
                style={{
                  backgroundColor: getStatusColor(selectedNotification.status).bg,
                  borderColor: getStatusColor(selectedNotification.status).border
                }}
              >
                <div style={{ color: getStatusColor(selectedNotification.status).text }}>
                  {getStatusIcon(selectedNotification.status)}
                </div>
              </div>
              <div className="notification-detail-actions">
                <button
                  className="action-btn"
                  onClick={() => toggleNotificationReadStatus(selectedNotification.id)}
                  title={selectedNotification.read ? 'Mark as unread' : 'Mark as read'}
                >
                  {selectedNotification.read ? <Mail size={18} /> : <CheckCircle size={18} />}
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => deleteNotification(selectedNotification.id)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="notification-detail-title">{selectedNotification.title}</div>
            <div className="notification-detail-meta">
              <div className="meta-item">
                <span className="meta-label">From:</span>
                <span className="meta-value">{selectedNotification.requestor}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Time:</span>
                <span className="meta-value">
                  {selectedNotification.timestamp.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {selectedNotification.appointmentId && (
                <div className="meta-item">
                  <span className="meta-label">Appointment ID:</span>
                  <span className="meta-value">{selectedNotification.appointmentId}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="status-badge-container">
              <div
                className="status-badge"
                style={{
                  backgroundColor: getStatusColor(selectedNotification.status).bg,
                  color: getStatusColor(selectedNotification.status).text,
                  borderColor: getStatusColor(selectedNotification.status).border
                }}
              >
                {getStatusIcon(selectedNotification.status)}
                <span>Status: {selectedNotification.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Message for non-stock-expiration notifications - shown at top */}
            {selectedNotification.type !== 'expiration_warning' &&
              selectedNotification.type !== 'stock_expiring_soon' &&
              selectedNotification.type !== 'stock_expiring_urgent' && (
              <div className="notification-detail-message">
                {selectedNotification.message}
              </div>
            )}

            {/* Action Buttons for Partnership Requests */}
            {selectedNotification.type === 'partnership_request' && selectedNotification.status === 'pending' && (
              <div className="request-actions">
                <button
                  className="action-button accept-button"
                  onClick={() => handleAcceptRequest(selectedNotification)}
                >
                  <Check size={16} />
                  Accept Request
                </button>
                <button
                  className="action-button decline-button"
                  onClick={() => handleDeclineRequest(selectedNotification)}
                >
                  <X size={16} />
                  Decline Request
                </button>
              </div>
            )}

            {/* Event Details for Upcoming Events */}
            {selectedNotification.type === 'upcoming_event' && selectedNotification.eventDate && (
              <div className="event-details-card">
                <h4 className="event-details-title">Event Details</h4>
                <div className="event-details-grid">
                  <div className="event-detail-item">
                    <Calendar size={16} />
                    <span>{formatEventDateTime(selectedNotification.eventDate, selectedNotification.eventTime)}</span>
                  </div>
                  {selectedNotification.contactInfo?.address && (
                    <div className="event-detail-item">
                      <Users size={16} />
                      <span>{selectedNotification.contactInfo.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock Expiration Details */}
            {(selectedNotification.type === 'expiration_warning' ||
              selectedNotification.type === 'stock_expiring_soon' ||
              selectedNotification.type === 'stock_expiring_urgent') && (
              <div className="stock-expiration-card">
                <div className="stock-expiration-header">
                  <AlertTriangle size={20} color="#dc2626" />
                  <h4 className="stock-expiration-title">REMINDERS:</h4>
                </div>
                <p className="stock-expiration-reminder">This stock is about to expire soon!</p>

                <div className="stock-expiration-info">
                  <div className="stock-expiry-date-label">Date:</div>
                  <div className="stock-expiry-date-value">
                    {selectedNotification.expirationDate
                      ? new Date(selectedNotification.expirationDate).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </div>

                  <div className="stock-serial-label">SERIAL ID:</div>
                  <div className="stock-serial-value">{selectedNotification.serialId || 'N/A'}</div>
                </div>

                <p className="stock-expiration-note">
                  <strong>Note:</strong> To prevent wastage of that stock, take action immediately. Thank you!
                </p>

                {selectedNotification.stockData && (
                  <button
                    className="view-stock-details-button"
                    onClick={() => handleViewStockDetails(selectedNotification)}
                  >
                    <AlertTriangle size={16} />
                    View Stock Information
                  </button>
                )}
              </div>
            )}

            {/* Message for stock expiration notifications - shown below REMINDERS box */}
            {(selectedNotification.type === 'expiration_warning' ||
              selectedNotification.type === 'stock_expiring_soon' ||
              selectedNotification.type === 'stock_expiring_urgent') && (
              <div className="notification-detail-message" style={{ marginTop: '16px' }}>
                {selectedNotification.message}
              </div>
            )}

            {/* Decline Reason Display */}
            {selectedNotification.status === 'declined' && selectedNotification.declineReason && (
              <div className="decline-reason-display">
                <div className="decline-reason-header">
                  <XCircle size={20} color="#ef4444" />
                  <strong>Reason for Decline</strong>
                </div>
                <p className="decline-reason-text">{selectedNotification.declineReason}</p>
              </div>
            )}

            {/* Contact Information */}
            {selectedNotification.contactInfo && (selectedNotification.contactInfo.email || selectedNotification.contactInfo.phone) && (
              <div className="contact-info-card">
                <h4 className="contact-info-title">Contact Information</h4>
                <div className="contact-info-grid">
                  {selectedNotification.contactInfo.email && (
                    <div className="contact-info-item">
                      <Mail size={16} />
                      <span>{selectedNotification.contactInfo.email}</span>
                    </div>
                  )}
                  {selectedNotification.contactInfo.phone && (
                    <div className="contact-info-item">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{selectedNotification.contactInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="notification-detail-empty">
            <Bell size={64} color="#d1d5db" />
            <p>Select a notification to view details</p>
          </div>
        )}
      </div>

      {/* Stock Expiration Modal */}
      <StockExpirationModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        stockData={selectedStockData}
      />

      <style>{`
        .notification-content {
          padding: 24px;
          background-color: #f9fafb;
          min-height: 100vh;
          font-family: 'Barlow', sans-serif;
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 4px;
          font-family: 'Barlow', sans-serif;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
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
          outline: none;
        }

        .search-input:focus {
          border-color: #165C3C;
          box-shadow: 0 0 0 2px rgba(22, 92, 60, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
        }

        .filter-dropdown-container {
          position: relative;
        }

        .filter-dropdown-button {
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

        .filter-dropdown-button:hover {
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

        .filter-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          z-index: 1000;
          min-width: 220px;
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

        .dropdown-divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 4px 0;
        }

        .mark-all-read-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #165C3C;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
          font-weight: 500;
          transition: all 0.2s;
        }

        .mark-all-read-button:hover {
          background-color: #134d30;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .refresh-button.refreshing svg {
          animation: spin 1s linear infinite;
        }

        .notifications-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          min-height: 600px;
        }

        .notifications-list-container {
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
          max-height: 600px;
        }

        .notifications-list-container::-webkit-scrollbar {
          width: 8px;
        }

        .notifications-list-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .notifications-list-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .notifications-list-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          position: relative;
          transition: background-color 0.2s;
          gap: 12px;
          cursor: pointer;
        }

        .notification-item:hover {
          background-color: #f9fafb;
        }

        .notification-item.selected {
          background-color: #e8f5e8;
        }

        .notification-item.unread {
          background-color: #fefffe;
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid;
          flex-shrink: 0;
        }

        .notification-item-content {
          flex: 1;
          min-width: 0;
        }

        .notification-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .notification-type-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          font-family: 'Barlow', sans-serif;
        }

        .notification-time {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          font-family: 'Barlow', sans-serif;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
          font-family: 'Barlow', sans-serif;
          line-height: 1.4;
        }

        .notification-preview {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
          font-family: 'Barlow', sans-serif;
          line-height: 1.5;
        }

        .notification-requestor {
          font-size: 12px;
          color: #374151;
          font-weight: 500;
          font-family: 'Barlow', sans-serif;
        }

        .notification-actions {
          position: relative;
          display: flex;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .notification-item:hover .notification-actions {
          opacity: 1;
        }

        .notification-menu-button {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6b7280;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .notification-menu-button:hover {
          background-color: #f3f4f6;
        }

        .notification-menu {
          position: absolute;
          right: 0;
          top: 100%;
          background: white;
          border-radius: 6px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          z-index: 100;
          min-width: 150px;
          overflow: hidden;
          margin-top: 4px;
        }

        .notification-menu-item {
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

        .notification-menu-item:hover {
          background-color: #f3f4f6;
        }

        .notification-menu-item.delete:hover {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .unread-dot {
          position: absolute;
          top: 20px;
          right: 12px;
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
        }

        .notification-detail {
          padding: 24px;
          overflow-y: auto;
          max-height: 600px;
        }

        .notification-detail::-webkit-scrollbar {
          width: 8px;
        }

        .notification-detail::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .notification-detail::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .notification-detail::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .notification-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .notification-detail-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid;
          flex-shrink: 0;
        }

        .notification-detail-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: 1px solid #d1d5db;
          padding: 8px;
          cursor: pointer;
          color: #6b7280;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .action-btn.delete-btn:hover {
          background-color: #fee2e2;
          border-color: #dc2626;
          color: #dc2626;
        }

        .notification-detail-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
          font-family: 'Barlow', sans-serif;
          line-height: 1.4;
        }

        .notification-detail-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .meta-item {
          display: flex;
          gap: 8px;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
        }

        .meta-label {
          font-weight: 600;
          color: #6b7280;
        }

        .meta-value {
          color: #374151;
        }

        .status-badge-container {
          margin-bottom: 20px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Barlow', sans-serif;
          border: 1px solid;
        }

        .notification-detail-message {
          font-size: 15px;
          color: #374151;
          line-height: 1.7;
          font-family: 'Barlow', sans-serif;
          margin-bottom: 20px;
          white-space: pre-wrap;
        }

        .stock-info-box {
          margin-top: 16px;
          padding: 16px 20px;
          background-color: #ffffff;
          border: 2px solid #374151;
          border-radius: 4px;
          font-family: 'Barlow', sans-serif;
        }

        .stock-info-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px 0;
          font-family: 'Barlow', sans-serif;
        }

        .stock-info-line {
          font-size: 14px;
          color: #374151;
          margin: 6px 0;
          line-height: 1.6;
          font-family: 'Barlow', sans-serif;
        }

        .stock-info-line strong {
          font-weight: 700;
          color: #111827;
        }

        .request-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Barlow', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          flex: 1;
          justify-content: center;
        }

        .accept-button {
          background-color: #10b981;
          color: white;
        }

        .accept-button:hover {
          background-color: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }

        .decline-button {
          background-color: #ef4444;
          color: white;
        }

        .decline-button:hover {
          background-color: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
        }

        .event-details-card {
          margin-top: 24px;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .event-details-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
          font-family: 'Barlow', sans-serif;
        }

        .event-details-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #374151;
          font-family: 'Barlow', sans-serif;
        }

        .event-detail-item svg {
          color: #6b7280;
          flex-shrink: 0;
        }

        .decline-reason-display {
          margin-top: 24px;
          padding: 20px;
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          border-radius: 6px;
        }

        .decline-reason-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .decline-reason-header strong {
          font-size: 16px;
          font-weight: 600;
          color: #991b1b;
          font-family: 'Barlow', sans-serif;
        }

        .decline-reason-text {
          font-size: 14px;
          color: #7f1d1d;
          margin: 0;
          line-height: 1.6;
          font-family: 'Barlow', sans-serif;
          white-space: pre-wrap;
        }

        .contact-info-card {
          margin-top: 24px;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .contact-info-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
          font-family: 'Barlow', sans-serif;
        }

        .contact-info-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contact-info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #374151;
          font-family: 'Barlow', sans-serif;
        }

        .contact-info-item svg {
          color: #6b7280;
          flex-shrink: 0;
        }

        .stock-expiration-card {
          margin-top: 24px;
          padding: 24px;
          background-color: #fef2f2;
          border-radius: 8px;
          border: 2px solid #dc2626;
        }

        .stock-expiration-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .stock-expiration-title {
          font-size: 18px;
          font-weight: 700;
          color: #991b1b;
          margin: 0;
          font-family: 'Barlow', sans-serif;
        }

        .stock-expiration-reminder {
          font-size: 15px;
          color: #7f1d1d;
          margin: 0 0 20px 0;
          font-weight: 500;
          font-family: 'Barlow', sans-serif;
        }

        .stock-expiration-info {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px 16px;
          margin-bottom: 20px;
          padding: 16px;
          background-color: white;
          border-radius: 6px;
          border: 1px solid #fca5a5;
        }

        .stock-expiry-date-label,
        .stock-serial-label {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          font-family: 'Barlow', sans-serif;
        }

        .stock-expiry-date-value {
          font-size: 24px;
          font-weight: 700;
          color: #dc2626;
          font-family: 'Barlow', sans-serif;
        }

        .stock-serial-value {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          font-family: 'Barlow', sans-serif;
        }

        .stock-expiration-note {
          font-size: 14px;
          color: #7f1d1d;
          margin: 0 0 20px 0;
          line-height: 1.6;
          font-family: 'Barlow', sans-serif;
        }

        .stock-expiration-note strong {
          font-weight: 700;
        }

        .view-stock-details-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 24px;
          background-color: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Barlow', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-stock-details-button:hover {
          background-color: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
        }

        .notification-detail-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 600px;
          color: #9ca3af;
        }

        .notification-detail-empty p {
          margin-top: 16px;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
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

        .empty-state svg {
          opacity: 0.5;
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
        }

        @media (max-width: 1024px) {
          .notifications-layout {
            grid-template-columns: 1fr;
          }

          .notifications-list-container {
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
            max-height: 400px;
          }

          .notification-detail,
          .notification-detail-empty {
            min-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .notification-content {
            padding: 16px;
          }

          .controls-bar {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .left-controls,
          .right-controls {
            width: 100%;
          }

          .right-controls {
            justify-content: space-between;
          }

          .search-input {
            width: 100%;
          }

          .filter-dropdown-button {
            min-width: 140px;
            flex: 1;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .notification-detail-header {
            flex-direction: column;
            gap: 16px;
          }

          .notification-detail-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .request-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .notification-title {
            font-size: 20px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filter-dropdown-button {
            font-size: 13px;
            padding: 6px 12px;
            min-width: 120px;
          }

          .notification-item {
            padding: 12px;
          }

          .notification-detail {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationComponent;
