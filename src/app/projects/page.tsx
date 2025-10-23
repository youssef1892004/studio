import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProjectsClient from './ProjectsClient';

export default function ProjectsPage() {
    const cookieStore = cookies();
    const token = cookieStore.get('token');

    if (!token) {
        redirect('/login?reason=unauthorized');
    }

    return <ProjectsClient />;
}