@registry @get
Feature: Registry Get
  Registry.get() returns raw RXR without resolving.
  Use this when you need access to raw resource content.

  Background:
    Given a registry with default configuration

  # ============================================
  # Basic get - returns raw RXR
  # ============================================

  @raw-rxr
  Scenario: Get returns raw RXR object
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello"
    When I get "localhost/hello.text@1.0.0"
    Then I should receive a raw RXR
    And rxr.locator should have name "hello"
    And rxr.manifest should have type "text"
    And rxr.archive should be accessible

  @raw-rxr
  Scenario: Get multi-file resource
    Given a linked multi-file resource "localhost/project.text@1.0.0":
      | path              | content           |
      | src/index.ts      | console.log('hi') |
      | src/utils.ts      | export {}         |
      | README.md         | # Project         |
    When I get "localhost/project.text@1.0.0"
    Then I should receive a raw RXR
    And rxr.archive.extract().files() should have 3 files
    And rxr file "src/index.ts" should contain "console.log"

  # ============================================
  # Error handling
  # ============================================

  @error
  Scenario: Get non-existent resource throws error
    When I get "localhost/not-exist.text@1.0.0"
    Then it should throw a RegistryError
    And error message should contain "not found"

  # ============================================
  # Difference from resolve
  # ============================================

  @difference
  Scenario: Get does not call resolver
    Given a linked resource "localhost/data.json@1.0.0" with content '{"key": "value"}'
    When I get "localhost/data.json@1.0.0"
    Then I should receive a raw RXR
    And rxr.archive should be raw archive content
    And I can read file content as Buffer
