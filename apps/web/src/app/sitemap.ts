import type { MetadataRoute } from 'next';
import { BRAND } from '../lib/brand';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/explore', '/signup', '/login', '/terms', '/privacy', '/acceptable-use', '/report'].map((p) => ({ url: BRAND.url + p }));
}
