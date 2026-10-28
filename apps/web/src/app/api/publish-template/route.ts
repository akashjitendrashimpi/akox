import { parsePortfolioRequest, renderPortfolio, type ParsedRequest } from '@akox/core';
import { PublishInputError, runPublish } from '../../../lib/publish-flow';

export const runtime = 'nodejs';

type ValidRequest = Extract<ParsedRequest, { ok: true }>;

export async function POST(req: Request): Promise<Response> {
  let accepted: ValidRequest | undefined;
  return runPublish(
    req,
    'template',
    async () => {
      if (Number(req.headers.get('content-length') ?? 0) > 200_000) {
        throw new PublishInputError('That is too much text.', 413);
      }
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        throw new PublishInputError('Invalid request.');
      }
      const parsed = parsePortfolioRequest(body);
      if (!parsed.ok) throw new PublishInputError(parsed.error);
      accepted = parsed;
      return renderPortfolio(parsed.template, parsed.data);
    },
    // Remember the template and details, so the Site builder can reopen them and "Update my live site" is one click.
    async ({ userId, sb }) => {
      if (!accepted) return;
      await sb.from('site_settings').upsert({
        owner_id: userId,
        template_id: accepted.template,
        template_data: accepted.data,
        updated_at: new Date().toISOString(),
      });
    },
  );
}
