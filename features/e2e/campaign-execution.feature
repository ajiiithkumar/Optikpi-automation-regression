Feature: Campaign execution end-to-end
  # Publishes real campaigns on Dev and waits for backend processing, so it is kept out of the
  # default runs (npm test only reads features/*.feature; the parallel run uses @Regression).
  # Order: CREATE all campaigns first (no waiting), then VERIFY each one after its launch time.
  # Scope: the initial send only. Later hourly executions and 1-day re-enrollments are not checked,
  #        so every run finishes in one go (about 40-45 minutes).
  # Run:     npm run test:campaign-e2e            (create all 7, then verify all 7 in the same run)
  #          npm run test:campaign-e2e:create     (only create + publish)
  #          npm run test:campaign-e2e:verify     (only verify already-created campaigns)
  # Status:  npm run test:campaign-e2e:status     (Passed / Failed / Blocked per case)
  # Users come from data/users.csv (row numbers); names are generated like the other campaign tests.
  # Audiences: one shared Static audience per exact user set, created once and re-verified by user id on
  # every use (state file).
  # Content: approved mock content - email Sendgrid_automation_test (A); C7 Variant B uses SMS Twillio SMS Mock.
  # Event-triggered cases use their own user so one deposit never reaches the other case's campaign.


  # ─────────────────────────────────────────────
  # CREATE
  # Builds and publishes every campaign first; no waiting for launches.
  # ─────────────────────────────────────────────

  @CampaignE2E @E2E-Create @E2E-Immediate @REG-CAMP-E2E-01
  Scenario: Create - Single launch to three users processes each user once and completes
    Given Start E2E case "REG-CAMP-E2E-01" titled "Single launch - three users"
    And Use users "1,2,3" from users.csv for the E2E case
    And Describe the E2E setup as "Static audience of 3 users (User Id is one of), single launch, no control group, one variant at 100% with mock email content"
    And I log in for module "Audience"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the shared Static audience for users "1,2,3"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then click the Open Goal button
    Then click the Set Goal button
    Then Select the E2E audience in the campaign
    Then Verify the campaign audience preview count equals the E2E user count
    Then click the Set Audience button
    Then click the Trigger button
    Then select the next available time slot and apply
    Then Verify re-enrollment is disabled
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Publish the E2E campaign
    Then Record the published E2E campaign
    Then Mark the E2E campaign as created

  @CampaignE2E @E2E-Create @E2E-Immediate @REG-CAMP-E2E-03
  Scenario: Create - Deposit event trigger without re-enrollment processes the first deposit only
    Given Start E2E case "REG-CAMP-E2E-03" titled "Event trigger - re-enrollment disabled"
    And Use users "4" from users.csv for the E2E case
    And Describe the E2E setup as "Static audience of 1 dedicated user, Event trigger on Deposit, re-enrollment disabled, no control group, one variant at 100% with mock email content"
    And I log in for module "Audience"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the shared Static audience for users "1"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then click the Open Goal button
    Then click the Set Goal button
    Then Select the E2E audience in the campaign
    Then Verify the campaign audience preview count equals the E2E user count
    Then click the Set Audience button
    Then Select the Event-Based trigger option
    Then Set the event trigger start time to the next available slot
    Then Select the Deposit event on the event trigger
    Then Verify re-enrollment is disabled
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Publish the E2E campaign
    Then Record the published E2E campaign
    Then Mark the E2E campaign as created

  @CampaignE2E @E2E-Create @E2E-Immediate @REG-CAMP-E2E-06
  Scenario: Create - Single launch with a 50% control group holds out two users and processes two
    Given Start E2E case "REG-CAMP-E2E-06" titled "Single launch - 50% control group"
    And Use users "1,2,3,4" from users.csv for the E2E case
    And Describe the E2E setup as "Static audience of 4 users, single launch, 50% control group, one variant with mock email content"
    And I log in for module "Audience"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the shared Static audience for users "1,2,3,4"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then Reload the new campaign draft
    Then click the Open Goal button
    Then click the Set Goal button
    Then Select the E2E audience in the campaign
    Then Verify the campaign audience preview count equals the E2E user count
    Then Enter 50 as the Control Group percentage
    Then click the Set Audience button
    Then click the Trigger button
    Then select the next available time slot and apply
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Publish the E2E campaign
    Then Record the published E2E campaign
    Then Mark the E2E campaign as created

  @CampaignE2E @E2E-Create @E2E-Immediate @REG-CAMP-E2E-07
  Scenario: Create - Single launch with two 50/50 variants assigns two users to each variant
    Given Start E2E case "REG-CAMP-E2E-07" titled "Single launch - two variants"
    And Use users "1,2,3,4" from users.csv for the E2E case
    And Describe the E2E setup as "Static audience of 4 users, single launch, no control group, Variant A 50% email (Sendgrid_automation_test) and Variant B 50% SMS (Twillio SMS Mock)"
    And I log in for module "Audience"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the shared Static audience for users "1,2,3,4"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then click the Open Goal button
    Then click the Set Goal button
    Then Select the E2E audience in the campaign
    Then Verify the campaign audience preview count equals the E2E user count
    Then click the Set Audience button
    Then click the Trigger button
    Then select the next available time slot and apply
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then Click the Add Variant button
    Then Click the Choose Content button for the new variant
    Then Search the communication "Twillio SMS Mock" in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Click the Edit communication button
    Then Select the Static allocation type
    Then Set Variant A allocation to 50 percent
    Then Set Variant B allocation to 50 percent
    Then Click the Set Communication button to confirm allocation
    Then Verify the total allocation equals 100 percent
    Then Publish the E2E campaign
    Then Record the published E2E campaign
    Then Mark the E2E campaign as created

  @CampaignE2E @E2E-Create @E2E-Scheduled @REG-CAMP-E2E-02
  Scenario: Create - Hourly campaign without re-enrollment processes each user once at the first execution
    Given Start E2E case "REG-CAMP-E2E-02" titled "Recurring - re-enrollment disabled"
    And Use users "1,2" from users.csv for the E2E case
    And Describe the E2E setup as "Static audience of 2 users, repeat every hour, re-enrollment disabled, no control group, one variant at 100%; first execution only"
    And I log in for module "Audience"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the shared Static audience for users "1,2"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then click the Open Goal button
    Then click the Set Goal button
    Then Select the E2E audience in the campaign
    Then Verify the campaign audience preview count equals the E2E user count
    Then click the Set Audience button
    Then click the Trigger button
    Then select the next available time slot and apply
    Then Select Repeat every Hour on the time-based trigger
    Then Verify re-enrollment is disabled
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Publish the E2E campaign
    Then Record the published E2E campaign
    Then Mark the E2E campaign as created

  @CampaignE2E @E2E-Create @E2E-Scheduled @REG-CAMP-E2E-04
  Scenario: Create - Hourly campaign with daily re-enrollment admits each user once at the first execution
    Given Start E2E case "REG-CAMP-E2E-04" titled "Recurring - re-enrollment enabled"
    And Use users "1,2" from users.csv for the E2E case
    And Describe the E2E setup as "Static audience of 2 users, repeat every hour, re-enroll every 1 day for max. 2 times, no control group, one variant at 100%; first enrollment only"
    And I log in for module "Audience"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the shared Static audience for users "1,2"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then click the Open Goal button
    Then click the Set Goal button
    Then Select the E2E audience in the campaign
    Then Verify the campaign audience preview count equals the E2E user count
    Then click the Set Audience button
    Then click the Trigger button
    Then select the next available time slot and apply
    Then Select Repeat every Hour on the time-based trigger
    Then Enable re-enrollment every 1 day for max. 2 times
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Publish the E2E campaign
    Then Record the published E2E campaign
    Then Mark the E2E campaign as created

  @CampaignE2E @E2E-Create @E2E-Scheduled @REG-CAMP-E2E-05
  Scenario: Create - Deposit event trigger with daily re-enrollment processes the first deposit and blocks an early second one
    Given Start E2E case "REG-CAMP-E2E-05" titled "Event trigger - re-enrollment enabled"
    And Use users "5" from users.csv for the E2E case
    And Describe the E2E setup as "Static audience of 1 dedicated user, Event trigger on Deposit, re-enroll every 1 day for max. 2 times, no control group, one variant at 100%; first enrollment only"
    And I log in for module "Audience"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the shared Static audience for users "1"
    When I navigate to "Campaign"
    Then I should see the "Campaign" page
    Then Click the Create New Campaign button
    Then Enter the Campaign Name and Campaign Tag
    Then Click the Create campaign button
    Then Verify the Campaign should should Create and navigate to the Edit Campaign page
    Then click the Open Goal button
    Then click the Set Goal button
    Then Select the E2E audience in the campaign
    Then Verify the campaign audience preview count equals the E2E user count
    Then click the Set Audience button
    Then Select the Event-Based trigger option
    Then Set the event trigger start time to the next available slot
    Then Select the Deposit event on the event trigger
    Then Enable re-enrollment every 1 day for max. 2 times
    Then click the Set Trigger button
    Then click the Choose Content button
    Then Search the communication name in the search bar
    Then Click the communication that comes first in the list
    Then click the Set Communication button
    Then Publish the E2E campaign
    Then Record the published E2E campaign
    Then Mark the E2E campaign as created

  # ─────────────────────────────────────────────
  # VERIFY
  # Runs after all campaigns are created: waits for each launch (max E2E_LAUNCH_WAIT_MIN), then checks Logs and Engagement.
  # ─────────────────────────────────────────────

  @CampaignE2E @E2E-Verify @E2E-Immediate @REG-CAMP-E2E-01-VERIFY
  Scenario: Verify - Single launch to three users processes each user once and completes
    Given Load the created E2E case "REG-CAMP-E2E-01"
    And I log in for module "Campaign"
    Then Wait for the E2E campaign launch time
    Then Wait for the campaign logs to show the launch
    Then Wait for the E2E campaign to process 3 users
    Then Wait for the E2E campaign status to be "Completed"
    Then Verify every E2E user has exactly 1 communication
    Then Verify no user outside the E2E audience was processed
    Then Verify the campaign executed exactly once
    Then Verify the engagement table and logs agree with the communication logs
    Then Mark the E2E setup phase as passed

  @CampaignE2E @E2E-Verify @E2E-Immediate @REG-CAMP-E2E-03-VERIFY
  Scenario: Verify - Deposit event trigger without re-enrollment processes the first deposit only
    Given Load the created E2E case "REG-CAMP-E2E-03"
    And I log in for module "Campaign"
    Then Wait for the E2E campaign launch time
    Then Wait for the E2E campaign status to be "Active"
    Then Upload a Successful Deposit event for E2E user 1 and verify it was accepted
    Then Wait for E2E user 1 to have 1 communication
    Then Verify the campaign logs show the deposit processing
    Then Upload a Successful Deposit event for E2E user 1 and verify it was accepted
    Then Watch the processing window and verify E2E user 1 still has 1 communication
    Then Verify no user outside the E2E audience was processed
    Then Mark the E2E setup phase as passed

  @CampaignE2E @E2E-Verify @E2E-Immediate @REG-CAMP-E2E-06-VERIFY
  Scenario: Verify - Single launch with a 50% control group holds out two users and processes two
    Given Load the created E2E case "REG-CAMP-E2E-06"
    And I log in for module "Campaign"
    Then Wait for the E2E campaign launch time
    Then Wait for the campaign logs to show the launch
    Then Wait for the E2E campaign to process 2 users
    Then Wait for the E2E campaign status to be "Completed"
    Then Verify the control group split is 2 control and 2 processed
    Then Verify the campaign executed exactly once
    Then Verify the engagement table and logs agree with the communication logs
    Then Mark the E2E setup phase as passed

  @CampaignE2E @E2E-Verify @E2E-Immediate @REG-CAMP-E2E-07-VERIFY
  Scenario: Verify - Single launch with two 50/50 variants assigns two users to each variant
    Given Load the created E2E case "REG-CAMP-E2E-07"
    And I log in for module "Campaign"
    Then Wait for the E2E campaign launch time
    Then Wait for the campaign logs to show the launch
    Then Wait for the E2E campaign to process 4 users
    Then Wait for the E2E campaign status to be "Completed"
    Then Verify the variant split is 2 users in A with "Sendgrid_automation_test" and 2 users in B with "Twillio SMS Mock"
    Then Verify the campaign executed exactly once
    Then Verify the engagement table and logs agree with the communication logs
    Then Mark the E2E setup phase as passed

  @CampaignE2E @E2E-Verify @E2E-Scheduled @REG-CAMP-E2E-02-VERIFY
  Scenario: Verify - Hourly campaign without re-enrollment processes each user once at the first execution
    Given Load the created E2E case "REG-CAMP-E2E-02"
    And I log in for module "Campaign"
    Then Wait for the E2E campaign launch time
    Then Wait for the campaign logs to show the launch
    Then Wait for the E2E campaign to process 2 users
    Then Verify every E2E user has exactly 1 communication
    Then Verify no user outside the E2E audience was processed
    Then Mark the E2E setup phase as passed

  @CampaignE2E @E2E-Verify @E2E-Scheduled @REG-CAMP-E2E-04-VERIFY
  Scenario: Verify - Hourly campaign with daily re-enrollment admits each user once at the first execution
    Given Load the created E2E case "REG-CAMP-E2E-04"
    And I log in for module "Campaign"
    Then Wait for the E2E campaign launch time
    Then Wait for the campaign logs to show the launch
    Then Wait for the E2E campaign to process 2 users
    Then Verify every E2E user has exactly 1 communication
    Then Verify no user outside the E2E audience was processed
    Then Mark the E2E setup phase as passed

  @CampaignE2E @E2E-Verify @E2E-Scheduled @REG-CAMP-E2E-05-VERIFY
  Scenario: Verify - Deposit event trigger with daily re-enrollment processes the first deposit and blocks an early second one
    Given Load the created E2E case "REG-CAMP-E2E-05"
    And I log in for module "Campaign"
    Then Wait for the E2E campaign launch time
    Then Wait for the E2E campaign status to be "Active"
    Then Upload a Successful Deposit event for E2E user 1 and verify it was accepted
    Then Wait for E2E user 1 to have 1 communication
    Then Verify the campaign logs show the deposit processing
    Then Upload a Successful Deposit event for E2E user 1 and verify it was accepted
    Then Watch the processing window and verify E2E user 1 still has 1 communication
    Then Mark the E2E setup phase as passed
