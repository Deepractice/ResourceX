@registry @resolve
Feature: Registry Resolve
  Registry.resolve() returns ResolvedResource with execute function.
  This avoids the global singleton issue when bundled.

  Background:
    Given a registry with default configuration

  # ============================================
  # Basic resolve - returns ResolvedResource
  # ============================================

  @resolved-resource
  Scenario: Resolve returns ResolvedResource with execute
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello"
    When I resolve "localhost/hello.text@1.0.0"
    Then I should receive a ResolvedResource
    And I can call execute() to get "Hello"

  @resolved-resource
  Scenario: ResolvedResource contains original resource
    Given a linked resource "localhost/test.text@1.0.0" with content "Test"
    When I resolve "localhost/test.text@1.0.0"
    Then I should receive a ResolvedResource
    And resolved.resource should be the RXR object
    And resolved.resource.manifest.name should be "test"

  # ============================================
  # Custom types - supportType
  # ============================================

  @support-type
  Scenario: Support custom type at creation
    Given a registry with custom types:
      | name   | description    |
      | prompt | AI prompt type |
    And a linked "prompt" resource "localhost/greet.prompt@1.0.0"
    When I resolve "localhost/greet.prompt@1.0.0"
    Then I should receive a ResolvedResource
    And I can call execute()

  @support-type
  Scenario: Support custom type dynamically
    Given a registry with default configuration
    When I call supportType with a "tool" type
    And I link a "tool" resource "localhost/calc.tool@1.0.0"
    And I resolve "localhost/calc.tool@1.0.0"
    Then I should receive a ResolvedResource

  @support-type
  Scenario: Link unsupported type throws error
    Given a registry with default configuration
    When I try to link a resource with unsupported type "unknown"
    Then it should throw a ResourceTypeError
    And error message should contain "Unsupported"

  # ============================================
  # Execute with arguments
  # ============================================

  @execute @args
  Scenario: Execute with arguments
    Given a registry with a "tool" type that accepts arguments
    And a linked tool resource "localhost/add.tool@1.0.0" that adds two numbers
    When I resolve "localhost/add.tool@1.0.0"
    And I call execute with args { "a": 1, "b": 2 }
    Then the result should be 3

  @execute @no-args
  Scenario: Execute without arguments
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello"
    When I resolve "localhost/hello.text@1.0.0"
    And I call execute without arguments
    Then the result should be "Hello"

  # ============================================
  # Schema support
  # ============================================

  @schema
  Scenario: ResolvedResource includes schema for typed args
    Given a registry with a "tool" type that has schema
    And a linked tool resource "localhost/calc.tool@1.0.0"
    When I resolve "localhost/calc.tool@1.0.0"
    Then resolved.schema should be defined
    And schema should describe the expected arguments

  @schema
  Scenario: ResolvedResource has undefined schema for builtin types
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello"
    When I resolve "localhost/hello.text@1.0.0"
    Then resolved.schema should be undefined

  # ============================================
  # Isolation - each registry has its own types
  # ============================================

  @isolation
  Scenario: Each registry has its own type configuration
    Given a registry "A" with custom type "prompt"
    And a registry "B" with custom type "tool"
    Then registry "A" should support "prompt" but not "tool"
    And registry "B" should support "tool" but not "prompt"
