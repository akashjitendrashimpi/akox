import { redirect } from 'next/navigation';

/** The upload page now lives inside the dashboard. This keeps old links and bookmarks working. */
export default function OldUploadPage() {
  redirect('/dashboard/upload');
}
