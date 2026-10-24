/** What the edge worker needs to serve a site. Stored in KV under siteRouteKey(slug). */
export interface SiteRoute {
  /** R2 key prefix of the live version, always ends with "/". */
  prefix: string;
  status: 'active' | 'suspended';
}

export const siteRouteKey = (slug: string): string => `site:${slug}`;

/** Every deploy is immutable. Publishing = write a new prefix, then flip the pointer. */
export const versionPrefix = (siteId: string, versionId: string): string =>
  `sites/${siteId}/${versionId}/`;
