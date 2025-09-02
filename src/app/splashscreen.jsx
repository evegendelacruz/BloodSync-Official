import React, { useEffect, useState } from "react";
import Logo from "../assets/Logo.png"; 

const Splashscreen = () => {
  const [progress, setProgress] = useState(0);

  // Fake loading progress for splash effect
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100); // update every 100ms
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        backgroundColor: "#165c3c", // background color
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        
      }
    }
    >
      {/* Logo */}
      <img
        src={Logo}
        alt="App Logo"
        style={{ width: "30%", height: "auto", marginBottom: "30px" }}
      />

      {/* Progress bar container */}
      <div
        style={{
          width: "30%",
          maxWidth: "400px",
          height: "12px",
          background: "rgba(255,255,255,0.3)",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#93C242",
            transition: "width 0.2s ease",
          }}
        />
      </div>

      <p style={{ marginTop: "15px", color: "#fff", fontFamily: "Barlow" }}>
        Loading... {progress}%
      </p>
    </div>
  );
};

export default Splashscreen;
