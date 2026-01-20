import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

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
      <Card className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Thank you for joining our waitlist!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We'll keep you updated as The Voxel Programme develops.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Join Our Waitlist</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Stay informed as we develop The Voxel Programme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Name *</Label>
            <Input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email *</Label>
            <Input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="text-gray-700 dark:text-gray-300">I am a... *</Label>
            <Select
              value={formData.position}
              onValueChange={(value) => setFormData({ ...formData, position: value })}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select your position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Parent/Guardian">Parent/Guardian</SelectItem>
                <SelectItem value="Teacher">Teacher</SelectItem>
                <SelectItem value="Youth Work Professional">Youth Work Professional</SelectItem>
                <SelectItem value="Press">Press</SelectItem>
                <SelectItem value="Partner/Other">Partner/Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestPrompt" className="text-gray-700 dark:text-gray-300">
              What prompted your interest? (optional)
            </Label>
            <Textarea
              id="interestPrompt"
              rows={3}
              value={formData.interestPrompt}
              onChange={(e) => setFormData({ ...formData, interestPrompt: e.target.value })}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Tell us what brought you here..."
            />
          </div>

          {submitStatus === 'error' && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
              {errorMessage}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.position}
            className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black"
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
