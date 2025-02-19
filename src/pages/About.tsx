import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1 
            className="text-4xl md:text-5xl font-display mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            About rendezvous
          </motion.h1>
          <motion.p 
            className="text-xl text-sand-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            We're on a mission to connect passionate creators with people seeking unique and authentic experiences.
          </motion.p>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <ValueCard
            icon={<Shield className="h-8 w-8 text-sand-400" />}
            title="Trust & Safety"
            description="Every creator and experience is thoroughly vetted to ensure quality and safety."
          />
          <ValueCard
            icon={<Users className="h-8 w-8 text-sand-400" />}
            title="Community"
            description="Build meaningful connections through shared experiences and passions."
          />
          <ValueCard
            icon={<Star className="h-8 w-8 text-sand-400" />}
            title="Quality"
            description="Curated experiences that meet our high standards of excellence."
          />
          <ValueCard
            icon={<Heart className="h-8 w-8 text-sand-400" />}
            title="Passion"
            description="Created by people who truly love what they do and want to share it."
          />
        </div>

        {/* Story Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-display mb-6">Our Story</h2>
          <p className="text-sand-400 mb-4">
            Founded in 2024, rendezvous was born from a simple idea: everyone has something unique to share. We believe that the best experiences come from passionate people who want to share their knowledge and skills with others.
          </p>
          <p className="text-sand-400">
            Today, we're proud to host a diverse community of creators offering experiences that range from outdoor adventures to culinary masterclasses, and everything in between.
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-display mb-6">Join Our Community</h2>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/experiences')}>
              Find Experiences
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/apply/creator')}>
              Become a Creator
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div 
      className="bg-earth-800/50 p-6 rounded-lg"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sand-400">{description}</p>
    </motion.div>
  );
}