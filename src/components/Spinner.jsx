import React from "react";

const Spinner = () => {
  const styles = {
    spinner: {
      position: "relative",
      width: "100px",
      height: "100px",
      margin: "50px auto",
      animation: "spin 3s linear infinite",
    },
    center: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "40px",
      height: "40px",
      background: "#195c3b",
      borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
      transform: "translate(-50%, -50%) rotate(45deg)",
      zIndex: 2,
    },
    leaf: {
      position: "absolute",
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      clipPath: "polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%, 0 60%)",
    },
    leaf1: {
      top: 0,
      left: 0,
      background: "#4caf50",
    },
    leaf2: {
      top: 0,
      right: 0,
      background: "#fdd835",
    },
    leaf3: {
      bottom: 0,
      right: 0,
      background: "#43a047",
    },
    leaf4: {
      bottom: 0,
      left: 0,
      background: "#cddc39",
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={styles.spinner}>
        <div style={styles.center}></div>
        <div style={{ ...styles.leaf, ...styles.leaf1 }}></div>
        <div style={{ ...styles.leaf, ...styles.leaf2 }}></div>
        <div style={{ ...styles.leaf, ...styles.leaf3 }}></div>
        <div style={{ ...styles.leaf, ...styles.leaf4 }}></div>
      </div>
    </>
  );
};

export default Spinner;
