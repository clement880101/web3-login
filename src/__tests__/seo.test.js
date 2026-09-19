import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildSitemap, lastModified, siteUrl } from '../../scripts/sitemap.js';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const robots = readFileSync('public/robots.txt', 'utf8');
const indexHtml = readFileSync('index.html', 'utf8');

const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

describe('siteUrl', () => {
  it('always ends in a slash', () => {
    expect(siteUrl('https://example.com/web3-login')).toBe(
      'https://example.com/web3-login/'
    );
    expect(siteUrl('https://example.com/web3-login/')).toBe(
      'https://example.com/web3-login/'
    );
  });
});

describe('sitemap', () => {
  const xml = buildSitemap({
    url: siteUrl(pkg.homepage),
    lastmod: '2026-09-18',
  });

  it('declares the sitemaps.org namespace', () => {
    // A wrong namespace parses as XML but is not a sitemap, and crawlers
    // reject it silently.
    expect(xml).toContain(`<urlset xmlns="${SITEMAP_NS}">`);
  });

  it('lists the homepage from package.json', () => {
    expect(xml).toContain(`<loc>${siteUrl(pkg.homepage)}</loc>`);
  });

  it('has exactly one url, since the landing page has no routes', () => {
    expect(xml.match(/<url>/g)).toHaveLength(1);
  });

  it('parses as XML', () => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.documentElement.tagName).toBe('urlset');
  });

  it('dates lastmod as YYYY-MM-DD', () => {
    expect(lastModified()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('robots.txt', () => {
  it('points at the sitemap the build actually emits', () => {
    // robots.txt is hand-written and the sitemap URL is generated; this is
    // the seam where they can drift.
    expect(robots).toContain(`Sitemap: ${siteUrl(pkg.homepage)}sitemap.xml`);
  });

  it('does not disallow crawling', () => {
    expect(robots).toMatch(/^Disallow:\s*$/m);
  });
});

describe('index.html', () => {
  it('declares the same canonical URL', () => {
    expect(indexHtml).toContain(
      `<link rel="canonical" href="${siteUrl(pkg.homepage)}" />`
    );
  });

  it('does not describe the package as MUI-based', () => {
    // 2.0.0 dropped MUI; the meta description outlived it once already.
    expect(indexHtml).not.toMatch(/MUI/i);
  });
});
