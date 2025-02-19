import React from 'react';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

export function Cookies() {
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
              <Cookie className="h-6 w-6 text-sand-400" />
            </div>
            <div>
              <h1 className="text-3xl font-display">Cookie Policy</h1>
              <p className="text-sand-400">Last updated: March 15, 2024</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sand max-w-none">
            <p className="text-sand-300">
              This Cookie Policy explains how rendezvous uses cookies and similar technologies to recognize you when you visit our website.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">What are cookies?</h2>
            <p className="text-sand-300">
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide useful information to website owners.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">How we use cookies</h2>
            <p className="text-sand-300">We use cookies for the following purposes:</p>
            <ul className="list-disc list-inside text-sand-300 space-y-2">
              <li>Authentication and security</li>
              <li>Preferences and functionality</li>
              <li>Analytics and performance</li>
              <li>Advertising and targeting</li>
            </ul>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Types of cookies we use</h2>
            
            <h3 className="text-xl font-display mt-6 mb-3 text-sand-100">Essential Cookies</h3>
            <p className="text-sand-300">
              These cookies are necessary for the website to function properly. They enable core functionality such as security, account authentication, and remembering your preferences.
            </p>

            <h3 className="text-xl font-display mt-6 mb-3 text-sand-100">Analytics Cookies</h3>
            <p className="text-sand-300">
              We use analytics cookies to understand how visitors interact with our website, helping us improve our services and user experience.
            </p>

            <h3 className="text-xl font-display mt-6 mb-3 text-sand-100">Functionality Cookies</h3>
            <p className="text-sand-300">
              These cookies help us remember your preferences and settings to enhance your experience on our platform.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Managing Cookies</h2>
            <p className="text-sand-300">
              Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may impact your experience using our website.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Cookie List</h2>
            <div className="bg-earth-800/50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-medium text-sand-100">Authentication</h4>
                <p className="text-sm text-sand-400">Purpose: User authentication and session management</p>
                <p className="text-sm text-sand-400">Duration: Session</p>
              </div>
              <div>
                <h4 className="font-medium text-sand-100">Preferences</h4>
                <p className="text-sm text-sand-400">Purpose: Store user preferences and settings</p>
                <p className="text-sm text-sand-400">Duration: 1 year</p>
              </div>
              <div>
                <h4 className="font-medium text-sand-100">Analytics</h4>
                <p className="text-sm text-sand-400">Purpose: Website analytics and performance monitoring</p>
                <p className="text-sm text-sand-400">Duration: 2 years</p>
              </div>
            </div>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Updates to this Policy</h2>
            <p className="text-sand-300">
              We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h2 className="text-2xl font-display mt-8 mb-4 text-sand-100">Contact Us</h2>
            <p className="text-sand-300">
              If you have questions about our Cookie Policy, please contact us at:
              <br />
              Email: privacy@letsrendezvous.co
            </p>

            <div className="mt-8 p-4 bg-earth-800/50 rounded-lg">
              <p className="text-sm text-sand-400">
                By continuing to use our website, you consent to our use of cookies as described in this policy.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}