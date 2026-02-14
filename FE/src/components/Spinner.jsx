export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 border-[2.5px] border-accent/20 rounded-full" />
        <div className="w-8 h-8 border-[2.5px] border-accent border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
    </div>
  );
}
