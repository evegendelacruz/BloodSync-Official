import React from "react";

const Loader = () => {
  const styles = {
    container: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "rgba(0, 0, 0, 0.5)",
      zIndex: 9999,
    },
    loaderBox: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "20px",
      width: "200px",
      height: "200px",
      background: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    },
    dotsContainer: {
      display: "flex",
      gap: "12px",
    },
    dot: {
      width: "16px",
      height: "16px",
      borderRadius: "50%",
    },
    dot1: {
      background: "#43a047",
      animation: "bounce 1.4s infinite ease-in-out both",
      animationDelay: "0s",
    },
    dot2: {
      background: "#fdd835",
      animation: "bounce 1.4s infinite ease-in-out both",
      animationDelay: "0.2s",
    },
    dot3: {
      background: "#cddc39",
      animation: "bounce 1.4s infinite ease-in-out both",
      animationDelay: "0.4s",
    },
    loadingText: {
      color: "#43a047",
      fontSize: "18px",
      fontWeight: "600",
      fontFamily: "Arial, sans-serif",
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            }
            40% { 
              transform: scale(1);
            }
          }
        `}
      </style>

      <div style={styles.container}>
        <div style={styles.loaderBox}>
          <div style={styles.dotsContainer}>
            <div style={{ ...styles.dot, ...styles.dot1 }}></div>
            <div style={{ ...styles.dot, ...styles.dot2 }}></div>
            <div style={{ ...styles.dot, ...styles.dot3 }}></div>
          </div>
          <div style={styles.loadingText}>Loading</div>
        </div>
      </div>
    </>
  );
};

export default Loader;