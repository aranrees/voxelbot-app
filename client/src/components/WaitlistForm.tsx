import { useState } from 'react';

interface WaitlistFormProps {
  onSuccess?: () => void;
}

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    interestPrompt: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', position: '', interestPrompt: '' });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="success-message">
        <h3>Thank you for joining our waitlist!</h3>
        <p>We'll keep you updated as The Voxel Programme develops.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="waitlist-form">
      <h3>Join Our Waitlist</h3>
      <p>Stay informed as we develop The Voxel Programme</p>

      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="position">I am a... *</label>
        <select
          id="position"
          required
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
        >
          <option value="">Select your position</option>
          <option value="Parent/Guardian">Parent/Guardian</option>
          <option value="Teacher">Teacher</option>
          <option value="Youth Work Professional">Youth Work Professional</option>
          <option value="Press">Press</option>
          <option value="Partner/Other">Partner/Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="interestPrompt">What prompted your interest? (optional)</label>
        <textarea
          id="interestPrompt"
          rows={3}
          value={formData.interestPrompt}
          onChange={(e) => setFormData({ ...formData, interestPrompt: e.target.value })}
        />
      </div>

      {submitStatus === 'error' && (
        <div className="error-message">{errorMessage}</div>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
      </button>
    </form>
  );
}
