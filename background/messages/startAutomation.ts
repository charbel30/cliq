import type { PlasmoMessaging } from "@plasmohq/messaging"

// Define the message types
type AutomationType = "full" | "personalInfo" | "appointmentSearch";

// Define the message body interface
interface StartAutomationBody {
  type?: AutomationType;
  continuous?: boolean;
  timestamp?: number;
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("Background received startAutomation message:", req);
  
  // Extract message body
  const body = req.body as StartAutomationBody;
  const automationType = body.type || "full";
  const continuous = body.continuous !== undefined ? body.continuous : true;
  
  try {
    // Send a message to the content script to start the automation
    // We'll use chrome.tabs API to send a message to the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      res.send({
        success: false,
        message: "No active tab found"
      });
      return;
    }
    
    // Check if we're on the correct page
    if (!tab.url?.includes("rvsq.gouv.qc.ca")) {
      res.send({
        success: false,
        message: "Please navigate to the RVSQ website first"
      });
      return;
    }
    
    // First, try to inject our dedicated automation script
    try {
      console.log("Injecting automation script from file");
      
      // Execute the inject-automation.js script in the page context
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["assets/inject-automation.js"],
        world: "MAIN" // Run in the same JavaScript world as the page
      });
      
      console.log("Injection results:", results);
      
      // Now execute the appropriate function based on the automation type
      const functionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (type: AutomationType, continuous: boolean) => {
          console.log(`Executing ${type} automation`);
          
          // Call the appropriate function based on the type
          if (type === "personalInfo") {
            if (typeof window["startPersonalInfo"] === 'function') {
              window["startPersonalInfo"]();
              return { success: true, type: "personalInfo" };
            }
          } else if (type === "appointmentSearch") {
            if (typeof window["startAppointmentSearch"] === 'function') {
              window["startAppointmentSearch"](continuous);
              return { success: true, type: "appointmentSearch" };
            }
          } else {
            // Default to full automation
            if (typeof window["startAutomation"] === 'function') {
              window["startAutomation"]();
              return { success: true, type: "full" };
            }
          }
          
          return { success: false, message: `Function for ${type} automation not found` };
        },
        args: [automationType, continuous]
      });
      
      console.log("Function execution results:", functionResults);
      
      const result = functionResults[0]?.result;
      
      if (result?.success) {
        res.send({
          success: true,
          message: `${result.type} automation started successfully`
        });
      } else {
        res.send({
          success: false,
          message: result?.message || "Failed to start automation"
        });
      }
      
      return;
    } catch (injectionError) {
      console.error("Error injecting script from file:", injectionError);
      
      // If file injection fails, fall back to direct function injection
      try {
        console.log("Falling back to direct function injection");
        
        const fallbackResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (type: AutomationType, continuous: boolean) => {
            console.log(`Executing fallback ${type} automation`);
            
            // Call the appropriate function based on the type
            if (type === "personalInfo") {
              if (typeof window["startPersonalInfo"] === 'function') {
                window["startPersonalInfo"]();
                return { success: true, type: "personalInfo" };
              }
            } else if (type === "appointmentSearch") {
              if (typeof window["startAppointmentSearch"] === 'function') {
                window["startAppointmentSearch"](continuous);
                return { success: true, type: "appointmentSearch" };
              }
            } else {
              // Default to full automation
              if (typeof window["startAutomation"] === 'function') {
                window["startAutomation"]();
                return { success: true, type: "full" };
              }
            }
            
            // Try to access the function through the content script export
            try {
              // Last resort: try to trigger a click on the page to see if that helps
              console.log("Attempting to trigger page interaction");
              document.body.click();
              
              // Try one more time after interaction
              if (type === "personalInfo" && typeof window["startPersonalInfo"] === 'function') {
                window["startPersonalInfo"]();
                return { success: true, type: "personalInfo" };
              } else if (type === "appointmentSearch" && typeof window["startAppointmentSearch"] === 'function') {
                window["startAppointmentSearch"](continuous);
                return { success: true, type: "appointmentSearch" };
              } else if (typeof window["startAutomation"] === 'function') {
                window["startAutomation"]();
                return { success: true, type: "full" };
              }
            } catch (e) {
              console.error("Error during page interaction:", e);
            }
            
            return { success: false, message: `Function for ${type} automation not found in fallback` };
          },
          args: [automationType, continuous]
        });
        
        console.log("Fallback results:", fallbackResults);
        
        const result = fallbackResults[0]?.result;
        
        if (result?.success) {
          res.send({
            success: true,
            message: `${result.type} automation started with fallback methods`
          });
        } else {
          res.send({
            success: false,
            message: result?.message || "Failed to start automation with fallback methods"
          });
        }
      } catch (fallbackError) {
        console.error("Error in fallback execution:", fallbackError);
        res.send({
          success: false,
          message: `Automation failed: ${fallbackError.message}`
        });
      }
    }
  } catch (error) {
    console.error("Error in startAutomation handler:", error);
    res.send({
      success: false,
      message: `Error: ${error.message}`
    });
  }
};

export default handler;
