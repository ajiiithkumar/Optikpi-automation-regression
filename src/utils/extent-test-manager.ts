
import { World } from '@cucumber/cucumber';
import { Buffer } from 'buffer';

// In a Cucumber-JS Parallel Worker environment, each worker process runs 
// one scenario at a time sequentially. 
// Therefore, we can safely store the current 'World' in a module-level variable.
// This allows "static" access from anywhere (Step Definitions, Pages) 
// without needing to pass the World object around or use AsyncLocalStorage.

// GLOBAL CONTEXT STORE
let currentWorld: World | undefined;

export class ExtentTestManager {

    /**
     * Set the current Cucumber World context.
     * Call this in the 'Before' hook.
     */
    public static setTest(world: World): void {
        currentWorld = world;
    }

    /**
     * Clear the test context.
     * Call this in the 'After' hook.
     */
    public static removeTest(): void {
        currentWorld = undefined;
    }

    /**
     * Get the current World object.
     */
    public static getTest(): World | undefined {
        return currentWorld;
    }

    /**
     * Log INFO message to the Extent Report
     */
    public static logInfo(message: string): void {
        const world = this.getTest();
        if (world) {
            world.log(`INFO: ${message}`);
        }
    }

    /**
     * Log PASS status.
     */
    public static logPass(message: string): void {
        const world = this.getTest();
        if (world) {
            world.log(`PASS: ${message}`);
        }
    }

    /**
     * Log FAIL status with optional screenshot.
     */
    public static async logFail(message: string, base64Screenshot?: string): Promise<void> {
        const world = this.getTest();
        if (world) {
            world.log(`FAIL: ${message}`);
            if (base64Screenshot) {
                try {
                    const buffer = Buffer.from(base64Screenshot, 'base64');
                    await world.attach(buffer, 'image/png');
                } catch {
                    // Ignore attach errors
                }
            }
        }
    }
}
