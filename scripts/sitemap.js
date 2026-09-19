import { execSync } from 'node:child_process';

/**
 * The deployed origin and path, taken from package.json so the sitemap,
 * robots.txt and the npm metadata cannot drift apart. Always trailing-slashed.
 */
export function siteUrl(homepage) {
  return homepage.replace(/\/?$/, '/');
}

/**
 * Date of the last commit, not of the build. A sitemap that claims a fresh
 * lastmod on every deploy is telling crawlers the page changed when it did
 * not, which is the one thing lastmod is not supposed to do.
 *
 * Falls back to today when git is unavailable — a shallow checkout still has
 * HEAD, so CI resolves this normally.
 */
export function lastModified() {
  try {
    return execSync('git log -1 --format=%cs', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * The landing page is a single document with no routes, so the sitemap has
 * exactly one entry. Anchors within the page are not separate URLs.
 */
export function buildSitemap({ url, lastmod }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}
