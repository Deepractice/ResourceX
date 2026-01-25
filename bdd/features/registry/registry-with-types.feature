@registry @bundled-type
Feature: Registry with Bundled Types
  Registry 接受 BundledType[] 配置，通过 sandbox 执行 resolve

  Background:
    Given a clean test registry directory

  # ============================================
  # createRegistry with types
  # ============================================

  @create
  Scenario: Create registry with builtin types
    When I create a registry with builtin types
    Then the registry should be created successfully
    And the registry should support type "text"
    And the registry should support type "json"
    And the registry should support type "binary"

  @create
  Scenario: Create registry with custom bundled type
    Given a bundled type "custom" with resolve returning uppercase content
    When I create a registry with the custom type
    Then the registry should be created successfully
    And the registry should support type "custom"

  @create
  Scenario: Create registry with mixed types
    Given a bundled type "prompt" with resolve returning "prompt result"
    When I create a registry with builtin and custom types
    Then the registry should support type "text"
    And the registry should support type "prompt"

  @create
  Scenario: Registry without types should not support any type
    When I create a registry without types
    Then the registry should not support type "text"
    And the registry should not support type "custom"

  # ============================================
  # resolve with bundled types
  # ============================================

  @resolve
  Scenario: Resolve text resource with bundled type
    Given a registry with builtin types
    And a text resource "hello.text@1.0.0" with content "Hello World"
    When I resolve "hello.text@1.0.0"
    Then the resolved resource should have execute function
    And executing should return "Hello World"

  @resolve
  Scenario: Resolve json resource with bundled type
    Given a registry with builtin types
    And a json resource "config.json@1.0.0" with content '{"key": "value"}'
    When I resolve "config.json@1.0.0"
    Then the resolved resource should have execute function
    And executing should return object with key "key" and value "value"

  @resolve
  Scenario: Resolve with custom bundled type
    Given a bundled type "upper" that transforms content to uppercase
    And a registry with the "upper" type
    And a resource "test.upper@1.0.0" with content "hello"
    When I resolve "test.upper@1.0.0"
    Then executing should return "HELLO"

  @resolve
  Scenario: Resolve unsupported type throws error
    Given a registry with builtin types
    And a resource "test.unknown@1.0.0" with content "test"
    When I try to resolve "test.unknown@1.0.0"
    Then it should throw an error containing "Unsupported type"

  # ============================================
  # type aliases
  # ============================================

  @aliases
  Scenario: Resolve with type alias
    Given a registry with builtin types
    And a text resource "readme.txt@1.0.0" with content "README content"
    When I resolve "readme.txt@1.0.0"
    Then executing should return "README content"

  @aliases
  Scenario: Custom type with aliases
    Given a bundled type "prompt" with aliases "dp-prompt, deepractice-prompt"
    And a registry with the "prompt" type
    And a resource "greeting.dp-prompt@1.0.0" with content "Hello"
    When I resolve "greeting.dp-prompt@1.0.0"
    Then the resolved resource should have execute function

  # ============================================
  # schema support
  # ============================================

  @schema
  Scenario: Resolved resource includes schema
    Given a bundled type "tool" with schema:
      """
      {
        "type": "object",
        "properties": {
          "input": { "type": "string" }
        }
      }
      """
    And a registry with the "tool" type
    And a resource "echo.tool@1.0.0" with content "echo"
    When I resolve "echo.tool@1.0.0"
    Then the resolved resource should have schema
    And the schema should have property "input"

  @schema
  Scenario: Execute with arguments
    Given a bundled type "tool" that echoes input argument
    And a registry with the "tool" type
    And a resource "echo.tool@1.0.0" with content "echo"
    When I resolve "echo.tool@1.0.0"
    And I execute with argument '{"input": "test"}'
    Then the result should be "test"

  # ============================================
  # sandbox levels
  # ============================================

  @sandbox
  Scenario: Builtin types run with sandbox "none"
    Given a registry with builtin types
    And a text resource "test.text@1.0.0" with content "test"
    When I resolve "test.text@1.0.0"
    Then the type should have sandbox level "none"

  @sandbox
  Scenario: Custom type with isolated sandbox
    Given a bundled type "isolated-type" with sandbox "isolated"
    And a registry with the "isolated-type" type
    And a resource "test.isolated-type@1.0.0" with content "test"
    When I resolve "test.isolated-type@1.0.0"
    Then the type should have sandbox level "isolated"
