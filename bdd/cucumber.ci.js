/**
 * Cucumber.js configuration for CI
 *
 * Excludes @network tests that require external network access
 */

export default {
  format: ["progress-bar", "html:reports/cucumber-report.html"],
  formatOptions: { snippetInterface: "async-await" },
  import: ["support/**/*.ts", "steps/**/*.ts"],
  paths: ["features/**/*.feature"],
  tags: "not @pending and not @skip and not @network",
  worldParameters: {
    defaultTimeout: 30000,
  },
};
