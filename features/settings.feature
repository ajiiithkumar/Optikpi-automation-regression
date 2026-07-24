Feature: Settings module
  # Users are managed in config/users.json (kept out of the report).

  @Regression @REG-SET-01
  Scenario: Settings page loads successfully
    Given I log in for module "Settings"
    Then I close the announcement popup if it appears
    When I navigate to "Settings"
    Then I should see the "Settings" page

