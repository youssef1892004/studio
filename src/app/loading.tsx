export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="relative">
                {/* Outer Ring */}
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                {/* Inner Dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                </div>
            </div>

            <p className="text-muted-foreground font-medium animate-pulse text-sm tracking-wide">
                LOADING STUDIO...
            </p>
        </div>
    );
}
