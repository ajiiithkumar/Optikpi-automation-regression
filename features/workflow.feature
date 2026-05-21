Feature: Workflow module
  # Users are managed in config/users.json (kept out of the report).

  @Regression @REG-WORKFLOW-01
  Scenario: Workflow page load
    Given I log in for module "Workflow"
    When I navigate to "Workflow"
    Then I should see the "Workflow" page
    Then Click The Active tab
    Then Verify Workflow Active tab should load successfully
    Then Click The Inactive tab
    Then Verify Workflow Inactive tab should load successfully
    Then Click The Draft tab
    Then Verify Workflow Draft tab should load successfully
    Then Click The All tab
    Then Verify Workflow All tab should load successfully

  @Regression @REG-WORKFLOW-02
  Scenario: Workflow Activation with error validation
    Given I log in for module "Workflow"
    When I navigate to "Workflow"
    Then I should see the "Workflow" page
    Then Click The Create New Workflow button
    Then Click the workflow create from scratch button
    Then enter the Workflow name and Tag
    Then Click The Create Workflow button
    Then Verify Workflow Edit page should load successfully
    Then click the Setup Enrollment node
    Then click the Workflow New Audience button
    Then Click the New Audience criteria
    Then Click the customer property option on Criteria
    Then on the customer property pop up select User Id property and apply
    Then Click the Condition and select is one of option
    Then In the value field enter a valid User Id and apply
    Then Check the Preview button 1 record is shown
    Then Click the "+ Add values" enter a valid User Id and apply
    Then Check the Workflow Audience Preview button 2 records are shown
    Then Click the Workflow Add To Enrollment Trigger button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the action node button
    Then Click the workflow Cancel button
    Then Click the workflow save draft button
    Then Click the workflow save draft confirm button
    Then I should see the "Workflow" page
    Then Enter the workflow name in the search bar
    Then Verify the workflow name is shown in the list
    Then Click the three-dot menu on the Workflow
    Then Click the Edit Workflow settings button
    Then Click the Workflow Publish button
    Then Check for Error message
    Then Click the node edit button "2"
    Then Click the Add Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the new exit node button
    Then Click the workflow apply button
    Then Click the Workflow Publish button
    Then Check for Error message
    Then Click the node edit button "3"
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Click the Workflow Publish button
    Then Choose The Start date
    Then Choose The End date
    Then Click the Workflow Publish confirm button
    Then I should see the "Workflow" page
    Then Verify Workflow Active tab should load successfully
    Then Enter the workflow name in the search bar
    Then Verify the workflow name is shown in the list

  @Regression @REG-WORKFLOW-03
  Scenario: Workflow creation with Existing Audience enrollment and Delay node saved as Draft
    Given I log in for module "Workflow"
    When I navigate to "Workflow"
    Then I should see the "Workflow" page
    Then Click The Create New Workflow button
    Then Click the workflow create from scratch button
    Then enter the Workflow name and Tag
    Then Click The Create Workflow button
    Then Verify Workflow Edit page should load successfully
    Then click the Setup Enrollment node
    Then Click the Existing Audience enrollment option
    Then Click the Add Enrollment dropdown
    Then Select the Part of an Audience option
    Then Select the existing audience from the list
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Click the Live Event delay type option
    Then Select the Login live event option
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Click the workflow save draft button
    Then Click the workflow save draft confirm button
    Then Enter the workflow name in the search bar
    Then Verify the workflow name is shown in the list
