import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export function Privacy() {
  return (
    <div className="min-h-screen pt-20 pb-12 bg-earth-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-full bg-sand-400/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-sand-400" />
            </div>
            <div>
              <h1 className="text-3xl font-display">Privacy Policy</h1>
              <p className="text-sand-400">Last updated: March 15, 2024</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sand max-w-none">
            <p className="text-sand-300">
              This Privacy Policy describes how rendezvous ("we," "us," or "our") collects, uses, and shares your personal information when you use our website and services.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Information We Collect</h2>
            
            <h3 className="text-xl font-display mt-6 mb-3 text-sand-100">Personal Information</h3>
            <p className="text-sand-300">When you use our services, we may collect:</p>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>Name and contact information</li>
              <li>Account credentials</li>
              <li>Payment information</li>
              <li>Profile information and preferences</li>
              <li>Communications with us or other users</li>
            </ul>

            <h3 className="text-xl font-display mt-6 mb-3 text-sand-100">Usage Information</h3>
            <p className="text-sand-300">We automatically collect:</p>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
              <li>Cookies and similar technologies</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">How We Use Your Information</h2>
            <p className="text-sand-300">We use your information to:</p>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process payments and bookings</li>
              <li>Communicate with you</li>
              <li>Personalize your experience</li>
              <li>Ensure platform safety and security</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Information Sharing</h2>
            <p className="text-sand-300">We may share your information with:</p>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>Service providers and partners</li>
              <li>Other users (as necessary for bookings)</li>
              <li>Legal authorities when required</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Your Rights</h2>
            <p className="text-sand-300">You have the right to:</p>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Object to certain data processing</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Security</h2>
            <p className="text-sand-300">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Contact Us</h2>
            <p className="text-sand-300">
              If you have questions about this Privacy Policy, please contact us at:
              <br />
              Email: privacy@letsrendezvous.co
            </p>

            <div className="mt-8 p-4 bg-earth-800/50 rounded-lg">
              <p className="text-sm text-sand-400">
                This privacy policy is intended to comply with the California Consumer Privacy Act (CCPA), the General Data Protection Regulation (GDPR), and other applicable privacy laws.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}