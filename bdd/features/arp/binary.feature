@binary @core
Feature: Binary Semantic Handler
  Handle raw binary resources without any transformation

  @e2e
  Scenario: Resolve local binary file
    Given local binary file "test-data/sample.bin" with bytes [0x48, 0x45, 0x4C, 0x4C, 0x4F]
    And ARP URL "arp:binary:file://./test-data/sample.bin"
    When resolve the resource
    Then should return resource object
    And type should be "binary"
    And content should be Buffer
    And content bytes should be [0x48, 0x45, 0x4C, 0x4C, 0x4F]

  @e2e
  Scenario: Deposit Buffer to local file
    Given ARP URL "arp:binary:file://./test-data/binary-deposit.bin"
    And binary content from bytes [0x01, 0x02, 0x03, 0x04]
    When deposit the content
    Then should succeed without error
    And file "./test-data/binary-deposit.bin" bytes should be [0x01, 0x02, 0x03, 0x04]

  @e2e
  Scenario: Deposit Uint8Array to local file
    Given ARP URL "arp:binary:file://./test-data/uint8-deposit.bin"
    And Uint8Array content from bytes [0xCA, 0xFE, 0xBA, 0xBE]
    When deposit the content
    Then should succeed without error
    And file "./test-data/uint8-deposit.bin" bytes should be [0xCA, 0xFE, 0xBA, 0xBE]

  @e2e
  Scenario: Deposit ArrayBuffer to local file
    Given ARP URL "arp:binary:file://./test-data/arraybuffer-deposit.bin"
    And ArrayBuffer content from bytes [0xDE, 0xAD, 0xBE, 0xEF]
    When deposit the content
    Then should succeed without error
    And file "./test-data/arraybuffer-deposit.bin" bytes should be [0xDE, 0xAD, 0xBE, 0xEF]

  @e2e
  Scenario: Deposit number array to local file
    Given ARP URL "arp:binary:file://./test-data/array-deposit.bin"
    And number array content [72, 69, 76, 76, 79]
    When deposit the content
    Then should succeed without error
    And file "./test-data/array-deposit.bin" bytes should be [0x48, 0x45, 0x4C, 0x4C, 0x4F]

  @e2e
  Scenario: Round-trip binary deposit and resolve
    Given ARP URL "arp:binary:file://./test-data/binary-roundtrip.bin"
    And binary content from bytes [0x00, 0x7F, 0x80, 0xFF]
    When deposit the content
    And resolve the resource
    Then should return resource object
    And type should be "binary"
    And content bytes should be [0x00, 0x7F, 0x80, 0xFF]

  @e2e @error
  Scenario: Deposit binary to read-only transport fails
    Given ARP URL "arp:binary:https://example.com/file.bin"
    And binary content from bytes [0x01, 0x02]
    When deposit the content
    Then should throw error
    And error message should contain "does not support write"
