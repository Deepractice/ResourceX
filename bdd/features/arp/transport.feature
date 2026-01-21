@arp @transport
Feature: Transport Interface
  Transport provides unified get/set/exists/delete operations

  Background:
    Given a file transport handler
    And a temporary directory for testing

  # ============================================
  # Get - Retrieve content
  # ============================================

  @get
  Scenario: Get file content
    Given a file "hello.txt" with content "Hello World"
    When transport get "hello.txt"
    Then result content should be "Hello World"
    And result metadata type should be "file"

  @get
  Scenario: Get directory listing
    Given a directory "mydir" with files:
      | name      |
      | a.txt     |
      | b.json    |
      | c.md      |
    When transport get "mydir"
    Then result content should be a list containing "a.txt", "b.json", "c.md"
    And result metadata type should be "directory"

  @get
  Scenario: Get directory with recursive parameter
    Given a directory structure:
      | path           |
      | root/a.txt     |
      | root/sub/b.txt |
      | root/sub/c.txt |
    When transport get "root" with params:
      | key       | value |
      | recursive | true  |
    Then result content should contain "a.txt"
    And result content should contain "sub/b.txt"
    And result content should contain "sub/c.txt"

  @get
  Scenario: Get directory with pattern parameter
    Given a directory "data" with files:
      | name       |
      | file1.json |
      | file2.json |
      | file3.txt  |
    When transport get "data" with params:
      | key     | value  |
      | pattern | *.json |
    Then result content should be a list containing "file1.json", "file2.json"
    And result content should not contain "file3.txt"

  @get
  Scenario: Get non-existent path
    When transport get "non-existent-path"
    Then it should throw a TransportError
    And error message should contain "not found" or "ENOENT"

  # ============================================
  # Set - Store content
  # ============================================

  @set
  Scenario: Set file content
    When transport set "output.txt" with content "Test content"
    Then file "output.txt" should exist
    And transport file "output.txt" should have content "Test content"

  @set
  Scenario: Set creates parent directories
    When transport set "deep/nested/path/file.txt" with content "Nested"
    Then file "deep/nested/path/file.txt" should exist
    And transport file "deep/nested/path/file.txt" should have content "Nested"

  @set
  Scenario: Set overwrites existing file
    Given a file "existing.txt" with content "Old content"
    When transport set "existing.txt" with content "New content"
    Then transport file "existing.txt" should have content "New content"

  # ============================================
  # Exists - Check existence
  # ============================================

  @exists
  Scenario: Check existing file
    Given a file "exists.txt" with content "I exist"
    When transport exists "exists.txt"
    Then transport exists should return true

  @exists
  Scenario: Check existing directory
    Given a directory "existsdir"
    When transport exists "existsdir"
    Then transport exists should return true

  @exists
  Scenario: Check non-existing path
    When transport exists "does-not-exist"
    Then transport exists should return false

  # ============================================
  # Delete - Remove content
  # ============================================

  @delete
  Scenario: Delete file
    Given a file "to-delete.txt" with content "Delete me"
    When transport delete "to-delete.txt"
    Then file "to-delete.txt" should not exist

  @delete
  Scenario: Delete directory recursively
    Given a directory structure:
      | path              |
      | to-delete/a.txt   |
      | to-delete/sub/b.txt |
    When transport delete "to-delete"
    Then path "to-delete" should not exist

  @delete
  Scenario: Delete non-existent path
    When transport delete "already-gone"
    Then transport should not throw an error
