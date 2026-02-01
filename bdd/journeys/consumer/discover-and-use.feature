@journey @consumer
Feature: Discover and use resources
  As a Resource Consumer
  I want to discover and use resources from registries
  So that I can leverage existing solutions

  Background:
    Given a consumer test environment
    And a registry server with published resources

  Scenario: Search and use a resource
    # Discover resources
    Given the registry has resource "helper:1.0.0" with content "Helper content"
    When I run consumer command "rx search helper"
    Then the command should succeed
    And the output should contain "helper:1.0.0"

    # Pull and use the resource (must use full locator after pull)
    When I run consumer command "rx pull helper:1.0.0"
    Then the command should succeed
    When I run consumer command "rx use localhost:3098/helper:1.0.0"
    Then the command should succeed
    And the output should contain "Helper content"

  Scenario: Browse available resources
    Given the registry has these resources:
      | locator          | content          |
      | tool-a:1.0.0     | Tool A content   |
      | tool-b:1.0.0     | Tool B content   |
      | prompt-x:1.0.0   | Prompt X content |
    When I run consumer command "rx search tool"
    Then the output should contain "tool-a:1.0.0"
    And the output should contain "tool-b:1.0.0"
    And the output should not contain "prompt-x"

  Scenario: Get resource information before using
    Given the registry has resource "documented:2.0.0" with content "Doc content"
    When I run consumer command "rx pull documented:2.0.0"
    Then the command should succeed
    When I run consumer command "rx info localhost:3098/documented:2.0.0"
    Then the command should succeed
    And the output should contain "documented"
    And the output should contain "2.0.0"

  Scenario: Pull resource for offline use
    Given the registry has resource "offline:1.0.0" with content "Offline content"
    When I run consumer command "rx pull offline:1.0.0"
    Then the command should succeed

    # Should work without network (use full locator)
    Given the registry is unavailable
    When I run consumer command "rx use localhost:3098/offline:1.0.0"
    Then the command should succeed
    And the output should contain "Offline content"

  Scenario: Use specific version when multiple exist
    Given the registry has these resources:
      | locator          | content   |
      | versioned:1.0.0  | Version 1 |
      | versioned:2.0.0  | Version 2 |
      | versioned:3.0.0  | Version 3 |

    When I run consumer command "rx pull versioned:1.0.0"
    And I run consumer command "rx pull versioned:3.0.0"

    When I run consumer command "rx use localhost:3098/versioned:1.0.0"
    Then the output should contain "Version 1"

    When I run consumer command "rx use localhost:3098/versioned:3.0.0"
    Then the output should contain "Version 3"

  Scenario: Resolve caches automatically
    Given the registry has resource "cacheable:1.0.0" with content "Cached content"

    # First pull fetches from registry
    When I run consumer command "rx pull cacheable:1.0.0"
    Then the command should succeed

    # Second use uses cache (even if registry is down)
    Given the registry is unavailable
    When I run consumer command "rx use localhost:3098/cacheable:1.0.0"
    Then the command should succeed
    And the output should contain "Cached content"

  Scenario: Use latest tag when version omitted
    Given the registry has resource "simple:latest" with content "Latest content"
    When I run consumer command "rx pull simple"
    Then the command should succeed
    When I run consumer command "rx use localhost:3098/simple"
    Then the command should succeed
    And the output should contain "Latest content"
