import { useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"

function IndexPopup() {
  const [status, setStatus] = useState("Ready")
  const [message, setMessage] = useState("")
  const [automationType, setAutomationType] = useState("full")
  const [continuous, setContinuous] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  
  // Configuration state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState("")
  const [sequentialNumber, setSequentialNumber] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [searchRadius, setSearchRadius] = useState("25")
  const [searchInterval, setSearchInterval] = useState("30")
  
  const startAutomation = async (type = automationType, continuousSearch = continuous) => {
    setStatus("Starting...")
    setMessage(`Initializing ${type} automation...`)
    
    try {
      console.log(`Sending startAutomation message to background script (type: ${type})`)
      
      // Using Plasmo's sendToBackground function with a timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 15000)
      );
      
      const responsePromise = sendToBackground({
        name: "startAutomation",
        body: {
          type,
          continuous: continuousSearch,
          timestamp: Date.now() // Add timestamp to avoid caching
        }
      });
      
      // Race between the response and the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      console.log("Response from background script:", response)
      
      if (response && response.success) {
        setStatus("Running")
        setMessage(`${getAutomationTypeLabel(type)} is running: ${response.message || "Please don't close this popup."}`)
      } else {
        setStatus("Error")
        setMessage(response?.message || "Failed to start automation")
      }
    } catch (error) {
      console.error("Error starting automation:", error)
      setStatus("Error")
      setMessage(`Error: ${error.message || "Unknown error occurred"}`)
    }
  }
  
  const saveConfig = async () => {
    try {
      // Send config to background script
      await sendToBackground({
        name: "updateConfig",
        body: {
          appointmentData: {
            firstName,
            lastName,
            healthInsuranceNumber,
            sequentialNumber,
            dateOfBirth,
            postalCode,
            searchRadius,
            reason: "Consultation"
          },
          searchBehavior: {
            searchInterval: parseInt(searchInterval) * 1000, // Convert to milliseconds
            maxSearchAttempts: 0, // Unlimited
            playSoundOnFound: true,
            stopOnFound: false
          }
        }
      });
      
      setMessage("Configuration saved successfully")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error saving configuration:", error)
      setMessage(`Error saving configuration: ${error.message}`)
    }
  }
  
  const getAutomationTypeLabel = (type) => {
    switch (type) {
      case "personalInfo":
        return "Personal information automation";
      case "appointmentSearch":
        return "Appointment search automation";
      default:
        return "Full automation";
    }
  }
  
  return (
    <div
      style={{
        padding: 16,
        width: 350,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
      <h2 style={{ marginBottom: 16, textAlign: "center" }}>
        CLIQ Appointment Automation
      </h2>
      
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <p>Status: <strong>{status}</strong></p>
        {message && <p style={{ color: status === "Error" ? "red" : "inherit" }}>{message}</p>}
      </div>
      
      <div style={{ marginBottom: 16, width: "100%" }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Automation Type:
          <select 
            value={automationType}
            onChange={(e) => setAutomationType(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: 4,
              borderRadius: 4,
              border: "1px solid #ccc"
            }}
          >
            <option value="full">Full Automation (Personal Info + Search)</option>
            <option value="personalInfo">Personal Information Only</option>
            <option value="appointmentSearch">Appointment Search Only</option>
          </select>
        </label>
        
        {automationType === "appointmentSearch" && (
          <label style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
            <input 
              type="checkbox" 
              checked={continuous}
              onChange={(e) => setContinuous(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Continuous search (keep searching until appointment found)
          </label>
        )}
      </div>
      
      <button 
        onClick={() => startAutomation()}
        style={{
          padding: "8px 16px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 16,
          marginBottom: 16,
          width: "100%"
        }}
        disabled={status === "Running"}
      >
        Start {getAutomationTypeLabel(automationType)}
      </button>
      
      <button 
        onClick={() => setShowConfig(!showConfig)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 16,
          marginBottom: 16,
          width: "100%"
        }}
      >
        {showConfig ? "Hide Configuration" : "Show Configuration"}
      </button>
      
      {showConfig && (
        <div style={{ width: "100%", marginBottom: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Personal Information</h3>
          
          <label style={{ display: "block", marginBottom: 8 }}>
            First Name:
            <input 
              type="text" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. John"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          </label>
          
          <label style={{ display: "block", marginBottom: 8 }}>
            Last Name:
            <input 
              type="text" 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Smith"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          </label>
          
          <label style={{ display: "block", marginBottom: 8 }}>
            Health Insurance Number:
            <input 
              type="text" 
              value={healthInsuranceNumber}
              onChange={(e) => setHealthInsuranceNumber(e.target.value)}
              placeholder="e.g. SMIJ01010101"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          </label>
          
          <label style={{ display: "block", marginBottom: 8 }}>
            Sequential Number:
            <input 
              type="text" 
              value={sequentialNumber}
              onChange={(e) => setSequentialNumber(e.target.value)}
              placeholder="e.g. 01"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          </label>
          
          <label style={{ display: "block", marginBottom: 8 }}>
            Date of Birth:
            <input 
              type="date" 
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          </label>
          
          <h3 style={{ marginBottom: 8, marginTop: 16 }}>Search Parameters</h3>
          
          <label style={{ display: "block", marginBottom: 8 }}>
            Postal Code:
            <input 
              type="text" 
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. H2X 1Y6"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          </label>
          
          <label style={{ display: "block", marginBottom: 8 }}>
            Search Radius (km):
            <input 
              type="number" 
              value={searchRadius}
              onChange={(e) => setSearchRadius(e.target.value)}
              min="5"
              max="100"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          </label>
          
          <label style={{ display: "block", marginBottom: 8 }}>
            Search Interval (seconds):
            <input 
              type="number" 
              value={searchInterval}
              onChange={(e) => setSearchInterval(e.target.value)}
              min="10"
              max="300"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: 4,
                borderRadius: 4,
                border: "1px solid #ccc"
              }}
            />
          </label>
          
          <button 
            onClick={saveConfig}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 16,
              marginTop: 8,
              width: "100%"
            }}
          >
            Save Configuration
          </button>
        </div>
      )}
      
      <div style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
        <p>Make sure you're on the RVSQ appointment page before clicking the button.</p>
        <p>The automation will fill in your personal information and search for available appointments.</p>
      </div>
    </div>
  )
}

export default IndexPopup
