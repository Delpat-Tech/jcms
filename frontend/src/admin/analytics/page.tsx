import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../layout.tsx';
import { analyticsApi } from '../../api';

type RoleStat = { _id: string; count: number };
type UploadByDay = { _id: string; count: number };

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [content, setContent] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);

  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [db, usr, sys, sec, cnt, pred, perf] = await Promise.all([
          analyticsApi.getDashboard().then(r => r.json()),
          analyticsApi.getUsers(`?days=${days}`).then(r => r.json()),
          analyticsApi.getSystem().then(r => r.json()),
          analyticsApi.getSecurity().then(r => r.json()),
          analyticsApi.getContent().then(r => r.json()),
          analyticsApi.getPredictions().then(r => r.json()),
          analyticsApi.getPerformance().then(r => r.json())
        ]);
        if (!isMounted) return;
        if (!db.success) throw new Error(db.message || 'Failed to load dashboard');
        setDashboard(db.data);
        setUserStats(usr.success ? usr.data : null);
        setSystem(sys.success ? sys.data : null);
        setSecurity(sec.success ? sec.data : null);
        setContent(cnt.success ? cnt.data : null);
        setPredictions(pred.success ? pred.data : null);
        setPerformance(perf.success ? perf.data : null);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e.message || 'Failed to load analytics');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [days]);

  const uploadsSeries: UploadByDay[] = useMemo(() => (dashboard?.uploadsByDay || []).slice().reverse(), [dashboard]);
  const maxUploads = useMemo(() => Math.max(1, ...uploadsSeries.map((d: UploadByDay) => d.count)), [uploadsSeries]);

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6 sm:p-8 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">Analytics Dashboard</h1>
              <p className="text-purple-100">Insights across users, files, performance and security</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-purple-100">Range</label>
              <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="bg-white/10 text-white border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40">
                <option className="text-gray-900" value={7}>Last 7 days</option>
                <option className="text-gray-900" value={14}>Last 14 days</option>
                <option className="text-gray-900" value={30}>Last 30 days</option>
                <option className="text-gray-900" value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Total Users" value={dashboard?.totalUsers} loading={loading} accent="indigo" />
          <StatCard icon="📁" label="Total Files" value={dashboard?.totalFiles} loading={loading} accent="blue" />
          <StatCard icon="⚡" label="Active (30d)" value={userStats?.activeUsersCount} loading={loading} accent="purple" />
          <StatCard icon="🆕" label="New Users" value={userStats?.newUsersCount} loading={loading} accent="emerald" />
        </div>

        {/* Uploads by day bar chart */}
        <Section title="Uploads by Day" subtitle={`Last ${days} days`}>
          <div className="h-44 flex items-end gap-2">
            {uploadsSeries.map((d: UploadByDay, idx: number) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-indigo-100 hover:bg-indigo-200 transition-colors rounded-t" style={{ height: `${(d.count / maxUploads) * 100}%` }} />
                <div className="text-[10px] text-gray-500 mt-1 truncate w-full text-center" title={d._id}>{new Date(d._id).toLocaleDateString()}</div>
              </div>
            ))}
            {uploadsSeries.length === 0 && (
              <div className="text-gray-500 text-sm">No data</div>
            )}
          </div>
        </Section>

        {/* Users by role */}
        <Section title="Users by Role">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(dashboard?.usersByRole || []).map((r: RoleStat) => (
              <div key={r._id} className="p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-[#1C1C1E] hover:shadow transition-shadow">
                <div className="text-sm text-gray-500 dark:text-gray-400">{r._id}</div>
                <div className="text-2xl font-bold dark:text-white">{r.count}</div>
              </div>
            ))}
            {(!dashboard?.usersByRole || dashboard.usersByRole.length === 0) && (
              <div className="text-gray-500 text-sm">No role data</div>
            )}
          </div>
        </Section>

        {/* Recent uploads table */}
        <Section title="Recent Uploads">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400">
                  <th className="py-2 pr-4">File</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.recentUploads || []).map((img: any) => (
                  <tr key={img._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2 pr-4 dark:text-white">{img.originalName || img.title || img._id}</td>
                    <td className="py-2 pr-4 dark:text-white">{img.user?.username || '—'}</td>
                    <td className="py-2 pr-4 dark:text-white">{new Date(img.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {(!dashboard?.recentUploads || dashboard.recentUploads.length === 0) && (
                  <tr><td className="py-2 text-gray-500" colSpan={3}>No recent uploads</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* System health and performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section title="System Health">
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <div><span className="text-gray-500 dark:text-gray-400">Uptime:</span> {system ? `${system.uptime}s` : '—'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Memory Used:</span> {system ? `${system.memory.used} MB / ${system.memory.total} MB` : '—'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Timestamp:</span> {system ? new Date(system.timestamp).toLocaleString() : '—'}</div>
            </div>
          </Section>
          <Section title="Performance">
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <div><span className="text-gray-500 dark:text-gray-400">Avg Upload Time:</span> {performance?.avgUploadTime?.avgTime ?? '—'} s</div>
              <div><span className="text-gray-500 dark:text-gray-400">Peak Hours:</span> {(performance?.peakUsageHours || []).map((h: any) => h._id).join(', ') || '—'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Errors:</span> {performance ? `${performance.errorRates?.uploadErrors} upload, ${performance.errorRates?.conversionErrors} conversion, ${performance.errorRates?.authErrors} auth` : '—'}</div>
            </div>
          </Section>
        </div>

        {/* Security and predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section title="Security Insights">
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <div><span className="text-gray-500 dark:text-gray-400">Failed Logins:</span> {(security?.failedLogins || []).length}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Suspicious Uploaders:</span> {(security?.suspiciousActivity || []).length}</div>
            </div>
          </Section>
          <Section title="Predictions">
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <div><span className="text-gray-500 dark:text-gray-400">Avg Daily Uploads:</span> {predictions?.avgDailyUploads ?? '—'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Projected Monthly Growth:</span> {predictions?.projectedMonthlyGrowth ?? '—'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Projected Storage Need:</span> {predictions?.projectedStorageNeed ? `${predictions.projectedStorageNeed} MB` : '—'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Active Users Trend:</span> {predictions?.activeUsersTrend ?? '—'}</div>
            </div>
          </Section>
        </div>
      </div>
    </AdminLayout>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#2C2C2E] p-6 rounded-xl shadow border dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, loading, accent = 'indigo' }: { icon: string; label: string; value: any; loading: boolean; accent?: 'indigo' | 'blue' | 'purple' | 'emerald' }) {
  const accentMap: Record<string, string> = {
    indigo: 'from-indigo-50 to-white dark:from-indigo-900/20 dark:to-[#2C2C2E] text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    blue: 'from-blue-50 to-white dark:from-blue-900/20 dark:to-[#2C2C2E] text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    purple: 'from-purple-50 to-white dark:from-purple-900/20 dark:to-[#2C2C2E] text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    emerald: 'from-emerald-50 to-white dark:from-emerald-900/20 dark:to-[#2C2C2E] text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
  };
  return (
    <div className={`p-5 rounded-xl border shadow-sm bg-gradient-to-b ${accentMap[accent]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
          <div className="text-2xl font-bold dark:text-white">{loading ? '…' : (value ?? '—')}</div>
        </div>
      </div>
    </div>
  );
}
