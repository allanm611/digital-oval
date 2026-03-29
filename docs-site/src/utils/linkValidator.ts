/**
 * Link validation utility for markdown documents
 * Checks if links in markdown point to valid pages defined in sidebars
 */

// Valid page slugs extracted from sidebars.ts
const VALID_PAGES = new Set([
  'intro',
  'authentication/login',
  'authentication/registration',
  'authentication/password-reset',
  'authentication/landing',
  'getting-started/dashboard',
  'getting-started/global-search',
  'campaigns/campaigns-list',
  'campaigns/create-campaign',
  'campaigns/edit-campaign',
  'campaigns/view-campaign-details',
  'campaigns/campaign-reports',
  'campaigns/campaign-broadcasts',
  'campaigns/campaign-objectives',
  'campaigns/campaign-catalog',
  'campaigns/campaign-types',
  'offers/offer-list',
  'offers/create-offer',
  'offers/view-offer-details',
  'offers/offer-catalog',
  'products/products-list',
  'products/create-product',
  'products/view-product-details',
  'products/product-edit',
  'products/product-reports',
  'products/product-catalog',
  'segments/segments-list',
  'segments/create-segment',
  'segments/view-segment-details',
  'segments/segment-reports',
  'segments/segment-edit',
  'segments/segment-catalog',
  'customer-360/customers-list',
  'customer-360/create-customer',
  'customer-360/view-customer-details',
  'customer-360/customer-reports',
  'users/users-list',
  'users/create-user',
  'users/view-user-details',
  'users/user-reports',
]);

interface BrokenLink {
  link: string;
  resolvedPath: string;
  line: number;
  suggestion?: string;
}

interface ValidationResult {
  isValid: boolean;
  brokenLinks: BrokenLink[];
}

/**
 * Extract all markdown links from content
 * Matches: [text](path) pattern
 * Excludes: image links ![alt](path), external URLs, and anchor links
 */
export function extractLinks(
  content: string
): Array<{ link: string; line: number }> {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: Array<{ link: string; line: number }> = [];
  let match;

  const lines = content.split('\n');

  while ((match = linkRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const linkPath = match[2];

    // Skip image links (! prefix before [)
    if (fullMatch.startsWith('!')) {
      continue;
    }

    // Skip image file extensions
    if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(linkPath)) {
      continue;
    }

    // Skip /img/ or /images/ paths (static assets)
    if (linkPath.startsWith('/img/') || linkPath.startsWith('/images/')) {
      continue;
    }

    // Skip external URLs
    if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
      continue;
    }

    // Skip anchor links (e.g., #section)
    if (linkPath.startsWith('#')) {
      continue;
    }

    // Find which line this link is on
    let currentCharCount = 0;
    let lineNum = 0;
    for (let i = 0; i < lines.length; i++) {
      if (currentCharCount + lines[i].length >= match.index) {
        lineNum = i + 1;
        break;
      }
      currentCharCount += lines[i].length + 1; // +1 for newline
    }

    links.push({ link: linkPath, line: lineNum });
  }

  return links;
}

/**
 * Resolve relative path to absolute page slug
 * Examples:
 * - './password-reset' from 'authentication/login' → 'authentication/password-reset'
 * - '../getting-started/dashboard' from 'authentication/login' → 'getting-started/dashboard'
 */
export function resolvePath(
  linkPath: string,
  currentPageSlug: string
): string {
  // If it's already a full slug (no ./ or ../), assume it's absolute
  if (!linkPath.startsWith('.')) {
    return linkPath;
  }

  const currentDir = currentPageSlug.substring(
    0,
    currentPageSlug.lastIndexOf('/')
  );

  let resolved = linkPath;

  // Handle ../ (parent directory)
  while (resolved.startsWith('../')) {
    resolved = resolved.substring(3);
    // Go up one directory
    const lastSlash = currentDir.lastIndexOf('/');
    if (lastSlash === -1) break;
  }

  // Handle ./ (current directory)
  if (resolved.startsWith('./')) {
    resolved = resolved.substring(2);
  }

  // Combine with current directory
  if (currentDir) {
    return currentDir + '/' + resolved;
  }

  return resolved;
}

/**
 * Find closest matching page slug for suggestions
 */
function findClosestMatch(target: string): string | undefined {
  let closest: string | undefined;
  let closestDistance = Infinity;

  for (const page of VALID_PAGES) {
    const distance = levenshteinDistance(target, page);
    if (distance < closestDistance && distance <= 3) {
      closestDistance = distance;
      closest = page;
    }
  }

  return closest;
}

/**
 * Simple Levenshtein distance for typo detection
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Validate all links in markdown content
 */
export function validateLinks(
  content: string,
  currentPageSlug: string
): ValidationResult {
  const links = extractLinks(content);
  const brokenLinks: BrokenLink[] = [];

  for (const { link, line } of links) {
    const resolved = resolvePath(link, currentPageSlug);

    if (!VALID_PAGES.has(resolved)) {
      const suggestion = findClosestMatch(resolved);
      brokenLinks.push({
        link,
        resolvedPath: resolved,
        line,
        suggestion,
      });
    }
  }

  return {
    isValid: brokenLinks.length === 0,
    brokenLinks,
  };
}

/**
 * Format broken links for display
 */
export function formatBrokenLinks(brokenLinks: BrokenLink[]): string {
  if (brokenLinks.length === 0) {
    return '';
  }

  let message = '';

  for (const { link, resolvedPath, line, suggestion } of brokenLinks) {
    message += `Line ${line}: [${link}]\n`;
    message += `  → Resolved to: ${resolvedPath}\n`;
    if (suggestion) {
      message += `  Suggestion: ${suggestion}\n`;
    }
    message += '\n';
  }

  return message;
}
