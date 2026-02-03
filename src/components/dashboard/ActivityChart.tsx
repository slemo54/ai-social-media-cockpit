'use client';

interface ActivityChartProps {
  data: { date: string; count: number }[];
  loading?: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Attività Ultimi 7 Giorni</h3>
      
      <div className="flex items-end gap-2 h-48">
        {data.map((day) => {
          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
          const date = new Date(day.date);
          const dayName = days[date.getDay()];
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center">
                <div
                  className="w-full max-w-12 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all duration-500 hover:from-purple-600 hover:to-pink-600"
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  {day.count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700">
                      {day.count}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
