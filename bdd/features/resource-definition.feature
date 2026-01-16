@resource-definition @core
Feature: Resource Definition
  Define custom resources as shortcuts for ARP URLs via config

  @e2e
  Scenario: Create ResourceX with resource config and resolve
    Given ResourceX created with config
      | name   | semantic | transport | basePath           |
      | mydata | text     | file      | ./test-data/mydata |
    And local file "test-data/mydata/config.txt" with content "hello config"
    When resolve "@mydata://config.txt"
    Then should return resource object
    And type should be "text"

  @e2e
  Scenario: Create ResourceX with resource config and deposit
    Given ResourceX created with config
      | name   | semantic | transport | basePath           |
      | mydata | text     | file      | ./test-data/mydata |
    When deposit "hello world" to "@mydata://greeting.txt"
    Then should succeed without error
    And file "./test-data/mydata/greeting.txt" should contain "hello world"

  @e2e
  Scenario: Resource without basePath
    Given ResourceX created with config
      | name      | semantic | transport | basePath   |
      | localfile | text     | file      | ./test-data |
    When deposit "direct content" to "@localfile://direct.txt"
    Then should succeed without error
    And file "./test-data/direct.txt" should contain "direct content"

  @e2e
  Scenario: Multiple resources in config
    Given ResourceX created with resources
      | name   | semantic | transport | basePath            |
      | logs   | text     | file      | ./test-data/logs    |
      | blobs  | binary   | file      | ./test-data/blobs   |
    When deposit "log entry" to "@logs://app.log"
    And deposit bytes [0xCA, 0xFE] to "@blobs://data.bin"
    Then file "./test-data/logs/app.log" should contain "log entry"
    And file "./test-data/blobs/data.bin" bytes should be [0xCA, 0xFE]

  @e2e
  Scenario: Resource URL coexists with ARP URL
    Given ResourceX created with config
      | name   | semantic | transport | basePath           |
      | mydata | text     | file      | ./test-data/mydata |
    When deposit "via resource" to "@mydata://file1.txt"
    And deposit "via arp" to "arp:text:file://./test-data/mydata/file2.txt"
    Then file "./test-data/mydata/file1.txt" should contain "via resource"
    And file "./test-data/mydata/file2.txt" should contain "via arp"

  @e2e @error
  Scenario: Resolve undefined resource throws error
    Given ResourceX created with no resources
    When resolve "@undefined-resource://something"
    Then should throw error
    And error message should contain "Unknown resource"
