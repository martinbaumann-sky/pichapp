import { cn } from "@/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]",
                "loading-shimmer",
                className
            )}
            {...props}
        />
    );
}

export function MatchCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
            {/* Map Skeleton */}
            <Skeleton className="h-48 w-full rounded-none" />

            {/* Content Skeleton */}
            <div className="space-y-4 p-5 sm:p-6">
                {/* Badge */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>

                {/* Info items */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                </div>

                {/* Price section */}
                <div className="flex items-center justify-between border-t-2 border-gray-100 pt-4">
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-8 w-28 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function MatchGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 xl:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <MatchCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function PageHeaderSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-64" />
        </div>
    );
}
