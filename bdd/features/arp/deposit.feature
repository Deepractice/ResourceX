@deposit @core
Feature: Deposit Resource
  Store resources using ARP URLs with deposit capability

  @e2e
  Scenario: Deposit text to local file
    Given ARP URL "arp:text:file://./test-data/deposit-test.txt"
    And content "Hello from deposit"
    When deposit the content
    Then should succeed without error
    And file "./test-data/deposit-test.txt" should contain "Hello from deposit"

  @e2e
  Scenario: Deposit creates parent directories
    Given ARP URL "arp:text:file://./test-data/nested/dir/file.txt"
    And content "Nested content"
    When deposit the content
    Then should succeed without error
    And file "./test-data/nested/dir/file.txt" should contain "Nested content"

  @e2e
  Scenario: Deposit overwrites existing file
    Given local file "test-data/overwrite-test.txt" with content "Original content"
    And ARP URL "arp:text:file://./test-data/overwrite-test.txt"
    And content "New content"
    When deposit the content
    Then should succeed without error
    And file "./test-data/overwrite-test.txt" should contain "New content"

  @e2e @error
  Scenario: Deposit to read-only transport fails
    Given ARP URL "arp:text:https://example.com/file.txt"
    And content "Should fail"
    When deposit the content
    Then should throw error
    And error message should contain "read-only"

  @e2e
  Scenario: Round-trip deposit and resolve
    Given ARP URL "arp:text:file://./test-data/roundtrip.txt"
    And content "Round trip content 你好 🌍"
    When deposit the content
    And resolve the resource
    Then should return resource object
    And content should be "Round trip content 你好 🌍"
