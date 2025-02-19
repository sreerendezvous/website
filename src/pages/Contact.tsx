import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type ContactFormData = z.infer<typeof schema>;

export function Contact() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);
      // TODO: Implement contact form submission
      console.log('Form data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      reset();
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display mb-4">Get in Touch</h1>
            <p className="text-xl text-sand-400 max-w-2xl mx-auto">
              Have questions about our platform? We're here to help you create and discover extraordinary experiences.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Contact Card */}
              <div className="bg-earth-800/50 p-6 rounded-lg">
                <h2 className="text-xl font-display mb-6">Contact Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-sand-400 mt-1" />
                    <div>
                      <p className="text-sand-300 font-medium">Email</p>
                      <a href="mailto:hello@letsrendezvous.co" className="text-sand-400 hover:text-sand-300">
                        hello@letsrendezvous.co
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-sand-400 mt-1" />
                    <div>
                      <p className="text-sand-300 font-medium">Phone</p>
                      <p className="text-sand-400">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-sand-400 mt-1" />
                    <div>
                      <p className="text-sand-300 font-medium">Location</p>
                      <p className="text-sand-400">San Francisco, CA</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-sand-400 mt-1" />
                    <div>
                      <p className="text-sand-300 font-medium">Business Hours</p>
                      <p className="text-sand-400">Mon - Fri: 9:00 AM - 6:00 PM PST</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Response Card */}
              <div className="bg-earth-800/50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-sand-400" />
                  <h3 className="text-lg font-display">Quick Response</h3>
                </div>
                <p className="text-sand-400">
                  We aim to respond to all inquiries within 24 hours during business hours.
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="bg-earth-800/50 p-6 rounded-lg">
                <h2 className="text-xl font-display mb-6">Send us a Message</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-sand-300 mb-2">
                        Your Name
                      </label>
                      <input
                        {...register('name')}
                        className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-sand-300 mb-2">
                        Email Address
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                        placeholder="you@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sand-300 mb-2">
                      Subject
                    </label>
                    <input
                      {...register('subject')}
                      className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                      placeholder="How can we help?"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sand-300 mb-2">
                      Message
                    </label>
                    <textarea
                      {...register('message')}
                      rows={6}
                      className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                      placeholder="Tell us more about your inquiry..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
                    )}
                  </div>

                  {success && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400">
                        Thank you for your message! We'll get back to you soon.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[150px]"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}