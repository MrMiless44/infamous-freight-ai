import { useEffect, useMemo, useState } from "react";
import OnboardingFlow from "../components/OnboardingFlow";
import ReferralProgram from "../components/ReferralProgram";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import styles from "../styles/dashboard.module.css";

type Status = {
  ok: boolean;
  api?: boolean;
  db?: boolean;
  time?: string;
};

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = "demo-user";

  const base = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE || "http://localhost/api",
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(base + "/health");
        const json = await res.json();
        setStatus({ ok: true, api: true, db: true, time: json.time });
      } catch {
        setStatus({ ok: false, api: false, db: false });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [base]);

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

      <section className={styles.sectionGrid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Onboarding</h2>
          <OnboardingFlow userId={userId} />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Referral Program</h2>
          <ReferralProgram userId={userId} />
        </div>
      </section>

      <section className={styles.analyticsCard}>
        <h2 className={styles.cardTitle}>Analytics</h2>
        <AnalyticsDashboard />
      </section>
    </main>
  );
}