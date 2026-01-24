@registry @github
Feature: GitHub Registry
  Access resources from a GitHub repository using tarball download

  This registry uses GitHub's archive API to download repository tarball,
  which is faster than git clone for read-only access.

  # ============================================
  # Configuration
  # ============================================

  @config
  Scenario: Create GitHub registry with URL
    When I create a GitHub registry with URL "https://github.com/Deepractice/Registry"
    Then it should not throw an error
    And the registry should be a GitHubRegistry instance

  @config
  Scenario: Create GitHub registry with custom branch
    When I create a GitHub registry with URL "https://github.com/Deepractice/Registry" and branch "develop"
    Then it should not throw an error

  @config
  Scenario: Create GitHub registry with domain for validation
    When I create a GitHub registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    Then it should not throw an error

  # ============================================
  # Get - Read resource from GitHub repo
  # ============================================

  @get
  Scenario: Get resource from GitHub registry
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I get "deepractice.dev/hello.text@1.0.0" from GitHub registry
    Then I should receive a GitHub RXR object
    And the GitHub manifest domain should be "deepractice.dev"
    And the GitHub manifest name should be "hello"

  @get
  Scenario: Get non-existent resource throws error
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I get "deepractice.dev/not-exist.text@1.0.0" from GitHub registry
    Then it should throw a RegistryError
    And error message should contain "not found"

  # ============================================
  # Resolve - Resolve resource from GitHub repo
  # ============================================

  @resolve
  Scenario: Resolve text resource from GitHub registry
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I resolve "deepractice.dev/hello.text@1.0.0" from GitHub registry
    Then the GitHub resolved content should be a string

  # ============================================
  # Exists - Check resource existence
  # ============================================

  @exists
  Scenario: Exists returns true for existing resource
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I check if "deepractice.dev/hello.text@1.0.0" exists in GitHub registry
    Then it should return true

  @exists
  Scenario: Exists returns false for non-existing resource
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I check if "deepractice.dev/not-exist.text@1.0.0" exists in GitHub registry
    Then it should return false

  # ============================================
  # Search - Search resources in GitHub repo
  # ============================================

  @search
  Scenario: Search finds resources in GitHub registry
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I search in GitHub registry without options
    Then I should find at least 1 resource in GitHub

  @search
  Scenario: Search with query filters results
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I search in GitHub registry with query "hello"
    Then results should contain "hello"

  # ============================================
  # Read-only operations
  # ============================================

  @readonly
  Scenario: Link throws error
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I try to link a resource to GitHub registry
    Then it should throw a RegistryError
    And error message should contain "read-only"

  @readonly
  Scenario: Add throws error
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I try to add a resource to GitHub registry
    Then it should throw a RegistryError
    And error message should contain "read-only"

  @readonly
  Scenario: Delete throws error
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I try to delete "deepractice.dev/hello.text@1.0.0" from GitHub registry
    Then it should throw a RegistryError
    And error message should contain "read-only"

  # ============================================
  # Domain validation
  # ============================================

  @domain
  Scenario: Get resource with matching trusted domain succeeds
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry" and domain "deepractice.dev"
    When I get "deepractice.dev/hello.text@1.0.0" from GitHub registry
    Then I should receive a GitHub RXR object

  @domain
  Scenario: Get resource with mismatched domain fails
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry" and domain "other.com"
    When I get "deepractice.dev/hello.text@1.0.0" from GitHub registry
    Then it should throw a RegistryError
    And error message should contain "Untrusted domain"

  # ============================================
  # Caching behavior
  # ============================================

  @cache
  Scenario: First access downloads tarball and caches
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    And the cache directory is empty
    When I get "deepractice.dev/hello.text@1.0.0" from GitHub registry
    Then the tarball should be downloaded
    And the cache directory should contain extracted files

  @cache
  Scenario: Subsequent access uses cached files
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    And the tarball is already cached
    When I get "deepractice.dev/hello.text@1.0.0" from GitHub registry
    Then it should not download tarball again
    And I should receive a GitHub RXR object

  # ============================================
  # Well-known discovery integration
  # ============================================

  @discovery @network
  Scenario: Well-known returns GitHub URL
    When I discover registry for "deepractice.dev"
    Then discovery should return a GitHub registry URL
    And the URL should start with "https://github.com/"

  @discovery @network
  Scenario: createRegistry uses GitHubRegistry for GitHub URL
    When I create registry from discovery for "deepractice.dev"
    Then the registry should be a GitHubRegistry instance

  # ============================================
  # URL parsing
  # ============================================

  @parsing
  Scenario: Parse standard GitHub URL
    When I parse GitHub URL "https://github.com/Deepractice/Registry"
    Then owner should be "Deepractice"
    And repo should be "Registry"
    And branch should be "main"

  @parsing
  Scenario: Parse GitHub URL with branch
    When I parse GitHub URL "https://github.com/Deepractice/Registry/tree/develop"
    Then owner should be "Deepractice"
    And repo should be "Registry"
    And branch should be "develop"

  # ============================================
  # Tarball download
  # ============================================

  @tarball @network
  Scenario: Download and extract tarball from GitHub
    Given a GitHub registry with URL "https://github.com/Deepractice/Registry"
    When I trigger tarball download
    Then tarball URL should be "https://github.com/Deepractice/Registry/archive/refs/heads/main.tar.gz"
    And tarball should be downloaded successfully
    And tarball should be extracted to cache directory
