import React, { useState, useEffect, useRef } from "react";
import { Search, Filter } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "../../../components/Loader";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "sort", direction: "asc" });
  const [filterConfig, setFilterConfig] = useState({ field: "", value: "" });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    loadReportData();
  }, []);

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
      setShowSortDropdown(false);
    }
    if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
      setShowFilterDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

const handleSort = (key) => {
  let direction = "asc";
  if (sortConfig.key === key && sortConfig.direction === "asc") {
    direction = "desc";
  }
  setSortConfig({ key, direction });
  setShowSortDropdown(false);
};

const getSortLabel = () => {
  const labels = {
    sort: "Sort by",
    docId: "Document ID",
    quarter: "Quarter",
    year: "Year",
    createdBy: "Created By",
    dateCreated: "Created At",
  };
  return labels[sortConfig.key] || "Sort by";
};

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      if (!window.electronAPI) {
        throw new Error("Electron API not available");
      }
  
      // Get all reports from database
      const reports = await window.electronAPI.getAllBloodReports();
  
      // If no reports exist, generate them for ALL years with data
      if (reports.length === 0) {
        console.log("No reports found, generating all historical reports...");
        await window.electronAPI.generateAllHistoricalReports();
        const newReports = await window.electronAPI.getAllBloodReports();
        setReportData(formatReportData(newReports));
      } else {
        setReportData(formatReportData(reports));
      }
    } catch (err) {
      console.error("Error loading report data:", err);
      setError(`Failed to load report data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  

  const formatReportData = (reports) => {
    return reports.map((report) => {
      // Parse month labels - it comes as a JSON string from the database
      let monthLabels;
      if (typeof report.monthLabels === "string") {
        try {
          monthLabels = JSON.parse(report.monthLabels);
        } catch (e) {
          monthLabels = getQuarterMonthLabels(report.quarter);
        }
      } else if (Array.isArray(report.monthLabels)) {
        monthLabels = report.monthLabels;
      } else {
        monthLabels = getQuarterMonthLabels(report.quarter);
      }

      const quarterNumber = getQuarterNumber(report.quarter);

      // Parse month data from JSONB - preserve mobile/walkIn structure
      const month1Data =
        typeof report.month1Data === "string"
          ? JSON.parse(report.month1Data)
          : report.month1Data || { mobile: {}, walkIn: {} };
      const month2Data =
        typeof report.month2Data === "string"
          ? JSON.parse(report.month2Data)
          : report.month2Data || { mobile: {}, walkIn: {} };
      const month3Data =
        typeof report.month3Data === "string"
          ? JSON.parse(report.month3Data)
          : report.month3Data || { mobile: {}, walkIn: {} };

      return {
        id: report.id,
        docId: report.docId,
        quarter: report.quarter,
        quarterNumber: quarterNumber,
        year: report.year,
        dateCreated: report.dateCreated,
        createdBy: report.createdBy,
        selected: false,
        monthLabels: monthLabels,
        statistics: {
          "O+": report.oPositive || 0,
          "O-": report.oNegative || 0,
          "A+": report.aPositive || 0,
          "A-": report.aNegative || 0,
          "B+": report.bPositive || 0,
          "B-": report.bNegative || 0,
          "AB+": report.abPositive || 0,
          "AB-": report.abNegative || 0,
        },
        percentages: {
          "O+": report.oPositivePct
            ? Number(report.oPositivePct).toFixed(1)
            : "0.0",
          "O-": report.oNegativePct
            ? Number(report.oNegativePct).toFixed(1)
            : "0.0",
          "A+": report.aPositivePct
            ? Number(report.aPositivePct).toFixed(1)
            : "0.0",
          "A-": report.aNegativePct
            ? Number(report.aNegativePct).toFixed(1)
            : "0.0",
          "B+": report.bPositivePct
            ? Number(report.bPositivePct).toFixed(1)
            : "0.0",
          "B-": report.bNegativePct
            ? Number(report.bNegativePct).toFixed(1)
            : "0.0",
          "AB+": report.abPositivePct
            ? Number(report.abPositivePct).toFixed(1)
            : "0.0",
          "AB-": report.abNegativePct
            ? Number(report.abNegativePct).toFixed(1)
            : "0.0",
        },
        monthlyData: {
          mobile: {
            month1: month1Data.mobile || {
              counts: {},
              percentages: {},
              total: 0,
              totalPct: "0.0",
            },
            month2: month2Data.mobile || {
              counts: {},
              percentages: {},
              total: 0,
              totalPct: "0.0",
            },
            month3: month3Data.mobile || {
              counts: {},
              percentages: {},
              total: 0,
              totalPct: "0.0",
            },
          },
          walkIn: {
            month1: month1Data.walkIn || {
              counts: {},
              percentages: {},
              total: 0,
              totalPct: "0.0",
            },
            month2: month2Data.walkIn || {
              counts: {},
              percentages: {},
              total: 0,
              totalPct: "0.0",
            },
            month3: month3Data.walkIn || {
              counts: {},
              percentages: {},
              total: 0,
              totalPct: "0.0",
            },
          },
        },
        total: report.total || 0,
      };
    });
  };

  const getQuarterMonthLabels = (quarter) => {
    const quarterMap = {
      "1st Quarter": ["Jan", "Feb", "Mar"],
      "2nd Quarter": ["Apr", "May", "Jun"],
      "3rd Quarter": ["Jul", "Aug", "Sep"],
      "4th Quarter": ["Oct", "Nov", "Dec"],
    };
    return quarterMap[quarter] || ["Jan", "Feb", "Mar"];
  };

  const getQuarterNumber = (quarter) => {
    const quarterMap = {
      "1st Quarter": "1",
      "2nd Quarter": "2",
      "3rd Quarter": "3",
      "4th Quarter": "4",
    };
    return quarterMap[quarter] || "1";
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      if (value.trim() === "") {
        await loadReportData();
      } else {
        const searchResults = await window.electronAPI.searchReports(value);
        setReportData(formatReportData(searchResults));
      }
    } catch (err) {
      console.error("Error searching:", err);
      setError("Search failed");
    }
  };

  const getSortedAndFilteredData = () => {
  let filtered = reportData.filter(
    (report) =>
      report.quarter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.year.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.docId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterConfig.field && filterConfig.value) {
    filtered = filtered.filter((item) => {
      const value = item[filterConfig.field];
      if (value === null || value === undefined) return false;
      return value
        .toString()
        .toLowerCase()
        .includes(filterConfig.value.toLowerCase());
    });
  }

  const sorted = filtered.sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    let comparison = 0;
    if (typeof aVal === "string") {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === "number") {
      comparison = aVal - bVal;
    }

    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  return sorted;
};

const filteredReports = getSortedAndFilteredData();

  const toggleRowSelection = (id) => {
    setReportData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = filteredReports.every((item) => item.selected);
    setReportData((prevData) =>
      prevData.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const clearAllSelection = () => {
    setReportData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  const deleteSelectedItems = async () => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      const selectedIds = reportData
        .filter((item) => item.selected)
        .map((item) => item.id);

      if (selectedIds.length === 0) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedIds.length} report(s)?`
      );

      if (!confirmed) return;

      await window.electronAPI.deleteReports(selectedIds);
      await loadReportData();
      clearAllSelection();
      setError(null);
    } catch (err) {
      console.error("Error deleting reports:", err);
      setError(`Failed to delete reports: ${err.message}`);
    }
  };

  const handleViewReport = (report) => {
    setPreviewReport(report);
    setShowPreviewModal(true);
  };

  const handleRefreshReports = async () => {
    try {
      setLoading(true);
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }
  
      // Regenerate all historical reports
      await window.electronAPI.generateAllHistoricalReports();
      await loadReportData();
      setError(null);
    } catch (err) {
      console.error("Error refreshing reports:", err);
      setError(`Failed to refresh reports: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateReportPDF = () => {
    if (!previewReport) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: [8.5, 13],
    });

    const dohMainLogo = "./assets/doh-main-logo.jpg";
    const dohPurpleLogo = "./assets/doh-purple-logo.png";
    const bagongPilipinasLogo = "./assets/bagong-pilipinas-logo.png";

    try {
      doc.addImage(dohMainLogo, "JPEG", 0.5, 0.3, 1.0, 1.0);
      doc.addImage(dohPurpleLogo, "PNG", 1.7, 0.3, 0.97, 0.97);
      doc.addImage(bagongPilipinasLogo, "PNG", 2.7, 0.15, 1.4, 1.3);
    } catch (e) {
      console.error("Error loading logos:", e);
    }

    const textStartX = 4.25;
    const textStartY = 0.4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("DEPARTMENT OF HEALTH", textStartX, textStartY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      "CENTER FOR HEALTH DEVELOPMENT- NORTHERN MINDANAO",
      textStartX,
      textStartY + 0.16
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      "J. V. Serina Street, Carmen, Cagayan de Oro City",
      textStartX,
      textStartY + 0.32
    );

    doc.setFontSize(6.5);
    doc.text(
      "PABX (088) 8587123/ (088) 858 4000/ (088) 855 0430/ (+63) 917-148-3298/",
      textStartX,
      textStartY + 0.46
    );
    doc.text(
      "(+63) 968-882-4092/ (088) 858-7132/ (088) 858-2639/ (088)-1601",
      textStartX,
      textStartY + 0.57
    );

    doc.setTextColor(0, 0, 0);
    doc.text("Email address: ", textStartX, textStartY + 0.68);
    const emailLabelWidth = doc.getTextWidth("Email address: ");
    doc.setTextColor(0, 115, 230);
    doc.text(
      "pacd@ro10.doh.gov.ph",
      textStartX + emailLabelWidth,
      textStartY + 0.68
    );

    doc.setTextColor(0, 0, 0);
    doc.text("Website: ", textStartX, textStartY + 0.79);
    const websiteLabelWidth = doc.getTextWidth("Website: ");
    doc.setTextColor(0, 115, 230);
    doc.text(
      "http://www.ro10.doh.gov.ph",
      textStartX + websiteLabelWidth,
      textStartY + 0.79
    );

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
   doc.text(
  "Name of Blood Service Facility: ",
  0.5,
  1.8
  );

  const facilityText = "Northern Mindanao Regional Blood Center";
  const facilityLabelWidth = doc.getTextWidth("Name of Blood Service Facility: ");
  doc.setFont("helvetica", "normal");
  doc.text(facilityText, 0.5 + facilityLabelWidth + 0.05, 1.8);
  const facilityTextWidth = doc.getTextWidth(facilityText);
  doc.setLineWidth(0.01);
  doc.line(
    0.5 + facilityLabelWidth + 0.05,
    1.81,
    0.5 + facilityLabelWidth + 0.05 + facilityTextWidth,
    1.81
  );

    doc.setTextColor(0, 0, 0);
doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.text(
  "Center for Health Development for: ",
  0.5,
  2.1
);

// Add underlined text for "Northern Mindanao"
const regionText = "Northern Mindanao";
const regionLabelWidth = doc.getTextWidth("Center for Health Development for: ");
doc.setFont("helvetica", "normal");
doc.text(regionText, 0.5 + regionLabelWidth + 0.05, 2.1);
const regionTextWidth = doc.getTextWidth(regionText);
doc.setLineWidth(0.01);
doc.line(
  0.5 + regionLabelWidth + 0.05,
  2.11,
  0.5 + regionLabelWidth + 0.05 + regionTextWidth,
  2.11  // Fixed: Changed 0.5 to 2.11 for proper underline
);

// Add "Qtr:" label after the region name
const qtrLabelX = 0.5 + regionLabelWidth + 0.05 + regionTextWidth + 0.1;
doc.setFont("helvetica", "bold");
doc.text("Qtr:", qtrLabelX, 2.1);

// Add underlined quarter number
const qtrLabelWidth = doc.getTextWidth("Qtr:");
doc.setFont("helvetica", "normal");
const qtrText = previewReport.quarterNumber;
doc.text(qtrText, qtrLabelX + qtrLabelWidth + 0.05, 2.1); // Fixed: Use qtrLabelX as starting point
const qtrNumWidth = doc.getTextWidth(qtrText);
doc.line(
  qtrLabelX + qtrLabelWidth + 0.05,
  2.11,
  qtrLabelX + qtrLabelWidth + 0.05 + qtrNumWidth,
  2.11
);


   const yearLabelX = qtrLabelX + qtrLabelWidth + 0.05 + qtrNumWidth + 0.1;
doc.setFont("helvetica", "bold");
doc.text("Year:", yearLabelX, 2.1);
const yearLabelWidth = doc.getTextWidth("Year:");
doc.setFont("helvetica", "normal");
const yearText = previewReport.year.toString();
doc.text(
  yearText,
  yearLabelX + yearLabelWidth + 0.05,
  2.1
);
const yearWidth = doc.getTextWidth(yearText);
doc.line(
  yearLabelX + yearLabelWidth + 0.05,
  2.11,
  yearLabelX + yearLabelWidth + 0.05 + yearWidth,
  2.11
);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(
      "BLOOD DONATIONS DOCUMENTATION REPORT (Screened/Tested)",
      4.25,
      2.5, // Changed from 1.95 - added margin-top
      { align: "center" }
    );

    const monthLabels = previewReport.monthLabels || ["Jan", "Feb", "Mar"];

    // Get Mobile and Walk-In data separately
    const mobileData = previewReport.monthlyData.mobile || {
      month1: {},
      month2: {},
      month3: {},
    };
    const walkInData = previewReport.monthlyData.walkIn || {
      month1: {},
      month2: {},
      month3: {},
    };

    // Calculate Mobile totals
    const mobileTotal =
      (mobileData.month1?.total || 0) +
      (mobileData.month2?.total || 0) +
      (mobileData.month3?.total || 0);
    const mobileTotalPct = mobileTotal > 0 ? "100.0" : "0.0";
    const mobileStatistics = {};
    const mobilePercentages = {};
    ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].forEach((type) => {
      const total =
        (mobileData.month1?.counts?.[type] || 0) +
        (mobileData.month2?.counts?.[type] || 0) +
        (mobileData.month3?.counts?.[type] || 0);
      mobileStatistics[type] = total;
      mobilePercentages[type] =
        mobileTotal > 0 ? ((total / mobileTotal) * 100).toFixed(1) : "0.0";
    });

    // Create mobileTableData with Mobile source data only
    const mobileTableData = [
      [
        "O+",
        mobileData.month1?.counts?.["O+"] || 0,
        mobileData.month1?.percentages?.["O+"] || "0.0",
        mobileData.month2?.counts?.["O+"] || 0,
        mobileData.month2?.percentages?.["O+"] || "0.0",
        mobileData.month3?.counts?.["O+"] || 0,
        mobileData.month3?.percentages?.["O+"] || "0.0",
        mobileStatistics["O+"] || 0,
        mobilePercentages["O+"] || "0.0",
      ],
      [
        "A+",
        mobileData.month1?.counts?.["A+"] || 0,
        mobileData.month1?.percentages?.["A+"] || "0.0",
        mobileData.month2?.counts?.["A+"] || 0,
        mobileData.month2?.percentages?.["A+"] || "0.0",
        mobileData.month3?.counts?.["A+"] || 0,
        mobileData.month3?.percentages?.["A+"] || "0.0",
        mobileStatistics["A+"] || 0,
        mobilePercentages["A+"] || "0.0",
      ],
      [
        "B+",
        mobileData.month1?.counts?.["B+"] || 0,
        mobileData.month1?.percentages?.["B+"] || "0.0",
        mobileData.month2?.counts?.["B+"] || 0,
        mobileData.month2?.percentages?.["B+"] || "0.0",
        mobileData.month3?.counts?.["B+"] || 0,
        mobileData.month3?.percentages?.["B+"] || "0.0",
        mobileStatistics["B+"] || 0,
        mobilePercentages["B+"] || "0.0",
      ],
      [
        "AB+",
        mobileData.month1?.counts?.["AB+"] || 0,
        mobileData.month1?.percentages?.["AB+"] || "0.0",
        mobileData.month2?.counts?.["AB+"] || 0,
        mobileData.month2?.percentages?.["AB+"] || "0.0",
        mobileData.month3?.counts?.["AB+"] || 0,
        mobileData.month3?.percentages?.["AB+"] || "0.0",
        mobileStatistics["AB+"] || 0,
        mobilePercentages["AB+"] || "0.0",
      ],
      [
        "O-",
        mobileData.month1?.counts?.["O-"] || 0,
        mobileData.month1?.percentages?.["O-"] || "0.0",
        mobileData.month2?.counts?.["O-"] || 0,
        mobileData.month2?.percentages?.["O-"] || "0.0",
        mobileData.month3?.counts?.["O-"] || 0,
        mobileData.month3?.percentages?.["O-"] || "0.0",
        mobileStatistics["O-"] || 0,
        mobilePercentages["O-"] || "0.0",
      ],
      [
        "A-",
        mobileData.month1?.counts?.["A-"] || 0,
        mobileData.month1?.percentages?.["A-"] || "0.0",
        mobileData.month2?.counts?.["A-"] || 0,
        mobileData.month2?.percentages?.["A-"] || "0.0",
        mobileData.month3?.counts?.["A-"] || 0,
        mobileData.month3?.percentages?.["A-"] || "0.0",
        mobileStatistics["A-"] || 0,
        mobilePercentages["A-"] || "0.0",
      ],
      [
        "B-",
        mobileData.month1?.counts?.["B-"] || 0,
        mobileData.month1?.percentages?.["B-"] || "0.0",
        mobileData.month2?.counts?.["B-"] || 0,
        mobileData.month2?.percentages?.["B-"] || "0.0",
        mobileData.month3?.counts?.["B-"] || 0,
        mobileData.month3?.percentages?.["B-"] || "0.0",
        mobileStatistics["B-"] || 0,
        mobilePercentages["B-"] || "0.0",
      ],
      [
        "AB-",
        mobileData.month1?.counts?.["AB-"] || 0,
        mobileData.month1?.percentages?.["AB-"] || "0.0",
        mobileData.month2?.counts?.["AB-"] || 0,
        mobileData.month2?.percentages?.["AB-"] || "0.0",
        mobileData.month3?.counts?.["AB-"] || 0,
        mobileData.month3?.percentages?.["AB-"] || "0.0",
        mobileStatistics["AB-"] || 0,
        mobilePercentages["AB-"] || "0.0",
      ],
      ["Others", "0", "0.0", "0", "0.0", "0", "0.0", "0", "0.0"],
      [
        "Sub-Total",
        mobileData.month1?.total || 0,
        mobileData.month1?.totalPct || "0.0",
        mobileData.month2?.total || 0,
        mobileData.month2?.totalPct || "0.0",
        mobileData.month3?.total || 0,
        mobileData.month3?.totalPct || "0.0",
        mobileTotal || 0,
        mobileTotalPct,
      ],
    ];

    autoTable(doc, {
      startY: 2.8, // Changed from 2.2 - added margin-top
      head: [
        [
          {
            content: "SOURCES",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle", fontWeight: "bold" },
          },
          {
            content: "REPORTING MONTHS",
            colSpan: 6,
            styles: { halign: "center", fontWeight: "bold" },
          },
          { content: "TOTAL", colSpan: 2, styles: { halign: "center", fontWeight: "bold" } },
        ],
        [
          monthLabels[0],
          "%",
          monthLabels[1],
          "%",
          monthLabels[2],
          "%",
          "No.",
          "%",
        ],
      ],
      body: [
        [
          {
            content: "Mobile Blood Donations",
            colSpan: 9,
            styles: { fontStyle: "bold", fillColor: [240, 240, 240], halign: "center", valign: "middle", textColor: [0, 0, 0] },
          },
        ],
        ...mobileTableData,
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 0.04,
        lineColor: [0, 0, 0],
        lineWidth: 0.01,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [201, 201, 201],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 1.59, halign: "left", textColor: [0, 0, 0] },     
        1: { cellWidth: 0.89, halign: "center", textColor: [0, 0, 0] },    
        2: { cellWidth: 0.59, halign: "center", textColor: [0, 0, 0] },    
        3: { cellWidth: 0.89, halign: "center", textColor: [0, 0, 0] },   
        4: { cellWidth: 0.59, halign: "center", textColor: [0, 0, 0] },   
        5: { cellWidth: 0.89, halign: "center", textColor: [0, 0, 0] },   
        6: { cellWidth: 0.59, halign: "center", textColor: [0, 0, 0] },    
        7: { cellWidth: 0.89, halign: "center", textColor: [0, 0, 0] },   
        8: { cellWidth: 0.59, halign: "center", textColor: [0, 0, 0] },  
      },
      margin: { left: 0.5, right: 0.5 },
      didParseCell: function (data) {
        if (
          data.section === "body" &&
          data.row.index === mobileTableData.length
        ) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Calculate Walk-In totals
    const walkInTotal =
      (walkInData.month1?.total || 0) +
      (walkInData.month2?.total || 0) +
      (walkInData.month3?.total || 0);
    const walkInTotalPct = walkInTotal > 0 ? "100.0" : "0.0";
    const walkInStatistics = {};
    const walkInPercentages = {};
    ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].forEach((type) => {
      const total =
        (walkInData.month1?.counts?.[type] || 0) +
        (walkInData.month2?.counts?.[type] || 0) +
        (walkInData.month3?.counts?.[type] || 0);
      walkInStatistics[type] = total;
      walkInPercentages[type] =
        walkInTotal > 0 ? ((total / walkInTotal) * 100).toFixed(1) : "0.0";
    });

    // Create walkinTableData with Walk-In source data only
    const walkinTableData = [
      [
        "O+",
        walkInData.month1?.counts?.["O+"] || 0,
        walkInData.month1?.percentages?.["O+"] || "0.0",
        walkInData.month2?.counts?.["O+"] || 0,
        walkInData.month2?.percentages?.["O+"] || "0.0",
        walkInData.month3?.counts?.["O+"] || 0,
        walkInData.month3?.percentages?.["O+"] || "0.0",
        walkInStatistics["O+"] || 0,
        walkInPercentages["O+"] || "0.0",
      ],
      [
        "A+",
        walkInData.month1?.counts?.["A+"] || 0,
        walkInData.month1?.percentages?.["A+"] || "0.0",
        walkInData.month2?.counts?.["A+"] || 0,
        walkInData.month2?.percentages?.["A+"] || "0.0",
        walkInData.month3?.counts?.["A+"] || 0,
        walkInData.month3?.percentages?.["A+"] || "0.0",
        walkInStatistics["A+"] || 0,
        walkInPercentages["A+"] || "0.0",
      ],
      [
        "B+",
        walkInData.month1?.counts?.["B+"] || 0,
        walkInData.month1?.percentages?.["B+"] || "0.0",
        walkInData.month2?.counts?.["B+"] || 0,
        walkInData.month2?.percentages?.["B+"] || "0.0",
        walkInData.month3?.counts?.["B+"] || 0,
        walkInData.month3?.percentages?.["B+"] || "0.0",
        walkInStatistics["B+"] || 0,
        walkInPercentages["B+"] || "0.0",
      ],
      [
        "AB+",
        walkInData.month1?.counts?.["AB+"] || 0,
        walkInData.month1?.percentages?.["AB+"] || "0.0",
        walkInData.month2?.counts?.["AB+"] || 0,
        walkInData.month2?.percentages?.["AB+"] || "0.0",
        walkInData.month3?.counts?.["AB+"] || 0,
        walkInData.month3?.percentages?.["AB+"] || "0.0",
        walkInStatistics["AB+"] || 0,
        walkInPercentages["AB+"] || "0.0",
      ],
      [
        "O-",
        walkInData.month1?.counts?.["O-"] || 0,
        walkInData.month1?.percentages?.["O-"] || "0.0",
        walkInData.month2?.counts?.["O-"] || 0,
        walkInData.month2?.percentages?.["O-"] || "0.0",
        walkInData.month3?.counts?.["O-"] || 0,
        walkInData.month3?.percentages?.["O-"] || "0.0",
        walkInStatistics["O-"] || 0,
        walkInPercentages["O-"] || "0.0",
      ],
      [
        "A-",
        walkInData.month1?.counts?.["A-"] || 0,
        walkInData.month1?.percentages?.["A-"] || "0.0",
        walkInData.month2?.counts?.["A-"] || 0,
        walkInData.month2?.percentages?.["A-"] || "0.0",
        walkInData.month3?.counts?.["A-"] || 0,
        walkInData.month3?.percentages?.["A-"] || "0.0",
        walkInStatistics["A-"] || 0,
        walkInPercentages["A-"] || "0.0",
      ],
      [
        "B-",
        walkInData.month1?.counts?.["B-"] || 0,
        walkInData.month1?.percentages?.["B-"] || "0.0",
        walkInData.month2?.counts?.["B-"] || 0,
        walkInData.month2?.percentages?.["B-"] || "0.0",
        walkInData.month3?.counts?.["B-"] || 0,
        walkInData.month3?.percentages?.["B-"] || "0.0",
        walkInStatistics["B-"] || 0,
        walkInPercentages["B-"] || "0.0",
      ],
      [
        "AB-",
        walkInData.month1?.counts?.["AB-"] || 0,
        walkInData.month1?.percentages?.["AB-"] || "0.0",
        walkInData.month2?.counts?.["AB-"] || 0,
        walkInData.month2?.percentages?.["AB-"] || "0.0",
        walkInData.month3?.counts?.["AB-"] || 0,
        walkInData.month3?.percentages?.["AB-"] || "0.0",
        walkInStatistics["AB-"] || 0,
        walkInPercentages["AB-"] || "0.0",
      ],
      ["Others", "0", "0.0", "0", "0.0", "0", "0.0", "0", "0.0"],
      [
        "Sub-Total",
        walkInData.month1?.total || 0,
        walkInData.month1?.totalPct || "0.0",
        walkInData.month2?.total || 0,
        walkInData.month2?.totalPct || "0.0",
        walkInData.month3?.total || 0,
        walkInData.month3?.totalPct || "0.0",
        walkInTotal || 0,
        walkInTotalPct,
      ],
    ];

    const finalY = doc.lastAutoTable.finalY + 0.2;

    autoTable(doc, {
      startY: finalY,
      head: [
        [
          {
            content: "SOURCES",
            rowSpan: 2,
            styles: { halign: "center", valign: "middle", textColor: [0, 0, 0], fontWeight: "bold" },
          },
          {
            content: "REPORTING MONTHS",
            colSpan: 6,
            styles: { halign: "center", textColor: [0, 0, 0], fontWeight: "bold" },
          },
          { content: "TOTAL", colSpan: 2, styles: { halign: "center", textColor: [0, 0, 0], fontWeight: "bold" } },
        ],
        [
          monthLabels[0],
          "%",
          monthLabels[1],
          "%",
          monthLabels[2],
          "%",
          "No.",
          "%",
        ],
      ],
      body: [
        [
          {
            content: "Walk-in Voluntary Blood Donations",
            colSpan: 9,
            styles: { fontStyle: "bold", fillColor: [240, 240, 240], halign: "center", valign: "middle", textColor: [0, 0, 0] },
          },
        ],
        ...walkinTableData,
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 0.04,
        lineColor: [0, 0, 0],
        lineWidth: 0.01,
      },
      headStyles: {
        fillColor: [201, 201, 201],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 1.59, halign: "left", textColor: [0, 0, 0] },     
        1: { cellWidth: 0.89, halign: "center", textColor: [0, 0, 0] },    
        2: { cellWidth: 0.59, halign: "center", textColor: [0, 0, 0] },    
        3: { cellWidth: 0.89, halign: "center", textColor: [0, 0, 0] },   
        4: { cellWidth: 0.59, halign: "center", textColor: [0, 0, 0] },   
        5: { cellWidth: 0.89, halign: "center", textColor: [0, 0, 0] },   
        6: { cellWidth: 0.59, halign: "center", textColor: [0, 0, 0] },    
        7: { cellWidth: 0.89, halign: "center", textColor: [0, 0, 0] },   
        8: { cellWidth: 0.59, halign: "center", textColor: [0, 0, 0] }, 
      },
      margin: { left: 0.5, right: 0.5 },
      didParseCell: function (data) {
        if (
          data.section === "body" &&
          data.row.index === walkinTableData.length
        ) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`Blood-Report-${previewReport.quarter}-${previewReport.year}.pdf`);
    setShowPreviewModal(false);
  };

  const selectedCount = reportData.filter((item) => item.selected).length;
  const allSelected =
    filteredReports.length > 0 &&
    filteredReports.every((item) => item.selected);
  const someSelected =
    filteredReports.some((item) => item.selected) && !allSelected;

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f8f9fa",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif",
      borderRadius: "8px",
    },
    header: {
      margin: 0,
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#165C3C",
      marginTop: "1px",
      fontFamily: "Barlow",
    },
    subtitle: {
      color: "#6b7280",
      fontSize: "14px",
      marginTop: "-7px",
      fontFamily: "Barlow",
    },
    controlsBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px",
      backgroundColor: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      flexWrap: "wrap",
      gap: "12px",
    },
    leftControls: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      minWidth: "200px",

    },
    searchContainer: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    searchInput: {
      paddingLeft: "40px",
      paddingRight: "16px",
      paddingTop: "8px",
      paddingBottom: "8px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      width: "100%",
      fontSize: "14px",
      outline: "none",
       minWidth: "200px",
      maxWidth: "400px",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      zIndex: 1,
      color: "#9ca3af",
    },
    rightControls: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    refreshButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#2C58DC",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Barlow",
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "1200px",
    },
    thead: {
      backgroundColor: "#f9fafb",
    },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "11px",
      fontFamily: "Barlow",
      fontWeight: "500",
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: "1px solid #e5e7eb",
    },
    tbody: {
      backgroundColor: "white",
    },
    tr: {
      borderBottom: "1px solid #f3f4f6",
    },
    trEven: {
      backgroundColor: "#f9fafb",
    },
    trSelected: {
      backgroundColor: "#e6f7ff",
    },
    td: {
      padding: "12px 16px",
      fontSize: "11px",
      color: "#111827",
      borderBottom: "1px solid #f3f4f6",
    },
    viewReportLink: {
      color: "#3b82f6",
      textDecoration: "none",
      fontSize: "11px",
      fontWeight: "400",
      cursor: "pointer",
    },
    
    actionBar: {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      alignItems: "center",
      gap: "0",
      background: "#4a5568",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
      borderRadius: "8px",
      zIndex: 1000,
      color: "white",
      overflow: "hidden",
    },
    closeButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 16px",
      backgroundColor: "#4a5568",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      borderRight: "1px solid #2d3748",
    },
    counterSection: {
      padding: "12px 24px",
      backgroundColor: "#4a5568",
      borderRight: "1px solid #2d3748",
    },
    counterText: {
      fontSize: "14px",
      fontWeight: "500",
      color: "white",
      margin: 0,
    },
    editButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 16px",
      backgroundColor: "#4a5568",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Arial",
      borderRight: "1px solid #2d3748",
    },
    deleteButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "12px 16px",
      backgroundColor: "#4a5568",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
    },
    errorContainer: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "12px 16px",
      borderRadius: "8px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    retryButton: {
      backgroundColor: "#059669",
      color: "white",
      border: "none",
      padding: "4px 8px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: "20px",
    },
    modalContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      width: "90%",
      maxWidth: "1000px",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)",
    },
    modalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderBottom: "1px solid #e5e7eb",
      backgroundColor: "white",
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#165C3C",
      margin: 0,
      fontFamily: "Barlow",
    },
    modalSubtitle: {
      fontSize: "14px",
      color: "#6b7280",
      margin: 0,
      fontFamily: "Barlow",
    },
    modalCloseButton: {
      background: "none",
      border: "none",
      fontSize: "24px",
      color: "#6b7280",
      cursor: "pointer",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      borderRadius: "4px",
    },
    modalContent: {
      flex: 1,
      padding: "40px 20px",
      overflowY: "auto",
      overflowX: "auto",
      backgroundColor: "#f3f4f6",
      display: "flex",
      justifyContent: "center",
    },
    previewContainer: {
      backgroundColor: "white",
      width: "8.5in",
      minHeight: "13in",
      padding: "0.5in",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      fontFamily: "Arial, sans-serif",
      margin: "0 auto",
      boxSizing: "border-box",
      position: "relative",
    },
    modalFooter: {
      padding: "16px 24px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      backgroundColor: "white",
      borderBottomLeftRadius: "8px",
      borderBottomRightRadius: "8px",
    },
    downloadButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 24px",
      backgroundColor: "#FFC200",
      color: "black",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: "Barlow",
    },
    cancelButton: {
      padding: "10px 24px",
      backgroundColor: "white",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: "Barlow",
    },
    reportTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "20px",
      fontSize: "10px",
    },
    reportTableHeader: {
      backgroundColor: "#c9c9c9",
      fontWeight: "bold",
      border: "1px solid #000",
      padding: "6px",
      textAlign: "center",
    },
    reportTableCell: {
      border: "1px solid #000",
      padding: "6px",
      textAlign: "center",
      color: "#000",
    },
    reportTableCellLeft: {
      border: "1px solid #000",
      padding: "6px",
      textAlign: "left",
      color: "#000",
    },
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Blood Donation Documentation Report</h1>
        <p style={styles.subtitle}>Quarterly Blood Donation Summary</p>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            />
          </svg>
          <span>{error}</span>
          <button style={styles.retryButton} onClick={loadReportData}>
            Retry
          </button>
        </div>
      )}

        <div style={styles.controlsBar}>
          <div style={styles.leftControls}>
            <div style={styles.searchContainer}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search Reports"
                style={styles.searchInput}
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* Sort By Dropdown */}
            <div style={{ position: "relative" }} ref={sortDropdownRef}>
              <button 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  padding: "8px 16px", 
                  border: "1px solid #d1d5db", 
                  borderRadius: "6px", 
                  backgroundColor: showSortDropdown ? "#2C58DC" : "white", 
                  cursor: "pointer", 
                  fontSize: "14px", 
                  fontFamily: "Barlow",
                  color: showSortDropdown ? "white" : "#374151",
                  transition: "all 0.2s ease",
                  minWidth: "100px",
                  whiteSpace: "nowrap",
                  width: "100%", 
                }}
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <span>{getSortLabel()}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: showSortDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                </svg>
              </button>
              {showSortDropdown && (
                <div style={{ position: "absolute", top: "100%", left: 0, backgroundColor: "white", border: "#8daef2", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", zIndex: 1000, minWidth: "200px", marginTop: "4px" }}>
                  {[
                    { key: "sort", label: "Sort by" },
                    { key: "docId", label: "Document ID" },
                    { key: "quarter", label: "Quarter" },
                    { key: "year", label: "Year" },
                    { key: "createdBy", label: "Created By" },
                    { key: "dateCreated", label: "Created At" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      style={{
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#374151",
                        transition: "background-color 0.2s ease",
                        borderBottom: "1px solid #e5e7eb",
                        fontFamily: "Barlow",
                        backgroundColor: sortConfig.key === item.key ? "#dbeafe" : "transparent",
                        fontWeight: sortConfig.key === item.key ? "600" : "normal",
                      }}
                      onClick={() => handleSort(item.key)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = sortConfig.key === item.key ? "#dbeafe" : "#f3f4f6"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = sortConfig.key === item.key ? "#dbeafe" : "transparent"; }}
                    >
                      {item.label} {sortConfig.key === item.key && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Dropdown */}
            <div style={{ position: "relative" }} ref={filterDropdownRef}>
              <button 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  padding: "8px 16px", 
                  backgroundColor: showFilterDropdown ? "#2C58DC" : "white", 
                  color: showFilterDropdown ? "white" : "#374151", 
                  border: "1px solid #d1d5db", 
                  fontFamily: "Barlow",
                  borderRadius: "6px", 
                  cursor: "pointer", 
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  width: "100%", 
                }}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Filter size={16} />
                <span>Filter</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: showFilterDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                </svg>
              </button>
              {showFilterDropdown && (
                <div style={{ position: "absolute", top: "100%", left: 0, backgroundColor: "white", border: "#8daef2", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", zIndex: 1000, minWidth: "300px", marginTop: "4px" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Filter Field</label>
                      <select
                        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", fontFamily: "Barlow", outline: "none", backgroundColor: "white", cursor: "pointer", width: "100%", boxSizing: "border-box" }}
                        value={filterConfig.field}
                        onChange={(e) => setFilterConfig({ ...filterConfig, field: e.target.value })}
                      >
                        <option value="">Select a field</option>
                        <option value="docId">Document ID</option>
                        <option value="quarter">Quarter</option>
                        <option value="year">Year</option>
                        <option value="createdBy">Created By</option>
                        <option value="dateCreated">Created At</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>Filter Value</label>
                      <input
                        type="text"
                        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", fontFamily: "Barlow", outline: "none", backgroundColor: "white", width: "100%", boxSizing: "border-box" }}
                        value={filterConfig.value}
                        onChange={(e) => setFilterConfig({ ...filterConfig, value: e.target.value })}
                        placeholder="Enter value to filter"
                      />
                    </div>
                  </div>
                  <div style={{ padding: "8px", display: "flex", gap: "8px" }}>
                    <button
                      style={{ flex: 1, padding: "8px 12px", fontSize: "12px", backgroundColor: "#9ca3af", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "Barlow" }}
                      onClick={() => {
                        setFilterConfig({ field: "", value: "" });
                        setShowFilterDropdown(false);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      style={{ flex: 1, padding: "8px 12px", fontSize: "12px", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "Barlow" }}
                      onClick={() => setShowFilterDropdown(false)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={styles.rightControls}>
            <button style={styles.refreshButton} onClick={handleRefreshReports}>
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Reports
            </button>
          </div>
        </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: "10%" }}>DOCUMENT ID</th>
              <th style={{ ...styles.th, width: "10%" }}>QUARTER</th>
              <th style={{ ...styles.th, width: "10%" }}>YEAR</th>
              <th style={{ ...styles.th, width: "10%" }}>CREATED BY</th>
              <th style={{ ...styles.th, width: "10%" }}>CREATED AT</th>
              <th style={{ ...styles.th, width: "10%" }}>REPORT</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {filteredReports.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{ ...styles.td, textAlign: "center", padding: "40px" }}
                >
                  No reports found
                </td>
              </tr>
            ) : (
              filteredReports.map((report, index) => (
                <tr
                  key={report.id}
                  style={{
                    ...(index % 2 === 1 ? styles.trEven : {}),
                    ...(report.selected ? styles.trSelected : {}),
                  }}
                >
            
                  <td style={styles.td}>{report.docId}</td>
                  <td style={styles.td}>{report.quarter}</td>
                  <td style={styles.td}>{report.year}</td>
                  <td style={styles.td}>{report.createdBy}</td>
                  <td style={styles.td}>{report.dateCreated}</td>
                  <td style={styles.td}>
                    <a
                      href="#"
                      style={styles.viewReportLink}
                      onClick={(e) => {
                        e.preventDefault();
                        handleViewReport(report);
                      }}
                    >
                      View Report
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div style={styles.actionBar}>
          <button style={styles.closeButton} onClick={clearAllSelection}>
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div style={styles.counterSection}>
            <span style={styles.counterText}>
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>

          <button style={styles.editButton} onClick={editSelectedItems}>
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>Edit</span>
          </button>

          <button style={styles.deleteButton} onClick={deleteSelectedItems}>
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}

      {showPreviewModal && previewReport && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            style={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Report Preview</h3>
                <p style={styles.modalSubtitle}>
                  Blood Donation Documentation Report
                </p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowPreviewModal(false)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.previewContainer}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                    gap: "12px",
                  }}
                >
                  <img
                    src="./assets/doh-main-logo.jpg"
                    alt="DOH Logo"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "contain",
                    }}
                  />
                  <img
                    src="./assets/doh-purple-logo.png"
                    alt="DOH Purple Logo"
                    style={{
                      width: "97px",
                      height: "97px",
                      objectFit: "contain",
                      marginLeft: "3px",
                    }}
                  />
                  <img
                    src="./assets/bagong-pilipinas-logo.png"
                    alt="Bagong Pilipinas Logo"
                    style={{
                      width: "140px",
                      height: "130px",
                      objectFit: "contain",
                      marginTop: "-15px",
                    }}
                  />
                  <div
                    style={{ flex: 1, paddingTop: "8px", paddingLeft: "10px" }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        margin: "3px 0",
                        color: "#000",
                      }}
                    >
                      DEPARTMENT OF HEALTH
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        margin: "3px 0",
                        color: "#000",
                      }}
                    >
                      CENTER FOR HEALTH DEVELOPMENT- NORTHERN MINDANAO
                    </div>
                    <div
                      style={{
                        fontSize: "8.5px",
                        margin: "2px 0",
                        color: "#000",
                        lineHeight: "1.4",
                      }}
                    >
                      J. V. Serina Street, Carmen, Cagayan de Oro City
                    </div>
                    <div
                      style={{
                        fontSize: "7.5px",
                        margin: "2px 0",
                        color: "#000",
                        lineHeight: "1.4",
                      }}
                    >
                      PABX (088) 8587123/ (088) 858 4000/ (088) 855 0430/ (+63)
                      917-148-3298/
                    </div>
                    <div
                      style={{
                        fontSize: "7.5px",
                        margin: "2px 0",
                        color: "#000",
                        lineHeight: "1.4",
                      }}
                    >
                      (+63) 968-882-4092/ (088) 858-7132/ (088) 858-2639/
                      (088)-1601
                    </div>
                    <div
                      style={{
                        fontSize: "7.5px",
                        margin: "2px 0",
                        color: "#000",
                        lineHeight: "1.4",
                      }}
                    >
                      Email address:{" "}
                      <span style={{ color: "#0073e6" }}>
                        pacd@ro10.doh.gov.ph
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "7.5px",
                        margin: "2px 0",
                        color: "#000",
                        lineHeight: "1.4",
                      }}
                    >
                      Website:{" "}
                      <span style={{ color: "#0073e6" }}>
                        http://www.ro10.doh.gov.ph
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "10px",
                    marginBottom: "25px",
                    fontWeight: "bold",
                  }}
                >
                  Name of Blood Service Facility:{" "}
                  <span style={{ textDecoration: "underline", fontWeight: 'normal' }}>
                    Northern Mindanao Regional Blood Center
                  </span>
                </div>

                <div style={{ fontSize: "10px", marginBottom: "30px" }}>
                  <span style={{ fontWeight: "bold" }}>
                    Center for Health Development for:{" "}
                    <span style={{ textDecoration: "underline", fontWeight: 'normal' }}>
                      Northern Mindanao
                    </span>{" "}
                    Qtr:{" "}
                  </span>
                  <span style={{ textDecoration: "underline" }}>
                    {previewReport.quarterNumber}
                  </span>
                  <span style={{ fontWeight: "bold" }}> Year: </span>
                  <span style={{ textDecoration: "underline" }}>
                    {previewReport.year}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "15px",
                  }}
                >
                  BLOOD DONATIONS DOCUMENTATION REPORT (Screened/Tested)
                </div>

                <table style={styles.reportTable}>
                  <thead>
                    <tr>
                      <th style={styles.reportTableHeader} rowSpan="2">
                        SOURCES
                      </th>
                      <th style={styles.reportTableHeader} colSpan="6">
                        REPORTING MONTHS
                      </th>
                      <th style={styles.reportTableHeader} colSpan="2">
                        TOTAL
                      </th>
                    </tr>
                    <tr>
                      <th style={styles.reportTableHeader}>
                        {previewReport.monthLabels[0]}
                      </th>
                      <th style={styles.reportTableHeader}>%</th>
                      <th style={styles.reportTableHeader}>
                        {previewReport.monthLabels[1]}
                      </th>
                      <th style={styles.reportTableHeader}>%</th>
                      <th style={styles.reportTableHeader}>
                        {previewReport.monthLabels[2]}
                      </th>
                      <th style={styles.reportTableHeader}>%</th>
                      <th style={styles.reportTableHeader}>No.</th>
                      <th style={styles.reportTableHeader}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                          backgroundColor: "#f0f0f0",
                        }}
                        colSpan="9"
                      >
                        Mobile Blood Donations
                      </td>
                    </tr>
                    {["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].map(
                      (type) => {
                        const mobileData = previewReport.monthlyData
                          ?.mobile || { month1: {}, month2: {}, month3: {} };
                        const month1 = mobileData.month1?.counts?.[type] || 0;
                        const month1Pct =
                          mobileData.month1?.percentages?.[type] || "0.0";
                        const month2 = mobileData.month2?.counts?.[type] || 0;
                        const month2Pct =
                          mobileData.month2?.percentages?.[type] || "0.0";
                        const month3 = mobileData.month3?.counts?.[type] || 0;
                        const month3Pct =
                          mobileData.month3?.percentages?.[type] || "0.0";

                        const total = month1 + month2 + month3;
                        const mobileTotal =
                          (mobileData.month1?.total || 0) +
                          (mobileData.month2?.total || 0) +
                          (mobileData.month3?.total || 0);
                        const totalPct =
                          mobileTotal > 0
                            ? ((total / mobileTotal) * 100).toFixed(1)
                            : "0.0";

                        return (
                          <tr key={type}>
                            <td style={styles.reportTableCellLeft}>{type}</td>
                            <td style={styles.reportTableCell}>{month1}</td>
                            <td style={styles.reportTableCell}>{month1Pct}</td>
                            <td style={styles.reportTableCell}>{month2}</td>
                            <td style={styles.reportTableCell}>{month2Pct}</td>
                            <td style={styles.reportTableCell}>{month3}</td>
                            <td style={styles.reportTableCell}>{month3Pct}</td>
                            <td style={styles.reportTableCell}>{total}</td>
                            <td style={styles.reportTableCell}>{totalPct}</td>
                          </tr>
                        );
                      }
                    )}
                    <tr>
                      <td style={styles.reportTableCellLeft}>Others</td>
                      <td style={styles.reportTableCell}>0</td>
                      <td style={styles.reportTableCell}>0.0</td>
                      <td style={styles.reportTableCell}>0</td>
                      <td style={styles.reportTableCell}>0.0</td>
                      <td style={styles.reportTableCell}>0</td>
                      <td style={styles.reportTableCell}>0.0</td>
                      <td style={styles.reportTableCell}>0</td>
                      <td style={styles.reportTableCell}>0.0</td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          ...styles.reportTableCellLeft,
                          fontWeight: "bold",
                        }}
                      >
                        Sub-Total
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.mobile?.month1?.total || 0}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.mobile?.month1?.totalPct ||
                          "0.0"}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.mobile?.month2?.total || 0}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.mobile?.month2?.totalPct ||
                          "0.0"}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.mobile?.month3?.total || 0}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.mobile?.month3?.totalPct ||
                          "0.0"}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {(previewReport.monthlyData?.mobile?.month1?.total ||
                          0) +
                          (previewReport.monthlyData?.mobile?.month2?.total ||
                            0) +
                          (previewReport.monthlyData?.mobile?.month3?.total ||
                            0)}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {(previewReport.monthlyData?.mobile?.month1?.total ||
                          0) +
                          (previewReport.monthlyData?.mobile?.month2?.total ||
                            0) +
                          (previewReport.monthlyData?.mobile?.month3?.total ||
                            0) >
                        0
                          ? "100.0"
                          : "0.0"}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table style={{ ...styles.reportTable, marginTop: "30px" }}>
                  <thead>
                    <tr>
                      <th style={styles.reportTableHeader} rowSpan="2">
                        SOURCES
                      </th>
                      <th style={styles.reportTableHeader} colSpan="6">
                        REPORTING MONTHS
                      </th>
                      <th style={styles.reportTableHeader} colSpan="2">
                        TOTAL
                      </th>
                    </tr>
                    <tr>
                      <th style={styles.reportTableHeader}>
                        {previewReport.monthLabels[0]}
                      </th>
                      <th style={styles.reportTableHeader}>%</th>
                      <th style={styles.reportTableHeader}>
                        {previewReport.monthLabels[1]}
                      </th>
                      <th style={styles.reportTableHeader}>%</th>
                      <th style={styles.reportTableHeader}>
                        {previewReport.monthLabels[2]}
                      </th>
                      <th style={styles.reportTableHeader}>%</th>
                      <th style={styles.reportTableHeader}>No.</th>
                      <th style={styles.reportTableHeader}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                          backgroundColor: "#f0f0f0",
                        }}
                        colSpan="9"
                      >
                        Walk-in Voluntary Blood Donations
                      </td>
                    </tr>
                    {["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].map(
                      (type) => {
                        const walkInData = previewReport.monthlyData
                          ?.walkIn || { month1: {}, month2: {}, month3: {} };
                        const month1 = walkInData.month1?.counts?.[type] || 0;
                        const month1Pct =
                          walkInData.month1?.percentages?.[type] || "0.0";
                        const month2 = walkInData.month2?.counts?.[type] || 0;
                        const month2Pct =
                          walkInData.month2?.percentages?.[type] || "0.0";
                        const month3 = walkInData.month3?.counts?.[type] || 0;
                        const month3Pct =
                          walkInData.month3?.percentages?.[type] || "0.0";

                        const total = month1 + month2 + month3;
                        const walkInTotal =
                          (walkInData.month1?.total || 0) +
                          (walkInData.month2?.total || 0) +
                          (walkInData.month3?.total || 0);
                        const totalPct =
                          walkInTotal > 0
                            ? ((total / walkInTotal) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <tr key={type}>
                            <td style={styles.reportTableCellLeft}>{type}</td>
                            <td style={styles.reportTableCell}>{month1}</td>
                            <td style={styles.reportTableCell}>{month1Pct}</td>
                            <td style={styles.reportTableCell}>{month2}</td>
                            <td style={styles.reportTableCell}>{month2Pct}</td>
                            <td style={styles.reportTableCell}>{month3}</td>
                            <td style={styles.reportTableCell}>{month3Pct}</td>
                            <td style={styles.reportTableCell}>{total}</td>
                            <td style={styles.reportTableCell}>{totalPct}</td>
                          </tr>
                        );
                      }
                    )}
                    <tr>
                      <td style={styles.reportTableCellLeft}>Others</td>
                      <td style={styles.reportTableCell}>0</td>
                      <td style={styles.reportTableCell}>0.0</td>
                      <td style={styles.reportTableCell}>0</td>
                      <td style={styles.reportTableCell}>0.0</td>
                      <td style={styles.reportTableCell}>0</td>
                      <td style={styles.reportTableCell}>0.0</td>
                      <td style={styles.reportTableCell}>0</td>
                      <td style={styles.reportTableCell}>0.0</td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          ...styles.reportTableCellLeft,
                          fontWeight: "bold",
                        }}
                      >
                        Sub-Total
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.walkIn?.month1?.total || 0}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.walkIn?.month1?.totalPct ||
                          "0.0"}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.walkIn?.month2?.total || 0}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.walkIn?.month2?.totalPct ||
                          "0.0"}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.walkIn?.month3?.total || 0}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {previewReport.monthlyData?.walkIn?.month3?.totalPct ||
                          "0.0"}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {(previewReport.monthlyData?.walkIn?.month1?.total ||
                          0) +
                          (previewReport.monthlyData?.walkIn?.month2?.total ||
                            0) +
                          (previewReport.monthlyData?.walkIn?.month3?.total ||
                            0)}
                      </td>
                      <td
                        style={{
                          ...styles.reportTableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {(previewReport.monthlyData?.walkIn?.month1?.total ||
                          0) +
                          (previewReport.monthlyData?.walkIn?.month2?.total ||
                            0) +
                          (previewReport.monthlyData?.walkIn?.month3?.total ||
                            0) >
                        0
                          ? "100.0"
                          : "0.0"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowPreviewModal(false)}
              >
                Cancel
              </button>
              <button style={styles.downloadButton} onClick={generateReportPDF}>
                <svg
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
