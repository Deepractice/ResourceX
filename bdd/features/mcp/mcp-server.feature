@mcp
Feature: MCP Server Tools
  As an AI agent
  I want to use ResourceX MCP tools
  So that I can discover and use AI resources

  Background:
    Given a running MCP server

  # ============================================
  # Consumer Tools
  # ============================================

  Scenario: List local resources when empty
    When I call tool "list" with no parameters
    Then the result should contain "No local resources found"

  Scenario: Search for non-existent resource
    When I call tool "search" with:
      | query | non-existent-resource |
    Then the result should contain "No resources found"

  Scenario: Add and list a resource
    Given an MCP local resource "mcp-test-prompt:1.0.0" with content "Hello from MCP test"
    When I call tool "list" with no parameters
    Then the result should contain "mcp-test-prompt:1.0.0"

  Scenario: Search for a resource
    Given an MCP local resource "searchable-prompt:1.0.0" with content "Searchable content"
    When I call tool "search" with:
      | query | searchable |
    Then the result should contain "searchable-prompt:1.0.0"

  Scenario: Use a resource
    Given an MCP local resource "resolvable-prompt:1.0.0" with content "Resolved content here"
    When I call tool "ingest" with:
      | source | resolvable-prompt:1.0.0 |
    Then the result should be "Resolved content here"

  Scenario: Get resource info
    Given an MCP local resource "info-prompt:1.0.0" with content "Info content"
    When I call tool "info" with:
      | locator | info-prompt:1.0.0 |
    Then the result should contain "Name:     info-prompt"
    And the result should contain "Type:     text"
    And the result should contain "Tag:      1.0.0"

  # ============================================
  # Author Tools
  # ============================================

  Scenario: Push without registry configured
    Given an MCP local resource "push-test:1.0.0" with content "Push content"
    When I call tool "push" with:
      | locator | push-test:1.0.0 |
    Then the result should contain "No registry specified"

  Scenario: Push to a registry
    Given an MCP local resource "publishable:1.0.0" with content "Publishable content"
    And a registry server running on port 3099
    When I call tool "push" with:
      | locator  | publishable:1.0.0     |
      | registry | http://localhost:3099 |
    Then the result should contain "Pushed: publishable:1.0.0"

  # ============================================
  # Auto-pull from Registry
  # ============================================

  Scenario: Use auto-pulls from registry
    Given a registry server running on port 3099
    And an MCP remote resource "remote-prompt:1.0.0" on the registry with content "Remote content"
    When I call tool "ingest" with:
      | source | localhost:3099/remote-prompt:1.0.0 |
    Then the result should be "Remote content"
