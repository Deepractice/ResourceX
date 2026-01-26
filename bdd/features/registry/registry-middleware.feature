@registry @middleware
Feature: Registry Middleware
  Middleware pattern for adding cross-cutting concerns to Registry

  Background:
    Given a test registry directory

  # ============================================
  # Domain Validation Middleware
  # ============================================

  @domain-validation
  Scenario: Domain validation allows matching domain
    Given a local registry with a resource "example.com/hello.text@1.0.0" and content "Hello"
    And I wrap the registry with domain validation for "example.com"
    When I get "example.com/hello.text@1.0.0" from the wrapped registry
    Then I should receive an RXR with content "Hello"

  @domain-validation
  Scenario: Domain validation rejects mismatched domain
    Given a local registry with a resource "evil.com/hello.text@1.0.0" and content "Hello"
    And I wrap the registry with domain validation for "example.com"
    When I get "evil.com/hello.text@1.0.0" from the wrapped registry
    Then it should throw a RegistryError with message containing "Untrusted domain"

  @domain-validation
  Scenario: Domain validation applies to resolve as well
    Given a local registry with a resource "example.com/hello.text@1.0.0" and content "Hello"
    And I wrap the registry with domain validation for "example.com"
    When I resolve "example.com/hello.text@1.0.0" from the wrapped registry
    Then it should succeed without error

  @domain-validation
  Scenario: Domain validation rejects on resolve for mismatched domain
    Given a local registry with a resource "evil.com/hello.text@1.0.0" and content "Hello"
    And I wrap the registry with domain validation for "example.com"
    When I resolve "evil.com/hello.text@1.0.0" from the wrapped registry
    Then it should throw a RegistryError with message containing "Untrusted domain"

  # ============================================
  # Middleware Chaining
  # ============================================

  @middleware-chain
  Scenario: Middleware passes through other operations
    Given a local registry with a resource "example.com/hello.text@1.0.0" and content "Hello"
    And I wrap the registry with domain validation for "example.com"
    When I check if "example.com/hello.text@1.0.0" exists in the wrapped registry
    Then the wrapped registry should return true

  @middleware-chain
  Scenario: Middleware passes through search
    Given a local registry with a resource "example.com/hello.text@1.0.0" and content "Hello"
    And I wrap the registry with domain validation for "example.com"
    When I search the wrapped registry without options
    Then the wrapped search results should include "hello.text@1.0.0"
