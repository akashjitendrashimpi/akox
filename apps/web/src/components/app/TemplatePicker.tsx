'use client';

import { useDeferredValue, useMemo } from 'react';
import { TEMPLATES, renderPortfolio, type PortfolioData, type TemplateId } from '@akox/core';
import { ScaledFrame } from './ScaledFrame';

const html = (id: TemplateId, data: PortfolioData): string => new TextDecoder().decode(renderPortfolio(id, data).files[0]?.data);

/** Three template cards. Each thumbnail is the real template rendered with the person's own details. */
export function TemplatePicker({ value, data, onChange }: { value: TemplateId; data: PortfolioData; onChange: (id: TemplateId) => void }) {
  const slow = useDeferredValue(data);
  const pages = useMemo(() => Object.fromEntries(TEMPLATES.map((t) => [t.id, html(t.id, slow)])) as Record<TemplateId, string>, [slow]);

  return (
    <div className="ap-tpls" role="radiogroup" aria-label="Template">
      {TEMPLATES.map((t) => (
        <label key={t.id} className={`ap-tpl${value === t.id ? ' is-on' : ''}`}>
          <input type="radio" name="template" value={t.id} checked={value === t.id} onChange={() => onChange(t.id)} />
          <span className="ap-tpl-thumb"><ScaledFrame html={pages[t.id]} width={1000} title={`${t.name} preview`} decorative /></span>
          <span className="ap-tpl-text"><b>{t.name}</b><small>{t.description}</small></span>
        </label>
      ))}
    </div>
  );
}
