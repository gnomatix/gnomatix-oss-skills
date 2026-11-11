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
        relOut.stdout.includes('https://raw.githubusercontent.com/gnomatix/gnomatix-oss-skills/v0.2.0/assets/images/releases/release-v0.2.0-banner.jpg') &&
        relOut.stdout.includes('# Just say NO to SYMLINKS!') &&
        relOut.stdout.includes('## ... Knowing is half the battle.'),
      'author-release-readme.mjs generates versioned PSA release note and rewrites relative banner path to tag-pinned raw GitHub URL'
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
