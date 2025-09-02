import React, { useState } from "react";
import {
  Home,
  Droplets,
  Users,
  FileText,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Package2,
} from "lucide-react";

import { BeakerIcon } from "@primer/octicons-react";

const SidePanel = ({ isOpen, onToggle, activeScreen, onNavigate }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      screen: "dashboard",
    },
    {
      id: "blood-stock",
      label: "Blood Stock",
      icon: Droplets,
      hasSubmenu: true,
      submenu: [
        {
          id: "red-blood-cell",
          label: "Red Blood Cell",
          screen: "red-blood-cell",
        },
        { id: "plasma", label: "Plasma", screen: "plasma" },
        { id: "platelet", label: "Platelet", screen: "platelet" },
      ],
    },
    {
      id: "released-blood",
      label: "Released Blood",
      icon: Package2,
      screen: "released-blood",
    },
    {
      id: "non-conforming",
      label: "Non-Conforming",
      icon: BeakerIcon,
      hasSubmenu: true,
      submenu: [
        {
          id: "red-blood-cell-nc",
          label: "Red Blood Cell",
          screen: "red-blood-cell-nc",
        },
        { id: "plasma-nc", label: "Plasma", screen: "plasma-nc" },
        { id: "platelet-nc", label: "Platelet", screen: "platelet-nc" },
      ],
    },
    {
      id: "donor-record",
      label: "Donor Record",
      icon: Users,
      screen: "donor-record",
    },
    {
      id: "invoice",
      label: "Invoice",
      icon: FileText,
      screen: "invoice",
    },
    {
      id: "reports",
      label: "Reports",
      icon: TrendingUp,
      screen: "reports",
    },
    {
      id: "recent-activity",
      label: "Recent Activity",
      icon: Clock,
      screen: "recent-activity",
    },
  ];

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      if (isOpen) {
        setExpandedMenus(prev => ({
          ...prev,
          [item.id]: !prev[item.id]
        }));
      }
      else {
        onToggle();
        setExpandedMenus(prev => ({
          ...prev,
          [item.id]: true
        }));
      }
    } else {
      onNavigate(item.screen);
      if (window.innerWidth < 768) {
        onToggle();
      }
    }
  };

  const handleSubmenuClick = (screen) => {
    onNavigate(screen);
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const isActive = (item) => {
    return (
      activeScreen === item.screen ||
      (item.hasSubmenu &&
        item.submenu?.some((sub) => sub.screen === activeScreen))
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="side-panel-overlay" onClick={onToggle} />}

      {/* Side Panel */}
      <div className={`side-panel-container ${isOpen ? "open" : "closed"}`}>
        {/* Toggle Button - Outside the header container */}
        <button onClick={onToggle} className="side-panel-toggle-btn">
          {isOpen ? (
            <ChevronLeft className="side-panel-toggle-icon" />
          ) : (
            <ChevronRight className="side-panel-toggle-icon"
            />
          )}
        </button>

        <div className="side-panel-header">
          <div className="side-panel-brand">
            {isOpen ? (
              <img
                src="/assets/Logo1.png"
                alt="BloodSync Logo"
                className="side-panel-logo"
              />
            ) : (
              <img
                src="/assets/Icon.png"
                alt="BloodSync Icon"
                className="side-panel-icon"
              />
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="side-panel-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const isExpanded = expandedMenus[item.id] || false;

            return (
              <div key={item.id} className="side-panel-menu-item">
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`side-panel-menu-btn ${active ? "active" : ""}`}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={!isOpen ? item.label : ""}
                >
                  <div className="side-panel-menu-content">
                    <Icon className="side-panel-menu-icon" />
                    {isOpen && (
                      <span className="side-panel-menu-label">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {item.hasSubmenu &&
                    isOpen &&
                    (isExpanded ? (
                      <ChevronDown className="side-panel-chevron" />
                    ) : (
                      <ChevronRight className="side-panel-chevron" />
                    ))}
                </button>

                {/* Tooltip for closed state */}
                {!isOpen && hoveredItem === item.id && (
                  <div className="side-panel-tooltip">
                    {item.label}
                    {item.hasSubmenu && isExpanded && (
                      <div className="side-panel-submenu-tooltip">
                        {item.submenu.map((subItem) => (
                          <div
                            key={subItem.id}
                            className="side-panel-submenu-tooltip-item"
                          >
                            {subItem.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Submenu */}
                {item.hasSubmenu && isOpen && (
                  <div
                    className={`side-panel-submenu ${isExpanded ? "expanded" : ""}`}
                  >
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubmenuClick(subItem.screen)}
                        className={`side-panel-submenu-btn ${activeScreen === subItem.screen ? "active" : ""}`}
                        title={subItem.label}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

       
        {isOpen && (
          <div className="side-panel-footer">
            <p className="side-panel-copyright">
              2025 © Copyright Code Red Corporation ver. 1.0
            </p>
          </div>
        )}
      </div>

      <style>{`
        .side-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 40;
          opacity: 1;
          visibility: visible;
          transition:
            opacity 0.3s ease,
            visibility 0.3s ease;
        }

        @media (min-width: 768px) {
          .side-panel-overlay {
            display: none;
          }
        }

        .side-panel-container {
          position: fixed;
          left: 0;
          top: 0;
          height: 100%;
          background-color: #165c3c;
          color: white;
          z-index: 50;
          transition:
            width 0.3s ease-in-out,
            transform 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        }

        .side-panel-container.open {
          width: 15rem;
          transform: translateX(0);
        }

        .side-panel-container.closed {
          width: 4rem;
          transform: translateX(0);
        }

        @media (max-width: 767px) {
          .side-panel-container.open {
            width: 15rem;
            transform: translateX(0);
          }

          .side-panel-container.closed {
            width: 0;
            transform: translateX(-100%);
          }
        }

        .side-panel-toggle-btn {
          position: absolute;
          top: 1.4rem;
          right: -0.7rem;
          padding: 0.2rem;
          background-color: #93C242;
          border: none;
          border-radius: 100%;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.1rem;
          height: 1.1rem;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        }

        .side-panel-toggle-btn:hover {
          background-color: #ffcf35;
          color: #165c3c;
        }

        .side-panel-toggle-icon {
          width: 1rem;
          height: 1rem;
        }

        .side-panel-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          border-bottom: 4px solid #93c242;
          min-height: 3rem;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }
        
        .side-panel-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        
        .side-panel-logo {
          max-height: 5rem;
          max-width: 13rem;
          width: auto;
          height: auto;
          object-fit: contain;
          pointer-events: none;
          margin: -1rem;
        }
        
        .side-panel-icon {
          width: 2.5rem;
          height: 2.5rem;
          object-fit: contain;
          pointer-events: none;
          margin: -.2rem;
        }

        .side-panel-nav {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .side-panel-menu-item {
          position: relative;
          width: 100%;
        }

        .side-panel-menu-btn {
          width: ${isOpen ? "calc(100% - 1rem)" : "calc(100% - 0.5rem)"};
          display: flex;
          align-items: center;
          justify-content: ${isOpen ? "space-between" : "center"};
          padding: ${isOpen ? "0.75rem 1rem" : "0.75rem 0.5rem"};
          margin: ${isOpen ? "0 0.5rem" : "0 0.25rem"};
          text-align: left;
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          overflow: hidden;
          border-radius: 7px;
        }

        .side-panel-menu-btn:hover {
          background-color: rgba(255, 207, 53, 0.2);
          color: #ffcf35;
        }

        .side-panel-menu-btn.active {
          background-color: #ffcf35;
          color: #165c3c;
          font-weight: 600;
        }

        .side-panel-menu-content {
          display: flex;
          align-items: center;
          gap: ${isOpen ? "0.75rem" : "0"};
          min-width: 0;
        }

        .side-panel-menu-icon {
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
          margin: 0 auto;
        }

        .side-panel-menu-label {
          font-size: 0.875rem;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .side-panel-chevron {
          width: 1rem;
          height: 1rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .side-panel-menu-btn.active .side-panel-chevron {
          color: #165c3c;
        }

        .side-panel-tooltip {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          background-color: #15803d;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          white-space: nowrap;
          z-index: 60;
          margin-left: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .side-panel-submenu-tooltip {
          position: absolute;
          left: 100%;
          top: 0;
          background-color: #15803d;
          border-radius: 0.375rem;
          padding: 0.5rem;
          margin-left: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .side-panel-submenu-tooltip-item {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          white-space: nowrap;
          border-radius: 0.25rem;
        }

        .side-panel-submenu-tooltip-item:hover {
          background-color: #93c242;
        }

        .side-panel-submenu {
          background-color: rgba(21, 128, 61, 0.8);
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.3s ease-in-out;
          margin: 0 0.5rem;
          border-radius: 0 0 8px 8px;
        }

        .side-panel-submenu.expanded {
          max-height: 200px;
        }

        .side-panel-submenu-btn {
          width: 100%;
          text-align: left;
          padding: 0.6rem 1rem 0.6rem 3rem;
          font-size: 0.875rem;
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          transition: background-color 0.2s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .side-panel-submenu-btn:hover {
          background-color: rgba(147, 194, 66, 0.3);
          color: #ffcf35;
        }

        .side-panel-submenu-btn.active {
          background-color: #93c242;
          color: #165c3c;
          font-weight: 500;
        }

        .side-panel-footer {
          padding: 1rem;
          border-top: 1px solid #22c55e;
          font-family: Arial;
        }

        .side-panel-copyright {
          font-size: 0.6rem;
          color: #bbf7d0;
          margin: 0;
          text-align: center;
        }

        .side-panel-nav::-webkit-scrollbar {
          width: 4px;
        }

        .side-panel-nav::-webkit-scrollbar-track {
          background: #15803d;
        }

        .side-panel-nav::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 2px;
        }

        .side-panel-nav::-webkit-scrollbar-thumb:hover {
          background: #ffcf35;
        }
      `}</style>
    </>
  );
};

export default SidePanel;