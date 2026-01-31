@cli
Feature: ResourceX CLI
  As a developer
  I want to use rx CLI to manage resources
  So that I can add, push, pull and run resources locally and remotely

  Background:
    Given a running registry server
    And rx CLI is configured with the test registry

  # ============================================
  # Local operations
  # ============================================

  Scenario: Add resource from directory
    Given a CLI resource directory "hello-prompt" with:
      | file          | content                                          |
      | resource.json | {"name":"hello","type":"text","version":"1.0.0"} |
      | content       | Hello World!                                     |
    When I run rx command "add ./hello-prompt"
    Then the command should succeed
    And the output should contain "Added"

  Scenario: List local resources
    Given a local resource "test.text@1.0.0" with content "Test content"
    When I run rx command "list"
    Then the command should succeed
    And the output should contain "test.text@1.0.0"

  Scenario: Run local resource
    Given a local resource "greeting.text@1.0.0" with content "Hello from CLI!"
    When I run rx command "run greeting.text@1.0.0"
    Then the command should succeed
    And the output should contain "Hello from CLI!"

  Scenario: Remove local resource
    Given a local resource "removeme.text@1.0.0" with content "To be removed"
    When I run rx command "remove removeme.text@1.0.0"
    Then the command should succeed
    And the output should contain "Removed"
    When I run rx command "list"
    Then the output should not contain "removeme.text@1.0.0"

  # ============================================
  # Remote operations
  # ============================================

  Scenario: Push resource to remote registry
    Given a local resource "mypkg.text@1.0.0" with content "Package content"
    When I run rx command "push mypkg.text@1.0.0"
    Then the command should succeed
    And the output should contain "Pushed"

  Scenario: Search remote registry
    Given a remote resource "searchme.text@1.0.0" on the registry
    When I run rx command "search searchme"
    Then the command should succeed
    And the output should contain "searchme.text@1.0.0"

  Scenario: Pull resource from remote registry
    Given a remote resource "pullme.text@1.0.0" on the registry with content "Pulled content"
    And the resource is not in local cache
    When I run rx command "pull pullme.text@1.0.0"
    Then the command should succeed
    And the output should contain "Pulled"
    When I run rx command "run pullme.text@1.0.0"
    Then the output should contain "Pulled content"

  # ============================================
  # Configuration
  # ============================================

  Scenario: List configuration
    When I run rx command "config list"
    Then the command should succeed
    And the output should contain "registry:"

  Scenario: Set configuration
    When I run rx command "config set domain mycompany.com"
    Then the command should succeed
    And the output should contain "Set domain"
