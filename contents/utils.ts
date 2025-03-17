// Utility module for CLIQ automation
// This module contains utility functions and classes used by the automation process

import { AUTOMATION_CONFIG } from "./config";

/**
 * ElementFinder class for finding and interacting with DOM elements
 * This class provides methods for finding elements, filling inputs, and waiting for page changes
 */
export class ElementFinder {
  /**
   * Find an element on the page using multiple selector options
   * @param selectorOptions Array of CSS selectors to try
   * @param timeout Maximum time to wait for the element (in milliseconds)
   * @returns Promise that resolves to the found element
   */
  static async findElement(
    selectorOptions: string[],
    timeout = AUTOMATION_CONFIG.timeouts.elementWait
  ): Promise<HTMLElement> {
    // try all selectors in parallel
    const selectorpromises = selectorOptions.map((selector) =>
      this.waitForElementWithMutationObserver(selector, timeout)
    );
    selectorpromises.push(
      this.findElementByText("button", selectorOptions[0], timeout)
    );

    try {
      return await Promise.race(selectorpromises);
    } catch (error) {
      console.error(`Failed to find element with selectors:`, selectorOptions);
      throw error;
    }
  }

  /**
   * Wait for an element to appear in the DOM using MutationObserver
   * @param selector CSS selector for the element
   * @param timeout Maximum time to wait (in milliseconds)
   * @returns Promise that resolves to the found element
   */
  static waitForElementWithMutationObserver(selector: string, timeout = 30000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      // Check if element already exists
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log(`Found element with selector ${selector} immediately`);
        resolve(element);
        return;
      }
      
      // Try to find element in all frames
      const frames = document.querySelectorAll('iframe');
      for (let i = 0; i < frames.length; i++) {
        try {
          const frameDoc = frames[i].contentDocument || frames[i].contentWindow.document;
          const frameElement = frameDoc.querySelector(selector) as HTMLElement;
          if (frameElement) {
            console.log(`Found element with selector ${selector} in iframe ${i}`);
            resolve(frameElement);
            return;
          }
        } catch (e) {
          console.log(`Cannot access iframe ${i} content due to same-origin policy`);
        }
      }

      let timeoutId: number;
      let checkInterval: number;

      // Create mutation observer
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          observer.disconnect();
          console.log(`Found element with selector ${selector} after DOM mutation`);
          resolve(element);
        }
      });

      // Also check periodically in case mutation observer misses something
      checkInterval = window.setInterval(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          observer.disconnect();
          console.log(`Found element with selector ${selector} during interval check`);
          resolve(element);
          return;
        }
        
        // Check iframes again
        for (let i = 0; i < frames.length; i++) {
          try {
            const frameDoc = frames[i].contentDocument || frames[i].contentWindow.document;
            const frameElement = frameDoc.querySelector(selector) as HTMLElement;
            if (frameElement) {
              clearTimeout(timeoutId);
              clearInterval(checkInterval);
              observer.disconnect();
              console.log(`Found element with selector ${selector} in iframe ${i} during interval check`);
              resolve(frameElement);
              return;
            }
          } catch (e) {
            // Ignore same-origin errors
          }
        }
      }, 1000);

      // Set timeout for rejection
      timeoutId = window.setTimeout(() => {
        observer.disconnect();
        clearInterval(checkInterval);
        console.log(`Element ${selector} not found within ${timeout}ms`);
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);

      // Start observing with all possible mutation types
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    });
  }

  /**
   * Find an element by its text content
   * @param elementType Type of element to search for (e.g., "button", "a")
   * @param textContent Text content to search for
   * @param timeout Maximum time to wait (in milliseconds)
   * @returns Promise that resolves to the found element
   */
  static findElementByText(elementType: string, textContent: string, timeout = 30000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      // Check if element already exists
      const elements = Array.from(document.querySelectorAll(elementType));
      const element = elements.find(el => 
        el.textContent.trim().toLowerCase().includes(textContent.toLowerCase()));
      
      if (element) {
        resolve(element as HTMLElement);
        return;
      }
      let timeoutId: number;
      
      // Create mutation observer
      const observer = new MutationObserver(() => {
        const elements = Array.from(document.querySelectorAll(elementType));
        const element = elements.find(el => 
          el.textContent.trim().toLowerCase().includes(textContent.toLowerCase()));
        
        if (element) {
          clearTimeout(timeoutId);
          observer.disconnect();
          resolve(element as HTMLElement);
        }
      });
      
      // Set timeout for rejection
      timeoutId = window.setTimeout(() => {
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
  
  /**
   * Fill an input field with a value
   * @param fieldSelectors Array of CSS selectors for the input field
   * @param value Value to fill in
   * @returns Promise that resolves to the filled input element
   */
  static async fillInput(fieldSelectors: string[], value: string): Promise<HTMLElement> {
    const input = await this.findElement(fieldSelectors);
    
    // Handle different input types appropriately
    if (input instanceof HTMLInputElement && input.type === 'checkbox') {
      if (!input.checked) input.click();
    } else if (input instanceof HTMLSelectElement) {
      // Handle dropdown selection
      const option = Array.from(input.options).find((opt: HTMLOptionElement) => 
        opt.text.toLowerCase().includes(value.toLowerCase()) || 
        opt.value.toLowerCase().includes(value.toLowerCase())
      );
      
      if (option) {
        input.value = (option as HTMLOptionElement).value;
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      // Text inputs, date inputs, etc.
      input.value = value;
      // Trigger input and change events to activate any listeners
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    return input;
  }

  /**
   * Wait for the URL to change
   * @param timeout Maximum time to wait (in milliseconds)
   * @returns Promise that resolves when the URL changes
   */
  static async waitForUrlChange(timeout = AUTOMATION_CONFIG.timeouts.pageTransition): Promise<void> {
    return new Promise((resolve, reject) => {
      const startUrl = window.location.href;
      let intervalId: number;
      let timeoutId: number;
      
      intervalId = window.setInterval(() => {
        if (window.location.href !== startUrl) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          // Add small delay to ensure page is loaded
          setTimeout(resolve, 2000);
        }
      }, 100);
      
      timeoutId = window.setTimeout(() => {
        clearInterval(intervalId);
        reject(new Error(`URL did not change within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Wait for the page to fully load
   * @returns Promise that resolves when the page is loaded
   */
  static async waitForPageLoad(): Promise<void> {
    if (document.readyState === 'complete') return;
    
    return new Promise<void>(resolve => {
      window.addEventListener('load', () => resolve(), { once: true });
    });
  }
  
  /**
   * Wait for network activity to become idle
   * @param timeout Maximum time to wait (in milliseconds)
   * @returns Promise that resolves when network is idle
   */
  static async waitForNetworkIdle(timeout = 5000): Promise<void> {
    return new Promise<void>(resolve => {
      let lastActivity = Date.now();
      let requestCount = 0;
      let timeoutId: number;
      
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
      
      const intervalId = window.setInterval(checkIdle, 100);
      
      // Maximum wait time
      setTimeout(() => {
        clearInterval(intervalId);
        XMLHttpRequest.prototype.open = originalXHROpen;
        window.fetch = originalFetch;
        resolve();
      }, timeout);
    });
  }

  /**
   * Check if an element exists on the page
   * @param selector CSS selector for the element
   * @returns Boolean indicating if the element exists
   */
  static elementExists(selector: string): boolean {
    return document.querySelector(selector) !== null;
  }

  /**
   * Check if any error message is displayed on the page
   * @returns Boolean indicating if an error is displayed
   */
  static hasErrorMessage(): boolean {
    for (const errorType in AUTOMATION_CONFIG.selectors.errorMessages) {
      const selectors = AUTOMATION_CONFIG.selectors.errorMessages[errorType];
      for (const selector of selectors) {
        if (this.elementExists(selector)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get the text of any error message displayed on the page
   * @returns Error message text or null if no error
   */
  static getErrorMessage(): string | null {
    for (const errorType in AUTOMATION_CONFIG.selectors.errorMessages) {
      const selectors = AUTOMATION_CONFIG.selectors.errorMessages[errorType];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent.trim();
        }
      }
    }
    return null;
  }
}

/**
 * Logger class for consistent logging
 */
export class Logger {
  private prefix: string;

  constructor(prefix: string = "CLIQ") {
    this.prefix = prefix;
  }

  info(msg: string): void {
    console.log(`[${this.prefix}] ${msg}`);
  }

  error(msg: string, error?: any): void {
    console.error(`[${this.prefix}] ${msg}`, error || "");
  }

  warn(msg: string): void {
    console.warn(`[${this.prefix}] ${msg}`);
  }

  success(msg: string): void {
    console.log(`[${this.prefix}] ✓ ${msg}`);
  }
}

// Export a default logger instance
export const logger = new Logger();

// Export default ElementFinder
export default ElementFinder;
