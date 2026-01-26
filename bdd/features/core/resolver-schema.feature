@resourcex @resolver @schema
Feature: Resolver Schema Support
  Resolver returns a structured object with execute function and optional schema.
  Schema uses JSON Schema format for UI form rendering.

  Background:
    Given I have access to resourcexjs type system

  # ============================================
  # Structured Result Object
  # ============================================

  @text
  Scenario: Text resolver returns structured object
    Given a text resource with content "Hello World"
    When I resolve the resource to structured result
    Then the result should have an execute function
    And the result schema should be undefined
    And calling execute should return "Hello World"

  @json
  Scenario: JSON resolver returns structured object
    Given a json resource with content '{"key": "value"}'
    When I resolve the resource to structured result
    Then the result should have an execute function
    And the result schema should be undefined
    And calling execute should return object with key "key" and value "value"

  @binary
  Scenario: Binary resolver returns structured object
    Given a binary resource with bytes "1,2,3,4"
    When I resolve the resource to structured result
    Then the result should have an execute function
    And the result schema should be undefined
    And calling execute should return a Buffer

  # ============================================
  # Custom Type with Schema
  # ============================================

  @custom @with-schema
  Scenario: Custom type with JSON Schema
    Given a custom "search-tool" type with schema:
      | field | type   | required | description    |
      | query | string | true     | Search keyword |
      | limit | number | false    | Max results    |
    And a search-tool resource
    When I resolve the resource to structured result
    Then the result should have an execute function
    And the result schema should be a valid JSON Schema
    And the schema should have property "query" of type "string"
    And the schema should have property "limit" of type "number"
    And the schema property "query" should be required
    And the schema property "limit" should not be required

  @custom @with-schema
  Scenario: Execute custom type with schema validation
    Given a custom "calculator" type with schema:
      | field | type   | required |
      | a     | number | true     |
      | b     | number | true     |
    And a calculator resource that adds two numbers
    When I resolve the resource to structured result
    And I call execute with args a=5 and b=3
    Then the result should be 8

  # ============================================
  # Custom Type without Schema (void args)
  # ============================================

  @custom @no-schema
  Scenario: Custom type without schema
    Given a custom "greeting" type without schema
    And a greeting resource with message "Hello!"
    When I resolve the resource to structured result
    Then the result should have an execute function
    And the result schema should be undefined
    And calling execute should return "Hello!"

  # ============================================
  # Schema Type Constraint
  # ============================================

  @type-constraint
  Scenario: Resolver with args must have schema defined
    Given a custom "typed-tool" type with args but no schema
    Then registering this type should fail with type error

  # ============================================
  # TypeHandlerChain Integration
  # ============================================

  @chain
  Scenario: TypeHandlerChain returns structured result
    Given a text resource "localhost/test.text@1.0.0" with content "Chain Test"
    When I resolve through TypeHandlerChain to structured result
    Then the result should have an execute function
    And calling execute should return "Chain Test"

  # ============================================
  # Schema Description Support
  # ============================================

  @schema-description
  Scenario: Schema with field descriptions
    Given a custom "api-tool" type with detailed schema:
      | field  | type   | required | description          | default |
      | url    | string | true     | API endpoint URL     |         |
      | method | string | false    | HTTP method          | GET     |
      | body   | object | false    | Request body         |         |
    And an api-tool resource
    When I resolve the resource to structured result
    Then the schema property "url" should have description "API endpoint URL"
    And the schema property "method" should have default "GET"
