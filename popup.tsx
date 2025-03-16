import { useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"

function IndexPopup() {
  const [status, setStatus] = useState("Ready")
  const [message, setMessage] = useState("")

  const startAutomation = async () => {
    setStatus("Starting...")
    setMessage("Initializing automation...")
    
    try {
      console.log("Sending startAutomation message to background script")
      
      // Using Plasmo's sendToBackground function with a timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 15000)
      );
      
      const responsePromise = sendToBackground({
        name: "startAutomation",
        body: {
          timestamp: Date.now() // Add timestamp to avoid caching
        }
      });
      
      // Race between the response and the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      console.log("Response from background script:", response)
      
      if (response && response.success) {
        setStatus("Running")
        setMessage(`Automation is running: ${response.message || "Please don't close this popup."}`)
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

  return (
    <div
      style={{
        padding: 16,
        width: 300,
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
      
      <button 
        onClick={startAutomation}
        style={{
          padding: "8px 16px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 16,
          marginBottom: 16
        }}
        disabled={status === "Running"}
      >
        Start Automation
      </button>
      
      <div style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
        <p>Make sure you're on the RVSQ appointment page before clicking the button.</p>
        <p>The automation will fill in your personal information and search for available appointments.</p>
      </div>
    </div>
  )
}

export default IndexPopup
