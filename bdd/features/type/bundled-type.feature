@resource-type @bundled-type
Feature: Bundled Resource Type
  ResourceType 整体 serverless 化，通过 bundle 转换为可执行代码

  Background:
    Given the type package is imported

  # ============================================
  # builtinTypes - 预 bundle 好的内置类型
  # ============================================

  @builtin
  Scenario: builtinTypes contains text type
    Then builtinTypes should contain type "text"
    And builtinTypes "text" should have aliases "txt, plaintext"
    And builtinTypes "text" should have code

  @builtin
  Scenario: builtinTypes contains json type
    Then builtinTypes should contain type "json"
    And builtinTypes "json" should have aliases "config, manifest"
    And builtinTypes "json" should have code

  @builtin
  Scenario: builtinTypes contains binary type
    Then builtinTypes should contain type "binary"
    And builtinTypes "binary" should have aliases "bin, blob, raw"
    And builtinTypes "binary" should have code

  @builtin
  Scenario: builtinTypes have sandbox "none" by default
    Then builtinTypes "text" should have sandbox "none"
    And builtinTypes "json" should have sandbox "none"
    And builtinTypes "binary" should have sandbox "none"

  # ============================================
  # bundleResourceType - bundle 自定义类型
  # ============================================

  @bundle
  Scenario: Bundle resource type from source code
    Given a resource type source code:
      """
      export default {
        name: "custom",
        description: "Custom type",
        async resolve(rxr) {
          const pkg = await rxr.archive.extract();
          const buffer = await pkg.file("content");
          return buffer.toString("utf-8").toUpperCase();
        }
      }
      """
    When I bundle the resource type
    Then the bundled type should have name "custom"
    And the bundled type should have code

  @bundle
  Scenario: Bundle resource type with aliases
    Given a resource type source code:
      """
      export default {
        name: "prompt",
        aliases: ["deepractice-prompt", "dp-prompt"],
        description: "Prompt type",
        async resolve(rxr) {
          return "prompt content";
        }
      }
      """
    When I bundle the resource type
    Then the bundled type should have name "prompt"
    And the bundled type should have aliases "deepractice-prompt, dp-prompt"

  @bundle
  Scenario: Bundle resource type with schema
    Given a resource type source code:
      """
      export default {
        name: "tool",
        description: "Tool type",
        schema: {
          type: "object",
          properties: {
            input: { type: "string" }
          }
        },
        async resolve(rxr) {
          return { execute: (args) => args.input };
        }
      }
      """
    When I bundle the resource type
    Then the bundled type should have name "tool"
    And the bundled type should have schema

  @bundle
  Scenario: Bundle resource type with custom sandbox level
    Given a resource type source code:
      """
      export default {
        name: "untrusted",
        description: "Untrusted type",
        sandbox: "isolated",
        async resolve(rxr) {
          return "result";
        }
      }
      """
    When I bundle the resource type
    Then the bundled type should have sandbox "isolated"

  @bundle
  Scenario: Bundle resource type from file path
    Given a resource type file "custom.type.ts" with content:
      """
      export default {
        name: "file-based",
        description: "File based type",
        async resolve(rxr) {
          return "from file";
        }
      }
      """
    When I bundle the resource type from file "custom.type.ts"
    Then the bundled type should have name "file-based"
    And the bundled type should have code

  # ============================================
  # bundleResourceTypes - 批量 bundle
  # ============================================

  @bundle-batch
  Scenario: Bundle multiple resource types
    Given resource type source codes:
      | name   | description  |
      | type-a | Type A desc  |
      | type-b | Type B desc  |
    When I bundle all resource types
    Then the bundled types should have 2 items
    And the bundled types should contain "type-a"
    And the bundled types should contain "type-b"
