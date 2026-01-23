@registry @git
Feature: Git Registry
  Access resources from a git repository

  Background:
    Given a local git registry at "./test-git-repo"

  # ============================================
  # Get - Read resource from git repo
  # ============================================

  @get
  Scenario: Get resource from git registry
    Given the git repo has resource "example.com/hello.text@1.0.0" with content "Hello Git!"
    When I get "example.com/hello.text@1.0.0" from git registry
    Then I should receive a git RXR object
    And the git manifest domain should be "example.com"
    And the git manifest name should be "hello"
    And the git manifest type should be "text"

  @get
  Scenario: Get non-existent resource throws error
    When I get "example.com/not-exist.text@1.0.0" from git registry
    Then it should throw a RegistryError
    And error message should contain "not found"

  # ============================================
  # Resolve - Resolve resource from git repo
  # ============================================

  @resolve
  Scenario: Resolve resource from git registry
    Given the git repo has resource "example.com/greeting.text@1.0.0" with content "Hello from Git!"
    When I resolve "example.com/greeting.text@1.0.0" from git registry
    Then the content should be "Hello from Git!"

  # ============================================
  # Exists - Check resource existence
  # ============================================

  @exists
  Scenario: Exists returns true for existing resource
    Given the git repo has resource "example.com/exists.text@1.0.0" with content "I exist"
    When I check if "example.com/exists.text@1.0.0" exists in git registry
    Then it should return true

  @exists
  Scenario: Exists returns false for non-existing resource
    When I check if "example.com/not-exist.text@1.0.0" exists in git registry
    Then it should return false

  # ============================================
  # Search - Search resources in git repo
  # ============================================

  @search
  Scenario: Search finds all resources
    Given the git repo has resource "example.com/foo.text@1.0.0" with content "foo"
    And the git repo has resource "example.com/bar.text@1.0.0" with content "bar"
    When I search in git registry without options
    Then I should find 2 resources
    And results should contain "foo"
    And results should contain "bar"

  @search
  Scenario: Search with query filters results
    Given the git repo has resource "example.com/apple.text@1.0.0" with content "apple"
    And the git repo has resource "example.com/banana.text@1.0.0" with content "banana"
    When I search in git registry with query "apple"
    Then I should find 1 resources
    And results should contain "apple"

  # ============================================
  # Read-only operations
  # ============================================

  @readonly
  Scenario: Link throws error
    Given the git repo has resource "example.com/test.text@1.0.0" with content "test"
    When I try to link a resource to git registry
    Then it should throw a RegistryError
    And error message should contain "read-only"

  @readonly
  Scenario: Delete throws error
    Given the git repo has resource "example.com/test.text@1.0.0" with content "test"
    When I try to delete "example.com/test.text@1.0.0" from git registry
    Then it should throw a RegistryError
    And error message should contain "read-only"

  # ============================================
  # Domain validation
  # ============================================

  @domain
  Scenario: Get resource with matching trusted domain succeeds
    Given a git registry with trusted domain "example.com"
    And the git repo has resource "example.com/hello.text@1.0.0" with content "Hello!"
    When I get "example.com/hello.text@1.0.0" from git registry
    Then I should receive a git RXR object

  @domain
  Scenario: Get resource with mismatched domain fails
    Given a git registry with trusted domain "trusted.com"
    And the git repo has resource "example.com/hello.text@1.0.0" with content "Hello!"
    When I get "example.com/hello.text@1.0.0" from git registry
    Then it should throw a RegistryError
    And error message should contain "Untrusted domain"

  @domain
  Scenario: Get resource without trusted domain allows any domain
    Given a local git registry at "./test-git-repo"
    And the git repo has resource "any.com/hello.text@1.0.0" with content "Hello!"
    When I get "any.com/hello.text@1.0.0" from git registry
    Then I should receive a git RXR object

  # ============================================
  # Well-known discovery
  # ============================================

  @discovery @network
  Scenario: Discover registry from well-known endpoint
    When I discover registry for "deepractice.dev"
    Then discovery should return domain "deepractice.dev"
    And discovery should return registry URL containing "Deepractice/Registry"

  @discovery @network @domain
  Scenario: Access non-existent domain resource via discovery fails
    Given I discover and create registry for "deepractice.dev"
    When I get "deepractice.ai/hello.text@1.0.0" from discovered registry
    Then it should throw a RegistryError
    And error message should contain "not found"

  @discovery @network @domain
  Scenario: Access resource with matching domain via discovery succeeds
    Given I discover and create registry for "deepractice.dev"
    When I get "deepractice.dev/hello.text@1.0.0" from discovered registry
    Then I should receive a git RXR object
    And the git manifest domain should be "deepractice.dev"

  # ============================================
  # Security: Remote URL requires domain
  # ============================================

  @security @domain
  Scenario: Remote git URL without domain throws error
    When I create a git registry with remote URL "git@github.com:Example/Repo.git" without domain
    Then it should throw a RegistryError
    And error message should contain "Remote git registry requires a trusted domain"

  @security @domain
  Scenario: Remote git URL with domain succeeds
    When I create a git registry with remote URL "git@github.com:Example/Repo.git" and domain "example.com"
    Then it should not throw an error

  @security @domain
  Scenario: Local path without domain is allowed
    When I create a git registry with local path "./test-repo" without domain
    Then it should not throw an error
