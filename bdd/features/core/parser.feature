@parser @core
Feature: ARP URL Parser
  ARP URL parser correctly parses arp:{semantic}:{transport}://{location} format URLs

  Scenario: Parse standard ARP URL
    Given ARP URL "arp:tool:https://example.com/tool.wasm"
    When parse the URL
    Then semantic should be "tool"
    And transport should be "https"
    And location should be "example.com/tool.wasm"

  Scenario: Parse ARP URL with parameters
    Given ARP URL "arp:prompt:arr://deepractice@assistant?lang=zh"
    When parse the URL
    Then semantic should be "prompt"
    And transport should be "arr"
    And location should be "deepractice@assistant?lang=zh"

  Scenario: Parse local file ARP URL
    Given ARP URL "arp:config:file://./config/settings.json"
    When parse the URL
    Then semantic should be "config"
    And transport should be "file"
    And location should be "./config/settings.json"

  @pending
  Scenario: Parse ARP URL with alias
    Given ARP URL "@tool:https://example.com/tool.wasm" with alias "@"
    When parse the URL
    Then semantic should be "tool"
    And transport should be "https"
