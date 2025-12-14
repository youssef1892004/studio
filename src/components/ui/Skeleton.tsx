export default function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-muted/10 ${className}`}
            {...props}
        />
    );
}
