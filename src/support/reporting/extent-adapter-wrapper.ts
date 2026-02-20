
// Wrapper for the existing Extent Adapter logic, adapted for TS.
// We are re-implementing the logic from src/support/extent_adapter.js to be TS compatible.

const { Formatter, formatterHelpers } = require('@cucumber/cucumber');
const messages = require('@cucumber/messages');
// @ts-ignore
const ExtentTest = require('cucumber-js-extent/extent/report/extent_test.js');
// @ts-ignore
const ExtentReport = require('cucumber-js-extent/extent/report/extent_report.js');
// @ts-ignore
const NunjuckRender = require('cucumber-js-extent/extent/view/nunjuck_render.js');
// @ts-ignore
const {
    updateTestTimesAndStatus,
    convertStatus,
    compareStatus
} = require('cucumber-js-extent/extent/report/status_times_util.js');

const { ExtentManager } = require('../../utils/extent-manager');
const path = require('path');

module.exports = class ExtentCucumberJSAdapterWrapper extends Formatter {
    private testRunStartTimestamp: any;
    private testCaseStartIdToTestCaseId: Map<string, string> = new Map();
    private testCaseIdToTiming: Map<string, any> = new Map();
    private testRunFinishTimestamp: any;
    private attachmentsByTestStep: Map<string, any[]> = new Map(); // Track attachments by test step

    constructor(options: any) {
        super(options);

        // Ensure report directory exists
        ExtentManager.ensureReportDirectory();

        options.eventBroadcaster.on('envelope', (envelope: any) => {
            if (envelope.testRunStarted) this.testRunStarted(envelope);
            if (envelope.testCaseStarted) this.testCaseStarted(envelope);
            if (envelope.attachment) this.handleAttachment(envelope);
            if (envelope.testCaseFinished) this.testCaseFinished(envelope);
            if (envelope.testRunFinished) this.testRunFinished(envelope);
        });
    }

    testRunStarted(envelope: any) {
        this.testRunStartTimestamp = envelope.testRunStarted!.timestamp;
        this.testCaseStartIdToTestCaseId = new Map();
        this.testCaseIdToTiming = new Map();
        this.attachmentsByTestStep = new Map();
    }

    testCaseStarted(envelope: any) {
        const testCaseStarted = envelope.testCaseStarted!;
        this.testCaseStartIdToTestCaseId.set(
            testCaseStarted.id,
            testCaseStarted.testCaseId
        );

        this.testCaseIdToTiming.set(testCaseStarted.testCaseId, {
            start: testCaseStarted.timestamp
        });
    }

    private handleAttachment(envelope: any) {
        const attachment = envelope.attachment;
        if (!attachment) return;

        const testStepId = attachment.testStepId;
        if (!testStepId) return;

        const normalized = this.normalizeAttachment(attachment);
        if (!this.attachmentsByTestStep.has(testStepId)) {
            this.attachmentsByTestStep.set(testStepId, []);
        }
        this.attachmentsByTestStep.get(testStepId)!.push(normalized);
    }

    testCaseFinished(envelope: any) {
        const testCaseFinished = envelope.testCaseFinished!;
        const testCaseId = this.testCaseStartIdToTestCaseId.get(
            testCaseFinished.testCaseStartedId
        );
        if (testCaseId) {
            const timing = this.testCaseIdToTiming.get(testCaseId);
            if (timing) timing.end = testCaseFinished.timestamp;
        }
    }

    testRunFinished(envelope: any) {
        this.testRunFinishTimestamp = envelope.testRunFinished!.timestamp;

        const featureExtentTests: any[] = [];
        const featureUriToTest = new Map<string, any>();
        const scenariOutlineIdToTest = new Map<string, any>();

        this.eventDataCollector
            .getTestCaseAttempts()
            .filter((t: any) => !t.attempt)
            .forEach((testCaseAttempt: any) => {
                const { gherkinDocument, pickle } = testCaseAttempt;
                const testCaseId = pickle.astNodeIds[0];
                const featureUri = gherkinDocument.uri;
                let featureTest = featureUriToTest.get(featureUri);

                if (!featureTest) {
                    const { feature } = gherkinDocument;
                    featureTest = new ExtentTest(
                        'Feature',
                        feature.name,
                        feature.description
                    );

                    featureUriToTest.set(featureUri, featureTest);
                    featureExtentTests.push(featureTest);
                }

                let scenarioTestParent = featureUriToTest.get(featureUri);
                const { GherkinDocumentParser: gherkinDocParser } = formatterHelpers;
                const scenarioMap = gherkinDocParser.getGherkinScenarioMap(gherkinDocument);
                const scenarioNode = scenarioMap[testCaseId];

                if (scenarioNode) {
                    const { id, name, description, examples } = scenarioNode;

                    if (examples && examples.length > 0) {
                        if (!scenariOutlineIdToTest.has(id)) {
                            const scenarioOutlineTest = new ExtentTest(
                                'Scenario Outline',
                                name,
                                description
                            );
                            featureTest.addChildTest(scenarioOutlineTest);
                            scenariOutlineIdToTest.set(id, scenarioOutlineTest);
                        }
                        scenarioTestParent = scenariOutlineIdToTest.get(id);
                    }
                }

                const scenarioTest = new ExtentTest(
                    'Scenario',
                    pickle.name,
                    ''
                );
                scenarioTest.addTimeStamp(
                    this.testCaseIdToTiming.get(testCaseAttempt.testCase.id)
                );

                pickle.tags.forEach((t: any) => {
                    scenarioTest.categories.push(t.name);
                    if (!featureTest.categories.includes(t.name))
                        featureTest.categories.push(t.name);
                });

                const rules = gherkinDocParser.getGherkinExampleRuleMap(gherkinDocument);
                if (Object.prototype.hasOwnProperty.call(rules, testCaseId)) {
                    const { name } = rules[testCaseId];
                    scenarioTest.addRule(name);
                }

                scenarioTestParent.addChildTest(scenarioTest);

                const parsed = formatterHelpers.parseTestCaseAttempt({
                    snippetBuilder: this.snippetBuilder,
                    supportCodeLibrary: this.supportCodeLibrary,
                    testCaseAttempt
                });

                let lastRealStepTest: any = null;

                parsed.testSteps.forEach((testStep: any, idx: number) => {
                    const stepStatus = convertStatus(testStep.result.status);
                    scenarioTest.status = compareStatus(scenarioTest.status, stepStatus);

                    const isHookStep = !testStep.text; // Simplistic check (real check involves source location)

                    const rawTestStep = testCaseAttempt.testCase?.testSteps?.[idx];
                    const rawTestStepId = rawTestStep?.id;
                    const trackedAttachments = rawTestStepId
                        ? (this.attachmentsByTestStep.get(rawTestStepId) || [])
                        : [];
                    const stepAttachments = trackedAttachments.length
                        ? trackedAttachments
                        : this.normalizeAttachments(testStep.attachments || []);

                    if (isHookStep) {
                        // Handle attachments in hooks (Screenshots)
                        if (stepAttachments.length) {
                            const targetTest = lastRealStepTest || scenarioTest;
                            this.processAttachments(stepAttachments, targetTest);
                        }
                        if (
                            testStep.result &&
                            String(testStep.result.status || '').toUpperCase() === 'FAILED'
                        ) {
                            scenarioTest.addError(testStep.result);
                        }
                        return;
                    }

                    let desc = '';
                    if (testStep.actionLocation)
                        desc = testStep.actionLocation.uri + ':' + testStep.actionLocation.line;
                    else if (testStep.sourceLocation)
                        desc = testStep.sourceLocation.uri + ':' + testStep.sourceLocation.line;

                    const stepHookTest = new ExtentTest(
                        testStep.keyword,
                        testStep.text || desc,
                        desc
                    );

                    stepHookTest.status = stepStatus;
                    stepHookTest.addDuration(testStep.result.duration);
                    if (testStep.argument && testStep.argument.docString)
                        stepHookTest.addDocString(testStep.argument.docString.content);
                    if (testStep.argument && testStep.argument.dataTable)
                        stepHookTest.addDataTable(testStep.argument.dataTable.rows);

                    if (stepAttachments.length) {
                        this.processAttachments(stepAttachments, stepHookTest);
                    }

                    stepHookTest.addError(testStep.result);
                    scenarioTest.addChildTest(stepHookTest);
                    lastRealStepTest = stepHookTest;
                });

                updateTestTimesAndStatus(scenarioTest);
            });

        const reportName = 'Automation Test Report'; // Could make dynamic from ExtentManager

        // We can inject our ExtentManager.getReportLocation() here?
        // cucumber-js-extent's ExtentReport constructor doesn't seem to take path, 
        // it likely returns HTML string which we then log.
        // The previous adapter used `this.log(rep)`.

        // Check previous adapter:
        // const rep = new NunjuckRender().render(extentReport);
        // this.log(rep);

        const extentReport = new ExtentReport(featureExtentTests, {
            start: this.testRunStartTimestamp,
            end: this.testRunFinishTimestamp
        });

        const rep = new NunjuckRender().render(extentReport);
        this.log(rep);
    }

    private normalizeAttachment(attachment: any): any {
        if (!attachment || !attachment.mediaType) return attachment;
        const normalized = { ...attachment };
        if (!normalized.body && normalized.data) {
            normalized.body = normalized.data;
            delete normalized.data;
        }
        if (normalized.mediaType === 'base64:image/png') {
            normalized.mediaType = 'image/png';
        }
        return normalized;
    }

    private normalizeAttachments(attachments: any[]): any[] {
        return (attachments || []).map((attachment) => this.normalizeAttachment(attachment));
    }

    private processAttachments(attachments: any[], targetTest: any): void {
        if (!attachments || attachments.length === 0) return;
        const normalized = this.normalizeAttachments(attachments);
        if (normalized.length === 0) return;
        targetTest.addLogs(normalized);
    }
}
