import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, ArrowRight, ArrowLeft, Calendar } from 'lucide-react';

// New Appointment Form Component
const NewAppointmentForm = ({ isOpen, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [dateTimeModalDate, setDateTimeModalDate] = useState(new Date());
  const [contactInfo, setContactInfo] = useState({
    lastName: '',
    email: '',
    phone: '',
    address: '',
    message: ''
  });
  const [showThankYou, setShowThankYou] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const timeSlots = [
    { time: '8:00', display: '8:00 AM' },
    { time: '9:00', display: '9:00 AM' },
    { time: '10:00', display: '10:00 AM' },
    { time: '11:00', display: '11:00 AM' },
  ];

  const getDateTimeCalendarDays = () => {
    const year = dateTimeModalDate.getFullYear();
    const month = dateTimeModalDate.getMonth();
    const firstDay = new Date(year, month, 1);

    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    startDate.setDate(startDate.getDate() + mondayOffset);

    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push({
        day: currentDate.getDate(),
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: isToday(currentDate)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedType(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setContactInfo({
      lastName: '',
      email: '',
      phone: '',
      address: '',
      message: ''
    });
    setShowThankYou(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const proceedToStep2 = () => {
    if (!selectedType) {
      alert('Please select either Barangay or Organization');
      return;
    }
    setCurrentStep(2);
  };

  const proceedToStep3 = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }
    setCurrentStep(3);
  };

  const handleContactSubmit = async () => {
    const { lastName, email, phone, address } = contactInfo;

    if (!lastName || !email || !phone || !address) {
      alert('Please fill in all fields');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      title: `${selectedType === 'barangay' ? 'Blood Drive Partnership' : 'Sync Request'} - ${lastName}`,
      date: formatDate(selectedDate),
      time: selectedTime,
      type: selectedType === 'barangay' ? 'blood-donation' : 'sync-request',
      notes: `Contact: ${email}, ${phone}`,
      contactInfo: {
        ...contactInfo,
        type: selectedType
      }
    };

    // Save to database with activity logging
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const currentUser = 'Alaiza Rose Olores'; // Get this from your user context/state
        await window.electronAPI.addAppointment(newAppointment, currentUser);
      } catch (error) {
        console.error('Error saving appointment:', error);
      }
    }

    if (onSubmit) {
      onSubmit(newAppointment);
    }

    setShowThankYou(true);
  };

  const selectDate = (date) => {
    setSelectedDate(date);
  };

  const selectTimeSlot = (time) => {
    setSelectedTime(time);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          @font-face {
            font-family: 'Barlow';
            src: url('./src/assets/fonts/barlow-regular.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
          }
          
          @font-face {
            font-family: 'Barlow';
            src: url('./src/assets/fonts/barlow-bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
          }
          
          .new-appointment-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 1;
            visibility: visible;
            transition: all 0.3s ease;
          }
          
          .new-appointment-modal {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            max-width: 1000px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(1);
            transition: transform 0.3s ease;
            font-family: 'Barlow';
          }
          
          .new-appointment-modal.thank-you-modal {
            max-width: 400px;
            width: 90%;
          }
          
          .new-appointment-modal-header {
            padding: 20px 25px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .new-appointment-modal-header h3 {
            margin: 0;
            color: #2e7d32;
            font-size: 18px;
            font-weight: 700;
            font-family: 'Barlow';
            flex: 1;
            text-align: center;
          }
          
          .new-appointment-modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
          }
          
          .new-appointment-modal-close:hover {
            background: #f5f5f5;
          }
          
          .new-appointment-modal-body {
            padding: 25px;
          }
          
          .new-step-indicators {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-bottom: 20px;
          }
          
          .new-step-number {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #e0e0e0;
            color: #999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            font-family: 'Barlow';
            transition: all 0.3s ease;
          }
          
          .new-step-number.active {
            background: #2e7d32;
            color: white;
          }
          
          .new-selection-container {
            display: flex;
            gap: 40px;
          }
          
          .new-selection-left {
            flex: 1;
          }
          
          .new-selection-right {
            flex: 1;
          }
          
          .new-selection-left h4 {
            font-size: 24px;
            color: #2e7d32;
            margin-bottom: 30px;
            font-weight: 700;
            font-family: 'Barlow';
          }
          
          .new-selection-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 40px;
          }
          
          .new-selection-btn {
            padding: 15px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            background: white;
            color: #333;
            font-size: 16px;
            font-weight: 400;
            font-family: 'Barlow';
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
          }
          
          .new-selection-btn:hover {
            border-color: #ffeb3b;
            background: #ffeb3b;
            color: #2e7d32;
            font-weight: 700;
          }
          
          .new-selection-btn.active {
            border-color: #2e7d32;
            background: white;
            color: #2e7d32;
            font-weight: 700;
          }
          
          .new-selection-divider {
            text-align: center;
            color: #999;
            font-size: 12px;
            font-weight: 400;
            font-family: 'Barlow';
            position: relative;
            margin: 15px 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .new-selection-divider::before,
          .new-selection-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e0e0e0;
          }
          
          .new-selection-divider::before {
            margin-right: 15px;
          }
          
          .new-selection-divider::after {
            margin-left: 15px;
          }
          
          .new-partnership-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 50px;
            text-align: center;
            border: 1px solid #e0e0e0;
          }
          
          .new-partnership-icon {
            width: 60px;
            height: 60px;
            background: #2e7d32;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
          }
          
          .new-partnership-card h5 {
            font-size: 18px;
            color: #2e7d32;
            margin-bottom: 15px;
            font-weight: 700;
            font-family: 'Barlow';
          }
          
          .new-partnership-card p {
            color: #666;
            line-height: 1.6;
            font-size: 14px;
            font-family: 'Barlow';
            margin: 0;
          }
          
          .new-next-btn-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 40px;
          }
          
          .new-next-btn {
            background: #2e7d32;
            color: white;
            border: 1px solid #2e7d32;
            padding: 12px 25px;
            font-size: 16px;
            font-weight: 700;
            font-family: 'Barlow';
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .new-next-btn:hover {
            background: #1b5e20;
            border-color: #1b5e20;
          }
          
          .new-next-btn:disabled {
            background: #e0e0e0;
            color: #999;
            border-color: #e0e0e0;
            cursor: not-allowed;
          }
          
          .new-datetime-content {
            display: flex;
            gap: 40px;
            padding: 0;
          }
          
          .new-datetime-left {
            flex: 1;
          }
          
          .new-datetime-right {
            flex: 1;
          }
          
          .new-calendar-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .new-calendar-nav-btn {
            background: none;
            border: none;
            color: #2e7d32;
            font-size: 16px;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: background-color 0.2s;
          }
          
          .new-calendar-nav-btn:hover {
            background: #f0f0f0;
          }
          
          .new-calendar-title {
            font-size: 18px;
            font-weight: 700;
            font-family: 'Barlow';
            color: #2e7d32;
            margin: 0;
          }
          
          .new-mini-calendar {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            background: white;
          }
          
          .new-calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            background: #f8f9fa;
          }
          
          .new-weekday {
            padding: 10px 8px;
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            font-family: 'Barlow';
            color: #666;
            border-right: 1px solid #e0e0e0;
          }
          
          .new-weekday:last-child {
            border-right: none;
          }
          
          .new-calendar-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
          }
          
          .new-mini-day {
            padding: 12px 8px;
            text-align: center;
            font-size: 14px;
            font-family: 'Barlow';
            border-right: 1px solid #f0f0f0;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: all 0.2s;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .new-mini-day:hover {
            background: #f0f0f0;
          }
          
          .new-mini-day.selected {
            background: #2e7d32;
            color: white;
            font-weight: 700;
          }
          
          .new-mini-day.today {
            background: #e8f5e8;
            font-weight: 700;
            color: #2e7d32;
          }
          
          .new-mini-day.prev-month,
          .new-mini-day.next-month {
            color: #ccc;
          }
          
          .new-availability-section h5 {
            font-size: 14px;
            font-weight: 400;
            font-family: 'Barlow';
            color: #666;
            margin-bottom: 15px;
            letter-spacing: 4px;
            font-weight: 700;
          }
          
          .new-time-slots {
            display: flex;
            flex-direction: column;
            gap: 30px;
            margin-bottom: 30px;
            align-items: flex-start;
          }
          
          .new-time-slot {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 12px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
            font-size: 14px;
            font-family: 'Barlow';
            width: 120px;
            min-width: 120px;
          }
          
          .new-time-slot:hover {
            border-color: #2e7d32;
            background: #f8f9fa;
          }
          
          .new-time-slot.selected {
            border-color: #2e7d32;
            background: #2e7d32;
            color: white;
          }
          
          .new-contact-form {
            width: 100%;
          }
          
          .new-contact-form input,
          .new-contact-form textarea {
            width: 100%;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            font-family: 'Barlow';
            box-sizing: border-box;
            outline: none;
            min-height: 48px;
          }

          .new-contact-form input[placeholder*="Message"] {
            min-height: 80px;
            height: 80px;
          }
          
          .new-contact-form input:focus,
          .new-contact-form textarea:focus {
            outline: none;
            border-color: #2e7d32;
            box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.1);
          }
          
          .new-contact-form textarea {
            resize: vertical;
            min-height: 80px;
            height: 80px;
          }
          
          .new-form-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
          }
          
          .new-btn-back {
            background: white;
            color: #666;
            border: 1px solid #ddd;
            padding: 12px 25px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 700;
            font-family: 'Barlow';
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .new-btn-back:hover {
            background: #f5f5f5;
            border-color: #ccc;
          }
          
          .new-btn-finish {
            background: #2e7d32;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 700;
            font-family: 'Barlow';
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .new-btn-finish:hover {
            background: #1b5e20;
          }
          
          .new-thank-you-content {
            text-align: center;
            padding: 20px 15px;
          }
          
          .new-thank-you-content h3 {
            color: #2e7d32;
            font-size: 18px;
            font-weight: 700;
            font-family: 'Barlow';
            margin-bottom: 10px;
          }
          
          .new-thank-you-content p {
            color: #666;
            font-size: 13px;
            font-family: 'Barlow';
            line-height: 1.4;
            margin-bottom: 15px;
            max-width: 350px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .new-btn-close {
            background: #2e7d32;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 700;
            font-family: 'Barlow';
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0 auto;
          }
          
          .new-btn-close:hover {
            background: #1b5e20;
          }
          
          @media (max-width: 1024px) {
            .new-selection-container {
              flex-direction: column;
              gap: 30px;
            }
            
            .new-datetime-content {
              flex-direction: column;
              gap: 30px;
            }
          }
          
          @media (max-width: 768px) {
            .new-appointment-modal {
              width: 95%;
              margin: 10px;
            }
            
            .new-appointment-modal-body {
              padding: 15px;
            }
            
            .new-partnership-card {
              padding: 30px;
            }
          }
        `}
      </style>

      <div className="new-appointment-modal-overlay">
        <div className={`new-appointment-modal ${showThankYou ? 'thank-you-modal' : ''}`}>
          {!showThankYou && (
            <>
              <div className="new-appointment-modal-header">
                <h3>
                  {currentStep === 1 && "Schedule Your Blood Donation Drive"}
                  {currentStep === 2 && "Choose date & Time"}
                  {currentStep === 3 && "Contact Information"}
                </h3>
                <div className="new-step-indicators">
                  <span className={`new-step-number ${currentStep >= 1 ? 'active' : ''}`}>1</span>
                  <span className={`new-step-number ${currentStep >= 2 ? 'active' : ''}`}>2</span>
                  <span className={`new-step-number ${currentStep >= 3 ? 'active' : ''}`}>3</span>
                </div>
                <button className="new-appointment-modal-close" onClick={handleClose}>
                  <X size={18} />
                </button>
              </div>

              <div className="new-appointment-modal-body">
                {currentStep === 1 && (
                  <div className="new-selection-container">
                    <div className="new-selection-left">
                      <h4>Which one are you?</h4>
                      <div className="new-selection-options">
                        <button
                          className={`new-selection-btn ${selectedType === 'barangay' ? 'active' : ''}`}
                          onClick={() => setSelectedType('barangay')}
                        >
                          Barangay
                        </button>
                        <div className="new-selection-divider">OR</div>
                        <button
                          className={`new-selection-btn ${selectedType === 'organization' ? 'active' : ''}`}
                          onClick={() => setSelectedType('organization')}
                        >
                          Organization
                        </button>
                      </div>
                      <div className="new-next-btn-container">
                        <button
                          className="new-next-btn"
                          disabled={!selectedType}
                          onClick={proceedToStep2}
                        >
                          Next <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="new-selection-right">
                      <div className="new-partnership-card">
                        <div className="new-partnership-icon">
                          <Calendar size={32} color="white" />
                        </div>
                        <h5>Book a Partnership Appointment</h5>
                        <p>Partner with us to make a difference! Schedule an appointment to collaborate with DOH and support our mission. Pick a date and time that works for your organization and help improve healthcare together!</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="new-datetime-content">
                    <div className="new-datetime-left">
                      <div className="calendar-section">
                        <div className="new-calendar-nav">
                          <button 
                            className="new-calendar-nav-btn"
                            onClick={() => {
                              setDateTimeModalDate(new Date(dateTimeModalDate.getFullYear(), dateTimeModalDate.getMonth() - 1, 1));
                            }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <h4 className="new-calendar-title">
                            {monthNames[dateTimeModalDate.getMonth()]} {dateTimeModalDate.getFullYear()}
                          </h4>
                          <button 
                            className="new-calendar-nav-btn"
                            onClick={() => {
                              setDateTimeModalDate(new Date(dateTimeModalDate.getFullYear(), dateTimeModalDate.getMonth() + 1, 1));
                            }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        <div className="new-mini-calendar">
                          <div className="new-calendar-weekdays">
                            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                              <div key={day} className="new-weekday">{day}</div>
                            ))}
                          </div>
                          <div className="new-calendar-days">
                            {getDateTimeCalendarDays().map((dayObj, index) => {
                              const isSelected = selectedDate && dayObj.date.toDateString() === selectedDate.toDateString();
                              
                              let dayClasses = ['new-mini-day'];
                              
                              if (!dayObj.isCurrentMonth) {
                                dayClasses.push(dayObj.date < dateTimeModalDate ? 'prev-month' : 'next-month');
                              }
                              
                              if (dayObj.isToday) {
                                dayClasses.push('today');
                              }
                              
                              if (isSelected) {
                                dayClasses.push('selected');
                              }
                              
                              return (
                                <div
                                  key={index}
                                  className={dayClasses.join(' ')}
                                  onClick={() => selectDate(dayObj.date)}
                                >
                                  {dayObj.day}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="new-datetime-right">
                      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                        <div className="new-availability-section" style={{ flex: '0 0 auto' }}>
                          <h5>AVAILABILITY</h5>
                          <div className="new-time-slots">
                            {timeSlots.map((slot) => (
                              <div
                                key={slot.time}
                                className={`new-time-slot ${selectedTime === slot.time ? 'selected' : ''}`}
                                onClick={() => selectTimeSlot(slot.time)}
                              >
                                <span>{slot.display}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ flex: '1', minWidth: '250px' }}>
                          <div className="new-partnership-card">
                            <div className="new-partnership-icon">
                              <Calendar size={32} color="white" />
                            </div>
                            <h5>Book a Partnership Appointment</h5>
                            <p>Partner with us to make a difference! Schedule an appointment to collaborate with DOH and support our mission. Pick a date and time that works for your organization and help improve healthcare together!</p>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                            <button
                              type="button"
                              className="new-btn-back"
                              onClick={() => setCurrentStep(1)}
                            >
                              <ArrowLeft size={16} /> Previous
                            </button>
                            <button
                              className="new-next-btn"
                              disabled={!selectedDate || !selectedTime}
                              onClick={proceedToStep3}
                            >
                              Next <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="new-selection-container">
                    <div className="new-selection-left">
                      <div className="new-contact-form">
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={contactInfo.lastName}
                          onChange={(e) => setContactInfo({...contactInfo, lastName: e.target.value})}
                          required
                        />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={contactInfo.email}
                          onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={contactInfo.phone}
                          onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Address"
                          value={contactInfo.address}
                          onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Message (Optional)"
                          value={contactInfo.message}
                          onChange={(e) => setContactInfo({...contactInfo, message: e.target.value})}
                        />
                        <div className="new-form-actions">
                          <button
                            type="button"
                            className="new-btn-back"
                            onClick={() => setCurrentStep(2)}
                          >
                            <ArrowLeft size={16} /> Previous
                          </button>
                          <button
                            type="button"
                            className="new-btn-finish"
                            onClick={handleContactSubmit}
                          >
                            Finish <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="new-selection-right">
                      <div className="new-partnership-card">
                        <div className="new-partnership-icon">
                          <Calendar size={32} color="white" />
                        </div>
                        <h5>Book a Partnership Appointment</h5>
                        <p>Partner with us to make a difference! Schedule an appointment to collaborate with DOH and support our mission. Pick a date and time that works for your organization and help improve healthcare together!</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {showThankYou && (
            <div className="new-thank-you-content">
              <div className="new-partnership-icon" style={{ margin: '0 auto 15px' }}>
                <Calendar size={24} color="white" />
              </div>
              <h3>Thank You!</h3>
              <p>
                Your appointment has been successfully scheduled. We look forward to assisting you.
              </p>
              <button
                className="new-btn-close"
                onClick={handleClose}
              >
                <X size={16} /> Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Main AppointmentOrg Component
const AppointmentOrg = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('Month');
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Load appointments from database on component mount
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const appointmentsData = await window.electronAPI.getAllAppointments();
        setAppointments(appointmentsData);
      } else {
        console.warn('ElectronAPI not available - running in browser mode');
        // Keep sample data for demo purposes
        setAppointments([
          {
            id: 1,
            title: 'Blood Drive Partnership - Barangay San Roque',
            date: '2024-09-25',
            time: '9:00',
            type: 'blood-donation',
            notes: 'Partnership meeting for community blood drive organization',
            contactInfo: {
              lastName: 'Santos',
              email: 'santos@sanroque.gov.ph',
              phone: '+63 912 345 6789',
              address: 'Barangay San Roque, Cagayan de Oro',
              message: 'Looking forward to partnering with your organization for community health.',
              type: 'barangay'
            }
          },
          {
            id: 2,
            title: 'Sync Request - Red Cross CDO',
            date: '2024-09-28',
            time: '14:00',
            type: 'sync-request',
            notes: 'Coordination meeting for blood inventory synchronization',
            contactInfo: {
              lastName: 'Cruz',
              email: 'cruz@redcross.org.ph',
              phone: '+63 918 765 4321',
              address: 'Red Cross Office, Cagayan de Oro',
              message: 'Need to discuss blood inventory management and data synchronization.',
              type: 'organization'
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Calculate starting day (Monday = 0)
    const startingDay = (firstDay.getDay() + 6) % 7;
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getAppointmentsForDate = (date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return appointments.filter(apt => apt.date === dateString);
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleAddAppointment = (newAppointment) => {
    setAppointments(prev => [...prev, newAppointment]);
  };

  const handleAppointmentClick = (appointment) => {
    setCurrentAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleDeleteAppointment = async (appointment) => {
  if (!confirm('Are you sure you want to cancel this appointment?')) {
    return;
  }
  
  try {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const currentUser = 'Alaiza Rose Olores'; // Get this from your user context/state
      
      // Use the correct ID field - check if it's appointment_id or id
      const appointmentId = appointment.appointment_id || appointment.id;
      console.log('Deleting appointment with ID:', appointmentId);
      
      await window.electronAPI.deleteAppointment(appointmentId, currentUser);
      
      // Remove appointment from local state using the same ID field
      setAppointments(prev => prev.filter(apt => 
        (apt.appointment_id || apt.id) !== appointmentId
      ));
      setShowDetailsModal(false);
    }
  } catch (error) {
    console.error('Error deleting appointment:', error);
    setError('Failed to cancel appointment. Please try again.');
  }
};

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getDayAppointments = (day) => {
    if (!day) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return getAppointmentsForDate(date);
  };

  return (
    <>
      <style>
        {`
          @font-face {
            font-family: 'Barlow';
            src: url('./src/assets/fonts/barlow-regular.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
          }
          
          @font-face {
            font-family: 'Barlow';
            src: url('./src/assets/fonts/barlow-bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
          }
        `}
      </style>
      <div style={{ 
        fontFamily: 'Barlow',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '0 10px'
        }}>
          <h1 style={{
            color: '#165C3C',
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: 'Barlow',
            margin: '0'
          }}>
            Appointment Calendar
          </h1>
          
          <button
            onClick={() => setShowNewAppointmentForm(true)}
            style={{
              background: '#ffcf35',
              color: '#165c3c',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              fontFamily: 'Barlow',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#ffeb3b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ffcf35'}
          >
            <Plus size={18} />
            New Appointment
          </button>
        </div>

        {/* Error Message */}
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
            alignItems: 'center',
            fontFamily: 'Barlow'
          }}>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '18px',
                cursor: 'pointer',
                padding: 0,
                marginLeft: '8px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Separator Line */}
        <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#e0e0e0',
          marginBottom: '30px'
        }} />

        {/* Calendar Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '0 10px'
        }}>
          <button
            onClick={() => navigateMonth(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2e7d32',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <ChevronLeft size={20} />
          </button>

          <h2 style={{
            color: '#165C3C',
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: 'Barlow',
            margin: '0'
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button
            onClick={() => navigateMonth(1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2e7d32',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            fontFamily: 'Barlow'
          }}>
            <p>Loading appointments...</p>
          </div>
        ) : (
          <>
            {/* Calendar Grid */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              {/* Week Days Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0'
              }}>
                {weekDays.map(day => (
                  <div
                    key={day}
                    style={{
                      padding: '15px 10px',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontFamily: 'Barlow',
                      color: '#666',
                      fontSize: '14px',
                      borderRight: '1px solid #e0e0e0'
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                minHeight: '600px'
              }}>
                {getDaysInMonth(currentDate).map((day, index) => {
                  const dayAppointments = getDayAppointments(day);
                  const hasAppointments = dayAppointments.length > 0;
                  const todayClass = day && isToday(day);

                  return (
                    <div
                      key={index}
                      style={{
                        minHeight: '100px',
                        padding: '8px',
                        borderRight: index % 7 !== 6 ? '1px solid #f0f0f0' : 'none',
                        borderBottom: index < 35 ? '1px solid #f0f0f0' : 'none',
                        backgroundColor: day ? 'white' : '#fafafa',
                        position: 'relative',
                        cursor: day ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (day) {
                          setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                        }
                      }}
                    >
                      {day && (
                        <>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '5px'
                          }}>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: todayClass ? '700' : '400',
                              fontFamily: 'Barlow',
                              color: todayClass ? '#2e7d32' : '#333',
                              backgroundColor: todayClass ? '#e8f5e8' : 'transparent',
                              padding: todayClass ? '4px 8px' : '0',
                              borderRadius: todayClass ? '12px' : '0'
                            }}>
                              {day}
                            </span>
                            {hasAppointments && (
                              <div style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#2e7d32',
                                borderRadius: '50%'
                              }} />
                            )}
                          </div>

                          {/* Appointments for this day */}
                          <div style={{ fontSize: '12px' }}>
                            {dayAppointments.slice(0, 2).map(apt => (
                              <div
                                key={apt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAppointmentClick(apt);
                                }}
                                style={{
                                  backgroundColor: apt.type === 'blood-donation' ? '#ffebee' : '#e8f5e8',
                                  color: apt.type === 'blood-donation' ? '#c62828' : '#2e7d32',
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  marginBottom: '2px',
                                  fontSize: '11px',
                                  fontWeight: '400',
                                  fontFamily: 'Barlow',
                                  cursor: 'pointer',
                                  border: `1px solid ${apt.type === 'blood-donation' ? '#ffcdd2' : '#c8e6c9'}`,
                                  transition: 'all 0.2s',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.02)';
                                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.boxShadow = 'none';
                                }}
                              >
                                {formatTime(apt.time)} - {apt.title.split(' - ')[0]}
                              </div>
                            ))}
                            {dayAppointments.length > 2 && (
                              <div style={{
                                color: '#666',
                                fontSize: '10px',
                                fontWeight: '400',
                                fontFamily: 'Barlow',
                                textAlign: 'center',
                                marginTop: '2px'
                              }}>
                                +{dayAppointments.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* New Appointment Form */}
        <NewAppointmentForm
          isOpen={showNewAppointmentForm}
          onClose={() => setShowNewAppointmentForm(false)}
          onSubmit={handleAddAppointment}
        />

        {/* Appointment Details Modal */}
        {showDetailsModal && currentAppointment && (
          <div style={{
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
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              fontFamily: 'Barlow'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  color: '#2e7d32',
                  fontSize: '20px',
                  fontWeight: '700',
                  fontFamily: 'Barlow',
                  margin: '0'
                }}>
                  Appointment Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ lineHeight: '1.6', fontFamily: 'Barlow' }}>
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32', fontFamily: 'Barlow' }}>Title:</strong>
                  <div style={{ marginTop: '5px', fontFamily: 'Barlow' }}>{currentAppointment.title}</div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32', fontFamily: 'Barlow' }}>Date & Time:</strong>
                  <div style={{ marginTop: '5px', fontFamily: 'Barlow' }}>
                    {formatDisplayDate(currentAppointment.date)} at {formatTime(currentAppointment.time)}
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32', fontFamily: 'Barlow' }}>Type:</strong>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{
                      backgroundColor: currentAppointment.type === 'blood-donation' ? '#ffebee' : '#e8f5e8',
                      color: currentAppointment.type === 'blood-donation' ? '#c62828' : '#2e7d32',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '400',
                      fontFamily: 'Barlow',
                      border: `1px solid ${currentAppointment.type === 'blood-donation' ? '#ffcdd2' : '#c8e6c9'}`
                    }}>
                      {currentAppointment.type === 'blood-donation' ? 'Blood Drive Partnership' : 'Sync Request'}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32', fontFamily: 'Barlow' }}>Contact Information:</strong>
                  <div style={{ marginTop: '5px', paddingLeft: '10px', fontFamily: 'Barlow' }}>
                    <div><strong>Name:</strong> {currentAppointment.contactInfo.lastName}</div>
                    <div><strong>Email:</strong> {currentAppointment.contactInfo.email}</div>
                    <div><strong>Phone:</strong> {currentAppointment.contactInfo.phone}</div>
                    <div><strong>Address:</strong> {currentAppointment.contactInfo.address}</div>
                    {currentAppointment.contactInfo.type && (
                      <div><strong>Type:</strong> {currentAppointment.contactInfo.type === 'barangay' ? 'Barangay' : 'Organization'}</div>
                    )}
                  </div>
                </div>

                {currentAppointment.contactInfo.message && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#2e7d32', fontFamily: 'Barlow' }}>Message:</strong>
                    <div style={{ marginTop: '5px', fontFamily: 'Barlow', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                      {currentAppointment.contactInfo.message}
                    </div>
                  </div>
                )}

                {currentAppointment.notes && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#2e7d32', fontFamily: 'Barlow' }}>Notes:</strong>
                    <div style={{ marginTop: '5px', fontFamily: 'Barlow' }}>{currentAppointment.notes}</div>
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '20px',
                gap: '10px'
              }}>
                <button
                  onClick={() => handleDeleteAppointment(currentAppointment)}
                    style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '700',
                    fontFamily: 'Barlow',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                >
                  Cancel Appointment
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{
                    background: '#2e7d32',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '700',
                    fontFamily: 'Barlow',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                   onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                   onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                  >
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AppointmentOrg;