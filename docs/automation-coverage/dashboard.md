# Automation Coverage Dashboard

*Last generated: 2/9/2026, 2:45:39 pm*

## Module-Level Coverage

| Module | Total TCs | Automated | Coverage % |
|--------|-----------|-----------|------------|
| **Audience Module** | 20 | 20 | 100% |
| **Campaign module** | 25 | 25 | 100% |
| **Dashboard module** | 6 | 6 | 100% |
| **Settings module** | 1 | 1 | 100% |
| **Workflow module Test Cases** | 3 | 3 | 100% |
| **TOTAL** | **55** | **55** | **100%** |

## Test Case Detail

| Module | Tag | Priority | Status | Scenario |
|--------|-----|----------|--------|----------|
| Audience Module | `REG-AUD-02` | High | ✅ Automated | Publish Audience and verify it appears in the correct tab with Active status |
| Audience Module | `REG-AUD-03` | High | ✅ Automated | Create Audience with Customer Metric criteria |
| Audience Module | `REG-AUD-04` | High | ✅ Automated | Create Audience with Customer Engagement and Workflow attributes |
| Audience Module | `REG-AUD-05` | High | ✅ Automated | Create Audience with Part of Audience criteria |
| Audience Module | `REG-AUD-06` | High | ✅ Automated | AND condition validation within a single criteria group |
| Audience Module | `REG-AUD-07` | High | ✅ Automated | OR group validation across multiple criteria groups |
| Audience Module | `REG-AUD-08` | High | ✅ Automated | Save as Draft and reopen Audience persists criteria data |
| Audience Module | `REG-AUD-09` | High | ✅ Automated | Create Audience with Event and Occurrence criteria |
| Audience Module | `REG-AUD-10` | High | ✅ Automated | Edit a Published Audience and verify edit behaviour |
| Audience Module | `REG-AUD-11` | High | ✅ Automated | Duplicate an existing Audience and verify all fields are copied |
| Audience Module | `REG-AUD-12` | High | ✅ Automated | Preview count updates in real time when criteria are added or removed |
| Audience Module | `REG-AUD-13` | High | ✅ Automated | Saving an Audience with incomplete criteria shows a validation error |
| Audience Module | `REG-AUD-14` | Medium | ✅ Automated | Entering text in a numeric criteria field shows a validation message |
| Audience Module | `REG-AUD-15` | Medium | ✅ Automated | Navigation and UI consistency when switching tabs and views |
| Audience Module | `REG-AUD-16` | Medium | ✅ Automated | Action menu on Audience list shows all expected options |
| Audience Module | `REG-AUD-17` | Medium | ✅ Automated | Static Audience with is-not-empty User ID criteria |
| Audience Module | `REG-AUD-18` | Medium | ✅ Automated | Bulk Audience Customer List Download and CSV Retention Audience creation |
| Audience Module | `REG-AUD-19` | Medium | ✅ Automated | Create Campaign from Audience three-dot menu |
| Audience Module | `REG-AUD-20` | Medium | ✅ Automated | View History Log from Audience three-dot menu |
| Audience Module | `REG-AUD-20` | Medium | ✅ Automated | View Report icon opens Audience report page |
| Campaign module | `REG-CAMP-02` | High | ✅ Automated | Publish Campaign after completing all steps and verify it appears in Active tab |
| Campaign module | `REG-CAMP-03` | High | ✅ Automated | Edit Campaign name updates successfully |
| Campaign module | `REG-CAMP-03B` | High | ✅ Automated | Select Engagement goal Click and verify goal is saved correctly |
| Campaign module | `REG-CAMP-04` | High | ✅ Automated | Select Engagement goal Open and verify goal is saved correctly |
| Campaign module | `REG-CAMP-05` | High | ✅ Automated | Select Financial goal and verify goal is saved correctly |
| Campaign module | `REG-CAMP-06` | High | ✅ Automated | Select an Existing Audience and verify it is applied to the campaign |
| Campaign module | `REG-CAMP-07` | High | ✅ Automated | Set Control Group percentage and verify it is saved correctly |
| Campaign module | `REG-CAMP-08` | High | ✅ Automated | Set a Time-Based trigger and verify it is saved correctly |
| Campaign module | `REG-CAMP-10` | High | ✅ Automated | Set an Event-Based trigger with Login event and verify it is saved |
| Campaign module | `REG-CAMP-11` | High | ✅ Automated | Attempting to set trigger without configuring an event shows a validation error |
| Campaign module | `REG-CAMP-12` | High | ✅ Automated | Enable Re-enroll customers toggle and set days configuration |
| Campaign module | `REG-CAMP-13` | High | ✅ Automated | Add Library Communication content to campaign and verify it is applied |
| Campaign module | `REG-CAMP-14` | High | ✅ Automated | Add a second Variant to the campaign communication and verify both are visible |
| Campaign module | `REG-CAMP-15` | High | ✅ Automated | Set Static percentage allocation for A/B variants and verify it is saved |
| Campaign module | `REG-CAMP-16` | High | ✅ Automated | Set Criteria-Based allocation for variants and verify criteria is applied |
| Campaign module | `REG-CAMP-17` | Medium | ✅ Automated | Save Campaign as Draft preserves the goal setting on re-opening |
| Campaign module | `REG-CAMP-18` | High | ✅ Automated | Campaign page loads and all status tabs navigate successfully |
| Campaign module | `REG-CAMP-19` | High | ✅ Automated | Edit Published Campaign shows Audience and Trigger fields as restricted |
| Campaign module | `REG-CAMP-20` | High | ✅ Automated | Duplicate Campaign copies all settings and appears in Draft tab |
| Campaign module | `REG-CAMP-21` | Medium | ✅ Automated | Delete a Draft Campaign and verify it is removed from all tabs |
| Campaign module | `REG-CAMP-22` | Medium | ✅ Automated | Pagination loads correct campaign data on each page |
| Campaign module | `REG-CAMP-23` | High | ✅ Automated | Search Campaign by name returns correct results and clears correctly |
| Campaign module | `REG-CAMP-24` | High | ✅ Automated | Filter campaigns by status and verify only matching campaigns are shown |
| Campaign module | `REG-CAMP-25` | High | ✅ Automated | Campaign History Log displays correct activity entries with timestamps |
| Campaign module | `REG-CAMP-25` | High | ✅ Automated | View Campaign Report loads and displays key metrics correctly |
| Dashboard module | `REG-DASH-02` | High | ✅ Automated | Dashboard v2 tab navigation |
| Dashboard module | `REG-DASH-03` | High | ✅ Automated | Dashboard v2 global date range validation |
| Dashboard module | `REG-DASH-04` | High | ✅ Automated | Dashboard v2 custom date range persists across tabs |
| Dashboard module | `REG-DASH-05` | High | ✅ Automated | Dashboard v2 audience filter on Engagement tab |
| Dashboard module | `REG-DASH-06` | High | ✅ Automated | Dashboard v2 audience filter persists on Business Performance tab |
| Dashboard module | `REG-DASH-06` | High | ✅ Automated | Dashboard v2 reset audience filter |
| Settings module | `REG-SET-01` | Medium | ✅ Automated | Settings page loads successfully |
| Workflow module Test Cases | `REG-WORKFLOW-02` | High | ✅ Automated | Workflow page load |
| Workflow module Test Cases | `REG-WORKFLOW-03` | High | ✅ Automated | Workflow Activation with error validation |
| Workflow module Test Cases | `REG-WORKFLOW-03` | High | ✅ Automated | Workflow creation with Existing Audience enrollment and Delay node saved as Draft |
