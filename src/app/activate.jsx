

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
    fetch("http://localhost:5000/api/activate-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage("New User Registered Successfully!");
          setStatus("success");
          // Store activation status and token for registration page/modal
          localStorage.setItem('activationStatus', 'success');
          localStorage.setItem('activationToken', token);
        } else {
          setMessage(data.message || "Activation failed.");
          setStatus("error");
          localStorage.setItem('activationStatus', 'error');
        }
      })
      .catch(() => {
        setMessage("Activation failed. Please try again later.");
        setStatus("error");
        localStorage.setItem('activationStatus', 'error');
      });
  }, [location]);

  return (
    <div className="container" style={{background:'#fff',padding:'40px 32px',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',textAlign:'center',marginTop:'40px'}}>
      <h2 style={{color:'#165c3c',marginBottom:'16px'}}>Account Activation</h2>
      <div className={status} style={{fontSize:'18px',marginTop:'16px',color:status==='success'?'#10b981':'#ef4444'}}>{message}</div>
    </div>
  );
};

export default Activate;
