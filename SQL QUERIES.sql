-- ============================================================================
-- BLOODSYNC DATABASE TABLES
-- SQL CREATE TABLE IF NOT EXISTS Statements
-- ============================================================================

-- ============================================================================
-- REGIONAL BLOOD CENTER TABLES
-- ============================================================================

-- 1. REGIONAL BLOOD CENTER MAIL
CREATE TABLE IF NOT EXISTS mail_rbc (
    id SERIAL PRIMARY KEY,
    mail_id VARCHAR(50) UNIQUE NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_organization VARCHAR(255),
    to_name VARCHAR(255) DEFAULT 'Regional Blood Center',
    to_email VARCHAR(255) DEFAULT 'admin@regionalbloodcenter.org',
    subject VARCHAR(500) NOT NULL,
    preview TEXT,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('approved', 'declined', 'pending', 'info', 'read', 'unread')),
    mail_type VARCHAR(50) DEFAULT 'partnership_request' CHECK (mail_type IN ('partnership_request', 'sync_request', 'inquiry', 'notification', 'general')),
    appointment_id BIGINT,
    request_title VARCHAR(255),
    requestor VARCHAR(255),
    request_organization VARCHAR(255),
    date_submitted DATE,
    read BOOLEAN DEFAULT FALSE,
    starred BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) DEFAULT 'inbox' CHECK (category IN ('inbox', 'sent', 'starred', 'archived', 'trash')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. REGIONAL BLOOD CENTER NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications_rbc (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('partnership_request', 'sync_request', 'appointment_update', 'blood_drive', 'donor_sync', 'event_reminder', 'system', 'general')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('approved', 'declined', 'cancelled', 'pending', 'info', 'completed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    description TEXT,
    requestor_name VARCHAR(255),
    requestor_organization VARCHAR(255),
    requestor_email VARCHAR(255),
    requestor_phone VARCHAR(50),
    donor_count INTEGER,
    appointment_id BIGINT,
    event_date DATE,
    event_time TIME,
    event_location TEXT,
    action_url TEXT,
    action_type VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. REGIONAL BLOOD CENTER UPCOMING EVENTS / BLOOD DRIVE CALENDAR
CREATE TABLE IF NOT EXISTS events_rbc (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'blood_drive' CHECK (event_type IN ('blood_drive', 'sync_request', 'partnership_meeting', 'training', 'awareness_campaign', 'other')),
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    location TEXT NOT NULL,
    address TEXT,
    organizer_name VARCHAR(255),
    organizer_organization VARCHAR(255),
    organizer_email VARCHAR(255),
    organizer_phone VARCHAR(50),
    contact_type VARCHAR(20) CHECK (contact_type IN ('barangay', 'organization', 'internal')),
    appointment_id BIGINT,
    expected_donors INTEGER,
    actual_donors INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed')),
    notes TEXT,
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    color VARCHAR(20) DEFAULT '#dc2626',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. REGIONAL BLOOD CENTER RECENT ACTIVITY
CREATE TABLE IF NOT EXISTS activity_logs_rbc (
    id SERIAL PRIMARY KEY,
    activity_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'DECLINE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT', 'SYNC')),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('partnership', 'appointment', 'donor', 'event', 'user', 'mail', 'notification', 'report', 'other')),
    entity_id VARCHAR(100),
    action_description TEXT NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTNERED ORGANIZATION TABLES
-- ============================================================================

-- 5. PARTNERED ORGANIZATION MAIL
CREATE TABLE IF NOT EXISTS mail_org (
    id SERIAL PRIMARY KEY,
    mail_id VARCHAR(50) UNIQUE NOT NULL,
    from_name VARCHAR(255) DEFAULT 'Regional Blood Center',
    from_email VARCHAR(255) DEFAULT 'admin@regionalbloodcenter.org',
    subject VARCHAR(500) NOT NULL,
    preview TEXT,
    body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('approved', 'declined', 'pending', 'info')),
    appointment_id BIGINT,
    decline_reason TEXT,
    request_title VARCHAR(255),
    requestor VARCHAR(255),
    request_organization VARCHAR(255),
    date_submitted DATE,
    read BOOLEAN DEFAULT FALSE,
    starred BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) DEFAULT 'inbox' CHECK (category IN ('inbox', 'sent', 'starred', 'archived', 'trash')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PARTNERED ORGANIZATION NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications_org (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'partnership_response' CHECK (type IN ('partnership_response', 'sync_response', 'upcoming_event', 'event_reminder', 'event_update', 'general')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('approved', 'declined', 'cancelled', 'pending', 'info')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    description TEXT,
    requestor_name VARCHAR(255),
    requestor_organization VARCHAR(255) DEFAULT 'Regional Blood Center',
    donor_count INTEGER,
    appointment_id BIGINT,
    decline_reason TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    contact_type VARCHAR(50),
    event_date DATE,
    event_time TIME,
    event_location TEXT,
    read BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PARTNERED ORGANIZATION UPCOMING EVENTS / BLOOD DRIVE CALENDAR
CREATE TABLE IF NOT EXISTS events_org (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'blood_drive' CHECK (event_type IN ('blood_drive', 'sync_request', 'meeting', 'training', 'other')),
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    location TEXT NOT NULL,
    address TEXT,
    organizer_name VARCHAR(255) DEFAULT 'Regional Blood Center',
    organizer_email VARCHAR(255),
    organizer_phone VARCHAR(50),
    appointment_id BIGINT,
    expected_donors INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed')),
    notes TEXT,
    color VARCHAR(20) DEFAULT '#dc2626',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PARTNERED ORGANIZATION APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    appointment_id BIGINT UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('blood-donation', 'sync-request')),
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('barangay', 'organization')),
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    message TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'scheduled', 'completed', 'cancelled')),
    cancellation_reason TEXT,
    organization_name VARCHAR(255),
    contact_name VARCHAR(255),
    expected_donors INTEGER,
    actual_donors INTEGER,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. PARTNERED ORGANIZATION DONOR RECORD
CREATE TABLE IF NOT EXISTS donors (
    id SERIAL PRIMARY KEY,
    donor_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
    birthdate DATE NOT NULL,
    age INTEGER NOT NULL,
    blood_type VARCHAR(3) NOT NULL CHECK (blood_type IN ('A', 'B', 'AB', 'O')),
    rh_factor VARCHAR(1) NOT NULL CHECK (rh_factor IN ('+', '-')),
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    last_donation_date DATE,
    total_donations INTEGER DEFAULT 0,
    eligibility_status VARCHAR(50) DEFAULT 'eligible' CHECK (eligibility_status IN ('eligible', 'temporarily_deferred', 'permanently_deferred')),
    deferral_reason TEXT,
    deferral_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. PARTNERED ORGANIZATION RECENT ACTIVITY
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    activity_id VARCHAR(50),
    user_id INTEGER,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'DECLINE', 'VIEW', 'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT')),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('donor', 'appointment', 'event', 'user', 'mail', 'notification', 'report', 'other')),
    entity_id VARCHAR(100),
    action_description TEXT NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Regional Blood Center Indexes
CREATE INDEX IF NOT EXISTS idx_mail_rbc_created_at ON mail_rbc(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_rbc_status ON mail_rbc(status);
CREATE INDEX IF NOT EXISTS idx_mail_rbc_read ON mail_rbc(read);

CREATE INDEX IF NOT EXISTS idx_notifications_rbc_created_at ON notifications_rbc(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_rbc_type ON notifications_rbc(type);
CREATE INDEX IF NOT EXISTS idx_notifications_rbc_read ON notifications_rbc(read);

CREATE INDEX IF NOT EXISTS idx_events_rbc_event_date ON events_rbc(event_date);
CREATE INDEX IF NOT EXISTS idx_events_rbc_status ON events_rbc(status);

CREATE INDEX IF NOT EXISTS idx_activity_logs_rbc_created_at ON activity_logs_rbc(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_rbc_user_id ON activity_logs_rbc(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_rbc_action_type ON activity_logs_rbc(action_type);

-- Partnered Organization Indexes
CREATE INDEX IF NOT EXISTS idx_mail_org_created_at ON mail_org(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_org_status ON mail_org(status);
CREATE INDEX IF NOT EXISTS idx_mail_org_read ON mail_org(read);

CREATE INDEX IF NOT EXISTS idx_notifications_org_created_at ON notifications_org(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_org_type ON notifications_org(type);
CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON notifications_org(read);

CREATE INDEX IF NOT EXISTS idx_events_org_event_date ON events_org(event_date);
CREATE INDEX IF NOT EXISTS idx_events_org_status ON events_org(status);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type, rh_factor);
CREATE INDEX IF NOT EXISTS idx_donors_eligibility ON donors(eligibility_status);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
