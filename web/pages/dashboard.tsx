import { useEffect, useState } from "react";
import OnboardingFlow from "../components/OnboardingFlow";
import ReferralProgram from "../components/ReferralProgram";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import { AuthTokenForm } from "../components/AuthTokenForm";
import { StatusBanner } from "../components/StatusBanner";
import styles from "../styles/dashboard.module.css";
import apiClient from "../lib/apiClient";

type Status = {
  ok: boolean;
  api?: boolean;
  db?: boolean;
  time?: string;
};

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const userId = "demo-user";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/health");
        setStatus({ ok: true, api: true, db: true, time: res.data.time });
      } catch (err) {
        setStatus({ ok: false, api: false, db: false });
        setApiError("API unreachable. Check env vars or token.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Command Center</p>
          <h1 className={styles.title}>Control Tower</h1>
        </div>
        <div className={styles.statusCard}>
          {loading && <p>Loading status…</p>}
          {!loading && status && (
            <div className={styles.statusStack}>
              <span className={styles.statusPrimary}>
                API: {status.api ? "Online" : "Offline"}
              </span>
              <span className={styles.statusSubtle}>
                Database: {status.db ? "Connected" : "Unreachable"}
              </span>
              {status.time && <span className={styles.statusTime}>{status.time}</span>}
            </div>
          )}
        </div>
      </header>

      <StatusBanner message={apiError} />
      <AuthTokenForm />

      <section className={styles.sectionGrid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Onboarding</h2>
          <OnboardingFlow userId={userId} onError={setApiError} />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Referral Program</h2>
          <ReferralProgram userId={userId} onError={setApiError} />
        </div>
      </section>

      <section className={styles.analyticsCard}>
        <h2 className={styles.cardTitle}>Analytics</h2>
        <AnalyticsDashboard onError={setApiError} />
      </section>
    </main>
  );
}
