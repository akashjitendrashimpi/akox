import type { ReactNode } from 'react';

/** The title row every dashboard page starts with: title and short lead on the left, the main action on the right. */
export function PageHeader({ title, lead, actions }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="ap-ph">
      <div className="ap-ph-text">
        <h1 className="ap-ph-title">{title}</h1>
        {lead ? <div className="ap-ph-lead">{lead}</div> : null}
      </div>
      {actions ? <div className="ap-ph-actions">{actions}</div> : null}
    </header>
  );
}
