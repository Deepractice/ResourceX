@arp @rxr-transport
Feature: RXR Transport
  Access files inside a resource via ARP protocol.
  Format: arp:{semantic}:rxr://{rxl}/{internal-path}

  Background:
    Given a registry with default configuration
    And an ARP instance with RxrTransport

  # ============================================
  # Basic file access
  # ============================================

  @resolve
  Scenario: Resolve file from single-file resource
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello World"
    When I parse ARP URL "arp:text:rxr://localhost/hello.text@1.0.0/content"
    And I resolve the parsed ARL
    Then the resolved content should be "Hello World"

  @resolve
  Scenario: Resolve file from multi-file resource
    Given a linked multi-file resource "localhost/project.text@1.0.0":
      | path              | content           |
      | src/index.ts      | console.log('hi') |
      | src/utils.ts      | export const x=1  |
      | README.md         | # Project         |
    When I parse ARP URL "arp:text:rxr://localhost/project.text@1.0.0/src/index.ts"
    And I resolve the parsed ARL
    Then the resolved content should be "console.log('hi')"

  @resolve
  Scenario: Resolve nested file path
    Given a linked multi-file resource "deepractice.ai/nuwa.text@1.0.0":
      | path                          | content              |
      | thought/first-principles.md   | Think from scratch   |
      | thought/reasoning.md          | Step by step         |
      | config.json                   | {"name": "nuwa"}     |
    When I parse ARP URL "arp:text:rxr://deepractice.ai/nuwa.text@1.0.0/thought/first-principles.md"
    And I resolve the parsed ARL
    Then the resolved content should be "Think from scratch"

  @resolve @binary
  Scenario: Resolve binary file
    Given a linked multi-file resource "localhost/assets.binary@1.0.0":
      | path       | content    |
      | image.png  | <binary>   |
    When I parse ARP URL "arp:binary:rxr://localhost/assets.binary@1.0.0/image.png"
    And I resolve the parsed ARL
    Then the resolved content should be a Buffer

  # ============================================
  # Error handling
  # ============================================

  @error
  Scenario: File not found in resource
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello"
    When I parse ARP URL "arp:text:rxr://localhost/hello.text@1.0.0/not-exist.txt"
    And I try to resolve the parsed ARL
    Then a TransportError should be thrown
    And the error message should include "not found"

  @error
  Scenario: Resource not found
    When I parse ARP URL "arp:text:rxr://localhost/not-exist.text@1.0.0/content"
    And I try to resolve the parsed ARL
    Then an error should be thrown
    And the error message should include "not found"

  @error
  Scenario: Invalid location - missing version
    When I parse ARP URL "arp:text:rxr://localhost/hello.text/content"
    And I try to resolve the parsed ARL
    Then an error should be thrown
    And the error message should include "missing @version"

  @error
  Scenario: Invalid location - missing internal path
    When I parse ARP URL "arp:text:rxr://localhost/hello.text@1.0.0"
    And I try to resolve the parsed ARL
    Then an error should be thrown
    And the error message should include "missing internal path"

  # ============================================
  # Exists check
  # ============================================

  @exists
  Scenario: Check existing file
    Given a linked multi-file resource "localhost/project.text@1.0.0":
      | path         | content |
      | src/index.ts | code    |
    When I parse ARP URL "arp:text:rxr://localhost/project.text@1.0.0/src/index.ts"
    And I check if the parsed ARL exists
    Then the exists result should be true

  @exists
  Scenario: Check non-existing file
    Given a linked resource "localhost/hello.text@1.0.0" with content "Hello"
    When I parse ARP URL "arp:text:rxr://localhost/hello.text@1.0.0/not-exist.txt"
    And I check if the parsed ARL exists
    Then the exists result should be false

  # ============================================
  # Read-only transport
  # ============================================

  @read-only
  Scenario: Set operation throws error
    When I parse ARP URL "arp:text:rxr://localhost/hello.text@1.0.0/content"
    And I try to deposit "new content" to the parsed ARL
    Then an error should be thrown
    And the error message should include "read-only"

  @read-only
  Scenario: Delete operation throws error
    When I parse ARP URL "arp:text:rxr://localhost/hello.text@1.0.0/content"
    And I try to delete the parsed ARL
    Then an error should be thrown
    And the error message should include "read-only"
