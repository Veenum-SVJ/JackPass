/**
 * Fuzzy-match a scanned institution name against the known institutions list.
 *
 * Uses a combination of:
 * - Exact match (case-insensitive)
 * - Abbreviation expansion (UNILAG → University of Lagos)
 * - Substring containment
 * - Token overlap scoring
 */

// Common Nigerian university abbreviations → full names
const ABBREVIATIONS: Record<string, string> = {
  'unilag': 'University of Lagos',
  'ui': 'University of Ibadan',
  'oau': 'Obafemi Awolowo University',
  'futo': 'Federal University of Technology, Owerri',
  'abu': 'Ahmadu Bello University',
  'buk': 'Bayero University Kano',
  'unn': 'University of Nigeria, Nsukka',
  'oou': 'Olabisi Onabanjo University',
  'lasu': 'Lagos State University',
  'uniuyo': 'University of Uyo',
  'uniben': 'University of Benin',
  'uniilorin': 'University of Ilorin',
  'unimaad': 'University of Maiduguri',
  'uniabuja': 'University of Abuja',
  'funaab': 'Federal University of Agriculture, Abeokuta',
  'ksu': 'Kogi State University',
  'rsu': 'Rivers State University',
  'ploy': 'Polytechnic',
};

/**
 * Find the best matching institution from the list.
 * Returns the matched institution name or null if no good match.
 */
export function fuzzyMatchInstitution(
  scannedName: string,
  institutions: { name: string }[],
): string | null {
  if (!scannedName || institutions.length === 0) return null;

  const normalised = scannedName.toLowerCase().trim();

  // 1. Try expanding abbreviations first
  const expanded = ABBREVIATIONS[normalised];
  if (expanded) {
    const match = institutions.find(
      (inst) => inst.name.toLowerCase() === expanded.toLowerCase(),
    );
    if (match) return match.name;
  }

  // 2. Exact match (case-insensitive)
  for (const inst of institutions) {
    if (inst.name.toLowerCase() === normalised) return inst.name;
  }

  // 3. Substring match — scanned name contains institution name or vice versa
  for (const inst of institutions) {
    const instLower = inst.name.toLowerCase();
    if (instLower.includes(normalised) || normalised.includes(instLower)) {
      return inst.name;
    }
  }

  // 4. Token overlap — count shared words
  const scannedTokens = new Set(normalised.split(/[\s,]+/).filter((t) => t.length > 2));
  let bestScore = 0;
  let bestMatch: string | null = null;

  for (const inst of institutions) {
    const instTokens = new Set(inst.name.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 2));
    let overlap = 0;
    for (const token of scannedTokens) {
      if (instTokens.has(token)) overlap++;
    }
    // Score as fraction of scanned tokens matched
    const score = scannedTokens.size > 0 ? overlap / scannedTokens.size : 0;
    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = inst.name;
    }
  }

  return bestMatch;
}
