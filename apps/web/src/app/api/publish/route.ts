import { BundleError, extractBundle } from '@akox/core';
import { PublishInputError, runPublish } from '../../../lib/publish-flow';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  return runPublish(req, 'zip', async (limits) => {
    if (Number(req.headers.get('content-length') ?? 0) > limits.maxZipBytes) {
      throw new PublishInputError(`Your plan allows up to ${Math.round(limits.maxZipBytes / 1048576)} MB per upload.`, 413);
    }
    try {
      return extractBundle(new Uint8Array(await req.arrayBuffer()), limits);
    } catch (e) {
      throw new PublishInputError(e instanceof BundleError ? e.message : 'Could not read that zip.');
    }
  });
}
