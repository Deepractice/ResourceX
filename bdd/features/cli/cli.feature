@cli
Feature: ResourceX CLI
  As a developer
  I want to use rx CLI to manage resources
  So that I can add, push, pull and use resources locally and remotely

  Background:
    Given a running registry server
    And rx CLI is configured with the test registry

  # ============================================
  # Local operations - add, list, use, remove
  # ============================================

  Scenario: Add resource from directory
    Given a CLI resource directory "hello-prompt" with:
      | file          | content                                          |
      | resource.json | {"name":"hello","type":"text","version":"1.0.0"} |
      | content       | Hello World!                                     |
    When I run rx command "add ./hello-prompt"
    Then the command should succeed
    And the output should contain "Added"
    And the output should contain "hello:1.0.0"

  Scenario: List local resources
    Given a local resource "test:1.0.0" with content "Test content"
    When I run rx command "list"
    Then the command should succeed
    And the output should contain "test:1.0.0"

  Scenario: Use local resource
    Given a local resource "greeting:1.0.0" with content "Hello from CLI!"
    When I run rx command "use greeting:1.0.0"
    Then the command should succeed
    And the output should contain "Hello from CLI!"

  Scenario: Get resource info
    Given a local resource "myinfo:1.0.0" with content "Info content"
    When I run rx command "info myinfo:1.0.0"
    Then the command should succeed
    And the output should contain "myinfo:1.0.0"
    And the output should contain "content"

  Scenario: Remove local resource
    Given a local resource "removeme:1.0.0" with content "To be removed"
    When I run rx command "remove removeme:1.0.0"
    Then the command should succeed
    And the output should contain "Removed"
    When I run rx command "list"
    Then the output should not contain "removeme:1.0.0"

  # ============================================
  # Remote operations - push, pull, search
  # ============================================

  Scenario: Push resource to remote registry
    Given a local resource "mypkg:1.0.0" with content "Package content"
    When I run rx command "push mypkg:1.0.0"
    Then the command should succeed
    And the output should contain "Pushed"

  Scenario: Push resource with explicit registry flag
    Given a local resource "explicit:1.0.0" with content "Explicit registry"
    When I run rx command "push explicit:1.0.0 --registry http://localhost:3099"
    Then the command should succeed
    And the output should contain "Pushed"

  Scenario: Search remote registry
    Given a remote resource "searchme:1.0.0" on the registry
    When I run rx command "search searchme"
    Then the command should succeed
    And the output should contain "searchme:1.0.0"

  Scenario: Pull resource from remote registry
    Given a remote resource "pullme:1.0.0" on the registry with content "Pulled content"
    And the resource is not in local cache
    When I run rx command "pull pullme:1.0.0"
    Then the command should succeed
    And the output should contain "Pulled"

  @pending
  Scenario: Use pulls from remote if not local (auto-pull)
    Given a remote resource "autopull:1.0.0" on the registry with content "Auto pulled"
    And the resource is not in local cache
    When I run rx command "use autopull:1.0.0"
    Then the command should succeed
    And the output should contain "Auto pulled"

  # ============================================
  # Configuration
  # ============================================

  Scenario: List configuration
    When I run rx command "config list"
    Then the command should succeed
    And the output should contain "path:"
    And the output should contain "registry:"

  Scenario: Set registry configuration
    When I run rx command "config set registry http://example.com"
    Then the command should succeed
    And the output should contain "Set registry"

  # ============================================
  # Error handling
  # ============================================

  Scenario: Add non-existent directory fails
    When I run rx command "add ./non-existent-dir"
    Then the command should fail
    And the output should contain "Cannot load resource"

  Scenario: Use non-existent resource fails
    When I run rx command "use notfound:1.0.0"
    Then the command should fail
    And the output should contain "not found"

  Scenario: Push without registry configured fails
    Given rx CLI has no registry configured
    When I run rx command "push someresource:1.0.0"
    Then the command should fail
    And the output should contain "No registry configured"

  Scenario: Pull without registry configured fails
    Given rx CLI has no registry configured
    When I run rx command "pull someresource:1.0.0"
    Then the command should fail
    And the output should contain "No registry configured"
