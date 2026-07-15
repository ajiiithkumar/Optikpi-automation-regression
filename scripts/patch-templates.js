const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'support', 'reporting', 'templates');
const destDir = path.join(__dirname, '..', 'node_modules', 'cucumber-js-extent', 'extent', 'view');

if (!fs.existsSync(srcDir) || !fs.existsSync(destDir)) {
    console.log('Skipping extent template patch (directories not found)');
    process.exit(0);
}

// Copy step_logs_macro
fs.copyFileSync(
    path.join(srcDir, 'step_logs_macro.njk'),
    path.join(destDir, 'macros', 'step_logs_macro.njk')
);

// Copy test_display_macro (for standard table layout)
fs.copyFileSync(
    path.join(srcDir, 'test_display_macro.njk'),
    path.join(destDir, 'macros', 'test_display_macro.njk')
);

// Copy spark.njk (for dark theme and removing bdd-report class)
fs.copyFileSync(
    path.join(srcDir, 'spark.njk'),
    path.join(destDir, 'spark.njk')
);

// Copy nunjuck_render.js (fixed duration filter — no humanize-duration crash)
fs.copyFileSync(
    path.join(srcDir, 'nunjuck_render.js'),
    path.join(destDir, 'nunjuck_render.js')
);

console.log('Successfully patched Extent Report templates for Standard Dark layout!');
