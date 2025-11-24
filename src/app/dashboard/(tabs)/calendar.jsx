import React, { useState, useEffect } from 'react';
import { Filter, Search, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Users, BarChart3, X, AlertCircle, XCircle } from 'lucide-react';
const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all'
  });
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState('all');

  // --- ADD THESE NEW LINES ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [eventToCancel, setEventToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  // Success modal (match Plasma NC)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', description: '' });
  // --- END OF NEW LINES ---

  console.log('Calendar render - showFilterMenu:', showFilterMenu);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Load appointments from database
  useEffect(() => {
    loadAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);

      if (typeof window !== 'undefined' && window.electronAPI) {
        // 1. Load regular appointments from organization's local DB
        const appointmentsData = await window.electronAPI.getAllAppointments();

        // 2. Load ALL partnership requests from RBC DB
        const partnershipRequests = await window.electronAPI.getAllPartnershipRequests(null);
        
        // 3. Transform partnership requests
        const partnershipAppointments = partnershipRequests.map(req => {
          let appointmentStatus;
          if (req.status === 'approved') {
            appointmentStatus = 'scheduled';
          } else if (req.status === 'declined') {
            appointmentStatus = 'declined';
          } else {
            // For pending, confirmed, or any other status
            appointmentStatus = req.status;
          }

          return {
            id: `partnership-${req.id}`,
            partnershipRequestId: req.id,
            title: `Blood Drive Partnership - ${req.organization_name}`,
            date: req.event_date,
            time: req.event_time,
            type: 'blood-donation',
            notes: `Partnership event with ${req.organization_name} (${req.organization_barangay})`,
            status: appointmentStatus,
            partnershipStatus: req.status,
            contactInfo: {
              lastName: req.organization_name,
              email: req.contact_email,
              phone: req.contact_phone,
              address: req.event_address || req.organization_barangay,
              type: 'organization'
            }
          };
        });

        // 4. Combine both lists and set state
        setAppointments([...appointmentsData, ...partnershipAppointments]);

      } else {
        // ... (your existing sample data) ...
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  //CANCELLATION METHODS
  // --- ADD THESE NEW FUNCTIONS ---
  const handleCancelClick = (event) => {
    setEventToCancel(event);
    setCancelReason('');
    setShowCancelModal(true);
    setSelectedEvent(null); // Close the details modal
  };

  const handleCloseCancelModal = () => {
    setEventToCancel(null);
    setCancelReason('');
    setShowCancelModal(false);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    if (!eventToCancel) return;

    setIsCancelling(true);

    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      const userName = user?.fullName || 'RBC Admin';

      // Always use appointment_id for backend calls
      const apptId = eventToCancel.id;

      // 1. Cancel the appointment in the org database
      await window.electronAPI.cancelAppointmentWithReason(
        parseInt(apptId, 10),
        cancelReason,
        userName
      );

      // 2. Get appointment details to notify the correct organization
      const appointmentDetails = await window.electronAPI.getAppointmentById(apptId);

      if (appointmentDetails) {
        // Build message body identical to Partnership Request Declined
        const subject = 'Appointment Cancelled – Blood Drive Partnership Request';
        const bodyLines = [
          'Dear Partner,',
          '',
          'We regret to inform you that your partnership appointment has been CANCELLED by the Regional Blood Center.',
          '',
          'Reason for Cancellation:',
          cancelReason,
          '',
          'Best regards,',
          'Regional Blood Center Team'
        ];
        const body = bodyLines.join('\n');

        // 3. Send a notification to the organization's database
        await window.electronAPI.createOrgNotification({
          notificationId: `APPT-CANCELLED-${Date.now()}`,
          type: 'event_update',
          status: 'cancelled',
          title: 'Appointment Cancelled by Regional Blood Center',
          message: body,
          cancellationReason: cancelReason,
          requestorName: userName,
          requestorOrganization: 'Regional Blood Center',
          appointmentId: apptId,
          contactEmail: appointmentDetails.contactInfo?.email || 'admin@regionalbloodcenter.org',
        });
      }

      // 4. Reload all appointments
      await loadAppointments();

      handleCloseCancelModal();

      // Show success modal (Plasma NC style)
      setSuccessMessage({
        title: 'APPOINTMENT CANCELLED',
        description: 'The appointment has been cancelled successfully.'
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error confirming cancellation:', error);
      alert(`Failed to cancel appointment: ${error.message}`);
    } finally {
      setIsCancelling(false);
    }
  };
  // --- END OF NEW FUNCTIONS ---
  //END CANCELLATION METHODS

  // Convert appointments to events format
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes || '00'} ${ampm}`;
  };

  const getEventStatus = (dateStr, status) => {
    // If already cancelled or declined, return as-is
    if (status === 'cancelled' || status === 'declined') return status;

    const eventDate = new Date(dateStr + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return eventDate < today ? 'finished' : 'upcoming';
  };

  const events = appointments
    .filter(apt => apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'cancelled' || apt.status === 'declined' || apt.status === 'scheduled')
    .map(apt => ({
      id: apt.id || apt.appointment_id, // ensure event id matches appointment_id used by backend
      appointmentId: apt.appointment_id,
      title: apt.title || `Blood Drive Partnership - ${apt.contactInfo?.lastName || 'Unknown'}`,
      date: apt.date,
      time: formatTime(apt.time),
      location: apt.contactInfo?.address || 'Location TBD',
      type: 'blood-drive',
      participants: 0,
      status: getEventStatus(apt.date, apt.status),
      contactName: apt.contactInfo?.lastName || 'Unknown',
      contactType: apt.contactInfo?.type || 'unknown',
      contactInfo: apt.contactInfo || {},
      cancelReason: apt.cancellation_reason || apt.cancelReason || null
    })
  );

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.contactName.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = filters.status === 'all' || event.status === filters.status;

    // Type filter (based on contact type)
    const matchesType = filters.type === 'all' || event.contactType === filters.type;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getMonthEvents = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date + 'T00:00:00');
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
  };

  // Generate monthly report data
  const getMonthlyReportData = () => {
    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      // Skip months if a specific month is selected
      if (reportMonth !== 'all' && month !== parseInt(reportMonth)) {
        continue;
      }

      const monthEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate.getMonth() === month && eventDate.getFullYear() === reportYear;
      });

      monthlyData.push({
        month: monthNames[month].substring(0, 3),
        fullMonth: monthNames[month],
        events: monthEvents.length,
        upcoming: monthEvents.filter(e => e.status === 'upcoming').length,
        finished: monthEvents.filter(e => e.status === 'finished').length,
        declined: monthEvents.filter(e => e.status === 'declined').length
      });
    }

    return monthlyData;
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      type: 'all'
    });
    setSearchQuery('');
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay();

    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();

    const days = [];

    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month - 1, day),
        events: []
      });
    }

    // Current month days
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter(event => event.date === dateStr);
      const isToday = isCurrentMonth && day === today.getDate();

      days.push({
        day,
        isCurrentMonth: true,
        date,
        events: dayEvents,
        isToday
      });
    }

    // Next month days to complete the grid
    const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (startingDayOfWeek + daysInMonth);

    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day),
        events: []
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getEventTypeColor = (type, status) => {
    // Use red for cancelled/declined events
    if (status === 'cancelled' || status === 'declined') {
      return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' };
    }
    // --- ADDED: Specific style for cancelled events ---
    if (status === 'cancelled') {
      return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' };
    }
    // --- END ---

    // Use blue for upcoming events, green for finished events
    if (status === 'upcoming') {
      return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
    } else if (status === 'finished') {
      return { bg: '#dcfce7', border: '#10b981', text: '#166534' };
    }

    // Fallback to type-based colors
    switch (type) {
      case 'blood-drive': return { bg: '#e8f5e8', border: '#4caf50', text: '#2e7d32' };
      case 'partnership': return { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' };
      case 'emergency': return { bg: '#ffebee', border: '#f44336', text: '#c62828' };
      case 'meeting': return { bg: '#fff3e0', border: '#ff9800', text: '#e65100' };
      default: return { bg: '#f5f5f5', border: '#9e9e9e', text: '#424242' };
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const monthEvents = getMonthEvents();
  const monthlyReportData = getMonthlyReportData();
  const totalYearEvents = monthlyReportData.reduce((sum, month) => sum + month.events, 0);

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }

  return (
    <div className="calendar-org-content">
      {/* Header */}
      <div className="calendar-header">
        <h1 className="calendar-title">Regional Blood Center</h1>
        <p className="calendar-subtitle">Calendar & Event Scheduling</p>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="left-controls">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="right-controls">
          <div className="filter-dropdown">
            <button
              className={`filter-button ${showFilterMenu ? 'active' : ''}`}
              onClick={() => {
                console.log('Filter button clicked, current state:', showFilterMenu);
                setShowFilterMenu(!showFilterMenu);
              }}
            >
              <Filter size={16} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>

            {showFilterMenu && (
              <div className="filter-menu">
                <div className="filter-section">
                  <label className="filter-label">Status</label>
                  <select
                    className="filter-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="finished">Finished</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div className="filter-section">
                  <label className="filter-label">Partner Type</label>
                  <select
                    className="filter-select"
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="barangay">Barangay</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    className="clear-filters-btn"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            className={`view-button ${showMonthlyReport ? 'active' : ''}`}
            onClick={() => setShowMonthlyReport(!showMonthlyReport)}
          >
            {showMonthlyReport ? (
              <>
                <Calendar size={16} />
                <span>Calendar View</span>
              </>
            ) : (
              <>
                <BarChart3 size={16} />
                <span>Monthly Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Calendar Layout or Monthly Report */}
      {showMonthlyReport ? (
        <div className="monthly-report-container">
          <div className="report-header">
            <div className="report-title-section">
              <div className="report-title-row">
                <h2 className="report-title">Monthly Blood Drive Events Report</h2>
                <div className="report-filters">
                  <select
                    className="report-select"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                  >
                    <option value="all">All Months</option>
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  <select
                    className="report-select"
                    value={reportYear}
                    onChange={(e) => setReportYear(parseInt(e.target.value))}
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="report-subtitle">
                {reportMonth === 'all'
                  ? `${reportYear} Annual Overview`
                  : `${monthNames[parseInt(reportMonth)]} ${reportYear} Overview`}
              </p>
            </div>
            <div className="report-stats">
              <div className="stat-card">
                <div className="stat-value">{totalYearEvents}</div>
                <div className="stat-label">Total Events</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{monthlyReportData.reduce((sum, m) => sum + m.upcoming, 0)}</div>
                <div className="stat-label">Upcoming</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{monthlyReportData.reduce((sum, m) => sum + m.finished, 0)}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyReportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#d1d5db' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  cursor={{ fill: 'rgba(22, 92, 60, 0.1)' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="upcoming"
                  fill="#3b82f6"
                  name="Upcoming Events"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="finished"
                  fill="#10b981"
                  name="Completed Events"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="declined"
                  fill="#ef4444"
                  name="Declined Events"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      ) : (
        <div className="calendar-layout">
          {/* Calendar Grid */}
          <div className="calendar-main">
            <div className="calendar-navigation">
              <button className="nav-button" onClick={() => navigateMonth(-1)}>
                <ChevronLeft size={20} />
              </button>
              <h2 className="month-year">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button className="nav-button" onClick={() => navigateMonth(1)}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="calendar-grid">
              <div className="calendar-header-days">
                {dayNames.map(day => (
                  <div key={day} className="day-header">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-days">
                {renderCalendarDays().map((day, index) => (
                  <div
                    key={index}
                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className="day-number">{day.day}</div>
                    {day.events && day.events.length > 0 && (
                      <div className="events-container">
                        {day.events.map(event => {
                          const colors = getEventTypeColor(event.type, event.status);
                          return (
                            <div
                              key={event.id}
                              className="day-event"                              
                              title={`${event.title} - ${event.time}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                               }}                              
                              style={{
                                backgroundColor: colors.border,
                                textDecoration: event.status === 'cancelled' ? 'line-through' : 'none',
                                opacity: event.status === 'cancelled' ? 0.6 : 1,
                              }}                              
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Events Sidebar */}
          <div className="events-sidebar">
            <div className="sidebar-header">
              <h3>Upcoming Events</h3>
              <p className="events-count">{monthEvents.length} events this month</p>
            </div>

            <div className="events-list">
              {isLoading ? (
                <div className="no-events">Loading appointments...</div>
              ) : monthEvents.length === 0 ? (
                <div className="no-events">No confirmed appointments for this month</div>
              ) : (
                monthEvents.map(event => {
                  const colors = getEventTypeColor(event.type, event.status);
                  return (
                    <div
                      key={event.id}
                      className="event-card"
                      style={{ borderLeft: `4px solid ${colors.border}` }}
                    >
                      <div className="event-card-header">
                        <h4 className="event-title">{event.title}</h4>
                        <span className={`event-status status-${event.status}`}>
                          {event.status}
                        </span>
                      </div>

                      <div className="event-details">
                        <div className="event-detail">
                          <Calendar size={14} />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="event-detail">
                          <Clock size={14} />
                          <span>{event.time}</span>
                        </div>
                        <div className="event-detail">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                        {event.participants > 0 && (
                          <div className="event-detail">
                            <Users size={14} />
                            <span>{event.participants} participants</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedEvent.title}</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedEvent(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-status">
                <span className={`event-status status-${selectedEvent.status}`}>
                  {selectedEvent.status}
                </span>
              </div>

              <div className="modal-details">
                <div className="modal-detail">
                  <Calendar size={16} />
                  <span>{formatDate(selectedEvent.date)}</span>
                </div>
                <div className="modal-detail">
                  <Clock size={16} />
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="modal-detail">
                  <MapPin size={16} />
                  <span>{selectedEvent.location}</span>
                </div>
                {selectedEvent.participants > 0 && (
                  <div className="modal-detail">
                    <Users size={16} />
                    <span>{selectedEvent.participants} participants</span>
                  </div>
                )}              
              </div>

              

              {/* Show cancel reason if event is cancelled or declined */}
              {(selectedEvent.status === 'cancelled' || selectedEvent.status === 'declined') && selectedEvent.cancelReason && (
                <div className="cancel-reason-display">
                  <div className="cancel-reason-header">
                    <AlertCircle size={18} />
                    <strong>{selectedEvent.status === 'declined' ? 'Decline Reason' : 'Cancellation Reason'}</strong>
                  </div>
                  <p className="cancel-reason-text">{selectedEvent.cancelReason}</p>
                </div>
              )}

              {/* --- MODIFIED: CANCELLATION BUTTON VISIBILITY --- */}
              {selectedEvent.status !== 'finished' && selectedEvent.status !== 'cancelled' && selectedEvent.status !== 'declined' && (
                <button
                  className="btn-cancel-appointment"
                  onClick={() => handleCancelClick(selectedEvent)}
                >
                  <XCircle size={16} />
                  {selectedEvent.status === 'upcoming' ? 'Cancel Appointment' : 'Cancel Appointment'}
                </button>
              )}
              {/* --- END OF CANCELLATION BUTTON --- */}
            </div>
          </div>
        </div>
      )}

      {/* --- CANCELLATION MODAL (MOVED OUTSIDE EVENT DETAILS MODAL) --- */}
      {showCancelModal && eventToCancel && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Cancellation Appointment</h3>
              <button
                className="modal-close"
                onClick={handleCloseCancelModal}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="decline-info">
                <p><strong>From:</strong> {eventToCancel.contactName} ({eventToCancel.contactType})</p>
                <p><strong>Subject:</strong> {eventToCancel.title}</p>
              </div>
              <div className="decline-reason-section">
                <label htmlFor="cancelReason" className="decline-label">
                  <strong>Reason for Cancellation:</strong>
                  <span className="required-asterisk">*</span>
                </label>
                <textarea
                  id="cancelReason"
                  className="decline-textarea"
                  placeholder="Please provide a reason for cancelling this appointment..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={5}
                />
                <p className="decline-hint">This reason will be sent to the organization and will be visible in their notifications.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCloseCancelModal}
                disabled={isCancelling}
              >
                Cancel
              </button>
              <button
                className="btn-decline-confirm"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                <XCircle size={16} />
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- END OF CANCELLATION MODAL --- */}

      {/* SUCCESS MODAL (copied style from Plasma NC) */}
      {showSuccessModal && (
        <div className="success-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '10px' }}>
          <div className="success-modal" style={{ backgroundColor: 'white', borderRadius: '11px', width: '30%', maxWidth: '350px', padding: '40px 30px 30px', boxShadow: '0 20px 25px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Barlow', position: 'relative' }}>
            <button className="success-close" style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '4px' }} onClick={() => setShowSuccessModal(false)}>×</button>
            <div className="success-checkmark-circle" style={{ width: '30px', height: '30px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            </div>
            <h3 className="success-modal-title" style={{ fontSize: '20px', fontWeight: 'bold', color: '#165C3C', textAlign: 'center' }}>{successMessage.title}</h3>
            <p className="success-modal-description" style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', lineHeight: 1.5, marginTop: '-5px', paddingLeft: '20px', paddingRight: '20px' }}>{successMessage.description}</p>
            <button className="success-modal-button" style={{ padding: '12px 60px', backgroundColor: '#FFC200', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 600 }} onClick={() => setShowSuccessModal(false)}>OK</button>
          </div>
        </div>
      )}

      <style>{`
        
        /* --- CANCELLATION STYLES --- */
        .btn-cancel-appointment {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          width: 100%;
          justify-content: center;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Barlow', sans-serif; /* <-- FONT FIX */
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 20px;
          background-color: #ef4444; /* <-- STYLE FIX */
          color: white; /* <-- STYLE FIX */
        }

        .btn-cancel-appointment:hover {
          background-color: #dc2626; /* <-- STYLE FIX */
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
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
          font-family: 'Barlow', sans-serif; /* <-- FONT FIX */
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
          font-family: 'Barlow', sans-serif; /* <-- FONT FIX */
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
          font-family: 'Barlow', sans-serif; /* <-- FONT FIX */
          resize: vertical;
          outline: none;
          min-height: 100px;
        }
        .decline-textarea:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
        }
        .decline-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          font-family: 'Barlow', sans-serif; /* <-- FONT FIX */
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
          font-family: 'Barlow', sans-serif; /* <-- FONT FIX */
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
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
          font-family: 'Barlow', sans-serif; /* <-- FONT FIX */
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-decline-confirm:hover {
          background-color: #dc2626;
        }
        /* --- END OF CANCELLATION STYLES --- */

        /* Calendar Organization Styles */
        .calendar-org-content {
          padding: 24px;
          background-color: #f9fafb;
          min-height: auto;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
          animation: fadeIn 0.5s ease-out;
        }

        .calendar-header {
          margin-bottom: 24px;
        }

        .calendar-title {
          font-size: 28px;
          font-weight: 700;
          color: #165C3C;
          margin: 0 0 4px 0;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
        }

        .calendar-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
          font-weight: 400;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
        }

        .controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          background-color: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .left-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding-left: 42px;
          padding-right: 40px;
          padding-top: 10px;
          padding-bottom: 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          width: 320px;
          font-size: 14px;
          outline: none;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input:focus {
          border-color: #165C3C;
          box-shadow: 0 0 0 3px rgba(22, 92, 60, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          z-index: 1;
          color: #9ca3af;
        }

        .clear-search {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          font-size: 24px;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .clear-search:hover {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-dropdown {
          position: relative;
        }

        .filter-button, .view-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
          transition: all 0.2s;
          position: relative;
        }

        .filter-button:hover, .view-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .filter-button.active {
          background-color: #f3f4f6;
          border-color: #165C3C;
          color: #165C3C;
        }

        .filter-badge {
          background-color: #165C3C;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .filter-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          min-width: 250px;
          z-index: 100;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-section {
          margin-bottom: 16px;
        }

        .filter-section:last-of-type {
          margin-bottom: 0;
        }

        .filter-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
        }

        .filter-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
          color: #374151;
          background-color: white;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
        }

        .filter-select:focus {
          border-color: #165C3C;
          box-shadow: 0 0 0 3px rgba(22, 92, 60, 0.1);
        }

        .filter-select:hover {
          border-color: #9ca3af;
        }

        .clear-filters-btn {
          width: 100%;
          padding: 8px 12px;
          background-color: #fee2e2;
          color: #991b1b;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s;
        }

        .clear-filters-btn:hover {
          background-color: #fecaca;
        }

        .view-button.active {
          background-color: #165C3C;
          color: white;
          border-color: #165C3C;
        }

        .view-button.active:hover {
          background-color: #134a2f;
        }

        /* Monthly Report Styles */
        .monthly-report-container {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          padding: 32px;
          animation: fadeIn 0.5s ease-out;
        }

        .report-header {
          margin-bottom: 32px;
        }

        .report-title-section {
          margin-bottom: 24px;
        }

        .report-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
        }

        .report-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .report-stats {
          display: flex;
          gap: 20px;
        }

        .report-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 8px;
        }

        .report-filters {
          display: flex;
          gap: 12px;
        }

        .report-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
          color: #374151;
          background-color: white;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
        }

        .report-select:focus {
          border-color: #165C3C;
          box-shadow: 0 0 0 3px rgba(22, 92, 60, 0.1);
        }

        .report-select:hover {
          border-color: #9ca3af;
        }

        .stat-card {
          flex: 1;
          background: linear-gradient(135deg, #165C3C 0%, #1e7d52 100%);
          padding: 24px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .stat-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .chart-container {
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 32px;
          border: 1px solid #e5e7eb;
        }

        .calendar-layout {
          display: flex;
          gap: 24px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .calendar-main {
          flex: 1;
          padding: 28px;
        }

        .calendar-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .nav-button {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #6b7280;
        }

        .nav-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
          color: #374151;
        }

        .month-year {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .calendar-grid {
          width: 100%;
        }

        .calendar-header-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 2px;
          background-color: #f3f4f6;
          border-radius: 8px;
          overflow: hidden;
        }

        .day-header {
          padding: 16px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          color: #374151;
          background-color: #f9fafb;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          background-color: #f3f4f6;
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-day {
          min-height: 100px;
          padding: 12px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          border-radius: 4px;
        }

        .calendar-day:hover {
          background-color: #f9fafb;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .calendar-day.other-month {
          opacity: 0.3;
          background-color: #f8f9fa;
        }

        .calendar-day.today {
          background-color: #e6f7ff;
          border: 2px solid #165C3C;
        }

        .calendar-day.today .day-number {
          color: #165C3C;
          font-weight: 700;
        }

        .day-number {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #111827;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .day-event {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin: 2px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-block;
        }

        .day-event:hover {
          transform: scale(1.3);
        }

        .events-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          margin-top: 4px;
        }

        .events-sidebar {
          width: 380px;
          border-left: 1px solid #e5e7eb;
          padding: 28px;
          background-color: #f8f9fa;
          overflow-y: auto;
          max-height: 700px;
        }

        .sidebar-header {
          margin-bottom: 24px;
        }

        .sidebar-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 6px 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .events-count {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          font-weight: 500;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .no-events {
          text-align: center;
          color: #9ca3af;
          font-style: italic;
          padding: 60px 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .event-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
          cursor: pointer;
        }

        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .event-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .event-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          line-height: 1.4;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          flex: 1;
          margin-right: 12px;
        }

        .event-status {
          font-size: 11px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          white-space: nowrap;
        }

        .status-upcoming {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .status-finished {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .status-declined {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .event-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .event-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #6b7280;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
        }

        .event-detail svg {
          color: #9ca3af;
          flex-shrink: 0;
        }

        /* Modal Styles */
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
          border-radius: 16px;
          padding: 0;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 24px 0 24px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          line-height: 1.4;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          flex: 1;
          margin-right: 16px;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .modal-body {
          padding: 0 24px 24px 24px;
        }

        .modal-status {
          margin-bottom: 20px;
        }

        .modal-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-detail {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #374151;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
          padding: 12px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .modal-detail svg {
          color: #6b7280;
          flex-shrink: 0;
        }

        .cancel-reason-display {
          margin-top: 20px;
          padding: 16px;
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          border-radius: 8px;
        }

        .cancel-reason-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .cancel-reason-header strong {
          font-size: 14px;
          font-weight: 600;
          color: #991b1b;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .cancel-reason-text {
          font-size: 13px;
          color: #7f1d1d;
          margin: 0;
          line-height: 1.6;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1200px) {
          .calendar-layout {
            flex-direction: column;
          }

          .events-sidebar {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e5e7eb;
            max-height: 500px;
          }

          .search-input {
            width: 250px;
          }

          .report-stats {
            flex-wrap: wrap;
          }

          .stat-card {
            min-width: 200px;
          }
        }

        @media (max-width: 768px) {
          .calendar-org-content {
            padding: 16px;
          }

          .controls-bar {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            padding: 16px;
          }

          .left-controls, .right-controls {
            justify-content: center;
            width: 100%;
          }

          .search-input {
            width: 100%;
          }

          .calendar-main {
            padding: 20px;
          }

          .events-sidebar {
            padding: 20px;
          }

          .calendar-day {
            min-height: 90px;
            padding: 8px;
          }

          .day-header {
            padding: 12px 8px;
            font-size: 12px;
          }

          .calendar-title {
            font-size: 24px;
          }

          .month-year {
            font-size: 20px;
          }

          .monthly-report-container {
            padding: 20px;
          }

          .chart-container {
            padding: 16px;
          }

          .report-stats {
            flex-direction: column;
          }

          .stat-card {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
