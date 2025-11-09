import React, { useState, useRef, useEffect } from 'react';
import { Mail, Search, Star, Trash2, Filter, ArrowUpDown, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const MailOrg = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedMail, setSelectedMail] = useState(null);
  const [mails, setMails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
        // Load mails from mail table
        console.log('[MAIL_ORG] Loading mails...');
        const mailData = await window.electronAPI.getAllMails();
        console.log('[MAIL_ORG] Loaded mails:', mailData);

        // Transform mail data into display format
        const transformedMails = mailData.map(mail => {
          const avatar = 'RBC'; // Regional Blood Center

          return {
            id: mail.id,
            mailId: mail.mail_id,
            from: mail.from_name || 'Regional Blood Center',
            fromEmail: mail.from_email || 'admin@regionalbloodcenter.org',
            avatar: avatar,
            avatarColor: '#165C3C',
            subject: mail.subject,
            preview: mail.preview,
            body: mail.body,
            timestamp: new Date(mail.created_at),
            read: mail.read || false,
            starred: mail.starred || false,
            category: mail.category || 'inbox',
            attachments: [],
            appointmentId: mail.appointment_id,
            status: mail.status,
            declineReason: mail.decline_reason || null,
            requestInfo: {
              title: mail.request_title,
              requestor: mail.requestor,
              organization: mail.request_organization,
              dateSubmitted: mail.date_submitted
            }
          };
        });

        setMails(transformedMails);
      } else {
        // Fallback sample data
        setMails([
          {
            id: 1,
            from: 'Regional Blood Center',
            fromEmail: 'admin@regionalbloodcenter.org',
            avatar: 'RBC',
            avatarColor: '#165C3C',
            subject: 'Partnership Request Approved - Blood Drive at Community Center',
            preview: 'Your partnership request has been approved by the Regional Blood Center...',
            body: 'Dear Partner,\n\nWe are pleased to inform you that your partnership request has been APPROVED by the Regional Blood Center.\n\nNext Steps:\n- Our team will contact you shortly to coordinate the blood drive details.\n- Please prepare the necessary documentation and venue arrangements.\n- Check your calendar for the scheduled appointment.\n\nIf you have any questions, please contact us at admin@regionalbloodcenter.org\n\nBest regards,\nRegional Blood Center Team',
            timestamp: new Date(Date.now() - 2 * 60 * 60000),
            read: false,
            starred: false,
            category: 'inbox',
            attachments: [],
            status: 'approved',
            appointmentId: 'APT001'
          },
          {
            id: 2,
            from: 'Regional Blood Center',
            fromEmail: 'admin@regionalbloodcenter.org',
            avatar: 'RBC',
            avatarColor: '#165C3C',
            subject: 'Partnership Request Declined - Blood Drive at School',
            preview: 'Your partnership request has been declined by the Regional Blood Center...',
            body: 'Dear Partner,\n\nWe regret to inform you that your partnership request has been DECLINED by the Regional Blood Center.\n\nIf you have any questions, please contact us at admin@regionalbloodcenter.org\n\nBest regards,\nRegional Blood Center Team',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60000),
            read: true,
            starred: false,
            category: 'inbox',
            attachments: [],
            status: 'declined',
            declineReason: 'The proposed venue does not meet our safety and accessibility standards. Additionally, the requested date conflicts with another scheduled event in the area.',
            appointmentId: 'APT002'
          },
          {
            id: 3,
            from: 'Regional Blood Center',
            fromEmail: 'admin@regionalbloodcenter.org',
            avatar: 'RBC',
            avatarColor: '#165C3C',
            subject: 'Partnership Request Under Review - Company Blood Drive',
            preview: 'Your partnership request is under review by the Regional Blood Center...',
            body: 'Dear Partner,\n\nYour partnership request is currently UNDER REVIEW by the Regional Blood Center. We will notify you once a decision has been made.\n\nIf you have any questions, please contact us at admin@regionalbloodcenter.org\n\nBest regards,\nRegional Blood Center Team',
            timestamp: new Date(Date.now() - 30 * 60000),
            read: false,
            starred: true,
            category: 'inbox',
            attachments: [],
            status: 'pending',
            appointmentId: 'APT003'
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
        return `Partnership Request Under Review - ${title}`;
      default:
        return `Partnership Request Update - ${title}`;
    }
  };

  const getPreviewByStatus = (status, message) => {
    const preview = message.substring(0, 100);
    switch (status) {
      case 'approved':
        return `Your partnership request has been approved. ${preview}...`;
      case 'declined':
        return `Your partnership request has been declined. ${preview}...`;
      case 'pending':
        return `Your partnership request is under review. ${preview}...`;
      default:
        return `${preview}...`;
    }
  };

  const buildEmailBody = (notification) => {
    const statusMessage = {
      approved: 'We are pleased to inform you that your partnership request has been APPROVED by the Regional Blood Center.',
      declined: 'We regret to inform you that your partnership request has been DECLINED by the Regional Blood Center.',
      pending: 'Your partnership request is currently UNDER REVIEW by the Regional Blood Center. We will notify you once a decision has been made.'
    };

    const formattedDate = notification.timestamp.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const lines = [
      `<strong>${notification.title}</strong>`,
      `(${formattedDate})`,
      '',
      'Dear Partner,',
      '',
      statusMessage[notification.status] || 'This is an update regarding your partnership request.',
      '',

      ''
    ];



    if (notification.status === 'approved') {
      lines.push('Next Steps:');
      lines.push('- Our team will contact you shortly to coordinate the blood drive details.');
      lines.push('- Please Prepare the necessary documentation and venue arrangements.');
      lines.push('- Check your calendar for the scheduled appointment.');
      lines.push('');
    }



    lines.push('If you have any questions, please contact us at admin@regionalbloodcenter.org');
    lines.push('');
    lines.push('Best regards,');
    lines.push('Regional Blood Center Team');

    return lines.join('\n');
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

  const handleMailClick = async (mail) => {
    setSelectedMail(mail);

    // Mark as read in backend
    if (!mail.read) {
      try {
        await window.electronAPI.markMailAsRead(mail.id);
        setMails(prev => prev.map(m =>
          m.id === mail.id ? { ...m, read: true } : m
        ));
      } catch (error) {
        console.error('Error marking mail as read:', error);
      }
    }
  };

  const handleToggleStar = async (mailId, e) => {
    e.stopPropagation();
    try {
      await window.electronAPI.toggleMailStar(mailId);
      setMails(prev => prev.map(m =>
        m.id === mailId ? { ...m, starred: !m.starred } : m
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleDelete = async (mailId, e) => {
    if (e) e.stopPropagation();
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await window.electronAPI.deleteMail(mailId);
        setMails(prev => prev.filter(m => m.id !== mailId));
        if (selectedMail && selectedMail.id === mailId) {
          setSelectedMail(null);
        }
      } catch (error) {
        console.error('Error deleting mail:', error);
        alert('Failed to delete mail');
      }
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
        <style jsx>{`
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
        <h1 className="mail-title">Partnership Responses</h1>
        <p className="mail-subtitle">Messages from Regional Blood Center</p>
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

              {/* --- ADD THIS NEW BLOCK (for Org inbox) --- */}
            {selectedMail.requestInfo && (selectedMail.requestInfo.title || selectedMail.requestInfo.requestor) && (
              <div className="request-details-box">
                <h4 className="request-details-title">Request Details:</h4>
                <div className="request-detail-item">
                  <span className="request-detail-label">Title:</span>
                  <span className="request-detail-value">{selectedMail.requestInfo.title}</span>
                </div>
                <div className="request-detail-item">
                  <span className="request-detail-label">Requestor:</span>
                  <span className="request-detail-value">{selectedMail.requestInfo.requestor} – ({selectedMail.requestInfo.organization})</span>
                </div>
                <div className="request-detail-item">
                  <span className="request-detail-label">Date Submitted:</span>
                  <span className="request-detail-value">
                    {new Date(selectedMail.requestInfo.dateSubmitted).toLocaleDateString('en-US', {
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

            {/* Appointment Info */}
            {selectedMail.appointmentId && (
              <div className="mail-appointment-info">
                <div className="appointment-badge">
                  <Calendar size={16} />
                  <span>Related Appointment ID: {selectedMail.appointmentId}</span>
                </div>
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

      <style jsx>{`
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
        }
      `}</style>
    </div>
  );
};

export default MailOrg;