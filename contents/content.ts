import type { PlasmoCSConfig } from "plasmo"
import { AUTOMATION_CONFIG, updateConfig } from "./config"
import { ElementFinder, logger } from "./utils"
import { startPersonalInfoAutomation } from "./personal-info"
import { startAppointmentSearchAutomation } from "./appointment-search"

export const config: PlasmoCSConfig = {
  matches: ["https://rvsq.gouv.qc.ca/*"],
  all_frames: true,
  world: "MAIN"
}

/**
 * Main automation controller
 * Coordinates between the personal info and appointment search modules
 */
class AutomationController {
  private personalInfoRunning: boolean = false;
  private appointmentSearchRunning: boolean = false;

  /**
   * Start the full automation process (personal info + appointment search)
   * @returns Promise that resolves when the process is complete
   */
  async startFullAutomation(): Promise<boolean> {
    logger.info("Starting full automation process");
    
    try {
      // Wait for initial page load
      await ElementFinder.waitForPageLoad();
      
      // Check if we're on the right page
      if (!window.location.href.includes("rvsq.gouv.qc.ca")) {
        logger.error("Not on the RVSQ website. Please navigate to the correct page.");
        return false;
      }
      
      // Start personal info automation
      this.personalInfoRunning = true;
      const personalInfoResult = await startPersonalInfoAutomation();
      this.personalInfoRunning = false;
      
      if (!personalInfoResult) {
        logger.error("Personal information automation failed");
        return false;
      }
      
      // Start appointment search automation
      this.appointmentSearchRunning = true;
      const appointmentSearchResult = await startAppointmentSearchAutomation(true);
      // Note: We don't set appointmentSearchRunning to false here because the search might continue running
      
      return appointmentSearchResult;
    } catch (error) {
      logger.error("Full automation failed: " + (error instanceof Error ? error.message : String(error)));
      this.personalInfoRunning = false;
      this.appointmentSearchRunning = false;
      return false;
    }
  }
  
  /**
   * Start only the personal info part of the automation
   * @returns Promise that resolves when the process is complete
   */
  async startPersonalInfoOnly(): Promise<boolean> {
    logger.info("Starting personal information automation only");
    
    try {
      // Wait for initial page load
      await ElementFinder.waitForPageLoad();
      
      // Check if we're on the right page
      if (!window.location.href.includes("rvsq.gouv.qc.ca")) {
        logger.error("Not on the RVSQ website. Please navigate to the correct page.");
        return false;
      }
      
      // Start personal info automation
      this.personalInfoRunning = true;
      const personalInfoResult = await startPersonalInfoAutomation();
      this.personalInfoRunning = false;
      
      return personalInfoResult;
    } catch (error) {
      logger.error("Personal information automation failed: " + (error instanceof Error ? error.message : String(error)));
      this.personalInfoRunning = false;
      return false;
    }
  }
  
  /**
   * Start only the appointment search part of the automation
   * @param continuous Whether to start continuous search
   * @returns Promise that resolves when the process is complete
   */
  async startAppointmentSearchOnly(continuous = true): Promise<boolean> {
    logger.info("Starting appointment search automation only");
    
    try {
      // Wait for initial page load
      await ElementFinder.waitForPageLoad();
      
      // Check if we're on the right page
      if (!window.location.href.includes("rvsq.gouv.qc.ca")) {
        logger.error("Not on the RVSQ website. Please navigate to the correct page.");
        return false;
      }
      
      // Start appointment search automation
      this.appointmentSearchRunning = true;
      const appointmentSearchResult = await startAppointmentSearchAutomation(continuous);
      // Note: We don't set appointmentSearchRunning to false here because the search might continue running
      
      return appointmentSearchResult;
    } catch (error) {
      logger.error("Appointment search automation failed: " + (error instanceof Error ? error.message : String(error)));
      this.appointmentSearchRunning = false;
      return false;
    }
  }
  
  /**
   * Update the automation configuration
   * @param newConfig New configuration values
   */
  updateConfig(newConfig: Partial<typeof AUTOMATION_CONFIG>): void {
    updateConfig(newConfig);
    logger.info("Configuration updated");
  }
  
  /**
   * Get the current status of the automation
   * @returns Object with status information
   */
  getStatus(): {
    personalInfoRunning: boolean;
    appointmentSearchRunning: boolean;
  } {
    return {
      personalInfoRunning: this.personalInfoRunning,
      appointmentSearchRunning: this.appointmentSearchRunning
    };
  }
}

// Create a singleton instance of the controller
const automationController = new AutomationController();

// Function to start the full automation - expose to window object
async function startAutomation(): Promise<boolean> {
  return await automationController.startFullAutomation();
}

// Function to start only the personal info part - expose to window object
async function startPersonalInfo(): Promise<boolean> {
  return await automationController.startPersonalInfoOnly();
}

// Function to start only the appointment search part - expose to window object
async function startAppointmentSearch(continuous = true): Promise<boolean> {
  return await automationController.startAppointmentSearchOnly(continuous);
}

// Function to update the configuration - expose to window object
function updateAutomationConfig(newConfig: Partial<typeof AUTOMATION_CONFIG>): void {
  automationController.updateConfig(newConfig);
}

// Function to get the current status - expose to window object
function getAutomationStatus(): {
  personalInfoRunning: boolean;
  appointmentSearchRunning: boolean;
} {
  return automationController.getStatus();
}

// In Plasmo, we need to use a different approach for message passing
// We'll export functions that can be called from the popup
export async function startAutomationFromPopup(): Promise<boolean> {
  logger.info("startAutomationFromPopup called");
  return await startAutomation();
}

export async function startPersonalInfoFromPopup(): Promise<boolean> {
  logger.info("startPersonalInfoFromPopup called");
  return await startPersonalInfo();
}

export async function startAppointmentSearchFromPopup(continuous = true): Promise<boolean> {
  logger.info("startAppointmentSearchFromPopup called");
  return await startAppointmentSearch(continuous);
}

export function updateConfigFromPopup(newConfig: Partial<typeof AUTOMATION_CONFIG>): void {
  logger.info("updateConfigFromPopup called");
  updateAutomationConfig(newConfig);
}

export function getStatusFromPopup(): {
  personalInfoRunning: boolean;
  appointmentSearchRunning: boolean;
} {
  return getAutomationStatus();
}

// Make functions available globally
window["startAutomation"] = startAutomation;
window["startPersonalInfo"] = startPersonalInfo;
window["startAppointmentSearch"] = startAppointmentSearch;
window["updateAutomationConfig"] = updateAutomationConfig;
window["getAutomationStatus"] = getAutomationStatus;

// Also expose them as properties on the document for more reliable access
document["startAutomation"] = startAutomation;
document["startPersonalInfo"] = startPersonalInfo;
document["startAppointmentSearch"] = startAppointmentSearch;
document["updateAutomationConfig"] = updateAutomationConfig;
document["getAutomationStatus"] = getAutomationStatus;

// Log when the content script is loaded
logger.info("Content Script loaded");
logger.info("Functions exposed to window: " + 
  Object.keys({
    startAutomation,
    startPersonalInfo,
    startAppointmentSearch,
    updateAutomationConfig,
    getAutomationStatus
  }).join(", "));
