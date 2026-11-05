// Test stand-in for bd: records its arguments to SPANK_DARIO_FAKE_BD_LOG and exits 0.
'use strict';
const fs = require('fs');
fs.writeFileSync(process.env.SPANK_DARIO_FAKE_BD_LOG, JSON.stringify(process.argv.slice(2)));
