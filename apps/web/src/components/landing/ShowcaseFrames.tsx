'use client';

import { useDeferredValue, useMemo } from 'react';
import { TEMPLATES, renderPortfolio, type TemplateId } from '@akox/core';
import { ScaledFrame } from '../app/ScaledFrame';

/** Real templates rendered with the visitor's name. Loaded only when scrolled into view (it pulls in @akox/core). */
export default function ShowcaseFrames({ name }: { name: string }) {
  const slow = useDeferredValue(name);
  const pages = useMemo(() => {
    const data = { name: slow || 'Your Name', headline: 'Your headline goes here', bio: 'A short line about you and what you make.', skills: ['Design', 'Code'], links: [], projects: [] };
    return Object.fromEntries(TEMPLATES.map((t) => {
      try { return [t.id, new TextDecoder().decode(renderPortfolio(t.id, data as never).files[0]?.data)]; } catch { return [t.id, '']; }
    })) as Record<TemplateId, string>;
  }, [slow]);

  return (
    <ul className="lp-tpls" role="list">
      {TEMPLATES.map((t) => (
        <li key={t.id}>
          <div className="lp-tpl-thumb"><ScaledFrame html={pages[t.id]} width={1000} title={`${t.name} template preview`} decorative /></div>
          <b>{t.name}</b>
          <span>Template preview</span>
        </li>
      ))}
    </ul>
  );
}
