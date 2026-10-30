import { PublishInputError } from './publish-flow';

/**
 * Safely reads a request body stream up to maxBytes without allowing memory exhaustion.
 * If the body exceeds maxBytes, immediately cancels reading and throws a 413 error.
 */
export async function readSafeBody(req: Request, maxBytes: number): Promise<Uint8Array> {
  const clHeader = req.headers.get('content-length');
  if (clHeader) {
    const cl = Number(clHeader);
    if (!Number.isNaN(cl) && cl > maxBytes) {
      throw new PublishInputError(
        `Upload exceeds the allowed limit of ${Math.round(maxBytes / (1024 * 1024))} MB.`,
        413,
      );
    }
  }

  if (!req.body) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > maxBytes) {
      throw new PublishInputError(
        `Upload exceeds the allowed limit of ${Math.round(maxBytes / (1024 * 1024))} MB.`,
        413,
      );
    }
    return new Uint8Array(buf);
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new PublishInputError(
            `Upload exceeds the allowed limit of ${Math.round(maxBytes / (1024 * 1024))} MB.`,
            413,
          );
        }
        chunks.push(value);
      }
    }
  } catch (err) {
    if (err instanceof PublishInputError) throw err;
    throw new PublishInputError('Failed to read upload data.', 400);
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

