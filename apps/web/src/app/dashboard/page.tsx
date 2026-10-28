'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { DAILY_LIMIT } from '../../lib/limits';
import { asKind } from '../../lib/liveSite';
import { DashboardView, type DashboardMe } from '../../components/app/DashboardView';

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<DashboardMe | null>(null);
  const [state, setState] = useState<'loading' | 'out' | 'in'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setState('out'); return; }
    void (async () => {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) { setState('out'); return; }
      const { data: p } = await sb.from('profiles').select('username, display_name, bio, plan').eq('id', user.id).maybeSingle();
      if (!p) { router.replace('/onboarding'); return; }
      const { data: list, count } = await sb.from('projects')
        .select('title, description', { count: 'exact' })
        .eq('owner_id', user.id)
        .order('created_at')
        .limit(3);
      const { data: site } = await sb.from('portfolio_sites').select('total_bytes, kind, previous_kind, updated_at').eq('owner_id', user.id).maybeSingle();
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count: used } = await sb.from('publish_log').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).gte('created_at', since);
      const items = ((list ?? []) as { title: string; description: string | null }[])
        .map((r) => ({ title: String(r.title), description: String(r.description ?? '') }));
      setMe({
        username: String(p.username),
        name: String(p.display_name || p.username),
        bio: String(p.bio ?? ''),
        projects: count ?? items.length,
        items,
        plan: p.plan ? String(p.plan) : null,
        usedBytes: Number(site?.total_bytes ?? 0),
        kind: site ? asKind(site.kind) : null,
        previousKind: site ? asKind(site.previous_kind) : null,
        updatedAt: site?.updated_at ? String(site.updated_at) : null,
        uploadsLeft: Math.max(0, DAILY_LIMIT - (used ?? 0)),
        uploadsMax: DAILY_LIMIT,
      });
      setState('in');
    })();
  }, [router]);

  function copy() {
    if (!me) return;
    void navigator.clipboard.writeText(`${window.location.origin}/u/${me.username}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (state === 'loading') {
    return (
      <div aria-busy="true">
        <p className="ap-sr" role="status">Loading your dashboard</p>
        <div className="ap-skel" style={{ height: 52, width: 'min(420px, 100%)', marginBottom: 12 }} />
        <div className="ap-skel" style={{ height: 40, width: 'min(300px, 100%)', marginBottom: 28 }} />
        <div className="ap-skel" style={{ height: 300, borderRadius: 24, marginBottom: 20 }} />
        <div className="ap-skel" style={{ height: 220, borderRadius: 20 }} />
      </div>
    );
  }

  if (state === 'out' || !me) {
    return (
      <div className="ap-narrow">
        <h1 className="ap-title">You are not logged in</h1>
        <p className="ap-lead">Log in to see your portfolio.</p>
        <Link className="ap-btn" href="/login">Go to login</Link>
      </div>
    );
  }

  return <DashboardView me={me} copied={copied} onCopy={copy} />;
}
