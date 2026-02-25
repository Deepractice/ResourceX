@resourcex @digest
Feature: Digest Reference
  Resources can be referenced by content digest for immutable pinning.
  Format: name@sha256:abc123 (Docker-style digest reference).

  # ============================================
  # Parse digest locator
  # ============================================

  Scenario: Parse locator with digest only
    When I parse "hello@sha256:abc123"
    Then parsed name should be "hello"
    And parsed tag should be "latest"
    And parsed digest should be "sha256:abc123"

  Scenario: Parse locator with tag and digest
    When I parse "hello:beta@sha256:abc123"
    Then parsed name should be "hello"
    And parsed tag should be "beta"
    And parsed digest should be "sha256:abc123"

  Scenario: Parse locator with registry and digest
    When I parse "registry.example.com/hello@sha256:abc123"
    Then parsed registry should be "registry.example.com"
    And parsed name should be "hello"
    And parsed tag should be "latest"
    And parsed digest should be "sha256:abc123"

  Scenario: Parse locator with registry, tag and digest
    When I parse "registry.example.com/hello:beta@sha256:abc123"
    Then parsed registry should be "registry.example.com"
    And parsed name should be "hello"
    And parsed tag should be "beta"
    And parsed digest should be "sha256:abc123"

  Scenario: Parse locator without digest remains unchanged
    When I parse "hello:1.0.0"
    Then parsed name should be "hello"
    And parsed tag should be "1.0.0"
    And parsed digest should be absent

  # ============================================
  # Format digest locator
  # ============================================

  Scenario: Format locator with digest
    Given an identifier with name "hello" tag "latest" and digest "sha256:abc123"
    When I format the identifier
    Then formatted locator should be "hello@sha256:abc123"

  Scenario: Format locator with tag and digest
    Given an identifier with name "hello" tag "beta" and digest "sha256:abc123"
    When I format the identifier
    Then formatted locator should be "hello:beta@sha256:abc123"

  Scenario: Format locator without digest
    Given an identifier with name "hello" tag "1.0.0" and no digest
    When I format the identifier
    Then formatted locator should be "hello:1.0.0"
