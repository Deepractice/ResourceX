@resourcex @archive-digest
Feature: Archive Digest
  Resources have a deterministic content digest computed from file-level digests.
  Format: sha256:<hex> — stable across re-packaging of identical content.

  # ============================================
  # Digest presence
  # ============================================

  Scenario: Add resource produces archive digest
    Given I have added resource "digest-test:1.0.0" with type "text" and content "Hello digest"
    When I get info for "digest-test:1.0.0"
    Then archive digest should be present
    And archive digest should start with "sha256:"

  # ============================================
  # Determinism
  # ============================================

  Scenario: Same content produces same digest
    Given I have added resource "det-a:1.0.0" with type "text" and content "Same content"
    And I have added resource "det-b:1.0.0" with type "text" and content "Same content"
    When I get info for "det-a:1.0.0"
    And I remember the archive digest
    And I get info for "det-b:1.0.0"
    Then archive digest should equal the remembered digest

  Scenario: Different content produces different digest
    Given I have added resource "diff-a:1.0.0" with type "text" and content "Content A"
    And I have added resource "diff-b:1.0.0" with type "text" and content "Content B"
    When I get info for "diff-a:1.0.0"
    And I remember the archive digest
    And I get info for "diff-b:1.0.0"
    Then archive digest should not equal the remembered digest
