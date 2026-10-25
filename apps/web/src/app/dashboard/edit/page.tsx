'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabase } from '../../../lib/supabase';
import { AppBar } from '../../../components/AppBar';
import { SiteMock } from '../../../components/app/SiteMock';

interface Project { id: string; title: string; description: string; url: string | null }

export default function EditPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [pt, setPt] = useState('');
  const [pd, setPd] = useState('');
  const [pu, setPu] = useState('');
  const [msg, setMsg] = useState('');

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
      setName(String(p.display_name ?? ''));
      setBio(String(p.bio ?? ''));
      const { data: list } = await sb.from('projects').select('id, title, description, url').eq('owner_id', user.id).order('created_at');
      setProjects((list ?? []) as Project[]);
    })();
  }, [router]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !uid) return;
    const { error } = await sb.from('profiles').update({ display_name: name, bio }).eq('id', uid);
    setMsg(error ? error.message : 'Saved.');
  }

  async function addProject(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !uid || !pt.trim()) return;
    const link = pu.trim() === '' ? null : pu.trim();
    const { data, error } = await sb.from('projects')
      .insert({ owner_id: uid, title: pt.trim(), description: pd.trim(), url: link })
      .select('id, title, description, url').single();
    if (error) { setMsg(error.message.includes('url') ? 'The link must start with http:// or https://' : error.message); return; }
    setProjects([...projects, data as Project]);
    setPt(''); setPd(''); setPu('');
    setMsg('Project added.');
  }

  async function remove(id: string) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('projects').delete().eq('id', id);
    if (error) setMsg(error.message);
    else setProjects(projects.filter((p) => p.id !== id));
  }

  return (
    <>
      <AppBar />
      <main className="ap-wrap ap-page">
        <div className="ap-pagehead">
          <h1 className="ap-title">Edit your portfolio</h1>
          {username && <Link className="ap-btn ap-btn-ghost ap-btn-sm" href={'/u/' + username}>View public page</Link>}
        </div>

        <div className="ap-edit">
          <div>
            <form className="ap-panel" onSubmit={saveProfile}>
              <label className="ap-label" htmlFor="name">Your name</label>
              <input id="name" className="ap-input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
              <label className="ap-label" htmlFor="bio">About you</label>
              <textarea id="bio" className="ap-input" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} />
              <span className="ap-count" aria-hidden="true">{bio.length}/500</span>
              <button className="ap-btn ap-submit">Save</button>
            </form>

            <h2 className="ap-h2 ap-section-gap">Projects</h2>
            {projects.length === 0 && <p className="ap-note">No projects yet. Add your first one below.</p>}
            {projects.length > 0 && (
              <ul className="ap-projects">
                {projects.map((p) => (
                  <li className="ap-project" key={p.id}>
                    <div><b>{p.title}</b>{p.description && <p>{p.description}</p>}</div>
                    <button className="ap-btn ap-btn-ghost ap-btn-sm ap-btn-danger" aria-label={`Delete ${p.title}`} onClick={() => void remove(p.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}

            <form className="ap-panel" onSubmit={addProject} style={{ marginTop: 16 }}>
              <label className="ap-label" htmlFor="pt">Project title</label>
              <input id="pt" className="ap-input" maxLength={80} value={pt} onChange={(e) => setPt(e.target.value)} />
              <label className="ap-label" htmlFor="pd">What is it?</label>
              <textarea id="pd" className="ap-input" maxLength={500} value={pd} onChange={(e) => setPd(e.target.value)} />
              <span className="ap-count" aria-hidden="true">{pd.length}/500</span>
              <label className="ap-label" htmlFor="pu">Link (optional)</label>
              <input id="pu" className="ap-input" placeholder="https://" value={pu} onChange={(e) => setPu(e.target.value)} />
              <button className="ap-btn ap-submit">Add project</button>
            </form>

            <p className="ap-note ap-status" role="status">{msg || ' '}</p>
          </div>

          <aside className="ap-edit-preview" aria-hidden="true">
            <p className="ap-note">Live preview of your public page</p>
            <SiteMock username={username} name={name} bio={bio} projects={projects.map((p) => ({ title: p.title, description: p.description }))} />
          </aside>
        </div>
      </main>
    </>
  );
}
