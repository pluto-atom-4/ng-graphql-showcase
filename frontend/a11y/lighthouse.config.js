/**
 * Lighthouse Configuration for Accessibility Audits
 * Baseline audit configuration for Phase 4 accessibility testing
 */

module.exports = {
  extends: 'lighthouse:default',
  settings: {
    // Chrome flags for headless audit
    chromeFlags: ['--headless'],
    // Disable network throttling for baseline
    throttleMethod: 'devtools',
    // Enable full page screenshot
    includeFullPageScreenshot: true,
  },
  // Audit configuration
  onlyCategories: ['accessibility', 'performance', 'best-practices', 'seo'],
  // Output format
  output: ['json', 'html'],
};
