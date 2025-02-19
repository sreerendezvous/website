import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export function Terms() {
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
              <FileText className="h-6 w-6 text-sand-400" />
            </div>
            <div>
              <h1 className="text-3xl font-display">Terms of Service</h1>
              <p className="text-sand-400">Last updated: March 15, 2024</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sand max-w-none">
            <p className="text-sand-300">
              Please read these Terms of Service carefully before using rendezvous. By accessing or using our platform, you agree to be bound by these terms.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">1. Acceptance of Terms</h2>
            <p className="text-sand-300">
              By accessing or using our services, you agree to these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use our services.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">2. User Accounts</h2>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must provide accurate and complete information</li>
              <li>You may not share or transfer your account</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">3. Platform Rules</h2>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>Treat others with respect and courtesy</li>
              <li>Do not engage in harmful or illegal activities</li>
              <li>Do not spam or harass other users</li>
              <li>Do not post false or misleading information</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">4. Bookings and Payments</h2>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>All bookings are subject to creator approval</li>
              <li>Payments are processed securely through Stripe</li>
              <li>Cancellation policies vary by experience</li>
              <li>Platform fees are non-refundable</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">5. Creator Terms</h2>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>Creators must provide accurate experience descriptions</li>
              <li>Creators are responsible for their experiences</li>
              <li>Platform fees apply to all bookings</li>
              <li>Creators must maintain appropriate insurance</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">6. Intellectual Property</h2>
            <p className="text-sand-300">
              All content on our platform is protected by copyright and other intellectual property rights. You may not use our content without permission.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">7. Limitation of Liability</h2>
            <p className="text-sand-300">
              We provide our services "as is" and make no warranties about their reliability or availability. We are not liable for any damages arising from your use of our services.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">8. Changes to Terms</h2>
            <p className="text-sand-300">
              We may modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">9. Contact Information</h2>
            <p className="text-sand-300">
              For questions about these terms, please contact us at:
              <br />
              Email: legal@letsrendezvous.co
            </p>

            <div className="mt-8 p-4 bg-earth-800/50 rounded-lg">
              <p className="text-sm text-sand-400">
                These terms of service constitute a legally binding agreement between you and rendezvous. By using our services, you acknowledge that you have read and understood these terms.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}