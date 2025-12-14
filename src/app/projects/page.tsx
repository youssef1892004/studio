import { Metadata } from 'next';
import ProjectsClient from './ProjectsClient';

export const metadata: Metadata = {
  title: 'مشاريعي - MuejamStudio',
  description: 'قم بإدارة مشاريعك الصوتية والمرئية في استوديو معجم. أنشئ، حرر، وانتج محتوى احترافي.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}