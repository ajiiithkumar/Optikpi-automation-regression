Feature: Audience module
# Users are managed in config/users.json (kept out of the report).

  @SmokeTest @ST-AUD-01
  Scenario: Audience page load successfully
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Live tab should load successfully
    Then On Schedule tab should load successfully
    And Static tab should load successfully

  @SmokeTest @ST-AUD-02
  Scenario: Audience view verification for Card & List view
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the card view icon
    Then Card view should load successfully
    Then Click the list view icon
    Then List view should load successfully

  @SmokeTest @ST-AUD-03
  Scenario: Static Audience Creation with Customer Property criteria
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
    Then Check the Preview button 2 records are shown
    Then Save as draft the Audience and go back to Audience list page
    Then Validate the Audience tooltip title matches the saved Audience title
    Then enter into that Audience
    Then Verify the added user Id are still in the Audience
    Then Add the Reminding users into the Audience and apply
    Then Click the Publish button and Cancel the Publish
    Then Verify the added 4 user Id are still in the Audience
    Then Click the Publish button and Confirm the Publish Static Audience
    And Static tab should load successfully
    Then Filter the Audience with the saved Audience title
    Then Verify the Audience is displayed in the list

  @SmokeTest @ST-AUD-04
  Scenario: Schedule Audience Save as Draft with Customer Property criteria
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
    Then Click the Publish button and Confirm the Publish Schedule Audience
    Then Filter the Audience with the saved Audience title
    Then enter into that Audience
    Then Click the "+ Add values" enter a valid User Id and apply
    Then Check the Preview button 2 records are shown
    Then Click the Publish button and Confirm the Publish Static Audience
    And Static tab should load successfully
    Then Filter the Audience with the saved Audience title
    Then Verify the Audience is displayed in the list

  @TestPreparation
  Scenario: Audience use for Existing Campaign and Workflow
    Given I log in for module "Audience"
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Click the Create new Audience button
    Then Click the Create from scratch option
    Then I should see the Create Audience page
    Then Fill in the Existing Audience details and save
    Then It should enter into the edit page of the created Audience
    Then Click the customer property option on Criteria
    Then on the customer property pop up select User Id property and apply
    Then Click the Condition and select is one of option
    Then In the value field enter a valid User Id and apply
    Then Check the Preview button 1 record is shown
    Then Click the Publish button and Confirm the Publish Static Audience
