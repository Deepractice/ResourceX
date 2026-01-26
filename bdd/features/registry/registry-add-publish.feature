@registry
Feature: Registry Add and Publish
  Add resources to local registry and publish to remote

  Background:
    Given a clean local registry

  # ============================================
  # Add - Copy resource to local registry
  # ============================================

  @add
  Scenario: Add resource from RXR object
    Given I have a resource "hello.text@1.0.0" with content "Hello World"
    When I add the resource to registry
    Then I should be able to resolve "hello.text@1.0.0"
    And the content should be "Hello World"

  @add
  Scenario: Add resource from directory path
    Given a resource directory "./test-resource" with:
      | file          | content       |
      | resource.json | {"name": "greeting", "type": "text", "version": "1.0.0"} |
      | content   | Hello from directory |
    When I add "./test-resource" to registry
    Then I should be able to resolve "greeting.text@1.0.0"
    And the content should be "Hello from directory"

  @add
  Scenario: Add resource twice overwrites
    Given I have a resource "test.text@1.0.0" with content "Version 1"
    When I add the resource to registry
    And I create a resource "test.text@1.0.0" with content "Version 2"
    And I add the resource to registry
    And I resolve "test.text@1.0.0"
    Then the content should be "Version 2"

  # ============================================
  # Link - Symlink to development directory
  # ============================================

  @link
  Scenario: Link development directory
    Given a resource directory "./dev-resource" with:
      | file          | content       |
      | resource.json | {"name": "dev", "type": "text", "version": "1.0.0"} |
      | content   | Original content |
    When I link "./dev-resource" to registry
    Then I should be able to resolve "dev.text@1.0.0"
    And the content should be "Original content"

  @link
  Scenario: Link reflects file changes immediately
    Given a resource directory "./live-resource" with:
      | file          | content       |
      | resource.json | {"name": "live", "type": "text", "version": "1.0.0"} |
      | content   | Before change |
    When I link "./live-resource" to registry
    And I modify "./live-resource/content" to "After change"
    And I resolve "live.text@1.0.0"
    Then the content should be "After change"

  @link
  Scenario: Add does not reflect file changes
    Given a resource directory "./static-resource" with:
      | file          | content       |
      | resource.json | {"name": "static", "type": "text", "version": "1.0.0"} |
      | content   | Before change |
    When I add "./static-resource" to registry
    And I modify "./static-resource/content" to "After change"
    And I resolve "static.text@1.0.0"
    Then the content should be "Before change"

  # ============================================
  # Publish - Publish to remote registry
  # ============================================

  @publish @pending
  Scenario: Publish requires options
    Given a resource "pub.text@1.0.0" with content "Publish me"
    When I publish the resource without options
    Then it should throw an error about missing options

  @publish @pending
  Scenario: Publish from RXR object
    Given a resource "pub.text@1.0.0" with content "Publish me"
    And a mock remote registry
    When I publish the resource to the mock remote
    Then the mock remote should receive the resource

  @publish @pending
  Scenario: Publish from directory path
    Given a resource directory "./publish-resource" with:
      | file          | content       |
      | resource.json | {"name": "frompub", "type": "text", "version": "1.0.0"} |
      | content   | Publish from dir |
    And a mock remote registry
    When I publish "./publish-resource" to the mock remote
    Then the mock remote should receive the resource
