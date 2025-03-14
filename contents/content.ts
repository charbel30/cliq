import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://rvsq.gouv.qc.ca/prendrerendezvous/Principale.aspx?/*"],
  all_frames: true,
  world: "MAIN"
}
// go into the website  let it load  click on schedule appointement , let it load , add the inputs first name , last name , Health insurance number
// health insurance card sequential number , date of bith , and that they agree, then click on the continue button
// wait for the page to load , click on schedule an appointement , wait for the page to load
// change the parameters: from this dte , postal code , search parameter and add a reason for the appointement
// press search and find  an available appointement.

const AUTOMATION_CONFIG = {
  appointmentData: {
    firstName: "John",
    lastName: "Doe",
    healthInsuranceNumber: "ABCD12345678",
    sequentialNumber: "01",
    dateOfBirth: "1990-01-01",
    postalCode: "H2X 1Y2",
    searchRadius: "[RADIUS]", // km
    reason: "[REASON]"
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
    },
    timeouts: {
      elementWait: 30000,
      pageTransition: 5000,
    }
    
  }
}
/**
 * Advanced Element Finder with multiple strategies
 * Uses a combination of selectors, text content, and attributes
 */


