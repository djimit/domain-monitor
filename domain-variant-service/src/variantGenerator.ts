// Domain Variant Generation Engine
// Implements core permutation algorithms for typosquatting and fraudulent domain variants

interface VariantOptions {
  tlds?: string[];
  maxVariants?: number;
}

function generateDomainVariants(
  domainOrCompany: string,
  options: VariantOptions = {}
): string[] {
  // Normalize input
  const normalized = domainOrCompany.trim().toLowerCase();

  // Extract base domain and TLD if present
  const domainMatch = normalized.match(/^([a-z0-9\-\.]+)\.([a-z]{2,})$/);
  let base = normalized;
  let tld = '';
  if (domainMatch) {
    base = domainMatch[1];
    tld = domainMatch[2];
  }

  // Permutation algorithms
  const variants = new Set<string>();

  // 1. Omission (remove each character once)
  for (let i = 0; i < base.length; i++) {
    variants.add(base.slice(0, i) + base.slice(i + 1));
  }

  // 2. Repetition (repeat each character once)
  for (let i = 0; i < base.length; i++) {
    variants.add(base.slice(0, i + 1) + base[i] + base.slice(i + 1));
  }

  // 3. Replacement (replace each character with a-z, 0-9)
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < base.length; i++) {
    for (const c of alphabet) {
      if (c !== base[i]) {
        variants.add(base.slice(0, i) + c + base.slice(i + 1));
      }
    }
  }

  // 4. Transposition (swap adjacent characters)
  for (let i = 0; i < base.length - 1; i++) {
    variants.add(
      base.slice(0, i) +
        base[i + 1] +
        base[i] +
        base.slice(i + 2)
    );
  }

  // 5. Homoglyphs (basic set)
  const homoglyphs: Record<string, string[]> = {
    a: ['@', 'à', 'á', 'â', 'ä', 'ã'],
    e: ['3', 'è', 'é', 'ê', 'ë'],
    i: ['1', '!', 'ì', 'í', 'î', 'ï'],
    o: ['0', 'ò', 'ó', 'ô', 'ö', 'õ'],
    u: ['ù', 'ú', 'û', 'ü'],
    s: ['5', '$'],
    l: ['1', '|'],
    g: ['9'],
    b: ['8'],
    t: ['7'],
    z: ['2'],
  };
  for (let i = 0; i < base.length; i++) {
    const char = base[i];
    if (homoglyphs[char]) {
      for (const glyph of homoglyphs[char]) {
        variants.add(base.slice(0, i) + glyph + base.slice(i + 1));
      }
    }
  }

  // 6. TLD variations
  const tlds = options.tlds || ['com', 'net', 'org', 'co', 'io'];
  if (tld) {
    for (const altTld of tlds) {
      if (altTld !== tld) {
        variants.add(`${base}.${altTld}`);
      }
    }
  }

  // 7. Structural (missing dot, subdomain)
  if (tld) {
    variants.add(`${base}${tld}`); // missing dot
    variants.add(`www-${base}.${tld}`);
    variants.add(`mail.${base}.${tld}`);
  }

  // 8. Numeral swaps
  const numeralSwaps: Record<string, string> = {
    o: '0',
    i: '1',
    l: '1',
    e: '3',
    a: '4',
    s: '5',
    t: '7',
    b: '8',
    g: '9',
    z: '2',
  };
  for (let i = 0; i < base.length; i++) {
    const char = base[i];
    if (numeralSwaps[char]) {
      variants.add(base.slice(0, i) + numeralSwaps[char] + base.slice(i + 1));
    }
  }

  // Limit number of variants if specified
  let result = Array.from(variants).filter(v => v && v !== base);
  if (options.maxVariants && result.length > options.maxVariants) {
    result = result.slice(0, options.maxVariants);
  }

  // Add TLD if missing
  if (tld) {
    result = result.map(v => (v.includes('.') ? v : `${v}.${tld}`));
  }

  return result;
}

module.exports = { generateDomainVariants };