@journey @author
Feature: Create and test resource locally
  As a Resource Author
  I want to create a resource and test it locally
  So that I can verify it works before publishing

  Background:
    Given a clean local environment

  Scenario: First resource - complete local lifecycle
    # Step 1: Create resource directory
    Given I create a resource directory "my-prompt" with:
      | file          | content                                            |
      | resource.json | {"name":"my-prompt","type":"text","tag":"1.0.0"} |
      | content       | Hello, this is my first resource!                  |

    # Step 2: Add to local storage
    When I run "rx add ./my-prompt"
    Then the command should succeed
    And the output should contain "Added"

    # Step 3: Verify it's listed
    When I run "rx list"
    Then the command should succeed
    And the output should contain "my-prompt:1.0.0"

    # Step 4: Use and verify output
    When I run "rx ingest my-prompt:1.0.0"
    Then the command should succeed
    And the output should contain "Hello, this is my first resource!"

    # Step 5: Clean up
    When I run "rx remove my-prompt:1.0.0"
    Then the command should succeed
    And the output should contain "Removed"

    # Step 6: Verify removal
    When I run "rx list"
    Then the output should not contain "my-prompt:1.0.0"
