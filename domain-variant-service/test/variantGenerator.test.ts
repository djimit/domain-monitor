// Unit tests for Domain Variant Generation Engine

import { generateDomainVariants } from '../src/variantGenerator';

describe('generateDomainVariants', () => {
  it('generates omission variants', () => {
    const variants = generateDomainVariants('test.com');
    expect(variants).toContain('tes.com');
    expect(variants).toContain('tst.com');
    expect(variants).toContain('tet.com');
    expect(variants).toContain('est.com');
  });

  it('generates repetition variants', () => {
    const variants = generateDomainVariants('test.com');
    expect(variants).toContain('teest.com');
    expect(variants).toContain('tesst.com');
    expect(variants).toContain('tesst.com');
    expect(variants).toContain('testt.com');
  });

  it('generates replacement variants', () => {
    const variants = generateDomainVariants('test.com');
    expect(variants).toContain('aest.com');
    expect(variants).toContain('tast.com');
    expect(variants).toContain('tesa.com');
    expect(variants).toContain('tesz.com');
  });

  it('generates transposition variants', () => {
    const variants = generateDomainVariants('test.com');
    expect(variants).toContain('etst.com');
    expect(variants).toContain('tset.com');
    expect(variants).toContain('tets.com');
  });

  it('generates homoglyph variants', () => {
    const variants = generateDomainVariants('test.com');
    expect(variants).toContain('te$t.com');
    expect(variants).toContain('te5t.com');
    expect(variants).toContain('t3st.com');
  });

  it('generates TLD variations', () => {
    const variants = generateDomainVariants('test.com', { tlds: ['net', 'org'] });
    expect(variants).toContain('test.net');
    expect(variants).toContain('test.org');
  });

  it('generates structural variants', () => {
    const variants = generateDomainVariants('test.com');
    expect(variants).toContain('testcom.com');
    expect(variants).toContain('www-test.com');
    expect(variants).toContain('mail.test.com');
  });

  it('generates numeral swap variants', () => {
    const variants = generateDomainVariants('test.com');
    expect(variants).toContain('te5t.com');
    expect(variants).toContain('t3st.com');
    expect(variants).toContain('tes7.com');
  });

  it('limits the number of variants if maxVariants is set', () => {
    const variants = generateDomainVariants('test.com', { maxVariants: 5 });
    expect(variants.length).toBeLessThanOrEqual(5);
  });

  it('handles company names without TLD', () => {
    const variants = generateDomainVariants('acme');
    expect(variants.length).toBeGreaterThan(0);
    expect(variants.some(v => v.includes('.'))).toBe(false);
  });
});