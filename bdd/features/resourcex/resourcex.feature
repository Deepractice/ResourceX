@resourcex
Feature: ResourceX API
  Unified resource management for AI agents

  # ============================================
  # Local Resources (no domain)
  # ============================================

  @add
  Scenario: Add resource from directory
    Given a resource directory with:
      | name      | type | version | content       |
      | my-prompt | text | 1.0.0   | Hello World!  |
    When I add the resource directory
    Then the resource "my-prompt:1.0.0" should exist
    And using "my-prompt:1.0.0" should return "Hello World!"

  @has
  Scenario: Check if local resource exists
    Given I have added resource "hello:1.0.0" with type "text"
    Then has "hello:1.0.0" should return true
    And has "not-exist:1.0.0" should return false

  @info
  Scenario: Get resource info
    Given I have added resource "info-test:1.0.0" with type "text" and content "Test content"
    When I get info for "info-test:1.0.0"
    Then info name should be "info-test"
    And info type should be "text"
    And info version should be "1.0.0"

  @remove
  Scenario: Remove local resource
    Given I have added resource "to-remove:1.0.0" with type "text"
    When I remove "to-remove:1.0.0"
    Then has "to-remove:1.0.0" should return false

  @use
  Scenario: Use text resource
    Given I have added resource "greeting:1.0.0" with type "text" and content "Hello!"
    When I use "greeting:1.0.0"
    Then execute should return "Hello!"

  @use
  Scenario: Use json resource
    Given I have added resource "config:1.0.0" with type "json" and content '{"key": "value"}'
    When I use "config:1.0.0"
    Then execute should return object with key "key"

  # ============================================
  # Search
  # ============================================

  @search
  Scenario: Search local resources
    Given I have added resources:
      | locator        | type |
      | alpha:1.0.0    | text |
      | beta:1.0.0     | text |
      | alpha-two:1.0.0| text |
    When I search for "alpha"
    Then search should find 2 resources

  # ============================================
  # Custom Types
  # ============================================

  @type
  Scenario: Support custom type
    Given a custom "upper" type that uppercases content
    When I add resource "test:1.0.0" with type "upper" and content "hello"
    And I use "test:1.0.0"
    Then execute should return "HELLO"
