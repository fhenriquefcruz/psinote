import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, ComposedChart, Bar, BarChart, Legend } from 'recharts';

export default function Charts({ data, monthlyData }) {
  const defaultMonthly = [
    { month: 'Jan', sessions: 4 },
    { month: 'Fev', sessions: 6 },
    { month: 'Mar', sessions: 3 },
    { month: 'Abr', sessions: 8 },
    { month: 'Mai', sessions: 5 },
    { month: 'Jun', sessions: 7 },
  ];
  const monthly = monthlyData && monthlyData.length > 0 ? monthlyData : defaultMonthly;

  const defaultHumor = [
    { date: 'Jan', humor: 6 },
    { date: 'Fev', humor: 7 },
    { date: 'Mar', humor: 5 },
    { date: 'Abr', humor: 8 },
    { date: 'Mai', humor: 7 },
    { date: 'Jun', humor: 9 },
  ];
  const humor = data && data.length > 0 ? data : defaultHumor;

  const CustomTooltip = ({ active, payload, label, type }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-primary)',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-color)'
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {type === 'humor' ? `Humor: ${payload[0].value}/10` : `${payload[0].value} sessões`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Gráfico de Evolução do Humor */}
      <div>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          📈 Evolução do Humor (últimas 10 sessões)
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={humor} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} ticks={[0, 2, 4, 6, 8, 10]} />
            <Tooltip content={<CustomTooltip type="humor" />} />
            <Area type="monotone" dataKey="humor" stroke="#4F46E5" strokeWidth={2.5} fill="url(#humorGradient)" dot={{ fill: '#4F46E5', r: 4, strokeWidth: 2, stroke: 'var(--bg-primary)' }} activeDot={{ r: 6, fill: '#4F46E5' }} />
            <Line type="monotone" dataKey="humor" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 4, strokeWidth: 2, stroke: 'var(--bg-primary)' }} activeDot={{ r: 6, fill: '#4F46E5' }} />
            <defs>
              <linearGradient id="humorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Sessões por Mês */}
      <div>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          📊 Sessões por Mês
        </h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip type="sessions" />} />
            <Bar dataKey="sessions" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={30} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
