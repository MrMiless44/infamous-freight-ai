/**
 * Onboarding Flow Component
 * Guided onboarding experience for new users
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

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

const OnboardingFlow = ({ userId }: { userId: string }) => {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [tips, setTips] = useState<OnboardingTips | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnboardingStatus();
  }, [userId]);

  const fetchOnboardingStatus = async () => {
    try {
      setLoading(true);
      const statusRes = await axios.get('/api/onboarding/status');
      setStatus(statusRes.data.status as OnboardingStatus);

      const nextRes = await axios.get('/api/onboarding/next-step');
      setCurrentStep(nextRes.data.nextStep as string | null);
      setTips(nextRes.data.tips as OnboardingTips | null);
    } catch (err) {
      toast.error('Failed to load onboarding status');
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (step: string) => {
    try {
      await axios.post('/api/onboarding/complete-step', { step });
      toast.success('Step completed!');
      fetchOnboardingStatus();
    } catch (err) {
      toast.error('Failed to complete step');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading onboarding...</div>;
  }

  if (!status || status.isComplete) {
    return (
      <div className="p-4 bg-green-100 border border-green-400 rounded">
        <h3 className="font-bold text-green-800">🎉 Welcome to Infamous Freight!</h3>
        <p className="text-green-700">You&apos;ve completed all onboarding steps.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Let&apos;s Get Started!</h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Current Step */}
      {currentStep && tips && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-xl font-bold text-blue-900 mb-2">{tips.title}</h3>
          <p className="text-blue-800 mb-4">{tips.description}</p>

          <h4 className="font-semibold text-blue-900 mb-2">Tips:</h4>
          <ul className="list-disc list-inside text-blue-700 space-y-1 mb-4">
            {tips.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>

          <button
            onClick={() => completeStep(currentStep)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
          >
            Mark as Complete
          </button>
        </div>
      )}

      {/* Steps Completed */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Completed Steps:</h4>
        <div className="space-y-2">
          {status.completedSteps.map((step) => (
            <div key={step} className="flex items-center gap-2 text-green-600">
              <span className="text-xl">✓</span>
              <span className="capitalize">{step.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Remaining Steps */}
      <div>
        <h4 className="font-semibold mb-2">Remaining Steps:</h4>
        <div className="space-y-2">
          {status.allSteps
            .filter((step) => !status.completedSteps.includes(step))
            .map((step) => (
              <div key={step} className="flex items-center gap-2 text-gray-600">
                <span className="text-xl">○</span>
                <span className="capitalize">{step.replace('_', ' ')}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
