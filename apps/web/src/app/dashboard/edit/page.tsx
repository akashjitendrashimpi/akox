'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabase } from '../../../lib/supabase';

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
      setName(String(p.display_name));
      setBio(String(p.bio));
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
      <header className="bar">
        <Link className="logo" href="/dashboard">akox</Link>
        {username && <Link className="btn ghost" href={'/u/' + username}>View public page</Link>}
      </header>
      <main className="narrow">
        <h1 className="small">Edit your portfolio</h1>

        <form onSubmit={saveProfile}>
          <label className="field" htmlFor="name">Your name</label>
          <input id="name" className="text" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          <label className="field" htmlFor="bio">About you</label>
          <textarea id="bio" className="text" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} />
          <button className="btn">Save</button>
        </form>

        <h2 style={{ marginTop: 40 }}>Projects</h2>
        {projects.length === 0 && <p className="note">No projects yet. Add your first one below.</p>}
        {projects.map((p) => (
          <section className="report" key={p.id}>
            <div className="proj">
              <div><b>{p.title}</b>{p.description && <p>{p.description}</p>}</div>
              <button className="btn ghost" onClick={() => void remove(p.id)}>Delete</button>
            </div>
          </section>
        ))}

        <form onSubmit={addProject} style={{ marginTop: 24 }}>
          <label className="field" htmlFor="pt">Project title</label>
          <input id="pt" className="text" maxLength={80} value={pt} onChange={(e) => setPt(e.target.value)} />
          <label className="field" htmlFor="pd">What is it?</label>
          <textarea id="pd" className="text" maxLength={500} value={pd} onChange={(e) => setPd(e.target.value)} />
          <label className="field" htmlFor="pu">Link (optional)</label>
          <input id="pu" className="text" placeholder="https://" value={pu} onChange={(e) => setPu(e.target.value)} />
          <button className="btn">Add project</button>
        </form>

        <p className="note" role="status">{msg || ' '}</p>
      </main>
    </>
  );
}