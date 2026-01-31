@resourcex
Feature: ResourceX
  Unified resource management API

  Background:
    Given a ResourceX client with default configuration

  # ============================================
  # Level 1: Core API - save, get, resolve
  # ============================================

  @save @core
  Scenario: Save a localhost resource
    Given an RXR with:
      | domain    | name      | type | version |
      | localhost | my-prompt | text | 1.0.0   |
    And RXR content "Hello, {{name}}!"
    When I save the RXR
    Then I can get resource "localhost/my-prompt.text@1.0.0"

  @get @core
  Scenario: Get a saved resource
    Given a saved RXR "localhost/hello.text@1.0.0" with content "Hello World"
    When I get resource "localhost/hello.text@1.0.0"
    Then I should receive an RXR
    And manifest name should be "hello"
    And manifest type should be "text"

  @get @core
  Scenario: Get non-existent localhost resource
    When I get resource "localhost/not-exist.text@1.0.0"
    Then it should throw RegistryError
    And the error message should contain "not found"

  @resolve @core
  Scenario: Resolve a text resource
    Given a saved RXR "localhost/greeting.text@1.0.0" with content "Hello!"
    When I resolve resource "localhost/greeting.text@1.0.0"
    Then I should receive a ResolvedResource
    And executing should return text "Hello!"

  @resolve @core
  Scenario: Resolve a json resource
    Given an RXR with:
      | domain    | name   | type | version |
      | localhost | config | json | 1.0.0   |
    And RXR content '{"key": "value"}'
    When I save the RXR
    And I resolve resource "localhost/config.json@1.0.0"
    Then executing should return object with key "key" and value "value"

  # ============================================
  # Level 2: CRUD - has, remove
  # ============================================

  @has @crud
  Scenario: Check if resource exists
    Given a saved RXR "localhost/test.text@1.0.0"
    When I check has "localhost/test.text@1.0.0"
    Then has should return true

  @has @crud
  Scenario: Check non-existent resource
    When I check has "localhost/no-such.text@1.0.0"
    Then has should return false

  @remove @crud
  Scenario: Remove a resource
    Given a saved RXR "localhost/to-remove.text@1.0.0"
    When I remove resource "localhost/to-remove.text@1.0.0"
    Then has for "localhost/to-remove.text@1.0.0" should return false

  # ============================================
  # Level 3: Dev - link, load
  # ============================================

  @link @dev
  Scenario: Link a development directory
    Given a dev directory with resource:
      | domain    | name       | type | version |
      | localhost | dev-prompt | text | 1.0.0   |
    And dev content "Development content"
    When I link the dev directory
    Then I can get resource "localhost/dev-prompt.text@1.0.0"
    And resource content should be "Development content"

  @link @dev
  Scenario: Linked resources take priority
    Given a saved RXR "localhost/test.text@1.0.0" with content "Saved"
    And a linked dev directory "localhost/test.text@1.0.0" with content "Linked"
    When I get resource "localhost/test.text@1.0.0"
    Then resource content should be "Linked"

  @load @dev
  Scenario: Load resource from directory without saving
    Given a dev directory with resource:
      | domain    | name        | type | version |
      | localhost | load-test   | text | 1.0.0   |
    And dev content "Load content"
    When I load the dev directory
    Then I should receive an RXR
    And loaded content should be "Load content"

  # ============================================
  # Level 4: Search
  # ============================================

  @search
  Scenario: Search local resources
    Given saved RXRs:
      | locator                        |
      | localhost/alpha.text@1.0.0     |
      | localhost/beta.text@1.0.0      |
      | localhost/alpha-two.text@1.0.0 |
    When I search resources with query "alpha"
    Then search should find 2 resources

  @search
  Scenario: Search with limit
    Given saved RXRs:
      | locator                   |
      | localhost/a.text@1.0.0    |
      | localhost/b.text@1.0.0    |
      | localhost/c.text@1.0.0    |
    When I search resources with limit 2
    Then search should find 2 resources

  # ============================================
  # Level 5: Extension - supportType
  # ============================================

  @type @extension
  Scenario: Add custom type support
    Given a custom uppercase type "uppercase"
    When I register the uppercase type
    And I save an RXR "localhost/test.uppercase@1.0.0" with content "hello"
    And I resolve resource "localhost/test.uppercase@1.0.0"
    Then executing should return text "HELLO"

  # ============================================
  # Configuration
  # ============================================

  @config
  Scenario: Create ResourceX with custom path
    Given a ResourceX client with path "./custom-rx"
    When I save an RXR "localhost/test.text@1.0.0"
    Then resource should be stored in "./custom-rx"

  # ============================================
  # Storage routing
  # ============================================

  @storage
  Scenario: Localhost resources go to hosted
    Given a saved RXR "localhost/local.text@1.0.0"
    Then resource should be in hosted storage

  @storage
  Scenario: Linked resources take priority over hosted
    Given a saved RXR "localhost/priority.text@1.0.0" with content "hosted"
    And a linked dev directory "localhost/priority.text@1.0.0" with content "linked"
    When I get resource "localhost/priority.text@1.0.0"
    Then resource content should be "linked"
