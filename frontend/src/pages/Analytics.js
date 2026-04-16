import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, Users, Zap, Award } from 'lucide-react';

const Analytics = () => {
  const data = [
    { name: 'Week 1', users: 400, revenue: 2400 },
    { name: 'Week 2', users: 600, revenue: 3500 },
    { name: 'Week 3', users: 800, revenue: 5200 },
    { name: 'Week 4', users: 1100, revenue: 7800 },
  ];

  const pieData = [
    { name: 'Basic', value: 400 },
    { name: 'Pro', value: 300 },
    { name: 'Enterprise', value: 300 },
  ];

  const COLORS = ['#4f46e5', '#8b5cf6', '#06b6d4'];

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Deep Insights
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>Advanced behavioral and financial metrics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <MetricCard icon={<TrendingUp />} title="Monthly Growth" value="+24%" sub="Since last month" color="#4f46e5" />
        <MetricCard icon={<Zap />} title="Active Density" value="88%" sub="Users per workspace" color="#f59e0b" />
        <MetricCard icon={<Award />} title="Retention" value="96.4%" sub="Customer satisfaction" color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>User Acquisition</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Weekly active user growth trend.</p>
          </div>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#4f46e5" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>Plan Distribution</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Revenue by subscritpion tier.</p>
          </div>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value, sub, color }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ color, background: `${color}12`, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div>
      <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '0.25rem' }}>{sub}</div>
    </div>
  </div>
);

export default Analytics;
