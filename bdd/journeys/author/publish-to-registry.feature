@journey @author
Feature: Publish resource to registry
  As a Resource Author
  I want to publish my resource to a registry
  So that other developers can use it

  Background:
    Given a clean local environment
    And a registry server for publishing

  Scenario: Push local resource to remote registry
    # Step 1: Create and add resource locally
    Given I create a resource directory "my-tool" with:
      | file          | content                                          |
      | resource.json | {"name":"my-tool","type":"text","version":"1.0.0"} |
      | content       | This is my awesome tool!                         |
    When I run "rx add ./my-tool"
    Then the command should succeed

    # Step 2: Push to registry
    When I run "rx push my-tool:1.0.0"
    Then the command should succeed
    And the output should contain "Pushed"

    # Step 3: Verify on registry (search)
    When I run "rx search my-tool"
    Then the command should succeed
    And the output should contain "my-tool:1.0.0"

  Scenario: Pull resource from registry to fresh environment
    # Setup: Publish a resource first
    Given I create a resource directory "shared-prompt" with:
      | file          | content                                               |
      | resource.json | {"name":"shared-prompt","type":"text","version":"1.0.0"} |
      | content       | A prompt to share with others                         |
    When I run "rx add ./shared-prompt"
    And I run "rx push shared-prompt:1.0.0"
    Then the command should succeed

    # Clear local cache to simulate fresh environment
    Given a fresh local cache

    # Pull from registry
    When I run "rx pull shared-prompt:1.0.0"
    Then the command should succeed
    And the output should contain "Pulled"

    # Verify can use
    When I run "rx use shared-prompt:1.0.0"
    Then the command should succeed
    And the output should contain "A prompt to share with others"
