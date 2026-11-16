// parse.js — dependency-free CommonMark 0.31.2 + GFM 0.29 parser.
// parse(markdown) returns the HTML marked 18.1.3 (default options) returns.
// Written from the CommonMark/GFM specs and the practice input/output pairs.
const ENTITIES = {
quot:'"',amp:'&',apos:"'",lt:'<',gt:'>',nbsp:' ',iexcl:'¡',cent:'¢',pound:'£',curren:'¤',yen:'¥',brvbar:'¦',sect:'§',uml:'¨',copy:'©',ordf:'ª',laquo:'«',not:'¬',shy:'­',reg:'®',macr:'¯',deg:'°',plusmn:'±',sup2:'²',sup3:'³',acute:'´',micro:'µ',para:'¶',middot:'·',cedil:'¸',sup1:'¹',ordm:'º',raquo:'»',frac14:'¼',frac12:'½',frac34:'¾',iquest:'¿',
Agrave:'À',Aacute:'Á',Acirc:'Â',Atilde:'Ã',Auml:'Ä',Aring:'Å',AElig:'Æ',Ccedil:'Ç',Egrave:'È',Eacute:'É',Ecirc:'Ê',Euml:'Ë',Igrave:'Ì',Iacute:'Í',Icirc:'Î',Iuml:'Ï',ETH:'Ð',Ntilde:'Ñ',Ograve:'Ò',Oacute:'Ó',Ocirc:'Ô',Otilde:'Õ',Ouml:'Ö',times:'×',Oslash:'Ø',Ugrave:'Ù',Uacute:'Ú',Ucirc:'Û',Uuml:'Ü',Yacute:'Ý',THORN:'Þ',szlig:'ß',agrave:'à',aacute:'á',acirc:'â',atilde:'ã',auml:'ä',aring:'å',aelig:'æ',ccedil:'ç',egrave:'è',eacute:'é',ecirc:'ê',euml:'ë',igrave:'ì',iacute:'í',icirc:'î',iuml:'ï',eth:'ð',ntilde:'ñ',ograve:'ò',oacute:'ó',ocirc:'ô',otilde:'õ',ouml:'ö',divide:'÷',oslash:'ø',ugrave:'ù',uacute:'ú',ucirc:'û',uuml:'ü',yacute:'ý',thorn:'þ',yuml:'ÿ',
Amacr:'Ā',amacr:'ā',Abreve:'Ă',abreve:'ă',Aogon:'Ą',aogon:'ą',Cacute:'Ć',cacute:'ć',Ccaron:'Č',ccaron:'č',Dcaron:'Ď',dcaron:'ď',Emacr:'Ē',emacr:'ē',Edot:'Ė',edot:'ė',Eogon:'Ę',eogon:'ę',Ecaron:'Ě',ecaron:'ě',Gbreve:'Ğ',gbreve:'ğ',Gdot:'Ġ',gdot:'ġ',Hcirc:'Ĥ',hcirc:'ĥ',Hstrok:'Ħ',hstrok:'ħ',Idot:'İ',Imacr:'Ī',imacr:'ī',Iogon:'Į',iogon:'į',IJlig:'Ĳ',ijlig:'ĳ',Jcirc:'Ĵ',jcirc:'ĵ',Lacute:'Ĺ',lacute:'ĺ',Lcaron:'Ľ',lcaron:'ľ',Lmidot:'Ŀ',lmidot:'ŀ',Lstrok:'Ł',lstrok:'ł',Nacute:'Ń',nacute:'ń',Ncaron:'Ň',ncaron:'ň',Ncedil:'Ņ',ncedil:'ņ',Odblac:'Ő',odblac:'ő',OElig:'Œ',oelig:'œ',Racute:'Ŕ',racute:'ŕ',Rcaron:'Ř',rcaron:'ř',Rcedil:'Ŗ',rcedil:'ŗ',Sacute:'Ś',sacute:'ś',Scirc:'Ŝ',scirc:'ŝ',Scedil:'Ş',scedil:'ş',Scaron:'Š',scaron:'š',Tcaron:'Ť',tcaron:'ť',Tcedil:'Ţ',tcedil:'ţ',Tstrok:'Ŧ',tstrok:'ŧ',Ubreve:'Ŭ',ubreve:'ŭ',Uring:'Ů',uring:'ů',Udblac:'Ű',udblac:'ű',Uogon:'Ų',uogon:'ų',Wcirc:'Ŵ',wcirc:'ŵ',Ycirc:'Ŷ',ycirc:'ŷ',Yuml:'Ÿ',Zacute:'Ź',zacute:'ź',Zdot:'Ż',zdot:'ż',Zcaron:'Ž',zcaron:'ž',fnof:'ƒ',
Alpha:'Α',Beta:'Β',Gamma:'Γ',Delta:'Δ',Epsilon:'Ε',Zeta:'Ζ',Eta:'Η',Theta:'Θ',Iota:'Ι',Kappa:'Κ',Lambda:'Λ',Mu:'Μ',Nu:'Ν',Xi:'Ξ',Omicron:'Ο',Pi:'Π',Rho:'Ρ',Sigma:'Σ',Tau:'Τ',Upsilon:'Υ',Phi:'Φ',Chi:'Χ',Psi:'Ψ',Omega:'Ω',alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',zeta:'ζ',eta:'η',theta:'θ',iota:'ι',kappa:'κ',lambda:'λ',mu:'μ',nu:'ν',xi:'ξ',omicron:'ο',pi:'π',rho:'ρ',sigmaf:'ς',sigma:'σ',tau:'τ',upsilon:'υ',phi:'φ',chi:'χ',psi:'ψ',omega:'ω',thetasym:'ϑ',upsih:'ϒ',piv:'ϖ',Gammad:'Ϝ',gammad:'ϝ',varkappa:'ϰ',varphi:'ϕ',varrho:'ϱ',varsigma:'ϱ',varpi:'ϖ',
ensp:' ',emsp:' ',thinsp:' ',zwnj:'‌',zwj:'‍',lrm:'‎',rlm:'‏',ndash:'–',mdash:'—',lsquo:'‘',rsquo:'’',sbquo:'‚',ldquo:'“',rdquo:'”',bdquo:'„',dagger:'†',Dagger:'‡',permil:'‰',lsaquo:'‹',rsaquo:'›',euro:'€',bull:'•',hellip:'…',prime:'′',Prime:'″',oline:'‾',frasl:'⁄',weierp:'℘',image:'ℑ',real:'ℜ',trade:'™',alefsym:'ℵ',larr:'←',uarr:'↑',rarr:'→',darr:'↓',harr:'↔',crarr:'↵',lArr:'⇐',uArr:'⇑',rArr:'⇒',dArr:'⇓',hArr:'⇔',forall:'∀',part:'∂',exist:'∃',empty:'∅',nabla:'∇',isin:'∈',notin:'∉',ni:'∋',prod:'∏',sum:'∑',minus:'−',lowast:'∗',radic:'√',prop:'∝',infin:'∞',ang:'∠',and:'∧',or:'∨',cap:'∩',cup:'∪',int:'∫',there4:'∴',sim:'∼',cong:'≅',asymp:'≈',ne:'≠',equiv:'≡',le:'≤',ge:'≥',sub:'⊂',sup:'⊃',nsub:'⊄',sube:'⊆',supe:'⊇',oplus:'⊕',otimes:'⊗',perp:'⊥',sdot:'⋅',lceil:'⌈',rceil:'⌉',lfloor:'⌊',rfloor:'⌋',lang:'⟨',rang:'⟩',loz:'◊',spades:'♠',clubs:'♣',hearts:'♥',diams:'♦',
circ:'ˆ',tilde:'˜',OElig:'Œ',oelig:'œ',Scaron:'Š',scaron:'š',Yuml:'Ÿ',HilbertSpace:'ℋ',DifferentialD:'ⅆ',ClockwiseContourIntegral:'∲',ngE:'≧̸',NotEqualTilde:'≂̸',fjlig:'fj',incare:'℅',ohm:'Ω',angst:'Å',bernou:'ℬ',Cayleys:'ℭ',Copf:'ℂ',Hopf:'ℍ',ImaginaryI:'ⅈ',Kopf:'𝕂',Mopf:'𝕄',Nopf:'ℕ',Popf:'ℙ',Qopf:'ℚ',Ropf:'ℝ',Sopf:'𝕊',Topf:'𝕋',Uopf:'𝕌',Vopf:'𝕍',Wopf:'𝕎',Xopf:'𝕏',Yopf:'𝕐',Zopf:'ℤ',ii:'ⅈ',jj:'ⅉ',beth:'ℶ',daleth:'ℸ',gimel:'ℷ',aleph:'ℵ',weierstrass:'℘',ell:'ℓ',numero:'№',copysr:'℗',planck:'ℎ',
};
// Escape text for HTML output. When encode is true, an & that starts a valid
// character reference is left as-is (marked's escape with encode).
function escapeHtml(s, encode) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '&') {
      if (encode && isEntityAt(s, i)) { out += '&'; continue; }
      out += '&amp;';
    } else if (c === '<') out += '&lt;';
    else if (c === '>') out += '&gt;';
    else if (c === '"') out += '&quot;';
    else if (c === "'") out += '&#39;';
    else out += c;
  }
  return out;
}
// Is there a *valid* (known) HTML entity at s[i]? Used for autolink ';'
// trimming; rendering preserves any &name; (see isEntityAt).
function isValidEntityAt(s, i) {
  if (s[i] !== '&') return false;
  let j = i + 1;
  if (s[j] === '#') {
    j++;
    if (s[j] === 'x' || s[j] === 'X') { j++; let n = 0; while (j < s.length && /[0-9a-fA-F]/.test(s[j])) { j++; n++; } return n > 0 && n <= 6 && s[j] === ';'; }
    let n = 0; while (j < s.length && /[0-9]/.test(s[j])) { j++; n++; }
    return n > 0 && n <= 7 && s[j] === ';';
  }
  let k = j;
  while (k < s.length && /[A-Za-z0-9]/.test(s[k])) k++;
  if (k === j || s[k] !== ';') return false;
  return Object.prototype.hasOwnProperty.call(ENTITIES, s.slice(j, k));
}
function isEntityAt(s, i) {
  // does s starting at i hold a valid named/numeric character reference?
  if (s[i] !== '&') return false;
  let j = i + 1;
  if (s[j] === '#') {
    j++;
    if (s[j] === 'x' || s[j] === 'X') { j++; let n = 0; while (j < s.length && /[0-9a-fA-F]/.test(s[j])) { j++; n++; } return n > 0 && n <= 6 && s[j] === ';'; }
    let n = 0; while (j < s.length && /[0-9]/.test(s[j])) { j++; n++; }
    return n > 0 && n <= 7 && s[j] === ';';
  }
  let k = j;
  while (k < s.length && /[A-Za-z0-9]/.test(s[k])) k++;
  if (k === j || k - j > 31 || s[k] !== ';') return false;
  // marked preserves any &name; that looks like an entity, valid or not
  return true;
}
// Decode one character reference starting at s[i] === '&'. Returns [char, endIndex]
// or null when there is no valid reference.
function decodeEntityAt(s, i) {
  if (s[i] !== '&') return null;
  let j = i + 1;
  if (s[j] === '#') {
    j++;
    let code = -1;
    if (s[j] === 'x' || s[j] === 'X') {
      j++;
      const st = j;
      while (j < s.length && /[0-9a-fA-F]/.test(s[j])) j++;
      if (j === st || j - st > 6 || s[j] !== ';') return null;
      code = parseInt(s.slice(st, j), 16);
    } else {
      const st = j;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      if (j === st || j - st > 7 || s[j] !== ';') return null;
      code = parseInt(s.slice(st, j), 10);
    }
    if (code === 0 || code > 0x10FFFF || (code >= 0xD800 && code <= 0xDFFF)) code = 0xFFFD;
    return [String.fromCodePoint(code), j + 1];
  }
  let k = j;
  while (k < s.length && /[A-Za-z0-9]/.test(s[k])) k++;
  if (k === j || k - j > 31 || s[k] !== ';') return null;
  const name = s.slice(j, k);
  if (!Object.prototype.hasOwnProperty.call(ENTITIES, name)) return null;
  return [ENTITIES[name], k + 1];
}
function decodeEntities(s) {
  if (s.indexOf('&') < 0) return s;
  let out = '', i = 0;
  while (i < s.length) {
    if (s[i] === '&') {
      const d = decodeEntityAt(s, i);
      if (d) { out += d[0]; i = d[1]; continue; }
    }
    out += s[i]; i++;
  }
  return out;
}
const ASCII_PUNCT = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
function isAsciiPunct(c) { return c !== undefined && ASCII_PUNCT.indexOf(c) >= 0; }
function isSpace(c) { return c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v'; }
function isUnicodeSpace(c) { return c !== undefined && /\s/.test(c); }
const UNICODE_PUNCT_RE = /[\p{P}\p{S}]/u;
// A Unicode punctuation character (CommonMark flanking rules): ASCII
// punctuation plus Unicode categories P and S (incl. currency symbols).
function isPunct(c) {
  if (c === undefined) return false;
  return UNICODE_PUNCT_RE.test(c);
}
function isLetter(c) { return c !== undefined && /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/.test(c); }
// Unicode-aware label fold for link reference labels (CommonMark case folding).
function foldLabel(s) {
  return s.toLowerCase()
    .replace(/ß/g, 'ss').replace(/ẞ/g, 'ss')
    .replace(/ﬀ/g, 'ff').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
    .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl').replace(/ﬅ/g, 'st').replace(/ﬆ/g, 'st')
    .replace(/\s+/g, ' ').trim();
}
// marked's URL cleaning: dangerous schemes are rejected (null); the rest is
// percent-encoded like encodeURI plus " \ and non-ASCII handling.
const TEXT_ENCODER = new TextEncoder();
function cleanUrl(href) {
  if (href === null || href === undefined) return null;
  let h = href;
  // strip leading C0 controls / spaces, and decode entities for the scheme check
  let t = h.replace(/^[\u0000-\u0020]+/, '');
  const decoded = decodeEntities(t);
  if (/^(?:javascript|vbscript|data):/i.test(decoded.replace(/[\u0000-\u0020]+/g, ''))) {
    if (/^data:image\/(?:png|gif|jpeg|webp|svg\+xml|bmp|avif)/i.test(decoded)) {
      // data:image/* is allowed by marked
    } else return null;
  }
  // Percent-encode the characters marked encodes; a bare '%' is left alone
  // (decodeURI would throw on it, so no decode/encode round-trip here).
  const enc = TEXT_ENCODER;
  let out = '';
  for (const ch of h) {
    const code = ch.codePointAt(0);
    if (ch === ' ') out += '%20';
    else if (ch === '\\') out += '%5C';
    else if (ch === '"') out += '%22';
    else if (ch === "'") out += '%27';
    else if (ch === '<') out += '%3C';
    else if (ch === '>') out += '%3E';
    else if (ch === '[') out += '%5B';
    else if (ch === ']') out += '%5D';
    else if (ch === '`') out += '%60';
    else if (code > 127) {
      for (const b of enc.encode(ch)) out += '%' + b.toString(16).toUpperCase().padStart(2, '0');
    } else out += ch;
  }
  return out;
}

// ---------- inline parsing ----------
function isLinkChar(c) { return c !== undefined && !isSpace(c) && c !== '\x00'; }
// Parse a link destination at s[i]. Returns [dest, end] or null.
function parseDestination(s, i) {
  const n = s.length;
  if (i >= n) return null;
  if (s[i] === '<') {
    let j = i + 1, out = '';
    while (j < n) {
      const c = s[j];
      if (c === '\n' || c === '<') return null;
      if (c === '>') return [out, j + 1];
      if (c === '\\' && j + 1 < n && isAsciiPunct(s[j + 1])) { out += s[j + 1]; j += 2; continue; }
      out += c; j++;
    }
    return null;
  }
  let j = i, parens = 0, out = '';
  while (j < n) {
    const c = s[j];
    if (isSpace(c) || c === '\x00') break;
    if (c === '(') { parens++; out += c; j++; continue; }
    if (c === ')') {
      if (parens === 0) break;
      parens--; out += c; j++; continue;
    }
    if (c === '\\' && j + 1 < n && isAsciiPunct(s[j + 1])) { out += s[j + 1]; j += 2; continue; }
    out += c; j++;
  }
  if (j === i) return null;
  return [out, j];
}
// Parse a link title at s[i] (after whitespace). Returns [title, end] or null.
function parseTitle(s, i) {
  const n = s.length;
  if (i >= n) return null;
  const q = s[i];
  if (q !== '"' && q !== "'" && q !== '(') return null;
  const close = q === '(' ? ')' : q;
  let j = i + 1, out = '';
  while (j < n) {
    const c = s[j];
    if (c === '\\' && j + 1 < n && isAsciiPunct(s[j + 1])) { out += s[j + 1]; j += 2; continue; }
    if (c === close) return [out, j + 1];
    if (q === '(' && c === '(') return null;
    out += c; j++;
  }
  return null;
}
// Skip whitespace (space, tab, newline) — returns new index.
function skipWs(s, i) { while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n')) i++; return i; }
// After a ']' at position closeIdx, try to parse an inline link "(...)".
// Returns {dest, title, end} or null.
function parseInlineLink(s, closeIdx) {
  let i = closeIdx + 1;
  if (s[i] !== '(') return null;
  i++;
  i = skipWs(s, i);
  if (s[i] === ')') return { dest: '', title: null, end: i + 1 };
  const d = parseDestination(s, i);
  if (!d) return null;
  let dest = d[0]; i = d[1];
  let title = null;
  let j = skipWs(s, i);
  if (s[j] === '"' || s[j] === "'" || s[j] === '(') {
    const t = parseTitle(s, j);
    if (!t) return null;
    title = t[0]; j = t[1];
    j = skipWs(s, j);
  }
  if (s[j] !== ')') return null;
  return { dest, title, end: j + 1 };
}
// Normalize a link label (raw bracket text) for lookup.
function normalizeLabel(raw) {
  return foldLabel(decodeEntities(raw));
}
function isSchemeChar(c) { return /[A-Za-z0-9+.-]/.test(c); }
function isEmailLocalChar(c) { return /[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]/.test(c); }
function isDomainChar(c) { return /[A-Za-z0-9-_]/.test(c); }
// Is there an unmatched '_' emphasis opener among the delimiters seen so
// far in this inline scan? A trailing '_' after an autolink is only an
// emphasis closer (and the link still forms) when such an opener exists;
// otherwise the '_' belongs to the address and invalidates it.
function hasUnderscoreOpener(delims) {
  let depth = 0;
  for (const d of delims) {
    if (d.char !== '_') continue;
    if (d.canOpen && !d.canClose) depth++;
    else if (d.canClose && !d.canOpen) { if (depth > 0) depth--; }
    else if (d.canOpen && d.canClose) { if (depth > 0) depth--; else depth++; }
  }
  return depth > 0;
}
// Adjust an email end for trailing '_'s: trim them when they are emphasis
// closers (underOpener), otherwise the email is not an autolink (-1).
function emailEnd(s, i, em, underOpener) {
  let e = em;
  while (e > i && s[e - 1] === '_') e--;
  if (e === em) return em;
  return underOpener ? e : -1;
}
// Try an extended (GFM) autolink starting at s[i]. inLink: inside a link already.
// underOpener: an unmatched '_' emphasis opener is in scope.
// Returns [href, text, end] or null. Assumes s[i] is a plausible start.
function tryExtAutolink(s, i, inLink, underOpener) {
  if (inLink) return null;
  const n = s.length;
  const prev = i > 0 ? s[i - 1] : '';
  if (i > 0 && !(isSpace(prev) || (isAsciiPunct(prev) && prev !== '.' && prev !== '/'))) return null;
  // www. autolink
  if (s.startsWith('www.', i)) {
    const m = matchDomain(s, i + 4, true);
    if (!m) return null;
    let end = truncateUnmatchedParen(s, i, m[0]);
    end = trimAutolinkEnd(s, i, end);
    if (end <= i + 4) return null;
    const text = s.slice(i, end);
    return ['http://' + text, text, end];
  }
  // scheme autolink: only http/https/ftp + '//...' and mailto/xmpp + email.
  // A bare path rest (foo:bar) is never an autolink in marked.
  if (/[A-Za-z]/.test(s[i])) {
    let j = i;
    while (j < n && isSchemeChar(s[j])) j++;
    if (j - i >= 2 && j - i <= 32 && s[j] === ':') {
      const scheme = s.slice(i, j).toLowerCase();
      const rest = matchSchemeRest(s, j + 1, scheme, underOpener);
      if (rest) {
        let end = truncateUnmatchedParen(s, i, rest);
        end = trimAutolinkEnd(s, i, end);
        if (end > j + 1) {
          const text = s.slice(i, end);
          return [text, text, end];
        }
      } else {
        // The rest looks like an email (has '@' before any '/') but the
        // email is invalid: not an autolink at all (no path fallback).
        let k = j + 1;
        while (k < n && !isSpace(s[k]) && s[k] !== '<' && s[k] !== '\x00' && s[k] !== '/') {
          if (s[k] === '@') return null;
          k++;
        }
      }
    }
    // bare email: local@domain
    const em = matchEmail(s, i);
    if (em) {
      const adj = emailEnd(s, i, em, underOpener);
      if (adj < 0) return null;
      const text = s.slice(i, adj);
      return ['mailto:' + text, text, adj];
    }
  }
  return null;
}
// Match a domain starting at i (after www.). Returns [domainEnd] or null.
// Domain: labels of [A-Za-z0-9-]+ separated by '.', final label has a letter.
function matchDomain(s, i, forWww) {
  const n = s.length;
  let j = i, lastDot = -1, hasLetter = false, labels = 0;
  while (j < n) {
    const c = s[j];
    if (isDomainChar(c)) { if (/[A-Za-z]/.test(c)) hasLetter = true; j++; continue; }
    if (c === '.') {
      if (j === i || s[j - 1] === '.' || s[j - 1] === '-') return null;
      // a dot not followed by a domain char ends the domain (trailing dot
      // is trimmed by the caller, not part of the domain)
      if (j + 1 >= n || !isDomainChar(s[j + 1])) break;
      lastDot = j; labels++; j++; continue;
    }
    break;
  }
  if (j === i) return null;
  if (s[j - 1] === '.' || s[j - 1] === '-') return null;
  if (lastDot < 0) return null;
  // final label must contain a letter
  let k = lastDot + 1, letter = false;
  while (k < j) { if (/[A-Za-z]/.test(s[k])) letter = true; k++; }
  if (!letter) return null;
  // optional path: only for www. autolinks (emails never have a path)
  let end = j;
  if (forWww) {
    while (end < n) {
      const c = s[end];
      if (isSpace(c) || c === '<' || c === '\x00') break;
      end++;
    }
  }
  return [end];
}
function matchEmail(s, i) {
  const n = s.length;
  let j = i;
  while (j < n && isEmailLocalChar(s[j])) j++;
  if (j === i || s[j] !== '@') return null;
  const at = j;
  j++;
  const d = matchDomain(s, j, false);
  if (!d) return null;
  // local part must not end with '.' and must not contain '..'
  const local = s.slice(i, at);
  if (local.endsWith('.') || local.includes('..')) return null;
  return d[0];
}
// After a scheme ':', match the rest. Only two forms are autolinks in
// marked: http/https/ftp followed by '//...' and mailto/xmpp followed by
// an email. Anything else (bare path, other schemes) is not an autolink.
// A backslash anywhere in the rest invalidates the scheme autolink.
// Returns end or null.
function matchSchemeRest(s, i, scheme, underOpener) {
  const n = s.length;
  if (scheme === 'http' || scheme === 'https' || scheme === 'ftp') {
    if (s[i] !== '/' || s[i + 1] !== '/') return null;
    let j = i;
    while (j < n && !isSpace(s[j]) && s[j] !== '<' && s[j] !== '\x00') {
      if (s[j] === '\\') {
        // A trailing backslash (last URL character before a space, '<',
        // or end of input) is part of the autolink (doc-10/37/40:
        // https://...of.\ -> href ...of.%5C); a backslash in the middle
        // of the URL still invalidates the autolink.
        const nx = j + 1 < n ? s[j + 1] : '';
        if (nx === '' || isSpace(nx) || nx === '<' || nx === '\x00') { j++; break; }
        return null;
      }
      j++;
    }
    if (j === i) return null;
    return j;
  }
  if (scheme === 'mailto' || scheme === 'xmpp') {
    const em = matchEmail(s, i);
    if (!em) return null;
    let k = i;
    while (k < n && !isSpace(s[k]) && s[k] !== '<' && s[k] !== '\x00') {
      if (s[k] === '\\') return null;
      k++;
    }
    // xmpp allows one '/resource' segment after the email; mailto does not.
    if (scheme === 'xmpp' && s[em] === '/') {
      let seg = em + 1;
      while (seg < n && s[seg] !== '/' && !isSpace(s[seg]) && s[seg] !== '<' && s[seg] !== '\x00') seg++;
      if (seg > em + 1) return seg;
    }
    const adj = emailEnd(s, i, em, underOpener);
    if (adj < 0) return null;
    return adj;
  }
  return null;
}
// Trim trailing punctuation from an autolink per GFM rules.
function trimAutolinkEnd(s, start, end) {
  let e = end;
  // strip trailing ; unless it is part of a valid entity
  while (e > start) {
    const c = s[e - 1];
    if (c === ';') {
      // find the & for a possible entity; keep ';' only for a real entity,
      // otherwise drop the whole &name; (backtrack to the &)
      let k = e - 2;
      while (k >= start && /[A-Za-z0-9#]/.test(s[k])) k--;
      if (k >= start && s[k] === '&') {
        if (isValidEntityAt(s, k)) break;
        e = k; continue;
      }
      e--; continue;
    }
    if ('?!.,:;*_~'.includes(c)) { e--; continue; }
    if (c === ')') {
      // keep ) only if it closes an unmatched '(' earlier in the URL
      // (a trailing ')' that pairs with an earlier '(' stays; one that
      // follows a balanced pair is dropped). Depth never goes negative:
      // an unmatched ')' before the '(' does not cancel it.
      let depth = 0;
      for (let k = start; k < e - 1; k++) {
        if (s[k] === '(') depth++;
        else if (s[k] === ')') { if (depth > 0) depth--; }
      }
      if (depth === 0) { e--; continue; }
      break;
    }
    break;
  }
  return e;
}
// End the autolink before the first '(' that has no matching ')' later in
// the run (doc-08, gfm-625/629 pattern): an unmatched '(' terminates the
// URL. A '(' balanced by a later ')' stays. Returns the (possibly
// truncated) end.
function truncateUnmatchedParen(s, start, end) {
  let depth = 0, firstOpen = -1;
  for (let k = start; k < end; k++) {
    const c = s[k];
    if (c === '(') { if (depth === 0) firstOpen = k; depth++; }
    else if (c === ')') { if (depth > 0) { depth--; if (depth === 0) firstOpen = -1; } }
  }
  return depth > 0 && firstOpen >= 0 ? firstOpen : end;
}
// Inline HTML tag at s[i] === '<'. Returns [raw, end] or null.
function parseHtmlTag(s, i) {
  const n = s.length;
  if (s[i] !== '<') return null;
  const rest = s.slice(i);
  let m = rest.match(/^<!--(>|->|[\s\S]*?-->)/);
  if (m) return [m[0], i + m[0].length];
  m = rest.match(/^<\?[\s\S]*?\?>/);
  if (m) return [m[0], i + m[0].length];
  m = rest.match(/^<![A-Za-z][\s\S]*?>/);
  if (m) return [m[0], i + m[0].length];
  m = rest.match(/^<!\[CDATA\[[\s\S]*?\]\]>/);
  if (m) return [m[0], i + m[0].length];
  m = rest.match(/^<\/?[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z_:][A-Za-z0-9_.:-]*(?:\s*=\s*(?:[^ \t\n"'=<>`]+|'[^']*'|"[^"]*"))?)*\s*\/?>/);
  if (m) {
    // A closing tag must not carry attributes.
    if (m[0].startsWith('</') && /\s+[A-Za-z_:]/.test(m[0])) return null;
    return [m[0], i + m[0].length];
  }
  return null;
}
// Autolink <...> at s[i] === '<'. Returns [href, text, end] or null.
function parseAutolink(s, i) {
  const n = s.length;
  if (s[i] !== '<') return null;
  let j = i + 1;
  // scheme:...  (2-32 chars). The content is kept raw (no backslash
  // escape processing): backslashes are URL-encoded by cleanUrl, and a
  // '>' always closes the autolink even after a backslash.
  const sm = s.slice(i + 1).match(/^[A-Za-z][A-Za-z0-9+.-]{1,31}:/);
  if (sm) {
    let k = i + 1 + sm[0].length;
    let out = '';
    while (k < n) {
      if (s[k] === '>' || s[k] === ' ' || s[k] === '\n' || s[k] === '<') break;
      out += s[k]; k++;
    }
    if (k < n && s[k] === '>' && out.length > 0) {
      const href = sm[0] + out;
      return [href, href, k + 1];
    }
    return null;
  }
  // email: local@domain
  const em = matchEmail(s, i + 1);
  if (em) {
    if (s[em] === '>') {
      const text = s.slice(i + 1, em);
      return ['mailto:' + text, text, em + 1];
    }
    return null;
  }
  return null;
}

// ---------- inline scanner ----------
function flanking(text, i, len) {
  const prev = i > 0 ? text[i - 1] : undefined;
  const next = i + len < text.length ? text[i + len] : undefined;
  // Start/end of string counts as whitespace for flanking (so '_' can
  // open at the start and close at the end).
  const prevWs = prev === undefined || isUnicodeSpace(prev);
  const nextWs = next === undefined || isUnicodeSpace(next);
  const prevP = prev !== undefined && isPunct(prev);
  const nextP = next !== undefined && isPunct(next);
  const left = !nextWs && (!nextP || prevWs || prevP);
  const right = !prevWs && (!prevP || nextWs || nextP);
  return [left, right];
}
function plainTextOf(nodes) {
  let out = '';
  for (const nd of nodes) {
    if (nd.t === 'text' || nd.t === 'code' || nd.t === 'raw') out += nd.s;
    else if (nd.t === 'img') out += nd.alt;
    else if (nd.children) out += plainTextOf(nd.children);
  }
  return out;
}
function renderInline(nodes) {
  let out = '';
  for (const nd of nodes) {
    if (nd.t === 'text') out += escapeHtml(nd.s);
    else if (nd.t === 'raw') out += nd.s;
    else if (nd.t === 'code') out += '<code>' + escapeHtml(nd.s) + '</code>';
    else if (nd.t === 'br') out += '<br>';
    else if (nd.t === 'html') out += nd.s;
    else if (nd.t === 'link') {
      out += '<a href="' + escapeHtml(nd.href, true) + '"';
      if (nd.title !== null && nd.title !== undefined) out += ' title="' + escapeHtml(nd.title, true) + '"';
      out += '>' + renderInline(nd.children) + '</a>';
    } else if (nd.t === 'img') {
      out += '<img src="' + escapeHtml(nd.src, true) + '" alt="' + escapeHtml(nd.alt, true) + '"';
      if (nd.title !== null && nd.title !== undefined) out += ' title="' + escapeHtml(nd.title, true) + '"';
      out += '>';
    } else if (nd.t === 'em') out += '<em>' + renderInline(nd.children) + '</em>';
    else if (nd.t === 'strong') out += '<strong>' + renderInline(nd.children) + '</strong>';
    else if (nd.t === 'del') out += '<del>' + renderInline(nd.children) + '</del>';
  }
  return out;
}
// Scan a link text [start, end) for complete code spans (greedy, same
// length closing run). Returns [{end, inner}]: end is just past the
// closing run, inner is true when the span content holds a backtick.
// Escaped backticks do not count as runs.
function linkTextSpans(s, start, end) {
  const spans = [];
  let i = start;
  while (i < end) {
    const c = s[i];
    if (c === '\\' && i + 1 < end && isAsciiPunct(s[i + 1])) { i += 2; continue; }
    if (c === '`') {
      let j = i;
      while (j < end && s[j] === '`') j++;
      const run = j - i;
      let k = j, found = -1;
      while (k < end) {
        if (s[k] === '`') {
          let e = k;
          while (e < end && s[e] === '`') e++;
          if (e - k === run) { found = k; break; }
          k = e;
        } else if (s[k] === '\\' && k + 1 < end && isAsciiPunct(s[k + 1])) k += 2;
        else k++;
      }
      if (found >= 0) {
        spans.push({ end: found + run, inner: s.slice(j, found).indexOf('`') >= 0 });
        i = found + run;
        continue;
      }
      i = j; continue;
    }
    i++;
  }
  return spans;
}
// True when [start, end) holds an odd number of exactly-two-backtick runs
// (skipping escaped backticks): one `` run is unmatched, i.e. it does not
// close a code span inside the range (doc-09/28/35).
function hasUnmatchedDoubleBt(s, start, end) {
  let n = 0, i = start;
  while (i < end) {
    const c = s[i];
    if (c === '\\' && i + 1 < end && isAsciiPunct(s[i + 1])) { i += 2; continue; }
    if (c === '`') {
      let j = i;
      while (j < end && s[j] === '`') j++;
      if (j - i === 2) n++;
      i = j; continue;
    }
    i++;
  }
  return n % 2 === 1;
}
// Count backtick runs in [start, end), skipping escaped backticks.
function countBtRuns(s, start, end) {
  let n = 0, i = start;
  while (i < end) {
    const c = s[i];
    if (c === '\\' && i + 1 < end && isAsciiPunct(s[i + 1])) { i += 2; continue; }
    if (c === '`') {
      n++;
      while (i < end && s[i] === '`') i++;
      continue;
    }
    i++;
  }
  return n;
}
// Is there a ')' on the same line at or after pos? (An inline-link
// attempt whose paren group is closed but invalid deactivates the
// emphasis delimiters inside its bracket text.)
function hasClosingParenOnLine(s, pos) {
  let i = pos;
  while (i < s.length && s[i] !== '\n') {
    if (s[i] === ')') return true;
    i++;
  }
  return false;
}
// Deactivate emphasis delimiters added after the bracket at bi whose
// nodes are direct children of the same parent as the bracket node
// (i.e. inside the bracket text). Their '*'/'_' stay literal.
function deactivateEmphasisAfter(delims, bi, b) {
  for (let k = bi + 1; k < delims.length; k++) {
    const d = delims[k];
    if (d.char !== '[' && d.node && d.node.parent === b.node.parent) d.active = false;
  }
}
// Raw bracket matching: index of the ']' closing the bracket whose
// content starts at start (ignores backticks, counts nested brackets).
function findBracketClose(s, start) {
  let depth = 0;
  let i = start;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === '\\' && i + 1 < n) { i += 2; continue; }
    if (c === '[') depth++;
    else if (c === ']') {
      if (depth === 0) return i;
      depth--;
    }
    i++;
  }
  return -1;
}
// Convert tentative autolinks (formed by rescanBracketAutolinks inside a
// failed bracket) back to plain text when a link forms around them: a
// link's text never holds autolinks (doc-39/N3). Runs on the children
// collected by a forming link; recurses into nested links.
function detentativize(children, parent) {
  for (let k = 0; k < children.length; k++) {
    const ch = children[k];
    if (ch.t === 'link' && ch._tentative) {
      const s = ch.children.length > 0 && ch.children[0].t === 'text' ? ch.children[0].s : '';
      children.splice(k, 1, { t: 'text', s, parent });
    } else if (ch.children) detentativize(ch.children, ch);
  }
}
// Re-scan a bracket that failed to form a link for extended autolinks
// (doc-39). While the bracket was open, tryExtAutolink was suppressed
// inside it (inLink), but a failed bracket is literal text, so autolinks
// inside it still form in marked. Only plain text nodes are split;
// code spans, formed links/images, tags, entities and hard breaks are
// barriers (an autolink never spans them). Delimiter runs (`*`/`_`/`~`
// and `[`) are part of the scanned text (a URL may contain `_`) but are
// never split: an autolink covering a delimiter is allowed only when the
// delimiter cannot pair as emphasis — inert runs are absorbed into the
// URL; a live run is absorbed only when no opener of the same char is
// pending before the URL (otherwise the URL ends before it, as in
// marked: the run closes the pending emphasis instead, P7/P8/P12).
// Autolinks formed here are marked tentative: if a later bracket forms
// a link containing one, detentativize() turns it back into plain text.
// `nodes` is the root children array (mutated in place); `b` is the
// failed bracket's delimiter entry; `delims` is the live delimiter
// stack (mutated only by removing absorbed inert entries).
function rescanBracketAutolinks(nodes, b, delims, root) {
  const bIdx = nodes.indexOf(b.node);
  if (bIdx < 0) return;
  const kids = nodes.slice(bIdx + 1);
  if (kids.length === 0) return;
  let nodePos = null; // node -> index in nodes (built lazily: only a
  // live delimiter inside a candidate URL needs it)
  const getNodePos = () => {
    if (!nodePos) {
      nodePos = new Map();
      for (let k = 0; k < nodes.length; k++) nodePos.set(nodes[k], k);
    }
    return nodePos;
  };
  const delimNodeSet = new Set();
  for (const d of delims) if (d.node) delimNodeSet.add(d.node);
  const underOpener = hasUnderscoreOpener(delims);
  const isBarrier = nd => nd.t === 'code' || nd.t === 'br' || nd.t === 'link' || nd.t === 'img' || nd.t === 'html' || nd.t === 'raw';
  // Last raw char of a barrier, for the prev-char check of a URL starting
  // right after it. A formed link/image ends in ')' or ']' (both punct,
  // so ')' stands for both); a code span ends in '`'; a hard break in a
  // newline; a tag/entity in its last char.
  const barrierPrev = nd => {
    if (nd.t === 'code') return '`';
    if (nd.t === 'br') return '\n';
    if (nd.t === 'link' || nd.t === 'img') return ')';
    if (nd.t === 'html' || nd.t === 'raw') return nd.s.length > 0 ? nd.s[nd.s.length - 1] : '>';
    return ' ';
  };
  // Is there a still-active opener of char `ch` pending before the node
  // at index urlIdx? Simulates the emphasis pairing balance over the
  // delimiters before the URL (same rule as hasUnderscoreOpener).
  // Delimiters whose node was collected into a link (not a root child)
  // are out of scope and never counted.
  const pendingOpener = (ch, urlIdx) => {
    let depth = 0;
    for (const d of delims) {
      if (d.char !== ch || d.active === false) continue;
      const p = getNodePos().get(d.node);
      if (p === undefined || p >= urlIdx) continue;
      if (d.canOpen && !d.canClose) depth++;
      else if (d.canClose && !d.canOpen) { if (depth > 0) depth--; }
      else if (d.canOpen && d.canClose) { if (depth > 0) depth--; else depth++; }
    }
    return depth > 0;
  };
  const absorbedNodes = [];
  const rebuilt = [];
  let seg = null; // {list, str, prev}
  const flushSegment = () => {
    if (!seg || seg.list.length === 0) { seg = null; return; }
    const list = seg.list, str = seg.str, prev = seg.prev;
    const scan = prev + str, off = 1;
    // Validate a candidate autolink range [start, end) against the
    // delimiter nodes it covers. Returns {end, href, absorbed} (end may
    // be truncated before a live delimiter with a pending opener) or
    // null when the autolink must not form.
    const adjustRange = (start, end, href) => {
      const overlapping = [];
      for (const it of list) {
        if (it.end <= start || it.start >= end) continue;
        if (it.locked) overlapping.push(it);
      }
      // A range cutting a delimiter run in half never forms.
      for (const it of overlapping) {
        if (it.start < start || it.end > end) return null;
      }
      let truncAt = -1;
      for (const it of overlapping) {
        const d = delims.find(dd => dd.node === it.nd);
        if (!d || !(d.canOpen || d.canClose)) continue;
        let urlIdx = -1;
        for (const jt of list) {
          if (jt.start <= start && start < jt.end) { urlIdx = getNodePos().get(jt.nd); break; }
        }
        if (urlIdx === undefined || urlIdx < 0) return null;
        if (pendingOpener(d.char, urlIdx)) {
          if (truncAt < 0 || it.start < truncAt) truncAt = it.start;
        }
      }
      let finalEnd = end, finalHref = href;
      if (truncAt >= 0) {
        // End the URL before that delimiter, then re-validate the
        // truncated URL with the same matcher.
        const r2 = tryExtAutolink(prev + str.slice(0, truncAt), off + start, false, underOpener);
        if (!r2) return null;
        const href2 = cleanUrl(r2[0]);
        if (href2 === null) return null;
        finalEnd = r2[2] - off;
        if (finalEnd <= start) return null;
        const text2 = str.slice(start, finalEnd);
        // Guard: a truncated URL must still have something after the
        // scheme's '//' (a bare 'https://' is not an autolink).
        const m = text2.match(/^[A-Za-z][A-Za-z0-9+.-]{1,31}:\/\//);
        if (m && finalEnd - start <= m[0].length) return null;
        if (text2.startsWith('www.') && finalEnd - start <= 4) return null;
        finalHref = href2;
      }
      // Absorbed delimiters: locked nodes fully inside [start, finalEnd).
      const absorbed = [];
      for (const it of list) {
        if (!it.locked) continue;
        if (it.start >= start && it.end <= finalEnd) absorbed.push(it.nd);
      }
      return { end: finalEnd, href: finalHref, absorbed };
    };
    const found = [];
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
        const r = tryExtAutolink(scan, off + i, false, underOpener);
        if (r) {
          const href = cleanUrl(r[0]);
          if (href !== null) {
            const adj = adjustRange(i, r[2] - off, href);
            if (adj) {
              found.push({ start: i, end: adj.end, href: adj.href, absorbed: adj.absorbed });
              i = adj.end;
              continue;
            }
          }
        }
      }
      i++;
    }
    // Rebuild the segment's nodes with the found autolinks split out.
    const emitted = new Set();
    for (const it of list) {
      if (it.locked) {
        if (!found.some(f => f.absorbed.includes(it.nd))) rebuilt.push(it.nd);
        continue;
      }
      const cuts = [it.start, it.end];
      for (const f of found) {
        if (f.start > it.start && f.start < it.end) cuts.push(f.start);
        if (f.end > it.start && f.end < it.end) cuts.push(f.end);
      }
      cuts.sort((a, b) => a - b);
      for (let j = 0; j < cuts.length - 1; j++) {
        const a = cuts[j], z = cuts[j + 1];
        if (a >= z) continue;
        const f = found.find(ff => ff.start <= a && z <= ff.end);
        if (f) {
          if (!emitted.has(f)) {
            emitted.add(f);
            const linkNd = { t: 'link', href: f.href, title: null, children: [], parent: root, _tentative: true };
            const txtNd = { t: 'text', s: str.slice(f.start, f.end), parent: linkNd };
            linkNd.children.push(txtNd);
            rebuilt.push(linkNd);
            for (const nd of f.absorbed) absorbedNodes.push(nd);
          }
        } else {
          const s = it.nd.s.slice(a - it.start, z - it.start);
          if (s.length > 0) rebuilt.push({ t: 'text', s, parent: root });
        }
      }
    }
    seg = null;
  };
  let segPrev = '['; // char before the bracket content in the raw text
  for (const nd of kids) {
    if (isBarrier(nd)) {
      flushSegment();
      rebuilt.push(nd);
      segPrev = barrierPrev(nd);
      continue;
    }
    if (!seg) seg = { list: [], str: '', prev: segPrev };
    seg.list.push({ nd, locked: delimNodeSet.has(nd), start: seg.str.length, end: seg.str.length + nd.s.length });
    seg.str += nd.s;
  }
  flushSegment();
  // Remove the absorbed delimiter entries from the live stack.
  for (const nd of absorbedNodes) {
    const di = delims.findIndex(dd => dd.node === nd);
    if (di >= 0) delims.splice(di, 1);
  }
  nodes.splice(bIdx + 1, kids.length, ...rebuilt);
}
function parseInlineNodes(text, refs, st) {
  const root = { t: 'root', children: [] };
  const nodes = root.children;
  const delims = []; // emphasis + bracket delimiters
  // A link whose text holds an unmatched `` run arms this: emphasis
  // delimiters added after the link are deactivated when the next code
  // span forms (doc-09/28/35). Cleared by that code span; later emphasis
  // is unaffected.
  let btLinkArmed = false;
  let btLinkDelims = [];
  let i = 0;
  const n = text.length;
  let textBuf = '';
  function flushText() {
    if (textBuf.length > 0) {
      const nd = { t: 'text', s: textBuf, parent: root };
      nodes.push(nd); textBuf = '';
      return nd;
    }
    return null;
  }
  function pushNode(nd) { flushText(); nd.parent = root; nodes.push(nd); return nd; }
  while (i < n) {
    const c = text[i];
    if (c === '\\') {
      if (i + 1 < n && text[i + 1] === '\n') { flushText(); pushNode({ t: 'br' }); i += 2; while (i < n && (text[i] === ' ' || text[i] === '\t')) i++; continue; }
      if (i + 1 < n && isAsciiPunct(text[i + 1])) { textBuf += text[i + 1]; i += 2; continue; }
      textBuf += '\\'; i++; continue;
    }
    if (c === '`') {
      let j = i;
      while (j < n && text[j] === '`') j++;
      const run = j - i;
      // find a matching run of exactly the same length
      let k = j, found = -1;
      while (k < n) {
        if (text[k] === '`') {
          let e = k;
          while (e < n && text[e] === '`') e++;
          if (e - k === run) { found = k; break; }
          k = e;
        } else k++;
      }
      // A backtick opener inside link text must not pair with a closer
      // beyond the link's closing ']' when the link text holds no
      // complete code span but at least two backtick runs (doc-09/28/35:
      // the link forms, the backticks stay literal). A lone backtick run
      // (cm-342/525) and link texts with a complete code span keep the
      // greedy pairing.
      if (found >= 0) {
        for (let d = delims.length - 1; d >= 0; d--) {
          if (delims[d].char === '[' && delims[d].active) {
            const cp = findBracketClose(text, delims[d].contentStart);
            if (cp >= 0 && found > cp && linkTextSpans(text, delims[d].contentStart, cp).length === 0 && countBtRuns(text, delims[d].contentStart, cp) >= 2) found = -1;
            break;
          }
        }
      }
      if (found >= 0) {
        let content = text.slice(j, found).replace(/\n/g, ' ');
        if (content.length >= 2 && content[0] === ' ' && content[content.length - 1] === ' ' && content.trim().length > 0) {
          content = content.slice(1, -1);
        }
        flushText();
        pushNode({ t: 'code', s: content });
        // A code span forming after a ``-unmatched link deactivates the
        // emphasis delimiters added after that link that are still at the
        // top level (parent root). Delimiters inside a link that formed
        // keep their emphasis (doc-35); delimiters inside a bracket that
        // failed stay top-level and are deactivated. The arming survives
        // the code span: a later emphasis is blocked by a later code span
        // (doc-09: a `deno` span before the emphasis does not disarm it).
        if (btLinkArmed) {
          for (const d of btLinkDelims) if (d.node.parent === root) d.active = false;
          btLinkDelims = [];
        }
        i = found + run;
        continue;
      }
      textBuf += text.slice(i, j); i = j; continue;
    }
    if (c === '*' || c === '_' || c === '~') {
      let j = i;
      while (j < n && text[j] === c) j++;
      const len = j - i;
      if (c === '~' && len >= 3) { textBuf += text.slice(i, j); i = j; continue; }
      const [left, right] = flanking(text, i, len);
      let canOpen, canClose;
      if (c === '_') {
        canOpen = left && (!right || isPunct(i > 0 ? text[i - 1] : undefined));
        canClose = right && (!left || isPunct(i + len < n ? text[i + len] : undefined));
      } else {
        canOpen = left; canClose = right;
      }
      flushText();
      const nd = { t: 'text', s: text.slice(i, j), parent: root };
      nodes.push(nd);
      const dd = { char: c, len, canOpen, canClose, node: nd, active: true };
      delims.push(dd);
      if (btLinkArmed && (c === '*' || c === '_')) btLinkDelims.push(dd);
      i = j; continue;
    }
    if (c === '[' || (c === '!' && text[i + 1] === '[')) {
      const isImg = c === '!';
      const s = isImg ? '![' : '[';
      flushText();
      const nd = { t: 'text', s, parent: root };
      nodes.push(nd);
      delims.push({ char: '[', node: nd, active: true, isImage: isImg, contentStart: i + s.length });
      i += s.length; continue;
    }
    if (c === ']') {
      // find nearest bracket delimiter
      let bi = -1;
      for (let k = delims.length - 1; k >= 0; k--) {
        if (delims[k].char === '[') { bi = k; break; }
      }
      if (bi < 0) { textBuf += ']'; i++; continue; }
      const b = delims[bi];
      if (!b.active) { delims.splice(bi, 1); textBuf += ']'; i++; continue; }
      // A code span containing a backtick, followed by more text in the
      // link text, blocks the link (doc-16/18/20/22/23/30). A closed
      // inline-link attempt that fails also deactivates the emphasis
      // delimiters inside the bracket text (doc-16/20/23).
      const ltSpans = linkTextSpans(text, b.contentStart, i);
      if (ltSpans.some(sp => sp.inner && sp.end < i)) {
        if (text[i + 1] === '(' && hasClosingParenOnLine(text, i + 1)) deactivateEmphasisAfter(delims, bi, b);
        delims.splice(bi, 1);
        textBuf += ']'; i++; continue;
      }
      // try to form a link/image
      let link = null, end = -1;
      const il = parseInlineLink(text, i);
      if (il) { link = { dest: il.dest, title: il.title }; end = il.end; }
      else if (text[i + 1] === '[') {
        // reference link: [label]
        let j = i + 2, depth = 0, ok = false;
        while (j < n) {
          if (text[j] === '\\' && j + 1 < n) { j += 2; continue; }
          if (text[j] === '[') depth++;
          else if (text[j] === ']') { if (depth === 0) { ok = true; break; } depth--; }
          j++;
        }
        if (ok) {
          const rawLabel = text.slice(i + 2, j);
          if (rawLabel.length === 0) {
            // collapsed: label = bracket content
            const lab = normalizeLabel(text.slice(b.contentStart, i));
            const ref = refs.get(lab);
            if (ref) { link = ref; end = j + 1; }
          } else {
            const ref = refs.get(normalizeLabel(rawLabel));
            if (ref) { link = ref; end = j + 1; }
          }
        }
      } else {
        // shortcut reference: label = bracket content
        const lab = normalizeLabel(text.slice(b.contentStart, i));
        const ref = refs.get(lab);
        if (ref) { link = ref; end = i + 1; }
      }
      if (link) {
        const href = cleanUrl(link.dest);
        if (href !== null) {
          flushText();
          // collect children: nodes after b.node up to now
          const bIdx = nodes.indexOf(b.node);
          const children = nodes.splice(bIdx + 1);
          // A tentative autolink inside a failed inner bracket reverts to
          // plain text when this link forms around it (doc-39/N3).
          detentativize(children, null);
          nodes.splice(bIdx, 1); // remove the '[' text node
          let nd;
          if (b.isImage) {
            // Alt text is the bracket text parsed as inline (emphasis
            // resolved) and then flattened to plain text.
            const altNodes = parseInlineNodes(text.slice(b.contentStart, i), refs, st);
            nd = { t: 'img', src: href, title: link.title ?? null, alt: plainTextOf(altNodes), parent: root };
          } else {
            nd = { t: 'link', href, title: link.title ?? null, children, parent: root };
            for (const ch of children) ch.parent = nd;
          }
          nodes.push(nd);
          // A link deactivates ancestor brackets that would form links
          // (a link may not contain a link); an image deactivates nothing,
          // and image brackets stay usable (their alt is plain text).
          if (!b.isImage) {
            for (let k = 0; k < bi; k++) if (delims[k].char === '[' && !delims[k].isImage) delims[k].active = false;
          }
          delims.splice(bi, 1);
          // A (non-image) link whose text holds an unmatched `` run arms
          // the emphasis block: delimiters added after it are deactivated
          // when the next code span forms (doc-09/28/35). Do not clear the
          // tracked list: delimiters from an earlier armed link are still
          // blocked by a later code span.
          if (!b.isImage && hasUnmatchedDoubleBt(text, b.contentStart, i)) {
            btLinkArmed = true;
          }
          i = end;
          continue;
        }
      }
      // no link formed: drop the bracket from the stack, ']' is literal.
      // A closed inline-link attempt that fails deactivates the emphasis
      // delimiters inside the bracket text (doc-16/20/23).
      // The bracket text is literal, so autolinks inside it still form
      // (doc-39): re-scan its children for extended autolinks before
      // the bracket is dropped (skipped while a document-level <a> is
      // open, where autolinks are suppressed everywhere).
      flushText();
      if (!(st && st.inLink)) rescanBracketAutolinks(nodes, b, delims, root);
      if (text[i + 1] === '(' && hasClosingParenOnLine(text, i + 1)) deactivateEmphasisAfter(delims, bi, b);
      delims.splice(bi, 1);
      textBuf += ']'; i++; continue;
    }
    if (c === '<') {
      const al = parseAutolink(text, i);
      if (al) {
        flushText();
        const href = cleanUrl(al[0]);
        if (href !== null) {
          pushNode({ t: 'link', href, title: null, children: [{ t: 'text', s: al[1], parent: null }], parent: root });
          pushNode ? 0 : 0;
          nodes[nodes.length - 1].children[0].parent = nodes[nodes.length - 1];
          i = al[2]; continue;
        }
      }
      const tag = parseHtmlTag(text, i);
      if (tag) {
        flushText();
        // An inline <a> tag opens a link for the rest of the document
        // (marked's inLink lexer state), self-closing included; </a>
        // closes it. Only the GFM bare autolink consults this state.
        // HTML blocks never reach here, so they do not affect it.
        if (st) {
          const raw = tag[0];
          if (/^<\/a\s*>/i.test(raw)) st.inLink = false;
          else if (/^<a[\s>]/i.test(raw)) st.inLink = true;
        }
        pushNode({ t: 'html', s: tag[0] }); i = tag[1]; continue;
      }
      textBuf += '<'; i++; continue;
    }
    if (c === '&') {
      // Named references pass through raw (marked keeps any &name; as-is);
      // numeric references decode to the character.
      let k = i + 1;
      if (k < n && /[A-Za-z]/.test(text[k])) {
        k++;
        while (k < n && /[A-Za-z0-9]/.test(text[k])) k++;
        if (k < n && text[k] === ';') {
          pushNode({ t: 'raw', s: text.slice(i, k + 1) });
          i = k + 1; continue;
        }
      }
      const d = decodeEntityAt(text, i);
      if (d) { textBuf += d[0]; i = d[1]; continue; }
      textBuf += '&'; i++; continue;
    }
    if (c === '\n') {
      // hard break if preceded by 2+ spaces (in the current text buffer / last text node)
      let stripped = false;
      if (textBuf.length >= 2 && textBuf.endsWith('  ')) {
        textBuf = textBuf.replace(/ +$/, '');
        stripped = true;
      } else if (textBuf.length === 0 && nodes.length > 0) {
        const last = nodes[nodes.length - 1];
        if (last.t === 'text' && last.s.endsWith('  ')) {
          last.s = last.s.replace(/ +$/, '');
          if (last.s.length === 0) nodes.pop();
          stripped = true;
        }
      }
      flushText();
      if (stripped) { pushNode({ t: 'br' }); }
      else { pushNode({ t: 'text', s: '\n' }); }
      i++;
      // After a hard break the next line's leading whitespace is dropped
      // (cm-636; doc-06/38 in lazy list-item/blockquote continuations).
      if (stripped) { while (i < n && (text[i] === ' ' || text[i] === '\t')) i++; }
      continue;
    }
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
      // possible GFM extended autolink: an '@' or ':' that could start one
      // must lie in the current word (no space before it) and within 128
      // chars, so scan only that far instead of the rest of the paragraph.
      let near = Infinity;
      const scanEnd = Math.min(n, i + 129);
      for (let k = i + 1; k < scanEnd; k++) {
        const ch = text[k];
        if (ch === '@' || ch === ':') { near = k; break; }
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '<') break;
      }
      if ((c === 'w' && text.startsWith('www.', i)) || (near - i <= 128)) {
        const inLink = delims.some(d => d.char === '[' && d.active) || (st && st.inLink);
        const r = tryExtAutolink(text, i, inLink, hasUnderscoreOpener(delims));
        if (r) {
          flushText();
          const href = cleanUrl(r[0]);
          if (href !== null) {
            const linkNd = { t: 'link', href, title: null, children: [], parent: root };
            const txtNd = { t: 'text', s: r[1], parent: linkNd };
            linkNd.children.push(txtNd);
            nodes.push(linkNd);
            i = r[2]; continue;
          }
        }
      }
      textBuf += c; i++; continue;
    }
    // plain text run
    let j = i;
    while (j < n) {
      const ch = text[j];
      if (ch === '\\' || ch === '`' || ch === '*' || ch === '_' || ch === '~' || ch === '[' || ch === ']' || ch === '!' || ch === '<' || ch === '&' || ch === '\n') break;
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) break;
      j++;
    }
    if (j === i) j = i + 1;
    textBuf += text.slice(i, j);
    i = j;
  }
  flushText();
  // resolve emphasis / strikethrough
  processEmphasis(root, delims);
  return nodes;
}
function parseInline(text, refs, st) { return renderInline(parseInlineNodes(text, refs, st)); }
function isWordChar(ch) {
  return ch !== undefined && ch !== null && /[\p{L}\p{N}]/u.test(ch);
}
// Does the span kids[lo+1..hi-1] contain a formed <strong> node that is
// preceded by whitespace and followed by a word character? (The inner
// strong sits after a space but is glued to the next word.)
function spanHasSpaceGluedStrong(kids, lo, hi) {
  for (let i = lo + 1; i < hi; i++) {
    const nd = kids[i];
    if (nd.t === 'strong') {
      const prev = kids[i - 1];
      const nx = kids[i + 1];
      const prevWs = prev && prev.t === 'text' && typeof prev.s === 'string' && prev.s.length > 0 && /\s/.test(prev.s[prev.s.length - 1]);
      const nextWord = nx && nx.t === 'text' && typeof nx.s === 'string' && nx.s.length > 0 && isWordChar(nx.s[0]);
      if (prevWs && nextWord) return true;
    } else if (nd.children) {
      if (spanHasSpaceGluedStrong(nd.children, -1, nd.children.length)) return true;
    }
  }
  return false;
}
// Would a later len>=2 closer (same char, same parent) pair with `opener`
// to form a strong, instead of the current len-1 closer stealing one star
// from it? `em` is the delimiter list, `ci` the current closer's index,
// `k` the opener's index.
function laterStrongTakesOpener(em, ci, k) {
  const opener = em[k];
  const parent = opener.node.parent;
  for (let j = ci + 1; j < em.length; j++) {
    const d = em[j];
    if (d.char !== opener.char || d.len < 2 || !d.canClose || d.len === 0) continue;
    if (d.node.parent !== parent) continue;
    // A nearer available opener between the opener and d would win d.
    // Only a len>=2 opener can win d for a strong; a len-1 opener pairs
    // with d as em, which Rule G (or the odd-match rule) may itself block,
    // so it does not stop d from taking this opener (doc-11).
    let blocked = false;
    for (let m = k + 1; m < j; m++) {
      const e = em[m];
      if (e.char === opener.char && e.len >= 2 && e.canOpen && e.node.parent === parent) { blocked = true; break; }
    }
    if (blocked) return false;
    // Rule of 3: d skips the opener when the lengths sum to a multiple
    // of 3 (unless both are multiples of 3) and the pair is two-way.
    if ((opener.len + d.len) % 3 === 0 &&
        !(opener.len % 3 === 0 && d.len % 3 === 0) &&
        (opener.canClose || (opener.canOpen && d.canOpen))) return false;
    return true;
  }
  return false;
}

function processEmphasis(root, delims) {
  // delims: emphasis delimiters only (char * _ ~), in scan order;
  // deactivated ones (active === false) never pair.
  const em = delims.filter(d => d.char !== '[' && d.active !== false);
  let ci = 0;
  while (ci < em.length) {
    const closer = em[ci];
    if (!closer.canClose || closer.len === 0) { ci++; continue; }
    // find opener
    let oi = -1;
    for (let k = ci - 1; k >= 0; k--) {
      const o = em[k];
      if (o.len === 0 || !o.canOpen || o.char !== closer.char) continue;
      if (o.node.parent !== closer.node.parent) continue;
      // Rule of 3: a closer skips an opener when the lengths sum to a
      // multiple of 3 (unless both are multiples of 3) and the pair is
      // "two-way": the closer can close and either the opener can close
      // or both can open. This covers a run at the start of the text
      // (*foo**bar**baz*) and one at the end (*foo**bar*).
      if (closer.canClose && (o.len + closer.len) % 3 === 0 &&
          !(o.len % 3 === 0 && closer.len % 3 === 0) &&
          (o.canClose || (o.canOpen && closer.canOpen))) continue;
      // Rule F (strong priority): a len-1 closer does not steal one star
      // from a len-2 opener when a later len>=2 closer would pair with
      // that opener to form a strong (marked matches the strong first).
      // Doc-01/30: the * after "other"/"one" stays literal and the **
      // opener closes with the final **. (Opener len must be exactly 2:
      // a len-3 opener can satisfy both, cm-430 ***foo* bar**.)
      if (closer.len === 1 && o.len === 2 && closer.char !== '~' &&
          laterStrongTakesOpener(em, ci, k)) continue;
      // Rule G: a single-star em pairing does not form over a nested
      // strong that is preceded by whitespace and glued to the following
      // word (marked leaves such spans literal: doc-03/07/11). It does
      // not apply to a nested em (doc-04/21/27 form), to an underscore
      // outer (doc-31 forms), or when the inner strong is preceded by a
      // word (cm-411) or followed by a space/punctuation (cm-410). It
      // also applies when the closer is len>=2 (doc-11): a len-2 closer
      // must not steal the span as an em when a farther len-2 opener
      // would take it as a strong.
      if (closer.char === '*' && o.len === 1 && closer.len >= 1) {
        let skip = false;
        for (let m = k + 1; m < ci; m++) {
          if (em[m].len !== 0) continue;
          const kids = o.node.parent.children;
          const oi2 = kids.indexOf(o.node);
          const ci2 = kids.indexOf(closer.node);
          if (oi2 >= 0 && ci2 > oi2 && spanHasSpaceGluedStrong(kids, oi2, ci2)) skip = true;
          break;
        }
        if (skip) continue;
      }
      oi = k; break;
    }
    if (oi < 0) { ci++; continue; }
    const opener = em[oi];
    const use = (opener.len >= 2 && closer.len >= 2) ? 2 : 1;
    const parent = opener.node.parent;
    const kids = parent.children;
    const oIdx = kids.indexOf(opener.node);
    const cIdx = kids.indexOf(closer.node);
    if (oIdx < 0 || cIdx < 0 || cIdx <= oIdx) { ci++; continue; }
    const inner = kids.slice(oIdx + 1, cIdx);
    const tag = closer.char === '~' ? 'del' : (use === 2 ? 'strong' : 'em');
    const nd = { t: tag, children: inner, parent };
    for (const ch of inner) ch.parent = nd;
    // shorten delimiter text nodes
    opener.node.s = opener.node.s.slice(0, opener.node.s.length - use);
    closer.node.s = closer.node.s.slice(use);
    opener.len -= use; closer.len -= use;
    // Leftover closer stars stay INSIDE the strong when a consumed two-way
    // '*' delimiter (one that formed an inner em, e.g. the '*' after 'tool'
    // in **by command *tool*one***) lies between opener and closer
    // (doc-11/30). Otherwise they stay outside (cm-446 **foo***).
    // A two-way '*' is canOpen && canClose; consumed means len 0.
    let leftoverInside = false;
    if (use === 2 && closer.char === '*' && closer.len > 0) {
      for (let m = oi + 1; m < ci; m++) {
        const d = em[m];
        if (d.char === '*' && d.len === 0 && d.canOpen && d.canClose) { leftoverInside = true; break; }
      }
    }
    // replace kids[oIdx..cIdx] with the new node (mutating the array in
    // place, so the list the renderer holds sees the change)
    const seg = [];
    if (opener.node.s.length > 0) seg.push(opener.node);
    seg.push(nd);
    if (closer.node.s.length > 0) {
      if (leftoverInside) {
        nd.children.push(closer.node);
        closer.node.parent = nd;
      } else {
        seg.push(closer.node);
      }
    }
    kids.splice(oIdx, cIdx - oIdx + 1, ...seg);
    // if a delimiter text node was removed, keep its object but len 0 handles it
    if (opener.len === 0) { /* node already dropped from list if empty */ }
    if (closer.len === 0) { ci++; continue; }
    // closer still has length: keep scanning from the same closer
  }
}

// The text from a saved cursor position (a partly-consumed tab is rendered
// as the spaces it still represents).
function restFrom(cur, s) {
  let r = cur.text.slice(s.pos);
  if (s.partial > 0 && r.charAt(0) === '\t') r = ' '.repeat(s.partial) + r.slice(1);
  return r;
}
// ---------- block parsing ----------
// A cursor tracks both the logical column (consumed) and the physical column
// (where the character at pos sits if all tabs were fully expanded). A tab
// that is only partly consumed leaves a partial tab: the logical column lags
// the physical column, and the next tab's width is computed from the physical
// column, which is what the CommonMark tab examples require.
function makeCursor(text) { return { text, pos: 0, col: 0, phys: 0, partial: 0 }; }
function tabWidth(cur) { return 4 - (cur.phys % 4); }
function curChar(cur) {
  if (cur.partial > 0) return ' ';
  if (cur.pos >= cur.text.length) return '';
  return cur.text[cur.pos];
}
function curAdvance(cur) {
  if (cur.partial > 0) { cur.partial--; cur.col++; return; }
  if (cur.pos >= cur.text.length) return;
  const c = cur.text[cur.pos];
  if (c === '\t') { const w = tabWidth(cur); cur.col += w; cur.phys += w; cur.pos++; }
  else { cur.col++; cur.phys++; cur.pos++; }
}
// Advance exactly one column (a tab is partly consumed when it is wider).
function curAdvanceCol(cur) {
  if (cur.partial > 0) { cur.partial--; cur.col++; return; }
  if (cur.pos >= cur.text.length) return;
  const c = cur.text[cur.pos];
  if (c === '\t') {
    const w = tabWidth(cur);
    if (w > 1) { cur.partial = w - 1; cur.col++; cur.phys += w; cur.pos++; }
    else { cur.col++; cur.phys++; cur.pos++; }
  } else { cur.col++; cur.phys++; cur.pos++; }
}
// advance the cursor to an absolute column (whitespace only). Returns true on success.
function curToCol(cur, target) {
  while (cur.col < target) {
    if (cur.partial > 0) { cur.partial--; cur.col++; continue; }
    if (cur.pos >= cur.text.length) return false;
    const c = cur.text[cur.pos];
    if (c === '\t') {
      const next = cur.phys + tabWidth(cur);
      if (cur.col + (next - cur.phys) > target) { cur.partial = (cur.col + (next - cur.phys)) - target; cur.col = target; cur.phys = next; cur.pos++; return true; }
      cur.col += next - cur.phys; cur.phys = next; cur.pos++;
    } else if (c === ' ') { cur.col++; cur.phys++; cur.pos++; }
    else return false;
  }
  return true;
}
function curRest(cur) { return ' '.repeat(cur.partial) + cur.text.slice(cur.pos); }
// Expand tabs in the leading whitespace of a fenced code content line.
// startPhys is the physical column of the first content character (a
// tab's width is computed from its column in the original line). Marked
// expands a leading tab in fenced code (e.g. a tab at column 13 becomes
// 3 spaces) but keeps a raw tab in indented code, so this is fenced-only.
function expandLeadingTabs(s, startPhys) {
  let out = '';
  let phys = startPhys;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { out += ' '; phys++; i++; }
    else if (c === '\t') { const w = 4 - (phys % 4); out += ' '.repeat(w); phys += w; i++; }
    else break;
  }
  return out + s.slice(i);
}
// Does block b sit inside a list item? Tabs in fenced code expand from
// the absolute column inside an item, but from the container base + 2
// inside bare blockquotes (marked: '> > \t' is 2 spaces, while a tab at
// the same absolute column inside an item is 4).
function hasItemAncestor(b) {
  for (let p = b.parent; p; p = p.parent) if (p.type === 'item') return true;
  return false;
}
// Innermost container (blockquote / list item) enclosing block b, or null.
// The innermost container decides how a leading tab in fenced code
// expands: a blockquote counts as 2 columns, a list item as its absolute
// content indent.
function innermostContainer(b) {
  for (let p = b.parent; p; p = p.parent) {
    if (p.type === 'blockquote') return 'blockquote';
    if (p.type === 'item') return 'item';
  }
  return null;
}
// Content of one fenced-code line: strip the fence indent, then expand a
// leading tab. A tab that the fence-indent strip only partly consumes is
// removed entirely (marked drops it, it does not leave partial spaces).
// A leading tab inside a blockquote expands from column 2 (the blockquote
// counts as 2 columns, not its full width); inside a list item it expands
// from its absolute column; at the top level it stays raw. Inside a
// blockquote the tab is expanded BEFORE the fence indent is stripped
// (marked: doc-22/26 keep 4 spaces for a tab after 2 spaces).
function fencedLineContent(t, cur, lineBaseCol) {
  if (lineBaseCol === 0) {
    if (t.fenceIndent) {
      const partialBefore = cur.partial;
      curToCol(cur, cur.col + t.fenceIndent);
      if (cur.partial > 0 && partialBefore === 0) cur.partial = 0;
    }
    return curRest(cur);
  }
  const kind = innermostContainer(t);
  if (kind === 'blockquote') {
    let expanded;
    if (cur.partial > 0) {
      // The tab was partly consumed by the container match; it sits at
      // column 0 of the blockquote content, so it is 2 spaces wide.
      expanded = '  ' + expandLeadingTabs(cur.text.slice(cur.pos), 4);
    } else {
      expanded = expandLeadingTabs(curRest(cur), 2);
    }
    if (t.fenceIndent) {
      let n = 0;
      while (n < t.fenceIndent && n < expanded.length && expanded[n] === ' ') n++;
      expanded = expanded.slice(n);
    }
    return expanded;
  }
  if (t.fenceIndent) {
    const partialBefore = cur.partial;
    curToCol(cur, cur.col + t.fenceIndent);
    if (cur.partial > 0 && partialBefore === 0) cur.partial = 0;
  }
  const tabBase = kind === 'item' ? (cur.phys - cur.partial) : ((cur.phys - cur.partial) - lineBaseCol + 2);
  return expandLeadingTabs(curRest(cur), tabBase);
}
function curIsBlank(cur) {
  let p = cur.pos, partial = cur.partial;
  if (partial > 0) return cur.text.slice(cur.pos).trim() === '';
  return cur.text.slice(p).trim() === '';
}
function curIndentCols(cur) {
  let col = cur.col, phys = cur.phys, pos = cur.pos, partial = cur.partial, count = 0;
  while (true) {
    if (partial > 0) { count++; col++; partial--; continue; }
    if (pos >= cur.text.length) break;
    const c = cur.text[pos];
    if (c === ' ') { count++; col++; phys++; pos++; }
    else if (c === '\t') { const n = 4 - (phys % 4); count += n; col += n; phys += n; pos++; }
    else break;
  }
  return count;
}
function newBlock(type, parent) {
  const b = { type, children: [], parent, lines: [] };
  if (parent) {
    if (parent.type === 'item' && parent.sawBlank && parent.children.length > 0) {
      parent.loose = true;
      parent.sawBlank = false;
    }
    parent.children.push(b);
  }
  return b;
}
function endsHardBreak(line) {
  if (line.endsWith('\\')) {
    let n = 0;
    for (let k = line.length - 1; k >= 0 && line[k] === '\\'; k--) n++;
    return n % 2 === 1;
  }
  let n = 0;
  for (let k = line.length - 1; k >= 0 && (line[k] === ' ' || line[k] === '\t'); k--) n++;
  return n >= 2;
}
function isBlankLine(s) { return s.trim() === ''; }
const HTML_BLOCK_TAGS = ['address','article','aside','base','basefont','blockquote','body','caption','center','col','colgroup','dd','details','dialog','dir','div','dl','dt','fieldset','figcaption','figure','footer','form','frame','frameset','h1','h2','h3','h4','h5','h6','head','header','hr','html','iframe','legend','li','link','main','menu','menuitem','nav','noframes','ol','optgroup','option','p','param','search','section','summary','table','tbody','td','tfoot','th','thead','title','tr','track','ul'];
function htmlBlockStart(cur) {
  const rest = curRest(cur);
  const m = rest.match(/^ {0,3}(?:<(\/?)([A-Za-z][A-Za-z0-9-]*))/);
  if (!m) {
    if (/^ {0,3}<!--/.test(rest)) return 2;
    if (/^ {0,3}<\?/.test(rest)) return 3;
    if (/^ {0,3}<![A-Za-z]/.test(rest)) return 4;
    if (/^ {0,3}<!\[CDATA\[/.test(rest)) return 5;
    return 0;
  }
  const tag = m[2].toLowerCase();
  // Type 1 only starts on an OPENING <pre>/<script>/<style>/<textarea>;
  // a closing tag alone (</pre>) is not type 1 (and 'pre' is not a type-6
  // tag either), so it falls through to type 7 and cannot interrupt a
  // paragraph (cm-148).
  if (!m[1] && (tag === 'script' || tag === 'pre' || tag === 'style' || tag === 'textarea')) return 1;
  if (/^<!--/.test(rest)) return 2;
  if (/^<\?/.test(rest)) return 3;
  if (/^<![A-Za-z]/.test(rest)) return 4;
  if (/^<!\[CDATA\[/.test(rest)) return 5;
  if (HTML_BLOCK_TAGS.includes(tag)) return 6;
  // type 7: the whole line is a single complete open/close tag. A closing
  // tag must not carry attributes.
  if (/^ {0,3}<\/[A-Za-z][A-Za-z0-9-]*[ \t]*>[ \t]*$/.test(rest)) return 7;
  if (/^ {0,3}<[A-Za-z][A-Za-z0-9-]*(?:[ \t]+[A-Za-z_:][A-Za-z0-9_.:-]*(?:[ \t]*=[ \t]*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*[ \t]*\/?>[ \t]*$/.test(rest)) return 7;
  return 0;
}
function htmlBlockEnds(lines, type, newLine) {
  // Every end condition ends with '>'; a new line without one cannot newly
  // satisfy it, so skip the (quadratic) join-and-scan for that line.
  if (newLine !== undefined && newLine.indexOf('>') < 0) return false;
  const text = lines.join('\n');
  if (type === 1) return /<\/(script|pre|style|textarea)\s*>/i.test(text);
  if (type === 2) return /-->/.test(text);
  if (type === 3) return /\?>/.test(text);
  if (type === 4) return />/.test(text);
  if (type === 5) return /\]\]>/.test(text);
  return false; // 6 and 7 end at a blank line
}
function parseLinkRefDef(lines, startIdx, refs) {
  // Try to parse a link reference definition starting at lines[startIdx].
  // Returns the number of lines consumed, or 0. Adds to refs (first wins).
  // Works on the remaining lines joined by '\n' (a def may span lines but
  // never a blank line).
  const text = lines.slice(startIdx).join('\n');
  const n = text.length;
  let p = 0;
  while (p < n && text[p] === ' ' && p < 3) p++;
  if (text[p] !== '[') return 0;
  p++;
  let label = '';
  let labelOk = false;
  while (p < n) {
    const c = text[p];
    if (c === '\\' && p + 1 < n && text[p + 1] !== '\n') { label += text[p] + text[p + 1]; p += 2; continue; }
    if (c === '[') return 0;
    if (c === ']') { labelOk = true; p++; break; }
    if (c === '\n') {
      if (text[p + 1] === '\n' || p + 1 >= n) return 0;
      label += '\n'; p++; continue;
    }
    label += c; p++;
  }
  if (!labelOk || text[p] !== ':') return 0;
  p++;
  const lab = normalizeLabel(label);
  if (lab.length === 0 || lab.length > 999) return 0;
  function skipWs(p) {
    let q = p, sawNl = false;
    while (q < n) {
      const c = text[q];
      if (c === ' ' || c === '\t') { q++; continue; }
      if (c === '\n') {
        if (sawNl || text[q + 1] === '\n') return -1;
        sawNl = true; q++; continue;
      }
      break;
    }
    return q;
  }
  let q = skipWs(p);
  if (q < 0 || q >= n) return 0;
  let dest;
  if (text[q] === '<') {
    let k = q + 1, out = '';
    let ok = false;
    while (k < n) {
      const c = text[k];
      if (c === '\n' || c === '<') return 0;
      if (c === '>') { ok = true; break; }
      if (c === '\\' && k + 1 < n && isAsciiPunct(text[k + 1])) { out += text[k + 1]; k += 2; continue; }
      out += c; k++;
    }
    if (!ok) return 0;
    dest = out; q = k + 1;
  } else {
    const d = parseDestination(text, q);
    if (!d) return 0;
    dest = d[0]; q = d[1];
  }
  // an empty <> destination is valid (a bare destination is never empty)
  let title = null;
  let end = q;
  let hasWs = false;
  let r = q;
  while (r < n && (text[r] === ' ' || text[r] === '\t')) { r++; hasWs = true; }
  let titleOnNextLine = false;
  if (r < n && text[r] === '\n') {
    let s = r + 1;
    while (s < n && (text[s] === ' ' || text[s] === '\t')) s++;
    if (s < n && (text[s] === '"' || text[s] === "'" || text[s] === '(')) {
      hasWs = true; r = s; titleOnNextLine = true;
    } else {
      r = q;
    }
  }
  if (r < n && (text[r] === '"' || text[r] === "'" || text[r] === '(')) {
    if (!hasWs) return 0;
    const t = parseTitle(text, r);
    const titleBad = !t || t[0].includes('\n\n') || (() => {
      let e = t ? t[1] : r;
      while (e < n && (text[e] === ' ' || text[e] === '\t')) e++;
      return e < n && text[e] !== '\n';
    })();
    if (titleBad) {
      if (titleOnNextLine) {
        // invalid title on a later line: the def is still valid without it
        title = null;
        let e = q;
        while (e < n && (text[e] === ' ' || text[e] === '\t')) e++;
        end = e;
      } else return 0;
    } else {
      title = t[0];
      end = t[1];
      let e = end;
      while (e < n && (text[e] === ' ' || text[e] === '\t')) e++;
      end = e;
    }
  } else {
    let e = q;
    while (e < n && (text[e] === ' ' || text[e] === '\t')) e++;
    if (e < n && text[e] !== '\n') return 0;
    end = e;
  }
  let consumed = 1;
  for (let k = 0; k < end && k < n; k++) if (text[k] === '\n') consumed++;
  if (!refs.has(lab)) refs.set(lab, { dest, title });
  return consumed;
}
function splitTableRow(line) {
  // split a table row line into cells. Only an escaped pipe (\|) is
  // protected; a plain '|' inside a code span still separates cells
  // (marked's behaviour, not the GFM spec's). Only the escaped pipe is
  // resolved here; other backslash escapes are left intact for the inline
  // parser (resolving e.g. \_ to _ would turn an escaped underscore into
  // an emphasis delimiter, doc-12). A cell '`a \| b`' becomes '`a | b`'.
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = [];
  let cur = '', i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length && s[i + 1] === '|') { cur += '|'; i += 2; continue; }
    if (c === '|') { cells.push(cur.trim()); cur = ''; i++; continue; }
    cur += c; i++;
  }
  cells.push(cur.trim());
  return cells;
}
function parseDelimiterRow(line) {
  const cells = splitTableRow(line);
  if (cells.length === 0) return null;
  const aligns = [];
  for (const cell of cells) {
    const m = cell.match(/^:?-+:?$/);
    if (!m) return null;
    if (cell.startsWith(':') && cell.endsWith(':')) aligns.push('center');
    else if (cell.endsWith(':')) aligns.push('right');
    else if (cell.startsWith(':')) aligns.push('left');
    else aligns.push(null);
  }
  return aligns;
}

function parseBlocks(src, refs) {
  const doc = newBlock('document', null);
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const srcHasTrail = src.length > 0 && src.endsWith('\n');
  if (srcHasTrail) lines.pop();
  const open = [doc];
  let lastLineBlank = false;
  let lineBaseCol = 0; // cursor column after the containers matched (per line)
  let atEof = false; // true while the final closeTo(1) runs
  let pendingHtml = null; // html block closed by its end condition; its
  // trailing newline depends on whether the next line is blank
  const tip = () => open[open.length - 1];
  function finalizeBlock(b) {
    if (b.type === 'paragraph') {
      // Link reference definitions only lead a paragraph: parse them from
      // the start and stop at the first line that is not one.
      let i = 0;
      while (i < b.lines.length) {
        const n = parseLinkRefDef(b.lines, i, refs);
        if (n > 0) { i += n; continue; }
        break;
      }
      const kept = b.lines.slice(i);
      b.lines = kept;
      b.text = kept.join('\n');
      if (kept.length === 0) b.empty = true;
    } else if (b.type === 'list') {
      b.tight = !b.loose && !b.children.some(it => it.loose);
    } else if (b.type === 'code') {
      if (!b.fenced) {
        while (b.lines.length > 0 && b.lines[b.lines.length - 1] === '') b.lines.pop();
      } else if (b.lines.length > 0 && b.lines[b.lines.length - 1] === '') {
        // EOF-closed fenced code also drops one trailing blank line.
        b.lines.pop();
      }
      b.content = b.lines.map(l => l + '\n').join('');
    } else if (b.type === 'html') {
      // Content is computed at render time (trailing newline depends on
      // whether the following line is blank; see pendingHtml).
    }
  }
  function closeTo(depth) {
    while (open.length > depth) {
      const b = open.pop();
      // An HTML block closed early (not by its end condition, not at EOF)
      // has no trailing newline. An HTML block closed at EOF also has no
      // trailing newline when the source itself has none (gfm-657): its
      // content is verbatim, so no '\n' is appended after the last line.
      if (b.type === 'html' && !b.endConditionClosed && (!atEof || !srcHasTrail)) b.noTrail = true;
      finalizeBlock(b);
    }
  }
  function closeLeaf() {
    const t = tip();
    if (t.type === 'paragraph' || t.type === 'code' || t.type === 'html' || t.type === 'table') closeTo(open.length - 1);
  }
  function matchBlockquote(cur) {
    let i = 0;
    while (i < 3 && curChar(cur) === ' ') { curAdvance(cur); i++; }
    if (curChar(cur) !== '>') return false;
    curAdvance(cur);
    if (curChar(cur) === ' ' || curChar(cur) === '\t') curAdvanceCol(cur);
    // A tab right after the marker (or after its single space) expands
    // to spaces from the marker-relative column: the '>' resets the
    // column (leading spaces absorbed by an outer container do not count),
    // so the tab sits at relative column i+2 (i = leading spaces eaten
    // by this call). doc-17/40 (i=0) -> 2 spaces; top-level '  > \t'
    // (i=2) -> 4 spaces (indented code); ' > \t' (i=1) -> 1 space.
    if (curChar(cur) === '\t') {
      const w = 4 - ((i + 2) % 4);
      cur.partial = w; cur.col += w; cur.phys += w; cur.pos++;
    }
    return true;
  }
  function saveCur(cur) { return { pos: cur.pos, col: cur.col, phys: cur.phys, partial: cur.partial }; }
  function loadCur(cur, s) { cur.pos = s.pos; cur.col = s.col; cur.phys = s.phys; cur.partial = s.partial; }
  // Try ATX / fence / HTML / hr / list at the cursor. Returns true when a block
  // was started and the line is consumed. The line's first content is dispatched
  // for a list item (its first line).
  // A paragraph/heading/code block cannot be a direct child of a list;
  // close a list tip before creating one.
  function closeListTip() { if (tip().type === 'list') closeTo(open.length - 1); }
  function tryStartBlockAt(cur) {
    const saved = saveCur(cur);
    const indent = curIndentCols(cur);
    if (indent <= 3) {
      const beforeIndent = saveCur(cur);
      curToCol(cur, cur.col + indent);
      const rest = curRest(cur);
      // Blockquote: consume the marker, then dispatch the rest inside it.
      if (matchBlockquote(cur)) {
        closeListTip();
        closeLeaf();
        const bq = newBlock('blockquote', tip());
        open.push(bq);
        lineBaseCol = cur.col;
        if (curRest(cur).trim() === '') return true;
        if (curIndentCols(cur) >= 4 && tip().type !== 'paragraph') {
          const cb = newBlock('code', bq);
          cb.fenced = false;
          curToCol(cur, cur.col + 4);
          cb.lines.push(curRest(cur));
          open.push(cb);
          return true;
        }
        if (tryStartBlockAt(cur)) return true;
        const p = newBlock('paragraph', bq);
        open.push(p);
        p.lines.push(curRest(cur));
        return true;
      }
      const am = rest.match(/^ {0,3}(#{1,6})(?:[ \t]+(.*?)|[ \t]*)$/);
      if (am) {
        closeListTip();
        closeLeaf();
        let content = am[2] !== undefined ? am[2] : '';
        // A closing run of #'s is stripped; a content of only #'s is empty.
        if (/^#+$/.test(content)) content = '';
        else content = content.replace(/[ \t]+#+[ \t]*$/, '').replace(/[ \t]+$/, '');
        const h = newBlock('heading', tip());
        h.level = am[1].length;
        h.text = content;
        return true;
      }
      const fm = rest.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (fm && !(fm[1][0] === '`' && fm[2].includes('`'))) {
        closeListTip();
        closeLeaf();
        const cb = newBlock('code', tip());
        cb.fenced = true;
        cb.established = false;
        cb.fenceChar = fm[1][0];
        cb.fenceLen = fm[1].length;
        // Inside a blockquote a tilde fence's indent is not stripped
        // from the content lines (marked: doc-22 keeps 3 spaces, doc-29
        // keeps 2); a backtick fence in a blockquote is stripped as
        // usual (doc-15/26/38 strip 1-2 spaces).
        cb.fenceIndent = (innermostContainer(cb) === 'blockquote' && cb.fenceChar === '~') ? 0 : indent;
        cb.info = fm[2].trim().replace(/\\([!-\/:-@\[-`{-~])/g, '$1');
        open.push(cb);
        return true;
      }
      const ht = htmlBlockStart(cur);
      if (ht > 0 && !(ht === 7 && tip().type === 'paragraph')) {
        closeListTip();
        closeLeaf();
        const hb = newBlock('html', tip());
        hb.htmlType = ht;
        const firstLine = restFrom(cur, beforeIndent);
        hb.lines.push(firstLine);
        open.push(hb);
        if (ht <= 5 && htmlBlockEnds(hb.lines, ht, firstLine)) { hb.endConditionClosed = true; pendingHtml = hb; closeTo(open.length - 1); }
        return true;
      }
      if (/^ {0,3}([*\-_])(?:[ \t]*\1){2,}[ \t]*$/.test(rest)) {
        closeListTip();
        closeLeaf();
        newBlock('hr', tip());
        return true;
      }
      const lm = matchListMarker(cur);
      if (lm) {
        // An empty list item cannot interrupt a paragraph.
        const isEmpty = curRest(cur).trim() === '';
        // An ordered list can interrupt a paragraph only if it starts
        // with 1 — unless the paragraph is a direct child of a list item,
        // where any start number interrupts (marked, item_2/item_49).
        const inItem = tip().type === 'paragraph' && tip().parent && tip().parent.type === 'item';
        const canInterrupt = tip().type !== 'paragraph' || (!isEmpty && (lm.bullet || lm.start === 1 || inItem));
        if (canInterrupt) {
          closeLeaf();
          startListItem(cur, lm);
          return true;
        }
      }
    }
    loadCur(cur, saved);
    return false;
  }
  function startsBlockConstruct(cur) {
    const saved = saveCur(cur);
    const r = tryStartBlockAtProbe(cur);
    loadCur(cur, saved);
    return r;
    function tryStartBlockAtProbe(cur) {
      const saved = saveCur(cur);
      const indent = curIndentCols(cur);
      if (indent > 3) { loadCur(cur, saved); return false; }
      curToCol(cur, cur.col + indent);
      const rest = curRest(cur);
      let r = false;
      if (/^>/.test(rest)) r = true;
      else if (/^#{1,6}(?:[ \t]+|[ \t]*$)/.test(rest)) r = true;
      else if (/^(`{3,}|~{3,})/.test(rest)) r = true;
      else if (htmlBlockStart(cur) > 0) r = true;
      else if (/^([*\-_])(?:[ \t]*\1){2,}[ \t]*$/.test(rest)) r = true;
      else if (matchListMarker(cur)) r = true;
      loadCur(cur, saved);
      return r;
    }
  }
  function matchListMarker(cur) {
    const startCol = cur.col;
    const rest = curRest(cur);
    let m = rest.match(/^([*+-])(?:[ \t]+|[ \t]*$)/);
    if (m) return finishMarker(startCol, 1, true, null, 1, m[1]);
    m = rest.match(/^(\d{1,9})([.)])(?:[ \t]+|[ \t]*$)/);
    if (m) return finishMarker(startCol, m[1].length + 1, false, m[2], parseInt(m[1], 10), null);
    return null;
    function finishMarker(startCol, markerLen, bullet, delim, start, markerChar) {
      for (let k = 0; k < markerLen; k++) curAdvance(cur);
      const wsCols = curIndentCols(cur);
      let contentIndent;
      if (wsCols === 0 || wsCols >= 5) {
        contentIndent = startCol + markerLen + 1;
      } else {
        contentIndent = cur.col + wsCols;
      }
      const afterWs = saveCur(cur);
      curToCol(cur, contentIndent);
      // An item whose first line is blank takes content indent marker+1.
      if (curRest(cur).trim() === '') {
        contentIndent = startCol + markerLen + 1;
        loadCur(cur, afterWs);
        curToCol(cur, contentIndent);
      }
      // Relative offset from the line's container base (the cursor column
      // after the containers matched); independent of marker columns.
      const contentIndentRel = contentIndent - lineBaseCol;
      return { bullet, delim, start, markerLen, contentIndent, contentIndentRel, markerChar };
    }
  }
  function startListItem(cur, lm) {
    let list = null;
    const t = tip();
    if (t.type === 'item') {
      // The line matched this item's content indent: a nested list.
      list = null;
    } else if (t.type === 'list') {
      const l = t;
      if (lm.bullet ? (l.bullet && l.markerChar === lm.markerChar) : (!l.bullet && l.delim === lm.delim)) {
        list = l;
      } else {
        // Different marker kind: close this list; the new one is a sibling.
        closeTo(open.indexOf(l));
      }
    }
    if (!list) {
      list = newBlock('list', tip());
      list.bullet = lm.bullet;
      list.delim = lm.delim;
      list.markerChar = lm.markerChar;
      list.start = lm.start;
      list.loose = false;
      open.push(list);
    } else if (lastLineBlank && list.children.length > 0) {
      list.loose = true;
    }
    const item = newBlock('item', list);
    item.contentIndent = lm.contentIndent;
    item.contentIndentRel = lm.contentIndentRel;
    item.sawBlank = false;
    item.loose = false;
    open.push(item);
    // dispatch the item's first line (the rest of this line)
    if (curRest(cur).trim() !== '') {
      if (curIndentCols(cur) >= 4) {
        const cb = newBlock('code', item);
        cb.fenced = false;
        curToCol(cur, cur.col + 4);
        cb.lines.push(curRest(cur));
        open.push(cb);
      } else if (!tryStartBlockAt(cur)) {
        const p = newBlock('paragraph', item);
        open.push(p);
        p.lines.push(curRest(cur));
      }
    }
  }
  lineLoop:
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const cur = makeCursor(raw);
    const blank = isBlankLine(raw);
    if (pendingHtml) { pendingHtml.closedByBlank = blank; pendingHtml.closedByWsOnly = blank && raw !== ''; pendingHtml = null; }
    // Phase 1: container matching
    let matched = 1;
    let lazyDepth = -1;
    let matchedBQItem = false;
    for (let k = 1; k < open.length; k++) {
      const b = open[k];
      const saved = saveCur(cur);
      if (b.type === 'blockquote') {
        if (!matchBlockquote(cur)) { loadCur(cur, saved); lazyDepth = k; break; }
        matched = k + 1;
        matchedBQItem = true;
      } else if (b.type === 'item') {
        // A line blank once its (already matched) containers are stripped
        // (e.g. '>' inside a blockquote) is a blank line inside the item:
        // the item stays open instead of failing the indent check on an
        // empty rest and being closed by Phase 2.
        if (blank || curRest(cur).trim() === '') { matched = k + 1; continue; }
        if (!curToCol(cur, cur.col + (b.contentIndentRel ?? b.contentIndent))) { loadCur(cur, saved); lazyDepth = k; break; }
        matched = k + 1;
        matchedBQItem = true;
      } else if (b.type === 'list') {
        matched = k + 1;
      } else {
        matched = k + 1;
        break;
      }
    }
    if (lazyDepth < 0) closeTo(matched);
    // A fenced code block inside a list item stays open for plain content
    // lines that do not match the item's indent, once it has received a
    // content line that did match (marked's behaviour; e.g. an unindented
    // `function f(a, b) {` after indented lines inside a list item is
    // still code content). The immunity does NOT apply when a blockquote
    // failed to match, when the line starts a new block construct, or
    // before any matching content line arrived. A blank line resets the
    // established state (see Phase 2).
    let codeImmune = false;
    if (lazyDepth >= 0 && !blank && tip().type === 'code' && tip().fenced) {
      const failType = open[lazyDepth].type;
      if (failType !== 'blockquote' && tip().established && !startsBlockConstruct(cur)) {
        codeImmune = true;
      }
    }
    lineBaseCol = cur.col;
    // A line that is blank once its containers are stripped is a blank line
    // (exactly empty: a leftover space after '>' is paragraph content).
    const lineBlank = blank || curRest(cur) === '';
    // Phase 2: blank line
    if (lineBlank) {
      // A blank line is not inside a container that failed to match.
      if (lazyDepth >= 0) closeTo(lazyDepth);
      const t = tip();
      if (t.type === 'code' && t.fenced) {
        let content = fencedLineContent(t, cur, lineBaseCol);
        // A whitespace-only line that still holds a tab is empty (marked:
        // a trailing tab-only line vanishes, doc-12/35/37/39); a
        // spaces-only line keeps its spaces (cm-129).
        if (content !== '' && content.trim() === '' && content.includes('\t')) content = '';
        t.lines.push(content);
        // A blank line resets the "established" state: a later unindented
        // line is no longer code content (marked, case W).
        t.established = false;
        lastLineBlank = true; continue lineLoop;
      }
      if (t.type === 'code' && !t.fenced) {
        // A blank line in indented code keeps its spaces beyond the 4-col
        // code indent. A whitespace-only line that still holds a tab is
        // empty (marked: a trailing tab-only line vanishes, doc-12/37).
        let r = curRest(cur);
        let stripped = 0;
        while (stripped < 4 && r.charAt(0) === ' ') { r = r.slice(1); stripped++; }
        if (r !== '' && r.trim() === '' && r.includes('\t')) r = '';
        t.lines.push(r); lastLineBlank = true; continue lineLoop;
      }
      if (t.type === 'html' && t.htmlType <= 5) { t.lines.push(''); lastLineBlank = true; continue lineLoop; }
      if (t.type === 'html' && t.htmlType >= 6) { t.closedByBlank = true; closeTo(open.length - 1); }
      else if (t.type === 'table' && curRest(cur).includes('\t')) {
        // A tab-only line inside a table is an empty row (marked:
        // doc-02/05/26/33); a spaces-only or truly empty line ends the
        // table. The renderer pads the single empty cell to the table's
        // column count.
        t.rows.push(['']);
        lastLineBlank = false;
        continue lineLoop;
      }
      else if (t.type === 'paragraph' || t.type === 'table') closeTo(open.length - 1);
      // A blank line after an empty list item closes the item.
      if (tip().type === 'item' && tip().children.length === 0) closeTo(open.length - 1);
      // A blank line marks every open item; the newBlock mechanism only
      // consumes the flag when a block is actually added to that item.
      for (let k = open.length - 1; k >= 1; k--) {
        const b = open[k];
        if (b.type === 'item' && b.children.length > 0) b.sawBlank = true;
      }
      // Only a blank directly in the list structure separates two items.
      lastLineBlank = tip().type === 'list' || tip().type === 'item';
      continue lineLoop;
    }
    // Phase 3: leaf content (fenced code, HTML, table, indented code).
    // When a container failed to match, the tip inside it is not active:
    // skip these branches and let the lazy rule decide.
    const tipInFailed = lazyDepth >= 0 && open.length - 1 >= lazyDepth && !codeImmune;
    let t = tip();
    if (!tipInFailed && t.type === 'code' && t.fenced) {
      const rest = curRest(cur);
      const m = rest.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (m && m[1][0] === t.fenceChar && m[1].length >= t.fenceLen) {
        // The trailing blank line is dropped in finalizeBlock.
        closeTo(open.length - 1);
      }
      else {
        const content = fencedLineContent(t, cur, lineBaseCol);
        t.lines.push(content);
        // A content line that matched the containers establishes the
        // block (an immune line does not need to: it is already set).
        if (!codeImmune) t.established = true;
      }
      lastLineBlank = false;
      continue lineLoop;
    }
    if (!tipInFailed && t.type === 'html') {
      const rest = curRest(cur);
      t.lines.push(rest);
      if (t.htmlType <= 5 && htmlBlockEnds(t.lines, t.htmlType, rest)) { t.endConditionClosed = true; pendingHtml = t; closeTo(open.length - 1); }
      lastLineBlank = false;
      continue lineLoop;
    }
    if (!tipInFailed && t.type === 'table') {
      const rest = curRest(cur);
      if (!startsBlockConstruct(cur)) {
        t.rows.push(splitTableRow(rest));
        lastLineBlank = false;
        continue lineLoop;
      }
      closeTo(open.length - 1);
      t = tip();
    }
    if (!tipInFailed && t.type === 'code' && !t.fenced) {
      const indent = curIndentCols(cur);
      if (indent >= 4) {
        curToCol(cur, cur.col + 4);
        t.lines.push(curRest(cur));
        lastLineBlank = false;
        continue lineLoop;
      }
      closeTo(open.length - 1);
      t = tip();
    }
    // Lazy continuation: the paragraph continues when the line does not
    // start a new block construct, even if outer containers matched.
    // Up to 4 columns of leading indent are stripped (a 4-space indent
    // is a code indent, not paragraph text); less indent is kept as-is.
    // A lazy line that looks like a setext underline at indent < 4
    // ('===') must not form one, so it is indented by 4 spaces (cm-093).
    if (lazyDepth >= 0 && !codeImmune) {
      if (!startsBlockConstruct(cur) && tip().type === 'paragraph') {
        let line = curRest(cur);
        let ind = 0, k = 0;
        while (k < line.length && (line[k] === ' ' || line[k] === '\t')) {
          if (line[k] === ' ') { ind++; k++; } else { ind += 4 - (ind % 4); k++; }
        }
        if (ind >= 4) {
          let stripped = 0, j = 0, extra = '';
          while (j < line.length && stripped < 4) {
            if (line[j] === ' ') { stripped++; j++; }
            else if (line[j] === '\t') {
              const w = 4 - (stripped % 4);
              if (stripped + w > 4) { extra = ' '.repeat(stripped + w - 4); stripped = 4; j++; break; }
              stripped += w; j++;
            } else break;
          }
          line = extra + line.slice(j);
        } else if (/^(=+|-+)[ \t]*$/.test(line.slice(k))) {
          line = '    ' + line;
        }
        tip().lines.push(line);
        lastLineBlank = false;
        continue lineLoop;
      }
      closeTo(lazyDepth);
    }
    // Phase 4: new block starts
    t = tip();
    // Setext heading
    if (t.type === 'paragraph' && t.lines.length > 0 && curIndentCols(cur) <= 3) {
      const savedSetext = saveCur(cur);
      curToCol(cur, cur.col + curIndentCols(cur));
      const rest = curRest(cur);
      const sm = rest.match(/^(=+|-+)[ \t]*$/);
      if (sm) {
        // Leading link reference definitions are consumed first; the
        // heading is formed from what remains (if anything).
        let di = 0;
        while (di < t.lines.length) {
          const dn = parseLinkRefDef(t.lines, di, refs);
          if (dn > 0) { di += dn; continue; }
          break;
        }
        const hLines = t.lines.slice(di);
        if (hLines.length === 0) {
          // only definitions: the '===' is NOT a setext underline (there
          // is no heading content), so drop the paragraph, restore the
          // cursor and re-process this line as fresh text (cm-216: '==='
          // becomes a paragraph line, '[foo]' still resolves via the
          // registered ref-def). Fall through to the block-start logic.
          const parent = t.parent;
          const idx = parent.children.indexOf(t);
          parent.children.splice(idx, 1);
          open.pop();
          t = tip();
          lastLineBlank = false;
          loadCur(cur, savedSetext);
        } else {
          const level = sm[1][0] === '=' ? 1 : 2;
          const parent = t.parent;
          const idx = parent.children.indexOf(t);
          const h = { type: 'heading', level, children: [], parent, lines: hLines, text: hLines.join('\n').trim() };
          parent.children[idx] = h;
          open[open.length - 1] = h;
          closeTo(open.length - 1);
          lastLineBlank = false;
          continue lineLoop;
        }
      } else {
        loadCur(cur, savedSetext);
      }
    }
    // Table: the paragraph's last line is a header row and this is a delimiter row
    if (t.type === 'paragraph' && t.lines.length > 0) {
      const aligns = parseDelimiterRow(curRest(cur));
      if (aligns) {
        const headerLine = t.lines[t.lines.length - 1];
        if (headerLine.includes('|')) {
          const headerCells = splitTableRow(headerLine);
          if (headerCells.length === aligns.length) {
            const parent = t.parent;
            const idx = parent.children.indexOf(t);
            t.lines.pop();
            if (t.lines.length === 0) { parent.children.splice(idx, 1); open.pop(); }
            else { finalizeBlock(t); open.pop(); }
            const tb = newBlock('table', parent);
            tb.header = headerCells;
            tb.align = aligns;
            tb.rows = [];
            open.push(tb);
            lastLineBlank = false;
            continue lineLoop;
          }
        }
      }
    }
    // ATX / fence / HTML / hr / list / blockquote, else indented code, else paragraph
    if (tryStartBlockAt(cur)) { lastLineBlank = false; continue lineLoop; }
    t = tip();
    if (t.type === 'list') { closeTo(open.length - 1); t = tip(); }
    if (curIndentCols(cur) >= 4 && t.type !== 'paragraph') {
      const cb = newBlock('code', t);
      cb.fenced = false;
      curToCol(cur, cur.col + 4);
      cb.lines.push(curRest(cur));
      open.push(cb);
      lastLineBlank = false;
      continue lineLoop;
    }
    if (t.type !== 'paragraph') {
      // A whitespace-only line does not start a paragraph.
      if (curRest(cur).trim() === '') { lastLineBlank = false; continue lineLoop; }
      const p = newBlock('paragraph', t);
      open.push(p);
      p.lines.push(curRest(cur));
    } else {
      // After a hard break the next line's leading whitespace is stripped.
      const prev = t.lines[t.lines.length - 1];
      let line = curRest(cur);
      if (prev !== undefined && endsHardBreak(prev)) line = line.replace(/^[ \t]*/, '');
      t.lines.push(line);
    }
    lastLineBlank = false;
  }
  atEof = true;
  closeTo(1);
  return doc;
}

// ---------- rendering ----------
function renderBlock(b, refs, tightParent, st, lastInItemQuote) {
  switch (b.type) {
    case 'document':
      return b.children.map(c => renderBlock(c, refs, false, st, false)).join('');
    case 'paragraph': {
      if (b.empty) return '';
      const html = parseInline(b.text, refs, st);
      return tightParent ? html : '<p>' + html + '</p>\n';
    }
    case 'heading':
      return '<h' + b.level + '>' + parseInline(b.text, refs, st) + '</h' + b.level + '>\n';
    case 'code': {
      let out = '<pre><code';
      if (b.fenced && b.info) {
        const first = b.info.split(/[ \t]+/)[0];
        if (first) out += ' class="language-' + escapeHtml(first, true) + '"';
      }
      out += '>' + escapeHtml(b.content) + '</code></pre>\n';
      return out;
    }
    case 'html': {
      // A block closed by its end condition keeps its trailing newline
      // when the following line is whitespace-only but not truly empty
      // (marked: a tab-only or space-only line after --> or </pre> keeps
      // it, a truly empty line drops it); a block closed by a blank line
      // never keeps it.
      // Rule 1 (doc-30): an HTML block that is the last child of a list
      // item or blockquote drops its trailing newline — marked treats
      // it as the paragraph's inline content there, not as a block of
      // its own. At document level (lastInItemQuote false) it keeps it.
      const keepTrail = b.endConditionClosed && b.closedByWsOnly;
      const noTrail = (b.closedByBlank && !keepTrail) || b.noTrail || lastInItemQuote;
      const content = noTrail ? b.lines.join('\n') : b.lines.map(l => l + '\n').join('');
      return content;
    }
    case 'hr':
      return '<hr>\n';
    case 'blockquote':
      return '<blockquote>\n' + b.children.map((c, idx) => renderBlock(c, refs, false, st, idx === b.children.length - 1)).join('') + '</blockquote>\n';
    case 'list': {
      const tag = b.bullet ? 'ul' : 'ol';
      let out = '<' + tag;
      if (!b.bullet && b.start !== 1) out += ' start="' + b.start + '"';
      out += '>\n';
      for (const it of b.children) out += renderBlock(it, refs, b.tight, st, false);
      out += '</' + tag + '>\n';
      return out;
    }
    case 'item': {
      const tight = !!tightParent;
      let out = '<li>';
      // Task list item: first paragraph starts with [ ] / [x] / [X]
      const ch0 = b.children[0];
      if (ch0 && ch0.type === 'paragraph' && !ch0.empty) {
        const tm = ch0.text.match(/^\[([ xX])\] /);
        if (tm) {
          const checked = tm[1] !== ' ';
          const box = checked ? '<input checked="" disabled="" type="checkbox"> ' : '<input disabled="" type="checkbox"> ';
          const inner = parseInline(ch0.text.slice(4), refs, st);
          out += tight ? (box + inner) : ('<p>' + box + inner + '</p>\n');
          for (let k = 1; k < b.children.length; k++) out += renderBlock(b.children[k], refs, tight && b.children[k].type === 'paragraph', st, k === b.children.length - 1);
          out += '</li>\n';
          return out;
        }
      }
      for (let k = 0; k < b.children.length; k++) {
        const ch = b.children[k];
        out += renderBlock(ch, refs, tight && ch.type === 'paragraph', st, k === b.children.length - 1);
      }
      out += '</li>\n';
      return out;
    }
    case 'table': {
      let out = '<table>\n<thead>\n<tr>\n';
      for (let i = 0; i < b.header.length; i++) {
        const al = b.align[i];
        out += '<th' + (al ? ' align="' + al + '"' : '') + '>' + parseInline(b.header[i], refs, st) + '</th>\n';
      }
      out += '</tr>\n</thead>\n';
      if (b.rows.length > 0) {
        out += '<tbody>';
        for (const row of b.rows) {
          out += '<tr>\n';
          for (let i = 0; i < b.header.length; i++) {
            const cell = i < row.length ? row[i] : '';
            const al = b.align[i];
            out += '<td' + (al ? ' align="' + al + '"' : '') + '>' + parseInline(cell, refs, st) + '</td>\n';
          }
          out += '</tr>\n';
        }
        out += '</tbody>';
      }
      out += '</table>\n';
      return out;
    }
    default:
      return '';
  }
}

export function parse(src) {
  const refs = new Map();
  const doc = parseBlocks(src, refs);
  // st carries the document-level inLink state (set by an inline <a> tag,
  // cleared by </a>); it is created fresh per parse() call, so parse stays
  // stateless across calls.
  const st = { inLink: false };
  return renderBlock(doc, refs, false, st);
}
