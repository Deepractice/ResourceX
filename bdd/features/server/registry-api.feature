@registry @server
Feature: Registry HTTP Server
  HTTP API for Registry operations, deployed to Cloudflare Workers.

  Base URL: https://registry.deepractice.dev/v1
  Storage: D1 (manifest + index) + R2 (archive)

  # ============================================
  # Well-Known Discovery
  # ============================================

  @well-known @pending
  Scenario: Well-known endpoint returns registry info
    When I GET "/.well-known/resourcex"
    Then the response status should be 200
    And the response should contain:
      | field      | value                             |
      | version    | 1.0                               |
      | registries | ["https://registry.deepractice.dev/v1"] |

  # ============================================
  # GET /v1/resource - Get manifest
  # ============================================

  @get-resource
  Scenario: Get resource manifest
    Given a published resource "hello.text@1.0.0" with content "Hello World"
    When I GET "/v1/resource?locator=hello.text@1.0.0"
    Then the response status should be 200
    And the response should be JSON with:
      | field   | value   |
      | name    | hello   |
      | type    | text    |
      | version | 1.0.0   |

  @get-resource
  Scenario: Get resource with domain and path
    Given a published resource "deepractice.dev/prompts/assistant.prompt@2.0.0"
    When I GET "/v1/resource?locator=deepractice.dev/prompts/assistant.prompt@2.0.0"
    Then the response status should be 200
    And the response should be JSON with:
      | field   | value           |
      | domain  | deepractice.dev |
      | path    | prompts         |
      | name    | assistant       |
      | type    | prompt          |
      | version | 2.0.0           |

  @get-resource @error
  Scenario: Get non-existent resource returns 404
    When I GET "/v1/resource?locator=not-exist.text@1.0.0"
    Then the response status should be 404
    And the response should contain error "not found"

  @get-resource @error
  Scenario: Get resource without locator returns 400
    When I GET "/v1/resource"
    Then the response status should be 400
    And the response should contain error "locator is required"

  # ============================================
  # HEAD /v1/resource - Check existence
  # ============================================

  @exists
  Scenario: HEAD returns 200 for existing resource
    Given a published resource "hello.text@1.0.0"
    When I HEAD "/v1/resource?locator=hello.text@1.0.0"
    Then the response status should be 200

  @exists
  Scenario: HEAD returns 404 for non-existent resource
    When I HEAD "/v1/resource?locator=not-exist.text@1.0.0"
    Then the response status should be 404

  # ============================================
  # GET /v1/content - Get archive
  # ============================================

  @get-content
  Scenario: Get resource archive
    Given a published resource "hello.text@1.0.0" with content "Hello World"
    When I GET "/v1/content?locator=hello.text@1.0.0"
    Then the response status should be 200
    And the response Content-Type should be "application/gzip"

  @get-content @pending
  Scenario: Archive content is valid tar.gz
    # TODO: Need to send real tar.gz in tests
    Given a published resource "hello.text@1.0.0" with content "Hello World"
    When I GET "/v1/content?locator=hello.text@1.0.0"
    Then the response should be a valid tar.gz archive

  @get-content @error
  Scenario: Get content for non-existent resource returns 404
    When I GET "/v1/content?locator=not-exist.text@1.0.0"
    Then the response status should be 404

  # ============================================
  # GET /v1/search - Search resources
  # ============================================

  @search
  Scenario: Search all resources
    Given published resources:
      | locator              |
      | hello.text@1.0.0     |
      | world.text@1.0.0     |
      | greeting.json@2.0.0  |
    When I GET "/v1/search"
    Then the response status should be 200
    And the response should contain 3 results

  @search
  Scenario: Search with query filter
    Given published resources:
      | locator              |
      | hello.text@1.0.0     |
      | world.text@1.0.0     |
      | greeting.json@2.0.0  |
    When I GET "/v1/search?q=text"
    Then the response status should be 200
    And the response should contain 2 results

  @search
  Scenario: Search with pagination
    Given 20 published resources
    When I GET "/v1/search?limit=5&offset=10"
    Then the response status should be 200
    And the response should contain 5 results

  # ============================================
  # POST /v1/publish - Publish resource
  # ============================================

  @publish
  Scenario: Publish resource with multipart form
    Given I have a resource manifest:
      | field   | value   |
      | name    | newres  |
      | type    | text    |
      | version | 1.0.0   |
    And I have an archive with content "New resource content"
    When I POST "/v1/publish" with multipart:
      | field    | value         |
      | manifest | <manifest>    |
      | archive  | <archive>     |
    Then the response status should be 201
    And the resource "newres.text@1.0.0" should exist

  @publish @error
  Scenario: Publish without manifest returns 400
    When I POST "/v1/publish" with multipart:
      | field   | value     |
      | archive | <archive> |
    Then the response status should be 400
    And the response should contain error "manifest is required"

  @publish @error
  Scenario: Publish without archive returns 400
    When I POST "/v1/publish" with multipart:
      | field    | value      |
      | manifest | <manifest> |
    Then the response status should be 400
    And the response should contain error "archive is required"

  @publish
  Scenario: Publish overwrites existing version
    Given a published resource "overwrite.text@1.0.0" with content "Old"
    When I publish "overwrite.text@1.0.0" with content "New"
    And I GET "/v1/content?locator=overwrite.text@1.0.0"
    Then extracting the archive should yield "New"

  # ============================================
  # DELETE /v1/resource - Delete resource
  # ============================================

  @delete
  Scenario: Delete existing resource
    Given a published resource "todelete.text@1.0.0"
    When I DELETE "/v1/resource?locator=todelete.text@1.0.0"
    Then the response status should be 204
    And the resource "todelete.text@1.0.0" should not exist

  @delete @error
  Scenario: Delete non-existent resource returns 404
    When I DELETE "/v1/resource?locator=not-exist.text@1.0.0"
    Then the response status should be 404

  # ============================================
  # CORS Headers
  # ============================================

  @cors
  Scenario: OPTIONS returns CORS headers
    When I OPTIONS "/v1/resource"
    Then the response status should be 204
    And the response should have header "Access-Control-Allow-Origin"
    And the response should have header "Access-Control-Allow-Methods"

  @cors
  Scenario: All responses include CORS headers
    Given a published resource "hello.text@1.0.0"
    When I GET "/v1/resource?locator=hello.text@1.0.0"
    Then the response should have header "Access-Control-Allow-Origin" with value "*"
