/*!
 * holdmyhand.js - expanded resolver blocklist plugin for hsd
 * Copyright (c) 2021 Matthew Zipkin (MIT License).
 */

'use strict';

const punycode = require('../src/punycode.js/punycode');
const confusables = require('../src/confusables.json');

const plugin = exports;

/**
 * Plugin
 */

class Plugin {
  /**
   * Create a plugin.
   * @constructor
   * @param {Node} node
   */

  constructor(node) {
    this.ns = node.ns;
    this.logger = node.logger.context('holdmyhand');

    if (!this.ns)
      return;

    // Handshake TLDs .0 and .1 ... .255 confusion with IPv4 Namespace
    // https://github.com/handshake-org/hsd/issues/455
    for (let i = 0; i <= 255; i++)
      this.ns.blacklist.add(String(i));

    // dns/server: blacklist rfc2606 domains in the resolver
    // https://github.com/handshake-org/hsd/pull/544
    [
      'corp',
      'domain',
      'example',
      'home',
      'invalid',
      'lan',
      'local',
      'localdomain',
      'localhost',
      'test'
    ].forEach(name => this.ns.blacklist.add(name));

    // Conflict issue with pending ICANN TLDs: .MUSIC .KIDS .HOTEL et al
    // https://github.com/handshake-org/hs-names/issues/6
    this.newTLDs = new Set([
      'amazon',
      'xn--cckwcxetd',
      'xn--jlq480n2rg',
      'hotel',
      'idn',
      'kids',
      'music',
      'spa',
      'web',
      'webs',
      'merck'
    ]);

    this.ns.middle = async (name) => {
      // Force ICANN lookup
      if (this.newTLDs.has(name)) {
        this.logger.warning('Forcing ICANN lookup for name %s', name);
        return await this.ns.icann.lookup(name);
      }

      // Blacklist should include homographs of ICANN TLDs
      // https://github.com/handshake-org/hsd/issues/255
      // Instead of trying to add infinite combinations of homographs
      // to the resolver blocklist, we use the middleware access point.
      // Instead of actually constructing a NXDOMAIN response in this
      // plugin, we quickly add the dangerous name to the blocklist and
      // return null. This acts like a nice little cache.
      // The server will check the list as soon as we return and send NXDOMAIN.
      const unicode = punycode.toUnicode(name);

      // Not a dangerous name
      if (unicode === name)
        return null;

      let matches = [];
      for (let i = 0; i < unicode.length; i++) {
        const ch = unicode.charCodeAt(i);
        if (!(ch & 0xff80))
          continue;

        const confChars = confusables[unicode[i]];

        for (const confChar of confChars) {
          const combos = [];

          // All permutations of previous matches
          for (const match of matches) {
            const confName =
            match.substr(0, i) +
            confChar +
            match.substr(i + 1);

            combos.push(confName);
          }

          // Original name swap one character
          const confName =
            unicode.substr(0, i) +
            confChar +
            unicode.substr(i + 1);
          combos.push(confName);

          matches = matches.concat(combos);
        }
      }

      // Check each homograph against known ICANN TLDs
      for (const match of matches) {
        const item = this.ns.getReserved(match);

        if (item) {
          this.logger.warning(
            'Blocking lookup request for name %s (reserved homograph: %s)',
            name,
            match
          );
          this.ns.blacklist.add(match);
          return null;
        }
      }

      // Always return null
      return null;
    };
  }

  open() {
    this.logger.info('Root nameserver filtering is active.');
  }

  close() {}
}

/**
 * Plugin name.
 * @const {String}
 */

plugin.id = 'holdmyhand';

/**
 * Plugin initialization.
 * @param {Node} node
 * @returns {WalletDB}
 */

plugin.init = function init(node) {
  return new Plugin(node);
};
