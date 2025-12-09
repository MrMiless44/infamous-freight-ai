import React, { useState } from 'react';

interface FeedbackWidgetProps {
  onSubmit?: (feedback: string, email?: string) => void;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send feedback to your backend
      if (onSubmit) {
        onSubmit(feedback, email);
      } else {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback, email }),
        });
      }

      setSubmitted(true);
      setTimeout(() => {
        setFeedback('');
        setEmail('');
        setSubmitted(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="feedback-widget">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="feedback-button"
          title="Send us feedback"
        >
          💬 Feedback
        </button>
      ) : (
        <div className="feedback-modal">
          <div className="feedback-header">
            <h3>Send Feedback</h3>
            <button onClick={() => setIsOpen(false)} className="close-button">
              ✕
            </button>
          </div>

          {submitted ? (
            <div className="feedback-success">
              ✅ Thanks for your feedback!
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think..."
                required
                rows={4}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email (optional)"
              />
              <button
                type="submit"
                disabled={isLoading || !feedback.trim()}
                className="submit-button"
              >
                {isLoading ? 'Sending...' : 'Send Feedback'}
              </button>
            </form>
          )}
        </div>
      )}

      <style jsx>{`
        .feedback-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .feedback-button {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }

        .feedback-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .feedback-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 24px;
          width: 320px;
          max-width: calc(100vw - 40px);
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .feedback-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 0;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        textarea,
        input {
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          resize: none;
        }

        textarea:focus,
        input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .submit-button {
          padding: 10px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .feedback-success {
          padding: 16px;
          background: #f0f9ff;
          border-radius: 6px;
          color: #0369a1;
          text-align: center;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default FeedbackWidget;
