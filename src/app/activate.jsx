

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const Activate = () => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (!token) {
      setMessage("Activation token is missing.");
      setStatus("error");
      return;
    }

    // Check if running in Electron or browser
    const activateUser = async () => {
      try {
        let success = false;

        // Try Electron IPC first (if available)
        if (window.electronAPI && window.electronAPI.activateUserByToken) {
          success = await window.electronAPI.activateUserByToken(token);
        } else {
          // Fallback to HTTP API for web browser
          const response = await fetch(`http://localhost:3001/api/activate?token=${token}`, {
            method: "GET"
          });
          const data = await response.json();
          success = data.success;
        }

        if (success) {
          setMessage("New User Registered Successfully!");
          setStatus("success");
          // Store activation status and token for registration page/modal
          localStorage.setItem('activationStatus', 'success');
          localStorage.setItem('activationToken', token);
        } else {
          setMessage("Invalid or expired activation token.");
          setStatus("error");
          localStorage.setItem('activationStatus', 'error');
        }
      } catch (error) {
        console.error('Activation error:', error);
        setMessage("Activation failed. Please try again later.");
        setStatus("error");
        localStorage.setItem('activationStatus', 'error');
      }
    };

    activateUser();
  }, [location]);

  return (
    <div className="container" style={{background:'#fff',padding:'40px 32px',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',textAlign:'center',marginTop:'40px'}}>
      <h2 style={{color:'#165c3c',marginBottom:'16px'}}>Account Activation</h2>
      <div className={status} style={{fontSize:'18px',marginTop:'16px',color:status==='success'?'#10b981':'#ef4444'}}>{message}</div>
    </div>
  );
};

export default Activate;
