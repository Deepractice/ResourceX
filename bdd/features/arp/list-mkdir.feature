@arp @list-mkdir
Feature: ARP List and Mkdir Operations
  ARP extended operations for directory management

  Background:
    Given a file transport handler
    And a temporary directory for testing

  # ============================================
  # List - Directory listing via ARL
  # ============================================

  @list
  Scenario: List directory contents
    Given a directory "listdir" with files:
      | name      |
      | a.txt     |
      | b.json    |
      | c.md      |
    When I parse ARP URL "arp:binary:file://listdir" and call list
    Then list result should contain "a.txt"
    And list result should contain "b.json"
    And list result should contain "c.md"

  @list
  Scenario: List directory recursively
    Given a directory structure:
      | path              |
      | listroot/a.txt    |
      | listroot/sub/b.txt|
      | listroot/sub/c.txt|
    When I parse ARP URL "arp:binary:file://listroot" and call list with recursive option
    Then list result should contain "a.txt"
    And list result should contain "sub/b.txt"
    And list result should contain "sub/c.txt"

  @list
  Scenario: List directory with pattern filter
    Given a directory "filterdir" with files:
      | name       |
      | file1.json |
      | file2.json |
      | file3.txt  |
    When I parse ARP URL "arp:binary:file://filterdir" and call list with pattern "*.json"
    Then list result should contain "file1.json"
    And list result should contain "file2.json"
    And list result should not contain "file3.txt"

  @list
  Scenario: List non-existent directory throws error
    When I parse ARP URL "arp:binary:file://non-existent-dir" and call list
    Then it should throw a TransportError

  @list
  Scenario: List on transport that doesn't support list throws error
    Given an ARP instance with http transport only
    When I parse ARP URL "arp:text:http://example.com" and call list
    Then it should throw a TransportError with message containing "does not support list"

  # ============================================
  # Mkdir - Create directories via ARL
  # ============================================

  @mkdir
  Scenario: Create directory
    When I parse ARP URL "arp:binary:file://newdir" and call mkdir
    Then path "newdir" should exist
    And path "newdir" should be a directory

  @mkdir
  Scenario: Create nested directory
    When I parse ARP URL "arp:binary:file://deep/nested/path" and call mkdir
    Then path "deep/nested/path" should exist
    And path "deep/nested/path" should be a directory

  @mkdir
  Scenario: Mkdir on existing directory does not throw
    Given a directory "existingdir"
    When I parse ARP URL "arp:binary:file://existingdir" and call mkdir
    Then it should not throw an error
    And path "existingdir" should exist

  @mkdir
  Scenario: Mkdir on transport that doesn't support mkdir throws error
    Given an ARP instance with http transport only
    When I parse ARP URL "arp:text:http://example.com/dir" and call mkdir
    Then it should throw a TransportError with message containing "does not support mkdir"
