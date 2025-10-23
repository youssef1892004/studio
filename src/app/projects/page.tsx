import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProjectsClient from './ProjectsClient';

export const metadata: Metadata = {
  title: 'My Projects',
  description: 'Manage your voice projects on Studio. Create, edit, and generate audio content.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectsPage() {
    const cookieStore = cookies();
    const token = cookieStore.get('token');

    if (!token) {
        redirect('/login?reason=unauthorized');
    }

    return <ProjectsClient />;
}