@arp @params
Feature: ARP Runtime Parameters
  ARP operations support runtime parameters passed to handlers

  # ============================================
  # Runtime Parameters
  # ============================================

  Scenario: Resolve with runtime params
    Given a file transport
    And And a directory "testdir" containing:
      | name       |
      | a.txt      |
      | b.json     |
    When resolve "testdir" with params:
      | key     | value  |
      | pattern | *.json |
    Then result should be filtered by pattern

  Scenario: Resolve directory with recursive param
    Given a file transport
    And And files in structure:
      | path           |
      | root/a.txt     |
      | root/sub/b.txt |
    When resolve "root" with params:
      | key       | value |
      | recursive | true  |
    Then result should contain nested files

  Scenario: Resolve without params
    Given a file transport
    And And a test file "hello.txt" with content "Hello"
    When resolve "hello.txt" without params
    Then params result content should be "Hello"

  # ============================================
  # Transport-specific Location Format
  # ============================================

  @http
  Scenario: HTTP transport handles URL query string
    Given an HTTP transport
    When resolve "example.com/api?key=value&limit=10"
    Then transport should receive full URL with query string

  @http
  Scenario: HTTP transport merges runtime params with URL params
    Given an HTTP transport
    When resolve "example.com/api?key=value" with params:
      | key   | value |
      | limit | 10    |
    Then transport should merge params
    And runtime params should override URL params if conflict

  @file
  Scenario: File transport treats location as pure path
    Given a file transport
    And And a test file "data.txt" with content "test"
    When resolve "data.txt"
    Then location should be treated as file path
    And no URL parsing should occur
