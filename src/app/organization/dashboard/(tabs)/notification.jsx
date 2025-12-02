import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Trash2,
  MoreVertical,
  Mail,
  Users,
  X,
} from "lucide-react";
import DeleteConfirmationModal from "../../../../components/DeleteConfirmationModal";
import Loader from "../../../../components/Loader";

const NotificationOrg = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeNotificationMenu, setActiveNotificationMenu] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const filterDropdownRef = useRef(null);
  const notificationMenuRef = useRef(null);

  useEffect(() => {
  loadNotifications();

  let lastUnread = 0;
  const interval = setInterval(async () => {
    try {
      if (typeof window !== "undefined" && window.electronAPI) {
        const count = await window.electronAPI.getUnreadNotificationCount();
        if (typeof count === "number" && count > lastUnread) {
          lastUnread = count;
          await loadNotifications();
        } else if (typeof count === "number") {
          lastUnread = count;
        }
      }
    } catch (_) {}
  }, 10000);

  // Listen for notification refresh events from other components
  const handleNotificationRefresh = () => {
    loadNotifications();
  };

  window.addEventListener('notificationsRefreshed', handleNotificationRefresh);

  return () => {
    clearInterval(interval);
    window.removeEventListener('notificationsRefreshed', handleNotificationRefresh);
  };
}, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setIsFilterDropdownOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setActiveNotificationMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
    // In the NotificationOrg component, replace the loadNotifications function with this:

const loadNotifications = async () => {
  try {
    if (!isRefreshing) {
      setIsLoading(true);
    }

    if (typeof window !== "undefined" && window.electronAPI) {
      console.log("[NotificationOrg] Loading notifications from database...");

      // Load notifications from notifications_org table
      const notificationsData =
        await window.electronAPI.getAllNotificationsOrg();

      console.log(
        "[NotificationOrg] Received notifications:",
        notificationsData
      );

      // Load sync notifications
      let syncNotifications = [];
      try {
        if (typeof window.electronAPI.getAllSyncNotifications === 'function') {
          syncNotifications = await window.electronAPI.getAllSyncNotifications();
          console.log("[NotificationOrg] Sync notifications:", syncNotifications);
        }
      } catch (syncError) {
        console.error("[NotificationOrg] Error loading sync notifications:", syncError);
      }

      const readLocalIds = JSON.parse(
        localStorage.getItem("orgReadNotificationIds") || "[]"
      );

      const transformedNotifications = (notificationsData || []).map((n) => {
        const notifType = n.notification_type || n.type;
        const derivedStatus =
          notifType === "stock_expired"
            ? "expired"
            : notifType === "stock_expiring_urgent"
              ? "urgent"
              : notifType === "stock_expiring_soon"
                ? "alert"
                : n.status || "info";

        return {
          id: n.id,
          notificationId: n.notification_id,
          type: notifType || "notification",
          status: derivedStatus,
          priority: n.priority,
          title: n.title,
          message: n.message || n.description,
          requestor: n.requestor || "Regional Blood Center",
          timestamp: new Date(n.updated_at || n.created_at),
          read:
            n.read ||
            n.is_read ||
            false ||
            readLocalIds.includes(n.notification_id) ||
            readLocalIds.includes(n.id),
          appointmentId: n.appointment_id,
          eventDate: n.event_date,
          eventTime: n.event_time,
          eventLocation: n.event_location,
          declineReason: n.decline_reason,
          contactInfo: {
            email: n.contact_email,
            phone: n.contact_phone,
            address: n.event_location || n.contact_address,
            type: n.contact_type,
          },
        };
      });

      // Transform sync notifications
      const syncMails = syncNotifications.map((sync) => {
        const displayStatus = sync.status === 'rejected' ? 'declined' : 
                             sync.status === 'approved' ? 'approved' : 'pending';
        
        const title = displayStatus === 'approved' 
          ? `Sync Request Approved - ${sync.donor_count} Record(s)`
          : displayStatus === 'declined'
          ? `Sync Request Declined - ${sync.donor_count} Record(s)`
          : `Sync Request Pending - ${sync.donor_count} Record(s)`;
        
        const message = displayStatus === 'approved'
          ? `Your sync request for ${sync.donor_count} donor record(s) has been approved and synced successfully.`
          : displayStatus === 'declined'
          ? `Your sync request for ${sync.donor_count} donor record(s) was declined. Reason: ${sync.rejection_reason || 'No reason provided'}`
          : `Your sync request for ${sync.donor_count} donor record(s) is pending review by the Regional Blood Center.`;

        return {
          id: `sync-${sync.id}`,
          notificationId: `SYNC-${sync.id}`,
          type: 'sync_response',
          status: displayStatus,
          priority: displayStatus === 'declined' ? 'high' : 'normal',
          title: title,
          message: message,
          requestor: "Regional Blood Center - Sync Team",
          timestamp: new Date(sync.updated_at || sync.created_at || Date.now()),
          read: sync.is_read || sync.read || false || readLocalIds.includes(`SYNC-${sync.id}`),
          syncData: {
            donorCount: sync.donor_count,
            requestedBy: sync.requested_by,
            rejectionReason: sync.rejection_reason,
            approvedBy: sync.approved_by,
            sourceOrganization: sync.source_organization,
          },
        };
      });

      // Load appointments for upcoming events
      let appointmentsData = [];
      try {
        appointmentsData = await window.electronAPI.getAllAppointments?.() || [];
      } catch (error) {
        console.warn("Could not load appointments for notifications:", error);
      }

      const now = new Date();
      
      // Upcoming events (next 72 hours)
      const upcomingAppointments = appointmentsData
        .filter((apt) => {
          const aptDate = new Date(apt.date + "T" + (apt.time || "00:00:00"));
          const hoursDiff = (aptDate - now) / (1000 * 60 * 60);
          return (
            hoursDiff > 0 &&
            hoursDiff <= 72 &&
            (apt.status === "approved" || apt.status === "scheduled" || apt.status === "confirmed")
          );
        })
        .map((apt) => {
          const aptDate = new Date(apt.date + "T00:00:00");
          const formattedDate = aptDate.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const formattedTime = apt.time 
            ? new Date(`1970-01-01T${apt.time}`).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "TBD";

          return {
            id: `event-${apt.id || apt.appointment_id}`,
            notificationId: `EVENT-${apt.id || apt.appointment_id}`,
            type: "upcoming_event",
            status: "approved",
            priority: "normal",
            title: "Partner, your Blood Drive is Scheduled!",
            message: `Your blood drive event "${apt.title || "Blood Drive"}" is confirmed for ${formattedDate} at ${formattedTime}.`,
            requestor: "Regional Blood Center",
            timestamp: new Date(apt.created_at || apt.date),
            read: readLocalIds.includes(`EVENT-${apt.id || apt.appointment_id}`),
            appointmentId: apt.id || apt.appointment_id,
            eventDate: apt.date,
            eventTime: apt.time,
            contactInfo: apt.contactInfo,
            rbcContactInfo: {
              email: "admin@regionalbloodcenter.org",
              phone: "+63 (85) 225-1234",
              address: "J.V Serina St., Carmen, Cagayan de Oro City, Misamis Oriental.",
            },
          };
        });

      // Combine all notifications
      const allNotifications = [
        ...transformedNotifications,
        ...syncMails,
        ...upcomingAppointments,
      ];

      // Deduplicate by notificationId
      const deduped = Array.from(
        new Map(allNotifications.map((n) => [n.notificationId || n.id, n])).values()
      );

      // Sort: unread first, then by timestamp
      const sortedNotifications = deduped.sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      console.log("[NotificationOrg] Final notifications:", sortedNotifications);
      setNotifications(sortedNotifications);
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
    setNotifications([]);
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
};

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return { bg: "#ecfdf5", border: "#10b981", text: "#059669" };
      case "declined":
        return { bg: "#fee2e2", border: "#ef4444", text: "#dc2626" };
      case "cancelled":
        return { bg: "#fee2e2", border: "#ef4444", text: "#dc2626" };
      case "pending":
        return { bg: "#fef3c7", border: "#f59e0b", text: "#d97706" };
      case "info":
        return { bg: "#dbeafe", border: "#3b82f6", text: "#2563eb" };
      default:
        return { bg: "#f3f4f6", border: "#6b7280", text: "#4b5563" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={20} />;
      case "declined":
        return <XCircle size={20} />;
      case "cancelled":
        return <XCircle size={20} />;
      case "pending":
        return <Clock size={20} />;
      case "info":
        return <Calendar size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "partnership_response":
        return <Mail size={16} />;
      case "sync_response":
        return <Users size={16} />;
      case "upcoming_event":
      case "event_finished":
        return <Calendar size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const formatEventDateTime = (date, time) => {
    if (!date || !time) return "";
    const dateObj = new Date(date + "T" + time);
    return dateObj.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const toggleNotificationReadStatus = async (notificationId) => {
  const notification = notifications.find((n) => n.id === notificationId);
  if (!notification) return;

  const isReadNow = !notification.read;
  
  // Optimistically update UI
  setNotifications((prev) =>
    prev.map((n) => (n.id === notificationId ? { ...n, read: isReadNow } : n))
  );
  setActiveNotificationMenu(null);

  try {
    // Update localStorage
    const readLocalIds = JSON.parse(
      localStorage.getItem("orgReadNotificationIds") || "[]"
    );
    const notifId = notification.notificationId || notification.id;
    
    if (isReadNow && !readLocalIds.includes(notifId)) {
      readLocalIds.push(notifId);
      localStorage.setItem("orgReadNotificationIds", JSON.stringify(readLocalIds));
    } else if (!isReadNow) {
      const filtered = readLocalIds.filter(id => id !== notifId);
      localStorage.setItem("orgReadNotificationIds", JSON.stringify(filtered));
    }

    // Handle different notification types
    if (notification.id.startsWith('sync-')) {
      const syncId = parseInt(notification.id.replace('sync-', ''));
      if (window.electronAPI.markSyncNotificationAsRead) {
        await window.electronAPI.markSyncNotificationAsRead(syncId);
      }
    } else if (notification.id.startsWith('event-')) {
      // Event notifications are stored in localStorage only
      console.log("[NotificationOrg] Event notification marked as read in localStorage");
    } else {
      // Regular notifications
      await window.electronAPI.markOrgNotificationAsRead(notificationId);
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    // Revert UI on error
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: !isReadNow } : n
      )
    );
  }
};
  const markAllAsRead = async () => {
  const readLocalIds = JSON.parse(
    localStorage.getItem("orgReadNotificationIds") || "[]"
  );
  
  // Add all notification IDs to localStorage
  const allIds = notifications.map(n => n.notificationId || n.id);
  const mergedIds = Array.from(new Set([...readLocalIds, ...allIds]));
  localStorage.setItem("orgReadNotificationIds", JSON.stringify(mergedIds));
  
  // Optimistically update UI
  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  
  try {
    // Mark regular notifications as read in database
    const regularNotifications = notifications.filter(n => 
      !n.id.startsWith('sync-') && !n.id.startsWith('event-')
    );
    if (regularNotifications.length > 0) {
      await window.electronAPI.markAllOrgNotificationsAsRead?.();
    }
    
    // Mark sync notifications as read
    const syncNotifications = notifications.filter(n => n.id.startsWith('sync-'));
    if (syncNotifications.length > 0 && window.electronAPI.markSyncNotificationAsRead) {
      const syncIds = syncNotifications.map(n => parseInt(n.id.replace('sync-', '')));
      await Promise.all(
        syncIds.map(id => window.electronAPI.markSyncNotificationAsRead(id))
      );
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    // Optionally reload on error
    loadNotifications();
  }
};

  const handleDeleteClick = (notificationId) => {
    setNotificationToDelete(notificationId);
    setIsDeleteModalOpen(true);
    setActiveNotificationMenu(null);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);
    setIsDeleting(true);

    try {
      // Update local state
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationToDelete)
      );

      // Close detail view if the deleted notification was selected
      if (
        selectedNotification &&
        selectedNotification.id === notificationToDelete
      ) {
        setSelectedNotification(null);
      }

      // Wait 1 second before showing success modal
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsDeleting(false);

      // Show success modal
      setSuccessMessage({
        title: "Deleted Successfully!",
        description: "1 notification(s) have been deleted.",
      });
      setShowSuccessModal(true);

      // Reload notifications to ensure consistency
      await loadNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      setIsDeleting(false);
      alert("Failed to delete notification. Please try again.");
    } finally {
      setNotificationToDelete(null);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);

    // Mark as read
    if (!notification.read) {
      toggleNotificationReadStatus(notification.id);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply filter
    if (activeFilter !== "all") {
      if (activeFilter === "unread") {
        filtered = filtered.filter((n) => !n.read);
      } else if (activeFilter === "partnership_response") {
        filtered = filtered.filter((n) => n.type === "partnership_response");
      } else if (activeFilter === "sync_response") {
        filtered = filtered.filter((n) => n.type === "sync_response");
      } else if (activeFilter === "upcoming_event") {
        filtered = filtered.filter(
          (n) => n.type === "upcoming_event" || n.type === "event_finished"
        );
      } else {
        filtered = filtered.filter((n) => n.status === activeFilter);
      }
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.requestor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      approved: notifications.filter((n) => n.status === "approved").length,
      declined: notifications.filter((n) => n.status === "declined").length,
      cancelled: notifications.filter((n) => n.status === "cancelled").length,
      pending: notifications.filter((n) => n.status === "pending").length,
      partnership_response: notifications.filter(
        (n) => n.type === "partnership_response"
      ).length,
      sync_response: notifications.filter((n) => n.type === "sync_response")
        .length,
      upcoming_event: notifications.filter(
        (n) => n.type === "upcoming_event" || n.type === "event_finished"
      ).length,
    };
  };

  const getFilterLabel = (filter) => {
    const labels = {
      all: "All",
      unread: "Unread",
      approved: "Approved",
      declined: "Declined",
      cancelled: "Cancelled",
      pending: "Pending",
      partnership_response: "Partnership Responses",
      sync_response: "Sync Responses",
      upcoming_event: "Events",
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
        <style jsx>{`
          .notification-content {
            padding: 24px;
            background-color: #f9fafb;
            min-height: 100vh;
            font-family:
              "Inter",
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              Roboto,
              sans-serif;
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
            border-top-color: #165c3c;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading-state p {
            color: #6b7280;
            font-size: 14px;
            font-family:
              "Inter",
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              Roboto,
              sans-serif;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="notification-content">
      {/* Header */}
      <div className="notification-header">
        <h1 className="notification-title">Notifications</h1>
        <p className="notification-subtitle">
          Stay updated with partnership responses and event reminders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#dbeafe" }}>
            <Bell size={20} color="#2563eb" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total</div>
            <div className="stat-value">{counts.all}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#fef3c7" }}>
            <Mail size={20} color="#d97706" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Unread</div>
            <div className="stat-value">{counts.unread}</div>
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
                className={`dropdown-arrow ${isFilterDropdownOpen ? "rotated" : ""}`}
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
                  <h4 className="dropdown-section-title">By Status</h4>
                  <button
                    className={`dropdown-item ${activeFilter === "all" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("all");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    All ({counts.all})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === "unread" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("unread");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Unread ({counts.unread})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === "approved" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("approved");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Approved ({counts.approved})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === "declined" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("declined");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Declined ({counts.declined})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === "pending" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("pending");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Pending ({counts.pending})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === "cancelled" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("cancelled");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Cancelled ({counts.cancelled})
                  </button>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-section">
                  <h4 className="dropdown-section-title">By Type</h4>
                  <button
                    className={`dropdown-item ${activeFilter === "partnership_response" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("partnership_response");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Partnership Responses ({counts.partnership_response})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === "sync_response" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("sync_response");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Sync Responses ({counts.sync_response})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === "upcoming_event" ? "active" : ""}`}
                    onClick={() => {
                      setActiveFilter("upcoming_event");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Upcoming Events ({counts.upcoming_event})
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
            className={`refresh-button ${isRefreshing ? "refreshing" : ""}`}
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
              <p>
                {searchQuery
                  ? "Try adjusting your search"
                  : `No ${activeFilter === "all" ? "" : activeFilter} notifications available`}
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => {
                const colors = getStatusColor(notification.status);
                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? "unread" : ""} ${selectedNotification && selectedNotification.id === notification.id ? "selected" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className="notification-icon"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      }}
                    >
                      <div style={{ color: colors.text }}>
                        {getStatusIcon(notification.status)}
                      </div>
                    </div>

                    <div className="notification-item-content">
                      <div className="notification-item-header">
                        <div className="notification-type-badge">
                          {getTypeIcon(notification.type)}
                          <span>
                            {notification.type === "partnership_response"
                              ? "Partnership Response"
                              : notification.type === "sync_response"
                                ? "Sync Response"
                                : notification.type === "upcoming_event"
                                  ? "Event"
                                  : "Notification"}
                          </span>
                        </div>
                        <span className="notification-time">
                          {getTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <div className="notification-title">
                        {notification.title}
                      </div>
                      <div className="notification-preview">
                        {(notification.message || "").length > 100
                          ? `${notification.message.substring(0, 100)}...`
                          : notification.message || ""}
                      </div>
                      <div className="notification-requestor">
                        From: {notification.requestor}
                      </div>
                    </div>

                    <div className="notification-actions">
                      <button
                        className="notification-menu-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNotificationMenu(
                            activeNotificationMenu === notification.id
                              ? null
                              : notification.id
                          );
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeNotificationMenu === notification.id && (
                        <div
                          className="notification-menu"
                          ref={notificationMenuRef}
                        >
                          <button
                            className="notification-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNotificationReadStatus(notification.id);
                            }}
                          >
                            Mark as {notification.read ? "Unread" : "Read"}
                          </button>
                          <button
                            className="notification-menu-item delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(notification.id);
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
                  backgroundColor: getStatusColor(selectedNotification.status)
                    .bg,
                  borderColor: getStatusColor(selectedNotification.status)
                    .border,
                }}
              >
                <div
                  style={{
                    color: getStatusColor(selectedNotification.status).text,
                  }}
                >
                  {getStatusIcon(selectedNotification.status)}
                </div>
              </div>
              <div className="notification-detail-actions">
                <button
                  className="action-btn"
                  onClick={() =>
                    toggleNotificationReadStatus(selectedNotification.id)
                  }
                  title={
                    selectedNotification.read
                      ? "Mark as unread"
                      : "Mark as read"
                  }
                >
                  {selectedNotification.read ? (
                    <Mail size={18} />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteClick(selectedNotification.id)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="notification-detail-title">
              {selectedNotification.title}
            </div>
            <div className="notification-detail-meta">
              <div className="meta-item">
                <span className="meta-label">From:</span>
                <span className="meta-value">
                  {selectedNotification.requestor}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Time:</span>
                <span className="meta-value">
                  {selectedNotification.timestamp.toLocaleString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {selectedNotification.appointmentId && (
                <div className="meta-item">
                  <span className="meta-label">Appointment ID:</span>
                  <span className="meta-value">
                    {selectedNotification.appointmentId}
                  </span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="status-badge-container">
              <div
                className="status-badge"
                style={{
                  backgroundColor: getStatusColor(selectedNotification.status)
                    .bg,
                  color: getStatusColor(selectedNotification.status).text,
                  borderColor: getStatusColor(selectedNotification.status)
                    .border,
                }}
              >
                {getStatusIcon(selectedNotification.status)}
                <span>Status: {selectedNotification.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Message */}
            <div className="notification-detail-message">
              {selectedNotification.message}
            </div>

            {/* Event Details for Upcoming Events */}
            {selectedNotification.type === "upcoming_event" &&
              selectedNotification.eventDate && (
                <div className="event-details-card">
                  <h4 className="event-details-title">Event Details</h4>
                  <div className="event-details-grid">
                    <div className="event-detail-item">
                      <Calendar size={16} />
                      <span>
                        {formatEventDateTime(
                          selectedNotification.eventDate,
                          selectedNotification.eventTime
                        )}
                      </span>
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

            {/* Reason Display for Declined/Cancelled */}
            {(selectedNotification.status === "declined" ||
              selectedNotification.status === "cancelled") &&
              selectedNotification.declineReason && (
                <div className="decline-reason-display">
                  <div className="decline-reason-header">
                    <XCircle size={20} color="#ef4444" />
                    <strong>
                      {selectedNotification.status === "cancelled"
                        ? "Cancellation Reason"
                        : "Reason for Decline"}
                    </strong>
                  </div>
                  <p className="decline-reason-text">
                    {selectedNotification.declineReason}
                  </p>
                </div>
              )}

            {/* Contact Information for Events */}
            {selectedNotification.type === "upcoming_event" &&
              selectedNotification.contactInfo &&
              (selectedNotification.contactInfo.email ||
                selectedNotification.contactInfo.phone) && (
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>{selectedNotification.contactInfo.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Regional Blood Center Contact Information (for Partnership/Sync Responses, Cancelled, Finished Events, and Upcoming Tomorrow) */}
            {(selectedNotification.type === "partnership_response" ||
              selectedNotification.type === "sync_response" ||
              selectedNotification.status === "cancelled" ||
              selectedNotification.title ===
                "Your Upcoming Blood Drive Partnership Event happening Tomorrow" ||
              selectedNotification.title ===
                "Blood Drive Partnership event now Completed") && (
              <div className="contact-info-card rbc-contact">
                <h4 className="contact-info-title">
                  <Users
                    size={18}
                    style={{ marginRight: "8px", verticalAlign: "middle" }}
                  />
                  Regional Blood Center Contact Information
                </h4>
                <div className="contact-info-grid">
                  <div className="contact-info-item">
                    <Mail size={16} />
                    <span>admin@regionalbloodcenter.org</span>
                  </div>
                  <div className="contact-info-item">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>+63 (85) 225-1234</span>
                  </div>
                  <div className="contact-info-item">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      J.V Serina St., Carmen, Cagayan de Oro City, Misamis
                      Oriental.
                    </span>
                  </div>
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

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemCount={1}
        itemName="notification"
        customTitle="Delete Notification"
      />

      {isDeleting && <Loader />}

      {showSuccessModal && (
        <div
          className="success-modal-overlay"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="success-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="success-modal-close"
              onClick={() => setShowSuccessModal(false)}
            >
              <X size={20} color="#9ca3af" />
            </button>
            <div className="success-modal-icon">
              <div className="success-checkmark-circle">
                <svg width="48" height="48" fill="white" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h3 className="success-modal-title">{successMessage.title}</h3>
            <p className="success-modal-description">
              {successMessage.description}
            </p>
            <button
              className="success-modal-button"
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-content {
          padding: 24px;
          background-color: #f9fafb;
          min-height: 100vh;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .notification-header {
          margin-bottom: 24px;
        }

        .notification-title {
          font-size: 24px;
          font-weight: 700;
          color: #165c3c;
          margin: 0 0 4px 0;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .notification-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          transition:
            transform 0.2s,
            box-shadow 0.2s;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
          outline: none;
        }

        .search-input:focus {
          border-color: #165c3c;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 16px;
          font-size: 14px;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          background-color: #165c3c;
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
          background-color: #165c3c;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .notification-time {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
          line-height: 1.4;
        }

        .notification-preview {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
          line-height: 1.5;
        }

        .notification-requestor {
          font-size: 12px;
          color: #374151;
          font-weight: 500;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
          border: 1px solid;
        }

        .notification-detail-message {
          font-size: 15px;
          color: #374151;
          line-height: 1.7;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
          margin-bottom: 20px;
          white-space: pre-wrap;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .decline-reason-text {
          font-size: 14px;
          color: #7f1d1d;
          margin: 0;
          line-height: 1.6;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
          white-space: pre-wrap;
        }

        .contact-info-card {
          margin-top: 24px;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .contact-info-card.rbc-contact {
          background-color: #ecfdf5;
          border: 2px solid #10b981;
        }

        .contact-info-card.rbc-contact .contact-info-title {
          color: #065f46;
        }

        .contact-info-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .contact-info-item svg {
          color: #6b7280;
          flex-shrink: 0;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
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

        /* Success Modal Styles */
        .success-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .success-modal-content {
          background: white;
          border-radius: 16px;
          padding: 40px;
          max-width: 450px;
          width: 90%;
          text-align: center;
          position: relative;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .success-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .success-modal-close:hover {
          opacity: 0.7;
        }

        .success-modal-icon {
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
        }

        .success-checkmark-circle {
          width: 60px;
          height: 60px;
          background-color: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-modal-title {
          font-size: 22px;
          font-weight: 700;
          color: #1f7a54;
          margin: 0 0 12px 0;
          font-family: "Inter", sans-serif;
        }

        .success-modal-description {
          font-size: 15px;
          color: #6b7280;
          margin: 0 0 28px 0;
          font-family: "Inter", sans-serif;
          line-height: 1.5;
        }

        .success-modal-button {
          background-color: #fbbf24;
          color: #000;
          border: none;
          border-radius: 8px;
          padding: 12px 48px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: "Inter", sans-serif;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .success-modal-button:hover {
          background-color: #f59e0b;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
        }

        .success-modal-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default NotificationOrg;
