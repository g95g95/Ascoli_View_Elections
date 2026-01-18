interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

export function StatCard({ title, value, subtitle, icon, color = 'blue' }: StatCardProps) {
  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-80">{title}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {subtitle && <div className="mt-1 text-sm opacity-70">{subtitle}</div>}
    </div>
  );
}
