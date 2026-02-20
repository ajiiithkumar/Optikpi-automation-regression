const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const reportPath = path.join(process.cwd(), 'reports', 'extent', 'OptiKPI_V2.0_Smoke_Test.html');
if (!fs.existsSync(reportPath)) {
  console.error('Extent report not found. Run tests first: npm test');
  process.exit(1);
}

const isWin = process.platform === 'win32';
if (isWin) {
  execSync(`start "" "${reportPath}"`, { stdio: 'inherit', shell: true });
} else if (process.platform === 'darwin') {
  execSync(`open "${reportPath}"`, { stdio: 'inherit' });
} else {
  execSync(`xdg-open "${reportPath}"`, { stdio: 'inherit' });
}
