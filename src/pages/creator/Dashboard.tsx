import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ExperiencesList } from '@/components/creator/ExperiencesList';
import { StripeConnect } from '@/components/creator/StripeConnect';
import { BrandingSettings } from '@/components/creator/BrandingSettings';
import { ProfileEditor } from '@/components/creator/ProfileEditor';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { Star, Palette, CreditCard, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CreatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchExperiences } = useStore();

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  if (!user || user.role !== 'creator') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sand-400 mb-4">You must be an approved creator to view this page.</p>
          <Button onClick={() => navigate('/apply/creator')}>
            Apply to Become a Creator
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-full bg-sand-400/10 flex items-center justify-center">
            <Star className="h-6 w-6 text-sand-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display">Creator Dashboard</h1>
            <p className="text-sand-400">Manage your experiences and settings</p>
          </div>
          <Button 
            variant="outline" 
            className="ml-auto"
            onClick={() => navigate(`/creators/${user.id}`)}
          >
            View Public Profile
          </Button>
        </div>

        <Tabs defaultValue="experiences" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="experiences">
              <Star className="h-4 w-4 mr-2" />
              Experiences
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Palette className="h-4 w-4 mr-2" />
              Branding & Design
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experiences">
            <ExperiencesList />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileEditor />
          </TabsContent>

          <TabsContent value="branding">
            <BrandingSettings />
          </TabsContent>

          <TabsContent value="payments">
            <StripeConnect />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}