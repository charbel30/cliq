import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("Background received updateConfig message:", req);
  
  try {
    // Send a message to the content script to update the configuration
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
    
    // Execute the updateAutomationConfig function in the page context
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (config) => {
        console.log("Updating automation config:", config);
        
        if (typeof window["updateAutomationConfig"] === 'function') {
          window["updateAutomationConfig"](config);
          return { success: true };
        } else {
          return { success: false, message: "updateAutomationConfig function not found" };
        }
      },
      args: [req.body]
    });
    
    console.log("Config update results:", results);
    
    const result = results[0]?.result;
    
    if (result?.success) {
      res.send({
        success: true,
        message: "Configuration updated successfully"
      });
    } else {
      res.send({
        success: false,
        message: result?.message || "Failed to update configuration"
      });
    }
  } catch (error) {
    console.error("Error in updateConfig handler:", error);
    res.send({
      success: false,
      message: `Error: ${error.message}`
    });
  }
};

export default handler;
