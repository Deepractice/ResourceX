@deepractice @transport
Feature: Deepractice Transport
  Built-in transport for Deepractice ecosystem local storage

  @e2e
  Scenario: Resolve from deepractice transport with default config
    Given deepractice handler with default config
    And local file at deepractice path "sandbox/test.txt" with content "test content"
    When resolve "arp:text:deepractice://sandbox/test.txt"
    Then should return resource object
    And type should be "text"
    And content should be "test content"

  @e2e
  Scenario: Deposit to deepractice transport with default config
    Given deepractice handler with default config
    When deposit "hello deepractice" to "arp:text:deepractice://sandbox/greeting.txt"
    Then should succeed without error
    And file at deepractice path "sandbox/greeting.txt" should contain "hello deepractice"

  @e2e
  Scenario: Resolve from deepractice with custom parentDir
    Given deepractice handler with parentDir "./bdd/test-data/custom"
    And local file at custom deepractice path "sandbox/test.txt" with content "custom content"
    When resolve "arp:text:deepractice://sandbox/test.txt"
    Then should return resource object
    And content should be "custom content"

  @e2e
  Scenario: Deposit to deepractice with custom parentDir
    Given deepractice handler with parentDir "./bdd/test-data/custom"
    When deposit "custom data" to "arp:text:deepractice://sandbox/data.txt"
    Then should succeed without error
    And file at custom deepractice path "sandbox/data.txt" should contain "custom data"

  @e2e
  Scenario: Binary resource with deepractice transport
    Given deepractice handler with default config
    And binary content from bytes [0xDE, 0xAD, 0xBE, 0xEF]
    When deposit the content to "arp:binary:deepractice://blobs/data.bin"
    And resolve "arp:binary:deepractice://blobs/data.bin"
    Then should return resource object
    And type should be "binary"
    And content bytes should be [0xDE, 0xAD, 0xBE, 0xEF]

  @e2e
  Scenario: Check existence with deepractice transport
    Given deepractice handler with default config
    When deposit "exists test" to "arp:text:deepractice://test-exists.txt"
    Then resource "arp:text:deepractice://test-exists.txt" should exist
    And resource "arp:text:deepractice://not-exist.txt" should not exist

  @e2e
  Scenario: Delete with deepractice transport
    Given deepractice handler with default config
    When deposit "to delete" to "arp:text:deepractice://to-delete.txt"
    And delete resource "arp:text:deepractice://to-delete.txt"
    Then resource "arp:text:deepractice://to-delete.txt" should not exist
