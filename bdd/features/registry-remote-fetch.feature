@registry @remote-fetch
Feature: Registry Remote Fetch
  Registry fetches resources from remote when not in local cache.

  - localhost: Only queries local, never goes remote
  - Other domains: Local cache -> [Mirror] -> Source (well-known)
  - Mirror: Optional, configured via createRegistry({ mirror: "..." })

  Background:
    Given a registry with default configuration

  # ============================================
  # localhost - Only local, no remote
  # ============================================

  @localhost
  Scenario: localhost resource found in storage
    Given a linked resource "localhost/my-tool.text@1.0.0" with content "local content"
    When I get "localhost/my-tool.text@1.0.0"
    Then I should receive a raw RXR
    And rxr.manifest should have type "text"

  @localhost
  Scenario: localhost resource not found throws error
    When I get "localhost/not-exist.text@1.0.0"
    Then it should throw a RegistryError
    And error message should contain "not found"

  @localhost
  Scenario: Resolve localhost resource
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello"
    When I resolve "localhost/hello.text@1.0.0"
    Then the content should be "Hello"

  # ============================================
  # Remote domain - Cache behavior
  # ============================================

  @remote @cache-hit
  Scenario: Remote domain found in cache returns immediately
    Given a linked resource "deepractice.ai/tool.text@1.0.0" with content "cached"
    When I get "deepractice.ai/tool.text@1.0.0"
    Then I should receive a raw RXR
    And rxr.manifest should have domain "deepractice.ai"

  @remote @cache-hit @pending
  Scenario: Remote domain with path found in cache
    Given a resource with:
      | domain         | path    | name      | type | version |
      | deepractice.ai | prompts | assistant | text | 1.0.0   |
    And resource content "assistant prompt"
    When I link the resource
    And I get "deepractice.ai/prompts/assistant.text@1.0.0"
    Then I should receive a raw RXR

  # ============================================
  # createRegistry API
  # ============================================

  @api
  Scenario: createRegistry with default path
    When I create a registry with default configuration
    Then the registry should be created successfully

  @api
  Scenario: createRegistry with custom path
    Given a registry with path "./custom-registry"
    When I link a resource "localhost/test.text@1.0.0"
    Then the resource should exist in registry

  # ============================================
  # Remote fetch flow (requires mock server)
  # ============================================

  @remote @fetch @pending
  Scenario: Remote domain not in cache triggers well-known discovery
    # This scenario requires a mock HTTP server
    # Flow: local miss -> well-known discovery -> fetch from source -> cache
    Given "deepractice.ai/tool.text@1.0.0" does NOT exist locally
    And a mock well-known server for "deepractice.ai" returning:
      | registries                          |
      | https://registry.deepractice.ai/v1  |
    And a mock registry server at "https://registry.deepractice.ai/v1" with:
      | locator                        | content     |
      | deepractice.ai/tool.text@1.0.0 | from source |
    When I get "deepractice.ai/tool.text@1.0.0"
    Then the resource should be cached locally

  @remote @mirror @pending
  Scenario: Mirror configured - tries mirror before source
    # Flow: local miss -> mirror -> (miss) -> source -> cache
    Given a registry with mirror "https://mirror.company.com"
    And "deepractice.ai/tool.text@1.0.0" does NOT exist locally
    And a mock mirror server at "https://mirror.company.com" with:
      | locator                        | content     |
      | deepractice.ai/tool.text@1.0.0 | from mirror |
    When I get "deepractice.ai/tool.text@1.0.0"
    Then the resource should be cached locally
