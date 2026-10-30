import { SITE_SUFFIX } from '../../lib/site-url';

type Project = { title: string; description?: string };

type Props = {
  username: string;
  name?: string;
  bio?: string;
  /** When omitted, the mock shows placeholder tiles instead of real projects. */
  projects?: Project[];
};

/** A small paper "browser window" that previews someone's portfolio. Decorative: always hidden from screen readers. */
export function SiteMock({ username, name, bio, projects }: Props) {
  const handle = username || 'yourname';
  const title = name?.trim() || handle.charAt(0).toUpperCase() + handle.slice(1);

  return (
    <div className="ap-mock" aria-hidden="true">
      <div className="ap-chrome">
        <span className="ap-dots"><i /><i /><i /></span>
        <span className="ap-url">
          <span className="ap-lock" />
          <span>{handle}<span className="ap-url-dim">{SITE_SUFFIX}</span></span>
        </span>
      </div>
      <div className="ap-mock-body">
        <div className="ap-avatar">{title.charAt(0)}</div>
        <p className="ap-mock-name">{title}</p>

        {bio === undefined ? (
          <>
            <span className="ap-sk" style={{ width: '80%' }} />
            <span className="ap-sk" style={{ width: '58%' }} />
          </>
        ) : bio.trim() ? (
          <p className="ap-mock-bio">{bio}</p>
        ) : null}

        {projects === undefined ? (
          <div className="ap-mock-tiles"><i /><i /><i /></div>
        ) : projects.length > 0 ? (
          <ul className="ap-mock-projects">
            {projects.map((p, i) => (
              <li key={i}>
                <b>{p.title}</b>
                {p.description ? <span>{p.description}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ap-mock-empty">Your projects will appear here.</p>
        )}
      </div>
    </div>
  );
}
