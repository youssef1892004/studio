import { Metadata } from 'next';
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
    return <ProjectsClient />;
}