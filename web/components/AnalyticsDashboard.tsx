/**
 * Analytics Dashboard Component
 * Display key metrics and analytics
 */

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import styles from "../styles/dashboardWidgets.module.css";

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

const AnalyticsDashboard = ({ onError }: { onError?: (msg: string) => void }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUpdatedLabel = metrics?.lastUpdated
    ? new Date(metrics.lastUpdated).toLocaleString()
    : '';

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/analytics/dashboard');
      setMetrics(res.data.metrics as Metrics);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.status === 401
        ? 'Please set a valid auth token or API key to view analytics.'
        : 'Failed to load analytics';
      toast.error(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className={styles.loadingCard}>Loading analytics...</div>;
  }

  if (!metrics) {
    return <div className={styles.loadingCard}>No data available</div>;
  }

  return (
    <div className={styles.section}>
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Users</p>
          <p className={styles.statValue}>{metrics.retention?.totalUsers || 0}</p>
          <p className={styles.muted}>All-time signups</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>New Users (30d)</p>
          <p className={styles.statValue}>{metrics.retention?.newUsers || 0}</p>
          <p className={styles.muted}>Retention: {metrics.retention?.retentionRate}%</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Est. Revenue (30d)</p>
          <p className={styles.statValue}>
            ${Number(metrics.revenue?.estimatedRevenue ?? 0).toFixed(2)}
          </p>
          <p className={styles.muted}>Per user: ${metrics.revenue?.avgRevenuePerUser}</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Shipments (30d)</p>
          <p className={styles.statValue}>{metrics.revenue?.shipmentsProcessed || 0}</p>
          <p className={styles.muted}>Monthly activity</p>
        </div>
      </div>

      {metrics.adoption && (
        <div className={styles.listStack}>
          <h2 className={styles.heading}>Feature Adoption</h2>
          <div className={styles.listStack}>
            {Object.entries(metrics.adoption.features || {}).map(([feature, data]) => (
              <div key={feature} className={styles.featureRow}>
                <div className={styles.progressMeta}>
                  <span className={styles.capitalize}>{feature}</span>
                  <span className={styles.muted}>{data.adoption}</span>
                </div>
                <div className={styles.featureBar}>
                  <div className={styles.featureFill} style={{ width: data.adoption }} />
                </div>
                <p className={styles.muted}>{data.users} users</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastUpdatedLabel && <div className={styles.meta}>Last updated: {lastUpdatedLabel}</div>}
    </div>
  );
};

export default AnalyticsDashboard;
