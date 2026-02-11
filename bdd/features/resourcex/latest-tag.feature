@resourcex @latest
Feature: Latest Tag Resolution
  Resources can be used without specifying a version.
  The "latest" tag is a pointer to the most recently added version.

  # ============================================
  # Basic Latest Resolution
  # ============================================

  Scenario: Use resource without version resolves to latest
    Given I have added resource "hello:1.0.0" with type "text" and content "v1"
    When I use "hello"
    Then execute should return "v1"

  Scenario: Latest points to most recently added version
    Given I have added resource "hello:1.0.0" with type "text" and content "v1"
    And I have added resource "hello:2.0.0" with type "text" and content "v2"
    When I use "hello"
    Then execute should return "v2"

  Scenario: Explicit version still works
    Given I have added resource "hello:1.0.0" with type "text" and content "v1"
    And I have added resource "hello:2.0.0" with type "text" and content "v2"
    When I use "hello:1.0.0"
    Then execute should return "v1"

  # ============================================
  # Has Resolution
  # ============================================

  Scenario: Has resolves latest
    Given I have added resource "hello:1.0.0" with type "text"
    Then has "hello" should return true
    And has "hello:latest" should return true

  Scenario: Has returns false when no versions exist
    Then has "nonexistent" should return false

  # ============================================
  # Info Resolution
  # ============================================

  Scenario: Info resolves latest to actual version
    Given I have added resource "hello:1.0.0" with type "text" and content "v1"
    When I get info for "hello"
    Then info version should be "1.0.0"

  # ============================================
  # Non-semver Tags
  # ============================================

  Scenario: Latest works with non-semver tags
    Given I have added resource "hello:beta" with type "text" and content "beta version"
    And I have added resource "hello:stable" with type "text" and content "stable version"
    When I use "hello"
    Then execute should return "stable version"

  Scenario: Add resource with tag then use without tag
    Given I have added resource "simple:1.0.0" with type "text" and content "simple content"
    When I use "simple"
    Then execute should return "simple content"

  # ============================================
  # Backward Compatibility
  # ============================================

  Scenario: Single version resource resolves without pointer
    Given I have added resource "legacy:2.0.0" with type "text" and content "legacy content"
    When I use "legacy"
    Then execute should return "legacy content"
