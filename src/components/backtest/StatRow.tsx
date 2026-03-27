interface StatRowProps {
  label: string;
  value: string | number;
}

export function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-mono text-md font-semibold text-primary">{value}</span>
    </div>
  );
}
