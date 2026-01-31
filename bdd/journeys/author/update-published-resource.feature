@journey @author
Feature: Update published resource
  As a Resource Author
  I want to update my published resource with new versions
  So that users can get the latest improvements

  Background:
    Given a clean local environment
    And a registry server for publishing

  Scenario: Publish new version of existing resource
    # Step 1: Create and publish v1.0.0
    Given I create a resource directory "my-tool" with:
      | file          | content                                           |
      | resource.json | {"name":"my-tool","type":"text","version":"1.0.0"} |
      | content       | Version 1.0.0 content                             |
    When I run "rx add ./my-tool"
    And I run "rx push my-tool.text@1.0.0"
    Then the command should succeed

    # Step 2: Update to v1.1.0
    Given I update the resource directory "my-tool" with:
      | file          | content                                           |
      | resource.json | {"name":"my-tool","type":"text","version":"1.1.0"} |
      | content       | Version 1.1.0 with improvements                   |
    When I run "rx add ./my-tool"
    And I run "rx push my-tool.text@1.1.0"
    Then the command should succeed

    # Step 3: Verify both versions exist
    When I run "rx search my-tool"
    Then the output should contain "my-tool.text@1.0.0"
    And the output should contain "my-tool.text@1.1.0"

  Scenario: Users can resolve specific version
    # Setup: Publish two versions
    Given I create a resource directory "versioned" with:
      | file          | content                                            |
      | resource.json | {"name":"versioned","type":"text","version":"1.0.0"} |
      | content       | Old version                                        |
    When I run "rx add ./versioned"
    And I run "rx push versioned.text@1.0.0"

    Given I update the resource directory "versioned" with:
      | file          | content                                            |
      | resource.json | {"name":"versioned","type":"text","version":"2.0.0"} |
      | content       | New version                                        |
    When I run "rx add ./versioned"
    And I run "rx push versioned.text@2.0.0"

    # Clear local and pull specific version
    Given a fresh local cache
    When I run "rx resolve versioned.text@1.0.0"
    Then the output should contain "Old version"

    When I run "rx resolve versioned.text@2.0.0"
    Then the output should contain "New version"

  Scenario: Patch version for bug fix
    # Create v1.0.0 with a bug
    Given I create a resource directory "buggy" with:
      | file          | content                                          |
      | resource.json | {"name":"buggy","type":"text","version":"1.0.0"} |
      | content       | This has a bug                                   |
    When I run "rx add ./buggy"
    And I run "rx push buggy.text@1.0.0"

    # Fix the bug in v1.0.1
    Given I update the resource directory "buggy" with:
      | file          | content                                          |
      | resource.json | {"name":"buggy","type":"text","version":"1.0.1"} |
      | content       | Bug fixed!                                       |
    When I run "rx add ./buggy"
    And I run "rx push buggy.text@1.0.1"
    Then the command should succeed

    # User should be able to get the fix
    Given a fresh local cache
    When I run "rx resolve buggy.text@1.0.1"
    Then the output should contain "Bug fixed!"
