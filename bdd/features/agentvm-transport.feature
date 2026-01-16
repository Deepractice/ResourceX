@agentvm @transport
Feature: AgentVM Transport
  Built-in transport for AgentVM ecosystem local storage

  @e2e
  Scenario: Resolve from agentvm transport with default config
    Given agentvm handler with default config
    And local file at agentvm path "sandbox/test.txt" with content "test content"
    When resolve "arp:text:agentvm://sandbox/test.txt"
    Then should return resource object
    And type should be "text"
    And content should be "test content"

  @e2e
  Scenario: Deposit to agentvm transport with default config
    Given agentvm handler with default config
    When deposit "hello agentvm" to "arp:text:agentvm://sandbox/greeting.txt"
    Then should succeed without error
    And file at agentvm path "sandbox/greeting.txt" should contain "hello agentvm"

  @e2e
  Scenario: Resolve from agentvm with custom parentDir
    Given agentvm handler with parentDir "./bdd/test-data/custom"
    And local file at custom agentvm path "sandbox/test.txt" with content "custom content"
    When resolve "arp:text:agentvm://sandbox/test.txt"
    Then should return resource object
    And content should be "custom content"

  @e2e
  Scenario: Deposit to agentvm with custom parentDir
    Given agentvm handler with parentDir "./bdd/test-data/custom"
    When deposit "custom data" to "arp:text:agentvm://sandbox/data.txt"
    Then should succeed without error
    And file at custom agentvm path "sandbox/data.txt" should contain "custom data"

  @e2e
  Scenario: Binary resource with agentvm transport
    Given agentvm handler with default config
    And binary content from bytes [0xDE, 0xAD, 0xBE, 0xEF]
    When deposit the content to "arp:binary:agentvm://blobs/data.bin"
    And resolve "arp:binary:agentvm://blobs/data.bin"
    Then should return resource object
    And type should be "binary"
    And content bytes should be [0xDE, 0xAD, 0xBE, 0xEF]

  @e2e
  Scenario: Check existence with agentvm transport
    Given agentvm handler with default config
    When deposit "exists test" to "arp:text:agentvm://test-exists.txt"
    Then resource "arp:text:agentvm://test-exists.txt" should exist
    And resource "arp:text:agentvm://not-exist.txt" should not exist

  @e2e
  Scenario: Delete with agentvm transport
    Given agentvm handler with default config
    When deposit "to delete" to "arp:text:agentvm://to-delete.txt"
    And delete resource "arp:text:agentvm://to-delete.txt"
    Then resource "arp:text:agentvm://to-delete.txt" should not exist
