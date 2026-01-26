@resourcex @locator
Feature: ResourceX Locator (RXL)
  Parse resource locator strings into structured objects.
  Format: [domain/path/]name[.type][@version]

  Background:
    Given I have access to resourcexjs

  @simple
  Scenario: Parse simple name
    When I parse locator "assistant"
    Then rxl name should be "assistant"
    And rxl domain should be undefined
    And rxl path should be undefined
    And rxl type should be undefined
    And rxl version should be undefined

  @type
  Scenario: Parse name with type
    When I parse locator "assistant.prompt"
    Then rxl name should be "assistant"
    And rxl type should be "prompt"

  @version
  Scenario: Parse name with version
    When I parse locator "assistant@1.0.0"
    Then rxl name should be "assistant"
    And rxl version should be "1.0.0"

  @full
  Scenario: Parse name with type and version
    When I parse locator "assistant.prompt@1.0.0"
    Then rxl name should be "assistant"
    And rxl type should be "prompt"
    And rxl version should be "1.0.0"

  @domain
  Scenario: Parse with domain
    When I parse locator "deepractice.ai/assistant"
    Then rxl domain should be "deepractice.ai"
    And rxl name should be "assistant"

  @path
  Scenario: Parse with domain and path
    When I parse locator "deepractice.ai/sean/assistant"
    Then rxl domain should be "deepractice.ai"
    And rxl path should be "sean"
    And rxl name should be "assistant"

  @full
  Scenario: Parse full locator
    When I parse locator "deepractice.ai/sean/assistant.prompt@1.0.0"
    Then rxl domain should be "deepractice.ai"
    And rxl path should be "sean"
    And rxl name should be "assistant"
    And rxl type should be "prompt"
    And rxl version should be "1.0.0"

  @localhost
  Scenario: Parse localhost locator
    When I parse locator "localhost/my-project/tool.tool"
    Then rxl domain should be "localhost"
    And rxl path should be "my-project"
    And rxl name should be "tool"
    And rxl type should be "tool"

  @github
  Scenario: Parse GitHub locator
    When I parse locator "github.com/org/repo/assistant.agent@2.0.0"
    Then rxl domain should be "github.com"
    And rxl path should be "org/repo"
    And rxl name should be "assistant"
    And rxl type should be "agent"
    And rxl version should be "2.0.0"

  @toString
  Scenario: Reconstruct locator to string
    When I parse locator "deepractice.ai/sean/assistant.prompt@1.0.0"
    Then rxl toString should return "deepractice.ai/sean/assistant.prompt@1.0.0"
