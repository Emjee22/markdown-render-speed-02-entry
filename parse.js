// Fast CommonMark + GFM renderer, matching marked 18.1.3 output exactly.
// Single dependency-free ES module. Written from the CommonMark 0.31.2
// spec and GFM extensions, with marked's observed behavior as ground truth.

// ------------------------------------------------------------------
// Small character helpers
// ------------------------------------------------------------------

const SPACE = 32, TAB = 9, LF = 10, CR = 13;

// ASCII whitespace: space, tab, newline, form feed, vertical tab, CR.
function isWs(ch) {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\f' || ch === '\v' || ch === '\r';
}

// ASCII punctuation (CommonMark's punctuation set).
function isAsciiPunct(code) {
  return (code >= 33 && code <= 47) || (code >= 58 && code <= 64) ||
    (code >= 91 && code <= 96) || (code >= 123 && code <= 126);
}

// Unicode whitespace / punctuation checks, with a tiny cache for the
// non-ASCII characters actually seen.
const wsCache = new Map();
function isSpaceCh(ch) {
  if (!ch) return true; // start/end of string count as whitespace
  const c = ch.charCodeAt(0);
  if (c < 128) return isWs(ch);
  let v = wsCache.get(ch);
  if (v === undefined) { v = /\s/.test(ch); wsCache.set(ch, v); }
  return v;
}
const punctCache = new Map();
function isPunctCh(ch) {
  if (!ch) return false;
  const c = ch.charCodeAt(0);
  if (c < 128) return isAsciiPunct(c);
  let v = punctCache.get(ch);
  if (v === undefined) { v = /[\p{P}\p{S}]/u.test(ch); punctCache.set(ch, v); }
  return v;
}

// ------------------------------------------------------------------
// Escaping
// ------------------------------------------------------------------

// Sentinels for backslash-escaped characters that must not be
// re-interpreted (a literal '&' from \& must not start an entity).
const E_AMP = '\uE000', E_LT = '\uE001', E_GT = '\uE002', E_QUOT = '\uE003', E_APOS = '\uE004';
const SENTINEL_HTML = { [E_AMP]: '&amp;', [E_LT]: '&lt;', [E_GT]: '&gt;', [E_QUOT]: '&quot;', [E_APOS]: '&#39;' };
const SENTINEL_CHAR = { [E_AMP]: '&', [E_LT]: '<', [E_GT]: '>', [E_QUOT]: '"', [E_APOS]: "'" };

// Entity-aware escape for text and attribute values: a bare & becomes
// &amp;, but a valid &name; passes through unchanged.
function escText(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const code = s.charCodeAt(i);
    if (code >= 0xE000 && code <= 0xE004) { out += SENTINEL_HTML[ch]; continue; }
    if (ch === '&') {
      const m = namedEntityAt(s, i);
      if (m > 0) { out += s.slice(i, i + m); i += m - 1; continue; }
      out += '&amp;';
    } else if (ch === '<') out += '&lt;';
    else if (ch === '>') out += '&gt;';
    else if (ch === '"') out += '&quot;';
    else if (ch === "'") out += '&#39;';
    else out += ch;
  }
  return out;
}

// Blind escape for code spans / code blocks / fenced info: & always
// becomes &amp;.
function escRaw(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '&') out += '&amp;';
    else if (ch === '<') out += '&lt;';
    else if (ch === '>') out += '&gt;';
    else if (ch === '"') out += '&quot;';
    else if (ch === "'") out += '&#39;';
    else out += ch;
  }
  return out;
}

// Length of a named entity starting at s[i] ('&' + name + ';'), or 0.
// Names are letters, digits and underscores; the first char must be a
// letter. Hyphens and a missing semicolon break the entity.
function namedEntityAt(s, i) {
  if (s[i] !== '&' || i + 2 >= s.length) return 0;
  const c1 = s.charCodeAt(i + 1);
  const isLetter = (c1 >= 65 && c1 <= 90) || (c1 >= 97 && c1 <= 122);
  if (!isLetter) return 0;
  let j = i + 2;
  while (j < s.length) {
    const c = s.charCodeAt(j);
    const ok = (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95;
    if (!ok) break;
    j++;
  }
  if (j < s.length && s[j] === ';' && j > i + 1) return j - i + 1;
  return 0;
}

// Decode a numeric character reference starting at s[i] (a '&' followed
// by '#' or '#x'/'#X' and a valid digit run ending in ';'). Returns
// {text, len} or null. 0, surrogates and >0x10FFFF become U+FFFD.
function numericEntityAt(s, i) {
  if (s[i] !== '&' || s[i + 1] !== '#') return null;
  let j = i + 2, hex = false;
  if (s[j] === 'x' || s[j] === 'X') { hex = true; j++; }
  const start = j;
  while (j < s.length) {
    const c = s.charCodeAt(j);
    const ok = hex
      ? (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)
      : (c >= 48 && c <= 57);
    if (!ok) break;
    j++;
  }
  const n = j - start;
  if (n < 1 || n > (hex ? 6 : 7)) return null;
  if (j >= s.length || s[j] !== ';') return null;
  let v = parseInt(s.slice(start, j), hex ? 16 : 10);
  if (v === 0 || (v >= 0xD800 && v <= 0xDFFF) || v > 0x10FFFF) v = 0xFFFD;
  return { text: String.fromCodePoint(v), len: j - i + 1 };
}

// encodeURI-equivalent for hrefs, except '%' itself is left alone.
function encodeHref(u) {
  let out = '';
  for (let i = 0; i < u.length; i++) {
    const ch = u[i];
    const code = u.charCodeAt(i);
    if (code < 128) {
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) ||
        (code >= 48 && code <= 57) ||
        ";/?:@&=+,$-_.!~*'()#%".indexOf(ch) >= 0) { out += ch; continue; }
      out += '%' + code.toString(16).toUpperCase().padStart(2, '0');
    } else {
      // Encode the UTF-8 bytes of this code point.
      let cp = code;
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < u.length) {
        const lo = u.charCodeAt(i + 1);
        if (lo >= 0xDC00 && lo <= 0xDFFF) { cp = 0x10000 + ((code - 0xD800) << 10) + (lo - 0xDC00); i++; }
      }
      const bytes = cp < 0x800 ? [0xC0 | (cp >> 6), 0x80 | (cp & 63)]
        : cp < 0x10000 ? [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)]
        : [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
      for (const b of bytes) out += '%' + b.toString(16).toUpperCase().padStart(2, '0');
    }
  }
  return out;
}

// Normalize a link label: collapse whitespace runs to one space,
// trim, lowercase.
function normalizeLabel(s) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase().toUpperCase().toLowerCase();
}

// Turn raw text into its plain form (for alt attributes): sentinels
// become their literal characters, everything else stays.
function plainOf(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const c = s.charCodeAt(i);
    if (c >= 0xE000 && c <= 0xE004) out += SENTINEL_CHAR[ch];
    else out += ch;
  }
  return out;
}

// ------------------------------------------------------------------
// Inline parsing helpers
// ------------------------------------------------------------------

function isDomainChar(ch) {
  const c = ch.charCodeAt(0);
  return (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 45 || c === 95;
}
function isLocalChar(ch) {
  const c = ch.charCodeAt(0);
  return (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
    c === 46 || c === 95 || c === 43 || c === 45;
}

// Find the closing backtick run of exactly `run` backticks starting at
// `from`; returns its index or -1.
function findCodeClose(s, from, run) {
  let i = from;
  while (i < s.length) {
    if (s[i] === '`') {
      let j = i;
      while (j < s.length && s[j] === '`') j++;
      if (j - i === run) return i;
      i = j;
    } else i++;
  }
  return -1;
}

// marked's emStrong masking (#n): first anyPunctuationOutsideCode
// (Ot) masks the inside of code spans (inner backticks become '+',
// escaped punctuation becomes '+'s), then blockSkip (ot) replaces
// whole links, code spans and HTML tags with a same-length bracketed
// run of 'a's. Both replacements preserve length, so a delimiter at
// position i is visible to emStrong iff the masked text still holds
// the same delimiter run there. This hides delimiters that marked
// swallows — inside a link whose label holds a `` ... ` ... `` code
// span, and inside a code span the masking pairs across a link
// boundary (an unclosed `` `` `` run pairing with a later backtick).
const MASK_OT_RE = /(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\([\p{P}\p{S}])/gu;
const MASK_OT_BLOCK_RE = /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)|(?<!`)(?<b>`+)[^`]+\k<b>(?!`)|<(?! )[^<>]*?>/g;
function maskedText(src) {
  let t = src.replace(MASK_OT_RE, (n, s, r) => r ? '+'.repeat(n.length) : s ? s + n.slice(s.length, -s.length).replace(/`/g, '+') + s : n);
  t = t.replace(MASK_OT_BLOCK_RE, (n) => '[' + 'a'.repeat(n.length - 2) + ']');
  return t;
}

// Find the end of a link label starting at s[i] === '[', skipping
// code spans by same-length closer. Returns {end, bad} where end is
// the index just after the matching ']' and bad is true if the label
// holds a code span whose content contains a backtick, or null if no
// matching ']' exists. A label with such a code span is rejected by
// marked's label regex (so no link forms) but, after marked's
// anyPunctuationOutsideCode masking replaces the inner backtick, it
// is matched by blockSkip, which masks the whole [...](...) span —
// hiding its emphasis delimiters from emStrong. So delimiters inside
// such a label must stay literal.
// Scan a link text / label starting at s[i] === '['. Returns
// {end, text} (end is the index just after the matching ']') or null.
function parseLinkText(s, i) {
  let depth = 1, j = i + 1;
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '`') {
      let k = j;
      while (k < s.length && s[k] === '`') k++;
      const runLen = k - j;
      // marked's label regex, alt 4 first: a run of 2+ backticks
      // immediately before ']' is consumed on its own — the lazy
      // label match prefers this shortest reading over a code span
      // whose closer sits past the ']'.
      if (runLen >= 2 && s[k] === ']') { j = k; continue; }
      // Alt 3: a code span whose content has no backticks — the
      // closer is the NEXT backtick run (any length, not necessarily
      // the opener's length).
      let p = k, nextRunEnd = -1;
      while (p < s.length) {
        if (s[p] === '`') {
          while (p < s.length && s[p] === '`') p++;
          nextRunEnd = p;
          break;
        }
        p++;
      }
      if (nextRunEnd >= 0) { j = nextRunEnd; continue; }
      // Otherwise the label cannot be matched, so no link forms.
      return null;
    }
    if (c === '<') {
      const gt = s.indexOf('>', j + 1);
      if (gt >= 0) { j = gt + 1; continue; }
    }
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return { end: j + 1, text: s.slice(i + 1, j) };
    }
    j++;
  }
  return null;
}

// Skip spaces/tabs and single newlines (never across a blank line).
function skipWs(s, i) {
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === '\n') {
      let j = i + 1;
      while (j < s.length && (s[j] === ' ' || s[j] === '\t')) j++;
      if (j >= s.length || s[j] === '\n') return i;
      i = j; continue;
    }
    break;
  }
  return i;
}

// Parse a link destination at s[i]. Returns {dest, end} or null.
function parseDest(s, i) {
  if (s[i] === '<') {
    let j = i + 1;
    while (j < s.length) {
      const c = s[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '>') return { dest: s.slice(i + 1, j), end: j + 1 };
      if (c === '\n' || c === '<') return null;
      j++;
    }
    return null;
  }
  let j = i, depth = 0;
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '(') { depth++; j++; continue; }
    if (c === ')') {
      if (depth === 0) break;
      depth--; j++; continue;
    }
    const code = s.charCodeAt(j);
    if (code < 32 || c === ' ') break;
    j++;
  }
  if (j === i) return null;
  if (depth > 0) return null;
  return { dest: s.slice(i, j), end: j };
}

// Parse a link title at s[i] ('"', "'" or '('). Returns {title, end}.
function parseTitle(s, i) {
  const q = s[i];
  const close = q === '(' ? ')' : q;
  let j = i + 1;
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') { j += 2; continue; }
    if (c === close) return { title: s.slice(i + 1, j), end: j + 1 };
    if (q === '(' && c === '(') return null;
    if (c === '\n' && q === "'") {
      // A blank line inside a '-title invalidates it; " and ()
      // titles may span blank lines.
      let k = j + 1;
      while (k < s.length && (s[k] === ' ' || s[k] === '\t')) k++;
      if (k >= s.length || s[k] === '\n') return null;
    }
    j++;
  }
  return null;
}

// Remove backslash escapes (backslash + ASCII punctuation -> the char).
function unescape(s) {
  if (s.indexOf('\\') < 0) return s;
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length && isAsciiPunct(s.charCodeAt(i + 1))) { out += s[i + 1]; i++; }
    else out += c;
  }
  return out;
}

const processDest = (d) => encodeHref(unescape(d));
const processTitle = (t) => unescape(t);

// Match a domain starting at s[i] (just after the '@'). Labels are
// maximal runs of [A-Za-z0-9_-]; every label after the first must end
// in an ASCII alphanumeric; at least two labels (one dot) required.
// Domain for a bare email / mailto: / xmpp: address, mirroring
// marked's It regex with its backtracking. Labels after the first
// must end in an alphanumeric; at least 2 labels; the character
// after the domain must not be a word character or hyphen. The
// longest candidate is tried first, then fewer labels. When mayMask
// is true, a trailing _ run that is an emphasis closer (marked
// masks emphasis delimiters before matching, so the closer does not
// block the domain) counts as a boundary instead of a word char.
function matchDomain(s, i, mayMask) {
  const labels = [];
  let k = i;
  while (true) {
    let m = k;
    while (m < s.length && isDomainChar(s[m])) m++;
    if (m === k) break;
    let e = m;
    while (e > k && !isAlnumCode(s.charCodeAt(e - 1))) e--;
    if (e === k) break;
    labels.push({ end: e, runEnd: m });
    k = m;
    if (s[k] === '.' && k + 1 < s.length && isDomainChar(s[k + 1])) { k++; continue; }
    break;
  }
  if (labels.length < 2) return null;
  for (let n = labels.length; n >= 2; n--) {
    const end = labels[n - 1].end;
    const nc = s[end];
    if (nc === undefined) return { end };
    if (nc === '_' && mayMask) {
      let e = end;
      while (e < s.length && s[e] === '_') e++;
      const after = s[e];
      if (after === undefined || isSpaceCh(after) || isPunctCh(after)) return { end };
    }
    if (!isWordHyphen(nc)) return { end };
  }
  return null;
}

function isAlnumCode(c) {
  return (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

function isWordHyphen(ch) {
  const c = ch.charCodeAt(0);
  return isAlnumCode(c) || c === 95 || c === 45;
}

// Match an email address starting at s[i]. Returns {end} or null.
// Local part: [A-Za-z0-9._+-]+.
function matchEmail(s, i) {
  let j = i;
  while (j < s.length && isLocalChar(s[j])) j++;
  if (j === i || s[j] !== '@') return null;
  return matchDomain(s, j + 1);
}

// Trim a bare-URL candidate the way GFM does: strip a trailing entity
// reference, then trailing punctuation (looped with the paren rule),
// then drop an unmatched '(' region when the result does not end in ')'.
// GFM autolink backpedal: marked's _backpedal regex. A '(' survives
// only as part of a balanced (...) group; an unmatched '(' ends the
// URL (e.g. https://a.io)](https://b.io stops at https://a.io)]).
// Trailing punctuation and a trailing entity ref are dropped by the
// same pattern. Applied until the string stops changing.
const BACKPEDAL_RE = /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/;
function backpedal(u) {
  let prev;
  do {
    prev = u;
    u = BACKPEDAL_RE.exec(u)?.[0] ?? '';
  } while (u !== prev);
  return u;
}

function trySchemeUrl(s, i) {
  const lower = s.slice(i, i + 8).toLowerCase();
  let len = 0;
  if (lower.startsWith('http://')) len = 7;
  else if (lower.startsWith('https://')) len = 8;
  else if (lower.startsWith('ftp://')) len = 6;
  else return null;
  let j = i + len;
  while (j < s.length && !isWs(s[j]) && s[j] !== '<') j++;
  if (j === i + len) return null;
  const cand = backpedal(s.slice(i, j));
  if (!cand) return null;
  return { url: cand, end: i + cand.length };
}

function tryWwwUrl(s, i) {
  if (i > 0) {
    const pc = s.charCodeAt(i - 1);
    if ((pc >= 48 && pc <= 57) || (pc >= 65 && pc <= 90) || (pc >= 97 && pc <= 122)) return null;
  }
  if (!s.startsWith('www.', i)) return null;
  let j = i + 4, labels = 0;
  while (true) {
    let k = j;
    while (k < s.length && isDomainChar(s[k])) k++;
    if (k === j) return null;
    labels++;
    j = k;
    if (s[j] === '.' && j + 1 < s.length && isDomainChar(s[j + 1])) { j++; continue; }
    break;
  }
  if (labels < 1) return null;
  let p = j;
  while (p < s.length && !isWs(s[p]) && s[p] !== '<') p++;
  const cand = backpedal(s.slice(i, p));
  if (!cand) return null;
  return { url: cand, end: i + cand.length };
}

function tryMailtoUrl(s, i) {
  if (!s.startsWith('mailto:', i)) return null;
  const m = matchEmail(s, i + 7);
  if (!m) return null;
  return { url: s.slice(i, m.end), end: m.end };
}

// xmpp: + email, optionally followed by one /path segment of
// [A-Za-z0-9@.]+.
function tryXmppUrl(s, i) {
  if (!s.startsWith('xmpp:', i)) return null;
  const m = matchEmail(s, i + 5);
  if (!m) return null;
  let end = m.end;
  if (s[end] === '/') {
    let k = end + 1;
    while (k < s.length) {
      const c = s.charCodeAt(k);
      if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 64 || c === 46) k++;
      else break;
    }
    if (k > end + 1) end = k;
  }
  return { url: s.slice(i, end), end };
}

// Angle autolink <...> at s[i]: scheme (2-32 chars) or email.
// Returns {url, href, end} or null.
function tryAngleAutolink(s, i) {
  const c1 = s.charCodeAt(i + 1);
  const isLetter = (c1 >= 65 && c1 <= 90) || (c1 >= 97 && c1 <= 122);
  if (!isLetter) return null;
  let j = i + 1;
  while (j < s.length) {
    const c = s.charCodeAt(j);
    const ok = (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
      c === 43 || c === 46 || c === 45;
    if (!ok) break;
    j++;
  }
  // Scheme form: name of 2-32 chars followed by ':'.
  if (j - (i + 1) >= 2 && j - (i + 1) <= 32 && s[j] === ':') {
    let k = j + 1;
    while (k < s.length && !isWs(s[k]) && s[k] !== '<' && s[k] !== '>') k++;
    if (k < s.length && s[k] === '>') {
      const url = s.slice(i + 1, k);
      return { url, href: encodeHref(url), end: k + 1 };
    }
    return null;
  }
  // Email form.
  const m = matchEmail(s, i + 1);
  if (m && s[m.end] === '>') {
    const email = s.slice(i + 1, m.end);
    return { url: email, href: 'mailto:' + email, end: m.end + 1 };
  }
  return null;
}

// Scan an inline HTML construct at s[i] === '<'. Returns the index just
// after the tag, or -1 when it is not a valid tag.
function scanHtmlTag(s, i) {
  // Comment: <!-- ... --> (search for --> starting at i+2).
  if (s.startsWith('<!--', i)) {
    const e = s.indexOf('-->', i + 2);
    return e >= 0 ? e + 3 : -1;
  }
  // Processing instruction: <? ... ?>
  if (s.startsWith('<?', i)) {
    const e = s.indexOf('?>', i + 1);
    return e >= 0 ? e + 2 : -1;
  }
  // CDATA: <![CDATA[ ... ]]>
  if (s.startsWith('<![CDATA[', i)) {
    const e = s.indexOf(']]>', i + 9);
    return e >= 0 ? e + 3 : -1;
  }
  // Declaration: <! + letter ... > with whitespace somewhere inside.
  if (s.startsWith('<!', i)) {
    const c = s.charCodeAt(i + 2);
    const isLetter = (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
    if (isLetter) {
      const e = s.indexOf('>', i + 2);
      if (e < 0) return -1;
      const inner = s.slice(i + 2, e);
      if (/[ \t\n]/.test(inner)) return e + 1;
    }
    return -1;
  }
  let j = i + 1, closing = false;
  if (s[j] === '/') { closing = true; j++; }
  const c0 = s.charCodeAt(j);
  if (!((c0 >= 65 && c0 <= 90) || (c0 >= 97 && c0 <= 122))) return -1;
  while (j < s.length) {
    const c = s.charCodeAt(j);
    if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 45) j++;
    else break;
  }
  if (closing) {
    while (j < s.length && (s[j] === ' ' || s[j] === '\t' || s[j] === '\n')) j++;
    return s[j] === '>' ? j + 1 : -1;
  }
  // Open tag: attributes, then optional '/' and '>'.
  while (true) {
    let k = j;
    while (k < s.length && (s[k] === ' ' || s[k] === '\t' || s[k] === '\n')) k++;
    if (k >= s.length) return -1;
    if (s[k] === '>') return k + 1;
    if (s[k] === '/') return s[k + 1] === '>' ? k + 2 : -1;
    if (k === j) return -1; // an attribute needs preceding whitespace
    j = k;
    // Attribute name: [A-Za-z_:][A-Za-z0-9_.:-]*
    const a0 = s.charCodeAt(j);
    const ok0 = (a0 >= 65 && a0 <= 90) || (a0 >= 97 && a0 <= 122) || a0 === 95 || a0 === 58;
    if (!ok0) return -1;
    j++;
    while (j < s.length) {
      const c = s.charCodeAt(j);
      if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
        c === 95 || c === 46 || c === 58 || c === 45) j++;
      else break;
    }
    let k2 = j;
    while (k2 < s.length && (s[k2] === ' ' || s[k2] === '\t' || s[k2] === '\n')) k2++;
    if (s[k2] !== '=') continue; // valueless attribute
    j = k2 + 1;
    while (j < s.length && (s[j] === ' ' || s[j] === '\t' || s[j] === '\n')) j++;
    if (j >= s.length) return -1;
    const q = s[j];
    if (q === '"' || q === "'") {
      const e = s.indexOf(q, j + 1);
      if (e < 0) return -1;
      j = e + 1;
    } else {
      if (s[j] === '=' || s[j] === '<' || s[j] === '>' || s[j] === '`') return -1;
      while (j < s.length) {
        const c = s[j];
        if (isWs(c) || c === '"' || c === "'" || c === '=' || c === '<' || c === '>' || c === '`') break;
        j++;
      }
      if (j >= s.length) return -1;
    }
  }
}

// ------------------------------------------------------------------
// Inline parser
// ------------------------------------------------------------------

// Resolve a link/image starting at the '[' at s[i] (i is the '[' for
// links, the '[' after '!' for images). Returns {node, end} or null.
// Precedence: inline link, then full/collapsed reference link, then
// shortcut reference link. A failed inline link falls back to the
// shortcut form ([foo](not a link) resolves [foo] when defined); a
// failed full reference link does not.
function tryLink(s, i, refs, isImage) {
  const lt = parseLinkText(s, i);
  if (!lt) return null;
  const after = lt.end;
  let dest = null, title = null, end = -1, ok = false;
  if (s[after] === '(') {
    let p = skipWs(s, after + 1);
    if (s[p] === ')') { dest = ''; end = p + 1; ok = true; }
    else {
      const d = parseDest(s, p);
      if (d) {
        let q = skipWs(s, d.end), t = null, bad = false;
        if (s[q] === '"' || s[q] === "'" || s[q] === '(') {
          const tt = parseTitle(s, q);
          if (!tt) bad = true;
          else { t = tt.title; q = skipWs(s, tt.end); }
        }
        if (!bad && s[q] === ')') { dest = d.dest; title = t; end = q + 1; ok = true; }
      }
    }
  } else if (s[after] === '[') {
    const lb = parseLinkText(s, after);
    if (!lb) return null;
    // Collapsed reference link: an empty second pair means the label
    // is the link text itself.
    const def = refs.get(normalizeLabel(lb.text === '' ? lt.text : lb.text));
    if (!def) return null;
    dest = def.dest; title = def.title; end = lb.end; ok = true;
  }
  if (!ok) {
    const def = refs.get(normalizeLabel(lt.text));
    if (!def) return null;
    dest = def.dest; title = def.title; end = after;
  }
  // Link text is parsed with extended autolinks suppressed: a bare
  // URL, www., mailto:, xmpp: or email never forms inside link text
  // (angle autolinks still do). The document link state is saved
  // and restored, as marked does while parsing link text.
  const savedInLink = docInLink;
  docInLink = true;
  const nodes = parseInline(lt.text, refs, true);
  docInLink = savedInLink;
  if (!isImage && containsExplicitLink(nodes)) return null;
  if (isImage) {
    return { node: { t: 'img', src: processDest(dest), title: title === null ? null : processTitle(title), alt: plainNodes(nodes) }, end };
  }
  return { node: { t: 'link', href: processDest(dest), title: title === null ? null : processTitle(title), nodes, auto: false }, end };
}

function containsExplicitLink(nodes) {
  for (const nd of nodes) {
    if (nd.t === 'link' && !nd.auto) return true;
    if (nd.t === 'em' || nd.t === 'strong' || nd.t === 'del') {
      if (containsExplicitLink(nd.nodes)) return true;
    }
  }
  return false;
}

// Flanking (open/close) for a delimiter run with the given neighbours.
function delimOpenClose(ch, prev, next) {
  const left = !isSpaceCh(next) && (!isPunctCh(next) || isSpaceCh(prev) || isPunctCh(prev));
  const right = !isSpaceCh(prev) && (!isPunctCh(prev) || isSpaceCh(next) || isPunctCh(next));
  let open, close;
  if (ch === '_') {
    open = left && (!right || isPunctCh(prev));
    close = right && (!left || isPunctCh(next));
  } else { open = left; close = right; }
  return { open, close };
}

// Whether the delimiter at nodes[j] (char ch) sits inside a span of
// the opposite delimiter char (a __...__ for '*', a **...** for '_')
// with no delimiter of either char in between. marked's RDelim
// regex skips such a delimiter: it belongs to the inner strong, not
// to the outer scan.
function isInsideOppositeStrong(nodes, j, ch) {
  const opp = ch === '*' ? '_' : '*';
  // The __ before must be an OPENING __, the __ after a CLOSING __;
  // a closing __ followed later by another opening __ does not span.
  let a = -1;
  for (let k = j - 1; k >= 0; k--) {
    const nd = nodes[k];
    if (nd.t !== 'delim' || nd.dead) continue;
    if (nd.ch === opp && nd.n >= 2 && nd.open) { a = k; break; }
    break;
  }
  if (a < 0) return false;
  for (let k = j + 1; k < nodes.length; k++) {
    const nd = nodes[k];
    if (nd.t !== 'delim' || nd.dead) continue;
    if (nd.ch === opp && nd.n >= 2 && nd.close) return true;
    return false;
  }
  return false;
}

// marked's left-to-right greedy emStrong / del scan. Replaces the
// CommonMark delimiter stack: marked scans forward from each opener
// and consumes a whole span, so a lone delimiter inside the span
// stays literal instead of pairing inward.
function processEmphasis(nodes) {
  function scanEm(oi) {
    const op = nodes[oi];
    const ch = op.ch;
    const k = op.n;
    const pCh = op.prev;
    const dPunct = op.next !== '' && isPunctCh(op.next);
    const h = pCh === '*' || pCh === '_' || (pCh !== '' && isPunctCh(pCh));
    const R = pCh !== '' && pCh.trim() !== '' && (dPunct || (ch === '*' && !h));
    const o = pCh === ch;
    const y = k;
    let m = k, f = 0;
    for (let j = oi + 1; j < nodes.length; j++) {
      const d2 = nodes[j];
      if (d2.t !== 'delim' || d2.dead || d2.ch !== ch) continue;
      if (isInsideOppositeStrong(nodes, j, ch)) continue;
      const b = d2.n;
      // Pure opener (can open, cannot close): adds to the opener count.
      if (d2.open && !d2.close) { m += b; continue; }
      if (!d2.close) continue; // neither: literal in the scan
      // A closer (pure closer, or both): the odd-match rule applies
      // when it can also open, or when the opener is right-flanking.
      if ((d2.open && d2.close) || R) {
        if (o && (d2.open && d2.close)) return null;
        if (y % 3 !== 0 && (y + b) % 3 === 0) { f += b; continue; }
      }
      m -= b;
      if (m > 0) continue;
      const bUsed = Math.min(b, b + m + f);
      const use = (Math.min(k, bUsed) % 2 === 1) ? 1 : 2;
      return { ci: j, use, bUsed, tag: use === 2 ? 'strong' : 'em' };
    }
    return null;
  }
  function scanDel(oi) {
    const op = nodes[oi];
    const o = op.n;
    let p = o;
    for (let j = oi + 1; j < nodes.length; j++) {
      const d2 = nodes[j];
      if (d2.t !== 'delim' || d2.dead || d2.ch !== '~') continue;
      const l = d2.n;
      if (l !== o) continue;
      if (d2.open && !d2.close) { p += l; continue; }
      if (!d2.close) continue;
      p -= l;
      if (p > 0) continue;
      const use = Math.min(l, l + p);
      return { ci: j, use, bUsed: l, tag: 'del' };
    }
    return null;
  }
  let i = 0;
  while (i < nodes.length) {
    const nd = nodes[i];
    if (nd.t !== 'delim' || nd.dead || !nd.open) { i++; continue; }
    const res = nd.ch === '~' ? scanDel(i) : scanEm(i);
    if (!res) {
      // No emphasis from this opener. marked's lexer advances one
      // character and retries, so a run of length n is retried as
      // n-1, n-2, ... : consume one leading char as literal text
      // and retry the shortened run.
      if (nd.n > 1) {
        nd.n -= 1;
        nd.prev = nd.ch;
        const nc = delimOpenClose(nd.ch, nd.ch, nd.next);
        nd.open = nc.open; nd.close = nc.close;
        nodes.splice(i, 0, { t: 'text', s: nd.ch });
        i++;
        continue;
      }
      i++; continue;
    }
    const op = nd, cl = nodes[res.ci];
    const ch = op.ch, use = res.use, bUsed = res.bUsed;
    const inner = [];
    if (op.n - use > 0) {
      const oc = delimOpenClose(ch, '', op.next);
      inner.push({ t: 'delim', ch, n: op.n - use, open: oc.open, close: oc.close, prev: '', next: op.next });
    }
    for (let k = i + 1; k < res.ci; k++) inner.push(nodes[k]);
    if (bUsed - use > 0) {
      const cc = delimOpenClose(ch, cl.prev, '');
      inner.push({ t: 'delim', ch, n: bUsed - use, open: cc.open, close: cc.close, prev: cl.prev, next: '' });
    }
    processEmphasis(inner);
    const wrapped = { t: res.tag, nodes: inner };
    const repl = [wrapped];
    if (cl.n - bUsed > 0) {
      const rc = delimOpenClose(ch, ch, cl.next);
      repl.push({ t: 'delim', ch, n: cl.n - bUsed, open: rc.open, close: rc.close, prev: ch, next: cl.next });
    }
    nodes.splice(i, res.ci - i + 1, ...repl);
    i++;
  }
  // Unpaired delimiters become literal text (recursing into wrappers).
  (function resolve(list) {
    for (let k = 0; k < list.length; k++) {
      const nd = list[k];
      if (nd.t === 'delim') list[k] = { t: 'text', s: nd.ch.repeat(nd.n) };
      else if (nd.t === 'em' || nd.t === 'strong' || nd.t === 'del' || nd.t === 'link') resolve(nd.nodes);
    }
  })(nodes);
}

// Document-level "inside an <a> tag" state (marked's Lexer.state.
// inLink). An inline <a[space] open tag sets it; only a </a> close
// tag clears it; it is never reset between blocks. While set, bare
// (extended) autolinks never form; angle autolinks still do. Reset
// at the start of each parse() call.
let docInLink = false;

function parseInline(src, refs, noExt) {
  const nodes = [];
  let buf = '';
  // Trailing run of buf scanned as plain text (not via an escape or an
  // entity): only this run may form an email local part.
  let plainLen = 0;
  // Delimiters hidden by marked's emStrong masking stay literal.
  // A delimiter run is visible iff the masked text still holds the
  // same run at the same position.
  const masked = maskedText(src);
  const isMasked = (pos, run) => masked.slice(pos, pos + run) !== src.slice(pos, pos + run);
  const flush = () => { if (buf) { nodes.push({ t: 'text', s: buf }); buf = ''; } plainLen = 0; };
  const n = src.length;
  let i = 0;
  while (i < n) {
    const ch = src[i];
    if (ch === '\\') {
      const c2 = src[i + 1];
      plainLen = 0;
      if (c2 === '\n') {
        flush(); nodes.push({ t: 'br' }); i += 2;
        while (i < n && (src[i] === ' ' || src[i] === '\t')) i++;
        continue;
      }
      if (c2 !== undefined && isAsciiPunct(c2.charCodeAt(0))) {
        if (c2 === '&') buf += E_AMP;
        else if (c2 === '<') buf += E_LT;
        else if (c2 === '>') buf += E_GT;
        else if (c2 === '"') buf += E_QUOT;
        else if (c2 === "'") buf += E_APOS;
        else buf += c2;
        i += 2; continue;
      }
      buf += '\\'; i++; continue;
    }
    if (ch === '`') {
      let j = i;
      while (j < n && src[j] === '`') j++;
      const run = j - i;
      const close = findCodeClose(src, j, run);
      if (close < 0) { buf += src.slice(i, j); plainLen += j - i; i = j; continue; }
      let content = src.slice(j, close).replace(/\n/g, ' ');
      if (content.length >= 2 && content[0] === ' ' && content[content.length - 1] === ' ' && /[^ ]/.test(content)) {
        content = content.slice(1, -1);
      }
      flush(); nodes.push({ t: 'code', s: content });
      i = close + run; continue;
    }
    if (ch === '[') {
      const link = tryLink(src, i, refs, false);
      if (link) { flush(); nodes.push(link.node); i = link.end; continue; }
      buf += '['; plainLen++; i++; continue;
    }
    if (ch === '!' && src[i + 1] === '[') {
      const img = tryLink(src, i + 1, refs, true);
      if (img) { flush(); nodes.push(img.node); i = img.end; continue; }
      buf += '!'; plainLen++; i++; continue;
    }
    if (ch === '<') {
      const auto = tryAngleAutolink(src, i);
      if (auto) {
        flush();
        nodes.push({ t: 'link', href: auto.href, title: null, nodes: [{ t: 'text', s: auto.url }], auto: true });
        i = auto.end; continue;
      }
      const tagEnd = scanHtmlTag(src, i);
      if (tagEnd >= 0) {
        const tagSrc = src.slice(i, tagEnd);
        // An <a[space] open tag enters link state; a </a> leaves it.
        if (!docInLink && /^<a /i.test(tagSrc)) docInLink = true;
        else if (docInLink && /^<\/a>/i.test(tagSrc)) docInLink = false;
        flush(); nodes.push({ t: 'html', s: tagSrc }); i = tagEnd; continue;
      }
      buf += '<'; plainLen++; i++; continue;
    }
    if (ch === '&') {
      const num = numericEntityAt(src, i);
      if (num) { buf += num.text; plainLen = 0; i += num.len; continue; }
      const nl = namedEntityAt(src, i);
      if (nl > 0) { buf += src.slice(i, i + nl); plainLen = 0; i += nl; continue; }
      buf += '&'; plainLen++; i++; continue;
    }
    if (ch === '*' || ch === '_' || ch === '~') {
      let j = i;
      while (j < n && src[j] === ch) j++;
      const run = j - i;
      if (ch === '~' && run > 2) { buf += src.slice(i, j); plainLen += j - i; i = j; continue; }
      const prev = i > 0 ? src[i - 1] : '';
      const next = j < n ? src[j] : '';
      const left = !isSpaceCh(next) && (!isPunctCh(next) || isSpaceCh(prev) || isPunctCh(prev));
      const right = !isSpaceCh(prev) && (!isPunctCh(prev) || isSpaceCh(next) || isPunctCh(next));
      let open, close;
      if (ch === '_') {
        open = left && (!right || isPunctCh(prev));
        close = right && (!left || isPunctCh(next));
      } else { open = left; close = right; }
      if (open || close) {
        if (isMasked(i, run)) { buf += src.slice(i, j); plainLen += j - i; }
        else { flush(); nodes.push({ t: 'delim', ch, n: run, open, close, prev, next }); }
      }
      else { buf += src.slice(i, j); plainLen += j - i; }
      i = j; continue;
    }
    if (ch === '\n') {
      let k = buf.length;
      while (k > 0 && buf[k - 1] === ' ') k--;
      if (buf.length - k >= 2) {
        buf = buf.slice(0, k);
        flush(); nodes.push({ t: 'br' }); i++;
        while (i < n && (src[i] === ' ' || src[i] === '\t')) i++;
      } else { buf += '\n'; plainLen++; i++; }
      continue;
    }
    if (!noExt && !docInLink && (ch === 'h' || ch === 'H' || ch === 'f' || ch === 'F')) {
      const u = trySchemeUrl(src, i);
      if (u) {
        flush();
        nodes.push({ t: 'link', href: encodeHref(u.url), title: null, nodes: [{ t: 'text', s: u.url }], auto: true });
        i = u.end; continue;
      }
    } else if (!noExt && !docInLink && ch === 'w') {
      const u = tryWwwUrl(src, i);
      if (u) {
        flush();
        nodes.push({ t: 'link', href: encodeHref('http://' + u.url), title: null, nodes: [{ t: 'text', s: u.url }], auto: true });
        i = u.end; continue;
      }
    } else if (!noExt && !docInLink && ch === 'm') {
      const u = tryMailtoUrl(src, i);
      if (u) {
        flush();
        nodes.push({ t: 'link', href: encodeHref(u.url), title: null, nodes: [{ t: 'text', s: u.url }], auto: true });
        i = u.end; continue;
      }
    } else if (!noExt && !docInLink && ch === 'x') {
      const u = tryXmppUrl(src, i);
      if (u) {
        flush();
        nodes.push({ t: 'link', href: encodeHref(u.url), title: null, nodes: [{ t: 'text', s: u.url }], auto: true });
        i = u.end; continue;
      }
    } else if (!noExt && !docInLink && ch === '@') {
      // Look back through the current plain-text run for a local part.
      const plainStart = buf.length - plainLen;
      let k = buf.length;
      while (k > plainStart && isLocalChar(buf[k - 1])) k--;
      if (k < buf.length) {
        // A trailing _ run after the domain is masked when it is an
        // emphasis closer for an open _ delimiter in this segment.
        let mayMask = false;
        for (const nd of nodes) {
          if (nd.t === 'delim' && nd.ch === '_' && nd.open) { mayMask = true; break; }
        }
        const m = matchDomain(src, i + 1, mayMask);
        if (m) {
          const email = buf.slice(k) + src.slice(i, m.end);
          buf = buf.slice(0, k);
          flush();
          nodes.push({ t: 'link', href: 'mailto:' + email, title: null, nodes: [{ t: 'text', s: email }], auto: true });
          i = m.end; continue;
        }
      }
      buf += '@'; i++; continue;
    }
    buf += ch; plainLen++; i++;
  }
  flush();
  processEmphasis(nodes);
  return nodes;
}

function renderNodes(nodes) {
  let out = '';
  for (const nd of nodes) {
    switch (nd.t) {
      case 'text': out += escText(nd.s); break;
      case 'code': out += '<code>' + escRaw(nd.s) + '</code>'; break;
      case 'br': out += '<br>'; break;
      case 'html': out += nd.s; break;
      case 'link':
        out += '<a href="' + escText(nd.href) + '"' +
          (nd.title !== null ? ' title="' + escText(nd.title) + '"' : '') +
          '>' + renderNodes(nd.nodes) + '</a>';
        break;
      case 'img':
        out += '<img src="' + escText(nd.src) + '" alt="' + escText(nd.alt) + '"' +
          (nd.title !== null ? ' title="' + escText(nd.title) + '"' : '') + '>';
        break;
      case 'em': out += '<em>' + renderNodes(nd.nodes) + '</em>'; break;
      case 'strong': out += '<strong>' + renderNodes(nd.nodes) + '</strong>'; break;
      case 'del': out += '<del>' + renderNodes(nd.nodes) + '</del>'; break;
    }
  }
  return out;
}

function plainNodes(nodes) {
  let out = '';
  for (const nd of nodes) {
    switch (nd.t) {
      case 'text': out += plainOf(nd.s); break;
      case 'code': out += nd.s; break;
      case 'br': break;
      case 'html': out += nd.s; break;
      case 'link': out += plainNodes(nd.nodes); break;
      case 'img': out += nd.alt; break;
      case 'em': case 'strong': case 'del': out += plainNodes(nd.nodes); break;
    }
  }
  return out;
}

// ------------------------------------------------------------------
// Block parsing: line helpers and block-start matchers
//
// A line is {t, lz, oi, col}: t is the text, lz marks a lazy
// continuation candidate, oi is the index in the outer array, and col
// is the column of t[0] in the original document line (tabs expand to
// multiples of 4 from the line start, so a stripped prefix must keep
// the remaining text's column or later indent math goes wrong).
// ------------------------------------------------------------------

function isBlankLine(s) {
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== ' ' && s[i] !== '\t') return false;
  }
  return true;
}

// Columns and chars of the leading whitespace, counting from col0.
function indentOf(s, col0 = 0) {
  let col = col0, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { col++; i++; }
    else if (c === '\t') { col += 4 - (col % 4); i++; }
    else break;
  }
  return { cols: col - col0, chars: i };
}

// Remove up to n columns of leading whitespace (counting from col0).
// A partially consumed tab leaves spaces behind. Returns the rest and
// its column.
function stripCols(s, n, col0 = 0) {
  let col = col0, i = 0;
  while (i < s.length && col - col0 < n) {
    const c = s[i];
    if (c === ' ') { col++; i++; }
    else if (c === '\t') {
      const next = col + 4 - (col % 4);
      if (next - col0 <= n) { col = next; i++; }
      else return { s: ' '.repeat(next - (col0 + n)) + s.slice(i + 1), col: col0 + n };
    } else break;
  }
  return { s: s.slice(i), col };
}

// Blockquote prefix: indent <= 3, '>', one optional space (tab-aware).
// strCol is the column of rest[0] relative to the start of s itself
// (marked re-processes container inner text as a fresh string, so tab
// stops reset at the container boundary, not at the original line).
function matchQuotePrefix(s, col0 = 0) {
  const ind = indentOf(s, col0);
  if (ind.cols > 3 || s[ind.chars] !== '>') return null;
  const afterGt = ind.chars + 1;
  const gtCol = col0 + ind.cols + 1;
  if (s[afterGt] === ' ') return { rest: s.slice(afterGt + 1), col: gtCol + 1, strCol: ind.cols + 2 };
  if (s[afterGt] === '\t') {
    // The tab after '>' expands relative to the inner string (fresh
    // string, tab stops reset at the container boundary), not the
    // original line: use ind.cols + 1 (the tab's column in s), and
    // convert the returned column back to original-line coordinates.
    const r = stripCols(s.slice(afterGt), 1, ind.cols + 1);
    return { rest: r.s, col: col0 + r.col, strCol: r.col };
  }
  return { rest: s.slice(afterGt), col: gtCol, strCol: ind.cols + 1 };
}

function matchAtx(s, col0 = 0) {
  const ind = indentOf(s, col0);
  if (ind.cols > 3) return null;
  let j = ind.chars, hashes = 0;
  while (s[j] === '#') { hashes++; j++; }
  if (hashes === 0 || hashes > 6) return null;
  if (j < s.length && s[j] !== ' ' && s[j] !== '\t') return null;
  let rest = s.slice(j).replace(/[ \t]+$/, '');
  const m = /[ \t]+#+$/.exec(rest);
  if (m) rest = rest.slice(0, m.index);
  return { level: hashes, text: rest.replace(/^[ \t]+/, '').replace(/[ \t]+$/, '') };
}

function matchFence(s, col0 = 0) {
  const ind = indentOf(s, col0);
  if (ind.cols > 3) return null;
  const c = s[ind.chars];
  if (c !== '`' && c !== '~') return null;
  let j = ind.chars;
  while (s[j] === c) j++;
  const len = j - ind.chars;
  if (len < 3) return null;
  const info = s.slice(j);
  if (c === '`' && info.indexOf('`') >= 0) return null;
  return { ch: c, len, indent: ind.cols, indentChars: ind.chars, info };
}

function matchHr(s, col0 = 0) {
  const ind = indentOf(s, col0);
  if (ind.cols > 3) return null;
  const t = s.slice(ind.chars);
  const c = t[0];
  if (c !== '-' && c !== '*' && c !== '_') return null;
  let count = 0, j = 0;
  while (j < t.length) {
    const ch = t[j];
    if (ch === c) { count++; j++; }
    else if (ch === ' ' || ch === '\t') j++;
    else return null;
  }
  return count >= 3;
}

function matchSetext(s, col0 = 0) {
  const ind = indentOf(s, col0);
  if (ind.cols > 3) return null;
  const t = s.slice(ind.chars);
  if (/^=+[ \t]*$/.test(t)) return { level: 1 };
  if (/^-+[ \t]*$/.test(t)) return { level: 2 };
  return null;
}

// List marker at a line start. Returns null when there is none.
// rest is the text after the indent, restCol its column.
function matchListMarker(s, col0 = 0) {
  const ind = indentOf(s, col0);
  if (ind.cols > 3) return null;
  const rest = s.slice(ind.chars);
  const c = rest[0];
  if (c === '-' || c === '+' || c === '*') {
    const c2 = rest[1];
    if (c2 !== undefined && c2 !== ' ' && c2 !== '\t') return null;
    return { type: 'bullet', char: c, markerLen: 1, ind: ind.cols, rest, restCol: col0 + ind.cols };
  }
  let j = 0;
  while (j < rest.length && j < 9 && rest[j] >= '0' && rest[j] <= '9') j++;
  if (j === 0) return null;
  const d = rest[j];
  if (d !== '.' && d !== ')') return null;
  const c2 = rest[j + 1];
  if (c2 !== undefined && c2 !== ' ' && c2 !== '\t') return null;
  return { type: 'ordered', delim: d, num: parseInt(rest.slice(0, j), 10), markerLen: j + 1, ind: ind.cols, rest, restCol: col0 + ind.cols };
}

// Content indent of a list item (columns from the line start, i.e.
// relative to col0).
function computeContentIndent(m) {
  const markerCol = m.restCol + m.markerLen;
  let col = markerCol, p = m.markerLen;
  const rest = m.rest;
  while (p < rest.length && (rest[p] === ' ' || rest[p] === '\t')) {
    if (rest[p] === ' ') { col++; p++; }
    else { col += 4 - (col % 4); p++; }
  }
  if (p === rest.length) return { contentIndent: markerCol + 1 - (m.restCol - m.ind), empty: true };
  const spaces = col - markerCol;
  if (spaces >= 5) return { contentIndent: markerCol + 1 - (m.restCol - m.ind), empty: false };
  return { contentIndent: col - (m.restCol - m.ind), empty: false };
}

const BLOCK_TAGS = new Set(['address', 'article', 'aside', 'base', 'basefont', 'blockquote', 'body', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dialog', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'iframe', 'legend', 'li', 'link', 'main', 'menu', 'menuitem', 'nav', 'noframes', 'ol', 'optgroup', 'option', 'p', 'param', 'section', 'source', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul']);

// HTML block type at a line start (indent <= 3). Types 1-7.
function htmlBlockType(s, col0 = 0) {
  const ind = indentOf(s, col0);
  if (ind.cols > 3) return null;
  const t = s.slice(ind.chars);
  if (t[0] !== '<') return null;
  const lower = t.slice(0, 12).toLowerCase();
  for (const name of ['pre', 'script', 'style', 'textarea']) {
    if (lower.startsWith('<' + name)) {
      const c = t[1 + name.length];
      if (c === undefined || c === ' ' || c === '\t' || c === '\n' || c === '>') {
        return { type: 1, endTag: '</' + name };
      }
    }
  }
  if (t.startsWith('<!--')) return { type: 2, end: '-->' };
  if (t.startsWith('<?')) return { type: 3, end: '?>' };
  if (t.startsWith('<![CDATA[')) return { type: 5, end: ']]>' };
  if (t.startsWith('<!')) {
    const c = t[2];
    if (c && ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'))) return { type: 4, end: '>' };
    return null;
  }
  let j = 1;
  if (t[j] === '/') j++;
  const c0 = t.charCodeAt(j);
  if (!((c0 >= 65 && c0 <= 90) || (c0 >= 97 && c0 <= 122))) return null;
  let k = j;
  while (k < t.length) {
    const c = t.charCodeAt(k);
    if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 45) k++;
    else break;
  }
  const name = t.slice(j, k).toLowerCase();
  const after = t[k];
  if (after !== undefined && after !== ' ' && after !== '\t' && after !== '\n' && after !== '>' && after !== '/') return null;
  if (BLOCK_TAGS.has(name)) return { type: 6, name };
  const tagEnd = scanHtmlTag(t, 0);
  if (tagEnd >= 0) {
    let m = tagEnd;
    while (m < t.length && (t[m] === ' ' || t[m] === '\t')) m++;
    if (m === t.length) return { type: 7 };
  }
  return null;
}

// Does a line start a block that interrupts a paragraph?
function startsInterruptive(L, ctx) {
  const s = L.t, col = L.col;
  if (indentOf(s, col).cols > 3) return false;
  if (matchAtx(s, col)) return true;
  if (matchFence(s, col)) return true;
  const hb = htmlBlockType(s, col);
  if (hb && hb.type !== 7) return true;
  if (matchHr(s, col)) return true;
  if (matchQuotePrefix(s, col)) return true;
  const m = matchListMarker(s, col);
  if (m) {
    // Inside a list item, an ordered marker interrupts the item's
    // text for ANY number, even when empty. At the top level and in
    // a blockquote it needs number 1 and a non-empty item.
    if (m.type === 'ordered' && ctx === 'list') return true;
    const rest = s.slice(indentOf(s, col).chars + m.markerLen);
    if (rest.trim() === '') return false;
    if (m.type === 'bullet') return true;
    if (m.num === 1) return true;
  }
  return false;
}

// Link reference definition starting at lines[i]. Returns the number
// of lines consumed, or 0 when it is not a definition. Mirrors
// marked's Fe regex: the label may span lines, the destination may be
// on the next line, the title may be on the same or the next line and
// may span lines. A title with junk after it on the SAME line kills
// the definition; a title with junk on the NEXT line leaves a valid
// definition without a title (regex backtracking).
function tryParseDef(lines, i, refs) {
  const first = lines[i].t;
  const ind = indentOf(first, lines[i].col);
  if (ind.cols > 3 || first[ind.chars] !== '[') return 0;
  let text = '';
  const maxLines = Math.min(lines.length - i, 16);
  for (let k = 0; k < maxLines; k++) {
    if (k > 0) text += '\n';
    text += lines[i + k].t;
  }
  // Lines consumed when the definition ends at text offset e (e is at
  // a newline or at the end of the window).
  const linesUpTo = (e) => {
    let n = 0;
    for (let x = 0; x < e && x < text.length; x++) if (text[x] === '\n') n++;
    return n + 1;
  };
  // --- label: no unescaped [ or ] inside, may span lines but never
  // across a blank line, never whitespace-only.
  let q = ind.chars + 1, labelEnd = -1;
  while (q < text.length) {
    const c = text[q];
    if (c === '\\') { q += 2; continue; }
    if (c === '[') return 0;
    if (c === ']') { labelEnd = q; break; }
    if (c === '\n') {
      let r = q + 1;
      while (r < text.length && (text[r] === ' ' || text[r] === '\t')) r++;
      if (r >= text.length || text[r] === '\n') return 0;
    }
    q++;
  }
  if (labelEnd < 0) return 0;
  const labelRaw = text.slice(ind.chars + 1, labelEnd);
  if (!labelRaw || /^\s*$/.test(labelRaw) || labelRaw.length > 999) return 0;
  const label = normalizeLabel(labelRaw);
  if (text[labelEnd + 1] !== ':') return 0;
  // --- destination: spaces, then optionally one newline + spaces.
  let r = labelEnd + 2;
  while (r < text.length && (text[r] === ' ' || text[r] === '\t')) r++;
  if (text[r] === '\n') {
    let s = r + 1;
    while (s < text.length && (text[s] === ' ' || text[s] === '\t')) s++;
    if (s >= text.length || text[s] === '\n') return 0;
    r = s;
  }
  const d = parseDest(text, r);
  if (!d) return 0;
  // --- optional title, preceded by whitespace (spaces, or a newline
  // plus spaces). No whitespace before a quote/paren means no title.
  let w = d.end, hasWs = false, titleNextLine = false;
  while (w < text.length && (text[w] === ' ' || text[w] === '\t')) { w++; hasWs = true; }
  if (text[w] === '\n') {
    titleNextLine = true;
    let w2 = w + 1;
    while (w2 < text.length && (text[w2] === ' ' || text[w2] === '\t')) w2++;
    if (w2 < text.length && text[w2] !== '\n') { w = w2; hasWs = true; }
  }
  if (hasWs && (text[w] === '"' || text[w] === "'" || text[w] === '(')) {
    const t = parseTitle(text, w);
    if (t) {
      let e = t.end;
      while (e < text.length && (text[e] === ' ' || text[e] === '\t')) e++;
      if (e >= text.length || text[e] === '\n') {
        if (!refs.has(label)) refs.set(label, { dest: d.dest, title: t.title });
        return linesUpTo(e);
      }
      // Junk after the title: kills the definition when the title is
      // on the same line as the destination; otherwise the definition
      // stands without the title.
      if (!titleNextLine) return 0;
    } else if (!titleNextLine) {
      return 0;
    }
    // Title on the next line failed: fall through to the no-title case.
  }
  // --- no title: only spaces/tabs may follow on the destination line.
  let e = d.end;
  while (e < text.length && (text[e] === ' ' || text[e] === '\t')) e++;
  if (e >= text.length || text[e] === '\n') {
    if (!refs.has(label)) refs.set(label, { dest: d.dest, title: null });
    return linesUpTo(e);
  }
  return 0;
}

// ------------------------------------------------------------------
// Block parsers. Blocks are raw trees here; inline rendering happens
// only after the whole document is parsed, so that link reference
// definitions found later in the document resolve forward references.
// ------------------------------------------------------------------

// Split a table row on unescaped '|', keeping the edge cells.
function splitTableRow(s) {
  const cells = [];
  let cur = '', i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length) {
      if (s[i + 1] === '|') { cur += '|'; i += 2; continue; }
      cur += c + s[i + 1]; i += 2; continue;
    }
    if (c === '|') { cells.push(cur); cur = ''; i++; continue; }
    cur += c; i++;
  }
  cells.push(cur);
  return cells;
}

// A row's cells, dropping whitespace-only edge cells from a leading
// or trailing pipe.
function tableCells(s) {
  const parts = splitTableRow(s);
  if (parts.length && parts[0].trim() === '') parts.shift();
  if (parts.length && parts[parts.length - 1].trim() === '') parts.pop();
  return parts;
}

// Try to build a table whose header is `headerText` and whose
// delimiter row is lines[di]. Returns {block, next} or null.
function tryTable(headerText, lines, di) {
  const delim = lines[di];
  if (!delim || indentOf(delim.t, delim.col).cols > 3) return null;
  const hCells = tableCells(headerText).map((c) => c.trim());
  if (!hCells.length) return null;
  const dParts = splitTableRow(delim.t);
  if (dParts.length < 2) return null;
  const dCells = tableCells(delim.t);
  if (dCells.length !== hCells.length) return null;
  const aligns = [];
  for (const c of dCells) {
    const t = c.trim();
    if (!/^:?-+:?$/.test(t)) return null;
    aligns.push(t[0] === ':' && t[t.length - 1] === ':' ? 'center'
      : t[0] === ':' ? 'left' : t[t.length - 1] === ':' ? 'right' : null);
  }
  const rows = [];
  let j = di + 1;
  while (j < lines.length) {
    const L = lines[j];
    // marked's table body-row lookahead ends a table at a blank line
    // of spaces only (` *\n`); a whitespace-only line containing a
    // tab is a row (its cells trim to empty).
    if (/^ *$/.test(L.t)) break;
    // An indented-code line ends the table, but only when it has
    // content after the indent (a whitespace-only line with a tab is
    // a row, not code).
    if (indentOf(L.t, L.col).cols > 3 && L.t.trim() !== '') break;
    if (startsInterruptive(L)) break;
    rows.push(tableCells(L.t).map((c) => c.trim()));
    j++;
  }
  return { block: { k: 'table', header: hCells, aligns, rows }, next: j };
}

// marked's Dt(): a backtick fence strips up to its indent in leading
// whitespace CHARACTERS (a tab counts as one and is dropped whole)
// from each content line; a tilde fence strips nothing.
function fenceContentLine(s, indent) {
  let i = 0;
  while (i < s.length && i < indent && (s[i] === ' ' || s[i] === '\t')) i++;
  return s.slice(i);
}

// Expand leading tabs in s to spaces, where s starts at column col0
// (marked's J() on the whitespace after a container marker).
function expandLeadTabs(s, col0) {
  let i = 0, col = col0, out = '';
  while (i < s.length) {
    const c = s[i];
    if (c === '\t') { const w = 4 - (col % 4); out += ' '.repeat(w); col += w; i++; }
    else if (c === ' ') { out += ' '; col++; i++; }
    else break;
  }
  return out + s.slice(i);
}

function parseFenced(lines, i, f, ctx) {
  const infoTrim = f.info.replace(/^[ \t]+/, '');
  const lang = infoTrim.split(/[ \t]/)[0] || '';
  const contentLines = [];
  let j = i + 1;
  while (j < lines.length) {
    const L = lines[j];
    const ind = indentOf(L.t, L.col);
    if (ind.cols <= 3) {
      let k = ind.chars, n = 0;
      while (L.t[k] === f.ch) { n++; k++; }
      if (n >= f.len) {
        let m = k;
        while (m < L.t.length && (L.t[m] === ' ' || L.t[m] === '\t')) m++;
        if (m === L.t.length) { j++; break; }
      }
    }
    if (L.lz) {
      // In a list item, a lazy line joins the fence only when the
      // fence already has a non-blank content line before it (marked's
      // list loop breaks on a lazy line after the opener, after a
      // blank line, or when the line starts a new block). In a
      // blockquote a lazy line ends the fence (cm-237).
      const lastBlank = contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === '';
      if (ctx === 'list' && contentLines.length > 0 && !lastBlank && !lazyEndsContainer(L)) {
        contentLines.push(f.ch === '`' ? fenceContentLine(L.t, f.indentChars) : L.t);
        j++;
        continue;
      }
      break;
    }
    contentLines.push(f.ch === '`' ? fenceContentLine(L.t, f.indentChars) : L.t);
    j++;
  }
  let content = '';
  if (contentLines.length) {
    content = contentLines.join('\n');
    if (contentLines[contentLines.length - 1] !== '') content += '\n';
  }
  const langAttr = lang ? ' class="language-' + escText(unescape(lang)) + '"' : '';
  return { block: { k: 'code', h: '<pre><code' + langAttr + '>' + escRaw(content) + '</code></pre>\n' }, next: j };
}

function parseIndented(lines, i) {
  const contentLines = [];
  let j = i;
  while (j < lines.length) {
    const L = lines[j];
    if (L.lz) break;
    if (isBlankLine(L.t)) { contentLines.push(stripCols(L.t, 4, L.col).s); j++; continue; }
    if (indentOf(L.t, L.col).cols < 4) break;
    contentLines.push(stripCols(L.t, 4, L.col).s);
    j++;
  }
  while (contentLines.length && contentLines[contentLines.length - 1].trim() === '') contentLines.pop();
  let content = '';
  if (contentLines.length) {
    content = contentLines.join('\n');
    if (contentLines[contentLines.length - 1] !== '') content += '\n';
  }
  return { block: { k: 'code', h: '<pre><code>' + escRaw(content) + '</code></pre>\n' }, next: j };
}

function lineHasCloseTag(line, name) {
  const lower = line.toLowerCase();
  const needle = '</' + name;
  let from = 0;
  while (true) {
    const idx = lower.indexOf(needle, from);
    if (idx < 0) return false;
    const after = lower[idx + needle.length];
    if (after === undefined || after === ' ' || after === '\t' || after === '\n' || after === '>') return true;
    from = idx + 1;
  }
}

function parseHtmlBlock(lines, i, info, eol) {
  const consumed = [lines[i].t];
  let j = i + 1;
  if (info.type === 6 || info.type === 7) {
    while (j < lines.length && !isBlankLine(lines[j].t)) { consumed.push(lines[j].t); j++; }
  } else {
    let done;
    if (info.type === 1) done = lineHasCloseTag(lines[i].t, info.endTag.slice(2));
    else done = lines[i].t.indexOf(info.end) >= 0;
    while (!done && j < lines.length) {
      consumed.push(lines[j].t);
      if (info.type === 1) done = lineHasCloseTag(lines[j].t, info.endTag.slice(2));
      else done = lines[j].t.indexOf(info.end) >= 0;
      j++;
    }
  }
  let h = consumed.join('\n');
  const atEof = j === lines.length;
  // marked's ge(): the trailing newline survives unless the block is
  // followed by a blank line. Types 6/7 end at a blank line, and
  // their regex consumes a whitespace-only line too (ending
  // (?:\n[ \t]*)+\n), so ge() strips the newline for any blank line.
  // Types 1-5 end at a close tag, whose ending only consumes a truly
  // empty line, so a whitespace-only line still leaves the newline.
  const endsAtBlank = !atEof && (info.type === 6 || info.type === 7 ? isBlankLine(lines[j].t) : lines[j].t === '');
  if (!endsAtBlank && (!atEof || eol)) h += '\n';
  return { block: { k: 'html', h }, next: j };
}

// Does a lazy line start a block that ends a blockquote collection?
// Stricter than startsInterruptive: any list marker counts (including
// empty items and ordered items not starting at 1).
function lazyEndsContainer(L) {
  const s = L.t, col = L.col;
  if (indentOf(s, col).cols > 3) return false;
  if (matchAtx(s, col)) return true;
  if (matchFence(s, col)) return true;
  const hb = htmlBlockType(s, col);
  if (hb && hb.type !== 7) return true;
  if (matchHr(s, col)) return true;
  if (matchQuotePrefix(s, col)) return true;
  if (matchListMarker(s, col)) return true;
  return false;
}

function parseBlockquote(lines, i, refs) {
  const inner = [];
  let j = i;
  while (j < lines.length) {
    const L = lines[j];
    if (isBlankLine(L.t)) break;
    const m = matchQuotePrefix(L.t, L.col);
    if (m) { inner.push({ t: expandLeadTabs(m.rest, m.strCol), lz: false, oi: j, col: m.col }); j++; }
    else if (lazyEndsContainer(L)) break;
    else { inner.push({ t: L.t, lz: true, oi: j, col: L.col }); j++; }
  }
  const res = parseBlocks(inner, refs, false, 'quote');
  const next = res.used === inner.length ? j : inner[res.used].oi;
  return { block: { k: 'quote', blocks: res.blocks }, next };
}

// Collect one list item's lines starting at lines[j] (a marker line).
// Expand leading tabs to spaces, relative to the start of the
// string (marked's J() with e=0). Used when stripping a list item's
// content indent: marked expands the leading whitespace of each
// item line before removing the indent, so a tab that survives the
// outer levels becomes spaces, never a literal tab.
function expandLead(s) {
  let col = 0, i = 0, hasTab = false;
  while (i < s.length && (s[i] === ' ' || s[i] === '\t')) {
    if (s[i] === ' ') col++;
    else { hasTab = true; col += 4 - (col % 4); }
    i++;
  }
  if (!hasTab) return s;
  return ' '.repeat(col) + s.slice(i);
}

function collectItem(lines, j, kind, key) {
  const L0 = lines[j];
  const m = matchListMarker(L0.t, L0.col);
  const ci = computeContentIndent(m);
  let firstContent, firstCol;
  if (ci.empty) { firstContent = ''; firstCol = L0.col + ci.contentIndent; }
  else {
    const afterMarker = m.rest.slice(m.markerLen);
    const r = stripCols(afterMarker, ci.contentIndent - m.ind - m.markerLen, m.restCol + m.markerLen);
    firstContent = r.s; firstCol = r.col;
  }
  let task = false, checked = false;
  const tm = /^\[( |x|X)\][ \t]/.exec(firstContent);
  if (tm) {
    const after = firstContent.slice(4);
    if (after.trim() !== '') { task = true; checked = tm[1] !== ' '; firstContent = after; }
  }
  // Is this line a new item of the current list (same kind, same
  // bullet/delimiter, indent below the content indent, not a rule)?
  const isNewItem = (L) => {
    const nm = matchListMarker(L.t, L.col);
    return nm && nm.type === kind && (kind === 'bullet' ? nm.char === key : nm.delim === key)
      && nm.ind < ci.contentIndent && !matchHr(L.t, L.col);
  };
  const itemLines = [{ t: firstContent, lz: false, oi: j, col: firstCol }];
  let k = j + 1, endedBy = 'end', nextK = lines.length, looseBetween = false;
  while (k < lines.length) {
    const L = lines[k];
    if (isBlankLine(L.t)) {
      let b = k;
      while (b < lines.length && isBlankLine(lines[b].t)) b++;
      if (b >= lines.length) { nextK = lines.length; break; }
      if (isNewItem(lines[b])) {
        looseBetween = true;
        for (let x = k; x < b; x++) itemLines.push({ t: '', lz: false, oi: x, col: lines[x].col });
        endedBy = 'item'; nextK = b; break;
      }
      // An empty item ends at the first blank line.
      if (itemLines.length === 1 && itemLines[0].t === '') { nextK = k; break; }
      if (indentOf(lines[b].t, lines[b].col).cols >= ci.contentIndent) {
        for (let x = k; x < b; x++) itemLines.push({ t: '', lz: false, oi: x, col: lines[x].col });
        k = b; continue;
      }
      nextK = k; break;
    }
    if (isNewItem(L)) { endedBy = 'item'; nextK = k; break; }
    // A marker of a different kind/character/delimiter (or a rule that
    // looks like a marker) ends the list.
    const nm = matchListMarker(L.t, L.col);
    if (nm && nm.ind < ci.contentIndent) { nextK = k; break; }
    // Leading tabs are expanded to spaces (relative to the line
    // start) before the content indent is removed, as marked does.
    const expanded = expandLead(L.t);
    if (indentOf(expanded, 0).cols >= ci.contentIndent) {
      itemLines.push({ t: expanded.slice(ci.contentIndent), lz: false, oi: k, col: L.col + ci.contentIndent });
      k++; continue;
    }
    itemLines.push({ t: L.t, lz: true, oi: k, col: L.col });
    k++;
  }
  return { itemLines, nextK, endedBy, looseBetween, task, checked };
}

function parseList(lines, i, refs) {
  const first = matchListMarker(lines[i].t, lines[i].col);
  const kind = first.type;
  const key = kind === 'bullet' ? first.char : first.delim;
  const items = [];
  let j = i, loose = false, end = lines.length;
  while (true) {
    const it = collectItem(lines, j, kind, key);
    const res = parseBlocks(it.itemLines, refs, false, 'list');
    if (res.sep) loose = true;
    if (it.looseBetween) loose = true;
    items.push({ blocks: res.blocks, task: it.task, checked: it.checked });
    if (res.used < it.itemLines.length) { end = it.itemLines[res.used].oi; break; }
    if (it.endedBy === 'item') { j = it.nextK; continue; }
    end = it.nextK; break;
  }
  return {
    block: {
      k: 'list', tag: kind === 'bullet' ? 'ul' : 'ol',
      start: kind === 'ordered' ? first.num : 1, loose, items,
    },
    next: end,
  };
}

function parseParagraph(lines, i, refs, ctx, eol) {
  // Marked keeps the first line's leading spaces: the paragraph text
  // is the raw line.
  const paraLines = [lines[i].t];
  let j = i + 1, heading = null;
  while (j < lines.length) {
    const L = lines[j];
    if (isBlankLine(L.t)) {
      // A whitespace-only line is a paragraph continuation only when
      // it is the last line, it actually contains whitespace (an empty
      // line never continues a paragraph), and no newline follows it.
      if (L.t.length > 0 && j === lines.length - 1 && !eol) { paraLines.push(L.t); j++; continue; }
      break;
    }
    if (L.lz) {
      if (startsInterruptive(L, ctx)) break;
      if (paraLines.length === 1) {
        const tb = tryTable(paraLines[0], lines, j);
        if (tb) return tb;
      }
      let lt = L.t;
      const prevLazy = j > 0 && lines[j - 1].lz;
      const se2 = matchSetext(L.t, L.col);
      if (ctx === 'quote' && se2 && prevLazy) {
        // Lazy setext line after a lazy line: 4 spaces replace the
        // leading 0-3 spaces (a leading tab does not match).
        lt = '    ' + L.t.replace(/^ {0,3}/, '');
      } else if (indentOf(L.t, L.col).cols >= 4 && (ctx === 'list' || !prevLazy)) {
        // Indented lazy line merges into the paragraph as code
        // content: strip 4 columns. In a blockquote only at the start
        // of a chunk; in a list item always.
        lt = stripCols(L.t, 4, L.col).s;
      }
      paraLines.push(lt);
      j++; continue;
    }
    const se = matchSetext(L.t, L.col);
    if (se) { heading = se; j++; break; }
    if (paraLines.length === 1) {
      const tb = tryTable(paraLines[0], lines, j);
      if (tb) return tb;
    }
    if (startsInterruptive(L, ctx)) break;
    paraLines.push(L.t);
    j++;
  }
  const text = paraLines.join('\n');
  if (heading) {
    return { block: { k: 'h', level: heading.level, text: text.replace(/^[ \t]+/, '').replace(/[ \t]+$/, '') }, next: j };
  }
  return { block: { k: 'p', text }, next: j };
}

function parseBlocks(lines, refs, eol = false, ctx = 'top') {
  const blocks = [];
  let i = 0, sep = false, seenBlock = false, pendingBlank = false;
  while (i < lines.length) {
    const L = lines[i];
    if (isBlankLine(L.t)) { pendingBlank = true; i++; continue; }
    if (L.lz) break;
    const used = tryParseDef(lines, i, refs);
    if (used > 0) {
      if (pendingBlank && seenBlock) sep = true;
      pendingBlank = false;
      i += used; continue;
    }
    let out = null;
    const atx = matchAtx(L.t, L.col);
    if (atx) {
      out = { block: { k: 'h', level: atx.level, text: atx.text }, next: i + 1 };
    } else {
      const fence = matchFence(L.t, L.col);
      if (fence) out = parseFenced(lines, i, fence, ctx);
      else {
        const hb = htmlBlockType(L.t, L.col);
        if (hb) out = parseHtmlBlock(lines, i, hb, eol);
        else if (matchHr(L.t, L.col)) out = { block: { k: 'hr', h: '<hr>\n' }, next: i + 1 };
        else if (matchQuotePrefix(L.t, L.col)) out = parseBlockquote(lines, i, refs);
        else if (matchListMarker(L.t, L.col)) out = parseList(lines, i, refs);
        else {
          const tb = i + 1 < lines.length ? tryTable(L.t, lines, i + 1) : null;
          if (tb) out = tb;
          else if (indentOf(L.t, L.col).cols >= 4) out = parseIndented(lines, i);
          else out = parseParagraph(lines, i, refs, ctx, eol);
        }
      }
    }
    if (pendingBlank && seenBlock) sep = true;
    pendingBlank = false;
    seenBlock = true;
    blocks.push(out.block);
    i = out.next;
  }
  return { blocks, used: i, sep };
}

// ------------------------------------------------------------------
// Rendering (runs after the whole document is parsed, so every link
// reference definition is known)
// ------------------------------------------------------------------

function renderBlock(b, refs) {
  switch (b.k) {
    case 'p':
      return '<p>' + renderNodes(parseInline(b.text, refs)) + '</p>\n';
    case 'h':
      return '<h' + b.level + '>' + renderNodes(parseInline(b.text, refs)) + '</h' + b.level + '>\n';
    case 'code': case 'html': case 'hr':
      return b.h;
    case 'quote':
      return '<blockquote>\n' + (b.blocks.length ? renderBlocks(b.blocks, refs) : '') + '</blockquote>\n';
    case 'list': {
      let html = '<' + b.tag + (b.tag === 'ol' && b.start !== 1 ? ' start="' + b.start + '"' : '') + '>\n';
      for (const it of b.items) {
        html += '<li>';
        if (it.task) {
          const cb = it.checked
            ? '<input checked="" disabled="" type="checkbox"> '
            : '<input disabled="" type="checkbox"> ';
          if (it.blocks.length && it.blocks[0].k === 'p') {
            const first = renderNodes(parseInline(it.blocks[0].text, refs));
            if (!b.loose) html += cb + first;
            else html += '<p>' + cb + first + '</p>\n';
            for (let x = 1; x < it.blocks.length; x++) {
              const blk = it.blocks[x];
              if (blk.k === 'p' && !b.loose) html += renderNodes(parseInline(blk.text, refs));
              else html += renderBlock(blk, refs);
            }
          } else {
            html += cb + renderBlocks(it.blocks, refs);
          }
        } else if (!b.loose) {
          // Tight list: every paragraph child renders bare.
          for (const blk of it.blocks) {
            if (blk.k === 'p') html += renderNodes(parseInline(blk.text, refs));
            else html += renderBlock(blk, refs);
          }
        } else {
          html += renderBlocks(it.blocks, refs);
        }
        html += '</li>\n';
      }
      return html + '</' + b.tag + '>\n';
    }
    case 'table': {
      let html = '<table>\n<thead>\n<tr>\n';
      for (let c = 0; c < b.header.length; c++) {
        html += '<th' + (b.aligns[c] ? ' align="' + b.aligns[c] + '"' : '') + '>' +
          renderNodes(parseInline(b.header[c], refs)) + '</th>\n';
      }
      html += '</tr>\n</thead>\n';
      if (b.rows.length) {
        html += '<tbody>';
        for (const r of b.rows) {
          html += '<tr>\n';
          for (let c = 0; c < b.header.length; c++) {
            const txt = c < r.length ? r[c] : '';
            html += '<td' + (b.aligns[c] ? ' align="' + b.aligns[c] + '"' : '') + '>' +
              renderNodes(parseInline(txt, refs)) + '</td>\n';
          }
          html += '</tr>\n';
        }
        html += '</tbody></table>\n';
      } else {
        html += '</table>\n';
      }
      return html;
    }
  }
  return '';
}

function renderBlocks(blocks, refs) {
  let out = '';
  for (const b of blocks) out += renderBlock(b, refs);
  return out;
}

// ------------------------------------------------------------------
// Entry point
// ------------------------------------------------------------------

export function parse(src) {
  docInLink = false;
  src = String(src).replace(/\r\n?/g, '\n');
  let raw = src.split('\n');
  if (src.endsWith('\n')) raw.pop();
  const lines = raw.map((t, idx) => ({ t, lz: false, oi: idx, col: 0 }));
  const refs = new Map();
  const res = parseBlocks(lines, refs, src.endsWith('\n'));
  return renderBlocks(res.blocks, refs);
}
