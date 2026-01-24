@resourcex @archive
Feature: ResourceX Archive (RXA) and Package (RXP)
  RXA is an archive container (tar.gz format) for storage and transfer.
  RXP is an extracted package for runtime file access.
  RXA.extract() -> RXP, RXP.pack() -> RXA.

  Background:
    Given I have access to resourcexjs archive

  # ============================================
  # RXA - Create archive
  # ============================================

  @rxa @create
  Scenario: Create archive with single file
    When I create archive with file "content" containing "Hello World"
    Then archive buffer should be valid tar.gz format

  @rxa @create
  Scenario: Create archive with multiple files
    When I create archive with files:
      | path       | content        |
      | index.ts   | export default |
      | styles.css | body {}        |
    Then archive buffer should be valid tar.gz format

  @rxa @create
  Scenario: Create archive from existing tar.gz buffer
    Given an existing tar.gz buffer with file "data.txt" containing "existing"
    When I create archive from the buffer
    Then archive buffer should be valid tar.gz format

  # ============================================
  # RXA - Archive operations
  # ============================================

  @rxa @buffer
  Scenario: Get archive buffer
    Given archive with file "test.txt" containing "test data"
    When I get archive buffer
    Then I should receive a Buffer

  @rxa @stream
  Scenario: Get archive stream
    Given archive with file "test.txt" containing "test data"
    When I get archive stream
    Then I should receive a ReadableStream

  # ============================================
  # RXA.extract() -> RXP
  # ============================================

  @rxa @extract
  Scenario: Extract archive to package
    Given archive with file "content" containing "Hello"
    When I extract the archive
    Then I should receive an RXP package

  @rxa @extract @cache
  Scenario: Extract returns cached package
    Given archive with file "content" containing "Hello"
    When I extract the archive twice
    Then both extractions should return the same RXP instance

  # ============================================
  # RXP - paths() flat list
  # ============================================

  @rxp @paths
  Scenario: Get flat paths list from single file package
    Given archive with file "content" containing "Hello"
    When I extract and get paths
    Then paths should equal ["content"]

  @rxp @paths
  Scenario: Get flat paths list from multi-file package
    Given archive with files:
      | path                | content |
      | src/index.ts        | main    |
      | src/utils/helper.ts | helper  |
      | README.md           | readme  |
    When I extract and get paths
    Then paths should contain "src/index.ts"
    And paths should contain "src/utils/helper.ts"
    And paths should contain "README.md"
    And paths should have 3 items

  # ============================================
  # RXP - tree() structure
  # ============================================

  @rxp @tree
  Scenario: Get tree structure from flat files
    Given archive with files:
      | path      | content |
      | a.txt     | aaa     |
      | b.txt     | bbb     |
    When I extract and get tree
    Then tree should have 2 root nodes
    And tree should contain file node "a.txt"
    And tree should contain file node "b.txt"

  @rxp @tree
  Scenario: Get tree structure from nested files
    Given archive with files:
      | path                | content |
      | src/index.ts        | main    |
      | src/utils/helper.ts | helper  |
      | README.md           | readme  |
    When I extract and get tree
    Then tree should have 2 root nodes
    And tree should contain directory node "src"
    And tree should contain file node "README.md"
    And "src" directory should contain "index.ts"
    And "src" directory should contain directory "utils"

  # ============================================
  # RXP - file() read single file
  # ============================================

  @rxp @file
  Scenario: Read single file from package
    Given archive with file "data.json" containing '{"key": "value"}'
    When I extract and read file "data.json"
    Then rxp file buffer should contain '{"key": "value"}'

  @rxp @file
  Scenario: Read nested file from package
    Given archive with files:
      | path           | content    |
      | src/index.ts   | main code  |
    When I extract and read file "src/index.ts"
    Then rxp file buffer should contain "main code"

  @rxp @file @error
  Scenario: Read non-existent file throws error
    Given archive with file "exists.txt" containing "data"
    When I extract and read file "not-exists.txt"
    Then rxp should throw ContentError with message "file not found"

  # ============================================
  # RXP - files() read all files
  # ============================================

  @rxp @files
  Scenario: Read all files from package
    Given archive with files:
      | path   | content |
      | a.txt  | aaa     |
      | b.txt  | bbb     |
    When I extract and read all files
    Then rxp files map should have 2 entries
    And rxp files map should contain "a.txt" with "aaa"
    And rxp files map should contain "b.txt" with "bbb"

  # ============================================
  # RXP.pack() -> RXA
  # ============================================

  @rxp @pack
  Scenario: Pack package back to archive
    Given archive with files:
      | path   | content |
      | a.txt  | aaa     |
      | b.txt  | bbb     |
    When I extract and then pack
    Then I should receive an RXA archive
    And the new archive buffer should be valid tar.gz format

  @rxp @pack @roundtrip
  Scenario: Roundtrip archive -> package -> archive preserves content
    Given archive with files:
      | path           | content    |
      | src/index.ts   | main code  |
      | README.md      | readme     |
    When I extract, pack, and extract again
    Then the final package should have same paths as original
    And rxp file "src/index.ts" should contain "main code"
    And rxp file "README.md" should contain "readme"
