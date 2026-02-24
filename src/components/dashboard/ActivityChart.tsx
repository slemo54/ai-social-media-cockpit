'use client';

interface ActivityChartProps {
  data: { date: string; count: number }[];
  loading?: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  if (loading) {
    return (
      <div className="dashboard-card p-6 animate-pulse">
        <div className="h-6 w-48 bg-[#1A1A1A] rounded mb-6"></div>
        <div className="h-48 bg-[#1A1A1A] rounded-xl"></div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-lg font-bold text-[#FAFAFA] mb-6">Attività Ultimi 7 Giorni</h3>

      <div className="flex items-end gap-3 h-48">
        {data.map((day) => {
          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
          const date = new Date(day.date);
          const dayName = days[date.getDay()];

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center">
                <div
                  className="w-full max-w-12 bg-gradient-to-t from-[#003366] to-[#004A8F] rounded-t-lg transition-all duration-500 hover:from-[#C4A775] hover:to-[#D4AF7A]"
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  {day.count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-[#FAFAFA]">
                      {day.count}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#525252] font-medium">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
