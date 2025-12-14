import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">

            {/* Hero Skeleton */}
            <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                        {/* Text Skeleton */}
                        <div className="space-y-8">
                            <Skeleton className="h-8 w-48 rounded-full" />
                            <div className="space-y-4">
                                <Skeleton className="h-16 w-3/4" />
                                <Skeleton className="h-16 w-1/2" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/6" />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Skeleton className="h-14 w-48 rounded-xl" />
                                <Skeleton className="h-14 w-32 rounded-xl" />
                            </div>
                        </div>

                        {/* Demo Player Skeleton */}
                        <div className="w-full">
                            <Skeleton className="w-full aspect-video rounded-3xl" />
                        </div>

                    </div>
                </div>
            </section>

            {/* Features Grid Skeleton */}
            <section className="py-24 bg-muted/20">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <Skeleton className="h-10 w-64 mx-auto" />
                        <Skeleton className="h-4 w-96 mx-auto" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-card border border-border/50 p-8 rounded-2xl h-64 flex flex-col gap-4">
                                <Skeleton className="w-14 h-14 rounded-xl" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}
