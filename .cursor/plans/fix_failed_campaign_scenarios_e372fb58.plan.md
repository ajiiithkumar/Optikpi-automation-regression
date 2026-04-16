---
name: Fix Failed Campaign Scenarios
overview: Fix the 22 failed campaign scenarios which fall into 5 distinct failure categories — audience selection (stale data), draft tab selector, clear filter selector, missing campaign name state, and pagination data dependency.
todos:
  - id: fix-campaign-name-fallback
    content: "Category 3: Fix 'Enter the Campaign Name in the search bar' to fallback to names.json when currentCampaignName is not set (TC-CAMP-18/19/20/24/25)"
    status: pending
  - id: fix-audience-selection
    content: "Category 1: Improve selectAudienceByName with better wait/error and document test data dependency (TC-CAMP-05 through TC-CAMP-13, TC-CAMP-17)"
    status: cancelled
  - id: fix-draft-tab-nav
    content: "Category 2: Fix Draft tab navigation after save-as-draft in TC-CAMP-16"
    status: pending
  - id: fix-clear-filter-xpath
    content: "Category 4: Use Browser agent to find correct Clear Filter selector and update clearFilterBtn (TC-CAMP-23)"
    status: pending
  - id: fix-pagination-xpath
    content: "Category 5: Use Browser agent to find correct pagination selectors and update nextPageBtn/prevPageBtn (TC-CAMP-21)"
    status: pending
isProject: false
---

# Fix Failed Campaign Scenarios

## Results Summary

- **4 passed**: TC-CAMP-01, TC-CAMP-02, TC-CAMP-03, TC-CAMP-03b
- **22 failed**: grouped into 4 active categories + 1 skipped (see note below)
- **Skipped (deferred)**: TC-CAMP-05 through TC-CAMP-13, TC-CAMP-17 — stale audience data; run `@TestPreparation` with valid credentials in [data/users-config/users.json](data/users-config/users.json) first

---

> **Note — Skipped categories (TC-CAMP-05 through TC-CAMP-13, TC-CAMP-17):** These fail because the audience referenced in `data/names.json` (`existingAudience` key) is stale. Before running these scenarios, ensure credentials in [data/users-config/users.json](data/users-config/users.json) are valid and run the `@TestPreparation` scenario first to create a fresh published audience.

---

## Failure Category 2: "Click the Draft tab" — 1 scenario

**Affected**: TC-CAMP-16

**Error**:
```
locator.waitFor: Timeout 20000ms exceeded.
waiting for locator('//button[@data-test-id='campaign-tab-draft']').first() to be visible
```

**Root cause**: After "Save as Draft" the page navigates away from the campaign list (to a success/confirmation state). The draft tab button (`@data-test-id='campaign-tab-draft'`) is not visible because the user is not on the campaign list page.

**Fix**: Add a navigation back to the campaign list page before clicking the Draft tab. In [src/steps/campaign.steps.ts](src/steps/campaign.steps.ts) at the "Verify the campaign is saved as Draft successfully" step (line ~605), after confirming the save, navigate back to the Campaign list so the tab buttons are available. Alternatively, fix the `clickDraftTab` method in [src/pages/campaign.page.ts](src/pages/campaign.page.ts) to first ensure the campaign list page is loaded.

---

## Failure Category 3: "Enter the Campaign Name in the search bar" — currentCampaignName not set — 5 scenarios

**Affected**: TC-CAMP-18, TC-CAMP-19, TC-CAMP-20, TC-CAMP-24, TC-CAMP-25

**Error**:
```
Error: currentCampaignName is not set. Ensure "Enter the Campaign Name and Campaign Tag" step ran first.
```

**Root cause**: These scenarios (Edit Published, Duplicate, Delete, History Log, View Report) search for an existing campaign but **never create one first** — they rely on a campaign already existing. The step `Enter the Campaign Name in the search bar` reads `this['currentCampaignName']` which is only set by the creation step. These scenarios need to read the campaign name from `data/names.json` instead.

**Fix**: In [src/steps/campaign.steps.ts](src/steps/campaign.steps.ts) at the "Enter the Campaign Name in the search bar" step (line ~612), fall back to reading from `names.json` (`campaign.title`) when `this['currentCampaignName']` is not set:

```typescript
const campaignName = this['currentCampaignName'] || (await readNameJson())?.campaign?.title;
if (!campaignName) throw new Error('...');
this['currentCampaignName'] = campaignName;
```

---

## Failure Category 4: "Click the Clear Filter button" — 1 scenario

**Affected**: TC-CAMP-23

**Error**:
```
locator.waitFor: Timeout 20000ms exceeded.
waiting for locator('//button[contains(@data-testid,'clear-filter') or contains(normalize-space(),'Clear')]')
```

**Root cause**: The `clearFilterBtn` selector `//button[contains(@data-testid,'clear-filter') or contains(normalize-space(),'Clear')]` does not match any element. The "Clear" text/testid in the actual UI is different.

**Fix**: Use the Browser agent to inspect the actual clear filter element on the campaign page and update the `clearFilterBtn` selector in [src/pages/campaign.page.ts](src/pages/campaign.page.ts) (line ~109 in the `sel` object).

---

## Failure Category 5: "Campaign list does not have multiple pages" — 1 scenario

**Affected**: TC-CAMP-21

**Error**:
```
Error: Campaign list does not have multiple pages
```

**Root cause**: The `hasMultiplePages` method checks for a next-page button using selector `//button[contains(@data-testid,'next-page') or contains(@aria-label,'Next') or contains(normalize-space(),'>')]`. Either the pagination button doesn't match, or there genuinely aren't enough campaigns to paginate.

**Fix**: Use the Browser agent to inspect the actual pagination controls and update the `nextPageBtn` / `prevPageBtn` selectors in [src/pages/campaign.page.ts](src/pages/campaign.page.ts) (lines ~103-104 in the `sel` object). If pagination truly requires more data, this scenario may need a precondition.

---

## Execution Order

1. **Category 3** — `currentCampaignName` fallback (quickest, code-only)
2. **Category 2** — Draft tab navigation after save-as-draft
3. **Category 4** — Clear Filter selector (requires Browser agent)
4. **Category 5** — Pagination selector (requires Browser agent)
