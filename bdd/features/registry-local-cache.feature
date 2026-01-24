@registry @local-cache
Feature: Registry Local/Cache Separation
  Separate local development resources from remote cached resources

  - local/ directory: For development resources (organized by name.type/version)
  - cache/ directory: For remote cached resources (organized by domain/path/name.type/version)

  Background:
    Given a registry with default configuration

  # ============================================
  # Link - Writes to local/
  # ============================================

  @link @local
  Scenario: Link resource stores in local directory
    Given a resource with:
      | domain    | name      | type | version |
      | localhost | my-prompt | text | 1.0.0   |
    And resource content "Hello World"
    When I link the resource
    Then the resource should exist at "local/my-prompt.text/1.0.0"
    And the resource should NOT exist at "cache/localhost/my-prompt.text/1.0.0"

  @link @local
  Scenario: Link resource with real domain also stores in local
    Given a resource with:
      | domain         | name      | type | version |
      | deepractice.ai | assistant | text | 1.0.0   |
    And resource content "You are an assistant"
    When I link the resource
    Then the resource should exist at "local/assistant.text/1.0.0"
    And the manifest domain should be "deepractice.ai"

  @link @local
  Scenario: Link json resource
    Given a resource with:
      | domain    | name   | type | version |
      | localhost | config | json | 1.0.0   |
    And resource content "{}"
    When I link the resource
    Then the resource should exist at "local/config.json/1.0.0"

  # ============================================
  # Resolve - Priority: local/ first, then cache/
  # ============================================

  @resolve @priority
  Scenario: Resolve prioritizes local over cache
    Given a resource "test.text@1.0.0" exists in local with content "local version"
    And a resource "deepractice.ai/test.text@1.0.0" exists in cache with content "cache version"
    When I resolve "test.text@1.0.0"
    Then the content should be "local version"

  @resolve @local
  Scenario: Resolve finds resource in local by name only
    Given a linked resource with:
      | domain         | name    | type | version |
      | deepractice.ai | my-tool | text | 2.0.0   |
    When I resolve "my-tool.text@2.0.0"
    Then I should receive an RXR object
    And the manifest domain should be "deepractice.ai"

  @resolve @cache
  Scenario: Resolve falls back to cache when not in local
    Given a resource "deepractice.ai/cached.text@1.0.0" exists in cache with content "from cache"
    When I resolve "deepractice.ai/cached.text@1.0.0"
    Then the content should be "from cache"

  @resolve @not-found
  Scenario: Resolve throws when not in local or cache
    When I resolve "not-exist.text@1.0.0"
    Then it should throw a RegistryError
    And error message should contain "not found"

  # ============================================
  # Get - Same priority as resolve
  # ============================================

  @get @priority
  Scenario: Get prioritizes local over cache
    Given a resource "hello.text@1.0.0" exists in local with content "local"
    And a resource "deepractice.ai/hello.text@1.0.0" exists in cache with content "cache"
    When I get "hello.text@1.0.0"
    Then the raw content should be "local"

  @get @cache
  Scenario: Get falls back to cache
    Given a resource "deepractice.ai/remote.text@1.0.0" exists in cache with content "remote content"
    When I get "deepractice.ai/remote.text@1.0.0"
    Then the raw content should be "remote content"

  # ============================================
  # Exists - Checks both local and cache
  # ============================================

  @exists @local
  Scenario: Exists finds resource in local
    Given a resource "my-resource.text@1.0.0" exists in local
    When I check if "my-resource.text@1.0.0" exists
    Then it should return true

  @exists @cache
  Scenario: Exists finds resource in cache
    Given a resource "deepractice.ai/remote.text@1.0.0" exists in cache
    When I check if "deepractice.ai/remote.text@1.0.0" exists
    Then it should return true

  @exists @not-found
  Scenario: Exists returns false when not in local or cache
    When I check if "nowhere.text@1.0.0" exists
    Then it should return false

  # ============================================
  # Delete - Deletes from correct directory
  # ============================================

  @delete @local
  Scenario: Delete removes from local by name
    Given a resource "to-delete.text@1.0.0" exists in local
    When I delete "to-delete.text@1.0.0"
    Then the resource should NOT exist at "local/to-delete.text/1.0.0"

  @delete @cache
  Scenario: Delete removes from cache by full locator
    Given a resource "deepractice.ai/cached-delete.text@1.0.0" exists in cache
    When I delete "deepractice.ai/cached-delete.text@1.0.0"
    Then the resource should NOT exist at "cache/deepractice.ai/cached-delete.text/1.0.0"

  @delete @both
  Scenario: Delete local does not affect cache with same name
    Given a resource "shared.text@1.0.0" exists in local with content "local"
    And a resource "deepractice.ai/shared.text@1.0.0" exists in cache with content "cache"
    When I delete "shared.text@1.0.0"
    Then the resource should NOT exist at "local/shared.text/1.0.0"
    And the resource should still exist at "cache/deepractice.ai/shared.text/1.0.0"

  # ============================================
  # Search - Searches both local and cache
  # ============================================

  @search @both
  Scenario: Search finds resources in both local and cache
    Given a resource "local-item.text@1.0.0" exists in local
    And a resource "deepractice.ai/cache-item.text@1.0.0" exists in cache
    When I search without options
    Then I should find 2 resources
    And results should contain "local-item"
    And results should contain "cache-item"

  @search @query
  Scenario: Search with query filters both directories
    Given a resource "foo-local.text@1.0.0" exists in local
    And a resource "bar-local.text@1.0.0" exists in local
    And a resource "deepractice.ai/foo-cache.text@1.0.0" exists in cache
    When I search with options:
      | key   | value |
      | query | foo   |
    Then I should find 2 resources
    And results should contain "foo-local"
    And results should contain "foo-cache"

  # ============================================
  # Storage Structure Verification
  # ============================================

  @structure
  Scenario: Verify local storage structure
    Given a resource with:
      | domain         | path    | name      | type | version |
      | deepractice.ai | prompts | my-prompt | text | 1.0.0   |
    And resource content "prompt content"
    When I link the resource
    Then the filesystem should have:
      | path                                       | exists |
      | local/my-prompt.text/1.0.0/manifest.json   | true   |
      | local/my-prompt.text/1.0.0/archive.tar.gz  | true   |

  @structure
  Scenario: Verify cache storage structure
    Given I simulate a cached resource with:
      | domain         | path    | name | type | version |
      | deepractice.ai | prompts | nuwa | text | 1.0.0   |
    Then the filesystem should have:
      | path                                                        | exists |
      | cache/deepractice.ai/prompts/nuwa.text/1.0.0/manifest.json  | true   |
      | cache/deepractice.ai/prompts/nuwa.text/1.0.0/archive.tar.gz | true   |
