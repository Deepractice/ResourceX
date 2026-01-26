@registry
Feature: Registry
  Resource registry for publish, link, and resolve operations

  Background:
    Given a registry with default configuration

  # ============================================
  # Link - Local development/cache
  # ============================================

  @link
  Scenario: Link a resource to local registry
    Given a resource with:
      | domain   | name      | type   | version |
      | localhost | my-prompt | text | 1.0.0   |
    And resource content "Hello, {{name}}!"
    When I link the resource
    Then the resource should exist in local registry
    And I can resolve "localhost/my-prompt.text@1.0.0"

  @link
  Scenario: Link resource from any domain to local
    Given a resource with:
      | domain          | name      | type   | version |
      | deepractice.ai  | assistant | text | 2.0.0   |
    And resource content "You are an assistant"
    When I link the resource
    Then the resource should be cached locally
    And I can resolve "deepractice.ai/assistant.text@2.0.0" from local

  # ============================================
  # Resolve - Retrieve resources
  # ============================================

  @resolve
  Scenario: Resolve a linked resource
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello"
    When I resolve "localhost/hello.text@1.0.0"
    Then I should receive an RXR object
    And the content should be "Hello"

  @resolve
  Scenario: Resolve non-existent resource
    When I resolve "localhost/not-exist.text@1.0.0"
    Then it should throw a RegistryError
    And error message should contain "not found"

  # ============================================
  # Exists - Check resource existence
  # ============================================

  @exists
  Scenario: Check existing resource
    Given a linked resource "localhost/test.text@1.0.0"
    When I check if "localhost/test.text@1.0.0" exists
    Then it should return true

  @exists
  Scenario: Check non-existing resource
    When I check if "localhost/not-exist.text@1.0.0" exists
    Then it should return false

  # ============================================
  # Delete - Remove resources
  # ============================================

  @delete
  Scenario: Delete a linked resource
    Given a linked resource "localhost/to-delete.text@1.0.0"
    When I delete "localhost/to-delete.text@1.0.0"
    Then the resource should no longer exist
    And checking existence should return false

  @delete
  Scenario: Delete non-existent resource
    When I delete "localhost/not-exist.text@1.0.0"
    Then it should not throw an error

  # ============================================
  # Search - Find resources
  # ============================================

  @search
  Scenario: Search resources by query
    Given linked resources:
      | locator                           |
      | localhost/foo-prompt.text@1.0.0   |
      | localhost/bar-prompt.text@1.0.0   |
      | localhost/foo-tool.binary@1.0.0   |
    When I search with options:
      | key   | value |
      | query | foo   |
    Then I should find 2 resources
    And results should contain "foo-prompt"
    And results should contain "foo-tool"

  @search
  Scenario: Search with pagination - limit
    Given linked resources:
      | locator                   |
      | localhost/a.text@1.0.0    |
      | localhost/b.text@1.0.0    |
      | localhost/c.text@1.0.0    |
      | localhost/d.text@1.0.0    |
      | localhost/e.text@1.0.0    |
    When I search with options:
      | key   | value |
      | limit | 3     |
    Then I should find 3 resources

  @search
  Scenario: Search with pagination - limit and offset
    Given linked resources:
      | locator                   |
      | localhost/a.text@1.0.0    |
      | localhost/b.text@1.0.0    |
      | localhost/c.text@1.0.0    |
      | localhost/d.text@1.0.0    |
      | localhost/e.text@1.0.0    |
    When I search with options:
      | key    | value |
      | limit  | 2     |
      | offset | 2     |
    Then I should find 2 resources
    And results should contain "c"
    And results should contain "d"

  @search
  Scenario: Search with no results
    When I search with options:
      | key   | value       |
      | query | nonexistent |
    Then I should find 0 resources

  @search
  Scenario: Search without options returns all
    Given linked resources:
      | locator                   |
      | localhost/x.text@1.0.0    |
      | localhost/y.text@1.0.0    |
    When I search without options
    Then I should find 2 resources

  # ============================================
  # Custom configuration
  # ============================================

  @config
  Scenario: Create registry with custom path
    Given a registry with path "./custom-registry"
    When I link a resource "localhost/test.text@1.0.0"
    Then the resource should be stored in "./custom-registry"
