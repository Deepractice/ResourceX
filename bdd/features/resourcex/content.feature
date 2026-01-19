@resourcex @content
Feature: ResourceX Content (RXC)
  RXC is an archive-based content container.
  Internally uses tar.gz format, externally provides file access API.

  Background:
    Given I have access to resourcexjs content

  # ============================================
  # Create - Single file
  # ============================================

  @create @single
  Scenario: Create content with single file
    When I create content with file "content" containing "Hello World"
    Then content should have 1 file
    And rxc file "content" should contain "Hello World"

  @create @single
  Scenario: Create content with named file
    When I create content with file "index.ts" containing "export const foo = 1;"
    Then content should have 1 file
    And rxc file "index.ts" should contain "export const foo = 1;"

  # ============================================
  # Create - Multiple files
  # ============================================

  @create @multi
  Scenario: Create content with multiple files
    When I create content with files:
      | path       | content        |
      | index.ts   | export default |
      | styles.css | body {}        |
    Then content should have 2 files
    And rxc file "index.ts" should contain "export default"
    And rxc file "styles.css" should contain "body {}"

  @create @nested
  Scenario: Create content with nested directory structure
    When I create content with files:
      | path                | content    |
      | src/index.ts        | main code  |
      | src/utils/helper.ts | helper     |
      | styles/main.css     | css styles |
    Then content should have 3 files
    And rxc file "src/index.ts" should contain "main code"
    And rxc file "src/utils/helper.ts" should contain "helper"
    And rxc file "styles/main.css" should contain "css styles"

  # ============================================
  # Read - file() and files()
  # ============================================

  @read @file
  Scenario: Read single file from content
    Given content with file "data.json" containing '{"key": "value"}'
    When I read file "data.json"
    Then I should get buffer containing '{"key": "value"}'

  @read @files
  Scenario: Read all files from content
    Given content with files:
      | path   | content |
      | a.txt  | aaa     |
      | b.txt  | bbb     |
    When I read all files
    Then I should get a map with 2 entries
    And map should contain "a.txt" with "aaa"
    And map should contain "b.txt" with "bbb"

  # ============================================
  # Error handling
  # ============================================

  @error
  Scenario: Read non-existent file
    Given content with file "exists.txt" containing "data"
    When I read file "not-exists.txt"
    Then it should throw ContentError with message "file not found"

  # ============================================
  # Archive format
  # ============================================

  @archive
  Scenario: Content buffer is tar.gz format
    Given content with file "test.txt" containing "test data"
    When I get the raw buffer
    Then buffer should be valid tar.gz format
