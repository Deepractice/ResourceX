@resourcex @registry-freshness
Feature: Registry Freshness Check
  When resolving a cached registry resource, the client checks if the
  remote digest has changed. If stale, it re-pulls; if fresh, it uses cache.

  Scenario: Stale cache is refreshed on resolve
    Given a local registry server is running
    And I push resource "fresh-test:latest" with content "version 1" to the local registry
    And I pull "fresh-test:latest" from the local registry
    When I update resource "fresh-test:latest" with content "version 2" on the local registry
    And I resolve the cached registry resource "fresh-test:latest"
    Then execute should return "version 2"

  Scenario: Fresh cache is reused without re-downloading
    Given a local registry server is running
    And I push resource "cache-test:latest" with content "stable content" to the local registry
    And I pull "cache-test:latest" from the local registry
    When I resolve the cached registry resource "cache-test:latest"
    Then execute should return "stable content"
