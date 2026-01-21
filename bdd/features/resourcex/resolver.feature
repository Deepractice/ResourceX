@resourcex @resolver
Feature: ResourceX Resolver
  Resolver returns a callable function instead of a value.
  This enables lazy loading and parameterized execution.

  Background:
    Given I have access to resourcexjs type system

  # ============================================
  # Text type - returns callable
  # ============================================

  @text
  Scenario: Text resolver returns callable function
    Given a text resource with content "Hello World"
    When I resolve the resource
    Then I should get a callable function
    And calling the function should return "Hello World"

  @text @lazy
  Scenario: Text resolver is lazy loaded
    Given a text resource with content "Lazy Content"
    When I resolve the resource
    Then the content should not be loaded yet
    When I call the resolved function
    Then the content should be loaded

  # ============================================
  # JSON type - returns callable
  # ============================================

  @json
  Scenario: JSON resolver returns callable function
    Given a json resource with content '{"key": "value"}'
    When I resolve the resource
    Then I should get a callable function
    And calling the function should return object with key "key" and value "value"

  # ============================================
  # Binary type - returns callable
  # ============================================

  @binary
  Scenario: Binary resolver returns callable function
    Given a binary resource with bytes "1,2,3,4"
    When I resolve the resource
    Then I should get a callable function
    And calling the function should return a Buffer with bytes "1,2,3,4"

  # ============================================
  # Custom type with arguments
  # ============================================

  @custom @args
  Scenario: Custom resolver with arguments
    Given a custom "tool" type that accepts arguments
    And a tool resource with code "return args.a + args.b"
    When I resolve the resource
    Then I should get a callable function
    And calling the function with args "a=1,b=2" should return 3

  @custom @args
  Scenario: Custom resolver with no arguments
    Given a custom "prompt" type that accepts no arguments
    And a prompt resource with template "Hello, {{name}}!"
    When I resolve the resource
    Then I should get a callable function
    And calling the function without arguments should return "Hello, {{name}}!"

  # ============================================
  # TypeHandlerChain integration
  # ============================================

  @chain
  Scenario: TypeHandlerChain resolve returns callable
    Given a text resource "localhost/test.text@1.0.0" with content "Chain Test"
    When I resolve through TypeHandlerChain
    Then I should get a callable function
    And calling the function should return "Chain Test"

  # ============================================
  # Async support
  # ============================================

  @async
  Scenario: Resolver function can return Promise
    Given a custom "async-text" type with async resolver
    And an async-text resource with content "Async Content"
    When I resolve the resource
    Then I should get a callable function
    And calling the function should return a Promise
    And awaiting the Promise should return "Async Content"

  @sync
  Scenario: Resolver function can return sync value
    Given a custom "sync-text" type with sync resolver
    And a sync-text resource with content "Sync Content"
    When I resolve the resource
    Then I should get a callable function
    And calling the function should return "Sync Content" directly
