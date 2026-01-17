@resourcex @manifest
Feature: ResourceX Manifest (RXM)
  Parse resource manifest data into structured objects.

  Background:
    Given I have access to resourcexjs manifest

  @valid
  Scenario: Parse minimal manifest
    When I parse manifest with domain "deepractice.ai", name "assistant", type "prompt", version "1.0.0"
    Then rxm domain should be "deepractice.ai"
    And rxm name should be "assistant"
    And rxm type should be "prompt"
    And rxm version should be "1.0.0"
    And rxm path should be undefined

  @path
  Scenario: Parse manifest with path
    When I parse manifest with domain "deepractice.ai", path "sean", name "assistant", type "prompt", version "1.0.0"
    Then rxm domain should be "deepractice.ai"
    And rxm path should be "sean"
    And rxm name should be "assistant"

  @full
  Scenario: Parse full manifest
    When I parse manifest with domain "deepractice.ai", path "sean", name "assistant", type "prompt", version "1.0.0"
    Then rxm domain should be "deepractice.ai"
    And rxm path should be "sean"
    And rxm name should be "assistant"
    And rxm type should be "prompt"
    And rxm version should be "1.0.0"

  @toLocator
  Scenario: Convert manifest to locator string
    When I parse manifest with domain "deepractice.ai", path "sean", name "assistant", type "prompt", version "1.0.0"
    Then rxm toLocator should return "deepractice.ai/sean/assistant.prompt@1.0.0"

  @error
  Scenario: Throw error for missing domain
    When I parse manifest without domain
    Then should throw ManifestError with message "domain is required"

  @error
  Scenario: Throw error for missing name
    When I parse manifest without name
    Then should throw ManifestError with message "name is required"

  @error
  Scenario: Throw error for missing type
    When I parse manifest without type
    Then should throw ManifestError with message "type is required"

  @error
  Scenario: Throw error for missing version
    When I parse manifest without version
    Then should throw ManifestError with message "version is required"
