export default function Skeleton({ width = '100%', height = '20px' }) {
  return <div style={{ width, height, background: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />;
}
