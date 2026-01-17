@parser @core
Feature: ARP URL Parser
  ARP URL parser correctly parses arp:{semantic}:{transport}://{location} format URLs

  Scenario: Parse standard ARP URL with https transport
    Given ARP URL "arp:text:https://example.com/file.txt"
    When parse the URL
    Then semantic should be "text"
    And transport should be "https"
    And location should be "example.com/file.txt"

  Scenario: Parse ARP URL with http transport
    Given ARP URL "arp:text:http://localhost:3000/data"
    When parse the URL
    Then semantic should be "text"
    And transport should be "http"
    And location should be "localhost:3000/data"

  Scenario: Parse local file ARP URL
    Given ARP URL "arp:text:file://./config/settings.json"
    When parse the URL
    Then semantic should be "text"
    And transport should be "file"
    And location should be "./config/settings.json"

  Scenario: Parse binary ARP URL
    Given ARP URL "arp:binary:file://./data/image.png"
    When parse the URL
    Then semantic should be "binary"
    And transport should be "file"
    And location should be "./data/image.png"

  Scenario: Parse ARP URL with query parameters
    Given ARP URL "arp:text:https://example.com/api?lang=zh&format=json"
    When parse the URL
    Then semantic should be "text"
    And transport should be "https"
    And location should be "example.com/api?lang=zh&format=json"
