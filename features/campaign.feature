Feature: Campaign module
  # Users are managed in config/users.json (kept out of the report).

  # ─────────────────────────────────────────────
  # REGRESSION
  # ─────────────────────────────────────────────

  @Regression @Campaign @TC-CAMP-01
  Scenario: Campaign page loads and all status tabs navigate successfully
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

  @Regression @Campaign @TC-CAMP-02
  Scenario: Edit Campaign name updates successfully
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
    Then Click the Save as Draft button
    Then Click the All tab
    Then Verify All tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Click on the campaign from the list
    Then Click the three-dot menu on the campaign
    Then Click the Edit campaign settings button
    Then Click the Edit name button on the campaign
    Then Clear the existing Campaign Name
    Then Enter the new Campaign Name
    Then Click the Save name button
    Then Verify the Campaign Name is updated successfully
    Then Click the Save as Draft button
    Then Enter the new Campaign Name in the search bar
    Then Verify the campaign is visible in the list with the updated name

  @Regression @Campaign @TC-CAMP-03
  Scenario: Select Engagement goal Click and verify goal is saved correctly
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
    Then Verify the goal summary section shows Click as the selected goal

  @Regression @Campaign @TC-CAMP-03b
  Scenario: Select Engagement goal Open and verify goal is saved correctly
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
    Then Verify the goal summary section shows Open as the selected goal

  @Regression @Campaign @TC-CAMP-04
  Scenario: Select Financial goal and verify goal is saved correctly
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then Click the Financial tab on the Goal section
    Then Click the Deposit Goal button
    Then click the Set Goal button
    Then Verify the Financial Goal should be set successfully
    Then Verify the goal summary section shows the selected Financial goal

  @Regression @Campaign @TC-CAMP-05
  Scenario: Select an Existing Audience and verify it is applied to the campaign
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
    Then Verify the selected audience name is shown in the audience summary section
    Then Verify the estimated reach count is displayed

  @Regression @Campaign @TC-CAMP-06
  Scenario: Set Control Group percentage and verify it is saved correctly
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then Click the Financial tab on the Goal section
    Then Click the Deposit Goal button
    Then click the Set Goal button
    Then Verify the Open Goal should be set successfully
    Then click the Existing Audience button
    Then select the audience from the list
    Then click the ok button on the pop up
    Then Locate the Control Group field in the Audience section
    Then Enter a valid Control Group percentage value
    Then click the Set Audience button
    Then Verify the Control Group percentage is saved and reflected in the audience summary

  @Regression @Campaign @TC-CAMP-07
  Scenario: Set a Time-Based trigger and verify it is saved correctly
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
    Then Verify the Trigger section shows the selected date and time

  @Regression @Campaign @TC-CAMP-08
  Scenario: Set an Event-Based trigger with Login event and verify it is saved
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
    Then Select the Event-Based trigger option
    Then Select the Login event from the event list
    Then click the Set Trigger button
    Then Verify the Trigger section shows Login as the selected event trigger

  # @Regression @Campaign @TC-CAMP-09
  # Scenario: Set a System Event trigger and verify it is saved correctly
  #   Given I log in for module "Campaign"
  #   When I navigate to "Campaign"
  #   Then I should see the "Campaign" page
  #   Then Click the Create New Campaign button
  #   Then Enter the Campaign Name and Campaign Tag
  #   Then Click the Create campaign button
  #   Then Verify the Campaign should should Create and navigate to the Edit Campaign page
  #   Then click the Open Goal button
  #   Then click the Set Goal button
  #   Then Verify the Open Goal should be set successfully
  #   Then click the Existing Audience button
  #   Then select the audience from the list
  #   Then click the ok button on the pop up
  #   Then click the Set Audience button
  #   Then Select the System Event trigger option
  #   Then Select a system event from the system event list
  #   Then click the Set Trigger button
  #   Then Verify the Trigger section shows the selected System Event

  @Regression @Campaign @TC-CAMP-10
  Scenario: Attempting to set trigger without configuring an event shows a validation error
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
    Then Select the Event-Based trigger option
    Then Do not select any event and leave the event field empty
    Then Verify the validation error message is displayed for trigger
    Then Click the Add live system event button
    Then Verify the validation error message is displayed for trigger
    Then Verify the trigger is not saved and the user remains on the trigger configuration screen

  # @Regression @Campaign @TC-CAMP-11
  # Scenario: Enable Re-enroll customers toggle and set days configuration
  #   Given I log in for module "Campaign"
  #   When I navigate to "Campaign"
  #   Then I should see the "Campaign" page
  #   Then Click the Create New Campaign button
  #   Then Enter the Campaign Name and Campaign Tag
  #   Then Click the Create campaign button
  #   Then Verify the Campaign should should Create and navigate to the Edit Campaign page
  #   Then click the Open Goal button
  #   Then click the Set Goal button
  #   Then Verify the Open Goal should be set successfully
  #   Then click the Existing Audience button
  #   Then select the audience from the list
  #   Then click the ok button on the pop up
  #   Then click the Set Audience button
  #   Then click the Trigger button
  #   Then Select the Event-Based trigger option
  #   Then Select the Login event from the event list
  #   Then Apply the event trigger configuration
  #   Then Locate the Re-enroll customers toggle
  #   Then Enable the Re-enroll customers toggle
  #   Then Enter the number of days for re-enrollment
  #   Then click the Set Trigger button
  #   Then Verify the Re-enroll toggle setting is saved and shown in the trigger summary

  @Regression @Campaign @TC-CAMP-12
  Scenario: Add Library Communication content to campaign and verify it is applied
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
    Then Verify the search results are displayed
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Verify the selected communication is applied and shown in the content summary

  @Regression @Campaign @TC-CAMP-13
  Scenario: Add a second Variant to the campaign communication and verify both are visible
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
    Then Verify the first variant is added successfully
    Then Click the Edit communication button
    Then Click the Add Variant button
    Then Click the Choose Content button for the new variant
    Then Search the 2 communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Verify both Variant A and Variant B are visible in the communication section

  @Regression @Campaign @TC-CAMP-14
  Scenario: Set Static percentage allocation for A/B variants and verify it is saved
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
    Then Click the Add Variant button
    Then Click the Choose Content button for the new variant
    Then Search the 2 communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Click the Edit communication button
    Then Select the Static allocation type
    Then Set Variant A allocation to 30 percent
    Then Set Variant B allocation to 70 percent
    Then Click the Set Communication button to confirm allocation
    Then Verify the total allocation equals 100 percent
    Then Verify the allocation is saved and shown correctly in the summary

  @Regression @Campaign @TC-CAMP-15
  Scenario: Set Criteria-Based allocation for variants and verify criteria is applied
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
    Then Click the Add Variant button
    Then Click the Choose Content button for the new variant
    Then Search the communication name in the search bar
    Then Search the 2 communication name in the search bar
    Then Select the Criteria-Based allocation type
    Then Click the Add Criteria button for Variant A
    Then Select the customer property criteria
    Then Set the criteria condition and value
    Then Select the Variant B as Default Variant
    Then Click the Set Communication button to confirm allocation
    Then Verify the criteria is saved and shown correctly in the allocation summary

  @Regression @Campaign @TC-CAMP-16
  Scenario: Save Campaign as Draft preserves the goal setting on re-opening
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
    Then Click the Save as Draft button
    Then Verify the campaign is saved as Draft successfully
    Then Click the Draft tab
    Then Verify Draft tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Verify the campaign is visible in the Draft tab
    Then Enter into the campaign Edit page
    Then Verify the campaign navigates to the Edit Campaign page
    Then Verify the Open Goal is still set and retained

  @Regression @Campaign @TC-CAMP-17
  Scenario: Publish Campaign after completing all steps and verify it appears in Active tab
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
    Then Verify the campaign is published successfully
    Then Click the Active tab
    Then Verify Active tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Verify the campaign is visible in the Active tab with Active status

  @Regression @Campaign @TC-CAMP-18
  Scenario: Edit Published Campaign shows Audience and Trigger fields as restricted
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Active tab
    Then Verify Active tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Click on the published active campaign from the list
    Then Verify the campaign details page is displayed
    Then Locate the Audience section
    Then Verify the Audience edit button is disabled or not clickable
    Then Locate the Trigger section
    Then Verify the Trigger edit button is disabled or not clickable

  @Regression @Campaign @TC-CAMP-19
  Scenario: Duplicate Campaign copies all settings and appears in Draft tab
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the All tab
    Then Verify All tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Click the three-dot menu on the campaign
    Then Click the campaign Duplicate option
    Then Click the Duplicate Confirm button
    Then Verify the duplication success message is displayed
    Then Click the Draft tab
    Then Verify Draft tab should load successfully
    Then Enter the duplicated Campaign Name in the search bar
    Then Verify the duplicated campaign is visible in the Draft tab

  @Regression @Campaign @TC-CAMP-20
  Scenario: Delete a Draft Campaign and verify it is removed from all tabs
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Draft tab
    Then Verify Draft tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Verify the campaign is visible in the Draft tab
    Then Click the three-dot menu on the campaign
    Then Click the Delete option
    Then Click the Delete Confirm button
    Then Verify the delete success message is displayed
    Then Verify the campaign is no longer visible in the Draft tab
    Then Click the All tab
    Then Verify All tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Verify the deleted campaign does not appear in the All tab

  @Regression @Campaign @TC-CAMP-21
  Scenario: Pagination loads correct campaign data on each page
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the All tab
    Then Verify All tab should load successfully
    Then Verify the campaign list has more than one page of results
    Then Click the Next page button
    Then Verify the second page of campaigns is loaded correctly
    Then Click the Previous page button
    Then Verify the first page of campaigns is restored correctly

  @Regression @Campaign @TC-CAMP-22
  Scenario: Search Campaign by name returns correct results and clears correctly
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the All tab
    Then Verify All tab should load successfully
    Then Enter a known Campaign Name in the search bar
    Then Verify only campaigns matching the search term are displayed in the list
    Then Clear the search bar
    Then Verify the full campaign list is restored with all campaigns visible

  @Regression @Campaign @TC-CAMP-23
  Scenario: Filter campaigns by status and verify only matching campaigns are shown
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the All tab
    Then Verify All tab should load successfully
    Then Click the Filter button
    Then Select a filter criteria such as trigger type or goal type
    Then Apply the selected filter
    Then Verify only campaigns matching the selected filter are displayed
    Then Click the Clear Filter button
    Then Verify the full campaign list is restored with all campaigns visible

  @Regression @Campaign @TC-CAMP-24
  Scenario: Campaign History Log displays correct activity entries with timestamps
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the All tab
    Then Verify All tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Verify the campaign is visible in the list
    Then Click the three-dot menu on the campaign
    Then Click the History Log tab or button
    Then Verify the History Log section is displayed
    Then Verify at least one activity entry is visible in the history log

  @Regression @Campaign @TC-CAMP-25
  Scenario: View Campaign Report loads and displays key metrics correctly
    Given I log in for module "Campaign"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Active tab
    Then Verify Active tab should load successfully
    Then Enter the Campaign Name in the search bar
    Then Verify the campaign is visible in the list
    Then Click the three-dot menu on the campaign
    Then Click the View Report button
    Then Verify the Campaign Report page is displayed
    Then Verify the report data is loaded without any errors
