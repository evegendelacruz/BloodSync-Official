import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CalendarCheck,
} from "lucide-react";
import Loader from "../../../components/Loader";

const NewAppointmentForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingAppointment = null,
  appointments = [],
  currentUser = null,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [dateTimeModalDate, setDateTimeModalDate] = useState(new Date());

   const [contactInfo, setContactInfo] = useState({
    lastName: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });
  const [showThankYou, setShowThankYou] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(editingAppointment);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !editingAppointment) {
      const getUserData = () => {
        try {
          const possibleKeys = ['currentOrgUser', 'currentUser', 'user', 'orgUser'];
          
          for (const key of possibleKeys) {
            const userData = localStorage.getItem(key);
            if (userData) {
              try {
                const parsed = JSON.parse(userData);
                const fullName = parsed.u_full_name || parsed.fullName || parsed.name || "";
                const email = parsed.u_email || parsed.email || "";
                const phone = parsed.u_contact_number || parsed.contactNumber || parsed.phone || "";
                const address = parsed.u_address || parsed.address || "";
                
                if (fullName) {
                  setContactInfo({
                    lastName: fullName,
                    email: email,
                    phone: phone,
                    address: address,
                    message: "",
                  });
                  console.log('✅ Auto-populated user data:', { fullName, email, phone, address });
                  return;
                }
              } catch (parseError) {
                console.warn(`Failed to parse ${key}:`, parseError);
                continue;
              }
            }
          }
          
          console.warn('No user data found in localStorage for auto-population');
        } catch (error) {
          console.error('Error getting user data:', error);
        }
      };
      
      getUserData();
    }
  }, [isOpen, editingAppointment]);

  // Compute occupiedDates from appointments prop
  const occupiedDates = React.useMemo(
    () => new Set(appointments.map((apt) => apt.date)),
    [appointments]
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const timeSlots = [
    { time: "8:00", display: "8:00 AM" },
    { time: "9:00", display: "9:00 AM" },
    { time: "10:00", display: "10:00 AM" },
    { time: "11:00", display: "11:00 AM" },
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
    const dayDateStr = formatDate(currentDate);
    days.push({
      day: currentDate.getDate(),
      date: new Date(currentDate),
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: isToday(currentDate),
      isOccupied: occupiedDates.has(dayDateStr),
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes || "00"} ${ampm}`;
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedType(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setContactInfo({
      lastName: "",
      email: "",
      phone: "",
      address: "",
      message: "",
    });
    setShowThankYou(false);
    setCurrentAppointment(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const proceedToStep2 = () => {
    if (!selectedType) {
      alert("Please select either Barangay or Organization");
      return;
    }
    setCurrentStep(2);
  };

  const proceedToStep3 = () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time");
      return;
    }
    // --- ADD THIS CHECK ---
    if (occupiedDates.has(formatDate(selectedDate))) {
      alert(
        "This date is already scheduled for an event. Please choose another date."
      );
      return;
    }
    // --- END ---
    setCurrentStep(3);
  };

  console.log("=== DEBUG LOCALSTORAGE ===");
  console.log("All localStorage keys:", Object.keys(localStorage));
  console.log("currentOrgUser:", localStorage.getItem("currentOrgUser"));
  console.log("=== END DEBUG ===");

  const handleContactSubmit = async () => {
  const { lastName, email, phone, address } = contactInfo;

  if (!lastName || !email || !phone || !address) {
    alert("Please fill in all required fields");
    return;
  }

  setIsLoading(true);

  try {
    // ✅ FIXED: Get organization info FIRST and use it consistently
    const getOrgInfo = () => {
      try {
        const userData =
          localStorage.getItem("currentOrgUser") ||
          localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          console.log("User data for partnership request:", parsed);

          // Determine the correct organization/barangay name
          let displayName;
          let barangayName = null;
          let organizationName = null;
          
          if (parsed.u_category === "Barangay" || parsed.category === "Barangay") {
            // For Barangay users: use barangay name
            displayName = parsed.u_barangay || parsed.barangay || parsed.u_full_name || parsed.fullName;
            barangayName = parsed.u_barangay || parsed.barangay;
          } else {
            // For Organization users: use organization name
            displayName = parsed.u_organization_name || parsed.organizationName || parsed.u_full_name || parsed.fullName;
            organizationName = parsed.u_organization_name || parsed.organizationName;
          }

          const orgPhoto =
            parsed.u_profile_image ||
            parsed.profileImage ||
            parsed.profile_photo ||
            parsed.u_profile_photo ||
            null;

          console.log("✅ Extracted org info:", {
            displayName: displayName,
            category: parsed.u_category || parsed.category,
            barangay: barangayName,
            organizationName: organizationName,
            photo: orgPhoto
          });

          return { 
            name: displayName,
            category: parsed.u_category || parsed.category,
            barangay: barangayName,
            organizationName: organizationName,
            photo: orgPhoto 
          };
        }
      } catch (error) {
        console.error("Error getting organization info:", error);
      }
      return { 
        name: "Unknown Organization", 
        category: null,
        barangay: null,
        organizationName: null,
        photo: null 
      };
    };

    // Get organization info
    const orgInfo = getOrgInfo();
    console.log("Organization info retrieved:", orgInfo);

    // Get user ID
    const getUserId = () => {
      try {
        const possibleKeys = [
          "currentOrgUser",
          "currentUser",
          "user",
          "orgUser",
        ];

        for (const key of possibleKeys) {
          const userData = localStorage.getItem(key);
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              const userId =
                parsed.id || parsed.u_id || parsed.userId || parsed.user_id;

              if (userId && typeof userId === "number") {
                console.log(`Found valid user ID in ${key}:`, userId);
                return userId;
              }
            } catch (parseError) {
              console.warn(`Failed to parse ${key}:`, parseError);
              continue;
            }
          }
        }

        console.warn("No valid user found in localStorage");
        return null;
      } catch (error) {
        console.error("Error getting user ID:", error);
        return null;
      }
    };

    const userId = getUserId();
    console.log("Using user ID for appointment:", userId);

    // ✅ CRITICAL FIX: Use orgInfo.name for the title and organizationName field
    const appointmentData = {
      id: currentAppointment
        ? currentAppointment.appointment_id || currentAppointment.id
        : Date.now(),
      title: `Blood Drive Partnership - ${orgInfo.name}`, // ✅ Use orgInfo.name, not contactInfo.lastName
      date: formatDate(selectedDate),
      time: selectedTime,
      type: "blood-donation",
      notes: "Schedule pending approval. Please await confirmation.",
      status: "pending",
      contactInfo: {
        ...contactInfo,
        type: selectedType,
        organizationName: orgInfo.name, // ✅ Store the actual organization/barangay name
        category: orgInfo.category,
      },
    };

    const isEditing = !!currentAppointment;

    if (typeof window !== "undefined" && window.electronAPI) {
      if (isEditing) {
        // Editing logic here...
        setIsLoading(false);
      } else {
        // Create appointment
        const localAppointment = await window.electronAPI.addAppointment(
          appointmentData,
          userId
        );
        console.log("✅ Local appointment added successfully", localAppointment);

        // ✅ CRITICAL FIX: Use orgInfo values for partnership request
        const requestData = {
          appointmentId: localAppointment.id,
          organizationName: orgInfo.name, // ✅ Use orgInfo.name (organization or barangay name)
          organizationBarangay: orgInfo.category === 'Barangay' ? orgInfo.barangay : null,
          contactName: contactInfo.lastName, // This is the contact person's name, NOT organization name
          contactEmail: contactInfo.email || "",
          contactPhone: contactInfo.phone || "",
          eventDate: appointmentData.date,
          eventTime: appointmentData.time,
          eventAddress: contactInfo.address || "",
          profilePhoto: orgInfo.photo || null,
        };

        console.log('📤 Sending partnership request with correct data:', requestData);

        const serverResult = await window.electronAPI.createPartnershipRequest(requestData);

        if (!serverResult || !serverResult.id) {
          throw new Error(
            "Failed to submit partnership request to main server."
          );
        }
        console.log(
          "✅ Partnership request submitted successfully:",
          serverResult
        );

        // Update parent component's appointments list
        if (onSubmit) {
          onSubmit({
            id: appointmentData.id,
            appointment_id: appointmentData.id,
            title: appointmentData.title,
            date: appointmentData.date,
            time: appointmentData.time,
            type: appointmentData.type,
            notes: appointmentData.notes,
            status: appointmentData.status,
            contactInfo: appointmentData.contactInfo,
          });
        }

        setIsLoading(false);
        
        setTimeout(() => {
          setShowThankYou(true);
        }, 300);
      }
    } else {
      console.warn("ElectronAPI not available. Simulating success.");
      
      if (onSubmit) {
        onSubmit({
          id: appointmentData.id,
          appointment_id: appointmentData.id,
          title: appointmentData.title,
          date: appointmentData.date,
          time: appointmentData.time,
          type: appointmentData.type,
          notes: appointmentData.notes,
          status: appointmentData.status,
          contactInfo: appointmentData.contactInfo,
        });
      }

      setIsLoading(false);
      
      setTimeout(() => {
        setShowThankYou(true);
      }, 300);
    }
  } catch (error) {
    console.error("Error saving appointment:", error);
    setIsLoading(false);
    alert(
      `Failed to save appointment: ${error.message}. Please try again.`
    );
  }
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

          .saving-overlay {
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 10px;
            border-radius: 15px; /* Match your modal's border-radius */
            z-index: 100;
          }

          .saving-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid #e5e7eb;
            border-top-color: #165C3C;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .saving-text {
            color: #374151;
            font-family: 'Barlow', sans-serif;
            font-size: 14px;
            font-weight: 500;
          }

          /* --- ADD THIS NEW CSS --- */

          .events-container {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 8px;
            justify-content: center;
          }

          .event-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;
          }

          .event-dot:hover {
            transform: scale(1.3);
          }
          /* --- END OF ADDED CSS --- */

          /* --- ADD THIS NEW CLASS --- */
          .new-mini-day.occupied {
            background-color: #fee2e2;
            color: #b91c1c;
            font-weight: 700;
            cursor: not-allowed;
            opacity: 0.7;
            position: relative;
          }

          .new-mini-day.occupied:hover {
            background-color: #fee2e2;
          }
          /* --- END OF NEW CSS --- */

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
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
        <div
          className={`new-appointment-modal ${showThankYou ? "thank-you-modal" : ""}`}
        >
          {!showThankYou && (
            <>
              <div className="new-appointment-modal-header">
                <h3>
                  {currentStep === 1 &&
                    (currentAppointment
                      ? "Edit Blood Donation Drive"
                      : "Schedule Your Blood Donation Drive")}
                  {currentStep === 2 && "Choose date & Time"}
                  {currentStep === 3 && "Contact Information"}
                </h3>
                <div className="new-step-indicators">
                  <span
                    className={`new-step-number ${currentStep >= 1 ? "active" : ""}`}
                  >
                    1
                  </span>
                  <span
                    className={`new-step-number ${currentStep >= 2 ? "active" : ""}`}
                  >
                    2
                  </span>
                  <span
                    className={`new-step-number ${currentStep >= 3 ? "active" : ""}`}
                  >
                    3
                  </span>
                </div>
                <button
                  className="new-appointment-modal-close"
                  onClick={handleClose}
                >
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
                          className={`new-selection-btn ${selectedType === "barangay" ? "active" : ""}`}
                          onClick={() => setSelectedType("barangay")}
                        >
                          Barangay
                        </button>
                        <div className="new-selection-divider">OR</div>
                        <button
                          className={`new-selection-btn ${selectedType === "organization" ? "active" : ""}`}
                          onClick={() => setSelectedType("organization")}
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
                        <p>
                          Partner with us to make a difference! Schedule an
                          appointment to collaborate with DOH and support our
                          mission. Pick a date and time that works for your
                          organization and help improve healthcare together!
                        </p>
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
                              setDateTimeModalDate(
                                new Date(
                                  dateTimeModalDate.getFullYear(),
                                  dateTimeModalDate.getMonth() - 1,
                                  1
                                )
                              );
                            }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <h4 className="new-calendar-title">
                            {monthNames[dateTimeModalDate.getMonth()]}{" "}
                            {dateTimeModalDate.getFullYear()}
                          </h4>
                          <button
                            className="new-calendar-nav-btn"
                            onClick={() => {
                              setDateTimeModalDate(
                                new Date(
                                  dateTimeModalDate.getFullYear(),
                                  dateTimeModalDate.getMonth() + 1,
                                  1
                                )
                              );
                            }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        <div className="new-mini-calendar">
                          <div className="new-calendar-weekdays">
                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(
                              (day) => (
                                <div key={day} className="new-weekday">
                                  {day}
                                </div>
                              )
                            )}
                          </div>
                          <div className="new-calendar-days">
                          {getDateTimeCalendarDays().map((dayObj, index) => {
                            const isSelected =
                              selectedDate &&
                              dayObj.date.toDateString() === selectedDate.toDateString();

                            let dayClasses = ["new-mini-day"];

                            // Remove the restriction that made other months unclickable
                            if (!dayObj.isCurrentMonth) {
                              dayClasses.push("other-month-clickable");
                            }

                            if (dayObj.isToday) {
                              dayClasses.push("today");
                            }

                            if (isSelected) {
                              dayClasses.push("selected");
                            }

                            if (dayObj.isOccupied) {
                              dayClasses.push("occupied");
                            }

                            return (
                              <div
                                key={index}
                                className={dayClasses.join(" ")}
                                onClick={() => !dayObj.isOccupied && selectDate(dayObj.date)}
                                style={{ cursor: dayObj.isOccupied ? "not-allowed" : "pointer" }}
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
                      <div
                        style={{
                          display: "flex",
                          gap: "30px",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          className="new-availability-section"
                          style={{ flex: "0 0 auto" }}
                        >
                          <h5>AVAILABILITY</h5>
                          <div className="new-time-slots">
                            {timeSlots.map((slot) => (
                              <div
                                key={slot.time}
                                className={`new-time-slot ${selectedTime === slot.time ? "selected" : ""}`}
                                onClick={() => selectTimeSlot(slot.time)}
                              >
                                <span>{slot.display}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ flex: "1", minWidth: "250px" }}>
                          <div className="new-partnership-card">
                            <div className="new-partnership-icon">
                              <Calendar size={32} color="white" />
                            </div>
                            <h5>Book a Partnership Appointment</h5>
                            <p>
                              Partner with us to make a difference! Schedule an
                              appointment to collaborate with DOH and support
                              our mission. Pick a date and time that works for
                              your organization and help improve healthcare
                              together!
                            </p>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "20px",
                            }}
                          >
                            <button
                              type="button"
                              className="new-btn-back"
                              onClick={() => setCurrentStep(1)}
                            >
                              <ArrowLeft size={16} /> Previous
                            </button>
                            <button
                              className="new-next-btn"
                              disabled={
                                !selectedDate ||
                                !selectedTime ||
                                occupiedDates.has(formatDate(selectedDate))
                              }
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
                          placeholder="Contact Person's Full Name"
                          value={contactInfo.lastName}
                          readOnly
                          disabled
                          onChange={(e) =>
                            setContactInfo({
                              ...contactInfo,
                              lastName: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={contactInfo.email}
                          readOnly
                          disabled
                          onChange={(e) =>
                            setContactInfo({
                              ...contactInfo,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={contactInfo.phone}
                          onChange={(e) =>
                            setContactInfo({
                              ...contactInfo,
                              phone: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="text"
                          placeholder="Address"
                          value={contactInfo.address}
                          onChange={(e) =>
                            setContactInfo({
                              ...contactInfo,
                              address: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="text"
                          placeholder="Message (Optional)"
                          value={contactInfo.message}
                          onChange={(e) =>
                            setContactInfo({
                              ...contactInfo,
                              message: e.target.value,
                            })
                          }
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
                        <p>
                          Partner with us to make a difference! Schedule an
                          appointment to collaborate with DOH and support our
                          mission. Pick a date and time that works for your
                          organization and help improve healthcare together!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {showThankYou && (
            <div className="new-thank-you-content">
              <div
                className="new-partnership-icon"
                style={{ margin: "0 auto 15px" }}
              >
                <Calendar size={24} color="white" />
              </div>
              <h3>Thank You!</h3>
              <p>
                {currentAppointment
                  ? "Your appointment has been successfully updated."
                  : "Your appointment has been successfully scheduled."}{" "}
                We look forward to assisting you.
              </p>
              <button className="new-btn-close" onClick={handleClose}>
               Close
              </button>
            </div>
          )}
          {isLoading && (
            <div className="saving-overlay">
              <div className="saving-spinner"></div>
              <div className="saving-text">Submitting Appointment...</div>
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
  const [viewMode, setViewMode] = useState("Month");
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editedAppointment, setEditedAppointment] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });
  const [deleting, setDeleting] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [hoverStates, setHoverStates] = useState({});
  
  const navigateMonth = (direction) => {
  const newDate = new Date(currentDate);
  newDate.setMonth(newDate.getMonth() + direction);
  setCurrentDate(newDate);
};

  // Check user in localStorage
  useEffect(() => {
    const checkUser = () => {
      const userData = localStorage.getItem("currentOrgUser");
      if (!userData) {
        console.warn("No user found in localStorage");
      } else {
        console.log("User found in localStorage:", JSON.parse(userData));
      }
    };

    checkUser();
  }, []);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const occupiedDates = React.useMemo(
    () => new Set(appointments.map((apt) => apt.date)),
    [appointments]
  );

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleMouseEnter = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: true }));
  };

  const handleMouseLeave = (key) => {
    setHoverStates((prev) => ({ ...prev, [key]: false }));
  };

  useEffect(() => {
  const initializePage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const startTime = Date.now();

      await loadAppointments(); // This will set isLoading to false

      // Ensure minimum 1 second loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
    } catch (error) {
      console.error("Error during page initialization:", error);
      setIsLoading(false); // Ensure loading stops on error
    }
  };

  initializePage();
}, []);

  const loadAppointments = async () => {
  try {
    if (typeof window !== "undefined" && window.electronAPI) {
      const appointmentsData = await window.electronAPI.getAllAppointments();
      
      // Filter out cancelled appointments on the frontend as well
      const activeAppointments = appointmentsData.filter(
        (apt) => apt.status !== "cancelled"
      );
      
      setAppointments(activeAppointments);
      console.log("Loaded active appointments:", activeAppointments.length);
      setIsLoading(false); // STOP LOADING AFTER APPOINTMENTS ARE SET
    } else {
      console.warn("ElectronAPI not available - running in browser mode");
      setAppointments([]); // Empty array - no predefined data
      setIsLoading(false); // STOP LOADING
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
    setError("Failed to load appointments. Please try again.");
    setIsLoading(false); // STOP LOADING EVEN ON ERROR
  }
};



  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const startingDay = (firstDay.getDay() + 6) % 7;

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getAppointmentsForDate = (date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return appointments.filter((apt) => apt.date === dateString);
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

 const handleAddAppointment = (newAppointment) => {
  console.log("New appointment received:", newAppointment);
  
  // Create properly formatted appointment object
  const formattedAppointment = {
    id: newAppointment.id || newAppointment.appointment_id,
    appointment_id: newAppointment.appointment_id || newAppointment.id,
    title: newAppointment.title,
    date: newAppointment.date,
    time: newAppointment.time,
    type: newAppointment.type,
    notes: newAppointment.notes,
    status: newAppointment.status,
    contactInfo: newAppointment.contactInfo,
  };

  console.log("Formatted appointment:", formattedAppointment);
  
  // Add new appointment to state IMMEDIATELY for real-time update
  setAppointments((prev) => {
    const updated = [...prev, formattedAppointment];
    console.log("Appointments updated:", updated.length);
    return updated;
  });
};

  const handleAppointmentClick = (appointment) => {
    setCurrentAppointment(appointment);
    setEditedAppointment({
      title: appointment.title,
      date: appointment.date,
      time: appointment.time,
      contactInfo: { ...appointment.contactInfo },
    });
    setIsEditingAppointment(false);
    setShowDetailsModal(true);
  };

  const handleEditAppointment = () => {
    if (
      currentAppointment.status !== "pending" &&
      currentAppointment.status !== "scheduled"
    ) {
      alert("Only pending and scheduled appointments can be edited.");
      return;
    }
    setIsEditingAppointment(true);
  };

  const handleCancelEdit = () => {
    setIsEditingAppointment(false);
    setEditedAppointment({
      title: currentAppointment.title,
      date: currentAppointment.date,
      time: currentAppointment.time,
      contactInfo: { ...currentAppointment.contactInfo },
    });
  };

  const handleSaveEdit = async () => {
    if (
      !editedAppointment.contactInfo.lastName ||
      !editedAppointment.contactInfo.email ||
      !editedAppointment.contactInfo.phone ||
      !editedAppointment.contactInfo.address
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (typeof window !== "undefined" && window.electronAPI) {
        // Improved user detection
        const getUserId = () => {
          try {
            const possibleKeys = [
              "currentOrgUser",
              "currentUser",
              "user",
              "orgUser",
            ];

            for (const key of possibleKeys) {
              const userData = localStorage.getItem(key);
              if (userData) {
                try {
                  const parsed = JSON.parse(userData);
                  const userId =
                    parsed.id || parsed.u_id || parsed.userId || parsed.user_id;

                  if (userId && typeof userId === "number") {
                    console.log(`Found valid user ID in ${key}:`, userId);
                    return userId;
                  }
                } catch (parseError) {
                  console.warn(`Failed to parse ${key}:`, parseError);
                  continue;
                }
              }
            }

            console.warn("No valid user found in localStorage");
            return null;
          } catch (error) {
            console.error("Error getting user ID:", error);
            return null;
          }
        };

        const currentUserId = getUserId();
        if (!currentUserId) {
          throw new Error("User not authenticated. Please log in again.");
        }

        const appointmentId =
          currentAppointment.appointment_id || currentAppointment.id;

        // If editing a scheduled appointment, reset status to pending for re-approval
        const newStatus =
          currentAppointment.status === "scheduled"
            ? "pending"
            : currentAppointment.status || "pending";

        const updatedData = {
          title: `Blood Drive Partnership - ${editedAppointment.contactInfo.lastName}`,
          date: editedAppointment.date,
          time: editedAppointment.time,
          type: "blood-donation",
          notes: "Schedule pending approval. Please await confirmation.",
          status: newStatus,
          contactInfo: editedAppointment.contactInfo,
        };

        await window.electronAPI.updateAppointment(
          appointmentId,
          updatedData,
          currentUserId
        );

        // CRITICAL: Update state IMMEDIATELY for real-time calendar update
        const updatedAppointments = appointments.map((apt) =>
          (apt.appointment_id || apt.id) === appointmentId
            ? { 
                ...apt, 
                ...updatedData, 
                id: appointmentId,
                appointment_id: appointmentId,
                date: editedAppointment.date,
                time: editedAppointment.time,
              }
            : apt
        );
        setAppointments(updatedAppointments);

        setCurrentAppointment({ 
          ...currentAppointment, 
          ...updatedData,
          date: editedAppointment.date,
          time: editedAppointment.time,
        });
        setIsEditingAppointment(false);

        if (currentAppointment.status === "scheduled") {
          alert(
            "Appointment updated successfully! Status reset to Pending - awaiting re-approval from Regional Blood Center."
          );
        } else {
          alert("Appointment updated successfully!");
        }
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      setError("Failed to update appointment. Please try again.");
    }
  };

  const handleDeleteAppointment = (appointment) => {
    // Open delete confirmation modal
    setCancellationReason(""); // Clear previous reason
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
  // For declined/cancelled: No reason validation needed
  if (
    currentAppointment.status !== "declined" &&
    currentAppointment.status !== "cancelled"
  ) {
    if (!cancellationReason || cancellationReason.trim() === "") {
      alert("Please provide a reason for cancellation.");
      return;
    }
  }

  setDeleteModalOpen(false);
  setDeleting(true);

  try {
    const appointmentId =
      currentAppointment.appointment_id || currentAppointment.id;
    console.log("Deleting appointment with ID:", appointmentId);

    if (typeof window !== "undefined" && window.electronAPI) {
      // Get user ID
      const getUserId = () => {
        try {
          const possibleKeys = [
            "currentOrgUser",
            "currentUser",
            "user",
            "orgUser",
          ];

          for (const key of possibleKeys) {
            const userData = localStorage.getItem(key);
            if (userData) {
              try {
                const parsed = JSON.parse(userData);
                const userId =
                  parsed.id || parsed.u_id || parsed.userId || parsed.user_id;

                if (userId && typeof userId === "number") {
                  console.log(`Found valid user ID in ${key}:`, userId);
                  return { userId, parsed };
                }
              } catch (parseError) {
                console.warn(`Failed to parse ${key}:`, parseError);
                continue;
              }
            }
          }

          console.warn("No valid user found in localStorage");
          return null;
        } catch (error) {
          console.error("Error getting user ID:", error);
          return null;
        }
      };

      const userInfo = getUserId();

      if (!userInfo) {
        throw new Error("User not authenticated. Please log in again.");
      }

      const { userId: currentUserId, parsed: currentUser } = userInfo;

      // Delete the appointment (HARD DELETE)
      const result = await window.electronAPI.deleteAppointment(
        appointmentId,
        currentUserId
      );
      console.log("Appointment deletion result:", result);

      if (!result || result.error) {
        throw new Error(
          result?.error || "Failed to delete appointment from database"
        );
      }

      // Send notification to RBC ONLY for cancelled (not declined) appointments
      if (currentAppointment.status === "cancelled") {
        try {
          const orgName =
            currentUser.u_organization_name ||
            currentUser.organizationName ||
            "Organization";
          const barangay = currentUser.u_barangay || currentUser.barangay;
          const cancelledBy = barangay
            ? `${orgName} - Barangay ${barangay}`
            : orgName;
          const userName =
            currentUser.u_full_name || currentUser.fullName || "Organization User";

          await window.electronAPI.createOrgNotification({
            userId: currentUserId,
            title: "Blood Drive Event Cancelled by " + cancelledBy,
            message: `${userName} from ${cancelledBy} has cancelled the blood drive event "${currentAppointment.title}" scheduled for ${new Date(currentAppointment.date).toLocaleDateString()} at ${currentAppointment.time}.\n\nReason: ${cancellationReason}\n\nAppointment Details:\n- Title: ${currentAppointment.title}\n- Organization: ${cancelledBy}\n- Contact: ${currentAppointment.email || currentUser.u_email || currentUser.email}\n- Phone: ${currentAppointment.phone || currentUser.u_contact_number || ""}\n- Date: ${new Date(currentAppointment.date).toLocaleDateString()}\n- Time: ${currentAppointment.time}`,
            type: "cancellation",
            status: "cancellation",
          });

          console.log("Cancellation notification sent to RBC");
        } catch (notifError) {
          console.error("Error sending notification (non-critical):", notifError);
        }
      }
    }

    // Remove from local state immediately for real-time update
    setAppointments((prev) =>
      prev.filter((apt) => (apt.appointment_id || apt.id) !== appointmentId)
    );

    // Close the details modal first
    setShowDetailsModal(false);

    // Stop the deleting loader
    setDeleting(false);

    // Clear cancellation reason
    setCancellationReason("");

    // Wait a brief moment for modal close animation, then show success
    setTimeout(() => {
      setSuccessMessage({
        title:
          currentAppointment?.status === "declined"
            ? "Appointment Deleted"
            : "Appointment Cancelled",
        description:
          currentAppointment?.status === "declined"
            ? "Your appointment has been successfully deleted."
            : "Your appointment has been successfully cancelled and the Regional Blood Center has been notified.",
      });
      setShowSuccessModal(true);
    }, 200);
  } catch (error) {
    console.error("Error deleting appointment:", error);
    setError(`Failed to delete appointment: ${error.message}`);
    alert(
      `Failed to delete appointment: ${error.message}. Please try again.`
    );
    setDeleting(false);
  }
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
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return getAppointmentsForDate(date);
  };

  const getStatusColor = (status, dateString) => {
    // Check if event is finished (in the past)
    if (dateString) {
      const eventDate = new Date(dateString + "T23:59:59"); // Set to end of day
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today

      // If the event date is before today AND it was approved/scheduled
      if (
        eventDate < today &&
        (status === "approved" || status === "scheduled")
      ) {
        return "#10b981"; // Green (Finished)
      }
    }

    // Original status logic
    switch (status) {
      case "approved":
        return "#10b981"; // Green (Approved)
      case "pending":
        return "#f59e0b"; // Orange (Pending)
      case "cancelled":
        return "#ef4444"; // Red (Cancelled)
      case "declined":
        return "#ef4444"; // Red (Declined)
      case "scheduled":
        return "#3b82f6"; // Blue (Scheduled)
      default:
        return "#6b7280"; // Gray
    }
  };

  // Helper function to get display status based on date
  const getDisplayStatus = (status, dateString) => {
    // Check if event is finished (in the past)
    if (dateString) {
      const eventDate = new Date(dateString + "T23:59:59");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If the event date is before today AND it was approved/scheduled
      if (
        eventDate < today &&
        (status === "approved" || status === "scheduled")
      ) {
        return "Finished";
      }
    }

    // Return capitalized status for current/future events
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Helper function to get notes message based on status
  const getNotesMessage = (status, dateString) => {
    // Check if event is finished (in the past)
    if (dateString) {
      const eventDate = new Date(dateString + "T23:59:59");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If the event date is before today AND it was approved/scheduled
      if (
        eventDate < today &&
        (status === "approved" || status === "scheduled")
      ) {
        return "This Blood Drive Partnership Request is now Finished.";
      }
    }

    // Return notes based on status
    switch (status) {
      case "scheduled":
      case "approved":
        return "This Appointment is now Scheduled, please read the Mail for Instructions.";
      case "declined":
        return "This Appointment is Declined, please read the Mail for more Information.";
      case "pending":
        return "Schedule pending approval. Please await confirmation.";
      default:
        return "Schedule pending approval. Please await confirmation.";
    }
  };

  // Success Modal Styles
  const styles = {
    successModalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: "10px",
    },
    successModal: {
      backgroundColor: "white",
      borderRadius: "11px",
      width: "30%",
      maxWidth: "350px",
      padding: "40px 30px 30px",
      boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "Barlow",
      position: "relative",
    },
    successCloseButton: {
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "none",
      border: "none",
      fontSize: "24px",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      borderRadius: "4px",
      transition: "background-color 0.2s ease",
    },
    successCloseButtonHover: {
      backgroundColor: "#f3f4f6",
    },
    successIcon: {
      width: "30px",
      height: "30px",
      backgroundColor: "#10b981",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    successTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#165C3C",
      textAlign: "center",
      fontFamily: "Barlow",
    },
    successDescription: {
      fontSize: "13px",
      color: "#6b7280",
      textAlign: "center",
      lineHeight: "1.5",
      fontFamily: "Barlow",
      marginTop: "-5px",
      paddingLeft: "20px",
      paddingRight: "20px",
    },
    successOkButton: {
      padding: "12px 60px",
      backgroundColor: "#FFC200",
      color: "black",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      fontFamily: "Barlow",
      transition: "all 0.2s ease",
    },
    successOkButtonHover: {
      backgroundColor: "#ffb300",
    },
  };

  // ADD THIS BLOCK
  if (isLoading) {
    return <Loader />;
  }

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
      <div
        style={{
          fontFamily: "Barlow",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            padding: "0 10px",
          }}
        >
          <h1
            style={{
              color: "#165C3C",
              fontSize: "24px",
              fontWeight: "700",
              fontFamily: "Barlow",
              margin: "0",
            }}
          >
            Appointment Calendar
          </h1>

          <button
            onClick={() => setShowNewAppointmentForm(true)}
            style={{
              background: "#ffcf35",
              color: "#165c3c",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "700",
              fontFamily: "Barlow",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#ffeb3b")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#ffcf35")}
          >
            <Plus size={18} />
            New Appointment
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "6px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "Barlow",
            }}
          >
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
                marginLeft: "8px",
              }}
            >
              ×
            </button>
          </div>
        )}

        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "#e0e0e0",
            marginBottom: "30px",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            padding: "0 10px",
          }}
        >
          <button
            onClick={() => navigateMonth(-1)}
            style={{
              background: "none",
              border: "none",
              color: "#2e7d32",
              fontSize: "18px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            <ChevronLeft size={20} />
          </button>

          <h2
            style={{
              color: "#165C3C",
              fontSize: "24px",
              fontWeight: "700",
              fontFamily: "Barlow",
              margin: "0",
            }}
          >
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button
            onClick={() => navigateMonth(1)}
            style={{
              background: "none",
              border: "none",
              color: "#2e7d32",
              fontSize: "18px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {isLoading ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "60px",
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              fontFamily: "Barlow",
            }}
          >
            <p>Loading appointments...</p>
          </div>
        ) : (
          <>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  backgroundColor: "#f8f9fa",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                {weekDays.map((day) => (
                  <div
                    key={day}
                    style={{
                      padding: "15px 10px",
                      textAlign: "center",
                      fontWeight: "700",
                      fontFamily: "Barlow",
                      color: "#666",
                      fontSize: "14px",
                      borderRight: "1px solid #e0e0e0",
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  minHeight: "600px",
                }}
              >
                {getDaysInMonth(currentDate).map((day, index) => {
                  const dayAppointments = getDayAppointments(day);
                  const hasAppointments = dayAppointments.length > 0;
                  const todayClass = day && isToday(day);

                  return (
                    <div
                      key={index}
                      style={{
                        minHeight: "100px",
                        padding: "8px",
                        borderRight:
                          index % 7 !== 6 ? "1px solid #f0f0f0" : "none",
                        borderBottom: index < 35 ? "1px solid #f0f0f0" : "none",
                        backgroundColor: day ? "white" : "#fafafa",
                        position: "relative",
                        cursor: day && hasAppointments ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (day && hasAppointments) {
                          handleAppointmentClick(dayAppointments[0]);
                        }
                      }}
                    >
                      {day && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "5px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: todayClass ? "700" : "400",
                                fontFamily: "Barlow",
                                color: todayClass ? "#2e7d32" : "#333",
                                backgroundColor: todayClass
                                  ? "#e8f5e8"
                                  : "transparent",
                                padding: todayClass ? "4px 8px" : "0",
                                borderRadius: todayClass ? "12px" : "0",
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              {day}
                            </span>
                          </div>

                          {hasAppointments && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: "15px",
                              }}
                            >
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  backgroundColor: "#ffebee",
                                  border: `2px solid ${getStatusColor(dayAppointments[0].status, dayAppointments[0].date)}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <CalendarCheck
                                  size={20}
                                  color={getStatusColor(
                                    dayAppointments[0].status,
                                    dayAppointments[0].date
                                  )}
                                  strokeWidth={2}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <NewAppointmentForm
          isOpen={showNewAppointmentForm}
          onClose={() => setShowNewAppointmentForm(false)}
          onSubmit={handleAddAppointment}
          appointments={appointments}
          currentUser={JSON.parse(localStorage.getItem("currentOrgUser"))} // Add this line
        />

        {showDetailsModal && currentAppointment && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "500px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                fontFamily: "Barlow",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    color: "#2e7d32",
                    fontSize: "20px",
                    fontWeight: "700",
                    fontFamily: "Barlow",
                    margin: "0",
                  }}
                >
                  Appointment Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#666",
                    padding: "0",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#f5f5f5")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "transparent")
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ lineHeight: "1.6", fontFamily: "Barlow" }}>
                <div style={{ marginBottom: "15px" }}>
                  <strong style={{ color: "#2e7d32", fontFamily: "Barlow" }}>
                    Title:
                  </strong>
                  <div style={{ marginTop: "5px", fontFamily: "Barlow" }}>
                    {isEditingAppointment ? (
                      <input
                        type="text"
                        value={`Blood Drive Partnership - ${editedAppointment.contactInfo.lastName}`}
                        readOnly
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontFamily: "Barlow",
                          backgroundColor: "white",
                          cursor: "text",
                        }}
                      />
                    ) : (
                      currentAppointment.title
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <strong style={{ color: "#2e7d32", fontFamily: "Barlow" }}>
                    Date & Time:
                  </strong>
                  <div style={{ marginTop: "5px", fontFamily: "Barlow" }}>
                    {isEditingAppointment ? (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="date"
                          value={editedAppointment.date}
                          onChange={(e) =>
                            setEditedAppointment({
                              ...editedAppointment,
                              date: e.target.value,
                            })
                          }
                          disabled={currentAppointment.status === "scheduled"}
                          style={{
                            flex: 1,
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontFamily: "Barlow",
                            backgroundColor:
                              currentAppointment.status === "scheduled"
                                ? "#f5f5f5"
                                : "white",
                            cursor:
                              currentAppointment.status === "scheduled"
                                ? "not-allowed"
                                : "text",
                          }}
                        />
                        <select
                          value={editedAppointment.time}
                          onChange={(e) =>
                            setEditedAppointment({
                              ...editedAppointment,
                              time: e.target.value,
                            })
                          }
                          disabled={currentAppointment.status === "scheduled"}
                          style={{
                            flex: 1,
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontFamily: "Barlow",
                            backgroundColor:
                              currentAppointment.status === "scheduled"
                                ? "#f5f5f5"
                                : "white",
                            cursor:
                              currentAppointment.status === "scheduled"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          <option value="8:00">8:00 AM</option>
                          <option value="9:00">9:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="11:00">11:00 AM</option>
                        </select>
                      </div>
                    ) : (
                      `${formatDisplayDate(currentAppointment.date)} at ${formatTime(currentAppointment.time)}`
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <strong style={{ color: "#2e7d32", fontFamily: "Barlow" }}>
                    Type:
                  </strong>
                  <div style={{ marginTop: "5px" }}>
                    <span
                      style={{
                        backgroundColor: "#ffebee",
                        color: "#c62828",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "400",
                        fontFamily: "Barlow",
                        border: "1px solid #ffcdd2",
                      }}
                    >
                      Blood Drive Partnership
                    </span>
                  </div>
                </div>

                {currentAppointment.status && (
                  <div style={{ marginBottom: "15px" }}>
                    <strong style={{ color: "#2e7d32", fontFamily: "Barlow" }}>
                      Status:
                    </strong>
                    <div style={{ marginTop: "5px" }}>
                      <span
                        style={{
                          backgroundColor: `${getStatusColor(currentAppointment.status, currentAppointment.date)}15`,
                          color: getStatusColor(
                            currentAppointment.status,
                            currentAppointment.date
                          ),
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          fontFamily: "Barlow",
                          border: `1px solid ${getStatusColor(currentAppointment.status, currentAppointment.date)}`,
                          textTransform: "capitalize",
                        }}
                      >
                        {getDisplayStatus(
                          currentAppointment.status,
                          currentAppointment.date
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: "15px" }}>
                  <strong style={{ color: "#2e7d32", fontFamily: "Barlow" }}>
                    Contact Information:
                  </strong>
                  <div
                    style={{
                      marginTop: "5px",
                      paddingLeft: "10px",
                      fontFamily: "Barlow",
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Name:</strong>
                      {isEditingAppointment ? (
                        <input
                          type="text"
                          value={editedAppointment.contactInfo.lastName}
                          onChange={(e) =>
                            setEditedAppointment({
                              ...editedAppointment,
                              contactInfo: {
                                ...editedAppointment.contactInfo,
                                lastName: e.target.value,
                              },
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "6px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontFamily: "Barlow",
                            marginTop: "4px",
                          }}
                        />
                      ) : (
                        ` ${currentAppointment.contactInfo.lastName}`
                      )}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Email:</strong>
                      {isEditingAppointment ? (
                        <input
                          type="email"
                          value={editedAppointment.contactInfo.email}
                          onChange={(e) =>
                            setEditedAppointment({
                              ...editedAppointment,
                              contactInfo: {
                                ...editedAppointment.contactInfo,
                                email: e.target.value,
                              },
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "6px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontFamily: "Barlow",
                            marginTop: "4px",
                          }}
                        />
                      ) : (
                        ` ${currentAppointment.contactInfo.email}`
                      )}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Phone:</strong>
                      {isEditingAppointment ? (
                        <input
                          type="tel"
                          value={editedAppointment.contactInfo.phone}
                          onChange={(e) =>
                            setEditedAppointment({
                              ...editedAppointment,
                              contactInfo: {
                                ...editedAppointment.contactInfo,
                                phone: e.target.value,
                              },
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "6px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontFamily: "Barlow",
                            marginTop: "4px",
                          }}
                        />
                      ) : (
                        ` ${currentAppointment.contactInfo.phone}`
                      )}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Address:</strong>
                      {isEditingAppointment ? (
                        <input
                          type="text"
                          value={editedAppointment.contactInfo.address}
                          onChange={(e) =>
                            setEditedAppointment({
                              ...editedAppointment,
                              contactInfo: {
                                ...editedAppointment.contactInfo,
                                address: e.target.value,
                              },
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "6px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontFamily: "Barlow",
                            marginTop: "4px",
                          }}
                        />
                      ) : (
                        ` ${currentAppointment.contactInfo.address}`
                      )}
                    </div>
                    {currentAppointment.contactInfo.type && (
                      <div>
                        <strong>Type:</strong>{" "}
                        {currentAppointment.contactInfo.type === "barangay"
                          ? "Barangay"
                          : "Organization"}
                      </div>
                    )}
                  </div>
                </div>

                {(currentAppointment.contactInfo.message ||
                  isEditingAppointment) && (
                  <div style={{ marginBottom: "15px" }}>
                    <strong style={{ color: "#2e7d32", fontFamily: "Barlow" }}>
                      Message:
                    </strong>
                    <div style={{ marginTop: "5px", fontFamily: "Barlow" }}>
                      {isEditingAppointment ? (
                        <textarea
                          value={editedAppointment.contactInfo.message || ""}
                          onChange={(e) =>
                            setEditedAppointment({
                              ...editedAppointment,
                              contactInfo: {
                                ...editedAppointment.contactInfo,
                                message: e.target.value,
                              },
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontFamily: "Barlow",
                            minHeight: "60px",
                            resize: "vertical",
                          }}
                          placeholder="Optional message"
                        />
                      ) : (
                        <div
                          style={{
                            padding: "10px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "6px",
                            border: "1px solid #e9ecef",
                          }}
                        >
                          {currentAppointment.contactInfo.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: "15px" }}>
                  <strong style={{ color: "#2e7d32", fontFamily: "Barlow" }}>
                    Notes:
                  </strong>
                  <div style={{ marginTop: "5px", fontFamily: "Barlow" }}>
                    {getNotesMessage(
                      currentAppointment.status,
                      currentAppointment.date
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  gap: "10px",
                }}
              >
                {!isEditingAppointment ? (
                  <>
                    {/* Check if appointment is finished (past approved/scheduled) */}
                    {(() => {
                      const isFinished =
                        currentAppointment.date &&
                        (() => {
                          const eventDate = new Date(
                            currentAppointment.date + "T23:59:59"
                          );
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return (
                            eventDate < today &&
                            (currentAppointment.status === "approved" ||
                              currentAppointment.status === "scheduled")
                          );
                        })();

                      // If finished, show no buttons
                      if (isFinished) {
                        return null;
                      }

                      // For declined status, only show centered delete button
                      if (
                        currentAppointment.status === "declined" ||
                        currentAppointment.status === "cancelled"
                      ) {
                        return (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                            }}
                          >
                            <button
                              onClick={() =>
                                handleDeleteAppointment(currentAppointment)
                              }
                              disabled={deleting}
                              style={{
                                background: deleting ? "#6b7280" : "#dc2626",
                                color: "white",
                                border: "none",
                                padding: "10px 20px",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "700",
                                fontFamily: "Barlow",
                                cursor: deleting ? "not-allowed" : "pointer",
                                transition: "background-color 0.2s",
                                position: "relative",
                                opacity: deleting ? 0.7 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!deleting) {
                                  e.target.style.backgroundColor = "#b91c1c";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!deleting) {
                                  e.target.style.backgroundColor = "#dc2626";
                                }
                              }}
                            >
                              {deleting
                                ? "Cancelling..."
                                : "Cancel Appointment"}
                            </button>
                          </div>
                        );
                      }

                      // Otherwise, show both buttons (for pending/scheduled)
                      const canEdit =
                        currentAppointment.status === "pending" ||
                        currentAppointment.status === "scheduled";

                      return (
                        <>
                          <button
                            onClick={() =>
                              handleDeleteAppointment(currentAppointment)
                            }
                            style={{
                              background: "#dc2626",
                              color: "white",
                              border: "none",
                              padding: "10px 20px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontWeight: "700",
                              fontFamily: "Barlow",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                              position: "relative",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.backgroundColor = "#b91c1c")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.backgroundColor = "#dc2626")
                            }
                          >
                            Cancel Appointment
                          </button>
                          <button
                            onClick={() => handleEditAppointment()}
                            disabled={!canEdit}
                            style={{
                              background: canEdit ? "#2e7d32" : "#cccccc",
                              color: "white",
                              border: "none",
                              padding: "10px 20px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontWeight: "700",
                              fontFamily: "Barlow",
                              cursor: canEdit ? "pointer" : "not-allowed",
                              transition: "background-color 0.2s",
                              opacity: canEdit ? 1 : 0.6,
                            }}
                            onMouseEnter={(e) => {
                              if (canEdit) {
                                e.target.style.backgroundColor = "#1b5e20";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (canEdit) {
                                e.target.style.backgroundColor = "#2e7d32";
                              }
                            }}
                          >
                            Edit Appointment
                          </button>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        background: "#666",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "700",
                        fontFamily: "Barlow",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#555")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "#666")
                      }
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        background: "#2e7d32",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "700",
                        fontFamily: "Barlow",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#1b5e20")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "#2e7d32")
                      }
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancel/Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div style={styles.successModalOverlay}>
            <div style={styles.successModal}>
              <button
                style={{
                  ...styles.successCloseButton,
                  ...(hoverStates.deleteClose
                    ? styles.successCloseButtonHover
                    : {}),
                }}
                onClick={() => setDeleteModalOpen(false)}
                onMouseEnter={() => handleMouseEnter("deleteClose")}
                onMouseLeave={() => handleMouseLeave("deleteClose")}
                disabled={deleting} // Disable close while deleting
              >
                ×
              </button>

              <div
                style={{
                  ...styles.successIcon,
                  backgroundColor: deleting ? "#6b7280" : "#dc2626",
                }}
              >
                {deleting ? (
                  <div
                    className="saving-spinner"
                    style={{
                      width: "20px",
                      height: "20px",
                      borderWidth: "2px",
                    }}
                  ></div>
                ) : (
                  <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                )}
              </div>

              <h3 style={styles.successTitle}>
                {deleting
                  ? "Processing..."
                  : currentAppointment?.status === "declined"
                    ? "Confirm Delete"
                    : "Confirm Cancellation"}
              </h3>
              <p style={styles.successDescription}>
                {deleting
                  ? "Please wait while we process your request..."
                  : currentAppointment?.status === "declined"
                    ? "Are you sure you want to delete this appointment? This action cannot be undone."
                    : "Please provide a reason for cancelling this appointment. This will be sent to the Regional Blood Center."}
              </p>

             {!deleting && currentAppointment?.status !== "declined" && 
                currentAppointment?.status !== "cancelled" && (
                  <textarea
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontFamily: "Barlow",
                      resize: "vertical",
                      marginBottom: "20px",
                      boxSizing: "border-box",
                    }}
                    placeholder="Enter cancellation reason..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                  />
                )}
              {!deleting && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <button
                    style={{
                      padding: "12px 30px",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600",
                      fontFamily: "Barlow",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => setDeleteModalOpen(false)}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#e5e7eb")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      padding: "12px 30px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600",
                      fontFamily: "Barlow",
                      transition: "all 0.2s ease",
                    }}
                    onClick={handleConfirmDelete}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#b91c1c")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#dc2626")
                    }
                  >
                    {currentAppointment?.status === "declined"
                      ? "Delete"
                      : "Confirm"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div style={styles.successModalOverlay}>
            <div style={styles.successModal}>
              <button
                style={{
                  ...styles.successCloseButton,
                  ...(hoverStates.successClose
                    ? styles.successCloseButtonHover
                    : {}),
                }}
                onClick={() => setShowSuccessModal(false)}
                onMouseEnter={() => handleMouseEnter("successClose")}
                onMouseLeave={() => handleMouseLeave("successClose")}
              >
                ×
              </button>

              <div style={styles.successIcon}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>

              <h3 style={styles.successTitle}>{successMessage.title}</h3>
              <p style={styles.successDescription}>
                {successMessage.description}
              </p>

              <button
                style={{
                  ...styles.successOkButton,
                  ...(hoverStates.successOk ? styles.successOkButtonHover : {}),
                }}
                onClick={() => setShowSuccessModal(false)}
                onMouseEnter={() => handleMouseEnter("successOk")}
                onMouseLeave={() => handleMouseLeave("successOk")}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AppointmentOrg;
