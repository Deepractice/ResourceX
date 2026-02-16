@journey @consumer
Feature: Cache management
  As a Resource Consumer
  I want to manage my local cache
  So that I can control storage and freshness

  Background:
    Given a consumer test environment
    And a registry server with published resources

  Scenario: View cached resources
    # Pull some resources
    Given the registry has resource "cached-a:1.0.0" with content "Content A"
    And the registry has resource "cached-b:1.0.0" with content "Content B"
    When I run consumer command "rx pull cached-a:1.0.0"
    And I run consumer command "rx pull cached-b:1.0.0"

    # List shows cached resources with full locator
    When I run consumer command "rx list"
    Then the output should contain "localhost:3098/cached-a:1.0.0"
    And the output should contain "localhost:3098/cached-b:1.0.0"

  Scenario: Remove cached resource to free space
    Given the registry has resource "removable:1.0.0" with content "To remove"
    When I run consumer command "rx pull removable:1.0.0"
    Then the command should succeed

    # Remove from cache (use full locator)
    When I run consumer command "rx remove localhost:3098/removable:1.0.0"
    Then the command should succeed

    # No longer in cache
    When I run consumer command "rx list"
    Then the output should not contain "removable"

    # Can re-pull if needed
    When I run consumer command "rx pull removable:1.0.0"
    Then the command should succeed

  Scenario: Update cached resource to latest version
    # Pull old version
    Given the registry has resource "updatable:1.0.0" with content "Old content"
    When I run consumer command "rx pull updatable:1.0.0"

    # New version becomes available
    Given the registry has resource "updatable:1.1.0" with content "New content"

    # Pull new version
    When I run consumer command "rx pull updatable:1.1.0"
    Then the command should succeed

    # Both versions in cache (use full locator)
    When I run consumer command "rx ingest localhost:3098/updatable:1.0.0"
    Then the output should contain "Old content"
    When I run consumer command "rx ingest localhost:3098/updatable:1.1.0"
    Then the output should contain "New content"

  Scenario: Clear entire cache
    # Pull multiple resources
    Given the registry has resource "clear-a:1.0.0" with content "A"
    And the registry has resource "clear-b:1.0.0" with content "B"
    When I run consumer command "rx pull clear-a:1.0.0"
    And I run consumer command "rx pull clear-b:1.0.0"

    # Clear all cache
    When I run consumer command "rx cache clear"
    Then the command should succeed

    # Cache is empty
    When I run consumer command "rx list"
    Then the output should not contain "clear-a"
    And the output should not contain "clear-b"

  @pending
  Scenario: Force refresh bypasses cache
    Given the registry has resource "refresh:1.0.0" with content "Original"
    When I run consumer command "rx pull refresh:1.0.0"

    # Content changes on registry (simulated)
    Given the registry resource "refresh:1.0.0" content changes to "Updated"

    # Normal use uses cache
    When I run consumer command "rx ingest localhost:3098/refresh:1.0.0"
    Then the output should contain "Original"

    # Force refresh fetches new content
    When I run consumer command "rx ingest localhost:3098/refresh:1.0.0 --force"
    Then the output should contain "Updated"
