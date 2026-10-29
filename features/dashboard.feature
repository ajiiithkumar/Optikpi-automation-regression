Feature: Dashboard module
  # Users are managed in config/users.json (kept out of the report).

  @Regression @Dashboard @REG-DASH-01
  Scenario: Dashboard v2 tab navigation
    Given I log in for module "Dashboard"
    Then I close the announcement popup if it appears
    When I navigate to "Dashboard"
    Then I should see the "Dashboard" page
    Then I navigate to the "Overview" dashboard tab and verify it loads
    Then I navigate to the "Actions" dashboard tab and verify it loads
    Then I navigate to the "Engagement" dashboard tab and verify it loads
    Then I navigate to the "Business Performance" dashboard tab and verify it loads

  @Regression @Dashboard @REG-DASH-02
  Scenario: Dashboard v2 global date range validation
    Given I log in for module "Dashboard"
    Then I close the announcement popup if it appears
    When I navigate to "Dashboard"
    Then I should see the "Dashboard" page
    Then I select the "This week" date range and verify it is displayed correctly
    Then I select the "This month" date range and verify it is displayed correctly
    Then I select the "Last 7 days" date range and verify it is displayed correctly
    Then I select the "Last 30 days" date range and verify it is displayed correctly
    Then I select the "Last month" date range and verify it is displayed correctly
    Then I select the "Last quarter" date range and verify it is displayed correctly

  @Regression @Dashboard @REG-DASH-03
  Scenario: Dashboard v2 custom date range persists across tabs
    Given I log in for module "Dashboard"
    Then I close the announcement popup if it appears
    When I navigate to "Dashboard"
    Then I should see the "Dashboard" page
    Then I select a custom date range from the first of the current month to today
    Then Verify the custom date range is displayed in the dashboard header
    Then I navigate to the "Actions" dashboard tab and verify it loads
    Then Verify the custom date range is displayed in the dashboard header
    Then I navigate to the "Engagement" dashboard tab and verify it loads
    Then Verify the custom date range is displayed in the dashboard header
    Then I navigate to the "Business Performance" dashboard tab and verify it loads
    Then Verify the custom date range is displayed in the dashboard header

  @Regression @Dashboard @REG-DASH-04
  Scenario: Dashboard v2 audience filter on Engagement tab
    Given I log in for module "Dashboard"
    Then I close the announcement popup if it appears
    When I navigate to "Dashboard"
    Then I should see the "Dashboard" page
    Then I navigate to the "Engagement" dashboard tab and verify it loads
    Then I open the dashboard filter panel
    Then I select the existing audience in the dashboard filter
    Then I apply the dashboard audience filter
    Then Verify the audience filter is displayed in the dashboard

  @Regression @Dashboard @REG-DASH-05
  Scenario: Dashboard v2 audience filter persists on Business Performance tab
    Given I log in for module "Dashboard"
    Then I close the announcement popup if it appears
    When I navigate to "Dashboard"
    Then I should see the "Dashboard" page
    Then I navigate to the "Engagement" dashboard tab and verify it loads
    Then I open the dashboard filter panel
    Then I select the existing audience in the dashboard filter
    Then I apply the dashboard audience filter
    Then I navigate to the "Business Performance" dashboard tab and verify it loads
    Then Verify the audience filter is displayed in the dashboard

  @Regression @Dashboard @REG-DASH-06
  Scenario: Dashboard v2 reset audience filter
    Given I log in for module "Dashboard"
    Then I close the announcement popup if it appears
    When I navigate to "Dashboard"
    Then I should see the "Dashboard" page
    Then I navigate to the "Engagement" dashboard tab and verify it loads
    Then I open the dashboard filter panel
    Then I select the existing audience in the dashboard filter
    Then I apply the dashboard audience filter
    Then Verify the audience filter is displayed in the dashboard
    Then I open the dashboard filter panel
    Then I reset the dashboard filter
    Then Verify the audience filter is not displayed in the dashboard
