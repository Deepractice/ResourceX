@resolve @core
Feature: Resolve End-to-End Flow
  Complete resource resolution flow: URL parse → Transport fetch → Semantic parse

  @e2e @meta
  Scenario: Resolve remote text resource
    Given ARP URL "arp:text:http://localhost:{{TEST_PORT}}/story"
    When resolve the resource
    Then should return resource object
    And type should be "text"
    And content should contain "Deepractice"
    And meta.semantic should be "text"
    And meta.transport should be "http"
    And meta.encoding should be "utf-8"

  @e2e
  Scenario: Resolve local text resource
    Given local file "test-data/hello.txt" with content "Hello from local file"
    And ARP URL "arp:text:file://./test-data/hello.txt"
    When resolve the resource
    Then should return resource object
    And type should be "text"
    And content should be "Hello from local file"

  @e2e @error
  Scenario: Resolve invalid URL format
    Given ARP URL "invalid-url"
    When resolve the resource
    Then should throw error
    And error message should contain "Invalid URL"

  @e2e @error
  Scenario: Resolve unsupported transport type
    Given ARP URL "arp:text:ftp://example.com/file.txt"
    When resolve the resource
    Then should throw error
    And error message should contain "Unsupported transport"

  @e2e @error
  Scenario: Resolve unsupported semantic type
    Given ARP URL "arp:unknown:https://example.com/file.txt"
    When resolve the resource
    Then should throw error
    And error message should contain "Unsupported semantic"
