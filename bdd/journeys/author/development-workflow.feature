@journey @author
Feature: Development workflow with link
  As a Resource Author
  I want to use link for live development
  So that I can test changes instantly without re-adding

  Background:
    Given a clean local environment

  Scenario: Link for rapid iteration
    # Step 1: Create initial resource
    Given I create a resource directory "dev-prompt" with:
      | file          | content                                              |
      | resource.json | {"name":"dev-prompt","type":"text","version":"0.1.0"} |
      | content       | Initial draft                                        |

    # Step 2: Link for development
    When I run "rx link ./dev-prompt"
    Then the command should succeed
    And the output should contain "Linked"

    # Step 3: Resolve sees current content
    When I run "rx resolve dev-prompt:0.1.0"
    Then the output should contain "Initial draft"

    # Step 4: Modify content (simulate editing)
    Given I update file "dev-prompt/content" with "Improved draft"

    # Step 5: Resolve sees updated content immediately
    When I run "rx resolve dev-prompt:0.1.0"
    Then the output should contain "Improved draft"

  Scenario: Unlink after development complete
    # Setup: Link a resource
    Given I create a resource directory "temp-dev" with:
      | file          | content                                             |
      | resource.json | {"name":"temp-dev","type":"text","version":"1.0.0"} |
      | content       | Development content                                 |
    When I run "rx link ./temp-dev"
    Then the command should succeed

    # Verify linked
    When I run "rx list"
    Then the output should contain "temp-dev:1.0.0"

    # Unlink
    When I run "rx unlink temp-dev:1.0.0"
    Then the command should succeed
    And the output should contain "Unlinked"

    # Verify no longer available
    When I run "rx resolve temp-dev:1.0.0"
    Then the command should fail

  Scenario: Link takes priority over local storage
    # Add resource to local storage
    Given I create a resource directory "priority-test" with:
      | file          | content                                                |
      | resource.json | {"name":"priority","type":"text","version":"1.0.0"}    |
      | content       | Local storage version                                  |
    When I run "rx add ./priority-test"

    # Create a different dev version
    Given I create a resource directory "priority-dev" with:
      | file          | content                                                |
      | resource.json | {"name":"priority","type":"text","version":"1.0.0"}    |
      | content       | Linked development version                             |
    When I run "rx link ./priority-dev"

    # Link should take priority
    When I run "rx resolve priority:1.0.0"
    Then the output should contain "Linked development version"

    # After unlink, falls back to local
    When I run "rx unlink priority:1.0.0"
    When I run "rx resolve priority:1.0.0"
    Then the output should contain "Local storage version"

  Scenario: Finalize development and add to local
    # Start with linked development
    Given I create a resource directory "finalizing" with:
      | file          | content                                               |
      | resource.json | {"name":"final","type":"text","version":"1.0.0"}      |
      | content       | Work in progress                                      |
    When I run "rx link ./finalizing"

    # Iterate on content
    Given I update file "finalizing/content" with "Final polished version"

    # Satisfied with result, add to local storage
    When I run "rx add ./finalizing"
    Then the command should succeed

    # Unlink development version
    When I run "rx unlink final:1.0.0"

    # Local version persists
    When I run "rx resolve final:1.0.0"
    Then the output should contain "Final polished version"
