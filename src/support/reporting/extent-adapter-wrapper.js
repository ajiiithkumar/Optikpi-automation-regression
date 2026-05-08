
// Plain JS version of extent-adapter-wrapper — used as the Cucumber formatter.
// Cucumber loads formatters via ESM import() which cannot handle .ts files without ts-node.
// This .js file is identical in logic but has all TypeScript-specific syntax removed.

const { Formatter, formatterHelpers } = require('@cucumber/cucumber');
const ExtentTest = require('cucumber-js-extent/extent/report/extent_test.js');
const ExtentReport = require('cucumber-js-extent/extent/report/extent_report.js');
const NunjuckRender = require('cucumber-js-extent/extent/view/nunjuck_render.js');
const {
    updateTestTimesAndStatus,
    convertStatus,
    compareStatus
} = require('cucumber-js-extent/extent/report/status_times_util.js');

const { ExtentManager } = require('../../utils/extent-manager');

module.exports = class ExtentCucumberJSAdapterWrapper extends Formatter {
    constructor(options) {
        super(options);

        this.testRunStartTimestamp = null;
        this.testCaseStartIdToTestCaseId = new Map();
        this.testCaseIdToTiming = new Map();
        this.testRunFinishTimestamp = null;
        this.attachmentsByTestStep = new Map();

        ExtentManager.ensureReportDirectory();

        options.eventBroadcaster.on('envelope', (envelope) => {
            if (envelope.testRunStarted) this.testRunStarted(envelope);
            if (envelope.testCaseStarted) this.testCaseStarted(envelope);
            if (envelope.attachment) this.handleAttachment(envelope);
            if (envelope.testCaseFinished) this.testCaseFinished(envelope);
            if (envelope.testRunFinished) this.testRunFinished(envelope);
        });
    }

    testRunStarted(envelope) {
        this.testRunStartTimestamp = envelope.testRunStarted.timestamp;
        this.testCaseStartIdToTestCaseId = new Map();
        this.testCaseIdToTiming = new Map();
        this.attachmentsByTestStep = new Map();
    }

    testCaseStarted(envelope) {
        const testCaseStarted = envelope.testCaseStarted;
        this.testCaseStartIdToTestCaseId.set(
            testCaseStarted.id,
            testCaseStarted.testCaseId
        );
        this.testCaseIdToTiming.set(testCaseStarted.testCaseId, {
            start: testCaseStarted.timestamp
        });
    }

    handleAttachment(envelope) {
        const attachment = envelope.attachment;
        if (!attachment) return;
        const testStepId = attachment.testStepId;
        if (!testStepId) return;
        const normalized = this.normalizeAttachment(attachment);
        if (!this.attachmentsByTestStep.has(testStepId)) {
            this.attachmentsByTestStep.set(testStepId, []);
        }
        this.attachmentsByTestStep.get(testStepId).push(normalized);
    }

    testCaseFinished(envelope) {
        const testCaseFinished = envelope.testCaseFinished;
        const testCaseId = this.testCaseStartIdToTestCaseId.get(
            testCaseFinished.testCaseStartedId
        );
        if (testCaseId) {
            const timing = this.testCaseIdToTiming.get(testCaseId);
            if (timing) timing.end = testCaseFinished.timestamp;
        }
    }

    testRunFinished(envelope) {
        this.testRunFinishTimestamp = envelope.testRunFinished.timestamp;

        const featureExtentTests = [];
        const featureUriToTest = new Map();
        const scenariOutlineIdToTest = new Map();

        this.eventDataCollector
            .getTestCaseAttempts()
            .filter((t) => !t.attempt)
            .forEach((testCaseAttempt) => {
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

                const scenarioTest = new ExtentTest('Scenario', pickle.name, '');
                scenarioTest.addTimeStamp(
                    this.testCaseIdToTiming.get(testCaseAttempt.testCase.id)
                );

                pickle.tags.forEach((t) => {
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

                let lastRealStepTest = null;

                parsed.testSteps.forEach((testStep, idx) => {
                    const stepStatus = convertStatus(testStep.result.status);
                    scenarioTest.status = compareStatus(scenarioTest.status, stepStatus);

                    const isHookStep = !testStep.text;

                    const rawTestStep = testCaseAttempt.testCase && testCaseAttempt.testCase.testSteps
                        ? testCaseAttempt.testCase.testSteps[idx]
                        : null;
                    const rawTestStepId = rawTestStep ? rawTestStep.id : null;
                    const trackedAttachments = rawTestStepId
                        ? (this.attachmentsByTestStep.get(rawTestStepId) || [])
                        : [];
                    const stepAttachments = trackedAttachments.length
                        ? trackedAttachments
                        : this.normalizeAttachments(testStep.attachments || []);

                    if (isHookStep) {
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

        const extentReport = new ExtentReport(featureExtentTests, {
            start: this.testRunStartTimestamp,
            end: this.testRunFinishTimestamp
        });

        const rep = new NunjuckRender().render(extentReport);
        this.log(rep);
    }

    normalizeAttachment(attachment) {
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

    normalizeAttachments(attachments) {
        return (attachments || []).map((attachment) => this.normalizeAttachment(attachment));
    }

    processAttachments(attachments, targetTest) {
        if (!attachments || attachments.length === 0) return;
        const normalized = this.normalizeAttachments(attachments);
        if (normalized.length === 0) return;
        targetTest.addLogs(normalized);
    }
};
