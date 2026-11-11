// update-readme-images — automated V&V test suite.
//
//   node plugins/update-readme-images/test/run.js
//
// Verifies:
//   1. GNOX workspace_root:subdir:... style-guide resolution and inheritance
//   2. Standard glob (*, **, ?, {a,b}) rule matching and placeholder expansion
//   3. ImageMagick oval inset window generation (--make-oval-inset) with PNG32
//      alpha == 0 in all four exterior corners and alpha == 1 in center
//   4. Automatic og-social-image discovery & generation across subdirs with
//      assets/images (--sync-og-images), config opt-out, and graceful degradation
//      when magick & mise are unavailable
//   5. Non-destructive draft staging in assets/drafts/ whenever a target image
//      already exists, refusal to promote without --approved-by, and atomic
//      promotion + approval logging once user approval is supplied
//   6. Full repository audit of gnomatix-oss-skills itself (--audit --verify-images)

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const CLI_SCRIPT = path.join(
  REPO_ROOT,
  'plugins',
  'update-readme-images',
  'skills',
  'update-readme-images',
  'scripts',
  'update-readme-images.mjs'
);

let failures = 0;

function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures += 1;
}

function runCli(args, extraEnv = {}) {
  const r = spawnSync(process.execPath, [CLI_SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    env: Object.assign({}, process.env, extraEnv)
  });
  return {
    status: r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
    error: r.error
  };
}

function runMagick(args) {
  const r = spawnSync('magick', args, { encoding: 'utf8', shell: false, windowsHide: true });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`magick ${args.join(' ')} exited ${r.status}: ${r.stderr}`);
  return (r.stdout || '').trim();
}

// 1. Test workspace_root:subdir:... namespace inheritance & glob rule resolution on PEP README
{
  const res = runCli(['--resolve', 'plugins/python-elimination-program/README.md', '--json']);
  check(res.status === 0, '--resolve plugins/python-elimination-program/README.md exits 0');
  const data = JSON.parse(res.stdout);
  check(
    data.namespace === 'gnomatix-oss-skills:plugins:python-elimination-program',
    'namespace resolves to gnomatix-oss-skills:plugins:python-elimination-program'
  );
  check(
    Array.isArray(data.effective.style_docs) &&
      data.effective.style_docs.length === 2 &&
      data.effective.style_docs[0].endsWith('gnomatix-oss-skills.md') &&
      data.effective.style_docs[1].endsWith('python-elimination-program.md'),
    'inherits root style guide and layers python-elimination-program style guide'
  );
  const ruleIds = data.matched_rules.map((r) => r.id);
  check(
    ruleIds.includes('plugin-readme-top-panel') && ruleIds.includes('pep-readme-subpanel-and-oval-inset'),
    'glob rules match both plugins/*/README.md and plugins/python-elimination-program/README.md'
  );
}

// 2. Test end-user repo scaffolding, oval inset window, automatic og-social-image, and non-destructive draft staging
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-readme-images-test-'));
try {
  // 2a. Init a fresh end-user repository
  const userRepo = path.join(tmpDir, 'acme-widgets');
  fs.mkdirSync(userRepo, { recursive: true });
  const initRes = runCli(['--init', userRepo, '--workspace-root', 'acme-widgets', '--json']);
  check(initRes.status === 0, '--init scaffolds end-user repo config and docs');
  check(
    fs.existsSync(path.join(userRepo, '.claude', 'readme-images.json')),
    'created .claude/readme-images.json in end-user repo'
  );

  // 2b. Create a new oval inset PNG (target does not exist yet -> written directly to assets/images)
  const samplePortrait = path.join(tmpDir, 'portrait-src.png');
  const ovalOut = path.join(userRepo, 'assets', 'images', 'founder-oval.png');
  runMagick(['-size', '600x700', 'plasma:steelblue-gold', samplePortrait]);

  const ovalRes = runCli([
    '--repo',
    userRepo,
    '--make-oval-inset',
    samplePortrait,
    ovalOut,
    '--width',
    '400',
    '--height',
    '480',
    '--outer-color',
    '#0B1F4A',
    '--inner-color',
    '#D4AF37',
    '--json'
  ]);
  check(ovalRes.status === 0, '--make-oval-inset creates framed PNG32 oval inset window');
  const ovalInfo = JSON.parse(ovalRes.stdout);
  check(
    ovalInfo.staged_as_draft === false &&
      ovalInfo.format === 'PNG' &&
      ovalInfo.width === 400 &&
      ovalInfo.height === 480 &&
      ovalInfo.corners_transparent === true &&
      ovalInfo.alpha.tl === 0 &&
      ovalInfo.alpha.tr === 0 &&
      ovalInfo.alpha.bl === 0 &&
      ovalInfo.alpha.br === 0 &&
      ovalInfo.alpha.center === 1,
    'oval inset PNG has 100% transparent exterior corners (alpha=0) and opaque center (alpha=1)'
  );

  // 2c. Re-run --make-oval-inset when founder-oval.png ALREADY EXISTS -> must NOT overwrite; must stage in assets/drafts!
  const originalOvalBytes = fs.readFileSync(ovalOut);
  const samplePortraitV2 = path.join(tmpDir, 'portrait-src-v2.png');
  runMagick(['-size', '600x700', 'xc:firebrick', samplePortraitV2]);

  const ovalDraftRes = runCli([
    '--repo',
    userRepo,
    '--make-oval-inset',
    samplePortraitV2,
    ovalOut,
    '--width',
    '400',
    '--height',
    '480',
    '--json'
  ]);
  check(ovalDraftRes.status === 0, 're-running --make-oval-inset on existing image exits 0 via draft staging');
  const ovalDraftInfo = JSON.parse(ovalDraftRes.stdout);
  const afterAttemptBytes = fs.readFileSync(ovalOut);
  const stagedOvalPath = path.join(userRepo, 'assets', 'drafts', 'founder-oval.png');
  const stagedProposalPath = path.join(userRepo, 'assets', 'drafts', 'founder-oval.proposal.json');
  check(
    ovalDraftInfo.staged_as_draft === true &&
      Buffer.compare(originalOvalBytes, afterAttemptBytes) === 0 &&
      fs.existsSync(stagedOvalPath) &&
      fs.existsSync(stagedProposalPath),
    'existing image in assets/images was NOT replaced; candidate + .proposal.json were staged in assets/drafts'
  );

  // Verify proposal uses GNOX [NS]{@user} inaudible callout
  const proposalObj = JSON.parse(fs.readFileSync(stagedProposalPath, 'utf8'));
  check(
    proposalObj.status === 'pending_user_approval' &&
      proposalObj.asynchronous_workflow.inaudible_callout.startsWith('[acme-widgets:assets:images]{@user}'),
    'proposal manifest records pending_user_approval status and GNOX [NS]{@user} inaudible callout'
  );

  // 2d. Verify --promote-draft refuses without --approved-by, and succeeds with --approved-by
  const rejectPromote = runCli(['--repo', userRepo, '--promote-draft', 'assets/drafts/founder-oval.png']);
  check(rejectPromote.status === 2, '--promote-draft refuses promotion when --approved-by is missing');

  const okPromote = runCli([
    '--repo',
    userRepo,
    '--promote-draft',
    'assets/drafts/founder-oval.png',
    '--approved-by',
    'Approved — promote updated oval portrait',
    '--json'
  ]);
  check(okPromote.status === 0, '--promote-draft promotes staged draft once --approved-by is provided');
  const promotedBytes = fs.readFileSync(ovalOut);
  check(
    Buffer.compare(originalOvalBytes, promotedBytes) !== 0 &&
      !fs.existsSync(stagedOvalPath) &&
      fs.existsSync(path.join(userRepo, '.claude', 'readme-image-approvals', 'log.jsonl')),
    'live image updated, draft cleaned up, and approval recorded in .claude/readme-image-approvals/log.jsonl'
  );

  // 2e. Automatic og-social-image across root + subdir assets/images + opt-out + graceful missing-tool degradation
  const rootBanner = path.join(userRepo, 'assets', 'images', 'acme-widgets-banner.jpg');
  const pkgSubdirBanner = path.join(userRepo, 'packages', 'alpha', 'assets', 'images', 'alpha-banner.jpg');
  const optOutBanner = path.join(userRepo, 'packages', 'opted-out', 'assets', 'images', 'opted-out-banner.jpg');
  fs.mkdirSync(path.dirname(pkgSubdirBanner), { recursive: true });
  fs.mkdirSync(path.dirname(optOutBanner), { recursive: true });
  runMagick(['-size', '1376x768', 'plasma:navy-gold', rootBanner]);
  runMagick(['-size', '1376x768', 'plasma:teal-orange', pkgSubdirBanner]);
  runMagick(['-size', '1376x768', 'plasma:purple-gold', optOutBanner]);

  // Configure namespace opt-out for acme-widgets:packages:opted-out
  const userCfgPath = path.join(userRepo, '.claude', 'readme-images.json');
  const userCfg = JSON.parse(fs.readFileSync(userCfgPath, 'utf8'));
  userCfg.style_guides['acme-widgets:packages:opted-out'] = {
    doc: 'docs/readme-images/style-guides/default.md',
    og_social_image: false
  };
  fs.writeFileSync(userCfgPath, JSON.stringify(userCfg, null, 2) + '\n', 'utf8');

  // Test graceful degradation when magick & mise are unavailable
  const noToolSync = runCli(['--repo', userRepo, '--sync-og-images', '--json'], {
    UPDATE_README_IMAGES_FORCE_NO_MAGICK: '1'
  });
  check(
    noToolSync.status === 0 && JSON.parse(noToolSync.stdout).status === 'skipped_missing_tool',
    '--sync-og-images degrades gracefully (skipped_missing_tool, exit 0) when magick and mise are unavailable'
  );

  // Run real --sync-og-images with ImageMagick
  const ogSync = runCli(['--repo', userRepo, '--sync-og-images', '--json']);
  check(ogSync.status === 0, '--sync-og-images succeeds across root and subdirectory assets/images');
  const ogSyncData = JSON.parse(ogSync.stdout);
  check(
    ogSyncData.created === 2 &&
      fs.existsSync(path.join(userRepo, 'assets', 'images', 'acme-widgets-og-image.jpg')) &&
      fs.existsSync(path.join(userRepo, 'packages', 'alpha', 'assets', 'images', 'alpha-og-image.jpg')) &&
      !fs.existsSync(path.join(userRepo, 'packages', 'opted-out', 'assets', 'images', 'opted-out-og-image.jpg')),
    'generated 1280x640 OG images in root and packages/alpha assets/images while respecting opted-out namespace'
  );

  // Test --sync-og-images --regenerate stages drafts instead of overwriting existing OG images
  const regenSync = runCli(['--repo', userRepo, '--sync-og-images', '--regenerate', '--json']);
  const regenData = JSON.parse(regenSync.stdout);
  check(
    regenSync.status === 0 &&
      regenData.staged_drafts === 2 &&
      fs.existsSync(path.join(userRepo, 'assets', 'drafts', 'acme-widgets-og-image.jpg')),
    '--sync-og-images --regenerate stages candidate OG images into assets/drafts without overwriting existing ones'
  );

  // 2f. Test --apply inserting top-level-panel into end-user README.md
  const userReadme = path.join(userRepo, 'README.md');
  fs.writeFileSync(userReadme, '# acme-widgets\n\nA sample project.\n', 'utf8');
  const applyRes = runCli(['--apply', 'README.md', '--repo', userRepo, '--json']);
  check(applyRes.status === 0, '--apply README.md in end-user repo exits 0');
  const updatedMd = fs.readFileSync(userReadme, 'utf8');
  check(
    updatedMd.includes('![acme-widgets](assets/images/acme-widgets-banner.jpg)'),
    '--apply inserts top-level banner immediately after H1'
  );
} catch (err) {
  check(false, `temp repo / draft / OG test threw error: ${err.message}`);
} finally {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// 3. Full audit of gnomatix-oss-skills itself (all 23 plugins, companion OG images, sub-panels, and Old Willy oval inset)
{
  const auditRes = runCli(['--audit', '--verify-images', '--json']);
  check(auditRes.status === 0, 'full gnomatix-oss-skills --audit --verify-images exits 0');
  if (auditRes.stdout) {
    const report = JSON.parse(auditRes.stdout);
    check(
      report.passed === true && report.failures === 0 && report.panels_checked >= 32,
      `all ${report.panels_checked} configured panels across ${report.files_checked} files in gnomatix-oss-skills passed verification`
    );
  }
}

console.log(failures === 0 ? 'all passed' : `${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
