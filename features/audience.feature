Feature: Audience Regression - Criteria & Lifecycle Management
# Covers regression and functional scenarios for audience creation,
# editing, publishing, and validation across all criteria types.
# Users are managed in config/users.json (kept out of the report).

  # ─────────────────────────────────────────────
  # FUNCTIONAL - Criteria Types
  # ─────────────────────────────────────────────

  @Regression @TC-AUD-REG-01
  Scenario: Create Audience with Event and Occurrence criteria
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the Event performed option on Criteria
    Then on the Event performed pop up select login event and apply
    Then Set the occurrence at least
    Then Change the occurrence count to a random number between 1 and 5
    Then Set the occurrence date range to Today and apply
    Then Click the Preview button
    Then Check updates records are matching
    Then Save as draft the Audience and go back to Audience list page
    Then Validate the Audience tooltip title matches the saved Audience title

    

  @Regression @TC-AUD-REG-02
  Scenario: Create Audience with Customer Metric criteria
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the Customer Metric option on Criteria
    Then on the Customer Metric pop up select Total Deposited Amount property and apply
    Then Click the Condition and select greater than or equal option
    Then In the value field enter a random number between 200 and 1500 and apply
    Then Set the occurrence date range to Today and apply
    Then check the Customer count
    Then Click the Preview button
    Then Check updates records are matching
    Then Save as draft the Audience and go back to Audience list page
    Then Validate the Audience tooltip title matches the saved Audience title
 
  @Regression @TC-AUD-REG-03
  Scenario: Create Audience with Customer Engagement and Workflow attributes
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the Customer Engagement option on Criteria
    Then on the Customer Engagement pop up select Workflow Engagement and apply
    Then Select a  Workflow Name option and apply
    Then Select a valid Workflow Name from the dependent dropdown
    Then check the Customer count
    Then Click the Preview button
    Then Check updates records are matching
    Then Select a  Workflow Action option and apply
    Then Select a valid Workflow Action from the dependent dropdown
    Then Click the Preview button
    Then Check updates records are matching
    Then Save as draft the Audience and go back to Audience list page
    Then Validate the Audience tooltip title matches the saved Audience title

  @Regression @TC-AUD-REG-04
  Scenario: Create Audience with Part of Audience criteria
    Given I log in for module "Audience"
    And an Audience from TC-AUD-REG-01 or TC-AUD-REG-02 or TC-AUD-REG-03 is available
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the Part of Audience option on Criteria
    Then on the Part of Audience pop up select the existing audience and apply
    Then Click the Preview button
    Then Check updates records are matching
    Then Save as draft the Audience and go back to Audience list page
    Then Validate the Audience tooltip title matches the saved Audience title


  # ─────────────────────────────────────────────
  # FUNCTIONAL - Logical Conditions
  # ─────────────────────────────────────────────

  @Regression @TC-AUD-REG-05
  Scenario: AND condition validation within a single criteria group
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the Event performed option on Criteria
    Then on the Event performed pop up select login event and apply
    Then Set the occurrence at least
    Then Click the AND condition and add Customer Metric criteria in the same group
    Then on the Customer Metric pop up select Total Deposited Amount property and apply
    Then Click the Condition and select greater than or equal option
    Then In the value field enter 100 and apply
    Then Set the occurrence date range to Today and apply
    Then check the Customer count
    Then Click the Preview button
    Then Check updates records are matching
    Then Save as draft the Audience and go back to Audience list page

  @Regression @TC-AUD-REG-06
  Scenario: OR group validation across multiple criteria groups
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the Event performed option on Criteria
    Then on the Event performed pop up select login event and apply
    Then Click the Add Group button to add a second criteria group with OR logic
    Then Click the customer property option on the second group Criteria
    Then on the customer property pop up select User Id property and apply
    Then Click the Condition and select is one of option
    Then In the value field enter a valid User Id and apply
    Then check the Customer count
    Then Click the Preview button
    Then Check updates records are matching
    Then Save as draft the Audience and go back to Audience list page

  # ─────────────────────────────────────────────
  # REGRESSION - Lifecycle
  # ─────────────────────────────────────────────

  @Regression @TC-AUD-REG-07
  Scenario: Save as Draft and reopen Audience persists criteria data
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the customer property option on Criteria
    Then on the customer property pop up select User Id property and apply
    Then Click the Condition and select is one of option
    Then In the value field enter a valid User Id and apply
    Then Check the Preview button 2 records is shown
    Then check the Customer count
    Then Click the "+ Add values" enter a valid User Id and apply
    Then Check the Preview button 2 records is shown
    Then check the Customer count
    Then Save as draft the Audience and go back to Audience list page
    Then Filter the Audience with the saved Audience title
    Then Verify the Audience is displayed in the list
    Then enter into that Audience
    Then Verify the added user Id are still in the Audience

  @Regression @TC-AUD-REG-08 @ExistingAudience
  Scenario: Publish Audience and verify it appears in the correct tab with Active status
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the customer property option on Criteria
    Then on the customer property pop up select User Id property and apply
    Then Click the Condition and select is one of option
    Then In the value field enter a valid User Id and apply
    Then Click the Publish button and Confirm the Publish Static Audience
    Then Static tab should load successfully
    Then Filter the Audience with the saved Audience title
    Then Verify the Audience is displayed in the list

  @Regression @TC-AUD-REG-09
  Scenario: Edit a Published Audience and verify edit behaviour
    Given I log in for module "Audience"
    And a Published Audience exists
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Static tab should load successfully
    Then Filter the Audience with the saved Audience title
    Then enter into that Audience
    Then Check the Preview button 2 records is shown
    Then check the Customer count
    Then Modify the criteria by updating the User Id value
    Then Check the Preview button 2 records is shown
    Then Check updates records are matching
    Then Save the updated Audience
    Then Verify the updated criteria are reflected correctly

  @Regression @TC-AUD-REG-10
  Scenario: Duplicate an existing Audience and verify all fields are copied
    Given I log in for module "Audience"
    And an Audience exists in the list
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Filter the Audience with the existing Audience title
    Then Click the 3-dot action menu for the Audience
    Then Click the Duplicate option
    Then Verify the duplicate popup shows the title starting with Copy of
    Then Clear the duplicate title and enter a new unique title
    Then Click the Duplicate button on the popup
    Then The duplicated Audience should open in edit mode
    Then Verify all criteria and fields are copied from the original Audience
    Then Check the Preview button 2 records is shown
    Then Click the Publish button and Confirm the Publish Static Audience
    Then Static tab should load successfully
    Then Filter the Audience with the saved Audience title
    Then Verify the Audience is displayed in the list

  # ─────────────────────────────────────────────
  # FUNCTIONAL - Preview
  # ─────────────────────────────────────────────

  @Regression @TC-AUD-REG-11
  Scenario: Preview count updates in real time when criteria are added or removed
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the customer property option on Criteria
    Then on the customer property pop up select User Id property and apply
    Then Click the Condition and select is one of option
    Then In the value field enter a valid User Id and apply
    Then Check the Preview button 1 record is shown
    Then Click the "+ Add values" enter a valid User Id and apply
    Then Check the Preview button 2 records is shown
    Then Remove one User Id value from the criteria
    Then Check the Preview button 2 records is shown

  # ─────────────────────────────────────────────
  # NEGATIVE
  # ─────────────────────────────────────────────

  @Regression @Negative @TC-AUD-REG-12
  Scenario: Saving an Audience without any criteria shows a validation error
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the Preview button and then Publish button without adding any criteria
    

  @Regression @Negative @TC-AUD-REG-13
  Scenario: Entering text in a numeric criteria field shows a validation message
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the Customer Metric option on Criteria
    Then on the Customer Metric pop up select Total Deposited Amount property and apply
    Then Click the Condition and select greater than or equal option
    Then In the value field enter alphabetic text instead of a number and apply
    Then A field validation message should be displayed

  # ─────────────────────────────────────────────
  # UI
  # ─────────────────────────────────────────────

  @Regression @UI @TC-AUD-REG-14
  Scenario: Navigation and UI consistency when switching tabs and views
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Live tab should load successfully
    Then On Schedule tab should load successfully
    Then Static tab should load successfully
    Then Click the card view icon
    Then Card view should load successfully
    Then Click the list view icon
    Then List view should load successfully
    Then Verify no UI breakage or console errors across all tabs and views

  @Regression @UI @TC-AUD-REG-15
  Scenario: Action menu on Audience list shows all expected options
    Given I log in for module "Audience"
    And an Audience exists in the list
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Filter the Audience with the existing Audience title
    Then Click the 3-dot action menu for the Audience
    Then All expected action options should be visible and clickable

    
