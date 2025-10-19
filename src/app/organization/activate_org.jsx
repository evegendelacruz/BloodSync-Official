import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ActivateOrg = () => {
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
    const activateOrgUser = async () => {
      try {
        let success = false;

        // Try Electron IPC first (if available)
        if (window.electronAPI && window.electronAPI.activateOrgUserByToken) {
          success = await window.electronAPI.activateOrgUserByToken(token);
        } else {
          // Fallback to HTTP API for web browser
          const response = await fetch(`http://localhost:3001/api/activate-org?token=${token}`, {
            method: "GET"
          });
          const data = await response.json();
          success = data.success;
        }

        if (success) {
          setMessage("Partnered Organization User Registered Successfully!");
          setStatus("success");
          // Store activation status and token for registration page/modal
          localStorage.setItem('activationStatusOrg', 'success');
          localStorage.setItem('activationTokenOrg', token);
        } else {
          setMessage("Invalid or expired activation token.");
          setStatus("error");
          localStorage.setItem('activationStatusOrg', 'error');
        }
      } catch (error) {
        console.error('Organization activation error:', error);
        setMessage("Activation failed. Please try again later.");
        setStatus("error");
        localStorage.setItem('activationStatusOrg', 'error');
      }
    };

    activateOrgUser();
  }, [location]);

  return (
    <div className="container" style={{background:'#fff',padding:'40px 32px',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',textAlign:'center',marginTop:'40px'}}>
      <h2 style={{color:'#165c3c',marginBottom:'16px'}}>Partnered Organization - Account Activation</h2>
      <div className={status} style={{fontSize:'18px',marginTop:'16px',color:status==='success'?'#10b981':'#ef4444'}}>{message}</div>
    </div>
  );
};

export default ActivateOrg;
