/* 
  This helps to 
    1. Add newer versions in a single place
    2. reduce work: When a new version of a route/etc is added, 
          the versions can solidified on the old/new 
          route/controller at that moment, and the newer one can
          use the VERSION_NEUTRAL,
          without affecting anything else
    3. Make removing legacy versions simple by enabling 'where used'
          and having a central place to remove the legacy version.
*/

// When a route is overridden by a new version, the old one has to
//   set its version range
export const buildVersionRange = (
  start: number,
  endInclusive?: number,
): string[] => {
  const versions = [];
  for (let i = start; i <= endInclusive; i++) {
    versions.push(i.toString());
  }
  return versions;
};

export const V1: number = 1;
export const SUPPORTED_VERSIONS: string[] = buildVersionRange(V1);
