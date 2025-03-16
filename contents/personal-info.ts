// Personal Information Module for CLIQ automation
// This module handles filling out personal information and navigating to the appointment search page

import { AUTOMATION_CONFIG } from "./config";
import { ElementFinder, Logger } from "./utils";

// Create a dedicated logger for this module
const logger = new Logger("PersonalInfo");

/**
 * PersonalInfoAutomation class
 * Handles the first part of the automation process:
 * - Filling personal information
 * - Clicking continue
 * - Navigating to the appointment search page
 */
export class PersonalInfoAutomation {
  private config: typeof AUTOMATION_CONFIG;

  constructor(config = AUTOMATION_CONFIG) {
    this.config = config;
  }

  /**
   * Start the personal information automation process
   * @returns Promise that resolves when the process is complete
   */
  async start(): Promise<boolean> {
    try {
      logger.info("Starting personal information automation");
      
      // Wait for initial page load
      await ElementFinder.waitForPageLoad();
      await ElementFinder.waitForNetworkIdle();
      
      // Check if we're on the right page
      if (!window.location.href.includes("prendrerendezvous/Principale.aspx")) {
        logger.error("Not on the correct page. Please navigate to the RVSQ appointment page.");
        return false;
      }
      
      logger.info("On the correct page. Filling personal information...");
      
      // Fill personal information
      await this.fillPersonalInfo();
      
      // Click continue button
      await this.clickContinue();
      
      // Click schedule appointment button
      await this.clickScheduleAppointment();
      
      logger.success("Personal information process completed successfully");
      return true;
    } catch (error) {
      logger.error("Personal information automation failed", error);
      return false;
    }
  }

  /**
   * Fill personal information form
   */
  private async fillPersonalInfo(): Promise<void> {
    logger.info("Filling personal information form...");
    
    // Fill each field
    await ElementFinder.fillInput(
      this.config.selectors.formFields.firstName, 
      this.config.appointmentData.firstName
    );
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.lastName, 
      this.config.appointmentData.lastName
    );
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.healthInsuranceNumber, 
      this.config.appointmentData.healthInsuranceNumber
    );
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.sequentialNumber, 
      this.config.appointmentData.sequentialNumber
    );
    
    // Handle date of birth fields separately
    const dobParts = this.config.appointmentData.dateOfBirth.split('-');
    if (dobParts.length === 3) {
      const [year, month, day] = dobParts;
      
      await ElementFinder.fillInput(
        this.config.selectors.formFields.dateOfBirthDay, 
        day
      );
      
      await ElementFinder.fillInput(
        this.config.selectors.formFields.dateOfBirthMonth, 
        month // The select will match by value
      );
      
      await ElementFinder.fillInput(
        this.config.selectors.formFields.dateOfBirthYear, 
        year
      );
    }
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.agreeToTerms, 
      "true" // For checkbox
    );
    
    logger.success("Personal information filled");
  }
  
  /**
   * Click the continue button and wait for page transition
   */
  private async clickContinue(): Promise<void> {
    logger.info("Looking for continue button...");
    const button = await ElementFinder.findElement(this.config.selectors.buttons.continue);
    logger.info("Continue button found, clicking...");
    button.click();
    
    // Wait for URL to change or page to update
    await Promise.race([
      ElementFinder.waitForUrlChange(),
      ElementFinder.waitForNetworkIdle()
    ]);
    
    // Check for any error messages
    if (ElementFinder.hasErrorMessage()) {
      const errorMessage = ElementFinder.getErrorMessage();
      throw new Error(`Error after clicking continue: ${errorMessage}`);
    }
    
    logger.success("Continued to next page");
  }
  
  /**
   * Click the schedule appointment button and wait for page transition
   */
  private async clickScheduleAppointment(): Promise<void> {
    logger.info("Looking for 'Schedule an appointment' button...");
    try {
      const button = await ElementFinder.findElement(this.config.selectors.buttons.scheduleAppointment);
      logger.info("Schedule appointment button found, clicking...");
      button.click();
      
      // Wait for URL to change or page to update
      await Promise.race([
        ElementFinder.waitForUrlChange(),
        ElementFinder.waitForNetworkIdle()
      ]);
      
      // Check for any error messages
      if (ElementFinder.hasErrorMessage()) {
        const errorMessage = ElementFinder.getErrorMessage();
        throw new Error(`Error after clicking schedule appointment: ${errorMessage}`);
      }
      
      logger.success("Navigated to appointment scheduling page");
    } catch (error) {
      logger.warn("Schedule appointment button not found, might already be on the search page");
      // Continue with the flow even if button is not found
      // as it might not be present in all scenarios
    }
  }
}

/**
 * Start the personal information automation process
 * @returns Promise that resolves when the process is complete
 */
export async function startPersonalInfoAutomation(): Promise<boolean> {
  const automation = new PersonalInfoAutomation();
  return await automation.start();
}

// Export default class
export default PersonalInfoAutomation;
