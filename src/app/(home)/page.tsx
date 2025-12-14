import LandingPageClient from '@/components/LandingPageClient';

export default async function LandingPage() {
  // Artificial delay to demonstrate Loading Skeleton (3 seconds)
  // TODO: Remove this in production or replace with actual data fetching
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return <LandingPageClient />;
}