@documentation
Feature: Documentation Examples
  Verify code examples from README and documentation work correctly.
  These tests ensure documentation stays in sync with implementation.

  Background:
    Given a clean test registry

  # ============================================
  # RXL - Resource Locator
  # ============================================

  Scenario: Parse full resource locator
    When I doc parse locator "deepractice.ai/sean/assistant.prompt@1.0.0"
    Then doc locator domain should be "deepractice.ai"
    And doc locator path should be "sean"
    And doc locator name should be "assistant"
    And doc locator type should be "prompt"
    And doc locator version should be "1.0.0"
    And doc locator toString should be "deepractice.ai/sean/assistant.prompt@1.0.0"

  Scenario: Parse minimal locator
    When I doc parse locator "my-resource"
    Then doc locator name should be "my-resource"
    And doc locator domain should be undefined
    And doc locator type should be undefined

  Scenario: Parse locator with type and version
    When I doc parse locator "config.json@2.0.0"
    Then doc locator name should be "config"
    And doc locator type should be "json"
    And doc locator version should be "2.0.0"

  # ============================================
  # RXM - Resource Manifest
  # ============================================

  Scenario: Create manifest with all fields
    Given I doc create manifest with:
      | domain  | deepractice.ai |
      | path    | tools          |
      | name    | calculator     |
      | type    | json           |
      | version | 1.0.0          |
    Then doc manifest domain should be "deepractice.ai"
    And doc manifest toLocator should be "deepractice.ai/tools/calculator.json@1.0.0"

  # ============================================
  # RXA - Resource Archive
  # ============================================

  Scenario: Create archive with single file content
    Given I doc create archive with content "Hello, World!"
    Then doc archive should have file "content"
    And doc archive file "content" should contain "Hello, World!"

  Scenario: Create archive with multiple files
    Given I doc create archive with files:
      | path       | content              |
      | index.ts   | export default 42;   |
      | styles.css | body { margin: 0; }  |
    Then doc archive should have file "index.ts"
    And doc archive should have file "styles.css"
    And doc archive file "index.ts" should contain "export default 42;"

  Scenario: Create archive with nested directories
    Given I doc create archive with files:
      | path                 | content      |
      | src/index.ts         | main code    |
      | src/utils/helper.ts  | helper code  |
      | README.md            | docs         |
    Then doc archive should have file "src/index.ts"
    And doc archive should have file "src/utils/helper.ts"
    And doc archive should have file "README.md"

  # ============================================
  # RXP - Resource Package
  # ============================================

  Scenario: Extract archive to package and get paths
    Given I doc create archive with files:
      | path                 | content      |
      | src/index.ts         | main code    |
      | src/utils/helper.ts  | helper code  |
      | README.md            | docs         |
    When I doc extract the archive to package
    Then doc package paths should contain "src/index.ts"
    And doc package paths should contain "src/utils/helper.ts"
    And doc package paths should contain "README.md"

  Scenario: Extract archive to package and get tree
    Given I doc create archive with files:
      | path                 | content      |
      | src/index.ts         | main code    |
      | src/utils/helper.ts  | helper code  |
      | README.md            | docs         |
    When I doc extract the archive to package
    Then doc package tree should have directory "src"
    And doc package tree should have file "README.md"
    And doc package tree "src" should have file "index.ts"
    And doc package tree "src" should have directory "utils"

  Scenario: Read single file from package
    Given I doc create archive with files:
      | path       | content         |
      | data.json  | {"key":"value"} |
    When I doc extract the archive to package
    Then doc package file "data.json" should contain '{"key":"value"}'

  Scenario: Read all files from package
    Given I doc create archive with files:
      | path   | content |
      | a.txt  | aaa     |
      | b.txt  | bbb     |
    When I doc extract the archive to package
    Then doc package files map should have key "a.txt" with value "aaa"
    And doc package files map should have key "b.txt" with value "bbb"

  Scenario: Pack package back to archive
    Given I doc create archive with content "original content"
    When I doc extract the archive to package
    And I doc pack the package back to archive
    Then doc new archive file "content" should contain "original content"

  # ============================================
  # RXR - Complete Resource
  # ============================================

  Scenario: Assemble complete resource
    Given I doc create manifest with:
      | domain  | localhost |
      | name    | greeting  |
      | type    | text      |
      | version | 1.0.0     |
    And I doc create archive with content "Hello, World!"
    When I doc assemble RXR from manifest and archive
    Then doc RXR locator toString should be "localhost/greeting.text@1.0.0"
    And doc RXR manifest name should be "greeting"
    And doc RXR archive file "content" should contain "Hello, World!"

  # ============================================
  # Registry Operations
  # ============================================

  Scenario: Add and get resource from registry
    Given I doc create a complete resource:
      | domain  | localhost    |
      | name    | my-tool      |
      | type    | text         |
      | version | 1.0.0        |
      | content | Tool content |
    When I doc add the resource to registry
    And I doc get "my-tool.text@1.0.0" from registry
    Then doc retrieved RXR manifest name should be "my-tool"
    And doc retrieved RXR archive should contain "Tool content"

  Scenario: Resolve resource from registry
    Given I doc create a complete resource:
      | domain  | localhost     |
      | name    | hello         |
      | type    | text          |
      | version | 1.0.0         |
      | content | Hello, World! |
    When I doc add the resource to registry
    And I doc resolve "hello.text@1.0.0" from registry
    Then doc resolved execute should return "Hello, World!"

  Scenario: Check resource exists in registry
    Given I doc create a complete resource:
      | domain  | localhost |
      | name    | checker   |
      | type    | text      |
      | version | 1.0.0     |
      | content | exists    |
    When I doc add the resource to registry
    Then doc "checker.text@1.0.0" should exist in registry
    And doc "nonexistent.text@1.0.0" should not exist in registry

  Scenario: Search resources in registry
    Given I doc create a complete resource:
      | domain  | localhost |
      | name    | search-me |
      | type    | text      |
      | version | 1.0.0     |
      | content | findable  |
    When I doc add the resource to registry
    And I doc search registry with query "search"
    Then doc search results should contain "search-me"

  # ============================================
  # Multi-file Resource
  # ============================================

  Scenario: Create and use multi-file resource
    Given I doc create manifest with:
      | domain  | localhost |
      | name    | my-app    |
      | type    | binary    |
      | version | 1.0.0     |
    And I doc create archive with files:
      | path         | content                |
      | main.js      | console.log('Hello');  |
      | config.json  | {"debug": true}        |
    When I doc assemble RXR from manifest and archive
    And I doc add the resource to registry
    And I doc get "my-app.binary@1.0.0" from registry
    Then doc retrieved RXR archive should have file "main.js"
    And doc retrieved RXR archive should have file "config.json"
