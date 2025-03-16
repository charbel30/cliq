// Appointment Search Module for CLIQ automation
// This module handles searching for appointments and continuously retrying until one is found

import { AUTOMATION_CONFIG } from "./config";
import { ElementFinder, Logger } from "./utils";

// Create a dedicated logger for this module
const logger = new Logger("AppointmentSearch");

/**
 * AppointmentSearchAutomation class
 * Handles the second part of the automation process:
 * - Filling search parameters
 * - Searching for appointments
 * - Continuously retrying until an appointment is found
 */
export class AppointmentSearchAutomation {
  private config: typeof AUTOMATION_CONFIG;
  private searchInterval: number | null = null;
  private searchAttempts: number = 0;
  private isSearching: boolean = false;

  constructor(config = AUTOMATION_CONFIG) {
    this.config = config;
  }

  /**
   * Start the appointment search automation process
   * @returns Promise that resolves when the process is complete
   */
  async start(): Promise<boolean> {
    try {
      logger.info("Starting appointment search automation");
      
      // Wait for initial page load
      await ElementFinder.waitForPageLoad();
      await ElementFinder.waitForNetworkIdle();
      
      // Check if we're on the right page
      if (!window.location.href.includes("prendrerendezvous/Recherche.aspx")) {
        logger.error("Not on the search page. Please complete the personal information step first.");
        return false;
      }
      
      logger.info("On the search page. Filling search parameters...");
      
      // Fill search parameters
      await this.fillSearchParameters();
      
      // Perform initial search
      await this.searchForAppointment();
      
      // Start continuous search if configured
      if (this.config.searchBehavior.searchInterval > 0) {
        this.startContinuousSearch();
      }
      
      return true;
    } catch (error) {
      logger.error("Appointment search automation failed: " + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }

  /**
   * Fill search parameters form
   */
  private async fillSearchParameters(): Promise<void> {
    logger.info("Filling search parameters...");
    
    // Fill search parameters
    await ElementFinder.fillInput(
      this.config.selectors.formFields.postalCode,
      this.config.appointmentData.postalCode
    );
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.searchRadius,
      this.config.appointmentData.searchRadius
    );
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.appointmentReason,
      this.config.appointmentData.reason
    );
    
    // Select time preferences (all by default)
    try {
      await ElementFinder.fillInput(
        this.config.selectors.formFields.timePreferences.morning,
        "true"
      );
      await ElementFinder.fillInput(
        this.config.selectors.formFields.timePreferences.afternoon,
        "true"
      );
      await ElementFinder.fillInput(
        this.config.selectors.formFields.timePreferences.evening,
        "true"
      );
    } catch (error) {
      logger.warn("Could not set all time preferences, continuing anyway");
    }
    
    logger.success("Search parameters filled");
  }
  
  /**
   * Perform a single search for appointments
   * @returns Promise that resolves to true if an appointment was found
   */
  private async searchForAppointment(): Promise<boolean> {
    this.searchAttempts++;
    logger.info(`Searching for appointments (attempt ${this.searchAttempts})...`);
    
    try {
      const button = await ElementFinder.findElement(this.config.selectors.buttons.search);
      button.click();
      
      await ElementFinder.waitForNetworkIdle();
      
      // Check for any error messages
      if (ElementFinder.hasErrorMessage()) {
        const errorMessage = ElementFinder.getErrorMessage();
        logger.error(`Error during search: ${errorMessage || "Unknown error"}`);
        return false;
      }
      
      // Check if appointments were found
      const appointmentFound = await this.checkForAppointments();
      
      if (appointmentFound) {
        logger.success("Appointment found!");
        this.notifyAppointmentFound();
        
        // Stop continuous search if configured to do so
        if (this.config.searchBehavior.stopOnFound) {
          this.stopContinuousSearch();
        }
        
        return true;
      } else {
        logger.info("No appointments available. Will try again later.");
        return false;
      }
    } catch (error) {
      logger.error("Error during search: " + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }
  
  /**
   * Check if any appointments were found in the search results
   * @returns Promise that resolves to true if appointments were found
   */
  private async checkForAppointments(): Promise<boolean> {
    try {
      // First check if the no results message is displayed
      for (const selector of this.config.selectors.appointmentResults.noResults) {
        if (ElementFinder.elementExists(selector)) {
          return false;
        }
      }
      
      // Then check if any appointment items exist
      for (const selector of this.config.selectors.appointmentResults.appointmentItems) {
        if (ElementFinder.elementExists(selector)) {
          return true;
        }
      }
      
      // If neither is found, check if the results container exists
      for (const selector of this.config.selectors.appointmentResults.resultsContainer) {
        const container = document.querySelector(selector);
        if (container && container.children.length > 0) {
          // If the container has children, assume appointments were found
          return true;
        }
      }
      
      // Default to false if we couldn't determine
      return false;
    } catch (error) {
      logger.error("Error checking for appointments: " + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }
  
  /**
   * Start continuous search for appointments
   */
  startContinuousSearch(): void {
    if (this.isSearching) {
      logger.warn("Continuous search is already running");
      return;
    }
    
    this.isSearching = true;
    logger.info(`Starting continuous search (interval: ${this.config.searchBehavior.searchInterval}ms)`);
    
    this.searchInterval = window.setInterval(async () => {
      // Check if we've reached the maximum number of attempts
      if (this.config.searchBehavior.maxSearchAttempts > 0 && 
          this.searchAttempts >= this.config.searchBehavior.maxSearchAttempts) {
        logger.info(`Reached maximum search attempts (${this.config.searchBehavior.maxSearchAttempts})`);
        this.stopContinuousSearch();
        return;
      }
      
      // Perform the search
      await this.searchForAppointment();
    }, this.config.searchBehavior.searchInterval);
  }
  
  /**
   * Stop continuous search for appointments
   */
  stopContinuousSearch(): void {
    if (!this.isSearching) {
      logger.warn("No continuous search is running");
      return;
    }
    
    if (this.searchInterval !== null) {
      window.clearInterval(this.searchInterval);
      this.searchInterval = null;
    }
    
    this.isSearching = false;
    logger.info("Continuous search stopped");
  }
  
  /**
   * Notify the user that an appointment was found
   */
  private notifyAppointmentFound(): void {
    // Play sound if configured
    if (this.config.searchBehavior.playSoundOnFound) {
      this.playNotificationSound();
    }
    
    // Show a browser notification if possible
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Appointment Found", {
          body: "An appointment is available on RVSQ!",
          icon: "/assets/icon.png"
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Appointment Found", {
              body: "An appointment is available on RVSQ!",
              icon: "/assets/icon.png"
            });
          }
        });
      }
    }
    
    // Add a visual indicator on the page
    const notificationDiv = document.createElement("div");
    notificationDiv.style.position = "fixed";
    notificationDiv.style.top = "0";
    notificationDiv.style.left = "0";
    notificationDiv.style.right = "0";
    notificationDiv.style.backgroundColor = "#4CAF50";
    notificationDiv.style.color = "white";
    notificationDiv.style.padding = "15px";
    notificationDiv.style.textAlign = "center";
    notificationDiv.style.fontWeight = "bold";
    notificationDiv.style.zIndex = "9999";
    notificationDiv.textContent = "Appointment Found! 🎉";
    document.body.appendChild(notificationDiv);
  }
  
  /**
   * Play a notification sound
   */
  private playNotificationSound(): void {
    try {
      // Create an audio element
      const audio = new Audio();
      
      // Use a data URI for a simple beep sound
      audio.src = "data:audio/wav;base64,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";
      
      // Play the sound
      audio.play();
    } catch (error) {
      logger.error("Could not play notification sound: " + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Get the current search status
   * @returns Object with search status information
   */
  getStatus(): {
    isSearching: boolean;
    searchAttempts: number;
    maxSearchAttempts: number;
  } {
    return {
      isSearching: this.isSearching,
      searchAttempts: this.searchAttempts,
      maxSearchAttempts: this.config.searchBehavior.maxSearchAttempts
    };
  }
}

/**
 * Start the appointment search automation process
 * @param continuous Whether to start continuous search
 * @returns Promise that resolves when the process is complete
 */
export async function startAppointmentSearchAutomation(continuous = true): Promise<boolean> {
  const automation = new AppointmentSearchAutomation();
  const result = await automation.start();
  
  if (result && continuous) {
    automation.startContinuousSearch();
  }
  
  return result;
}

// Export default class
export default AppointmentSearchAutomation;
