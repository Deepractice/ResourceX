@journey @author
Feature: Manage multiple resources
  As a Resource Author
  I want to organize and manage multiple resources
  So that I can maintain a collection of related resources

  Background:
    Given a clean local environment
    And a registry server for publishing

  Scenario: Create a suite of related resources
    # Create multiple related resources
    Given I create a resource directory "prompts/greeting" with:
      | file          | content                                              |
      | resource.json | {"name":"greeting","type":"text","version":"1.0.0"}  |
      | content       | Hello, how can I help you today?                     |

    Given I create a resource directory "prompts/farewell" with:
      | file          | content                                              |
      | resource.json | {"name":"farewell","type":"text","version":"1.0.0"}  |
      | content       | Goodbye, have a great day!                           |

    Given I create a resource directory "prompts/error" with:
      | file          | content                                              |
      | resource.json | {"name":"error","type":"text","version":"1.0.0"}     |
      | content       | I'm sorry, something went wrong.                     |

    # Add all to local
    When I run "rx add ./prompts/greeting"
    And I run "rx add ./prompts/farewell"
    And I run "rx add ./prompts/error"
    Then the command should succeed

    # List shows all
    When I run "rx list"
    Then the output should contain "greeting:1.0.0"
    And the output should contain "farewell:1.0.0"
    And the output should contain "error:1.0.0"

  Scenario: Organize resources with paths
    # Create resources with path organization
    Given I create a resource directory "utils/string-helper" with:
      | file          | content                                                           |
      | resource.json | {"name":"string-helper","type":"text","version":"1.0.0","path":"utils"} |
      | content       | String utility functions                                          |

    Given I create a resource directory "utils/date-helper" with:
      | file          | content                                                           |
      | resource.json | {"name":"date-helper","type":"text","version":"1.0.0","path":"utils"}   |
      | content       | Date utility functions                                            |

    When I run "rx add ./utils/string-helper"
    And I run "rx add ./utils/date-helper"

    # List shows resources with path
    When I run "rx list"
    Then the output should contain "string-helper"
    And the output should contain "date-helper"

  Scenario: Publish entire collection to registry
    # Create and add resources
    Given I create a resource directory "toolkit/analyzer" with:
      | file          | content                                               |
      | resource.json | {"name":"analyzer","type":"text","version":"1.0.0"}   |
      | content       | Analysis tool                                         |

    Given I create a resource directory "toolkit/reporter" with:
      | file          | content                                               |
      | resource.json | {"name":"reporter","type":"text","version":"1.0.0"}   |
      | content       | Report generator                                      |

    When I run "rx add ./toolkit/analyzer"
    And I run "rx add ./toolkit/reporter"

    # Push all to registry
    When I run "rx push analyzer:1.0.0"
    And I run "rx push reporter:1.0.0"
    Then the command should succeed

    # Verify on registry
    When I run "rx search analyzer"
    Then the output should contain "analyzer:1.0.0"
    When I run "rx search reporter"
    Then the output should contain "reporter:1.0.0"

  Scenario: Remove subset of resources
    # Add multiple resources
    Given an author local resource "keep-me:1.0.0" with content "Keep this"
    And an author local resource "delete-me:1.0.0" with content "Delete this"
    And an author local resource "also-keep:1.0.0" with content "Also keep"

    # Remove one
    When I run "rx remove delete-me:1.0.0"
    Then the command should succeed

    # Verify state
    When I run "rx list"
    Then the output should contain "keep-me:1.0.0"
    And the output should contain "also-keep:1.0.0"
    And the output should not contain "delete-me:1.0.0"

  Scenario: Update one resource without affecting others
    # Add multiple resources
    Given I create a resource directory "stable" with:
      | file          | content                                             |
      | resource.json | {"name":"stable","type":"text","version":"1.0.0"}   |
      | content       | Stable content                                      |

    Given I create a resource directory "changing" with:
      | file          | content                                              |
      | resource.json | {"name":"changing","type":"text","version":"1.0.0"}  |
      | content       | Original content                                     |

    When I run "rx add ./stable"
    And I run "rx add ./changing"

    # Update only changing
    Given I update the resource directory "changing" with:
      | file          | content                                              |
      | resource.json | {"name":"changing","type":"text","version":"1.1.0"}  |
      | content       | Updated content                                      |
    When I run "rx add ./changing"

    # Verify stable unchanged
    When I run "rx resolve stable:1.0.0"
    Then the output should contain "Stable content"

    # Verify changing updated
    When I run "rx resolve changing:1.1.0"
    Then the output should contain "Updated content"
