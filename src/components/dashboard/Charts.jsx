import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Dot } from 'recharts';

export default function Charts({ data }) {
  const defaultData = [
    { date: 'Jan', humor: 6 },
    { date: 'Fev', humor: 7 },
    { date: 'Mar', humor: 5 },
    { date: 'Abr', humor: 8 },
    { date: 'Mai', humor: 7 },
    { date: 'Jun', humor: 9 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  const CustomTooltip = ({ active, payload, label }) => {
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
            Humor: {payload[0].value}/10
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={{ stroke: 'var(--border-color)' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          ticks={[0, 2, 4, 6, 8, 10]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="humor"
          stroke="#4F46E5"
          strokeWidth={2.5}
          dot={{ fill: '#4F46E5', r: 4, strokeWidth: 2, stroke: 'var(--bg-primary)' }}
          activeDot={{ r: 6, fill: '#4F46E5' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
