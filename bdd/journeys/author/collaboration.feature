@journey @author
Feature: Collaboration between authors
  As a Resource Author
  I want to share and build upon others' resources
  So that we can collaborate and improve together

  Background:
    Given a clean local environment
    And a registry server for publishing

  Scenario: Share resource with colleague via registry
    # Author A creates and publishes
    Given I create a resource directory "shared-prompt" with:
      | file          | content                                                 |
      | resource.json | {"name":"shared-prompt","type":"text","version":"1.0.0"} |
      | content       | A useful prompt to share                                |
    When I run "rx add ./shared-prompt"
    And I run "rx push shared-prompt:1.0.0"
    Then the command should succeed
    And the output should contain "Pushed"

    # Author B (simulated by clearing local) pulls and uses
    Given a fresh local environment
    When I run "rx pull shared-prompt:1.0.0"
    Then the command should succeed
    When I run "rx ingest shared-prompt:1.0.0"
    Then the output should contain "A useful prompt to share"

  Scenario: Fork and modify someone's resource
    # Original author publishes
    Given I create a resource directory "original" with:
      | file          | content                                              |
      | resource.json | {"name":"original","type":"text","version":"1.0.0"}  |
      | content       | Original implementation                              |
    When I run "rx add ./original"
    And I run "rx push original:1.0.0"

    # Another author pulls and creates derivative
    Given a fresh local environment
    When I run "rx pull original:1.0.0"

    # Create modified version with new name
    Given I create a resource directory "improved" with:
      | file          | content                                               |
      | resource.json | {"name":"improved","type":"text","version":"1.0.0"}   |
      | content       | Improved implementation based on original             |
    When I run "rx add ./improved"
    And I run "rx push improved:1.0.0"
    Then the command should succeed

    # Both exist on registry
    When I run "rx search original"
    Then the output should contain "original:1.0.0"
    When I run "rx search improved"
    Then the output should contain "improved:1.0.0"

  Scenario: Team maintains shared resource with versions
    # Team member 1 creates initial version
    Given I create a resource directory "team-tool" with:
      | file          | content                                               |
      | resource.json | {"name":"team-tool","type":"text","version":"1.0.0"}  |
      | content       | Initial team tool by Member 1                         |
    When I run "rx add ./team-tool"
    And I run "rx push team-tool:1.0.0"

    # Team member 2 adds improvement
    Given a fresh local environment
    When I run "rx pull team-tool:1.0.0"

    Given I create a resource directory "team-tool-v2" with:
      | file          | content                                               |
      | resource.json | {"name":"team-tool","type":"text","version":"1.1.0"}  |
      | content       | Improved by Member 2                                  |
    When I run "rx add ./team-tool-v2"
    And I run "rx push team-tool:1.1.0"

    # Team member 3 can see all versions
    Given a fresh local environment
    When I run "rx search team-tool"
    Then the output should contain "team-tool:1.0.0"
    And the output should contain "team-tool:1.1.0"

  Scenario: Use resource directly from registry URL
    # Publisher pushes resource
    Given I create a resource directory "direct-access" with:
      | file          | content                                                  |
      | resource.json | {"name":"direct-access","type":"text","version":"1.0.0"} |
      | content       | Directly accessible content                              |
    When I run "rx add ./direct-access"
    And I run "rx push direct-access:1.0.0"

    # Fresh user can use without explicit pull
    Given a fresh local environment
    When I run "rx ingest direct-access:1.0.0"
    Then the command should succeed
    And the output should contain "Directly accessible content"

  # ============================================
  # DESIGN ISSUE DISCOVERED:
  # When push to registry, resource should get registry prefix
  # e.g., push to localhost:3000 -> locator becomes localhost:3000/resource:1.0.0
  # This enables:
  # - rx pull localhost:3000/resource:1.0.0 (no --registry needed)
  # - rx ingest localhost:3000/resource:1.0.0 (auto-fetches from registry)
  # ============================================

  @pending @design-issue
  Scenario: Push adds registry prefix to locator
    Given I create a resource directory "prefixed" with:
      | file          | content                                              |
      | resource.json | {"name":"prefixed","type":"text","version":"1.0.0"}  |
      | content       | This should get a registry prefix                    |
    When I run "rx add ./prefixed"
    And I run "rx push prefixed:1.0.0"
    Then the command should succeed
    # The output should show the full registry-prefixed locator
    And the output should contain "localhost:3099/prefixed:1.0.0"

  @pending @design-issue
  Scenario: Pull by registry-prefixed locator without --registry flag
    Given a remote resource "localhost:3099/autoprefixed:1.0.0" on the registry with content "Auto content"
    And a fresh local environment
    # Should auto-detect registry from locator
    When I run "rx pull localhost:3099/autoprefixed:1.0.0"
    Then the command should succeed
    And the output should contain "Pulled"

  Scenario: Use auto-fetches from registry based on locator prefix
    Given a remote resource "autofetch:1.0.0" on the registry with content "Fetched content"
    And a fresh local environment
    # Should auto-fetch from registry based on locator prefix
    When I run "rx ingest localhost:3099/autofetch:1.0.0"
    Then the command should succeed
    And the output should contain "Fetched content"
