'use client';

interface ActivityChartProps {
  data: { date: string; count: number }[];
  loading?: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-[#E8E0D8] shadow-sm animate-pulse">
        <div className="h-48 bg-[#F5EFE7] rounded"></div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <div className="bg-white rounded-xl p-6 border border-[#E8E0D8] shadow-sm">
      <h3 className="text-lg font-semibold text-[#2D2D2D] mb-6">Attività Ultimi 7 Giorni</h3>

      <div className="flex items-end gap-2 h-48">
        {data.map((day) => {
          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
          const date = new Date(day.date);
          const dayName = days[date.getDay()];

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center">
                <div
                  className="w-full max-w-12 bg-gradient-to-t from-[#C8956C] to-[#D4AF37] rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  {day.count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#6B5E52]">
                      {day.count}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#9B8E82]">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
