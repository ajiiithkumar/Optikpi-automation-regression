Feature: Campaign module
  # Users are managed in config/users.json (kept out of the report).

  @SmokeTest @ST-CAMP-01
  Scenario: Campaign page loads successfully
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Active tab
    Then Verify Active tab should load successfully
    Then Click the Completed tab
    Then Verify Completed tab should load successfully
    Then Click the Draft tab
    Then Verify Draft tab should load successfully
    Then Click the All tab
    Then Verify All tab should load successfully

  @SmokeTest @ST-CAMP-02
  Scenario: Create a Click Campaign with New Audience successfully
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then click the Click Goal button
    Then click the Set Goal button
    Then Verify the Click Goal should be set successfully
    Then click the campaign New Audience button
    Then Click the customer property option on Criteria
    Then on the customer property pop up select User Id property and apply
    Then Click the Condition and select is one of option
    Then In the value field enter a valid User Id and apply
    Then click the Set Audience button
    Then click the Trigger button
    Then select the next available time slot and apply
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then click the Publish button
    Then click the Publish Confirm button
    Then Click the Active tab
    Then Verify Active tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Verify the campaign is visible in the Active tab

  @SmokeTest @ST-CAMP-03
  Scenario: Create a Campaign with Existing Audience successfully
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then click the Open Goal button
    Then click the Set Goal button
    Then Verify the Open Goal should be set successfully
    Then click the Existing Audience button
    Then select the audience from the list
    Then click the ok button on the pop up
    Then click the Set Audience button
    Then click the Trigger button
    Then select the next available time slot and apply
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then click the Publish button
    Then click the Publish Confirm button
