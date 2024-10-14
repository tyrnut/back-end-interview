/* 
  This helps with:
    1. Adding newer versions in a single place
    2. Only needing to change versions on controllers when a version change is necessary
    3. Making removing legacy versions simple by enabling 'where used'
*/
export const V1: number = 1;
export const CURRENT_VERSION: number = V1;

// Call this to pin the versions of an old route
export const buildVersionRange = (
  start: number,
  endInclusive = CURRENT_VERSION,
): string[] => {
  if (start > endInclusive) {
    throw RangeError('Version range is inverted');
  }
  const versions: string[] = [];
  for (let i = start; i <= endInclusive; i++) {
    versions.push(i.toString());
  }
  return versions;
};

export const SUPPORTED_VERSIONS: string[] = buildVersionRange(V1);

export const METRIC_TRANSACTION_DURATION: string = 'http_transaction_duration';
