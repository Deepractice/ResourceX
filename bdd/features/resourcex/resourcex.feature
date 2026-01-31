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
    Then the resource "my-prompt.text@1.0.0" should exist
    And resolving "my-prompt.text@1.0.0" should return "Hello World!"

  @has
  Scenario: Check if local resource exists
    Given I have added resource "hello.text@1.0.0"
    Then has "hello.text@1.0.0" should return true
    And has "not-exist.text@1.0.0" should return false

  @info
  Scenario: Get resource info
    Given I have added resource "info-test.text@1.0.0" with content "Test content"
    When I get info for "info-test.text@1.0.0"
    Then info name should be "info-test"
    And info type should be "text"
    And info version should be "1.0.0"

  @remove
  Scenario: Remove local resource
    Given I have added resource "to-remove.text@1.0.0"
    When I remove "to-remove.text@1.0.0"
    Then has "to-remove.text@1.0.0" should return false

  @resolve
  Scenario: Resolve text resource
    Given I have added resource "greeting.text@1.0.0" with content "Hello!"
    When I resolve "greeting.text@1.0.0"
    Then execute should return "Hello!"

  @resolve
  Scenario: Resolve json resource
    Given I have added resource "config.json@1.0.0" with content '{"key": "value"}'
    When I resolve "config.json@1.0.0"
    Then execute should return object with key "key"

  # ============================================
  # Development Link
  # ============================================

  @link
  Scenario: Link development directory
    Given a dev directory with resource "dev-test.text@1.0.0" and content "Dev content"
    When I link the dev directory
    Then the resource "dev-test.text@1.0.0" should exist
    And resolving "dev-test.text@1.0.0" should return "Dev content"

  @link
  Scenario: Linked resources take priority over local
    Given I have added resource "priority.text@1.0.0" with content "Local"
    And a linked dev directory with "priority.text@1.0.0" and content "Linked"
    When I resolve "priority.text@1.0.0"
    Then execute should return "Linked"

  # ============================================
  # Search
  # ============================================

  @search
  Scenario: Search local resources
    Given I have added resources:
      | locator              |
      | alpha.text@1.0.0     |
      | beta.text@1.0.0      |
      | alpha-two.text@1.0.0 |
    When I search for "alpha"
    Then search should find 2 resources

  # ============================================
  # Custom Types
  # ============================================

  @type
  Scenario: Support custom type
    Given a custom "upper" type that uppercases content
    When I add resource "test.upper@1.0.0" with content "hello"
    And I resolve "test.upper@1.0.0"
    Then execute should return "HELLO"
