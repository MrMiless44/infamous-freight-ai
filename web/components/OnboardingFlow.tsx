/**
 * Onboarding Flow Component
 * Guided onboarding experience for new users
 */

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import styles from "../styles/dashboardWidgets.module.css";

type OnboardingStatus = {
  isComplete: boolean;
  progress: number;
  completedSteps: string[];
  allSteps: string[];
};

type OnboardingTips = {
  title: string;
  description: string;
  tips: string[];
};

type Props = {
  userId: string;
  onError?: (msg: string) => void;
};

const OnboardingFlow = ({ userId, onError }: Props) => {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [tips, setTips] = useState<OnboardingTips | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOnboardingStatus = async () => {
    try {
      setLoading(true);
      const statusRes = await apiClient.get('/onboarding/status');
      setStatus(statusRes.data.status as OnboardingStatus);

      const nextRes = await apiClient.get('/onboarding/next-step');
      setCurrentStep(nextRes.data.nextStep as string | null);
      setTips(nextRes.data.tips as OnboardingTips | null);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.status === 401
        ? 'Please set a valid auth token or API key to load onboarding.'
        : 'Failed to load onboarding status';
      toast.error(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const completeStep = async (step: string) => {
    try {
      await apiClient.post('/onboarding/complete-step', { step });
      toast.success('Step completed!');
      fetchOnboardingStatus();
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.status === 401
        ? 'Authorize first, then retry completing the step.'
        : 'Failed to complete step';
      toast.error(msg);
      onError?.(msg);
    }
  };

  if (loading) {
    return <div className={styles.loadingCard}>Loading onboarding...</div>;
  }

  if (!status) {
    return <div className={styles.loadingCard}>Unable to load onboarding state.</div>;
  }

  if (status && status.isComplete) {
    return (
      <div className={styles.completeCard}>
        <h3 className={styles.heading}>🎉 Welcome to Infamous Freight!</h3>
        <p className={styles.muted}>You&apos;ve completed all onboarding steps.</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.progressBlock}>
        <div className={styles.progressMeta}>
          <span>Progress</span>
          <span>{status.progress}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressValue}
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {currentStep && tips && (
        <div className={styles.tipCard}>
          <h3 className={styles.tipTitle}>{tips.title}</h3>
          <p className={styles.muted}>{tips.description}</p>

          <h4 className={styles.heading}>Tips</h4>
          <ul className={styles.tipList}>
            {tips.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>

          <button
            onClick={() => completeStep(currentStep)}
            className={styles.buttonPrimary}
          >
            Mark as Complete
          </button>
        </div>
      )}

      <div className={styles.splitGrid}>
        <div>
          <h4 className={styles.heading}>Completed Steps</h4>
          <div className={styles.listStack}>
            {status.completedSteps.length === 0 && (
              <p className={styles.muted}>No steps completed yet.</p>
            )}
            {status.completedSteps.map(step => (
              <div key={step} className={styles.stepRow}>
                <span className={`${styles.badge} ${styles.badgeComplete}`}>✓</span>
                <span className={styles.capitalize}>{step.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className={styles.heading}>Remaining Steps</h4>
          <div className={styles.listStack}>
            {status.allSteps
              .filter(step => !status.completedSteps.includes(step))
              .map(step => (
                <div key={step} className={styles.stepRow}>
                  <span className={styles.badge}>○</span>
                  <span className={styles.capitalize}>{step.replace('_', ' ')}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
