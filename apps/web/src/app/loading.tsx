export default function Loading() {
  return (
    <div className="ap-wrap ap-page" aria-busy="true">
      <p className="ap-sr" role="status">Loading page content...</p>
      <div className="ap-skel" style={{ height: 48, width: 'min(380px, 90%)', marginBottom: 16 }} />
      <div className="ap-skel" style={{ height: 24, width: 'min(520px, 75%)', marginBottom: 36 }} />
      <div className="ap-skel" style={{ height: 260, borderRadius: 20, marginBottom: 24 }} />
      <div className="ap-skel" style={{ height: 180, borderRadius: 20 }} />
    </div>
  );
}

