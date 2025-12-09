/**
 * Referral Program Component
 * Display and manage user's referral program
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiCopy, FiShare2 } from 'react-icons/fi';

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

const ReferralProgram = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [tiers, setTiers] = useState<ReferralTier[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const [statsRes, tiersRes] = await Promise.all([
        axios.get('/api/referral/stats'),
        axios.get('/api/referral/tiers'),
      ]);

      setStats(statsRes.data.stats as ReferralStats);
      setTiers(tiersRes.data.tiers as ReferralTier[]);
    } catch (err) {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

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
    return <div className="p-4 text-center">Loading referral program...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6">Referral Program</h1>

      {/* Referral Link Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6 border border-blue-200">
        <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>

        {stats && (
          <>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={stats.shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded"
              />
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                <FiCopy /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => shareOnSocial('twitter')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded transition"
              >
                <FiShare2 /> Share on Twitter
              </button>
              <button
                onClick={() => shareOnSocial('linkedin')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded transition"
              >
                <FiShare2 /> Share on LinkedIn
              </button>
              <button
                onClick={() => shareOnSocial('email')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
              >
                <FiShare2 /> Share via Email
              </button>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-gray-600 text-sm mb-1">Referrals</div>
            <div className="text-3xl font-bold text-blue-600">{stats.conversions}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-gray-600 text-sm mb-1">Rewards Earned</div>
            <div className="text-3xl font-bold text-green-600">${stats.rewards.total}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-gray-600 text-sm mb-1">Tier</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.conversions >= 10 ? 'Gold' : stats.conversions >= 5 ? 'Silver' : 'Bronze'}
            </div>
          </div>
        </div>
      )}

      {/* Reward Tiers */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Reward Tiers</h2>
        <div className="space-y-3">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border-2 ${
                stats && stats.conversions >= tier.referrals
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">{tier.description}</div>
                  <div className="text-sm text-gray-600">Reward: ${tier.reward}</div>
                </div>
                {stats && stats.conversions >= tier.referrals && (
                  <span className="text-green-600 font-bold">✓ Achieved</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Rewards */}
      {stats?.rewards.list && stats.rewards.list.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Rewards</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.rewards.list.map((reward, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2">{new Date(reward.claimedAt).toLocaleDateString()}</td>
                    <td className="py-2 font-bold">${reward.amount}</td>
                    <td className="py-2">
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          reward.status === 'claimed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
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
