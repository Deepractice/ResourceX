@prefix-alias @core
Feature: Prefix Alias
  Support custom alias for shorthand URL notation
  Standard "arp:" prefix is always supported

  @e2e
  Scenario: Use standard arp prefix
    Given ResourceX with default config
    And local file "test-data/hello.txt" with content "Hello standard"
    When resolve "arp:text:file://./test-data/hello.txt"
    Then should return resource object
    And type should be "text"
    And content should be "Hello standard"

  @e2e
  Scenario: Use default alias @
    Given ResourceX with default config
    And local file "test-data/hello.txt" with content "Hello alias"
    When resolve "@text:file://./test-data/hello.txt"
    Then should return resource object
    And type should be "text"
    And content should be "Hello alias"

  @e2e
  Scenario: Use custom alias # for ARP
    Given ResourceX with alias "#"
    When deposit "test content" to "#text:file://./test-data/custom.txt"
    Then should succeed without error
    And file "./test-data/custom.txt" should contain "test content"

  @e2e
  Scenario: Standard arp always works with custom alias
    Given ResourceX with alias "#"
    When deposit "arp works" to "arp:text:file://./test-data/arp-test.txt"
    Then should succeed without error
    And file "./test-data/arp-test.txt" should contain "arp works"

  @e2e
  Scenario: Resource URL with @ prefix
    Given ResourceX with default config
    And ResourceX has resource "mydata" with semantic "text", transport "file", basePath "./test-data"
    And local file "test-data/config.txt" with content "resource data"
    When resolve "@mydata://config.txt"
    Then should return resource object
    And type should be "text"
    And content should be "resource data"

  @e2e
  Scenario: Resource URL with arp prefix
    Given ResourceX with default config
    And ResourceX has resource "mydata" with semantic "text", transport "file", basePath "./test-data"
    And local file "test-data/config.txt" with content "resource data"
    When resolve "arp:mydata://config.txt"
    Then should return resource object
    And type should be "text"
    And content should be "resource data"

  @e2e @error
  Scenario: Reject URL without any valid prefix
    Given ResourceX with default config
    When resolve "text:file://./config.txt"
    Then should throw error
    And error message should contain "Invalid"

  @e2e @error
  Scenario: Reject URL with wrong custom alias
    Given ResourceX with alias "#"
    When resolve "@text:file://./config.txt"
    Then should throw error
    And error message should contain "Invalid"

  @e2e
  Scenario: Resource name same as semantic name
    Given ResourceX with default config
    And ResourceX has resource "text" with semantic "binary", transport "file", basePath "./test-data"
    And binary content from bytes [0x01, 0x02, 0x03]
    When deposit the content to "@text://data.bin"
    And resolve "@text://data.bin"
    Then should return resource object
    And type should be "binary"
    And content bytes should be [0x01, 0x02, 0x03]
