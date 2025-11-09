import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Bell, User, RefreshCw, MoreVertical, CheckCircle, XCircle, Clock, Calendar, MapPin } from "lucide-react";
import SidePanel from "../../components/SidePanel";
import Loader from "../../components/Loader";

import MailComponent from "./(tabs)/mail";
import CalendarComponent from "./(tabs)/calendar";
import NotificationComponent from "./(tabs)/notification";
import ProfileComponent from "././(tabs)/profile/profile";
import Plasma from "./blood_stock/plasma";
import Platelet from "./blood_stock/platelet";
import RedBloodCell from "./blood_stock/rbc";
import DonorRecord from "./donor_record";
import Invoice from "./invoice";
import RecentActivity from "./recent_activity";
import ReleasedBlood from "./released_blood";
import Reports from "./reports";
import PlasmaNC from "./non-conforming/plasma";
import PlateletNC from "./non-conforming/platelet";
import RedBloodCellNC from "./non-conforming/rbc";

const DashboardContent = ({ onNavigate }) => {
  const [bloodCounts, setBloodCounts] = useState({
    redBloodCell: 0,
    platelet: 0,
    plasma: 0
  });
  const [bloodTypeCounts, setBloodTypeCounts] = useState({
    'AB+': 0,
    'AB-': 0,
    'A+': 0,
    'A-': 0,
    'B+': 0,
    'B-': 0,
    'O+': 0,
    'O-': 0
  });
  const [releasedBloodCounts, setReleasedBloodCounts] = useState({
    redBloodCell: 0,
    platelet: 0,
    plasma: 0
  });
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [expiringStocks, setExpiringStocks] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [upcomingDrives, setUpcomingDrives] = useState([]); // <-- ADD THIS LINE
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchBloodCounts = async () => {
      const start = Date.now();
      try {
        const counts = await window.electronAPI.getBloodStockCounts();
        setBloodCounts(counts);

        const typeCounts = await window.electronAPI.getBloodStockCountsByType();
        setBloodTypeCounts(typeCounts);

        // Fetch released blood data
        const [rbcData, plasmaData, plateletData] = await Promise.all([
          window.electronAPI.getReleasedBloodStock(),
          window.electronAPI.getReleasedPlasmaStock(),
          window.electronAPI.getReleasedPlateletStock()
        ]);

        // Calculate counts for each category
        const releasedCounts = {
          redBloodCell: rbcData?.length || 0,
          plasma: plasmaData?.length || 0,
          platelet: plateletData?.length || 0
        };
        setReleasedBloodCounts(releasedCounts);

        // Fetch unread notification count
        try {
          const notifCount = await window.electronAPI.getUnreadNotificationCount();
          setUnreadNotificationCount(notifCount || 0);
        } catch (notifError) {
          // Silently fail if notifications table doesn't exist yet
          setUnreadNotificationCount(0);
        }

        // Fetch expiring blood stocks (within 7 days)
        try {
          const expiringData = await window.electronAPI.getAllExpiringStocks(7);
          // Combine both blood stocks and non-conforming stocks, limit to top 5
          const allExpiring = [
            ...expiringData.bloodStocks.map(s => ({ ...s, source: 'Blood Stock' })),
            ...expiringData.nonConformingStocks.map(s => ({ ...s, source: 'Non-Conforming' }))
          ].sort((a, b) => a.days_until_expiry - b.days_until_expiry).slice(0, 5);

          setExpiringStocks(allExpiring);
        } catch (expiringError) {
          console.error('Error fetching expiring stocks:', expiringError);
          setExpiringStocks([]);
        }

        // Fetch blood donation analytics
        try {
          const analytics = await window.electronAPI.getBloodDonationAnalytics();
          setAnalyticsData(analytics);
        } catch (analyticsError) {
          console.error('Error fetching analytics:', analyticsError);
          setAnalyticsData([]);
        }

        // --- ADD THIS NEW BLOCK ---
        try {
          // Fetch ALL partnership requests
          const partnershipRequests = await window.electronAPI.getAllPartnershipRequests(null);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to the beginning of today

          // Filter for "Pending" events that are in the future (to match your calendar)
          const upcoming = partnershipRequests
            .filter(req => {
              const eventDate = new Date(req.event_date + 'T00:00:00');
              // This shows PENDING requests that are today or in the future
              return (req.status === 'approved' || req.status === 'confirmed' || req.status === 'pending') && eventDate >= today;
            })
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date)) // Sort by the soonest date
            .slice(0, 3); // Get the next 3 drives

          setUpcomingDrives(upcoming);
        } catch (driveError) {
          console.error('Error fetching upcoming drives:', driveError);
          setUpcomingDrives([]);
        }
        // --- END OF NEW BLOCK ---

      } catch (error) {
        console.error('Error fetching blood counts:', error);
      } finally {
        const elapsed = Date.now() - start;
        const remaining = 1000 - elapsed;
        if (remaining > 0) {
          await new Promise((res) => setTimeout(res, remaining));
        }
        setLoading(false);
      }
    };

    fetchBloodCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchBloodCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalStored = bloodCounts.redBloodCell + bloodCounts.platelet + bloodCounts.plasma;

  // Generate SVG chart path for analytics
  const generateChartPath = () => {
    if (!analyticsData || analyticsData.length === 0) {
      return { path: '', area: '', points: [] };
    }

    const maxDonations = Math.max(...analyticsData.map(d => d.totalDonations), 1);
    const chartWidth = 300;
    const chartHeight = 150;
    const padding = { left: 30, right: 20, top: 20, bottom: 30 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    const points = analyticsData.map((data, index) => {
      const x = padding.left + (index / (analyticsData.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (data.totalDonations / maxDonations) * graphHeight;
      return { x, y, count: data.totalDonations };
    });

    // Create path string
    const pathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Create area path (filled area under the line)
    const areaString = `M ${points[0].x} ${padding.top + graphHeight} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${padding.top + graphHeight} Z`;

    return { path: pathString, area: areaString, points, maxDonations };
  };

  // --- ADD THIS ENTIRE FUNCTION ---
  const getEventDisplay = (status, dateString) => {
    const eventDate = new Date(dateString + 'T00:00:00'); 
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for finished events (must be in the past AND approved/scheduled)
    if (eventDate < today && (status === 'confirmed' || status === 'approved' || status === 'scheduled')) {
      return { text: 'Finished', className: 'finished' };
    }
    
    // Check for upcoming/pending
    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'scheduled':
        return { text: 'Upcoming', className: 'upcoming' };
      case 'pending':
        return { text: 'Pending', className: 'pending' }; // <-- This is what we want to show
      case 'declined':
      case 'cancelled':
        return { text: 'Declined', className: 'declined' };
      default:
        return { text: status, className: 'default' };
    }
  };
  // --- END OF NEW FUNCTION ---

  // --- ADD THIS FUNCTION ---
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes || '00'} ${ampm}`;
  };
  // --- END OF NEW FUNCTION ---

  const chartData = generateChartPath();

  // Handle tooltip hover events
  const handlePointHover = (event, index) => {
    const svgRect = event.currentTarget.closest('svg').getBoundingClientRect();
    const point = chartData.points[index];

    setHoveredPoint(index);
    setTooltipPosition({
      x: point.x,
      y: point.y
    });
  };

  const handlePointLeave = () => {
    setHoveredPoint(null);
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-wrapper">
          <Loader />
        </div>
        <style jsx>{`
          .loading-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            gap: 0.5rem;
          }
          .loading-text {
            color: #6b7280;
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  const styles = {
    dashboardContent: {
      animation: "fadeIn 0.5s ease-out",
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
      padding: "1rem",
    },
    mainStatsSection: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: "1.5rem",
      marginBottom: "2rem",
    },
    mainStatsCard: {
      backgroundColor: "white",
      borderRadius: "1rem",
      padding: "2rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
    },
    bloodDropIcon: {
      fontSize: "2rem",
      marginBottom: "0.5rem",
    },
    mainStatsNumber: {
      fontSize: "4rem",
      fontWeight: "bold",
      color: "#dc2626",
      lineHeight: 1,
    },
    mainStatsTitle: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#111827",
      marginBottom: "0.5rem",
    },
    mainStatsSubtitle: {
      fontSize: "0.875rem",
      color: "#6b7280",
    },
    bloodTypeGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "1rem",
    },
    bloodTypeCard: {
      backgroundColor: "white",
      borderRadius: "0.75rem",
      padding: "1rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.25rem",
    },
    bloodTypeIcon: {
      fontSize: "1.25rem",
      color: "#dc2626",
    },
    bloodTypeCount: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#dc2626",
    },
    bloodTypeLabel: {
      fontSize: "0.75rem",
      fontWeight: 500,
      color: "#111827",
      lineHeight: 1.2,
    },
    bloodTypeDate: {
      fontSize: "0.625rem",
      color: "#6b7280",
    },
    dashboardGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 2fr",
      gridTemplateRows: "auto auto",
      gap: "1.5rem",
    },
    dashboardCard: {
      backgroundColor: "white",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    analyticsCard: {
      gridRow: "span 2",
    },
    cardTitle: {
      fontSize: "1.125rem",
      fontWeight: 600,
      color: "#111827",
      margin: "0 0 0.25rem 0",
    },
    cardSubtitle: {
      fontSize: "0.875rem",
      color: "#6b7280",
      margin: "0 0 1.5rem 0",
    },
    expirationSection: {
      marginTop: "1rem",
    },
    expirationTitle: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: "#dc2626",
      margin: "0 0 1rem 0",
    },
    expirationTable: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    tableHeader: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
      gap: "0.5rem",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#6b7280",
      paddingBottom: "0.5rem",
      borderBottom: "1px solid #e5e7eb",
    },
    tableRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
      gap: "0.5rem",
      fontSize: "0.75rem",
      color: "#111827",
      padding: "0.5rem 0",
      alignItems: "center",
    },
    statusBadge: {
      padding: "0.25rem 0.5rem",
      borderRadius: "0.25rem",
      fontSize: "0.625rem",
      fontWeight: 600,
      textAlign: "center",
    },
    statusAlert: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    statusUrgent: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
    componentsList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    componentItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 0",
      borderBottom: "1px solid #f3f4f6",
    },
    componentLabel: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#111827",
    },
    componentCount: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#dc2626",
    },
    chartContainer: {
      width: "100%",
      height: "200px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    analyticsChart: {
      width: "100%",
      height: "100%",
    },
    releasedStats: {
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      gap: "1rem",
    },
    releasedItem: {
      textAlign: "center",
      flex: 1,
    },
    releasedLabel: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#6b7280",
      marginBottom: "0.5rem",
    },
    releasedCount: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#dc2626",
    },
    upcomingDrives: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      maxHeight: "150px", // <-- Set a max height
      overflowY: "auto", // <-- Add a scrollbar when needed
    },
    driveItem: {
      padding: "0.75rem",
      backgroundColor: "#f9fafb",
      borderRadius: "0.5rem",
      borderLeft: "4px solid #10b981",
    },
    driveText: {
      fontSize: "0.875rem",
      color: "#111827",
    },
    seeMore: {
      textAlign: "center",
      marginTop: "0.5rem",
    },
    seeMoreBtn: {
      backgroundColor: "transparent",
      border: "none",
      color: "#059669",
      fontSize: "0.875rem",
      cursor: "pointer",
      padding: "0.5rem",
      borderRadius: "0.25rem",
      transition: "background-color 0.2s",
    },
  };

  return (
    <div style={styles.dashboardContent}>
      {/* Main Stats Section */}
      <div style={styles.mainStatsSection}>
        {/* Total Stored Blood - Large Card */}
        <div style={styles.mainStatsCard}>
          <div style={styles.bloodDropIcon}>🩸</div>
          <div style={styles.mainStatsNumber}>{loading ? '...' : totalStored}</div>
          <div style={styles.mainStatsTitle}>Total Stored Blood</div>
          <div style={styles.mainStatsSubtitle}>Updated - {new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</div>
        </div>

        {/* Blood Type Grid */}
        <div style={styles.bloodTypeGrid}>
          {[
            { type: "AB+", displayType: "AB +" },
            { type: "A+", displayType: "A +" },
            { type: "B+", displayType: "B +" },
            { type: "O+", displayType: "O +" },
            { type: "AB-", displayType: "AB -" },
            { type: "A-", displayType: "A -" },
            { type: "B-", displayType: "B -" },
            { type: "O-", displayType: "O -" },
          ].map((bloodType, index) => (
            <div key={index} style={styles.bloodTypeCard}>
              <div style={styles.bloodTypeIcon}>🩸</div>
              <div style={styles.bloodTypeCount}>{loading ? '...' : bloodTypeCounts[bloodType.type]}</div>
              <div style={styles.bloodTypeLabel}>Total Stored {bloodType.displayType}</div>
              <div style={styles.bloodTypeDate}>{new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Grid Section */}
      <div style={styles.dashboardGrid}>
        {/* Blood Expiration Report */}
        <div style={styles.dashboardCard}>
          <h3 style={styles.cardTitle}>Blood Expiration Report</h3>
          <p style={styles.cardSubtitle}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <div style={styles.expirationSection}>
            <h4 style={styles.expirationTitle}>Expiring Soon (Within 7 Days)</h4>
            <div style={styles.expirationTable}>
              <div style={styles.tableHeader}>
                <span>Blood Type</span>
                <span>Component</span>
                <span>Volume</span>
                <span>Expiration Date</span>
                <span>Status</span>
              </div>
              {loading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                  Loading expiration data...
                </div>
              ) : expiringStocks.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#10b981', fontWeight: 500 }}>
                  ✓ No stocks expiring within the next 7 days
                </div>
              ) : (
                expiringStocks.map((item, index) => (
                  <div key={index} style={styles.tableRow}>
                    <span>{item.blood_type}{item.rh_factor}</span>
                    <span>{item.component}</span>
                    <span>{item.units} mL</span>
                    <span>{new Date(item.expiration_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                    <span style={{...styles.statusBadge, ...(item.alert_status === "Urgent" ? styles.statusUrgent : styles.statusAlert)}}>
                      {item.alert_status} ({item.days_until_expiry}d)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Components Available */}
        <div style={styles.dashboardCard}>
          <h3 style={styles.cardTitle}>Components Available</h3>
          <p style={styles.cardSubtitle}>{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
          <div style={styles.componentsList}>
            <div style={styles.componentItem}>
              <span style={styles.componentLabel}>RED BLOOD CELL</span>
              <span style={styles.componentCount}>{loading ? '...' : bloodCounts.redBloodCell}</span>
            </div>
            <div style={styles.componentItem}>
              <span style={styles.componentLabel}>PLASMA</span>
              <span style={styles.componentCount}>{loading ? '...' : bloodCounts.plasma}</span>
            </div>
            <div style={styles.componentItem}>
              <span style={styles.componentLabel}>PLATELET</span>
              <span style={styles.componentCount}>{loading ? '...' : bloodCounts.platelet}</span>
            </div>
          </div>
        </div>

        {/* Blood Donation Analytics */}
        <div style={{...styles.dashboardCard, ...styles.analyticsCard}}>
          <h3 style={styles.cardTitle}>Blood Donation Analytics</h3>
          <p style={styles.cardSubtitle}>Monthly participation as of {new Date().getFullYear()}</p>
          <div style={{...styles.chartContainer, position: 'relative'}}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                Loading analytics...
              </div>
            ) : analyticsData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No analytics data available
              </div>
            ) : (
              <svg style={styles.analyticsChart} viewBox="0 0 300 150">
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                {/* Area under the line */}
                <path
                  d={chartData.area}
                  fill="url(#areaGradient)"
                />
                {/* Line path */}
                <path
                  d={chartData.path}
                  stroke="#10b981"
                  strokeWidth="3"
                  fill="none"
                />
                {/* Data points */}
                {chartData.points.map((point, index) => (
                  <g key={index}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => handlePointHover(e, index)}
                      onMouseLeave={handlePointLeave}
                    />
                  </g>
                ))}
                {/* Month labels */}
                {analyticsData.map((data, index) => {
                  const x = 30 + (index / (analyticsData.length - 1)) * 250;
                  return (
                    <text key={index} x={x} y="145" fontSize="11" fill="#6b7280" textAnchor="middle">
                      {data.monthName.split(' ')[0]}
                    </text>
                  );
                })}
                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = 120 - (ratio * 80);
                  const value = Math.round(chartData.maxDonations * ratio);
                  return (
                    <text key={index} x="10" y={y + 5} fontSize="10" fill="#6b7280">
                      {value}
                    </text>
                  );
                })}
              </svg>
            )}
            {/* Custom Tooltip Modal */}
            {hoveredPoint !== null && analyticsData[hoveredPoint] && (
              <div
                style={{
                  position: 'absolute',
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y - 60}px`,
                  transform: 'translateX(-50%)',
                  backgroundColor: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  animation: 'tooltipFadeIn 0.2s ease-out',
                  minWidth: '120px',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#000000',
                  marginBottom: '0.25rem',
                  fontFamily: 'Barlow'
                }}>
                  {analyticsData[hoveredPoint].monthName}
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#165C3C',
                  fontFamily: 'Barlow'
                }}>
                  {chartData.points[hoveredPoint].count}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Blood Released */}
        <div style={styles.dashboardCard}>
          <h3 style={styles.cardTitle}>Blood Released</h3>
          <p style={styles.cardSubtitle}>Month of {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
          <div style={styles.releasedStats}>
            <div style={styles.releasedItem}>
              <span style={styles.releasedLabel}>RBC</span>
              <span style={styles.releasedCount}>{loading ? '...' : releasedBloodCounts.redBloodCell}</span>
            </div>
            <div style={styles.releasedItem}>
              <span style={styles.releasedLabel}>Plasma</span>
              <span style={styles.releasedCount}>{loading ? '...' : releasedBloodCounts.plasma}</span>
            </div>
            <div style={styles.releasedItem}>
              <span style={styles.releasedLabel}>Platelet</span>
              <span style={styles.releasedCount}>{loading ? '...' : releasedBloodCounts.platelet}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Drive */}
        <div style={styles.dashboardCard}>
          <h3 style={styles.cardTitle}>Upcoming Drive</h3>
          <p style={styles.cardSubtitle}>Next 3 scheduled events</p>
          <div style={styles.upcomingDrives}>
            
            {/* --- REPLACLED BLOCK --- */}
            {loading ? (
              <div style={{ ...styles.driveText, color: '#6b7280' }}>Loading events...</div>
            ) : upcomingDrives.length === 0 ? (
              <div style={{ ...styles.driveText, color: '#6b7280', textAlign: 'center' }}>
                No upcoming drives scheduled.
              </div>
            ) : (
              upcomingDrives.map(event => {
                const eventDisplay = getEventDisplay(event.status, event.event_date);
                const eventDate = new Date(event.event_date + 'T00:00:00');
                
                return (
                  <div
                    key={event.id}
                    className="event-card"
                    style={{ borderLeftColor: getEventStatusColor(event.status, event.event_date) }}
                  >
                    <div className="event-card-header">
                      <h4 className="event-title">{event.organization_name}</h4>
                      <span className={`event-status status-${eventDisplay.className}`}>
                        {eventDisplay.text}
                      </span>
                    </div>

                    <div className="event-details">
                      <div className="event-detail">
                        <Calendar size={14} />
                        <span>{eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="event-detail">
                        <Clock size={14} />
                        <span>{formatTime(event.event_time)}</span>
                      </div>
                      <div className="event-detail">
                        <MapPin size={14} />
                        <span>{event.event_address || event.organization_barangay}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {/* --- END OF REPLACED BLOCK --- */}

          </div>
          <div style={styles.seeMore}>
            {/* This button now navigates to the calendar */}
            <button 
              style={styles.seeMoreBtn} 
              onClick={() => onNavigate('calendar')}
            >
              See more ⌄
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* --- ADD THIS NEW CSS --- */
        .event-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          border-left-width: 4px;
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
          background-color: #dbeafe; /* Blue */
          color: #1e40af;
        }

        .status-finished {
          background-color: #dcfce7; /* Green */
          color: #166534;
        }
        
        .status-pending {
          background-color: #fef3c7; /* Yellow/Orange */
          color: #92400e;
        }

        .status-declined {
          background-color: #fee2e2; /* Red */
          color: #991b1b;
        }
        
        .status-default {
          background-color: #f3f4f6; /* Gray */
          color: #4b5563;
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
        /* --- END OF NEW CSS --- */

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 1024px) {
          .main-stats-section {
            grid-template-columns: 1fr !important;
          }
          
          .blood-type-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .blood-type-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const ScreenWrapper = ({ title, children }) => {
  const styles = {
    screenWrapper: {
      animation: "fadeIn 0.5s ease-out",
    },
    screenContent: {
      backgroundColor: "white",
      padding: "1.5rem",
      borderRadius: "0.5rem",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
  };

  return (
    <div style={styles.screenWrapper}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <div style={styles.screenContent}>{children}</div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const LogoutDialog = ({ isOpen, onConfirm, onCancel }) => {
  const styles = {
    dialogOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      animation: "fadeIn 0.2s ease-out",
    },
    dialogContent: {
      backgroundColor: "white",
      padding: "2rem",
      borderRadius: "0.5rem",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      maxWidth: "400px",
      width: "90%",
      textAlign: "center",
      animation: "slideIn 0.3s ease-out",
    },
    dialogTitle: {
      fontSize: "1.125rem",
      fontWeight: 600,
      color: "#111827",
      margin: "0 0 0.75rem 0",
    },
    dialogMessage: {
      color: "#6b7280",
      margin: "0 0 1.5rem 0",
      fontSize: "0.875rem",
    },
    dialogActions: {
      display: "flex",
      gap: "0.75rem",
      justifyContent: "center",
    },
    dialogButton: {
      padding: "0.5rem 1.5rem",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s",
      border: "1px solid",
    },
    cancelButton: {
      backgroundColor: "white",
      color: "#6b7280",
      borderColor: "#d1d5db",
    },
    confirmButton: {
      backgroundColor: "#ef4444",
      color: "white",
      borderColor: "#ef4444",
    },
  };

  if (!isOpen) return null;

  return (
    <div style={styles.dialogOverlay}>
      <div style={styles.dialogContent}>
        <h3 style={styles.dialogTitle}>Confirm Logout</h3>
        <p style={styles.dialogMessage}>Are you sure you want to logout?</p>
        <div style={styles.dialogActions}>
          <button style={{...styles.dialogButton, ...styles.cancelButton}} onClick={onCancel}>
            Cancel
          </button>
          <button style={{...styles.dialogButton, ...styles.confirmButton}} onClick={onConfirm}>
            Yes, Logout
          </button>
        </div>
      </div>
      
      <style>{`
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
      `}</style>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [isMailDropdownOpen, setIsMailDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Enhanced dropdown states
  const [notifications, setNotifications] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeNotificationMenu, setActiveNotificationMenu] = useState(null);
  const [mailMessages, setMailMessages] = useState([]);
  const [isLoadingMail, setIsLoadingMail] = useState(false);
  const [calendarAppointments, setCalendarAppointments] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        // If user data is corrupted, redirect to login
        navigate('/login');
      }
    } else {
      // No user data found, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Listen for profile updates to refresh the user photo
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        try {
          setCurrentUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    // Listen for storage events (from other tabs) and custom profile update events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getUnreadNotificationCount) {
          const count = await window.electronAPI.getUnreadNotificationCount();
          setUnreadNotificationCount(count || 0);
        }
      } catch (error) {
        // Silently fail if notifications table doesn't exist yet
        // This prevents spamming errors during initial setup
        setUnreadNotificationCount(0);
      }
    };

    fetchNotificationCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const styles = {
    dashboardContainer: {
      minHeight: "100vh",
      backgroundColor: "#edf4e6",
      position: "relative",
      overflowX: "hidden",
    },
    mainContentWrapper: {
      position: "relative",
      minHeight: "100vh",
      transition: "margin-left 0.3s ease-in-out",
    },
    navBar: {
      backgroundColor: "white",
      borderBottom: "1px solid #e5e7eb",
      padding: "0.75rem 1rem",
      position: "sticky",
      top: 0,
      zIndex: 30,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    navContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    navLeft: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    navRight: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    dropdownContainer: {
      position: "relative",
    },
    navButton: {
      padding: "0.5rem",
      borderRadius: "0.5rem",
      transition: "background-color 0.2s",
      border: "none",
      backgroundColor: "transparent",
      cursor: "pointer",
      position: "relative",
    },
    navButtonActive: {
      backgroundColor: "#059669",
      color: 'white'
    },
    notificationBadge: {
      position: "absolute",
      top: "2px",
      right: "2px",
      backgroundColor: "#ef4444",
      color: "white",
      fontSize: "0.625rem",
      fontWeight: "bold",
      borderRadius: "50%",
      width: "16px",
      height: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    },
    dropdownMenu: {
      position: "absolute",
      right: 0,
      top: "100%",
      marginTop: "0.5rem",
      backgroundColor: "white",
      borderRadius: "0.5rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      border: "1px solid #e5e7eb",
      zIndex: 50,
      overflow: "hidden",
    },
    requestsDropdown: {
      width: "320px",
    },
    messagesDropdown: {
      width: "320px",
    },
    notificationsDropdown: {
      width: "300px",
    },
    profileDropdown: {
      width: "160px",
    },
    dropdownHeader: {
      backgroundColor: "#059669",
      padding: "0.75rem 1rem",
      color: "white",
    },
    dropdownTitle: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      color: "white",
      margin: 0,
    },
    dropdownContent: {
      maxHeight: "300px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "0.875rem 1rem",
      borderBottom: "1px solid #f3f4f6",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    iconCircle: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
    },
    redBg: {
      backgroundColor: "#ef4444",
      color: "white",
    },
    yellowBg: {
      backgroundColor: "#eab308",
      color: "white",
    },
    blueBg: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    greenBg: {
      backgroundColor: "#10b981",
      color: "white",
    },
    orangeBg: {
      backgroundColor: "#f97316",
      color: "white",
    },
    iconText: {
      fontSize: "0.875rem",
    },
    requestDetails: {
      flex: 1,
      minWidth: 0,
    },
    requestTitle: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#111827",
      margin: "0 0 0.25rem 0",
      lineHeight: 1.25,
    },
    requestSubtitle: {
      fontSize: "0.75rem",
      color: "#6b7280",
      margin: 0,
      lineHeight: 1.33,
    },
    messageAvatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      fontSize: "0.75rem",
      color: "white",
      flexShrink: 0,
    },
    blueAvatar: {
      backgroundColor: "#3b82f6",
    },
    greenAvatar: {
      backgroundColor: "#10b981",
    },
    purpleAvatar: {
      backgroundColor: "#8b5cf6",
    },
    dropdownFooter: {
      padding: "0.75rem 1rem",
      borderTop: "1px solid #f3f4f6",
      backgroundColor: "#f9fafb",
      textAlign: "center",
    },
    footerButton: {
      backgroundColor: "transparent",
      border: "none",
      color: "#059669",
      fontSize: "0.875rem",
      fontWeight: 500,
      cursor: "pointer",
      padding: "0.5rem",
      borderRadius: "0.25rem",
      transition: "background-color 0.2s",
      width: "100%",
    },
    profileMenuItem: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "0.75rem 1rem",
      fontSize: "0.875rem",
      color: "#374151",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.2s",
      borderBottom: "1px solid #f3f4f6",
    },
    userSection: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      paddingLeft: "0.75rem",
      borderLeft: "1.4px solid #e5e7eb",
      position: "relative",
    },
    userName: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#374151",
      fontFamily: "Barlow",
    },
    userAvatar: {
      width: "2rem",
      height: "2rem",
      backgroundColor: "#d1d5db",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s",
      cursor: "pointer",
    },
    userAvatarActive: {
      backgroundColor: "#059669",
      color: "white"
    },
    mainContent: {
      padding: "1.5rem",
    },
  };

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const handleNavigate = (screen) => {
    setActiveScreen(screen);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const toggleCalendarDropdown = () => {
    setIsCalendarDropdownOpen(!isCalendarDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleMailDropdown = () => {
    setIsMailDropdownOpen(!isMailDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsCalendarDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
    setIsProfileDropdownOpen(false);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsCalendarDropdownOpen(false);
    setIsMailDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const handleProfileAction = (action) => {
    if (action === "edit-profile") {
      setActiveScreen("profile");
    } else if (action === "logout") {
      setShowLogoutDialog(true);
    }
    setIsProfileDropdownOpen(false);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    // Clear user session data from localStorage
    localStorage.removeItem('currentUser');
    console.log("Logging out...");
    navigate("/login");
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  // Helper functions for enhanced dropdowns
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'declined': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'warning': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={14} />;
      case 'declined': return <XCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'info': return <Bell size={14} />;
      case 'warning': return <Bell size={14} />;
      default: return <Bell size={14} />;
    }
  };

  // Get the main notification icon for dropdown
  const getNotificationMainIcon = (notification) => {
    const type = notification.type;

    // Stock expiration notifications
    if (type === 'expiration_warning' || type === 'stock_expiring_soon' || type === 'stock_expiring_urgent') {
      return <img src="/assets/urgent-blood.png" alt="Blood Alert" style={{ width: '20px', height: '20px' }} />;
    }

    // Blood operation confirmations
    if (type === 'blood_release' || type === 'blood_adding' || type === 'blood_restoring' ||
        type === 'blood_discarding' || type === 'nonconforming_adding') {
      return <img src="/assets/release-done.png" alt="Confirmation" style={{ width: '20px', height: '20px' }} />;
    }

    // Stock update notifications
    if (type === 'blood_stock_update' || type === 'nonconforming_update' || type === 'released_update') {
      return <img src="/assets/blood-update.png" alt="Stock Update" style={{ width: '20px', height: '20px' }} />;
    }

    // Default to status icon for other notifications
    return getStatusIcon(notification.status);
  };

  // Get notification icon background style
  const getNotificationIconStyle = (notification) => {
    const type = notification.type;

    // White background for new notification types
    if (type === 'expiration_warning' || type === 'stock_expiring_soon' || type === 'stock_expiring_urgent' ||
        type === 'blood_release' || type === 'blood_adding' || type === 'blood_restoring' ||
        type === 'blood_discarding' || type === 'nonconforming_adding' ||
        type === 'blood_stock_update' || type === 'nonconforming_update' || type === 'released_update') {
      const statusColor = getStatusColor(notification.status);
      return {
        backgroundColor: '#FFFFFF',
        border: `1px solid ${statusColor}30`
      };
    }

    // Default colored background for other notifications
    const statusColor = getStatusColor(notification.status);
    return {
      backgroundColor: `${statusColor}15`,
      border: `1px solid ${statusColor}30`
    };
  };

  const getMailStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'declined': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const handleRefreshNotifications = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const toggleNotificationReadStatus = (notificationId) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: !notification.read }
          : notification
      )
    );
    setActiveNotificationMenu(null);
  };

  const markAllAsRead = async () => {
    try {
      // Get all unread notification IDs
      const unreadNotifications = notifications.filter(n => !n.read);

      if (typeof window !== 'undefined' && window.electronAPI && unreadNotifications.length > 0) {
        // Mark each notification as read in the database
        await Promise.all(
          unreadNotifications.map(notification =>
            window.electronAPI.updateNotificationStatus(notification.id, 'read')
          )
        );
      }

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );

      // Reload notifications to ensure consistency
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAllMailAsRead = async () => {
    try {
      // Update local state - mark all mail as read
      setMailMessages(prevMails =>
        prevMails.map(mail => ({ ...mail, read: true }))
      );
    } catch (error) {
      console.error('Error marking all mail as read:', error);
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const notificationsData = await window.electronAPI.getAllNotifications();

        const transformedNotifications = notificationsData.map(n => ({
          id: n.id,
          type: n.notification_type || n.type || 'info',
          title: n.title || 'Notification',
          message: n.message,
          description: n.description,
          status: n.status || 'unread',
          timestamp: new Date(n.created_at),
          read: n.is_read === true || n.is_read === 1 || n.read === true,
          requestor: n.requestor || 'System'
        }));

        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  const getLatestNotifications = () => {
    return notifications
      .sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        return b.timestamp - a.timestamp;
      })
      .slice(0, 5);
  };

  // Load notifications from database
  useEffect(() => {
    loadNotifications();
    const notifInterval = setInterval(loadNotifications, 30000);
    return () => clearInterval(notifInterval);
  }, [loadNotifications]);

  // Load mail messages
  useEffect(() => {
    loadMailMessages();
    const mailInterval = setInterval(loadMailMessages, 30000);
    return () => clearInterval(mailInterval);
  }, []);

  const loadMailMessages = async () => {
    try {
      setIsLoadingMail(true);

      if (typeof window !== 'undefined' && window.electronAPI) {
        // Load partnership requests from RBC database
        const requests = await window.electronAPI.getAllPartnershipRequests();

        // Show the 5 most recent requests (all statuses) in the dropdown
        const mailsFromRequests = requests
          .slice(0, 5)
          .map(r => {
            const avatar = r.organization_name ? r.organization_name.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase() : 'UN';
            const avatarColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
            const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

            return {
              id: r.id,
              from: `${r.organization_name} (${r.organization_barangay})`,
              subject: `Blood Drive Partnership Request`,
              preview: `${r.organization_name} has requested a blood drive partnership for ${new Date(r.event_date).toLocaleDateString()}.`,
              avatar: avatar,
              avatarColor: avatarColor,
              read: r.status !== 'pending',
              status: r.status || 'pending'
            };
          });

        setMailMessages(mailsFromRequests);
      }
    } catch (error) {
      console.error('Error loading mail messages:', error);
    } finally {
      setIsLoadingMail(false);
    }
  };

  // Load calendar appointments
  useEffect(() => {
    loadCalendarAppointments();
    const calendarInterval = setInterval(loadCalendarAppointments, 30000);
    return () => clearInterval(calendarInterval);
  }, []);

  const loadCalendarAppointments = async () => {
    try {
      setIsLoadingCalendar(true);

      if (typeof window !== 'undefined' && window.electronAPI) {
        const appointmentsData = await window.electronAPI.getAllAppointments();

        const upcomingAppts = appointmentsData
          .filter(apt => apt.status === 'approved' || apt.status === 'confirmed')
          .slice(0, 4)
          .map(apt => ({
            id: apt.id || apt.appointment_id,
            title: apt.title || `Blood Drive Partnership - ${apt.contactInfo?.lastName || 'Unknown'}`,
            subtitle: apt.notes || `${apt.contactInfo?.address || 'Location TBD'}`,
            date: apt.date,
            time: apt.time,
            type: apt.contactInfo?.type || 'organization'
          }));

        setCalendarAppointments(upcomingAppts);
      }
    } catch (error) {
      console.error('Error loading calendar appointments:', error);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const getAppointmentIcon = (type) => {
    return type === 'sync' ? 'S' : '🩸';
  };

  const getAppointmentIconColor = (index) => {
    const colors = ['red-bg', 'yellow-bg', 'blue-bg', 'green-bg', 'orange-bg'];
    return colors[index % colors.length];
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "mail":
        return <MailComponent />;
      case "calendar":
        return <CalendarComponent />;
      case "notification":
        return <NotificationComponent />;
      case "profile":
        return <ProfileComponent />;
      case "red-blood-cell":
        return <RedBloodCell />;
      case "plasma":
        return <Plasma />;
      case "platelet":
        return <Platelet />;
      case "released-blood":
        return <ReleasedBlood />;
      case "red-blood-cell-nc":
        return <RedBloodCellNC />;
      case "plasma-nc":
        return <PlasmaNC />;
      case "platelet-nc":
        return <PlateletNC />;
      case "donor-record":
        return <DonorRecord />;
      case "invoice":
        return <Invoice />;
      case "reports":
        return <Reports />;
      case "recent-activity":
        return <RecentActivity />;
      default:
        return <DashboardContent onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <SidePanel
        isOpen={isSidePanelOpen}
        onToggle={toggleSidePanel}
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
      />

      <div
        style={{
          ...styles.mainContentWrapper,
          marginLeft: isSidePanelOpen ? "15rem" : "4rem",
        }}
      >
        <nav style={styles.navBar}>
          <div style={styles.navContent}>
            <div style={styles.navLeft}></div>

            <div style={styles.navRight}>
              {/* Calendar Button with Dropdown */}
              <div style={styles.dropdownContainer}>
                <button
                  style={{
                    ...styles.navButton,
                    ...(activeScreen === "calendar" ? styles.navButtonActive : {}),
                  }}
                  onClick={toggleCalendarDropdown}
                >
                  <Calendar className="w-5 h-5 text-gray-600" />
                </button>
                {isCalendarDropdownOpen && (
                  <div className="dropdown-menu requests-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">UPCOMING EVENTS</h3>
                        <button
                          className={`refresh-button ${isLoadingCalendar ? 'refreshing' : ''}`}
                          onClick={loadCalendarAppointments}
                          disabled={isLoadingCalendar}
                          title="Refresh appointments"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {isLoadingCalendar ? (
                        <div className="dropdown-item">
                          <div className="loading-mail-content">
                            <RefreshCw size={16} className="loading-icon" />
                            <span className="loading-text">Loading appointments...</span>
                          </div>
                        </div>
                      ) : calendarAppointments.length === 0 ? (
                        <div className="dropdown-item">
                          <div className="empty-mail-content">
                            <Calendar size={20} color="#d1d5db" />
                            <span className="empty-text">No upcoming events</span>
                          </div>
                        </div>
                      ) : (
                        calendarAppointments.map((appointment, index) => (
                          <div
                            key={appointment.id}
                            className="dropdown-item"
                            onClick={() => handleNavigate("calendar")}
                          >
                            <div className="request-icon">
                              <div className={`icon-circle ${getAppointmentIconColor(index)}`}>
                                <span className="icon-text">{getAppointmentIcon(appointment.type)}</span>
                              </div>
                            </div>
                            <div className="request-details">
                              <p className="request-title">{appointment.title}</p>
                              <p className="request-subtitle">{appointment.subtitle}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("calendar")}>
                        See All Events
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mail Button with Dropdown */}
              <div style={styles.dropdownContainer}>
                <button
                  style={{
                    ...styles.navButton,
                    ...(activeScreen === "mail" ? styles.navButtonActive : {}),
                  }}
                  onClick={toggleMailDropdown}
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  {mailMessages.filter(m => !m.read).length > 0 && (
                    <span className="notification-badge">{mailMessages.filter(m => !m.read).length}</span>
                  )}
                </button>
                {isMailDropdownOpen && (
                  <div className="dropdown-menu messages-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">MESSAGES</h3>
                        <div className="notification-header-actions">
                          <button
                            className={`refresh-button ${isLoadingMail ? 'refreshing' : ''}`}
                            onClick={loadMailMessages}
                            disabled={isLoadingMail}
                            title="Refresh messages"
                          >
                            <RefreshCw size={14} />
                          </button>
                          {mailMessages.filter(m => !m.read).length > 0 && (
                            <button
                              className="mark-all-read-button"
                              onClick={markAllMailAsRead}
                              title="Mark all as read"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {isLoadingMail ? (
                        <div className="dropdown-item">
                          <div className="loading-mail-content">
                            <RefreshCw size={16} className="loading-icon" />
                            <span className="loading-text">Loading messages...</span>
                          </div>
                        </div>
                      ) : mailMessages.length === 0 ? (
                        <div className="dropdown-item">
                          <div className="empty-mail-content">
                            <Mail size={20} color="#d1d5db" />
                            <span className="empty-text">No messages</span>
                          </div>
                        </div>
                      ) : (
                        mailMessages.map((mail) => (
                          <div
                            key={mail.id}
                            className={`dropdown-item ${!mail.read ? 'unread-mail' : ''}`}
                            onClick={() => handleNavigate("mail")}
                          >
                            <div
                              className="message-avatar"
                              style={{ backgroundColor: mail.avatarColor }}
                            >
                              {mail.avatar}
                            </div>
                            <div className="message-details">
                              <div className="message-header-row">
                                <p className="message-sender">{mail.from}</p>
                                <div
                                  className="mail-status-dot"
                                  style={{ backgroundColor: getMailStatusColor(mail.status) }}
                                  title={mail.status.toUpperCase()}
                                ></div>
                              </div>
                              <p className="message-subject">{mail.subject}</p>
                              <p className="message-preview">{mail.preview}</p>
                            </div>
                            {!mail.read && <div className="unread-dot-dropdown"></div>}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("mail")}>
                        View All Messages
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Button with Dropdown */}
              <div style={styles.dropdownContainer}>
                <button
                  style={{
                    ...styles.navButton,
                    ...(activeScreen === "notification" ? styles.navButtonActive : {}),
                  }}
                  onClick={toggleNotificationDropdown}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                {isNotificationDropdownOpen && (
                  <div className="dropdown-menu notifications-dropdown">
                    <div className="dropdown-header">
                      <div className="notification-header-content">
                        <h3 className="dropdown-title">NOTIFICATIONS</h3>
                        <div className="notification-header-actions">
                          <button
                            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
                            onClick={handleRefreshNotifications}
                            disabled={isRefreshing}
                            title="Refresh notifications"
                          >
                            <RefreshCw size={14} />
                          </button>
                          {unreadCount > 0 && (
                            <button
                              className="mark-all-read-button"
                              onClick={markAllAsRead}
                              title="Mark all as read"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-content">
                      {getLatestNotifications().map((notification) => (
                        <div key={notification.id} className={`dropdown-item notification-item ${!notification.read ? 'unread-notification' : ''}`}>
                          <div
                            className="notification-icon"
                            style={{ color: getStatusColor(notification.status) }}
                          >
                            <div className="icon-circle" style={getNotificationIconStyle(notification)}>
                              {getNotificationMainIcon(notification)}
                            </div>
                          </div>
                          <div className="notification-details">
                            <div className="notification-header-row">
                              <p className="notification-title">{notification.title}</p>
                              <div className="notification-actions">
                                <span className="notification-time">{getTimeAgo(notification.timestamp)}</span>
                                <div className="notification-menu-container">
                                  <button
                                    className="notification-menu-button"
                                    onClick={() => setActiveNotificationMenu(activeNotificationMenu === notification.id ? null : notification.id)}
                                  >
                                    <MoreVertical size={12} />
                                  </button>
                                  {activeNotificationMenu === notification.id && (
                                    <div className="notification-menu">
                                      <button
                                        className="notification-menu-item"
                                        onClick={() => toggleNotificationReadStatus(notification.id)}
                                      >
                                        Mark as {notification.read ? 'Unread' : 'Read'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="notification-subtitle">{notification.description && notification.description.length > 60 ? `${notification.description.substring(0, 60)}...` : notification.description || notification.message || 'No message content'}</p>
                            <span className="notification-requestor">From: {notification.requestor || 'System'}</span>
                          </div>
                          {!notification.read && <div className="unread-dot-dropdown"></div>}
                        </div>
                      ))}
                    </div>
                    <div className="dropdown-footer">
                      <button className="footer-button" onClick={() => handleNavigate("notification")}>
                        See All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Section with Dropdown */}
              <div style={styles.userSection}>
                <span style={styles.userName}>{currentUser?.fullName || 'Loading...'}</span>
                <div
                  style={{
                    ...styles.userAvatar,
                    ...(activeScreen === "profile" ? styles.userAvatarActive : {}),
                  }}
                  onClick={toggleProfileDropdown}
                >
                  {currentUser?.profilePhoto ? (
                    <img
                      src={currentUser.profilePhoto}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}

                  {isProfileDropdownOpen && (
                    <div style={{...styles.dropdownMenu, ...styles.profileDropdown}}>
                      <button
                        style={styles.profileMenuItem}
                        onClick={() => handleProfileAction("edit-profile")}
                      >
                        My Profile
                      </button>
                      <button
                        style={styles.profileMenuItem}
                        onClick={() => handleProfileAction("logout")}
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main style={styles.mainContent}>{renderActiveScreen()}</main>
      </div>

      <LogoutDialog 
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      <style>{`
        body {
          margin: 0;
        }

        .nav-button:hover {
          background-color: #f3f4f6;
        }

        .nav-button-active:hover {
          background-color: #047857 !important;
        }

        .nav-button-active .lucide {
          color: white !important;
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: bold;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-family: 'Barlow', sans-serif;
        }

        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 0.5rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          z-index: 50;
          overflow: hidden;
        }

        .requests-dropdown {
          width: 320px;
        }

        .messages-dropdown {
          width: 320px;
        }

        .notifications-dropdown {
          width: 350px;
          max-height: 500px;
        }

        .profile-dropdown {
          width: 160px;
        }

        .dropdown-header {
          background-color: #059669;
          padding: 0.75rem 1rem;
          color: white;
        }

        .dropdown-title {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: white;
          margin: 0;
          font-family: 'Barlow', sans-serif;
        }

        .dropdown-content {
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown-content::-webkit-scrollbar {
          width: 6px;
        }

        .dropdown-content::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .dropdown-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .dropdown-item {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }

        .dropdown-item:hover {
          background-color: #f9fafb;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .notification-dropdown-item {
          padding-right: 2rem;
        }

        .request-icon, .notification-dropdown-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid;
        }

        .icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .red-bg {
          background-color: #ef4444;
          color: white;
        }

        .yellow-bg {
          background-color: #eab308;
          color: white;
        }

        .blue-bg {
          background-color: #3b82f6;
          color: white;
        }

        .green-bg {
          background-color: #10b981;
          color: white;
        }

        .orange-bg {
          background-color: #f97316;
          color: white;
        }

        .icon-text {
          font-size: 0.875rem;
        }

        .request-details, .notification-dropdown-details {
          flex: 1;
          min-width: 0;
        }

        .request-title, .notification-dropdown-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.25rem 0;
          line-height: 1.25;
          font-family: 'Barlow', sans-serif;
        }

        .request-subtitle, .notification-dropdown-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
          font-family: 'Barlow', sans-serif;
        }

        .notification-dropdown-time {
          font-size: 0.6875rem;
          color: #9ca3af;
          margin: 0.25rem 0 0 0;
          font-family: 'Barlow', sans-serif;
        }

        .notification-unread-dot {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.75rem;
          color: white;
          flex-shrink: 0;
          font-family: 'Barlow', sans-serif;
        }

        .message-details {
          flex: 1;
          min-width: 0;
        }

        .message-sender {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.25rem 0;
          line-height: 1.25;
          font-family: 'Barlow', sans-serif;
        }

        .message-preview {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
          font-family: 'Barlow', sans-serif;
        }

        .dropdown-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid #f3f4f6;
          background-color: #f9fafb;
          text-align: center;
        }

        .footer-button {
          background: none;
          border: none;
          color: #059669;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
          width: 100%;
          font-family: 'Barlow', sans-serif;
        }

        .footer-button:hover {
          background-color: #e5e7eb;
        }

        .profile-menu-item:last-child {
          border-bottom: none;
        }

        .profile-menu-item:hover {
          background-color: #f3f4f6;
        }

        .user-avatar:hover {
          background-color: #9ca3af;
        }

        .user-avatar-active:hover {
          background-color: #047857 !important;
        }

        .user-avatar-active .lucide {
          color: white !important;
        }

        @media (max-width: 768px) {
          .main-content-wrapper {
            margin-left: 0 !important;
          }

          .dropdown-menu {
            right: auto;
            left: 0;
          }
        }

        /* Enhanced Dropdown Styles */
        .notification-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .notification-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .refresh-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .refresh-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .refresh-button.refreshing {
          animation: spin 1s linear infinite;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .mark-all-read-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.7rem;
          font-family: 'Barlow';
          font-weight: 500;
          transition: all 0.2s;
        }

        .mark-all-read-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .notification-item {
          position: relative;
        }

        .notification-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-details {
          flex: 1;
          min-width: 0;
        }

        .notification-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }

        .notification-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
          line-height: 1.25;
          font-family: 'Barlow';
          flex: 1;
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .notification-time {
          font-size: 0.6875rem;
          color: #9ca3af;
          font-family: 'Barlow';
          white-space: nowrap;
        }

        .notification-menu-container {
          position: relative;
        }

        .notification-menu-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 2px;
          border-radius: 2px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-menu-button:hover {
          color: #6b7280;
          background-color: #f3f4f6;
        }

        .notification-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 4px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          z-index: 100;
          min-width: 120px;
        }

        .notification-menu-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          font-size: 0.75rem;
          color: #374151;
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          font-family: 'Barlow';
          white-space: nowrap;
        }

        .notification-menu-item:hover {
          background-color: #f3f4f6;
        }

        .notification-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0 0 4px 0;
          line-height: 1.33;
          font-family: 'Barlow';
        }

        .notification-requestor {
          font-size: 0.6875rem;
          color: #9ca3af;
          font-family: 'Barlow';
        }

        .unread-notification {
          background-color: #f0fdf4;
        }

        .unread-dot-dropdown {
          position: absolute;
          top: 12px;
          right: 8px;
          width: 6px;
          height: 6px;
          background-color: #10b981;
          border-radius: 50%;
          z-index: 1;
        }

        /* Mail Dropdown Styles */
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.75rem;
          color: white;
          flex-shrink: 0;
          font-family: 'Barlow';
        }

        .message-details {
          flex: 1;
          min-width: 0;
        }

        .message-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .message-sender {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin: 0;
          line-height: 1.25;
          font-family: 'Barlow';
          flex: 1;
        }

        .mail-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .message-subject {
          font-size: 0.8rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px 0;
          line-height: 1.25;
          font-family: 'Barlow';
        }

        .message-preview {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
          font-family: 'Barlow';
        }

        .unread-mail {
          background-color: #f0fdf4;
        }

        /* Loading and Empty States */
        .loading-mail-content,
        .empty-mail-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          width: 100%;
        }

        .loading-icon {
          animation: spin 1s linear infinite;
        }

        .loading-text,
        .empty-text {
          font-size: 0.875rem;
          color: #6b7280;
          font-family: 'Barlow';
        }

        /* Calendar/Request Dropdown Styles */
        .request-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .request-details {
          flex: 1;
          min-width: 0;
        }

        .request-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.25rem 0;
          line-height: 1.25;
          font-family: 'Barlow';
        }

        .request-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.33;
          font-family: 'Barlow';
        }
      `}</style>
    </div>
  );
};

export default Dashboard