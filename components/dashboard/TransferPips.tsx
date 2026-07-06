export default function TransferPips({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${used} of ${limit} transfers used`}>
      {Array.from({ length: limit }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            i < used ? "w-7 bg-brand-500" : "w-2.5 bg-gray-200 dark:bg-gray-700"
          }`}
        />
      ))}
    </div>
  );
}
