<div align="center">

# 🩸 BloodSync

### A Smart Donor Management and Blood Stock Monitoring System with Barcode Integration

[![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![Status](https://img.shields.io/badge/status-Active-success?style=flat-square)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**BloodSync** is a desktop-based blood bank management system designed for the **Department of Health – X Regional Blood Center (DOH-X RBC)** and its partnered organizations. It replaces manual Excel-based workflows with automated features for efficient blood center operations.

<details>
<summary><b>🎯 Key Capabilities</b></summary>

- 🧪 Blood inventory monitoring with real-time stock levels
- 📦 Barcode scanning for recording & releasing blood units
- 👤 Donor information management with duplicate prevention
- 📅 Scheduling of donation drives with approval workflows
- ⚠️ Handling non-conforming units with documentation
- 🌐 Offline data recording for partner organizations
- 🔗 Syncing donor data into a central database
- 📝 Generating official DOH forms (BHF, BDDR, NC Forms)

</details>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 👥 Donor Management
- ✅ Register & update donor records
- ✅ Photo capture integration
- ✅ Complete donation history tracking
- ✅ Duplicate prevention system
- ✅ Data sync between organizations
- ✅ Approval workflow for sync requests

</td>
<td width="50%">

### 🩸 Blood Inventory
- ✅ Barcode scanning support
- ✅ Auto-expiration calculation
- ✅ Real-time stock monitoring
- ✅ Low-stock & expiry alerts
- ✅ Component-based grouping
- ✅ Automated form generation

</td>
</tr>
<tr>
<td width="50%">

### 📤 Release Management
- ✅ Barcode validation
- ✅ Batch release processing
- ✅ BHF invoice generation
- ✅ Automatic inventory updates
- ✅ Complete release history
- ✅ Audit trail maintenance

</td>
<td width="50%">

### 📅 Scheduling System
- ✅ Partner request management
- ✅ Approval/decline workflow
- ✅ Email notifications
- ✅ Visual calendar interface
- ✅ Conflict detection
- ✅ Automated reminders

</td>
</tr>
</table>

---

## 🔧 Prerequisites

Before installation, ensure you have:

| Requirement | Version | Download |
|------------|---------|----------|
| **Node.js** | ≥18.0.0 | [nodejs.org](https://nodejs.org/) |
| **npm** | ≥8.0.0 | Included with Node.js |
| **PostgreSQL** | ≥14.0 | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### 💻 System Requirements

- **OS:** Windows 10+, macOS 10.14+, or Linux
- **RAM:** 8GB minimum (16GB recommended)
- **Storage:** 500MB free space
- **CPU:** Dual-core or better
- **Optional:** USB/Bluetooth barcode scanner

---

## 💾 Installation

### Quick Install
```bash
# Clone the repository
git clone https://github.com/evegendelacruz/BloodSync-Official.git

# Navigate to directory
cd BloodSync-Official

# Install dependencies
npm install
```

### Database Setup
```bash
# Create PostgreSQL database
createdb bloodsync

# Run migrations (if available)
npm run migrate

# Seed initial data (optional)
npm run seed
```

### Environment Configuration

Create a `.env` file in the project root:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=bloodsync

# Email Configuration
EMAIL_API_KEY=your_email_service_api_key
EMAIL_FROM=noreply@bloodsync.com

# Application Settings
NODE_ENV=development
PORT=3000
```

> 💡 **Tip:** Never commit your `.env` file to version control!

---

## 🚀 Usage

### Development Mode

Start the application with hot-reload:
```bash
npm start
```

The application will automatically:
1. Start the Electron main process
2. Launch the React development server
3. Open the BloodSync window

> ⏱️ **Launch time:** 10-15 seconds

### Quick Restart
```bash
rs
```

Press `Enter` to restart the development server without stopping.

### Debug Mode
```bash
npm run dev
```

Opens the application with DevTools enabled by default.

### Production Build
```bash
npm run build
```

Builds are created in the `dist/` directory:

- **Windows:** `BloodSync Setup 1.0.0.exe`
- **macOS:** `BloodSync-1.0.0.dmg`
- **Linux:** `bloodsync_1.0.0_amd64.deb`

---

## 📁 Project Structure
```
BloodSync-Official/
├── 📂 backend/             # Backend folder for database scripts
│   ├── 📄 db.js            # Main database connection
│   └── 📄 db_org.js        # Organization-specific database connection
├── 📂 public/              # Public static files
├── 📂 src/                 # Source files for the app
│   ├── 📂 app/             # Main application logic
│   ├── 📂 assets/          # Images, icons, and other assets
│   ├── 📂 components/      # React components
│   ├── 📄 main.js          # Electron main process entry
│   ├── 📄 preload.js       # Preload scripts for renderer
│   └── 📄 renderer.jsx     # React renderer entry point
├── 📄 .gitignore           # Git ignore rules
├── 📄 forge.config.js      # Electron Forge configuration
├── 📄 index.html           # HTML template for renderer
├── 📄 package-lock.json    # Package lock file
├── 📄 package.json         # Project dependencies and scripts
├── 📄 vite.main.config.js      # Vite config for main process
├── 📄 vite.preload.config.js   # Vite config for preload scripts
└── 📄 vite.renderer.config.js  # Vite config for renderer
└── 📄 README.md
```

---

## 👥 User Roles & Permissions

| Role | Access Level | Permissions |
|------|-------------|-------------|
| 🔑 **Admin** | Full Access | System configuration, user management, all operations |
| 📦 **Inventory Staff** | Standard | Record/release blood units, view inventory |
| ⚠️ **NC Staff** | Limited | Handle non-conforming units, generate NC forms |
| 📅 **Scheduler** | Specialized | Approve/decline schedules, manage calendar |
| 🤝 **Partner Org** | External | Register donors, request schedules, sync data |

---

## 🖥️ Application Modules

<details>
<summary><b>📊 Dashboard</b></summary>

- Real-time inventory statistics
- Expiring blood units alerts
- Pending schedule requests
- Recent activity logs
- Quick action buttons

</details>

<details>
<summary><b>👤 Donor Management</b></summary>

- Register new donors with photo
- Edit existing profiles
- View donation history
- Approve/decline sync requests
- Duplicate detection system

</details>

<details>
<summary><b>🩸 Blood Recording</b></summary>

- Barcode scanner integration
- Manual entry option
- Auto-expiration calculation
- Component selection (Whole Blood, RBC, Platelets, Plasma, Cryo)
- Blood type classification (A+, A-, B+, B-, AB+, AB-, O+, O-)

</details>

<details>
<summary><b>📤 Blood Release</b></summary>

- Barcode validation
- Batch processing
- BHF invoice generation
- Inventory auto-update
- Release history tracking

</details>

<details>
<summary><b>⚠️ Non-Conforming Units</b></summary>

- Record reactive units
- Document discarded units
- Generate NC Forms
- Automatic inventory updates

</details>

<details>
<summary><b>📅 Scheduling</b></summary>

- Review partner requests
- Approve/decline with remarks
- Visual calendar view
- Email notifications
- Conflict detection

</details>

<details>
<summary><b>📝 Reports & Documents</b></summary>

- Blood History Form (BHF)
- Blood Donor Data Report (BDDR)
- Non-Conforming Forms
- PDF export functionality

</details>

<details>
<summary><b>🔍 Activity Logs</b></summary>

- Complete audit trail
- User action tracking
- System event logging
- Export capabilities

</details>

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1.1 | UI Framework |
| Electron | 37.3.1 | Desktop App Framework |
| Framer Motion | 12.x | Animations |
| Lucide React | Latest | Icon Library |
| Recharts | 3.4 | Data Visualization |
| React Router DOM | 7.x | Routing |

### Backend & Database
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime Environment |
| PostgreSQL | 8.16 | Database |
| node-schedule | 2.1 | Task Scheduling |

### PDF & Documents
| Technology | Version | Purpose |
|-----------|---------|---------|
| jsPDF | 3.0 | PDF Generation |
| jsPDF AutoTable | 5.0 | PDF Tables |
| PDFKit | 0.17 | Alternative PDF Gen |

### Utilities
| Technology | Version | Purpose |
|-----------|---------|---------|
| crypto-js | 4.2 | Encryption |
| nodemailer | 7.0 | Email Notifications |
| lodash | 4.17 | Utility Functions |

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Commit Message Convention
```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Adding tests
chore: Maintenance tasks
```

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- ✅ Use ES6+ syntax
- ✅ Follow React best practices
- ✅ Add JSDoc comments
- ✅ Keep functions small and focused
- ✅ Use meaningful variable names

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Donor registration flow
- [ ] Barcode scanning functionality
- [ ] Blood unit recording
- [ ] Blood unit release
- [ ] PDF report generation
- [ ] Offline mode functionality
- [ ] Data synchronization
- [ ] Email notifications

### Test Locations

- ✅ DOH-X Regional Blood Center
- ✅ City Scholarship Office
- ✅ Barangay Bonbon

---

## 📄 License

**Proprietary — Capstone Project**

This software is developed for academic purposes.

> ⚠️ **Important:** Unauthorized copying, distribution, or commercial use is strictly prohibited.

© 2025 BloodSync Developers. All rights reserved.

---

## 📞 Support

Need help? Reach out to us:

| Channel | Link |
|---------|------|
| 🐛 Issues | [GitHub Issues](https://github.com/evegendelacruz/BloodSync-Official/issues) |
| 📧 Email | bloodsync.doh@gmail.com |
| 📚 Docs | [Documentation](https://github.com/evegendelacruz/BloodSync-Official/) |

---

## 🙏 Acknowledgments

Special thanks to:

- 🏥 **Department of Health – X Regional Blood Center** - Primary stakeholder
- 🎓 **City Scholarship Office** - Pilot testing partner
- 🏘️ **Barangay Bonbon** - Community partner
- 👨‍🏫 Academic advisors and mentors
- 🌐 The open-source community

---

## 📝 Changelog

### [v1.0.0] - January 2025

#### Added ✅
- Core donor management functionality
- Blood inventory tracking with barcode integration
- Blood release module with batch processing
- Non-conforming unit handling
- Donation drive scheduling with approval workflow
- Offline mode for partner organizations
- PDF report generation (BHF, BDDR, NC Forms)
- Activity logging and audit trail
- Email notification system

#### Upcoming 🔄
- Advanced reporting and analytics
- Mobile app companion
- Multi-language support
- Enhanced barcode formats
- Automated backup system

---

## 🚀 Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/evegendelacruz/BloodSync-Official.git

# 2. Navigate to directory
cd BloodSync-Official

# 3. Install dependencies
npm install

# 4. Create .env file and configure

# 5. Start the application
npm start

# 6. To restart during development
rs
```

---

<div align="center">

**Made with ❤️ by the BloodSync Team**

*Saving lives, one donation at a time.*

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/evegendelacruz/BloodSync-Official)

</div>
