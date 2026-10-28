'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabase } from '../../../lib/supabase';
import { CheckIcon, ExternalIcon, PencilIcon, PlusIcon, TrashIcon } from '../../../components/app/Icons';
import { PageHeader } from '../../../components/app/PageHeader';
import { SiteMock } from '../../../components/app/SiteMock';

interface Project { id: string; title: string; description: string; url: string | null }
interface Draft { title: string; description: string; url: string }
type Tab = 'profile' | 'projects';

const EMPTY: Draft = { title: '', description: '', url: '' };
const toDraft = (p: Project): Draft => ({ title: p.title, description: p.description ?? '', url: p.url ?? '' });

function host(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

/** The three project fields, used for both "add" and "edit" so the two always look the same. */
function ProjectFields({ id, draft, onChange, onSubmit, onCancel, submitLabel, busy }: {
  id: string; draft: Draft; onChange: (d: Draft) => void; onSubmit: (e: FormEvent) => void;
  onCancel: () => void; submitLabel: string; busy: boolean;
}) {
  return (
    <form className="ap-proj-form" onSubmit={onSubmit}>
      <label className="ap-label" htmlFor={`${id}-t`}>Project title</label>
      <input id={`${id}-t`} className="ap-input" maxLength={80} required autoFocus value={draft.title}
        onChange={(e) => onChange({ ...draft, title: e.target.value })} />
      <label className="ap-label" htmlFor={`${id}-d`}>What is it?</label>
      <textarea id={`${id}-d`} className="ap-input" maxLength={500} value={draft.description}
        onChange={(e) => onChange({ ...draft, description: e.target.value })} />
      <span className="ap-count" aria-hidden="true">{draft.description.length}/500</span>
      <label className="ap-label" htmlFor={`${id}-u`}>Link (optional)</label>
      <input id={`${id}-u`} className="ap-input" placeholder="https://" inputMode="url" value={draft.url}
        onChange={(e) => onChange({ ...draft, url: e.target.value })} />
      <div className="ap-form-actions">
        <button className="ap-btn ap-btn-sm" aria-busy={busy} disabled={busy || !draft.title.trim()}>{busy ? 'Saving...' : submitLabel}</button>
        <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function EditPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState({ name: '', bio: '' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tab, setTab] = useState<Tab>('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; bad: boolean } | null>(null);
  const [liveKind, setLiveKind] = useState<string | null>(null);

  const dirty = name !== saved.name || bio !== saved.bio;

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void (async () => {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) { router.replace('/login'); return; }
      const { data: p } = await sb.from('profiles').select('username, display_name, bio').eq('id', user.id).maybeSingle();
      if (!p) { router.replace('/onboarding'); return; }
      setUid(user.id);
      setUsername(String(p.username));
      const n = String(p.display_name ?? '');
      const b = String(p.bio ?? '');
      setName(n); setBio(b); setSaved({ name: n, bio: b });
      const { data: list } = await sb.from('projects').select('id, title, description, url').eq('owner_id', user.id).order('created_at');
      setProjects((list ?? []) as Project[]);
      const { data: site } = await sb.from('portfolio_sites').select('kind').eq('owner_id', user.id).maybeSingle();
      setLiveKind(site ? String(site.kind) : null);
    })();
  }, [router]);

  // Messages fade away by themselves.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(id);
  }, [toast]);

  // Do not lose typed text by closing the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Saving here never changes a published website, so say so when one is live.
  const say = (text: string, bad = false) =>
    setToast({ text: !bad && liveKind ? `${text.replace(/\.$/, '')}. Your live website is unchanged.` : text, bad });
  const linkProblem = (m: string) => (m.includes('url') ? 'The link must start with http:// or https://' : m);

  async function saveProfile(e?: FormEvent) {
    e?.preventDefault();
    const sb = getSupabase();
    if (!sb || !uid || !dirty) return;
    setSavingProfile(true);
    // Only these two columns are ever sent. The plan and username cannot be changed from here.
    const { error } = await sb.from('profiles').update({ display_name: name, bio }).eq('id', uid);
    setSavingProfile(false);
    if (error) { say(error.message, true); return; }
    setSaved({ name, bio });
    say('Profile saved');
  }

  async function addProject(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !uid || !draft.title.trim()) return;
    setBusyId('new');
    const { data, error } = await sb.from('projects')
      .insert({ owner_id: uid, title: draft.title.trim(), description: draft.description.trim(), url: draft.url.trim() === '' ? null : draft.url.trim() })
      .select('id, title, description, url').single();
    setBusyId(null);
    if (error) { say(linkProblem(error.message), true); return; }
    setProjects([...projects, data as Project]);
    setDraft(EMPTY); setAdding(false);
    say('Project added');
  }

  async function saveProject(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !editingId || !editDraft.title.trim()) return;
    setBusyId(editingId);
    const { data, error } = await sb.from('projects')
      .update({ title: editDraft.title.trim(), description: editDraft.description.trim(), url: editDraft.url.trim() === '' ? null : editDraft.url.trim() })
      .eq('id', editingId)
      .select('id, title, description, url').single();
    setBusyId(null);
    if (error) { say(linkProblem(error.message), true); return; }
    setProjects(projects.map((p) => (p.id === editingId ? (data as Project) : p)));
    setEditingId(null);
    say('Project updated');
  }

  async function remove(id: string) {
    const sb = getSupabase();
    if (!sb) return;
    setBusyId(id);
    const { error } = await sb.from('projects').delete().eq('id', id);
    setBusyId(null);
    setConfirmId(null);
    if (error) { say(error.message, true); return; }
    setProjects(projects.filter((p) => p.id !== id));
    say('Project deleted');
  }

  return (
    <>
      <PageHeader
        title="Profile and projects"
        lead="This is your card in Explore, and your page until you publish a site. Your live website is edited in Site builder or Upload site."
        actions={username && (
          <Link className="ap-btn ap-btn-ghost ap-btn-sm" href={'/u/' + username}>View public page<ExternalIcon size={16} /></Link>
        )}
      />
      <p className="ap-note ap-editnote">Saving here does not change a website you have published. Templates are filled in on the Site builder page.</p>

      <div className="ap-segtabs" role="tablist" aria-label="Sections">
        <button type="button" role="tab" id="tab-profile" aria-selected={tab === 'profile'} aria-controls="panel-profile" onClick={() => setTab('profile')}>
          Profile{dirty && <i className="ap-dot" aria-label="unsaved changes" />}
        </button>
        <button type="button" role="tab" id="tab-projects" aria-selected={tab === 'projects'} aria-controls="panel-projects" onClick={() => setTab('projects')}>
          Projects<span className="ap-tabcount">{projects.length}</span>
        </button>
      </div>

      <div className="ap-edit">
        <div className="ap-edit-main">
          {tab === 'profile' && (
            <form className="ap-panel ap-step" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" onSubmit={(e) => void saveProfile(e)}>
              <label className="ap-label" htmlFor="name">Your name</label>
              <input id="name" className="ap-input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
              <label className="ap-label" htmlFor="bio">About you</label>
              <textarea id="bio" className="ap-input" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} />
              <span className="ap-count" aria-hidden="true">{bio.length}/500</span>

              <div className={`ap-savebar${dirty ? ' is-dirty' : ''}`}>
                <span className="ap-savebar-text" role="status">{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
                <div className="ap-form-actions">
                  <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" disabled={!dirty || savingProfile}
                    onClick={() => { setName(saved.name); setBio(saved.bio); }}>Discard</button>
                  <button className="ap-btn ap-btn-sm" aria-busy={savingProfile} disabled={!dirty || savingProfile}>{savingProfile ? 'Saving...' : 'Save changes'}</button>
                </div>
              </div>
            </form>
          )}

          {tab === 'projects' && (
            <div id="panel-projects" role="tabpanel" aria-labelledby="tab-projects" className="ap-step">
              <div className="ap-list-head">
                <h2 className="ap-h2">Your projects</h2>
                {!adding && (
                  <button type="button" className="ap-btn ap-btn-sm" onClick={() => { setAdding(true); setEditingId(null); }}>
                    <PlusIcon size={16} />Add project
                  </button>
                )}
              </div>

              {adding && (
                <div className="ap-panel ap-step" style={{ marginBottom: 16 }}>
                  <ProjectFields id="new" draft={draft} onChange={setDraft} onSubmit={(e) => void addProject(e)}
                    onCancel={() => { setAdding(false); setDraft(EMPTY); }} submitLabel="Add project" busy={busyId === 'new'} />
                </div>
              )}

              {projects.length === 0 && !adding && (
                <div className="ap-panel ap-empty">
                  <p className="ap-note" style={{ marginTop: 0 }}>No projects yet. Show something you built.</p>
                  <button type="button" className="ap-btn" onClick={() => setAdding(true)}><PlusIcon size={16} />Add your first project</button>
                </div>
              )}

              {projects.length > 0 && (
                <ul className="ap-projects">
                  {projects.map((p) => (
                    <li className="ap-project" key={p.id}>
                      {editingId === p.id ? (
                        <ProjectFields id={`e-${p.id}`} draft={editDraft} onChange={setEditDraft} onSubmit={(e) => void saveProject(e)}
                          onCancel={() => setEditingId(null)} submitLabel="Save project" busy={busyId === p.id} />
                      ) : (
                        <>
                          <div className="ap-proj-body">
                            <b>{p.title}</b>
                            {p.description && <p>{p.description}</p>}
                            {p.url && <a className="ap-extlink" href={p.url} target="_blank" rel="noopener noreferrer nofollow">{host(p.url)}<ExternalIcon size={14} /></a>}
                          </div>
                          <div className="ap-proj-actions">
                            {confirmId === p.id ? (
                              <>
                                <span className="ap-confirm">Delete this project?</span>
                                <button type="button" className="ap-btn ap-btn-sm ap-btn-dangersolid" disabled={busyId === p.id} onClick={() => void remove(p.id)}>Yes, delete</button>
                                <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" onClick={() => setConfirmId(null)}>Keep</button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm" aria-label={`Edit ${p.title}`}
                                  onClick={() => { setEditingId(p.id); setEditDraft(toDraft(p)); setAdding(false); }}><PencilIcon size={16} />Edit</button>
                                <button type="button" className="ap-btn ap-btn-ghost ap-btn-sm ap-btn-danger" aria-label={`Delete ${p.title}`}
                                  onClick={() => setConfirmId(p.id)}><TrashIcon size={16} />Delete</button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <aside className="ap-edit-preview" aria-hidden="true">
          <p className="ap-note">Preview of your profile card</p>
          <SiteMock username={username} name={name} bio={bio} projects={projects.map((p) => ({ title: p.title, description: p.description }))} />
        </aside>
      </div>

      <div className="ap-toast-wrap" role="status" aria-live="polite">
        {toast && <div className={`ap-toast${toast.bad ? ' is-bad' : ''}`}>{!toast.bad && <CheckIcon size={16} />}{toast.text}</div>}
      </div>
    </>
  );
}
