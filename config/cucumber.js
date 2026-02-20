
// Centralized Parallel Configuration
const PARALLEL_THREAD_COUNT = process.env.PARALLEL_THREADS ? parseInt(process.env.PARALLEL_THREADS) : 1;
const EXTENT_REPORT_PATH = process.env.EXTENT_REPORT_PATH || 'reports/extent/OptiKPI_V2.0_Smoke_Test.html';

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: [
      'src/steps/**/*.ts',
      'src/support/**/*.ts',
      'src/utils/**/*.ts'
    ],
    format: [
      'progress',
      `./src/support/reporting/extent-adapter-wrapper.ts:${EXTENT_REPORT_PATH}`
    ],
    publishQuiet: true,
    parallel: PARALLEL_THREAD_COUNT,
    worldParameters: {
      headless: false
    }
  }
};
