@journey @operator
Feature: Deploy and configure registry server
  As a Registry Operator
  I want to deploy a registry server using @resourcexjs/server
  So that developers can publish and consume resources

  Background:
    Given a clean server environment

  Scenario: Start server and verify health
    When I start a registry server with:
      | option      | value              |
      | port        | 3097               |
      | storagePath | .test-registry     |
    Then the server should be running on port 3097
    And GET "/health" should return status 200

  Scenario: Verify API endpoints are available
    Given the registry server is running
    When I GET "/search"
    Then the response status should be 200
    And the response should contain "results"

  Scenario: Publish and retrieve resource via API
    Given the registry server is running
    When I publish via API:
      | locator                | content      |
      | test:1.0.0             | Hello API    |
    Then GET "/resource/localhost%2Ftest%3A1.0.0" should return status 200
    And GET "/content/localhost%2Ftest%3A1.0.0" should return status 200
