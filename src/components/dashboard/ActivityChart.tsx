'use client';

interface ActivityChartProps {
  data: { date: string; count: number }[];
  loading?: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 animate-pulse">
        <div className="h-48 bg-white/10 rounded"></div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-6">Attività Ultimi 7 Giorni</h3>
      
      <div className="flex items-end gap-2 h-48">
        {data.map((day) => {
          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
          const date = new Date(day.date);
          const dayName = days[date.getDay()];
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center">
                <div
                  className="w-full max-w-12 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all duration-500 hover:from-purple-400 hover:to-pink-400"
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  {day.count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-white">
                      {day.count}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-white/50">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
