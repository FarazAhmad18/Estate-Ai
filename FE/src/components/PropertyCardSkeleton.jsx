export default function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border/60 overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="h-6 w-32 skeleton rounded-lg" />
            <div className="h-4 w-44 skeleton rounded-lg mt-2" />
          </div>
          <div className="w-9 h-9 rounded-full skeleton" />
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/40">
          <div className="h-4 w-16 skeleton rounded-lg" />
          <div className="h-4 w-20 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}
