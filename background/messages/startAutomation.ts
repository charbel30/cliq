import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("Background received startAutomation message:", req)
  
  try {
    // Send a message to the content script to start the automation
    // We'll use chrome.tabs API to send a message to the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (!tab || !tab.id) {
      res.send({
        success: false,
        message: "No active tab found"
      })
      return
    }
    
    // Check if we're on the correct page
    if (!tab.url?.includes("rvsq.gouv.qc.ca")) {
      res.send({
        success: false,
        message: "Please navigate to the RVSQ website first"
      })
      return
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
      
      res.send({
        success: true,
        message: "Automation script injected successfully"
      });
      return;
    } catch (injectionError) {
      console.error("Error injecting script from file:", injectionError);
      
      // If file injection fails, fall back to direct function injection
      try {
        console.log("Falling back to direct function injection");
        
        const fallbackResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            console.log("Executing fallback automation script");
            
            // Try to find and call the startAutomation function
            if (typeof window["startAutomation"] === 'function') {
              console.log("Found startAutomation on window object");
              (window["startAutomation"] as Function)();
              return { success: true, source: "window" };
            } else {
              console.error("startAutomation function not found in fallback");
              
              // Try to access the function through the content script export
              try {
                // Last resort: try to trigger a click on the page to see if that helps
                console.log("Attempting to trigger page interaction");
                document.body.click();
                
                // Try one more time after interaction
                if (typeof window["startAutomation"] === 'function') {
                  (window["startAutomation"] as Function)();
                  return { success: true, source: "after-interaction" };
                }
              } catch (e) {
                console.error("Error during page interaction:", e);
              }
              
              return { success: false, message: "Function not found in fallback" };
            }
          }
        });
        
        console.log("Fallback results:", fallbackResults);
        
        // We've removed the direct messaging attempt since it wasn't working
        
        res.send({
          success: true,
          message: "Attempted automation with fallback methods"
        });
      } catch (fallbackError) {
        console.error("Error in fallback execution:", fallbackError);
        res.send({
          success: false,
          message: `Automation failed: ${fallbackError.message}`
        });
      }
    }
  } catch (error) {
    console.error("Error in startAutomation handler:", error)
    res.send({
      success: false,
      message: `Error: ${error.message}`
    })
  }
}

export default handler
