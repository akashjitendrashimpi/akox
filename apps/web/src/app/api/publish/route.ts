import { BundleError, extractBundle } from '@akox/core';
import { PublishInputError, runPublish } from '../../../lib/publish-flow';
import { readSafeBody } from '../../../lib/safe-stream';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  return runPublish(req, 'zip', async (limits) => {
    const rawZip = await readSafeBody(req, limits.maxZipBytes);
    try {
      return extractBundle(rawZip, limits);
    } catch (e) {
      throw new PublishInputError(e instanceof BundleError ? e.message : 'Could not read that zip.');
    }
  });
}
