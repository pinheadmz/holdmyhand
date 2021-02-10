# holdmyhand

A plugin for [hsd](https://github.com/handshake-org/hsd)
that expands the root name server blocklist to protect the user from looking up
dangerous top-level domains.

⚠️ This is an experimental plugin and should not be used in production ⚠️

⚠️ This plugin is currently unusable until https://github.com/handshake-org/hsd/pull/558 is merged in hsd ⚠️


## Usage

```
hsd --plugins <path/to/holdmyhand>
```

## Filters

1. Adds to blocklist integers 0 through 255 (interpreted as TLD strings)
2. Adds to blocklist extra IETF reserved names 
3. Forces ICANN resolution of TLDs added since HNS mainnet launch:
  - `amazon`
  - `xn--cckwcxetd` ("amazon" in Japanese)
  - `xn--jlq480n2rg` ("amazon" in Chinese)
  - `hotel`
  - `idn`
  - `kids`
  - `music`
  - `spa`
  - `web`
  - `webs`
  - `merck`
4. Attempts to block lookup of punycode names that may be homographs of ICANN TLDs

Examples with log messages from `hsd`:

```
$ dig @127.0.0.1 -p 25350 handshake.cοm

[warning] (holdmyhand) Blocking lookup request for name xn--cm-jbc (reserved homograph: com)
```

```
$ dig @127.0.0.1 -p 25350 starservice.music

[warning] (holdmyhand) Forcing ICANN lookup for name music
```

## Dependencies

This repository minimally imports and vendors code from these MIT-licensed
open source projects:

https://github.com/bestiejs/punycode.js

https://github.com/vhf/confusable_homoglyphs

Homograph detection is based on this project:

https://github.com/namebasehq/idn-homographs