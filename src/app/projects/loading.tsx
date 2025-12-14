import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6">
            <div className="container mx-auto max-w-7xl space-y-8">

                {/* Header Section Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <Skeleton className="h-4 w-64 md:w-96 rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                </div>

                {/* Filters/Search Skeleton */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border/50">
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                        <Skeleton className="h-9 w-20 rounded-full" />
                        <Skeleton className="h-9 w-20 rounded-full" />
                        <Skeleton className="h-9 w-20 rounded-full" />
                    </div>
                    <div className="w-full sm:w-64">
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>

                {/* Projects Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm h-[280px] flex flex-col">
                            {/* Thumbnail */}
                            <div className="relative h-40 w-full bg-muted/50 p-4 flex items-center justify-center">
                                <Skeleton className="w-12 h-12 rounded-lg" />
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1 justify-between">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <Skeleton className="h-5 w-3/4 rounded-md" />
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    </div>
                                    <Skeleton className="h-3 w-1/2 rounded-md" />
                                </div>

                                <div className="flex items-center justify-between pt-4 mt-auto">
                                    <Skeleton className="h-3 w-20 rounded-md" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
