@registry @github
Feature: GitHub Registry via URL auto-detection
  Access resources from GitHub repositories using createRegistry with URL auto-detection.
  When a https://github.com/... URL is provided, it automatically uses tarball download.

  # ============================================
  # URL-based registry creation
  # ============================================

  @config
  Scenario: Create registry with GitHub URL
    When I create a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    Then it should not throw an error

  @config @security
  Scenario: Remote URL without domain throws error
    When I create a registry with URL "https://github.com/Deepractice/Registry" without domain
    Then it should throw a RegistryError
    And error message should contain "trusted domain"

  # ============================================
  # Get - Read resource from GitHub repo
  # ============================================

  @get
  Scenario: Get resource from GitHub URL registry
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I resolve "deepractice.dev/hello.text@1.0.0" using the URL registry
    Then the resolve should succeed

  @get
  Scenario: Get non-existent resource throws error
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I resolve "deepractice.dev/not-exist.text@1.0.0" using the URL registry
    Then the resolve should fail with "not found"

  # ============================================
  # Resolve - Resolve resource from GitHub repo
  # ============================================

  @resolve
  Scenario: Resolve text resource from GitHub URL registry
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I resolve "deepractice.dev/hello.text@1.0.0" using the URL registry
    Then the resolve should succeed

  # ============================================
  # Exists - Check resource existence
  # ============================================

  @exists
  Scenario: Exists returns true for existing resource
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I check if "deepractice.dev/hello.text@1.0.0" exists using the URL registry
    Then the exists check should return true

  @exists
  Scenario: Exists returns false for non-existing resource
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I check if "deepractice.dev/not-exist.text@1.0.0" exists using the URL registry
    Then the exists check should return false

  # ============================================
  # Search - Search resources in GitHub repo
  # ============================================

  @search
  Scenario: Search finds resources in GitHub URL registry
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I search in the URL registry without options
    Then the search should find at least 1 resource

  @search
  Scenario: Search with query filters results
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I search in the URL registry with query "hello"
    Then the search results should contain "hello"

  # ============================================
  # Read-only operations
  # ============================================

  @readonly
  Scenario: Link throws error for GitHub URL registry
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I try to link a resource using the URL registry
    Then the operation should fail with "read-only"

  @readonly
  Scenario: Add throws error for GitHub URL registry
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I try to add a resource using the URL registry
    Then the operation should fail with "read-only"

  @readonly
  Scenario: Delete throws error for GitHub URL registry
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I try to delete "deepractice.dev/hello.text@1.0.0" using the URL registry
    Then the operation should fail with "read-only"

  # ============================================
  # Domain validation
  # ============================================

  @domain
  Scenario: Get resource with matching domain succeeds
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I resolve "deepractice.dev/hello.text@1.0.0" using the URL registry
    Then the resolve should succeed

  @domain
  Scenario: Get resource with mismatched domain fails
    Given a registry with URL "https://github.com/Deepractice/Registry" and domain "other.com"
    When I resolve "deepractice.dev/hello.text@1.0.0" using the URL registry
    Then the resolve should fail with "Untrusted domain"

  # ============================================
  # Discovery integration
  # ============================================

  @discovery @network
  Scenario: Discovery returns GitHub URL as primary
    When I discover registry for "deepractice.dev"
    Then the first registry URL should start with "https://github.com/"

  @discovery @network
  Scenario: Create registry from discovery
    When I create registry from discovery for "deepractice.dev"
    Then the registry should be created
    And I can resolve "deepractice.dev/hello.text@1.0.0" from the registry
