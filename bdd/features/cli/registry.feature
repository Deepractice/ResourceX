@cli @registry
Feature: Registry Management
  As a developer working with multiple registries
  I want to manage registry configurations via rx CLI
  So that I can push resources to different registries conveniently

  Background:
    Given a running registry server

  # ============================================
  # Add registry
  # ============================================

  Scenario: Add a registry
    When I run rx command "registry add local http://localhost:3099"
    Then the command should succeed
    And the output should contain "Added registry"
    And the output should contain "local"

  Scenario: Add a registry and set as default
    When I run rx command "registry add official https://registry.deepractice.ai --default"
    Then the command should succeed
    And the output should contain "Added registry"
    And the output should contain "(default)"

  Scenario: Add duplicate registry name fails
    Given a registry "local" is configured with url "http://localhost:3099"
    When I run rx command "registry add local http://other:3000"
    Then the command should fail
    And the output should contain "already exists"

  # ============================================
  # List registries
  # ============================================

  Scenario: List registries when none configured
    When I run rx command "registry list"
    Then the command should succeed
    And the output should contain "No registries configured"

  Scenario: List configured registries
    Given a registry "local" is configured with url "http://localhost:3099"
    And a registry "official" is configured with url "https://registry.deepractice.ai" as default
    When I run rx command "registry list"
    Then the command should succeed
    And the output should contain "local"
    And the output should contain "http://localhost:3099"
    And the output should contain "official"
    And the output should contain "(default)"

  # ============================================
  # Set default registry
  # ============================================

  Scenario: Set default registry
    Given a registry "local" is configured with url "http://localhost:3099"
    And a registry "official" is configured with url "https://registry.deepractice.ai"
    When I run rx command "registry default local"
    Then the command should succeed
    And the output should contain "Default registry set to"
    And the output should contain "local"

  Scenario: Set default to non-existent registry fails
    When I run rx command "registry default nonexistent"
    Then the command should fail
    And the output should contain "not found"

  # ============================================
  # Remove registry
  # ============================================

  Scenario: Remove a registry
    Given a registry "local" is configured with url "http://localhost:3099"
    When I run rx command "registry remove local"
    Then the command should succeed
    And the output should contain "Removed registry"
    When I run rx command "registry list"
    Then the output should not contain "local"

  Scenario: Remove non-existent registry fails
    When I run rx command "registry remove nonexistent"
    Then the command should fail
    And the output should contain "not found"

  # ============================================
  # Push uses default registry
  # ============================================

  Scenario: Push uses default registry when no flag specified
    Given a registry "local" is configured with url "http://localhost:3099" as default
    And a local resource "mypkg:1.0.0" with content "Package content"
    When I run rx command "push mypkg:1.0.0"
    Then the command should succeed
    And the output should contain "Pushed"

  Scenario: Push uses named registry with --registry flag
    Given a registry "local" is configured with url "http://localhost:3099"
    And a local resource "mypkg:1.0.0" with content "Package content"
    When I run rx command "push mypkg:1.0.0 --registry local"
    Then the command should succeed
    And the output should contain "Pushed"

  # ============================================
  # Backward compatibility
  # ============================================

  Scenario: Old single registry config is auto-migrated
    Given an old config with registry "http://localhost:3099"
    When I run rx command "registry list"
    Then the command should succeed
    And the output should contain "default"
    And the output should contain "http://localhost:3099"
    And the output should contain "(default)"

  # ============================================
  # First registry is auto-default
  # ============================================

  Scenario: First added registry becomes default automatically
    When I run rx command "registry add first http://localhost:3099"
    Then the command should succeed
    And the output should contain "(default)"
