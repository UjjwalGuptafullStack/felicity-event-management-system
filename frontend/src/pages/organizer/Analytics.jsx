import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Users, CheckCircle2, Tag } from 'lucide-react';
import { getOrganizerAnalyticsOverview } from '../../api/organizer';
import { StatsCard } from '../../components/design-system/StatsCard';

const CATEGORY_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

// Fold anything past the top 4 categories into "Other" so the categorical
// palette never has to stretch past its fixed 5-color order.
const bucketCategories = (breakdown) => {
  const sorted = [...breakdown].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4);
  const otherCount = rest.reduce((sum, c) => sum + c.count, 0);
  return otherCount > 0 ? [...top, { category: 'other', count: otherCount }] : top;
};

const titleCase = (s) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function ChartCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getOrganizerAnalyticsOverview();
        setAnalytics(res.data.analytics);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-10">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const categoryData = bucketCategories(analytics.categoryBreakdown).map((c) => ({
    ...c,
    label: titleCase(c.category),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 space-y-8 max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Registration and attendance trends across all your events</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total Events" value={analytics.totalEvents} icon={Tag} gradient="primary" change="All time" changeType="neutral" />
          <StatsCard title="Total Registrations" value={analytics.totalRegistrations} icon={Users} gradient="secondary" change="All time" changeType="neutral" />
          <StatsCard title="Total Attendance" value={analytics.totalAttendance} icon={CheckCircle2} gradient="accent" change="All time" changeType="neutral" />
          <StatsCard title="Attendance Rate" value={`${analytics.attendanceRate}%`} icon={TrendingUp} gradient="primary" change="Of registered" changeType="neutral" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard icon={TrendingUp} title="Registrations — last 30 days">
            {analytics.registrationsOverTime.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No registrations in this period yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analytics.registrationsOverTime} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="count" name="Registrations" stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard icon={Tag} title="Registrations by category">
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No categorized events yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="count" name="Registrations" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, i) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard icon={BarChart3} title="Top events by registrations">
          {analytics.topEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No registrations yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, analytics.topEvents.length * 48)}>
              <BarChart data={analytics.topEvents} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  width={180}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="registrations" name="Registrations" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

export default Analytics;
