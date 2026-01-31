/**
 * Cucumber.js configuration for ResourceX
 *
 * Usage:
 *   bun test:bdd                           # All tests (excluding @pending)
 *   bun test:bdd --tags @cli               # Only CLI tests
 *   bun test:bdd --tags @journey           # Only user journey tests
 *   bun test:bdd --tags "not @pending"     # Exclude pending tests
 *
 * Structure:
 *   features/   - Unit/integration tests (fine-grained, per-package)
 *   journeys/   - User journey tests (end-to-end scenarios)
 */

export default {
  format: ["progress-bar", "html:reports/cucumber-report.html"],
  formatOptions: { snippetInterface: "async-await" },
  import: ["support/**/*.ts", "steps/**/*.ts"],
  paths: ["features/**/*.feature", "journeys/**/*.feature"],
  tags: "not @pending and not @skip",
  worldParameters: {
    defaultTimeout: 30000,
  },
};
