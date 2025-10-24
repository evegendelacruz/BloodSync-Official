import React, { useState } from 'react';
import { Filter, Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Sample events data for donor appointments and blood donation schedule
  const events = [
    {
      id: 1,
      title: 'Blood Donation Appointment',
      date: '2025-09-22',
      time: '9:00 AM - 10:00 AM',
      location: 'Regional Blood Center, CDO',
      type: 'donation',
      participants: 1,
      status: 'confirmed'
    },
    {
      id: 2,
      title: 'Blood Drive - Xavier University',
      date: '2025-09-25',
      time: '2:00 PM - 3:00 PM',
      location: 'Xavier University, Corrales Ave, CDO',
      type: 'blood-drive',
      participants: 1,
      status: 'pending'
    },
    {
      id: 3,
      title: 'Follow-up Health Check',
      date: '2025-09-28',
      time: '10:00 AM - 11:00 AM',
      location: 'Regional Blood Center Clinic',
      type: 'checkup',
      participants: 1,
      status: 'confirmed'
    },
    {
      id: 4,
      title: 'Reminder: Next Eligible Donation Date',
      date: '2025-09-30',
      time: 'All Day',
      location: 'Any Authorized Blood Center',
      type: 'reminder',
      participants: 1,
      status: 'confirmed'
    }
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getMonthEvents = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
  };

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
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.date === dateStr);
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

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'donation': return { bg: '#e8f5e8', border: '#4caf50', text: '#2e7d32' };
      case 'blood-drive': return { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' };
      case 'checkup': return { bg: '#fff3e0', border: '#ff9800', text: '#e65100' };
      case 'reminder': return { bg: '#f3e8ff', border: '#9333ea', text: '#6b21a8' };
      default: return { bg: '#f5f5f5', border: '#9e9e9e', text: '#424242' };
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const monthEvents = getMonthEvents();

  return (
    <div className="calendar-content">
      {/* Header */}
      <div className="calendar-header">
        <h1 className="calendar-title">My Calendar</h1>
        <p className="calendar-subtitle">Appointments & Blood Donation Schedule</p>
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
            />
          </div>
        </div>

        <div className="right-controls">
          <button className="filter-button">
            <Filter size={16} />
            <span>Filter</span>
          </button>

          <button className="view-button">
            <CalendarIcon size={16} />
            <span>Month View</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Layout */}
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
                        const colors = getEventTypeColor(event.type);
                        return (
                          <div
                            key={event.id}
                            className="day-event"
                            style={{
                              backgroundColor: colors.border
                            }}
                            title={`${event.title} - ${event.time}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
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
            {monthEvents.length === 0 ? (
              <div className="no-events">No events scheduled for this month</div>
            ) : (
              monthEvents.map(event => {
                const colors = getEventTypeColor(event.type);
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
                        <CalendarIcon size={14} />
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
                      {event.type !== 'reminder' && (
                        <div className="event-detail">
                          <Users size={14} />
                          <span>Personal Appointment</span>
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
                  <CalendarIcon size={16} />
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
                {selectedEvent.type !== 'reminder' && (
                  <div className="modal-detail">
                    <Users size={16} />
                    <span>Personal Appointment</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-content {
          padding: 24px;
          background-color: #f9fafb;
          min-height: auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .calendar-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
          font-weight: 400;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          padding-right: 16px;
          padding-top: 10px;
          padding-bottom: 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          width: 320px;
          font-size: 14px;
          outline: none;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

        .right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: all 0.2s;
        }

        .filter-button:hover, .view-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
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

        .status-confirmed {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-urgent {
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
        }

        @media (max-width: 768px) {
          .calendar-content {
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

          .day-event {
            font-size: 9px;
            padding: 3px 4px;
          }

          .calendar-title {
            font-size: 24px;
          }

          .month-year {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;