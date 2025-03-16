// This script will be injected directly into the page
// It doesn't rely on messaging or chrome.runtime APIs

function injectAndRunAutomation() {
  console.log("Injected automation script running");
  
  // Define a function to check if startAutomation exists and run it
  function checkAndRunAutomation() {
    if (typeof window.startAutomation === 'function') {
      console.log("Found startAutomation function, executing it");
      window.startAutomation();
      return true;
    }
    return false;
  }
  
  // Try to run immediately
  if (checkAndRunAutomation()) {
    return true;
  }
  
  // If not available yet, try again when the page is fully loaded
  if (document.readyState !== 'complete') {
    window.addEventListener('load', function() {
      checkAndRunAutomation();
    });
  }
  
  // Also try a few times with a delay
  let attempts = 0;
  const maxAttempts = 5;
  
  function attemptWithDelay() {
    if (attempts >= maxAttempts) {
      console.error(`Failed to find startAutomation function after ${maxAttempts} attempts`);
      return;
    }
    
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} to find startAutomation function`);
    
    if (!checkAndRunAutomation()) {
      // Try again after a delay
      setTimeout(attemptWithDelay, 1000);
    }
  }
  
  // Start the delayed attempts
  setTimeout(attemptWithDelay, 1000);
  
  return "Automation injection initiated";
}

// Run the function and return its result
injectAndRunAutomation();
