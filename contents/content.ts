import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://rvsq.gouv.qc.ca/prendrerendezvous/Principale.aspx?culture=fr",
    "https://rvsq.gouv.qc.ca/accueil/index.html",
    "https://rvsq.gouv.qc.ca/prendrerendezvous/Principale.aspx?/*"
  ],
  all_frames: true,
  world: "MAIN"
}
// Automatically runs when the specified pages are loaded
// Fills in personal information (first name, last name, health insurance number, etc.)
// Continues to the next page, fills search parameters, and searches for available appointments

const AUTOMATION_CONFIG = {
  appointmentData: {
    firstName: "John",
    lastName: "Doe",
    healthInsuranceNumber: "ABCD12345678",
    sequentialNumber: "01",
    dateOfBirth: "1990-01-01",
    postalCode: "H2X 1Y2",
    searchRadius: "25", // km
    reason: "Consultation"
  },
  selectors: {
    formFields: {
      firstName: [
        // First page - Assure form fields
        "#ctl00_ContentPlaceHolderMP_AssureForm_FirstName",
        'input[name="ctl00$ContentPlaceHolderMP$AssureForm_FirstName"]',
        "input.h-FirstName",
        'input[class*="FirstName"]',
        'input[placeholder*="first name" i]'
      ],
      lastName: [
        "#ctl00_ContentPlaceHolderMP_AssureForm_LastName",
        'input[name="ctl00$ContentPlaceHolderMP$AssureForm_LastName"]',
        "input.h-LastName",
        'input[class*="LastName"]',
        'input[placeholder*="last name" i]'
      ],
      healthInsuranceNumber: [
        "#ctl00_ContentPlaceHolderMP_AssureForm_NAM",
        'input[name="ctl00$ContentPlaceHolderMP$AssureForm_NAM"]',
        "input.h-NAM",
        'input[data-mask="SSSS 0000 00A0"]',
        'input[class*="NAM"]'
      ],
      sequentialNumber: [
        "#ctl00_ContentPlaceHolderMP_AssureForm_CardSeqNumber",
        'input[name="ctl00$ContentPlaceHolderMP$AssureForm_CardSeqNumber"]',
        "input.h-CardSeqNumber",
        "input.AssureForm_CardSeqNumber",
        'input[class*="CardSeqNumber"]',
        'input[maxlength="2"]'
      ],

      dateOfBirthDay: [
        "#ctl00_ContentPlaceHolderMP_AssureForm_Day",
        'input[name="ctl00$ContentPlaceHolderMP$AssureForm_Day"]',
        "input.AssureForm_Day",
        'input[class*="Day"]',
        'input[maxlength="2"]:not([id*="CardSeqNumber"])'
      ],
      dateOfBirthMonth: [
        "#ctl00_ContentPlaceHolderMP_AssureForm_Month",
        'select[name="ctl00$ContentPlaceHolderMP$AssureForm_Month"]',
        "select.AssureForm_Month",
        'select[class*="Month"]',
        'select:not([id*="Year"]):not([id*="Day"])'
      ],
      dateOfBirthYear: [
        "#ctl00_ContentPlaceHolderMP_AssureForm_Year",
        'input[name="ctl00$ContentPlaceHolderMP$AssureForm_Year"]',
        "input.AssureForm_Year",
        'input[class*="Year"]',
        'input[maxlength="4"]'
      ],
      agreeToTerms: [
        "#AssureForm_CSTMT",
        "input.AssureForm_CSTMT",
        'input[value="true"][type="checkbox"]',
        'input[type="checkbox"][class*="CSTMT"]'
      ],

      // Second page - Appointment search fields
      searchDate: [
        "#DateRangeStart",
        "input.h-DateRangeStart",
        'input[placeholder="dd-mm-yyyy"]',
        "input.calendarFix",
        "input.findOnKeyPress"
      ],
      postalCode: [
        "#PostalCode",
        'input[aria-label="Your postal code"]',
        'input[data-mask="S0S 0S0"]',
        'input[data-majus="true"]',
        'input.findOnKeyPress[maxlength="7"]'
      ],
      searchRadius: [
        "#perimeterCombo",
        'select[name="perimeterCombo"]',
        'select[id="perimeterCombo"]'
      ],
      timePreferences: {
        morning: [
          "#chkMatin",
          'input[aria-label="Morning"]',
          'input[id="chkMatin"]'
        ],
        afternoon: [
          "#chkPm",
          'input[aria-label="Afternoon"]',
          'input[id="chkPm"]'
        ],
        evening: [
          "#chkSoir",
          'input[aria-label="Evening"]',
          'input[id="chkSoir"]'
        ]
      },
      appointmentReason: [
        "#consultingReason",
        'select[name="consultingReason"]',
        "select.h-consultingReason"
      ]
    },

    buttons: {
      continue: [
        "#ctl00_ContentPlaceHolderMP_myButton",
        'input[name="ctl00$ContentPlaceHolderMP$myButton"]',
        "input.h-ContinueButton",
        'input.btn-default[value="Continue"]',
        'input[value="Continue"]',
        'input[type="button"][class*="ContinueButton"]'
      ],
      search: [
        "button.h-SearchButton",
        "button.btn-primary:contains('Search')",
        ".btn-primary:contains('Search')",
        "button.btn-primary",
        ".text-center button"
      ]
    },

    // Error messages that could appear during the process
    errorMessages: {
      accessDenied: [
        ".ErrorMessage_ServicesAccessDenied:not([style*='display: none'])",
        ".ErrorMessage_ServicesAccessDenied:visible",
        ".alert:contains('does not match any RAMQ record')"
      ],
      captchaInvalid: [
        ".ErrorMessage_CaptchaInvalid:not([style*='display: none'])",
        ".ErrorMessage_CaptchaInvalid:visible",
        ".alert:contains('characters you have entered do not match')"
      ],
      missingFields: [
        ".ErrorMessage_FillAllFields:not([style*='display: none'])",
        ".ErrorMessage_FillAllFields:visible",
        ".alert:contains('Please fill out all the fields')"
      ],
      invalidDate: [
        ".ErrorMessage_InvalideDateformat:not([style*='display: none'])",
        ".ErrorMessage_InvalideDateformat:visible",
        ".alert:contains('date entered is invalid')"
      ],
      anyError: [
        ".alert:not([style*='display: none'])",
        ".alert:visible",
        ".ErrorMessage_*:visible"
      ]
    }
  },
  timeouts: {
    elementWait: 30000,
    pageTransition: 5000
  }
}

class ElementFinder {
  static async findElement(
    selectorOptions,
    timeout = AUTOMATION_CONFIG.timeouts.elementWait
  ) {
    // try all selectors in parallel
    const selectorpromises = selectorOptions.map((selector) =>
      this.waitForElementWithMutationObserver(selector, timeout)
    )
    selectorpromises.push(
      this.findElementByText("button", selectorOptions[0], timeout)
    )

    try {
      return await Promise.race(selectorpromises)
    } catch (error) {
      console.error(`Failed to find element with selectors:`, selectorOptions)
      throw error
    }
  }

  static waitForElementWithMutationObserver(selector, timeout = 30000) {
    return new Promise((resolve, reject) => {
      // Check if element already exists
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
        return
      }

      let timeoutId

      // Create mutation observer
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector)
        if (element) {
          clearTimeout(timeoutId)
          observer.disconnect()
          resolve(element)
        }
      })

      // Set timeout for rejection
      timeoutId = setTimeout(() => {
        observer.disconnect()
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      }, timeout)

      // Start observing with all possible mutation types
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
    })
  }

  static findElementByText(elementType, textContent, timeout = 30000) {
    return new Promise((resolve, reject) => {
      // Check if element already exists
      const elements = Array.from(document.querySelectorAll(elementType));
      const element = elements.find(el => 
        el.textContent.trim().toLowerCase().includes(textContent.toLowerCase()));
      
      if (element) {
        resolve(element);
        return;
      }
      let timeoutId;
      
      // Create mutation observer
      const observer = new MutationObserver(() => {
        const elements = Array.from(document.querySelectorAll(elementType));
        const element = elements.find(el => 
          el.textContent.trim().toLowerCase().includes(textContent.toLowerCase()));
        
        if (element) {
          clearTimeout(timeoutId);
          observer.disconnect();
          resolve(element);
        }
      });
      
      // Set timeout for rejection
      timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`${elementType} with text "${textContent}" not found within ${timeout}ms`));
      }, timeout);
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }
  


  static async fillInput(fieldSelectors, value) {
    const input = await this.findElement(fieldSelectors);
    
    // Handle different input types appropriately
    if (input.type === 'checkbox') {
      if (!input.checked) input.click();
    } else if (input.tagName === 'SELECT') {
      // Handle dropdown selection
      const option = Array.from(input.options).find((opt: HTMLOptionElement) => 
        opt.text.toLowerCase().includes(value.toLowerCase()) || 
        opt.value.toLowerCase().includes(value.toLowerCase())
      );
      
      if (option) {
        (input as HTMLSelectElement).value = (option as HTMLOptionElement).value;
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      // Text inputs, date inputs, etc.
      input.value = value;
      // Trigger input and change events to activate any listeners
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    return input;
  }


  static async waitForUrlChange(timeout = AUTOMATION_CONFIG.timeouts.pageTransition) {
    return new Promise((resolve, reject) => {
      const startUrl = window.location.href;
      let intervalId;
      let timeoutId;
      
      intervalId = setInterval(() => {
        if (window.location.href !== startUrl) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          // Add small delay to ensure page is loaded
          setTimeout(resolve, 1000);
        }
      }, 100);
      
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        reject(new Error(`URL did not change within ${timeout}ms`));
      }, timeout);
    });
  }

  static async waitForPageLoad() {
    if (document.readyState === 'complete') return;
    
    return new Promise<void>(resolve => {
      window.addEventListener('load', () => resolve(), { once: true });
    });
  }
  
  static async waitForNetworkIdle(timeout = 5000) {
    return new Promise<void>(resolve => {
      let lastActivity = Date.now();
      let requestCount = 0;
      let timeoutId;
      
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalFetch = window.fetch;
      
      // Patch XHR
      XMLHttpRequest.prototype.open = function() {
        requestCount++;
        lastActivity = Date.now();
        
        this.addEventListener('loadend', () => {
          requestCount--;
          lastActivity = Date.now();
        });
        
        return originalXHROpen.apply(this, arguments);
      };
      
      // Patch fetch
      window.fetch = function() {
        requestCount++;
        lastActivity = Date.now();
        
        const promise = originalFetch.apply(this, arguments);
        promise.then(() => {
          requestCount--;
          lastActivity = Date.now();
        }).catch(() => {
          requestCount--;
          lastActivity = Date.now();
        });
        
        return promise;
      };
      
      const checkIdle = () => {
        const idleTime = Date.now() - lastActivity;
        if (requestCount === 0 && idleTime > 500) {
          // Network has been idle for more than 500ms
          clearInterval(intervalId);
          
          // Restore originals
          XMLHttpRequest.prototype.open = originalXHROpen;
          window.fetch = originalFetch;
          
          resolve();
          return;
        }
      };
      
      const intervalId = setInterval(checkIdle, 100);
      
      // Maximum wait time
      setTimeout(() => {
        clearInterval(intervalId);
        XMLHttpRequest.prototype.open = originalXHROpen;
        window.fetch = originalFetch;
        resolve();
      }, timeout);
    });
  }

  
}
/**
 * Main automation class
 */
class AppointmentAutomation {
  config: any;
  currentStep: number;
  steps: Array<() => Promise<void>>;

  logger: any;

  constructor(config) {
    this.config = config;
    this.currentStep = 0;
    this.steps = [
      this.clickScheduleAppointment,
      this.fillPersonalInfo,
      this.clickContinue,
      this.clickScheduleAppointment,
      this.fillSearchParameters,
      this.searchForAppointment
    ];
    
    // Use a more advanced logging system
    this.logger = {
      info: (msg) => console.log(`[AppointBot] ${msg}`),
      error: (msg, error) => console.error(`[AppointBot] ${msg}`, error),
      warn: (msg) => console.warn(`[AppointBot] ${msg}`),
      success: (msg) => console.log(`[AppointBot] ✓ ${msg}`)
    };
  }
  
  async start() {
    this.logger.info("Starting automation sequence");
    
    try {
      // Wait for initial page load
      await ElementFinder.waitForPageLoad();
      await ElementFinder.waitForNetworkIdle();
      
      // Run through each step
      for (this.currentStep = 0; this.currentStep < this.steps.length; this.currentStep++) {
        const step = this.steps[this.currentStep];
        await step.call(this);
      }
      
      this.logger.success("Automation complete! Found available appointment.");
    } catch (error) {
      this.logger.error(`Automation failed at step ${this.currentStep + 1}:`, error);
    }
  }
  
  async clickScheduleAppointment() {
    this.logger.info("Looking for appointment button...");
    const button = await ElementFinder.findElement(this.config.selectors.scheduleAppointment);
    this.logger.info("Appointment button found, clicking...");
    button.click();
    
    await ElementFinder.waitForNetworkIdle();
    this.logger.success("Navigated to next page");
  }
  
  async fillPersonalInfo() {
    this.logger.info("Filling personal information form...");
    
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
      this.config.selectors.formFields.healthNumber, 
      this.config.appointmentData.healthInsuranceNumber
    );
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.sequentialNumber, 
      this.config.appointmentData.sequentialNumber
    );
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.dateOfBirth, 
      this.config.appointmentData.dateOfBirth
    );
    
    await ElementFinder.fillInput(
      this.config.selectors.formFields.agreement, 
      "true" // For checkbox
    );
    
    this.logger.success("Personal information filled");
  }
  
  async clickContinue() {
    this.logger.info("Looking for continue button...");
    const button = await ElementFinder.findElement(this.config.selectors.continueButton);
    this.logger.info("Continue button found, clicking...");
    button.click();
    
    // Wait for URL to change or page to update
    await Promise.race([
      ElementFinder.waitForUrlChange(),
      ElementFinder.waitForNetworkIdle()
    ]);
    
    this.logger.success("Continued to next page");
  }
  
  async fillSearchParameters() {
    this.logger.info("Filling search parameters...");
    
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
      this.config.selectors.formFields.reason,
      this.config.appointmentData.reason
    );
    
    this.logger.success("Search parameters filled");
  }
  
  async searchForAppointment() {
    this.logger.info("Clicking search button...");
    const button = await ElementFinder.findElement(this.config.selectors.searchButton);
    button.click();
    
    await ElementFinder.waitForNetworkIdle();
    this.logger.success("Search completed, checking for available appointments...");
    
    // Additional logic to find available appointments would go here
    // This would depend on how the site displays availability
  }

}

// Start the automation when the extension runs
(async function main() {
  try {
    console.log("🔄 Appointment automation extension loaded");
    // Wait a bit to ensure the page is fully loaded
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const automation = new AppointmentAutomation(AUTOMATION_CONFIG);
    await automation.start();
  } catch (error) {
    console.error("Extension initialization failed:", error);
  }
})();
