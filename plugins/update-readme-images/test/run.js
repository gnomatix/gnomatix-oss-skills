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
  check(
    Boolean(
      data.configured_reference_documents &&
        data.configured_reference_documents.config &&
        data.configured_reference_documents.config.origin === 'project-specific' &&
        Array.isArray(data.configured_reference_documents.style_guide_docs) &&
        data.configured_reference_documents.style_guide_docs.length === 2
    ),
    '--resolve --json reports configured_reference_documents with project-specific origin'
  );
  const textRes = runCli(['--resolve', 'README.md']);
  check(
    textRes.status === 0 && textRes.stdout.includes('Configured Reference Documents:'),
    '--resolve human-readable output explicitly prints Configured Reference Documents block'
  );
}

// 1a. The bundled readme-images-default.json is overridden by readme-images-user.json in the
//     plugin's persistent data directory (CLAUDE_PLUGIN_DATA), created from the shipped skeleton
//     when missing, so user settings survive plugin updates.
{
  const bareRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'uri-bare-'));
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uri-data-'));
  const env = { CLAUDE_PLUGIN_DATA: dataDir, GNOX_DISABLE_PROJECT_VISUALS_AUTODISCOVER: '1' };
  try {
    const first = runCli(['--repo', bareRepo, '--resolve', 'README.md', '--json'], env);
    const userFile = path.join(dataDir, 'readme-images-user.json');
    check(
      first.status === 0 && fs.existsSync(userFile) && JSON.parse(fs.readFileSync(userFile, 'utf8')) &&
        JSON.parse(first.stdout).workspace_root === 'gnomatix-oss-skills',
      'with only the bundled config, readme-images-user.json is created in CLAUDE_PLUGIN_DATA from the shipped skeleton'
    );
    fs.writeFileSync(userFile, JSON.stringify({ workspace_root: 'from-user-data' }), 'utf8');
    const second = runCli(['--repo', bareRepo, '--resolve', 'README.md', '--json'], env);
    check(
      second.status === 0 && JSON.parse(second.stdout).workspace_root === 'from-user-data',
      'readme-images-user.json in CLAUDE_PLUGIN_DATA overrides the bundled readme-images-default.json'
    );
    check(
      fs.existsSync(path.join(path.dirname(CLI_SCRIPT), '..', '..', '..', 'config', 'readme-images-user.json')),
      'the plugin ships an empty readme-images-user.json skeleton beside readme-images-default.json'
    );
  } finally {
    fs.rmSync(bareRepo, { recursive: true, force: true });
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

// 1b. Test external-user fallback confirmation gate + .gnox/readme-images.json priority + author-release-readme.mjs
{
  const extTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'update-readme-images-ext-'));
  try {
    const extResFallback = runCli(['--repo', extTmp, '--resolve', 'README.md', '--json'], {
      UPDATE_README_IMAGES_ASSUME_EXTERNAL_USER: '1',
      GNOX_DISABLE_PROJECT_VISUALS_AUTODISCOVER: '1'
    });
    check(extResFallback.status === 0, '--resolve in unconfigured external repo falls back cleanly to bundled config');
    const extData = JSON.parse(extResFallback.stdout);
    check(
      extData.config_origin === 'gnomatix-oss-skills-fallback' &&
        extData.configured_reference_documents.external_fallback_gate.triggered === true &&
        extData.configured_reference_documents.external_fallback_gate.slash_command === '/gnox:local-config-wizard',
      'external non-GNOMATIX repo triggers confirmation_required gate and offers Interactive Design Mode (/gnox:local-config-wizard)'
    );

    // Add project-specific .gnox/readme-images.json -> must override fallback and clear gate
    fs.mkdirSync(path.join(extTmp, '.gnox'), { recursive: true });
    fs.writeFileSync(
      path.join(extTmp, '.gnox', 'readme-images.json'),
      JSON.stringify({
        version: 1,
        workspace_root: 'ext-custom',
        style_guides: {
          'ext-custom': {
            doc: '.gnox/style.md',
            summary: 'Custom project style'
          }
        },
        rules: []
      }),
      'utf8'
    );
    fs.writeFileSync(path.join(extTmp, '.gnox', 'style.md'), '# Custom Style\n', 'utf8');

    const extResProject = runCli(['--repo', extTmp, '--resolve', 'README.md', '--json'], {
      UPDATE_README_IMAGES_ASSUME_EXTERNAL_USER: '1',
      GNOX_DISABLE_PROJECT_VISUALS_AUTODISCOVER: '1'
    });
    const projData = JSON.parse(extResProject.stdout);
    check(
      projData.config_origin === 'project-specific' &&
        projData.workspace_root === 'ext-custom' &&
        projData.configured_reference_documents.external_fallback_gate.triggered === false,
      '.gnox/readme-images.json takes priority over bundled fallback and clears external confirmation gate'
    );

    // Test author-release-readme.mjs markdown + GitHub Release raw image URL rendering
    const releaseScript = path.join(
      REPO_ROOT,
      'plugins',
      'update-readme-images',
      'skills',
      'author-release-readme',
      'scripts',
      'author-release-readme.mjs'
    );
    fs.writeFileSync(path.join(extTmp, 'VERSION'), '0.2.0\n', 'utf8');
    fs.writeFileSync(
      path.join(extTmp, '.VERSIONS.json'),
      JSON.stringify({ 'sample-plugin': { version: '0.2.1' } }, null, 2),
      'utf8'
    );
    const relOut = spawnSync(
      process.execPath,
      [releaseScript, '--repo', extTmp, '--version', '0.2.0', '--psa-noun', 'SYMLINKS', '--render-github-body'],
      { encoding: 'utf8', windowsHide: true }
    );
    check(
      relOut.status === 0 &&
        relOut.stdout.includes('# Release v0.2.0') &&
        relOut.stdout.includes('/plugin marketplace add gnomatix/gnomatix-oss-skills') &&
        !/just say no|half the battle/i.test(relOut.stdout) &&
        !/!\[[^\]]*\]\([^)]*banner/i.test(relOut.stdout) &&
        !relOut.stdout.includes('Zero Git Symlinks') &&
        !relOut.stdout.includes('Antigravity CLI') &&
        !relOut.stdout.includes('mise skills sync'),
      'author-release-readme.mjs writes a release note with no PSA closing lines, no banner image, no fixed headlines, no unchecked platform claim and no mise skills sync line'
    );

    // Title banners of plugins new in the release are the only panels; a release banner appears
    // only when its release-v<X>-banner-prompt.md exists in the project-visuals directory.
    const tinyJpg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    fs.mkdirSync(path.join(extTmp, 'plugins', 'sample-plugin', 'assets', 'images'), { recursive: true });
    fs.writeFileSync(path.join(extTmp, 'plugins', 'sample-plugin', 'assets', 'images', 'sample-plugin-banner.jpg'), tinyJpg);
    fs.mkdirSync(path.join(extTmp, 'assets', 'images', 'releases'), { recursive: true });
    fs.writeFileSync(path.join(extTmp, 'assets', 'images', 'releases', 'release-v0.2.0-banner.jpg'), tinyJpg);
    const visualsTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uri-visuals-'));
    const relArgs = [releaseScript, '--repo', extTmp, '--version', '0.2.0', '--render-github-body', '--write'];
    const relEnv = { ...process.env, GNOX_PROJECT_VISUALS_DIR: visualsTmp };
    const pluginBannerUrl = 'https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/v0.2.0/plugins/sample-plugin/assets/images/sample-plugin-banner.jpg';
    const releaseBannerUrl = 'https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/v0.2.0/assets/images/releases/release-v0.2.0-banner.jpg';
    const noPrompt = spawnSync(process.execPath, relArgs, { encoding: 'utf8', windowsHide: true, env: relEnv });
    check(
      noPrompt.status === 0 && noPrompt.stdout.includes(pluginBannerUrl) && !noPrompt.stdout.includes(releaseBannerUrl),
      'release note shows the title banner of a plugin new in the release, and no release banner without a release-v<X>-banner-prompt.md'
    );
    const tmplPath = path.join(visualsTmp, 'ext-custom', 'release-v0.2.0-banner-prompt.md');
    const tmpl = fs.existsSync(tmplPath) ? fs.readFileSync(tmplPath, 'utf8') : '';
    check(
      /^---\r?\n[\s\S]*?\nhighlights:/.test(tmpl) && /Use these style documents/.test(tmpl) && /\nauto-generated: true\n/.test(tmpl) &&
        /## Render instructions/.test(tmpl) && /1376/.test(tmpl) && /768/.test(tmpl) &&
        /## Changelog/.test(tmpl) && tmpl.includes('# Release v0.2.0') && /## Style documents \(inlined\)/.test(tmpl),
      'writing a release note with no prompt file creates release-v<X>-banner-prompt.md: front matter, the style-document instruction, the render instructions (dimensions), the changelog and the style documents inlined'
    );
    const again = spawnSync(process.execPath, relArgs, { encoding: 'utf8', windowsHide: true, env: relEnv });
    check(
      again.status === 0 && again.stdout.includes(releaseBannerUrl),
      'the generated template is the default banner instruction: once its banner exists, the release note shows it'
    );
    fs.mkdirSync(path.join(visualsTmp, 'ext-custom'), { recursive: true });
    fs.writeFileSync(
      path.join(visualsTmp, 'ext-custom', 'release-v0.2.0-banner-prompt.md'),
      [
        '---',
        'title: Sample release title',
        'short-description: "One-paragraph summary of the release."',
        'banner-alt: Sample release banner',
        'highlights:',
        '  - First real change',
        '  - Second real change',
        '---',
        'Authorized release banner prompt.',
        ''
      ].join('\n'),
      'utf8'
    );
    const withPrompt = spawnSync(process.execPath, relArgs, { encoding: 'utf8', windowsHide: true, env: relEnv });
    check(
      withPrompt.status === 0 && withPrompt.stdout.includes(releaseBannerUrl) && withPrompt.stdout.includes(pluginBannerUrl),
      'release note shows the release banner when <visuals>/<workspace_root>/release-v<X>-banner-prompt.md exists'
    );
    check(
      withPrompt.stdout.includes('# Release v0.2.0: Sample release title') &&
        withPrompt.stdout.includes('One-paragraph summary of the release.') &&
        withPrompt.stdout.includes('![Sample release banner](') &&
        withPrompt.stdout.includes('- First real change') &&
        withPrompt.stdout.includes('- Second real change') &&
        !withPrompt.stdout.includes('Authorized release banner prompt.'),
      'release-v<X>-banner-prompt.md YAML front matter sets the title, short description, banner alt text and changes; the image prompt body stays out of the note'
    );
    fs.rmSync(visualsTmp, { recursive: true, force: true });
    // Path safety: the prompt file stays inside the project-visuals directory whatever the
    // workspace_root and version say, and only documents under the repo, the plugin or the
    // project-visuals directory are inlined into it.
    const cfgPath = path.join(extTmp, '.gnox', 'readme-images.json');
    const cfgBefore = fs.readFileSync(cfgPath, 'utf8');
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uri-outside-'));
    const outsideDoc = path.join(outsideDir, 'outside-style.md');
    fs.writeFileSync(outsideDoc, 'OUTSIDE-DOCUMENT-BODY-MARKER\n', 'utf8');
    fs.writeFileSync(
      cfgPath,
      JSON.stringify({
        version: 1,
        workspace_root: '../uri-escaped',
        style_guides: { '../uri-escaped': { doc: outsideDoc.split(path.sep).join('/'), summary: 'Outside style' } },
        rules: []
      }),
      'utf8'
    );
    const visualsSec = fs.mkdtempSync(path.join(os.tmpdir(), 'uri-visuals-sec-'));
    const secEnv = { ...process.env, GNOX_PROJECT_VISUALS_DIR: path.join(visualsSec, 'visuals') };
    const secRun = spawnSync(process.execPath, [releaseScript, '--repo', extTmp, '--version', '0.3.0', '--render-github-body', '--write'], { encoding: 'utf8', windowsHide: true, env: secEnv });
    const listAll = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).map(String) : []);
    const secPrompts = listAll(visualsSec).filter((f) => /banner-prompt\.md$/.test(f));
    check(
      secRun.status === 0 && secPrompts.length === 1 && secPrompts[0].split(path.sep).join('/').startsWith('visuals/'),
      'a workspace_root with path separators or ".." cannot move the banner prompt out of the project-visuals directory'
    );
    const secText = secPrompts.length === 1 ? fs.readFileSync(path.join(visualsSec, secPrompts[0]), 'utf8') : '';
    check(
      secText.length > 0 && !secText.includes('OUTSIDE-DOCUMENT-BODY-MARKER') && secText.includes('outside-style.md'),
      'a style document outside the repo, the plugin and the project-visuals directory is named in the banner prompt and not inlined'
    );
    const badVersion = spawnSync(process.execPath, [releaseScript, '--repo', extTmp, '--version', '../../0.4.0', '--render-github-body', '--write'], { encoding: 'utf8', windowsHide: true, env: secEnv });
    check(
      badVersion.status !== 0 && /version/i.test(badVersion.stderr) && listAll(visualsSec).filter((f) => /banner-prompt\.md$/.test(f)).length === 1,
      'a --version with path separators or ".." is refused before anything is written'
    );
    fs.writeFileSync(cfgPath, cfgBefore, 'utf8');
    for (const f of ['docs/releases/v0.3.0.md']) fs.rmSync(path.join(extTmp, ...f.split('/')), { force: true });
    fs.rmSync(visualsSec, { recursive: true, force: true });
    fs.rmSync(outsideDir, { recursive: true, force: true });


    // Changes from commit subjects: EPIC / FEATURE / BUGFIX listed one by one, everything else
    // collapsed to one line per scope.
    const subjects = [
      'FEATURE(cui-bono): add the logic grid (a1)',
      'BUGFIX(spank-dario): date the Moffatt entries (b2)',
      'EPIC(release-notes): notes from the published snapshots (c3)',
      'DOCS(spank-dario): reword a TODO (d4)',
      'spank-dario: tidy BUGS wording (e5)',
      'spank-dario: fix a typo (f6)',
      'CHORE: bump lockfile (g7)',
    ];
    const sumRun = spawnSync(process.execPath, ['--input-type=module', '-e',
      `import { summarizeCommits } from ${JSON.stringify(require('url').pathToFileURL(releaseScript).href)}; process.stdout.write(JSON.stringify(summarizeCommits(${JSON.stringify(subjects)})));`],
      { encoding: 'utf8', windowsHide: true });
    let sum = [];
    try { sum = JSON.parse(sumRun.stdout); } catch { sum = []; }
    check(
      sum[0] === 'Epic (release-notes): notes from the published snapshots (c3)' &&
        sum.includes('Feature (cui-bono): add the logic grid (a1)') &&
        sum.includes('Fix (spank-dario): date the Moffatt entries (b2)') &&
        sum.includes('spank-dario: 3 smaller changes') &&
        sum.includes('other: 1 smaller change') &&
        sum.length === 5,
      'summarizeCommits lists EPIC/FEATURE/BUGFIX commits and collapses the rest per scope'
    );

    const verPathRes = runCli(['--version-path', 'assets/images/category-your-work-done-panel.jpg', '--version', '0.1.17']);
    check(
      verPathRes.status === 0 &&
        verPathRes.stdout.trim() === 'assets/images/category-your-work-done-v0.1.17-panel.jpg',
      '--version-path appends release-version-specific suffix (-v0.1.17-panel.jpg) to prevent cross-release caching'
    );

    fs.mkdirSync(path.join(extTmp, 'assets', 'review'), { recursive: true });
    fs.writeFileSync(
      path.join(extTmp, 'assets', 'review', 'manifest.json'),
      JSON.stringify({
        version: 1,
        workspace_root: 'ext-custom',
        sections: [{
          id: 's1',
          num: 1,
          title: 'Test Section',
          items: [{ id: 'c1', variant: 'active', release_version: 'v0.2.0', review_status: 'PENDING_HUMAN_REVIEW', role: 'Active', target: 'README.md', img: '../images/test.jpg', desc: 'Test' }]
        }]
      }, null, 2),
      'utf8'
    );
    const revRes = runCli(['--repo', extTmp, '--build-review', '--json']);
    const revHtml = fs.readFileSync(path.join(extTmp, 'assets', 'review', 'preview.html'), 'utf8');
    check(
      revRes.status === 0 &&
        revHtml.includes('12 — Beyond Spinal Tap') &&
        revHtml.includes('Comments / Revision Notes:') &&
        fs.existsSync(path.join(extTmp, 'assets', 'review', 'review-server.js')) &&
        fs.existsSync(path.join(extTmp, 'assets', 'review', 'ratings.json')),
      '--build-review generates formal 0-12 rating-scale & comments preview.html, review-server.js, and ratings.json'
    );
  } finally {
    try { fs.rmSync(extTmp, { recursive: true, force: true }); } catch { /* ignore */ }
  }
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
    fs.existsSync(path.join(userRepo, '.claude', 'readme-images-default.json')) &&
      fs.existsSync(path.join(userRepo, '.claude', 'readme-images-user.json')),
    'created .claude/readme-images-default.json and an empty readme-images-user.json in end-user repo'
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
  const userCfgPath = path.join(userRepo, '.claude', 'readme-images-default.json');
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

  // 2f. Test --apply inserting top-level-panel and ### category heading sub-panels into end-user README.md
  const catPanelA = path.join(userRepo, 'assets', 'images', 'cat-alpha-panel.jpg');
  const catPanelB = path.join(userRepo, 'assets', 'images', 'cat-beta-panel.jpg');
  runMagick(['-size', '1376x768', 'xc:royalblue', catPanelA]);
  runMagick(['-size', '1376x768', 'xc:seagreen', catPanelB]);
  userCfg.rules.push({
    id: 'category-subpanels',
    glob: 'README.md',
    doc: 'docs/readme-images/rules/readme-panels.md',
    panels: [
      {
        id: 'cat-alpha',
        type: 'sub-panel',
        required: true,
        placement: 'after-heading',
        section_heading: '### Category Alpha',
        src_pattern: 'assets/images/cat-alpha-panel.jpg',
        alt_pattern: 'Category Alpha',
        embed_style: 'markdown'
      },
      {
        id: 'cat-beta',
        type: 'sub-panel',
        required: true,
        placement: 'after-heading',
        section_heading: '### Category Beta',
        src_pattern: 'assets/images/cat-beta-panel.jpg',
        alt_pattern: 'Category Beta',
        embed_style: 'markdown'
      }
    ]
  });
  fs.writeFileSync(userCfgPath, JSON.stringify(userCfg, null, 2) + '\n', 'utf8');

  const userReadme = path.join(userRepo, 'README.md');
  fs.writeFileSync(
    userReadme,
    [
      '# acme-widgets',
      '',
      'A sample project.',
      '',
      '## Plugins',
      '',
      '### Category Alpha',
      '',
      '- `alpha`: First plugin.',
      '',
      '### Category Beta',
      '',
      '- `beta`: Second plugin.',
      ''
    ].join('\n'),
    'utf8'
  );
  const applyRes = runCli(['--apply', 'README.md', '--repo', userRepo, '--json']);
  check(applyRes.status === 0, '--apply README.md in end-user repo exits 0');
  const updatedMd = fs.readFileSync(userReadme, 'utf8');
  check(
    updatedMd.includes('![acme-widgets](assets/images/acme-widgets-banner.jpg)') &&
      updatedMd.includes('### Category Alpha\n\n![Category Alpha](assets/images/cat-alpha-panel.jpg)\n\n- `alpha`') &&
      updatedMd.includes('### Category Beta\n\n![Category Beta](assets/images/cat-beta-panel.jpg)\n\n- `beta`'),
    '--apply inserts top-level banner after H1 and category sub-panels immediately under each ### heading'
  );
  const userAuditRes = runCli(['--audit', 'README.md', '--repo', userRepo, '--verify-images', '--json']);
  check(
    userAuditRes.status === 0 && JSON.parse(userAuditRes.stdout).passed === true,
    '--audit --verify-images validates ### category heading sub-panels without cross-section bleed'
  );
} catch (err) {
  check(false, `temp repo / draft / OG test threw error: ${err.message}`);
} finally {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// 3. Full audit of gnomatix-oss-skills itself (root hero + 7 category sub-panels + all 27 plugins + companion OG images + Old Willy oval inset)
{
  const auditRes = runCli(['--audit', '--verify-images', '--json']);
  check(auditRes.status === 0, 'full gnomatix-oss-skills --audit --verify-images exits 0');
  if (auditRes.stdout) {
    const report = JSON.parse(auditRes.stdout);
    check(
      report.passed === true && report.failures === 0 && report.panels_checked >= 45,
      `all ${report.panels_checked} configured panels across ${report.files_checked} files in gnomatix-oss-skills passed verification`
    );
  }
}

console.log(failures === 0 ? 'all passed' : `${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
