import React, { useState, useEffect, useRef } from "react";
import { Search, Filter } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "../../../components/Loader";


const ReleasedInvoice = () => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "sort", direction: "asc" });
  const [filterConfig, setFilterConfig] = useState({ field: "", value: "" });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const sortDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState({
    title: "",
    description: "",
  });
  const [deleting, setDeleting] = useState(false);
  const [hoverStates, setHoverStates] = useState({});

const handleMouseEnter = (key) => {
  setHoverStates((prev) => ({ ...prev, [key]: true }));
};

const handleMouseLeave = (key) => {
  setHoverStates((prev) => ({ ...prev, [key]: false }));
};

  useEffect(() => {
    loadInvoiceData();
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

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.electronAPI) {
        throw new Error("Electron API not available");
      }

      const data = await window.electronAPI.getAllReleasedBloodInvoices();
      setInvoiceData(data);
    } catch (err) {
      console.error("Error loading invoice data:", err);
      setError(`Failed to load invoice data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

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
      invoiceId: "Invoice ID",
      receivingFacility: "Receiving Facility",
      classification: "Classification",
      dateOfRelease: "Date of Release",
      releasedBy: "Released By",
      referenceNumber: "Reference Number",
    };
    return labels[sortConfig.key] || "Sort by";
  };

  const filteredData = invoiceData.filter(
    (item) =>
      item.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receivingFacility?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.classification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.releasedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSortedAndFilteredData = () => {
    let filtered = [...filteredData];

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

  const displayData = getSortedAndFilteredData();

  const toggleRowSelection = (id) => {
    setInvoiceData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = displayData.every((item) => item.selected);
    setInvoiceData((prevData) =>
      prevData.map((item) => {
        if (displayData.find((d) => d.id === item.id)) {
          return { ...item, selected: !allSelected };
        }
        return item;
      })
    );
  };

  const clearAllSelection = () => {
    setInvoiceData((prevData) =>
      prevData.map((item) => ({ ...item, selected: false }))
    );
  };

  const handleDeleteClick = () => {
    const selectedIds = invoiceData.filter((item) => item.selected).map((item) => item.id);
    if (selectedIds.length === 0) return;
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setShowDeleteModal(false);
      setDeleting(true); // Show loader
      
      if (!window.electronAPI) {
        setError("Electron API not available");
        setDeleting(false);
        return;
      }
      
      const selectedIds = invoiceData.filter((item) => item.selected).map((item) => item.id);
      if (selectedIds.length === 0) {
        setDeleting(false);
        return;
      }
      
      await window.electronAPI.deleteReleasedBloodInvoices(selectedIds);
      
      clearAllSelection();
      await loadInvoiceData();
      setError(null);
      
      // Show delete success modal
      setDeleteSuccessMessage({
        title: "Invoice Deleted Successfully!",
        description: `${selectedIds.length} invoice${selectedIds.length > 1 ? 's have' : ' has'} been removed from the system.`,
      });
      setDeleting(false);
      setShowDeleteSuccessModal(true);
    } catch (err) {
      console.error("Error deleting invoices:", err);
      setError(`Failed to delete invoices: ${err.message}`);
      setDeleting(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not available");
        return;
      }

      const invoiceDetails =
        await window.electronAPI.viewReleasedBloodInvoice(invoiceId);
      setPreviewInvoice(invoiceDetails);
      setShowPreviewModal(true);
    } catch (err) {
      console.error("Error loading invoice:", err);
      setError(`Failed to load invoice: ${err.message}`);
    }
  };

  const generateInvoicePDF = () => {
    if (!previewInvoice) return;

    const { header, items } = previewInvoice;

    // Create PDF with folio size (8.5 x 13 inches)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: [8.5, 13],
    });

    // Load logos
    const dohMainLogo = "./assets/doh-main-logo.jpg";
    const dohPurpleLogo = "./assets/doh-purple-logo.png";
    const bagongPilipinasLogo = "./assets/bagong-pilipinas-logo.png";

    // Add logos at the top - THREE LOGOS IN A ROW (matching template exactly)
    try {
      // Left logo (DOH Republic seal) - 1.0 x 1.0 inches
      doc.addImage(dohMainLogo, "JPEG", 0.5, 0.3, 1.0, 1.0);

      // Center logo (DOH purple) - 1.0 x 1.0 inches
      doc.addImage(dohPurpleLogo, "PNG", 1.7, 0.3, 0.97, 0.97);

      // Right logo (Bagong Pilipinas) - 1.4 x 1.3 inches (larger, matching template)
      doc.addImage(bagongPilipinasLogo, "PNG", 2.7, 0.15, 1.4, 1.3);
    } catch (e) {
      console.error("Error loading logos:", e);
    }

    // Header text section - positioned to the RIGHT of Bagong Pilipinas logo
    const textStartX = 4.25;
    const textStartY = 0.4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("DEPARTMENT OF HEALTH", textStartX, textStartY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(
      "CENTER FOR HEALTH DEVELOPMENT- NORTHERN MINDANAO",
      textStartX,
      textStartY + 0.16
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
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
    // Email address - label in black, email in blue
    doc.setTextColor(0, 0, 0);
    doc.text("Email address: ", textStartX, textStartY + 0.68);
    const emailLabelWidth = doc.getTextWidth("Email address: ");
    doc.setTextColor(0, 115, 230); // Blue color #0073e6
    doc.text(
      "pacd@ro10.doh.gov.ph",
      textStartX + emailLabelWidth,
      textStartY + 0.68
    );

    // Website - label in black, URL in blue
    doc.setTextColor(0, 0, 0);
    doc.text("Website: ", textStartX, textStartY + 0.79);
    const websiteLabelWidth = doc.getTextWidth("Website: ");
    doc.setTextColor(0, 115, 230); // Blue color #0073e6
    doc.text(
      "http://www.ro10.doh.gov.ph",
      textStartX + websiteLabelWidth,
      textStartY + 0.79
    );

    // Title - centered and bold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(
      "NORTHERN MINDANAO REGIONAL BLOOD CENTER HUBBING FORM",
      4.25,
      1.75,
      { align: "center" }
    );

    // Date and Reference info - on same line with underlines
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Date:", 0.5, 2.1);
    doc.setFont("helvetica", "normal");
    const dateText = header.dateOfRelease;
    doc.text(dateText, 0.9, 2.1);
    const dateWidth = doc.getTextWidth(dateText);
    doc.setLineWidth(0.01);
    doc.line(0.9, 2.13, 0.9 + dateWidth, 2.13);

    doc.setFont("helvetica", "bold");
    doc.text("Reference no:", 4.7, 2.1);
    doc.setFont("helvetica", "normal");
    const refText = header.referenceNumber || header.invoiceId;
    const refStartX = 5.8;
    const maxRefWidth = 8.0 - refStartX; // Max width to right margin (8.5 - 0.5 margin)
    
    // Truncate if too long and add ellipsis
    let displayRefText = refText;
    let refWidth = doc.getTextWidth(displayRefText);
    
    if (refWidth > maxRefWidth) {
      while (refWidth > maxRefWidth && displayRefText.length > 0) {
        displayRefText = displayRefText.slice(0, -1);
        refWidth = doc.getTextWidth(displayRefText + "...");
      }
      displayRefText += "...";
    }
    
    doc.text(displayRefText, refStartX, 2.1);
    refWidth = doc.getTextWidth(displayRefText);
    doc.line(refStartX, 2.13, refStartX + refWidth, 2.13);

    // Hospital info with underline
    doc.setFont("helvetica", "bold");
    doc.text("Hospital:", 0.5, 2.35);
    doc.setFont("helvetica", "normal");
    const hospitalText = header.receivingFacility;
    doc.text(hospitalText, 1.15, 2.35);
    const hospitalWidth = doc.getTextWidth(hospitalText);
    doc.line(1.15, 2.38, 1.15 + hospitalWidth, 2.38);

    // Table data
    const tableData = items.map((item, index) => [
      index + 1,
      item.serialId,
      `${item.bloodType}${item.rhFactor}`,
      item.dateOfCollection,
      item.dateOfExpiration,
      `${item.volume} ML`,
      item.remarks || "",
    ]);

    // Create table using autoTable - matching template exactly
    autoTable(doc, {
      startY: 2.55,
      head: [
        [
          "NO.",
          "SERIAL NO.",
          "BLOOD\nTYPE",
          "DATE OF\nCOLLECTION",
          "DATE OF\nEXPIRY",
          "VOLUME",
          "REMARKS",
        ],
      ],
      body: tableData,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 0.05,
        lineColor: [0, 0, 0],
        lineWidth: 0.01,
        halign: "center",
        valign: "middle",
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [201, 201, 201],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        fontSize: 8,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 0.4 }, // NO.
        1: { cellWidth: 1.5 }, // SERIAL NO.
        2: { cellWidth: 0.7 }, // BLOOD TYPE
        3: { cellWidth: 1.1 }, // DATE OF COLLECTION
        4: { cellWidth: 1.1 }, // DATE OF EXPIRY
        5: { cellWidth: 0.7 }, // VOLUME
        6: { cellWidth: "auto" }, // REMARKS
      },
      margin: { left: 0.5, right: 0.5 },
    });

    // Footer section
    const finalY = doc.lastAutoTable.finalY + 40 / 72;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Left side - Prepared by
    doc.text("PREPARED BY:", 0.5, finalY);
    doc.setFont("helvetica", "normal");
    const preparedByText = header.preparedBy || "";
    doc.text(preparedByText, 0.5, finalY + 0.25);
    const preparedByWidth = Math.max(doc.getTextWidth(preparedByText), 2.5);
    doc.setLineWidth(0.01);
    doc.line(0.5, finalY + 0.28, 0.5 + preparedByWidth, finalY + 0.28);

    // Verified by
    doc.setFont("helvetica", "bold");
    doc.text("VERIFIED BY:", 0.5, finalY + 0.65);
    doc.setFont("helvetica", "normal");
    const verifiedByText = header.verifiedBy || "";
    doc.text(verifiedByText, 0.5, finalY + 0.9);
    const verifiedByWidth = Math.max(doc.getTextWidth(verifiedByText), 2.5);
    doc.line(0.5, finalY + 0.93, 0.5 + verifiedByWidth, finalY + 0.93);

    // Right side - Received by 
    doc.setFont("helvetica", "bold");
    doc.text("RECEIVED BY:", 5.3, finalY);

    doc.setFont("helvetica", "normal");
    const receivedByText = header.receivedBy || header.authorizedRecipient || "";
    doc.text(receivedByText, 5.3, finalY + 0.25);

    doc.setLineWidth(0.01);
    doc.line(5.3, finalY + 0.28, 7.9, finalY + 0.28);

    // Label below the underline
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const centerXReceived = 5.3 + (7.9 - 5.3) / 2; // center under the underline
    doc.text("Name/Signature/Date", centerXReceived, finalY + 0.45, { align: "center" });


    // Note at bottom - Bold "NOTE:" and normal rest
    const noteY = 12.5;
    const noteText = "NOTE:";
    const restText =
      " All blood bags are properly screened and are NON-REACTIVE to HIV, HBV, HCV, SYPHILIS AND MALARIA";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    const noteWidth = doc.getTextWidth(noteText);

    doc.setFont("helvetica", "normal");
    const restWidth = doc.getTextWidth(restText);

    const totalWidth = noteWidth + restWidth;
    const startX = 4.25 - totalWidth / 2;

    doc.setFont("helvetica", "bold");
    doc.text(noteText, startX, noteY);

    doc.setFont("helvetica", "normal");
    doc.text(restText, startX + noteWidth, noteY);

    // Save PDF
    doc.save(`Invoice-${header.invoiceId}.pdf`);

    // Close modal after download
    setShowPreviewModal(false);
  };

  // Preview modal styles
  const previewModalStyles = {
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
    closeButton: {
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
      height: "13in",
      padding: "0.5in", // Matching PDF margins
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      fontFamily: "Arial, sans-serif",
      margin: "0 auto",
      boxSizing: "border-box",
      position: "relative",
    },
    logoContainer: {
      display: "flex",
      alignItems: "flex-start",
      marginBottom: "20px",
      gap: "15px",
    },
    headerTextSection: {
      flex: 1,
      paddingTop: "5px",
    },
    departmentTitle: {
      fontSize: "10px",
      margin: "2px 0",
      color: "#000",
      fontFamily: "Arial, sans-serif",
    },
    centerTitle: {
      fontSize: "9px",
      fontWeight: "bold",
      margin: "2px 0",
      color: "#000",
      fontFamily: "Arial, sans-serif",
    },
    addressText: {
      fontSize: "8px",
      margin: "1px 0",
      color: "#000",
      fontFamily: "Arial, sans-serif",
      lineHeight: "1.3",
    },
    formTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      marginTop: "15px",
      marginBottom: "20px",
      textAlign: "center",
      color: "#000",
      fontFamily: "Arial, sans-serif",
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
      fontSize: "11px",
      fontFamily: "Arial, sans-serif",
    },
    infoLabel: {
      fontWeight: "bold",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "15px",
      fontSize: "10px",
      fontFamily: "Arial, sans-serif",
    },
    tableHeader: {
      backgroundColor: "#c9c9c9",
      fontWeight: "bold",
      border: "1px solid #000",
      padding: "6px",
      textAlign: "center",
      fontSize: "9px",
    },
    tableCell: {
      border: "1px solid #000",
      padding: "6px",
      textAlign: "center",
      fontSize: "9px",
    },
    footerSection: {
      marginTop: "30px",
      display: "flex",
      justifyContent: "space-between",
      fontSize: "11px",
      fontFamily: "Arial, sans-serif",
    },
    signatureBlock: {
      width: "45%",
    },
    signatureLine: {
      borderBottom: "1px solid #000",
      display: "inline-block",
      minWidth: "200px",
    },
    noteSection: {
      marginTop: "30px",
      fontSize: "9px",
      color: "#000",
      fontWeight: "normal",
      textAlign: "center",
      fontFamily: "Arial, sans-serif",
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
      marginBottom: "20px",
    },
    successTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#165C3C",
      textAlign: "center",
      fontFamily: "Barlow",
      marginBottom: "10px",
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
      marginBottom: "20px",
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

  const selectedCount = displayData.filter((item) => item.selected).length;
  const allSelected = displayData.length > 0 && displayData.every((item) => item.selected);
  const someSelected = displayData.some((item) => item.selected) && !allSelected;

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
    },
    leftControls: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
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
      width: "300px",
      fontSize: "14px",
      outline: "none",
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
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
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
      borderBottom: "1px solid #A3A3A3",
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
      borderBottom: "1px solid rgba(163, 163, 163, 0.2)",
    },
    viewInvoiceLink: {
      color: "#3b82f6",
      textDecoration: "none",
      fontSize: "11px",
      fontWeight: "400",
      cursor: "pointer",
    },
    checkbox: {
      width: "16px",
      height: "16px",
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
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
      fontSize: "16px",
      color: "#6b7280",
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
    refreshButton: {
      backgroundColor: "#059669",
      color: "white",
      border: "none",
      padding: "4px 8px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
    },
  };

  if (loading || deleting) {
    return <Loader />;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Released Blood Invoice</h1>
        <p style={styles.subtitle}>Blood Hubbing Form</p>
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
          <button style={styles.refreshButton} onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.leftControls}>
          {/* Search */}
          <div style={styles.searchContainer}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search"
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
                minWidth: "100px"
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
                  { key: "invoiceId", label: "Invoice ID" },
                  { key: "receivingFacility", label: "Receiving Facility" },
                  { key: "classification", label: "Classification" },
                  { key: "dateOfRelease", label: "Date of Release" },
                  { key: "releasedBy", label: "Released By" },
                  { key: "referenceNumber", label: "Reference Number" },
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
                transition: "all 0.2s ease"
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
                      <option value="invoiceId">Invoice ID</option>
                      <option value="receivingFacility">Receiving Facility</option>
                      <option value="classification">Classification</option>
                      <option value="releasedBy">Released By</option>
                      <option value="referenceNumber">Reference Number</option>
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
          {/* Right side buttons can go here if needed */}
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: "3%" }}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={toggleAllSelection}
                />
              </th>
              <th style={{ ...styles.th, width: "11%" }}>INVOICE ID</th>
              <th style={{ ...styles.th, width: "23%" }}>RECEIVING FACILITY</th>
              <th style={{ ...styles.th, width: "11%" }}>CLASSIFICATION</th>
              <th style={{ ...styles.th, width: "12%" }}>DATE OF RELEASE</th>
              <th style={{ ...styles.th, width: "14%" }}>RELEASED BY</th>
              <th style={{ ...styles.th, width: "14%" }}>REFERENCE NUMBER</th>
              <th style={{ ...styles.th, width: "8%" }}>INVOICE</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{ ...styles.td, textAlign: "center", padding: "40px" }}
                >
                  {searchTerm || filterConfig.value
                    ? "No invoices found matching your criteria"
                    : "No invoices found"}
                </td>
              </tr>
            ) : (
              displayData.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    ...(index % 2 === 1 ? styles.trEven : {}),
                    ...(item.selected ? styles.trSelected : {}),
                  }}
                >
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={item.selected}
                      onChange={() => toggleRowSelection(item.id)}
                    />
                  </td>
                  <td style={styles.td}>{item.invoiceId}</td>
                  <td style={styles.td}>{item.receivingFacility}</td>
                  <td style={styles.td}>{item.classification}</td>
                  <td style={styles.td}>{item.dateOfRelease}</td>
                  <td style={styles.td}>{item.releasedBy}</td>
                  <td style={styles.td}>{item.referenceNumber}</td>
                  <td style={{ ...styles.td, width: "10%" }}>
                      <a
                      href="#"
                      style={styles.viewInvoiceLink}
                      onClick={(e) => {
                        e.preventDefault();
                        handleViewInvoice(item.id);
                      }}
                    >
                      View Invoice
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

          <button style={styles.deleteButton} onClick={handleDeleteClick}>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "400px", width: "90%", boxShadow: "0 20px 25px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", backgroundColor: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" fill="#dc2626" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", margin: "0 0 8px 0", fontFamily: "Barlow" }}>
                  Delete Invoice{selectedCount > 1 ? "s" : ""}?
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, fontFamily: "Barlow" }}>
                  Are you sure you want to delete {selectedCount} invoice{selectedCount > 1 ? "s" : ""}? This action cannot be undone.
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "8px" }}>
                <button
                  style={{ flex: 1, padding: "10px 20px", backgroundColor: "white", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", fontFamily: "Barlow" }}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  style={{ flex: 1, padding: "10px 20px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", fontFamily: "Barlow" }}
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccessModal && (
        <div style={previewModalStyles.successModalOverlay}>
          <div style={previewModalStyles.successModal}>
            <button
              style={{
                ...previewModalStyles.successCloseButton,
                ...(hoverStates.deleteSuccessClose
                  ? previewModalStyles.successCloseButtonHover
                  : {}),
              }}
              onClick={() => setShowDeleteSuccessModal(false)}
              onMouseEnter={() => handleMouseEnter("deleteSuccessClose")}
              onMouseLeave={() => handleMouseLeave("deleteSuccessClose")}
            >
              ×
            </button>

            <div style={previewModalStyles.successIcon}>
              <svg width="48" height="48" fill="white" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h3 style={previewModalStyles.successTitle}>{deleteSuccessMessage.title}</h3>
            <p style={previewModalStyles.successDescription}>
              {deleteSuccessMessage.description}
            </p>

            <button
              style={{
                ...previewModalStyles.successOkButton,
                ...(hoverStates.deleteSuccessOk ? previewModalStyles.successOkButtonHover : {}),
              }}
              onClick={() => setShowDeleteSuccessModal(false)}
              onMouseEnter={() => handleMouseEnter("deleteSuccessOk")}
              onMouseLeave={() => handleMouseLeave("deleteSuccessOk")}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewInvoice && (
        <div
          style={previewModalStyles.modalOverlay}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            style={previewModalStyles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={previewModalStyles.modalHeader}>
              <div>
                <h3 style={previewModalStyles.modalTitle}>Invoice Preview</h3>
                <p style={previewModalStyles.modalSubtitle}>
                  Blood Hubbing Form
                </p>
              </div>
              <button
                style={previewModalStyles.closeButton}
                onClick={() => setShowPreviewModal(false)}
              >
                ×
              </button>
            </div>

            <div style={previewModalStyles.modalContent}>
              <div style={previewModalStyles.previewContainer}>
                {/* Header Section with THREE logos in a row and text on the right - MATCHING TEMPLATE 100% */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "25px",
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
                        fontFamily: "Arial, sans-serif",
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
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      CENTER FOR HEALTH DEVELOPMENT- NORTHERN MINDANAO
                    </div>
                    <div
                      style={{
                        fontSize: "8.5px",
                        margin: "2px 0",
                        color: "#000",
                        fontFamily: "Arial, sans-serif",
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
                        fontFamily: "Arial, sans-serif",
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
                        fontFamily: "Arial, sans-serif",
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
                        fontFamily: "Arial, sans-serif",
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
                        fontFamily: "Arial, sans-serif",
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

                {/* Title */}
                <div style={previewModalStyles.formTitle}>
                  NORTHERN MINDANAO REGIONAL BLOOD CENTER HUBBING FORM
                </div>

                {/* Info Section */}
                <div style={previewModalStyles.infoRow}>
                  <div>
                    <span style={previewModalStyles.infoLabel}>Date:</span>{" "}
                    <span
                      style={{
                        borderBottom: "1px solid #000",
                        display: "inline-block",
                      }}
                    >
                      {previewInvoice.header.dateOfRelease}
                    </span>
                  </div>
                  <div>
                    <span style={previewModalStyles.infoLabel}>
                      Reference no:
                    </span>{" "}
                    <span
                      style={{
                        borderBottom: "1px solid #000",
                        display: "inline-block",
                      }}
                    >
                      {previewInvoice.header.referenceNumber ||
                        previewInvoice.header.invoiceId}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: "15px",
                    fontSize: "11px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  <span style={previewModalStyles.infoLabel}>Hospital:</span>{" "}
                  <span
                    style={{
                      borderBottom: "1px solid #000",
                      display: "inline-block",
                    }}
                  >
                    {previewInvoice.header.receivingFacility}
                  </span>
                </div>

                {/* Table */}
                <table style={previewModalStyles.table}>
                  <thead>
                    <tr>
                      <th style={previewModalStyles.tableHeader}>NO.</th>
                      <th style={previewModalStyles.tableHeader}>SERIAL NO.</th>
                      <th style={previewModalStyles.tableHeader}>
                        BLOOD
                        <br />
                        TYPE
                      </th>
                      <th style={previewModalStyles.tableHeader}>
                        DATE OF
                        <br />
                        COLLECTION
                      </th>
                      <th style={previewModalStyles.tableHeader}>
                        DATE OF
                        <br />
                        EXPIRY
                      </th>
                      <th style={previewModalStyles.tableHeader}>VOLUME</th>
                      <th style={previewModalStyles.tableHeader}>REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td style={previewModalStyles.tableCell}>
                          {index + 1}
                        </td>
                        <td style={previewModalStyles.tableCell}>
                          {item.serialId}
                        </td>
                        <td style={previewModalStyles.tableCell}>
                          {item.bloodType}
                          {item.rhFactor}
                        </td>
                        <td style={previewModalStyles.tableCell}>
                          {item.dateOfCollection}
                        </td>
                        <td style={previewModalStyles.tableCell}>
                          {item.dateOfExpiration}
                        </td>
                        <td style={previewModalStyles.tableCell}>
                          {item.volume} ML
                        </td>
                        <td style={previewModalStyles.tableCell}>
                          {item.remarks || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer Section */}
                <div
                  style={{
                    marginTop: "40px",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    fontFamily: "Arial, sans-serif",
                    minHeight: "120px",
                  }}
                >
                  <div style={{ width: "45%" }}>
                    <div style={{ marginBottom: "25px" }}>
                      <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
                        PREPARED BY:
                      </div>
                      <div style={{ marginTop: "15px" }}>
                        {previewInvoice.header.preparedBy || ""}
                      </div>
                      <div
                        style={{
                          borderBottom: "1px solid #000",
                          marginTop: "2px",
                        }}
                      ></div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
                        VERIFIED BY:
                      </div>
                      <div style={{ marginTop: "15px" }}>
                        {previewInvoice.header.verifiedBy || ""}
                      </div>
                      <div
                        style={{
                          borderBottom: "1px solid #000",
                          marginTop: "2px",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div style={{ width: "45%" }}>
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
                        RECEIVED BY:
                      </div>
                      <div style={{ marginTop: "15px" }}>
                        {previewInvoice.header.receivedBy ||
                          previewInvoice.header.authorizedRecipient ||
                          ""}
                      </div>
                      <div
                        style={{
                          borderBottom: "1px solid #000",
                          marginTop: "2px",
                          width: "100%",
                        }}
                      ></div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontStyle: "italic",
                          marginTop: "5px",
                          textAlign: "center",
                        }}
                      >
                        Name/Signature/Date
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "0.5in",
                    left: "0.5in",
                    right: "0.5in",
                    fontSize: "9px",
                    color: "#000",
                    textAlign: "center",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  <strong>NOTE:</strong> All blood bags are properly screened
                  and are NON-REACTIVE to HIV, HBV, HCV, SYPHILIS AND MALARIA
                </div>
              </div>
            </div>

            <div style={previewModalStyles.modalFooter}>
              <button
                style={previewModalStyles.cancelButton}
                onClick={() => setShowPreviewModal(false)}
              >
                Cancel
              </button>
              <button
                style={previewModalStyles.downloadButton}
                onClick={generateInvoicePDF}
              >
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

export default ReleasedInvoice;