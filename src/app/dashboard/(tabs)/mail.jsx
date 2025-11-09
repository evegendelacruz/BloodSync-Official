import React, { useState, useRef, useEffect } from 'react';
import { Mail, Search, Star, Trash2, Reply, Send, Filter, ArrowUpDown, X, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const MailComponent = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedMail, setSelectedMail] = useState(null);
  const [mails, setMails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [mailToDecline, setMailToDecline] = useState(null);

  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Load mails on component mount
  useEffect(() => {
    loadMails();

    // Refresh every 30 seconds
    const interval = setInterval(loadMails, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadMails = async () => {
    try {
      setIsLoading(true);

      if (typeof window !== 'undefined' && window.electronAPI) {
        // Load partnership requests from the database
        const requests = await window.electronAPI.getAllPartnershipRequests();

        // Load sync requests from the database
        const syncRequests = await window.electronAPI.getPendingSyncRequests();

        // Group sync requests by source organization and user
        const groupedSyncRequests = syncRequests.reduce((acc, record) => {
          const key = `${record.source_organization}-${record.source_user_id}`;
          if (!acc[key]) {
            acc[key] = {
              source_organization: record.source_organization,
              source_user_name: record.source_user_name,
              sync_requested_at: record.sync_requested_at,
              donors: []
            };
          }
          acc[key].donors.push(record);
          return acc;
        }, {});

        // Transform partnership requests into mail format
        const mailsFromRequests = requests.map(r => {
          const avatar = r.organization_name ? r.organization_name.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase() : 'UN';

          return {
            id: r.id,
            requestId: r.id,
            type: 'partnership',
            from: `${r.organization_name} (${r.organization_barangay})`,
            fromEmail: r.contact_email,
            avatar: avatar,
            avatarColor: getAvatarColor(avatar),
            subject: `Blood Drive Partnership Request`,
            preview: `${r.organization_name} has requested a blood drive partnership for ${new Date(r.event_date).toLocaleDateString()} at ${r.event_time}.`,
            body: buildPartnershipRequestBody(r),
            timestamp: new Date(r.created_at),
            read: r.status !== 'pending',
            starred: false,
            category: 'inbox',
            attachments: [],
            appointmentId: r.appointment_id,
            status: r.status,
            declineReason: null,
            requestInfo: {
              organizationName: r.organization_name,
              organizationBarangay: r.organization_barangay,
              contactName: r.contact_name,
              contactEmail: r.contact_email,
              contactPhone: r.contact_phone,
              eventDate: r.event_date,
              eventTime: r.event_time,
              eventAddress: r.event_address
            }
          };
        });

        // Transform sync requests into mail format
        const mailsFromSyncRequests = Object.values(groupedSyncRequests).map((group, index) => {
          const orgType = group.source_organization.toLowerCase().includes('barangay') ? 'Barangay' : 'Organization';
          const avatar = group.source_user_name.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase();

          return {
            id: `sync-${group.source_organization}-${group.source_user_name}-${index}`,
            requestId: `sync-${group.source_organization}-${group.source_user_name}`,
            type: 'sync',
            from: `${group.source_user_name} (${orgType})`,
            fromEmail: '',
            avatar: avatar,
            avatarColor: getAvatarColor(avatar),
            subject: `Incoming Record Sync Request`,
            preview: `${group.source_user_name} would like to approve ${group.donors.length} pending donor record${group.donors.length > 1 ? 's' : ''}.`,
            body: buildSyncRequestBody(group),
            timestamp: new Date(group.sync_requested_at),
            read: false,
            starred: false,
            category: 'inbox',
            attachments: [],
            status: 'pending',
            syncInfo: {
              userName: group.source_user_name,
              organization: group.source_organization,
              organizationType: orgType,
              donorCount: group.donors.length,
              donors: group.donors
            }
          };
        });

        // Combine and sort by timestamp
        const allMails = [...mailsFromRequests, ...mailsFromSyncRequests].sort((a, b) => b.timestamp - a.timestamp);

        setMails(allMails);
      } else {
        // Fallback sample data
        setMails([
          {
            id: 1,
            from: 'John Smith',
            fromEmail: 'john.smith@hospital.com',
            avatar: 'JS',
            avatarColor: '#3b82f6',
            subject: 'Partnership Request - Blood Drive at Community Center',
            preview: 'We would like to request a partnership for a blood drive event...',
            body: 'Dear Regional Blood Center,\n\nWe would like to request a partnership for a blood drive event at our Community Center.\n\nContact Information:\nName: John Smith\nEmail: john.smith@hospital.com\nPhone: (555) 123-4567\nType: Organization\n\nBest regards,\nJohn Smith',
            timestamp: new Date(Date.now() - 2 * 60 * 60000),
            read: false,
            starred: true,
            category: 'inbox',
            attachments: [],
            status: 'pending',
            appointmentId: 'APT001'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading mails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectByStatus = (status, title) => {
    switch (status) {
      case 'approved':
        return `Partnership Request Approved - ${title}`;
      case 'declined':
        return `Partnership Request Declined - ${title}`;
      case 'pending':
        return `Partnership Request - ${title}`;
      default:
        return `Partnership Request Update - ${title}`;
    }
  };

  const getPreviewByStatus = (status, message) => {
    const preview = message.substring(0, 100);
    switch (status) {
      case 'approved':
        return `Request approved. ${preview}...`;
      case 'declined':
        return `Request declined. ${preview}...`;
      case 'pending':
        return `New partnership request. ${preview}...`;
      default:
        return `${preview}...`;
    }
  };

  const buildPartnershipRequestBody = (request) => {
    // This body is now clean and not redundant.
    // The details will be shown in the new "Request Details" box.
    const lines = [
      `${request.organization_name} has requested a blood drive partnership.`,
      'This partnership request is awaiting your review.'
    ];

    return lines.join('\n');
  };

  const buildSyncRequestBody = (group) => {
    const timestamp = new Date(group.sync_requested_at).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const lines = [
      `This partner ${group.source_user_name} (${group.source_organization.toLowerCase().includes('barangay') ? 'Barangay' : 'Organization'}) would like to approve their new ${group.donors.length} pending donor record${group.donors.length > 1 ? 's' : ''}. Proceed to Donor Record Page.`,
      '',
      'Information:',
      `Name: ${group.source_user_name}`,
      `Organization: ${group.source_organization}`,
      `Timestamp: ${timestamp}`,
      `Number of Donor Records: ${group.donors.length}`,
      '',
      'Click "Proceed Donor Record" button to review the donor records.',
      ''
    ];

    return lines.join('\n');
  };

  const getAvatarColor = (text) => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

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

  const getFilteredMails = () => {
    let filtered = mails;

    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'unread') {
        filtered = filtered.filter(m => !m.read);
      } else if (activeFilter === 'starred') {
        filtered = filtered.filter(m => m.starred);
      } else if (activeFilter === 'approved') {
        filtered = filtered.filter(m => m.status === 'approved');
      } else if (activeFilter === 'declined') {
        filtered = filtered.filter(m => m.status === 'declined');
      } else if (activeFilter === 'pending') {
        filtered = filtered.filter(m => m.status === 'pending');
      } else {
        filtered = filtered.filter(m => m.category === activeFilter);
      }
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.body.toLowerCase().includes(searchQuery.toLowerCase())
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
            return a.read ? 1 : -1;
          }
          return new Date(b.timestamp) - new Date(a.timestamp);
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
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return timestamp.toLocaleDateString();
  };

  const handleMailClick = (mail) => {
    setSelectedMail(mail);

    // Mark as read
    if (!mail.read) {
      setMails(prev => prev.map(m =>
        m.id === mail.id ? { ...m, read: true } : m
      ));
    }
  };

  const handleToggleStar = (mailId, e) => {
    e.stopPropagation();
    setMails(prev => prev.map(m =>
      m.id === mailId ? { ...m, starred: !m.starred } : m
    ));
  };

  const handleDelete = async (mailId, e) => {
    if (e) e.stopPropagation();
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        // Delete from database
        if (typeof window !== 'undefined' && window.electronAPI) {
          await window.electronAPI.deletePartnershipRequest(mailId);
        }

        // Update local state
        setMails(prev => prev.filter(m => m.id !== mailId));
        if (selectedMail && selectedMail.id === mailId) {
          setSelectedMail(null);
        }

        // Reload mails to ensure consistency
        await loadMails();
      } catch (error) {
        console.error('Error deleting mail:', error);
        alert('Failed to delete message. Please try again.');
      }
    }
  };

  const handleReply = () => {
    setShowReplyModal(true);
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    // Here you would normally send the reply via your backend
    alert('Reply sent successfully!');
    setReplyMessage('');
    setShowReplyModal(false);
  };

  const handleProceedDonorRecord = (mail) => {
    // Navigate to Donor Record page
    if (window.location.hash) {
      window.location.hash = '#/dashboard/donor-record';
    } else {
      // Trigger custom event to navigate in dashboard
      window.dispatchEvent(new CustomEvent('navigateTo', { detail: 'donor-record' }));
    }
  };

  const handleAcceptRequest = async (mail) => {
    if (!confirm(`Accept partnership request from ${mail.from}?`)) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        // Get current user
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const approvedBy = user?.fullName || 'RBC Admin';

        // Update partnership request status
        await window.electronAPI.updatePartnershipRequestStatus(
          mail.requestId,
          'approved',
          approvedBy
        );

        // ADD THIS LINE TO UPDATE THE LOCAL CALENDAR
        await window.electronAPI.updateAppointmentStatus(mail.appointmentId, 'scheduled');

        // Create MAIL (not notification) for PARTNERED ORG database
        try {
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

          const dateSubmitted = new Date(mail.requestInfo.eventDate);
          const formattedSubmitDate = dateSubmitted.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          });

          const subject = `Partnership Request Approved – Blood Drive Partnership Request`;
          const preview = 'Your Partnership Request has been APPROVED…';

          // --- THIS IS THE UPDATED BODY ---
          const body = [
            'Dear Partner,',
            '',
            'We are pleased to inform you that your partnership request has been APPROVED by the Regional Blood Center.',
            '',
            'Next Steps:',
            '- Our team will contact you shortly to coordinate the blood drive details.',
            '- Please Prepare the necessary documentation and venue arrangements.',
            '- Check your calendar for the scheduled appointment.',
            '',
            'If you have any questions, please contact us at admin@regionalbloodcenter.org',
            '',
            'Best regards,',
            'Regional Blood Center Team'
          ].join('\n'); // Use \n for new lines
          // --- END OF UPDATED BODY ---

          console.log('[APPROVAL] Creating mail for organization...');
          const mailResult = await window.electronAPI.createMail({
            from_name: 'Regional Blood Center',
            from_email: 'admin@regionalbloodcenter.org',
            subject: subject,
            preview: preview,
            body: body,
            status: 'approved',
            appointment_id: mail.appointmentId,
            request_title: 'Blood Drive Partnership Request',
            requestor: mail.requestInfo.organizationName,
            request_organization: 'Organization',
            date_submitted: dateSubmitted
          });
          console.log('[APPROVAL] Mail created successfully:', mailResult);
        } catch (mailError) {
          console.error('Error creating mail:', mailError);
          // Don't fail the whole operation if mail fails
        }

        // Update local state
        setMails(prev => prev.map(m =>
          m.id === mail.id
            ? { ...m, read: true, status: 'approved' }
            : m
        ));

        if (selectedMail && selectedMail.id === mail.id) {
          setSelectedMail({ ...selectedMail, read: true, status: 'approved' });
        }

        alert('Partnership request accepted successfully!');
        loadMails(); // Reload to get fresh data
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = (mail) => {
    setMailToDecline(mail);
    setShowDeclineModal(true);
    setDeclineReason('');
  };

  const handleConfirmDecline = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining this request.');
      return;
    }

    const mail = mailToDecline;

    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        // Get current user
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const declinedBy = user?.fullName || 'RBC Admin';

        // Update partnership request status
        await window.electronAPI.updatePartnershipRequestStatus(
          mail.requestId,
          'declined',
          declinedBy
        );

        // ADD THIS LINE TO UPDATE THE LOCAL CALENDAR
        await window.electronAPI.updateAppointmentStatus(mail.appointmentId, 'declined');

        // Create MAIL (not notification) for PARTNERED ORG database
        try {
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

          const dateSubmitted = new Date(mail.requestInfo.eventDate);
          const formattedSubmitDate = dateSubmitted.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          });

          const subject = `Partnership Request Declined – Blood Drive Partnership Request`;
          const preview = 'Your Partnership Request has been DECLINED…';

          // --- THIS IS THE UPDATED BODY ---
          const body = [
            'Dear Partner,',
            '',
            'We regret to inform you that your partnership request has been DECLINED by the Regional Blood Center.',
            '',
            'Reason for Decline:',
            declineReason, // This is the reason you type in the modal
            '',
            'If you have any questions or would like to discuss this decision, please contact us at admin@regionalbloodcenter.org',
            '',
            'Best regards,',
            'Regional Blood Center Team'
          ].join('\n'); // Use \n for new lines
          // --- END OF UPDATED BODY ---

          console.log('[DECLINE] Creating mail for organization...');
          const mailResult = await window.electronAPI.createMail({
            from_name: 'Regional Blood Center',
            from_email: 'admin@regionalbloodcenter.org',
            subject: subject,
            preview: preview,
            body: body,
            status: 'declined',
            appointment_id: mail.appointmentId,
            decline_reason: declineReason,
            request_title: 'Blood Drive Partnership Request',
            requestor: mail.requestInfo.organizationName,
            request_organization: 'Organization',
            date_submitted: dateSubmitted
          });
          console.log('[DECLINE] Mail created successfully:', mailResult);
        } catch (mailError) {
          console.error('Error creating mail:', mailError);
          // Don't fail the whole operation if mail fails
        }

        // Update local state
        setMails(prev => prev.map(m =>
          m.id === mail.id
            ? { ...m, read: true, status: 'declined', declineReason: declineReason }
            : m
        ));

        if (selectedMail && selectedMail.id === mail.id) {
          setSelectedMail({ ...selectedMail, read: true, status: 'declined', declineReason: declineReason });
        }

        alert('Partnership request declined.');
        setShowDeclineModal(false);
        setMailToDecline(null);
        setDeclineReason('');
        loadMails(); // Reload to get fresh data
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#10b981" />;
      case 'declined':
        return <XCircle size={16} color="#ef4444" />;
      case 'pending':
        return <Clock size={16} color="#f59e0b" />;
      default:
        return <Mail size={16} color="#6b7280" />;
    }
  };

  const getCounts = () => {
    return {
      all: mails.length,
      unread: mails.filter(m => !m.read).length,
      starred: mails.filter(m => m.starred).length,
      approved: mails.filter(m => m.status === 'approved').length,
      declined: mails.filter(m => m.status === 'declined').length,
      pending: mails.filter(m => m.status === 'pending').length,
      inbox: mails.filter(m => m.category === 'inbox').length
    };
  };

  const getSortLabel = (sortKey) => {
    switch (sortKey) {
      case 'newest': return 'Latest';
      case 'oldest': return 'Oldest';
      case 'unread': return 'Unread';
      default: return 'Latest';
    }
  };

  const getFilterLabel = (filter) => {
    if (filter === 'all') return 'All';
    return filter.charAt(0).toUpperCase() + filter.slice(1);
  };

  const filteredMails = getFilteredMails();
  const counts = getCounts();

  if (isLoading) {
    return (
      <div className="mail-content">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
        <style>{`
          .mail-content {
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
    <div className="mail-content">
      {/* Header */}
      <div className="mail-header">
        <h1 className="mail-title">Partnership Requests</h1>
        <p className="mail-subtitle">Messages from partner organizations</p>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="left-controls">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search messages"
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
                    className={`dropdown-item ${activeFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('pending'); setIsFilterDropdownOpen(false); }}
                  >
                    Pending ({counts.pending})
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
                    className={`dropdown-item ${activeFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('unread'); setIsFilterDropdownOpen(false); }}
                  >
                    Unread ({counts.unread})
                  </button>
                  <button
                    className={`dropdown-item ${activeFilter === 'starred' ? 'active' : ''}`}
                    onClick={() => { setActiveFilter('starred'); setIsFilterDropdownOpen(false); }}
                  >
                    Starred ({counts.starred})
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
                    Unread First
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            className="refresh-button"
            onClick={loadMails}
            title="Refresh messages"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mail List and Detail View */}
      <div className="mail-layout">
        {/* Mail List */}
        <div className="mail-list-container">
          {filteredMails.length === 0 ? (
            <div className="empty-state">
              <Mail size={48} />
              <h3>No messages found</h3>
              <p>{searchQuery ? 'Try adjusting your search' : `No ${activeFilter === 'all' ? '' : activeFilter} messages available`}</p>
            </div>
          ) : (
            <div className="mail-list">
              {filteredMails.map(mail => (
                <div
                  key={mail.id}
                  className={`mail-item ${!mail.read ? 'unread' : ''} ${selectedMail && selectedMail.id === mail.id ? 'selected' : ''}`}
                  onClick={() => handleMailClick(mail)}
                >
                  <div
                    className="mail-avatar"
                    style={{ backgroundColor: mail.avatarColor }}
                  >
                    {mail.avatar}
                  </div>

                  <div className="mail-item-content">
                    <div className="mail-item-header">
                      <span className="mail-from">{mail.from}</span>
                      <div className="mail-meta">
                        {getStatusIcon(mail.status)}
                        <span className="mail-time">{getTimeAgo(mail.timestamp)}</span>
                      </div>
                    </div>
                    <div className="mail-subject">{mail.subject}</div>
                    <div className="mail-preview">{mail.preview}</div>
                  </div>

                  <div className="mail-actions">
                    <button
                      className={`star-button ${mail.starred ? 'starred' : ''}`}
                      onClick={(e) => handleToggleStar(mail.id, e)}
                      title={mail.starred ? 'Unstar' : 'Star'}
                    >
                      <Star size={16} fill={mail.starred ? '#f59e0b' : 'none'} />
                    </button>
                    <button
                      className="delete-button"
                      onClick={(e) => handleDelete(mail.id, e)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {!mail.read && <div className="unread-dot"></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mail Detail View */}
        {selectedMail && (
          <div className="mail-detail">
            <div className="mail-detail-header">
              <div className="mail-detail-from">
                <div
                  className="mail-detail-avatar"
                  style={{ backgroundColor: selectedMail.avatarColor }}
                >
                  {selectedMail.avatar}
                </div>
                <div>
                  <div className="mail-detail-name">{selectedMail.from}</div>
                  <div className="mail-detail-email">{selectedMail.fromEmail}</div>
                </div>
              </div>
              <div className="mail-detail-actions">
                <button
                  className="action-btn"
                  onClick={handleReply}
                  title="Reply"
                >
                  <Reply size={18} />
                </button>
                <button
                  className={`action-btn ${selectedMail.starred ? 'starred' : ''}`}
                  onClick={(e) => handleToggleStar(selectedMail.id, e)}
                  title={selectedMail.starred ? 'Unstar' : 'Star'}
                >
                  <Star size={18} fill={selectedMail.starred ? '#f59e0b' : 'none'} />
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => handleDelete(selectedMail.id, e)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mail-detail-subject">{selectedMail.subject}</div>
            <div className="mail-detail-meta">
              {selectedMail.timestamp.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>

            {/* Status Badge */}
            <div className="status-badge-container">
              <div className={`status-badge status-${selectedMail.status}`}>
                {getStatusIcon(selectedMail.status)}
                <span>Status: {selectedMail.status.toUpperCase()}</span>
              </div>
            </div>

            <div className="mail-detail-body">
              {selectedMail.body.split('\n').map((line, index) => (
                <p key={index}>{line || '\u00A0'}</p>
              ))}
            </div>

              {/* --- ADD THIS NEW BLOCK (for RBC inbox) --- */}
            {selectedMail.requestInfo && (selectedMail.requestInfo.title || selectedMail.requestInfo.organizationName) && (
              <div className="request-details-box">
                <h4 className="request-details-title">Request Details:</h4>
                <div className="request-detail-item">
                  <span className="request-detail-label">Title:</span>
                  <span className="request-detail-value">Blood Drive Partnership Request</span>
                </div>
                <div className="request-detail-item">
                  <span className="request-detail-label">Requestor:</span>
                  <span className="request-detail-value">{selectedMail.requestInfo.organizationName} – ({selectedMail.requestInfo.organizationBarangay})</span>
                </div>
                <div className="request-detail-item">
                  <span className="request-detail-label">Date Submitted:</span>
                  <span className="request-detail-value">
                    {new Date(selectedMail.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )}
            {/* --- END OF NEW BLOCK --- */}

            {/* Decline Reason Display */}
            {selectedMail.status === 'declined' && selectedMail.declineReason && (
              <div className="decline-reason-display">
                <div className="decline-reason-header">
                  <XCircle size={20} color="#ef4444" />
                  <strong>Reason for Decline</strong>
                </div>
                <p className="decline-reason-text">{selectedMail.declineReason}</p>
              </div>
            )}

            {/* Donor Table for Sync Requests */}
            {selectedMail.type === 'sync' && selectedMail.syncInfo && (
              <div className="donor-sync-info">
                <h4 className="donor-table-title">Pending Donor Records ({selectedMail.syncInfo.donorCount})</h4>
                <div className="donor-table-container">
                  <table className="donor-table">
                    <thead>
                      <tr>
                        <th>DONOR ID</th>
                        <th>FIRST NAME</th>
                        <th>MIDDLE NAME</th>
                        <th>LAST NAME</th>
                        <th>GENDER</th>
                        <th>BIRTHDATE</th>
                        <th>AGE</th>
                        <th>BLOOD TYPE</th>
                        <th>RH FACTOR</th>
                        <th>CONTACT NUMBER</th>
                        <th>ADDRESS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMail.syncInfo.donors.map((donor, index) => (
                        <tr key={index}>
                          <td>{donor.donor_id}</td>
                          <td>{donor.first_name}</td>
                          <td>{donor.middle_name || '-'}</td>
                          <td>{donor.last_name}</td>
                          <td>{donor.gender}</td>
                          <td>{new Date(donor.birthdate).toLocaleDateString()}</td>
                          <td>{donor.age}</td>
                          <td>{donor.blood_type}</td>
                          <td>{donor.rh_factor}</td>
                          <td>{donor.contact_number}</td>
                          <td>{donor.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Proceed Donor Record Button for Sync Requests */}
                {selectedMail.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      className="proceed-donor-btn"
                      onClick={() => handleProceedDonorRecord(selectedMail)}
                    >
                      <CheckCircle size={16} />
                      Proceed Donor Record
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Appointment Info for Partnership Requests */}
            {selectedMail.type === 'partnership' && selectedMail.appointmentId && (
              <div className="mail-appointment-info">
                <div className="appointment-badge">
                  <Calendar size={16} />
                  <span>Related Appointment ID: {selectedMail.appointmentId}</span>
                </div>

                {/* Accept/Decline Buttons for Pending Partnership Requests */}
                {selectedMail.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      className="accept-request-btn"
                      onClick={() => handleAcceptRequest(selectedMail)}
                    >
                      <CheckCircle size={16} />
                      Accept Partnership Request
                    </button>
                    <button
                      className="decline-request-btn"
                      onClick={() => handleDeclineRequest(selectedMail)}
                    >
                      <XCircle size={16} />
                      Decline Partnership Request
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!selectedMail && (
          <div className="mail-detail-empty">
            <Mail size={64} color="#d1d5db" />
            <p>Select a message to read</p>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMail && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reply to {selectedMail.from}</h3>
              <button
                className="modal-close"
                onClick={() => setShowReplyModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="reply-to">
                <strong>To:</strong> {selectedMail.fromEmail}
              </div>
              <div className="reply-subject">
                <strong>Subject:</strong> Re: {selectedMail.subject}
              </div>
              <textarea
                className="reply-textarea"
                placeholder="Type your message..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={10}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowReplyModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-send"
                onClick={handleSendReply}
              >
                <Send size={16} />
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && mailToDecline && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Decline Partnership Request</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowDeclineModal(false);
                  setMailToDecline(null);
                  setDeclineReason('');
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="decline-info">
                <p><strong>From:</strong> {mailToDecline.from}</p>
                <p><strong>Subject:</strong> {mailToDecline.subject}</p>
              </div>
              <div className="decline-reason-section">
                <label htmlFor="declineReason" className="decline-label">
                  <strong>Reason for Declining:</strong>
                  <span className="required-asterisk">*</span>
                </label>
                <textarea
                  id="declineReason"
                  className="decline-textarea"
                  placeholder="Please provide a reason for declining this partnership request..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={6}
                />
                <p className="decline-hint">This reason will be sent to the organization and will be visible in their notifications.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowDeclineModal(false);
                  setMailToDecline(null);
                  setDeclineReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-decline-confirm"
                onClick={handleConfirmDecline}
              >
                <XCircle size={16} />
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }

        @font-face {
          font-family: 'Barlow';
          src: url('./src/assets/fonts/Barlow-Bold.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
        }

        .mail-content {
          padding: 24px;
          background-color: #f9fafb;
          min-height: 100vh;
          font-family: 'Barlow', sans-serif;
          border-radius: 8px;
        }

        .mail-header {
          margin-bottom: 24px;
        }

        .mail-title {
          font-size: 24px;
          font-weight: 700;
          color: #165C3C;
          margin: 0 0 4px 0;
          font-family: 'Barlow', sans-serif;
        }

        .mail-subtitle {
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
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
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

        .mail-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          min-height: 600px;
        }

        .mail-list-container {
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
          max-height: 600px;
        }

        .mail-list-container::-webkit-scrollbar {
          width: 8px;
        }

        .mail-list-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .mail-list-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .mail-list-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .mail-list {
          display: flex;
          flex-direction: column;
        }

        .mail-item {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          position: relative;
          transition: background-color 0.2s;
          gap: 12px;
          cursor: pointer;
        }

        .mail-item:hover {
          background-color: #f9fafb;
        }

        .mail-item.selected {
          background-color: #e8f5e8;
        }

        .mail-item.unread {
          background-color: #fefffe;
        }

        .mail-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 11px;
          flex-shrink: 0;
          font-family: 'Barlow', sans-serif;
        }

        .mail-item-content {
          flex: 1;
          min-width: 0;
        }

        .mail-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .mail-from {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          font-family: 'Barlow', sans-serif;
        }

        .mail-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mail-time {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          font-family: 'Barlow', sans-serif;
        }

        .mail-subject {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Barlow', sans-serif;
        }

        .mail-preview {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Barlow', sans-serif;
        }

        .mail-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .mail-item:hover .mail-actions {
          opacity: 1;
        }

        .star-button,
        .delete-button {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6b7280;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .star-button:hover {
          background-color: #fef3c7;
          color: #f59e0b;
        }

        .star-button.starred {
          color: #f59e0b;
        }

        .delete-button:hover {
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

        .mail-detail {
          padding: 24px;
          overflow-y: auto;
          max-height: 600px;
        }

        .mail-detail::-webkit-scrollbar {
          width: 8px;
        }

        .mail-detail::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .mail-detail::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .mail-detail::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .mail-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .mail-detail-from {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mail-detail-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
          font-family: 'Barlow', sans-serif;
        }

        .mail-detail-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          font-family: 'Barlow', sans-serif;
        }

        .mail-detail-email {
          font-size: 14px;
          color: #6b7280;
          font-family: 'Barlow', sans-serif;
        }

        .mail-detail-actions {
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

        .action-btn.starred {
          color: #f59e0b;
          border-color: #f59e0b;
        }

        .action-btn.delete-btn:hover {
          background-color: #fee2e2;
          border-color: #dc2626;
          color: #dc2626;
        }

        .mail-detail-subject {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
          font-family: 'Barlow', sans-serif;
        }

        .mail-detail-meta {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 16px;
          font-family: 'Barlow', sans-serif;
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
        }

        .status-approved {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .status-declined {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        .mail-detail-body {
          font-size: 14px;
          color: #374151;
          line-height: 1.7;
          font-family: 'Barlow', sans-serif;
        }

        .mail-detail-body p {
          margin: 0 0 12px 0;
        }

        /* --- ADD THIS NEW CSS --- */
        .request-details-box {
          margin-top: 24px;
          margin-bottom: 24px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .request-details-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
          font-family: 'Barlow', sans-serif;
        }

        .request-detail-item {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 8px;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
          margin-bottom: 10px;
        }

        .request-detail-item:last-child {
          margin-bottom: 0;
        }

        .request-detail-label {
          font-weight: 500;
          color: #6b7280;
        }

        .request-detail-value {
          font-weight: 500;
          color: #374151;
        }
        /* --- END OF NEW CSS --- */

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

        .mail-appointment-info {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .appointment-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background-color: #e8f5e8;
          color: #165C3C;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Barlow', sans-serif;
          margin-bottom: 16px;
        }

        .request-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .accept-request-btn,
        .decline-request-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Barlow', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .accept-request-btn {
          background-color: #10b981;
          color: white;
        }

        .accept-request-btn:hover {
          background-color: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }

        .decline-request-btn {
          background-color: #ef4444;
          color: white;
        }

        .decline-request-btn:hover {
          background-color: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
        }

        .mail-detail-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 600px;
          color: #9ca3af;
        }

        .mail-detail-empty p {
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

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          font-family: 'Barlow', sans-serif;
        }

        .modal-close {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .modal-close:hover {
          background-color: #f3f4f6;
        }

        .modal-body {
          padding: 24px;
        }

        .reply-to,
        .reply-subject {
          font-size: 14px;
          color: #374151;
          margin-bottom: 12px;
          font-family: 'Barlow', sans-serif;
        }

        .reply-to strong,
        .reply-subject strong {
          font-weight: 600;
          margin-right: 8px;
          font-family: 'Barlow', sans-serif;
        }

        .reply-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
          resize: vertical;
          outline: none;
          margin-top: 12px;
        }

        .reply-textarea:focus {
          border-color: #165C3C;
          box-shadow: 0 0 0 2px rgba(22, 92, 60, 0.1);
        }

        .decline-info {
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .decline-info p {
          font-size: 14px;
          color: #374151;
          margin: 0 0 8px 0;
          font-family: 'Barlow', sans-serif;
        }

        .decline-info p:last-child {
          margin-bottom: 0;
        }

        .decline-reason-section {
          margin-top: 16px;
        }

        .decline-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
          font-family: 'Barlow', sans-serif;
        }

        .required-asterisk {
          color: #ef4444;
          margin-left: 4px;
        }

        .decline-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Barlow', sans-serif;
          resize: vertical;
          outline: none;
          min-height: 120px;
        }

        .decline-textarea:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
        }

        .decline-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          font-family: 'Barlow', sans-serif;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-cancel {
          padding: 8px 16px;
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Barlow', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-send {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #165C3C;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Barlow', sans-serif;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-send:hover {
          background-color: #134a2f;
        }

        .btn-decline-confirm {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Barlow', sans-serif;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-decline-confirm:hover {
          background-color: #dc2626;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 1024px) {
          .mail-layout {
            grid-template-columns: 1fr;
          }

          .mail-list-container {
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
            max-height: 400px;
          }

          .mail-detail,
          .mail-detail-empty {
            min-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .mail-content {
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

          .filter-dropdown-button,
          .sort-dropdown-button {
            min-width: 140px;
            flex: 1;
          }

          .mail-detail-header {
            flex-direction: column;
            gap: 16px;
          }

          .mail-detail-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .request-actions {
            flex-direction: column;
          }
        }

        /* Donor Sync Info Styles */
        .donor-sync-info {
          margin-top: 24px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .donor-table-title {
          font-size: 18px;
          font-weight: 600;
          color: #165C3C;
          margin-bottom: 16px;
        }

        .donor-table-container {
          overflow-x: auto;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .donor-table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
          font-size: 14px;
        }

        .donor-table thead {
          background-color: #165C3C;
          color: white;
        }

        .donor-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .donor-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s;
        }

        .donor-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .donor-table td {
          padding: 12px;
          color: #374151;
          white-space: nowrap;
        }

        .donor-table tbody tr:last-child {
          border-bottom: none;
        }

        .proceed-donor-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #165C3C;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .proceed-donor-btn:hover {
          background-color: #124a2f;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(22, 92, 60, 0.2);
        }

        .proceed-donor-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .mail-title {
            font-size: 20px;
          }

          .filter-dropdown-button,
          .sort-dropdown-button {
            font-size: 13px;
            padding: 6px 12px;
            min-width: 120px;
          }

          .mail-item {
            padding: 12px;
          }

          .mail-detail {
            padding: 16px;
          }

          .donor-table {
            font-size: 12px;
          }

          .donor-table th,
          .donor-table td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default MailComponent;
