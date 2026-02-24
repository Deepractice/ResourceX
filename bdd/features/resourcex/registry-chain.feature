@resourcex @registry-chain
Feature: Registry Resolution Chain
  Resources not found locally are resolved through the registry chain.
  The chain tries configured registries in order, with a built-in default as fallback.

  # ============================================
  # Chain resolution — auto-pull from registry
  # ============================================

  Scenario: Resolve resource not found locally via default registry
    Given no registries are configured
    When I resolve via chain "deepractice-bdd:0.1.1"
    Then execute should return a non-empty string
    And the resource "registry.deepractice.dev/deepractice-bdd:0.1.1" should be cached locally

  Scenario: Resolve resource via configured registry chain
    Given a configured registry "default" at "https://registry.deepractice.dev"
    When I resolve via chain "deepractice-bdd:0.1.1"
    Then execute should return a non-empty string
    And the resource "registry.deepractice.dev/deepractice-bdd:0.1.1" should be cached locally

  # ============================================
  # Pinned registry — explicit prefix
  # ============================================

  Scenario: Resolve resource with explicit registry prefix
    Given no registries are configured
    When I resolve via chain "registry.deepractice.dev/deepractice-bdd:0.1.1"
    Then execute should return a non-empty string

  # ============================================
  # Error cases
  # ============================================

  Scenario: Resolve non-existent resource fails gracefully
    Given no registries are configured
    When I try to resolve via chain "nonexistent-resource-xyz:9.9.9"
    Then it should fail with an error
