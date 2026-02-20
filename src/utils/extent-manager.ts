
import path from 'path';
import fs from 'fs';

// Note: In a parallel execution environment (Cucumber + Worker processes), 
// this class in the worker process basically acts as a configuration holder 
// or lightweight helper. The actual "Writing" of the HTML report often happens 
// in the main process via the formatter or if using a shared file system approach.
//
// However, sticking to the requested structure:

export class ExtentManager {
    private static reportFileName: string = "Test-Automation-Report.html";
    private static fileSeparator: string = path.sep;
    private static reportFilepath: string = path.join(process.cwd(), "reports", "extent");
    private static timestamp: string = new Date().toISOString().replace(/[:.]/g, '-');
    private static reportFileLocation: string = path.join(ExtentManager.reportFilepath, ExtentManager.getReportFileName());

    // In JS/TS, we don't hold the 'ExtentReports' instance in quite the same way 
    // because cucumber-js-extent handles the actual report generation via the Formatter.
    // But we can expose methods to get paths/config.

    public static getReportFileName(): string {
        return `Freebet End to End Automation Report_${ExtentManager.timestamp}.html`;
    }

    public static getReportTitle(): string {
        const dateFormat = new Date().toLocaleDateString('en-GB').replace(/\//g, '_');
        return `Freebet End to End Automation Report ${dateFormat}`;
    }

    public static getReportLocation(): string {
        return this.reportFileLocation;
    }

    public static ensureReportDirectory(): void {
        if (!fs.existsSync(this.reportFilepath)) {
            fs.mkdirSync(this.reportFilepath, { recursive: true });
        }
    }
}
