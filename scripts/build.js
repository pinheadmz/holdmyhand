'use strict';

const path = require('path');
const fs = require('fs');
const confusables = require(
  '../src/confusable_homoglyphs/confusable_homoglyphs/confusables.json'
);

const FILE = path.join(__dirname, '..', 'src', 'confusables.json');

const unicodes = Object.keys(confusables);
const out = {};
for (const uni of unicodes) {
  const alts = confusables[uni];
  for (const alt of alts) {
    if (!out[alt.c])
      out[alt.c] = [];

     out[alt.c].push(uni);
  }
}

fs.writeFileSync(FILE, JSON.stringify(out));
