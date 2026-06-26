const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('error') || text.includes('Error')) {
      console.log(`[BROWSER CONSOLE ERROR] ${msg.type().toUpperCase()}: ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER ERROR] ${err.toString()}`);
  });

  const artifactDir = 'C:\\Users\\mdsaq\\.gemini\\antigravity-ide\\brain\\3382367b-ed21-4191-9650-b72143121782';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  try {
    console.log('Navigating to http://localhost:5180/...');
    await page.goto('http://localhost:5180/', { waitUntil: 'networkidle0' });
    console.log('Page loaded. Waiting for presets button...');
    await page.waitForSelector('#btn-presets', { timeout: 5000 });
    console.log('Presets button loaded.');

    const presets = [
      { key: 'dijkstra_trap', name: 'Dijkstra Greedy Trap' },
      { key: 'bellman_cycle', name: 'Bellman-Ford Cycle' },
      { key: 'floyd_warshall', name: 'Floyd-Warshall 5-Node' },
      { key: 'mst_forest', name: 'MST Spanning Forest' },
      { key: 'topo_dag', name: 'Topological Sort DAG' },
      { key: 'kosaraju_scc', name: 'Kosaraju SCC Graph' },
      { key: 'bipartite_grid', name: 'Bipartite Grid' },
      { key: 'non_bipartite', name: 'Non-Bipartite Cycle' },
      { key: 'tarjan_dumbbell', name: 'Tarjan Dumbbell' }
    ];

    for (const preset of presets) {
      console.log(`\n--- Loading Preset: ${preset.name} ---`);
      
      // Open presets dropdown
      const btnPresets = await page.$('#btn-presets');
      if (!btnPresets) {
        console.log('Could not find #btn-presets');
        break;
      }
      await btnPresets.click();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Find and click the specific preset
      const presetButtons = await page.$$('button');
      let targetBtn = null;
      for (const btn of presetButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes(preset.name)) {
          targetBtn = btn;
          break;
        }
      }

      if (targetBtn) {
        await targetBtn.click();
        console.log(`Preset "${preset.name}" loaded.`);
        await new Promise(resolve => setTimeout(resolve, 600));

        // Save screenshot
        const screenshotPath = path.join(artifactDir, `preset_${preset.key}.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`Saved screenshot to: ${screenshotPath}`);
      } else {
        console.log(`Could not find button for preset: ${preset.name}`);
      }
    }

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
})();
