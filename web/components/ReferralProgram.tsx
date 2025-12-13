/**
 * Referral Program Component
 * Display and manage user's referral program
 */

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCopy, FiShare2 } from "react-icons/fi";
import apiClient from "../lib/apiClient";
import styles from "../styles/dashboardWidgets.module.css";

type ReferralReward = {
  claimedAt: string;
  amount: number;
  status: string;
};

type ReferralStats = {
  shareUrl: string;
  conversions: number;
  rewards: {
    total: number;
    list: ReferralReward[];
  };
};

type ReferralTier = {
  referrals: number;
  reward: number;
  description: string;
};

type SocialPlatform = 'twitter' | 'linkedin' | 'email';

const ReferralProgram = ({
  userId,
  onError
}: {
  userId: string;
  onError?: (msg: string) => void;
}) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [tiers, setTiers] = useState<ReferralTier[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const [statsRes, tiersRes] = await Promise.all([
        apiClient.get('/referral/stats'),
        apiClient.get('/referral/tiers'),
      ]);

      setStats(statsRes.data.stats as ReferralStats);
      setTiers(tiersRes.data.tiers as ReferralTier[]);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.status === 401
        ? 'Please set your auth token or API key to load referral data.'
        : 'Failed to load referral data';
      toast.error(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const copyToClipboard = () => {
    if (stats?.shareUrl) {
      navigator.clipboard.writeText(stats.shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnSocial = (platform: SocialPlatform) => {
    const url = encodeURIComponent(stats?.shareUrl || '');
    const text = encodeURIComponent('Join me on Infamous Freight for better logistics!');

    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      email: `mailto:?subject=Join Infamous Freight&body=${text}%0A${url}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  if (loading) {
    return <div className={styles.loadingCard}>Loading referral program...</div>;
  }

  return (
    <div className={styles.section}>
      <div className={styles.tipCard}>
        <h2 className={styles.heading}>Your Referral Link</h2>

        {stats && (
          <>
            <div className={styles.inputRow}>
              <input
                type="text"
                value={stats.shareUrl}
                readOnly
                className={styles.input}
              />
              <button onClick={copyToClipboard} className={styles.buttonSecondary}>
                <span className={styles.buttonIcon}>
                  <FiCopy /> {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>

            <div className={styles.shareRow}>
              <button
                onClick={() => shareOnSocial('twitter')}
                className={styles.buttonSecondary}
              >
                <span className={styles.buttonIcon}>
                  <FiShare2 /> Share on Twitter
                </span>
              </button>
              <button
                onClick={() => shareOnSocial('linkedin')}
                className={styles.buttonSecondary}
              >
                <span className={styles.buttonIcon}>
                  <FiShare2 /> Share on LinkedIn
                </span>
              </button>
              <button
                onClick={() => shareOnSocial('email')}
                className={styles.buttonSecondary}
              >
                <span className={styles.buttonIcon}>
                  <FiShare2 /> Share via Email
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {stats && (
        <div className={styles.grid}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Referrals</p>
            <p className={styles.statValue}>{stats.conversions}</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Rewards Earned</p>
            <p className={styles.statValue}>${stats.rewards.total}</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Tier</p>
            <p className={styles.statValue}>
              {stats.conversions >= 10 ? 'Gold' : stats.conversions >= 5 ? 'Silver' : 'Bronze'}
            </p>
          </div>
        </div>
      )}

      <div className={styles.listStack}>
        <h2 className={styles.heading}>Reward Tiers</h2>
        <div className={styles.listStack}>
          {tiers.map((tier, i) => {
            const achieved = stats && stats.conversions >= tier.referrals;
            return (
              <div
                key={i}
                className={`${styles.rewardTier} ${achieved ? styles.rewardTierActive : ''}`}
              >
                <div>
                  <div className={styles.heading}>{tier.description}</div>
                  <div className={styles.muted}>Reward: ${tier.reward}</div>
                </div>
                {achieved && <span className={styles.pill}>✓ Achieved</span>}
              </div>
            );
          })}
        </div>
      </div>

      {stats?.rewards.list && stats.rewards.list.length > 0 && (
        <div className={styles.listStack}>
          <h2 className={styles.heading}>Recent Rewards</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.rewards.list.map((reward, i) => (
                  <tr key={i}>
                    <td>{new Date(reward.claimedAt).toLocaleDateString()}</td>
                    <td>${reward.amount}</td>
                    <td>
                      <span
                        className={`${styles.statusChip} ${
                          reward.status === 'claimed'
                            ? styles.statusChipSuccess
                            : styles.statusChipPending
                        }`}
                      >
                        {reward.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralProgram;
