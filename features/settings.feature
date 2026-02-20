Feature: Settings module
  # Users are managed in config/users.json (kept out of the report).

  @SmokeTest @ST-SET-01
  Scenario: Settings page loads successfully
    Given I log in for module "Settings"
    When I navigate to "Settings"
    Then I should see the "Settings" page
