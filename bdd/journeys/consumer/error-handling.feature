@journey @consumer
Feature: Error handling for consumers
  As a Resource Consumer
  I want clear error messages when things go wrong
  So that I can understand and fix problems

  Background:
    Given a consumer test environment

  Scenario: Resource not found on registry
    Given a registry server with no resources
    When I run consumer command "rx pull nonexistent:1.0.0"
    Then the command should fail
    And the output should contain "not found"

  Scenario: Invalid locator format
    When I run consumer command "rx ingest @invalid@locator@"
    Then the command should fail
    And the output should contain "Invalid"

  Scenario: Registry unavailable
    Given no registry server is running
    And rx CLI is configured with registry "http://localhost:9999"
    When I run consumer command "rx pull some:1.0.0"
    Then the command should fail
    And the output should contain "Unable to connect"

  Scenario: Version not found
    Given a registry server with published resources
    And the registry has resource "exists:1.0.0" with content "Content"
    When I run consumer command "rx pull exists:2.0.0"
    Then the command should fail
    And the output should contain "not found"

  Scenario: Helpful message when no registry configured
    Given consumer has no registry configured
    When I run consumer command "rx pull some:1.0.0"
    Then the command should fail
    And the output should contain "No registry configured"
    And the output should contain "config set registry"

  Scenario: Network error during use shows clear message
    Given a registry server with published resources
    And the registry has resource "network-test:1.0.0" with content "Content"
    And consumer cache is empty
    And consumer network is interrupted
    When I run consumer command "rx ingest localhost:3098/network-test:1.0.0"
    Then the command should fail
    And the output should contain a helpful error message
