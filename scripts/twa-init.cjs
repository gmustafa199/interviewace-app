/* Non-interactive TWA project generation (bypasses bubblewrap init's interactive prompts).
 * Replicates: TwaManifest.fromFile -> saveToFile -> TwaGenerator.createTwaProject -> checksum file.
 */
const path = require('path');

const BW_CORE = '/home/z/.npm-global/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist';
const { TwaManifest, TwaGenerator, BufferedLog, ConsoleLog } = require(path.join(BW_CORE, 'index.js'));
const SHARED = '/home/z/.npm-global/lib/node_modules/@bubblewrap/cli/dist/lib/cmds/shared.js';

const TARGET_DIR = '/home/z/my-project/twa';

async function main() {
  const manifestFile = path.join(TARGET_DIR, 'twa-manifest.json');

  // 1. Load and validate TWA manifest from local file
  let twaManifest = await TwaManifest.fromFile(manifestFile);
  console.log('Loaded TWA manifest:', twaManifest.packageId, '@', twaManifest.host);

  // 2. Resolve signing key path relative to target directory (resolve() is idempotent-safe)
  twaManifest.signingKey.path = path.resolve(TARGET_DIR, twaManifest.signingKey.path);
  console.log('Signing key:', twaManifest.signingKey.path);

  // 3. Save manifest back (normalizes fields)
  await twaManifest.saveToFile(manifestFile);

  // 4. Generate the Android/Gradle project (downloads chosen icons, creates app skeleton)
  const twaGenerator = new TwaGenerator();
  const log = new BufferedLog(new ConsoleLog('Generating TWA'));
  let step = 0;
  await twaGenerator.createTwaProject(TARGET_DIR, twaManifest, log, (cur, total) => {
    const pct = Math.round((cur / total) * 100);
    if (pct >= step + 25) { step = pct; console.log('  progress:', pct + '%'); }
  });
  log.flush();
  console.log('Android project generated.');

  // 5. Write checksum file so `bubblewrap build` never prompts to update the project
  const { generateManifestChecksumFile } = require(SHARED);
  await generateManifestChecksumFile(manifestFile, TARGET_DIR);
  console.log('Checksum file written.');

  console.log('TWA_PROJECT_GENERATED_OK');
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
