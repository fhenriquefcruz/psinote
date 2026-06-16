import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Charts({ data }) {
  const defaultData = [
    { name: 'Jan', value: 10 },
    { name: 'Fev', value: 20 },
    { name: 'Mar', value: 15 },
    { name: 'Abr', value: 25 },
    { name: 'Mai', value: 30 },
    { name: 'Jun', value: 22 },
  ];
  const chartData = data || defaultData;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#4F46E5" />
      </LineChart>
    </ResponsiveContainer>
  );
}
