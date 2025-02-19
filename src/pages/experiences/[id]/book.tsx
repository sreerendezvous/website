import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { BookingButton } from '@/components/experiences/BookingButton';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Calendar, Users, Clock, Shield, AlertCircle } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';

const schema = z.object({
  date: z.string(),
  participantsCount: z.number().min(1),
  specialRequirements: z.string().optional(),
});

type BookingFormData = z.infer<typeof schema>;

export function BookExperience() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { experiences } = useStore();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  
  const experience = experiences.find((exp) => exp.id === id);
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      participantsCount: 1,
    },
  });

  if (!experience) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-sand-400">Experience not found</p>
      </div>
    );
  }

  const participantsCount = watch('participantsCount');
  const selectedDate = watch('date');
  const totalPrice = experience.price * participantsCount;

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Experience Details */}
            <div className="md:w-1/2">
              <img
                src={experience.media?.[0]?.url || 'https://via.placeholder.com/400x300'}
                alt={experience.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
              <h1 className="text-2xl font-display mb-4">{experience.title}</h1>
              <p className="text-sand-300 mb-6">{experience.description}</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sand-300">
                  <Clock className="h-5 w-5" />
                  <span>{experience.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sand-300">
                  <Users className="h-5 w-5" />
                  <span>Maximum {experience.max_participants} participants</span>
                </div>
              </div>

              {experience.booking_type === 'request' && experience.requirements_description && (
                <div className="mt-6 p-4 bg-earth-800/50 rounded-lg">
                  <div className="flex items-start gap-2 text-sand-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-2">Approval Required</p>
                      <p className="text-sm">{experience.requirements_description}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-earth-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sand-400">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">
                    {experience.booking_type === 'instant' ? 
                      'Secure instant booking powered by Stripe' : 
                      'Your request will be reviewed by the host'}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="md:w-1/2">
              <div className="bg-earth-800/50 p-6 rounded-lg">
                <h2 className="text-xl font-display mb-6">
                  {experience.booking_type === 'instant' ? 
                    'Book this Experience' : 
                    'Request to Join'}
                </h2>
                
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-sand-300 mb-2">
                      Select Date
                    </label>
                    <input
                      {...register('date')}
                      type="date"
                      className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sand-300 mb-2">
                      Number of Participants
                    </label>
                    <input
                      {...register('participantsCount', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max={experience.max_participants}
                      className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                    />
                    {errors.participantsCount && (
                      <p className="mt-1 text-sm text-red-500">{errors.participantsCount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sand-300 mb-2">
                      Special Requirements
                    </label>
                    <textarea
                      {...register('specialRequirements')}
                      rows={3}
                      className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                      placeholder="Any dietary restrictions, accessibility needs, etc."
                    />
                  </div>

                  <div className="border-t border-earth-700 pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sand-300">Price per person</span>
                      <span className="text-sand-100">${experience.price}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-sand-100">Total</span>
                      <span className="text-sand-100">${totalPrice}</span>
                    </div>
                  </div>

                  {user ? (
                    <BookingButton
                      experience={experience}
                      quantity={participantsCount}
                      date={selectedDate}
                      className="w-full"
                    />
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => setShowAuthModal(true)}
                    >
                      Sign in to {experience.booking_type === 'instant' ? 'Book' : 'Request'}
                    </Button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="sign-up"
        redirectTo={`/experiences/${experience.id}/book`}
      />
    </div>
  );
}