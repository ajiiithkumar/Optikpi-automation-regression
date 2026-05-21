Feature: Dashboard module
  # Users are managed in config/users.json (kept out of the report).

  @Regression @REG-DASH-01
  Scenario: Dashboard page loads successfully
    Given I log in for module "Dashboard"
    When I navigate to "Dashboard"
    Then I should see the "Dashboard" page
    And KPI widgets should load
    And Notification tab should load
    And Business Performance tab should load
    And Marketing tab should load

  @Regression @REG-DASH-02
  Scenario: Dashboard filter interaction updates data
    Given I log in for module "Dashboard"
    When I navigate to "Dashboard"
    And KPI widgets should load
    And I apply "Last 30 days" filter on Dashboard
    Then KPI data should change
    And Marketing tab should load
    And Business Performance tab should load
