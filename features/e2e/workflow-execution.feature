Feature: Workflow execution end-to-end
  # Publishes real workflows on Dev and follows users through Delay -> Action -> Exit using the workflow
  # report (node customer lists). Kept out of the default runs like the campaign E2E suite.
  # Order: CREATE every workflow first, then VERIFY each one; after verifying, the workflow is set
  # inactive and deleted.
  # Users: data/workflow-users.csv (wf_user_01..18) only, never data/users.csv, so a deposit here
  # never reaches a campaign/regression user. Each case uses its own users (row numbers below).
  # Delay baseline: 15 minutes. "Stays waiting" checks watch a bounded window (test configuration).
  # Movement (Delay entry/release, Action, Exit) is read from the node customer lists, or from the Logs when the
  # lists are empty. Known gaps: Dev writes no Logs (Flink); Demo leaves the node customer lists empty. The last
  # step fails the scenario on those gaps; the functional result is recorded before it (case phase "setup").
  # Newly imported profiles are missing from Customer Profile/Events search (ClickUp 1amxvnb40er): audience is
  # checked by its count, deposits by the accepted upload.
  # Run:     npm run test:workflow-e2e            (create all, then verify all)
  #          npm run test:workflow-e2e:status     (Passed / Failed / Blocked per case)
  # State:   data/workflow-e2e-state (separate from the campaign E2E state)


  # ─────────────────────────────────────────────
  # CREATE
  # ─────────────────────────────────────────────

  @WorkflowE2E @E2E-Create @REG-WF-E2E-01
  Scenario: Create - WF-01 Delay with Amount of Time only releases each user after its own timer
    Given Start E2E case "REG-WF-E2E-01" titled "WF-01 Delay - Amount of time only"
    And Use workflow users "1,2,3" for the E2E case
    And Describe the E2E setup as "Static audience of 3 workflow users; Enrollment -> Delay (15 min, Live event off) -> Action (Sendgrid_automation_test) -> Exit; deposit for user 3 while waiting"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the workflow E2E Static audience for users "1,2,3"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait 15 minutes only
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication "Sendgrid_automation_test" in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Mark the E2E workflow as created

  @WorkflowE2E @E2E-Create @REG-WF-E2E-02
  Scenario: Create - WF-02 Delay with Live Event only releases only the user who deposits
    Given Start E2E case "REG-WF-E2E-02" titled "WF-02 Delay - Live event only (Successful Deposit)"
    And Use workflow users "4,5,6" for the E2E case
    And Describe the E2E setup as "Static audience of 3 workflow users; Enrollment -> Delay (Live event Successful Deposit, Amount of time off) -> Action (Sendgrid_automation_test) -> Exit; deposit only for user 3"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the workflow E2E Static audience for users "1,2,3"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait for a Successful Deposit only
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication "Sendgrid_automation_test" in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Mark the E2E workflow as created

  @WorkflowE2E @E2E-Create @REG-WF-E2E-03
  Scenario: Create - WF-03 Delay with Live Event or Amount of Time releases each user once by whichever comes first
    Given Start E2E case "REG-WF-E2E-03" titled "WF-03 Delay - Successful Deposit or 15 min"
    And Use workflow users "7,8,9" for the E2E case
    And Describe the E2E setup as "Static audience of 3 workflow users; Enrollment -> Delay (Successful Deposit OR 15 min) -> Action (Sendgrid_automation_test) -> Exit; deposit only for user 3 well before its timer"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the workflow E2E Static audience for users "1,2,3"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait for a Successful Deposit or 15 minutes
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication "Sendgrid_automation_test" in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Mark the E2E workflow as created

  @WorkflowE2E @E2E-Create @REG-WF-E2E-04
  Scenario: Create - WF-04 Two deposits and the timer release the same user only once
    Given Start E2E case "REG-WF-E2E-04" titled "WF-04 Two deposits and timer - one release"
    And Use workflow users "15" for the E2E case
    And Describe the E2E setup as "Static audience of 1 workflow user; Enrollment -> Delay (Successful Deposit OR 15 min) -> Action (Sendgrid_automation_test) -> Exit; two deposits (distinct event ids) for the user while it waits, then its timer passes"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the workflow E2E Static audience for users "1"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait for a Successful Deposit or 15 minutes
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication "Sendgrid_automation_test" in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Mark the E2E workflow as created

  @WorkflowE2E @E2E-Create @REG-WF-E2E-05
  Scenario: Create - WF-05 A deposit made before entering the Delay does not release the user
    Given Start E2E case "REG-WF-E2E-05" titled "WF-05 Deposit before entry"
    And Use workflow users "16" for the E2E case
    And Describe the E2E setup as "Static audience of 1 workflow user; Enrollment -> Delay (Successful Deposit only) -> Action (Sendgrid_automation_test) -> Exit; one deposit after publishing but before the workflow starts, a second deposit after the user enters the Delay"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the workflow E2E Static audience for users "1"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait for a Successful Deposit only
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication "Sendgrid_automation_test" in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Upload a Successful Deposit event for workflow E2E user 1 before the workflow starts
    Then Mark the E2E workflow as created

  @WorkflowE2E @E2E-Create @REG-WF-E2E-06
  Scenario: Create - WF-06 Branch after a combined Delay sends each user down the right path
    Given Start E2E case "REG-WF-E2E-06" titled "WF-06 Branch after combined Delay"
    And Use workflow users "17,18" for the E2E case
    And Describe the E2E setup as "Static audience of 2 workflow users with no deposit history; Enrollment -> Delay (Successful Deposit OR 15 min) -> Branch (have Performed Successful Deposit Atleast 1 time in Today); Yes -> Action (Sendgrid_automation_test) -> Exit (goal); No -> Exit; deposit only for user 2"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the workflow E2E Static audience for users "1,2"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait for a Successful Deposit or 15 minutes
    Then Click the workflow apply button
    Then Add a Yes-No Branch for a Successful Deposit today after the last step
    Then Add the Action node with communication "Sendgrid_automation_test" on the Branch Yes path
    Then Add an Exit node marked as goal after the Action on the Branch Yes path
    Then Add an Exit node on the Branch No path
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Mark the E2E workflow as created

  @WorkflowE2E @E2E-Create @REG-WF-E2E-07
  Scenario: Create - WF-07 Edit Delay from Amount of Time to Live Event while a user waits
    Given Start E2E case "REG-WF-E2E-07" titled "WF-07 Edit Delay time-only to event-only"
    And Use workflow users "10,11" for the E2E case
    And Describe the E2E setup as "Static audience of user 1 only; Enrollment -> Delay (15 min, Live event off) -> Action (Sendgrid_automation_test) -> Exit; after user 1 enters, the Delay is edited to Successful Deposit only and user 2 is added to the audience, then the workflow is republished once"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Create a new workflow E2E Static audience for users "1"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait 15 minutes only
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication "Sendgrid_automation_test" in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Mark the E2E workflow as created

  @WorkflowE2E @E2E-Create @REG-WF-E2E-08
  Scenario: Create - WF-08 Edit Delay from Live Event to Amount of Time while a user waits
    Given Start E2E case "REG-WF-E2E-08" titled "WF-08 Edit Delay event-only to time-only"
    And Use workflow users "12,13" for the E2E case
    And Describe the E2E setup as "Static audience of user 1 only; Enrollment -> Delay (Successful Deposit only) -> Action (Sendgrid_automation_test) -> Exit; after user 1 enters, the Delay is edited to 15 min only and user 2 is added to the audience, then the workflow is republished once"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Create a new workflow E2E Static audience for users "1"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait for a Successful Deposit only
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication "Sendgrid_automation_test" in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Mark the E2E workflow as created

  @WorkflowE2E @E2E-Create @REG-WF-E2E-09
  Scenario: Create - WF-09 Original and duplicated workflow release the same user independently
    Given Start E2E case "REG-WF-E2E-09" titled "WF-09 Original and duplicate - Successful Deposit only"
    And Use workflow users "14" for the E2E case
    And Describe the E2E setup as "Static audience of 1 workflow user; Enrollment -> Delay (Successful Deposit only) -> Action (Sendgrid_automation_test) -> Exit; the published workflow is duplicated with the Duplicate action and the copy is published; one deposit for the user"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    When I navigate to "Audience"
    Then I should see the "Audience" page
    Then Use the workflow E2E Static audience for users "1"
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
    Then Select the E2E audience in the workflow enrollment
    Then Click the Enrollment flyout Ok button
    Then Click the workflow apply button
    Then Click the Add new node button "1"
    Then Click the delay node button
    Then Set the workflow Delay to wait for a Successful Deposit only
    Then Click the workflow apply button
    Then Click the Add new node button "2"
    Then Click the action node button
    Then Click the Add Content button
    Then Search the communication "Sendgrid_automation_test" in the search bar
    Then Click the communication that comes first in the list
    Then Click the workflow apply button
    Then Click the Add new node button "3"
    Then Click the new exit node button
    Then Click the exit node mark as goal button and verify toggle is ON
    Then Click the workflow apply button
    Then Publish the E2E workflow
    Then Record the published E2E workflow
    Then Duplicate the E2E workflow and publish the copy
    Then Mark the E2E workflow as created



  # ─────────────────────────────────────────────
  # VERIFY
  # ─────────────────────────────────────────────

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-01-VERIFY
  Scenario: Verify - WF-01 Delay with Amount of Time only releases each user after its own timer
    Given Load the created E2E workflow case "REG-WF-E2E-01"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Wait for the E2E users to enter the workflow Delay node
    Then Upload a Successful Deposit event for workflow E2E user 3
    Then Verify E2E users "3" stay in the workflow Delay node for 5 minutes
    Then Wait for E2E users "1,2,3" to reach the workflow Exit node
    Then Verify E2E users "1,2,3" left the workflow Delay node after their own 15 minutes
    Then Verify E2E users "1,2,3" passed the workflow Action node exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Verify the workflow report node customer lists and Logs recorded the users

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-02-VERIFY
  Scenario: Verify - WF-02 Delay with Live Event only releases only the user who deposits
    Given Load the created E2E workflow case "REG-WF-E2E-02"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Wait for the E2E users to enter the workflow Delay node
    Then Upload a Successful Deposit event for workflow E2E user 3
    Then Wait for E2E users "3" to reach the workflow Exit node
    Then Verify E2E user 3 left the workflow Delay node before its 15 minute timer
    Then Verify E2E users "1,2" stay in the workflow Delay node for 15 minutes
    Then Verify E2E users "3" passed the workflow Action node exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Verify the workflow report node customer lists and Logs recorded the users

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-03-VERIFY
  Scenario: Verify - WF-03 Delay with Live Event or Amount of Time releases each user once by whichever comes first
    Given Load the created E2E workflow case "REG-WF-E2E-03"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Wait for the E2E users to enter the workflow Delay node
    Then Upload a Successful Deposit event for workflow E2E user 3
    Then Wait for E2E users "3" to reach the workflow Exit node
    Then Verify E2E user 3 left the workflow Delay node before its 15 minute timer
    Then Wait for E2E users "1,2,3" to reach the workflow Exit node
    Then Verify E2E users "1,2" left the workflow Delay node after their own 15 minutes
    Then Wait until 15 minutes plus the processing allowance have passed since the Delay entry of E2E users "3"
    Then Verify E2E users "1,2,3" passed the workflow Action node exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Verify the workflow report node customer lists and Logs recorded the users

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-04-VERIFY
  Scenario: Verify - WF-04 Two deposits and the timer release the same user only once
    Given Load the created E2E workflow case "REG-WF-E2E-04"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Wait for the E2E users to enter the workflow Delay node
    Then Upload a Successful Deposit event for workflow E2E user 1
    Then Upload a Successful Deposit event for workflow E2E user 1
    Then Wait for E2E users "1" to reach the workflow Exit node
    Then Verify E2E user 1 left the workflow Delay node before its 15 minute timer
    Then Wait until 15 minutes plus the processing allowance have passed since the Delay entry of E2E users "1"
    Then Verify E2E users "1" passed the workflow Action node exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Verify the workflow report node customer lists and Logs recorded the users

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-05-VERIFY
  Scenario: Verify - WF-05 A deposit made before entering the Delay does not release the user
    Given Load the created E2E workflow case "REG-WF-E2E-05"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Wait for the E2E users to enter the workflow Delay node
    Then Verify the first deposit of E2E user 1 was made before it entered the workflow Delay node
    Then Verify E2E users "1" stay in the workflow Delay node for 10 minutes
    Then Upload a Successful Deposit event for workflow E2E user 1
    Then Wait for E2E users "1" to reach the workflow Exit node
    Then Verify the deposit released E2E user 1 from the workflow Delay node
    Then Verify E2E users "1" passed the workflow Action node exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Verify the workflow report node customer lists and Logs recorded the users

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-06-VERIFY
  Scenario: Verify - WF-06 Branch after a combined Delay sends each user down the right path
    Given Load the created E2E workflow case "REG-WF-E2E-06"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Wait for the E2E users to enter the workflow Delay node
    Then Upload a Successful Deposit event for workflow E2E user 2
    Then Wait for E2E users "2" to reach the Branch "Yes" Exit node
    Then Verify the deposit released E2E user 2 from the workflow Delay node
    Then Wait for E2E users "1" to reach the Branch "No" Exit node
    Then Verify E2E users "1" reached the Branch "No" Exit node only after their own 15 minutes
    Then Verify E2E users "2" took the Branch Yes path and E2E users "1" took the No path
    Then Verify E2E users "2" passed the workflow Action node exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Verify the workflow report node customer lists and Logs recorded the users

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-07-VERIFY
  Scenario: Verify - WF-07 Edit Delay from Amount of Time to Live Event while a user waits
    Given Load the created E2E workflow case "REG-WF-E2E-07"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Wait for E2E users "1" to enter the workflow Delay node
    Then Add E2E user 2 to the case audience and update it
    Then Edit the E2E workflow Delay to wait for a Successful Deposit only
    Then Publish the E2E workflow changes and verify the Delay node id is unchanged
    Then Wait for E2E users "2" to enter the workflow Delay node
    Then Verify E2E users "1" were enrolled only once
    Then Wait for E2E users "1" to reach the workflow Exit node
    Then Verify E2E users "1" left the workflow Delay node after their own 15 minutes
    Then Verify E2E users "2" stay in the workflow Delay node until 15 minutes plus the processing allowance after their entry
    Then Upload a Successful Deposit event for workflow E2E user 2
    Then Wait for E2E users "1,2" to reach the workflow Exit node
    Then Verify the deposit released E2E user 2 from the workflow Delay node
    Then Verify E2E users "1,2" passed the workflow Action node exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Delete the E2E case audience
    Then Verify the workflow report node customer lists and Logs recorded the users

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-08-VERIFY
  Scenario: Verify - WF-08 Edit Delay from Live Event to Amount of Time while a user waits
    Given Load the created E2E workflow case "REG-WF-E2E-08"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Wait for E2E users "1" to enter the workflow Delay node
    Then Add E2E user 2 to the case audience and update it
    Then Edit the E2E workflow Delay to wait 15 minutes only
    Then Publish the E2E workflow changes and verify the Delay node id is unchanged
    Then Wait for E2E users "2" to enter the workflow Delay node
    Then Verify E2E users "1" were enrolled only once
    Then Upload a Successful Deposit event for workflow E2E user 2
    Then Verify E2E users "2" stay in the workflow Delay node for 10 minutes
    Then Wait for E2E users "2" to reach the workflow Exit node
    Then Verify E2E users "2" left the workflow Delay node after their own 15 minutes
    Then Verify E2E users "1" stay in the workflow Delay node for 10 minutes
    Then Upload a Successful Deposit event for workflow E2E user 1
    Then Wait for E2E users "1,2" to reach the workflow Exit node
    Then Verify the deposit released E2E user 1 from the workflow Delay node
    Then Verify E2E users "1,2" passed the workflow Action node exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Delete the E2E case audience
    Then Verify the workflow report node customer lists and Logs recorded the users

  @WorkflowE2E @E2E-Verify @REG-WF-E2E-09-VERIFY
  Scenario: Verify - WF-09 Original and duplicated workflow release the same user independently
    Given Load the created E2E workflow case "REG-WF-E2E-09"
    And I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Verify the original and duplicated E2E workflows have different Delay node ids
    Then Wait for E2E users "1" to enter the Delay node of both E2E workflows
    Then Upload a Successful Deposit event for workflow E2E user 1
    Then Wait for E2E users "1" to reach the Exit node of both E2E workflows
    Then Verify the deposit released E2E user 1 from the Delay node of both E2E workflows
    Then Verify E2E users "1" passed the Action node of both E2E workflows exactly once
    Then Capture the workflow report node customer lists and Logs
    Then Mark the E2E workflow case as passed
    Then Set the E2E workflow inactive and delete it
    Then Verify the workflow report node customer lists and Logs recorded the users


  # ─────────────────────────────────────────────
  # CLEANUP (run by scripts/workflow-e2e-batches.js after all batches)
  # ─────────────────────────────────────────────

  @WorkflowE2E-Cleanup
  Scenario: Cleanup - delete the workflows and audiences this run left behind
    Given I log in for module "Workflow"
    Then I close the announcement popup if it appears
    Then Delete the workflow E2E data created since the run started
