@resource-type
Feature: Resource Type Definition
  Define resource types with serializer and resolver

  @define-type
  Scenario: Define a simple resource type
    Given a resource type definition:
      | name        | description           |
      | text-prompt | Simple text prompt    |
    When I define the resource type
    Then the resource type should be registered
    And I can retrieve the type by name "text-prompt"

  @define-type
  Scenario: Define resource type with custom serializer
    Given a resource type "json-config" with custom serializer
    When I define the resource type
    Then the serializer should be used for serialization
    And the serializer should be used for deserialization

  @define-type
  Scenario: Define resource type with custom resolver
    Given a resource type "executable-tool" with custom resolver
    When I define the resource type
    And I resolve a resource of type "executable-tool"
    Then the resolver should transform RXR to usable object

  @define-type
  Scenario: Prevent duplicate type registration
    Given a resource type "prompt" is already registered
    When I try to define another type with name "prompt"
    Then it should throw a ResourceTypeError
    And error message should contain "already registered"

  @get-type
  Scenario: Get registered resource type
    Given resource types are registered:
      | name   | description      |
      | prompt | Prompt template  |
      | tool   | Executable tool  |
    When I get resource type "prompt"
    Then I should receive the type definition
    And the description should be "Prompt template"

  @get-type
  Scenario: Get unregistered resource type
    When I get resource type "unknown-type"
    Then it should return undefined
