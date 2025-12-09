/**
 * Analytics Dashboard Component
 * Display key metrics and analytics
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

type Metrics = {
  retention?: {
    totalUsers?: number;
    newUsers?: number;
    retentionRate?: number;
  };
  revenue?: {
    estimatedRevenue?: number | string;
    avgRevenuePerUser?: number | string;
    shipmentsProcessed?: number;
  };
  adoption?: {
    features?: Record<string, { adoption: string; users: number }>;
  };
  lastUpdated?: string;
};

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUpdatedLabel = metrics?.lastUpdated
    ? new Date(metrics.lastUpdated).toLocaleString()
    : '';

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/analytics/dashboard');
      setMetrics(res.data.metrics as Metrics);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading analytics...</div>;
  }

  if (!metrics) {
    return <div className="p-4 text-center">No data available</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* User Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <h3 className="text-gray-600 font-semibold text-sm mb-2">Total Users</h3>
          <div className="text-3xl font-bold text-blue-600">{metrics.retention?.totalUsers || 0}</div>
          <p className="text-xs text-gray-500 mt-2">All-time signups</p>
        </div>

        {/* Active Users */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <h3 className="text-gray-600 font-semibold text-sm mb-2">New Users (30d)</h3>
          <div className="text-3xl font-bold text-green-600">{metrics.retention?.newUsers || 0}</div>
          <p className="text-xs text-gray-500 mt-2">
            Retention: {metrics.retention?.retentionRate}%
          </p>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
          <h3 className="text-gray-600 font-semibold text-sm mb-2">Est. Revenue (30d)</h3>
          <div className="text-3xl font-bold text-purple-600">
            ${Number(metrics.revenue?.estimatedRevenue ?? 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Per user: ${metrics.revenue?.avgRevenuePerUser}
          </p>
        </div>

        {/* Shipments */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-600">
          <h3 className="text-gray-600 font-semibold text-sm mb-2">Shipments (30d)</h3>
          <div className="text-3xl font-bold text-orange-600">{metrics.revenue?.shipmentsProcessed || 0}</div>
          <p className="text-xs text-gray-500 mt-2">Monthly activity</p>
        </div>
      </div>

      {/* Feature Adoption */}
      {metrics.adoption && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">Feature Adoption</h2>
          <div className="space-y-4">
            {Object.entries(metrics.adoption.features || {}).map(([feature, data]) => (
              <div key={feature}>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold capitalize">{feature}</span>
                  <span className="text-gray-600">{data.adoption}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: data.adoption }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{data.users} users</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {lastUpdatedLabel && (
        <div className="text-xs text-gray-500 text-center">Last updated: {lastUpdatedLabel}</div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
