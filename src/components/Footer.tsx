import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-200 border-t border-dark-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="font-display text-2xl tracking-wider">
              rendezvous
            </Link>
            <p className="mt-4 text-gray-400">
              Discover and book unique experiences curated by passionate creators.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <FooterLink href="/experiences">Experiences</FooterLink>
              <FooterLink href="/creators">Creators</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/cookies">Cookie Policy</FooterLink>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <SocialLink 
                href="https://www.instagram.com/letsrendez.vous" 
                icon={<Instagram className="h-5 w-5" />} 
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-dark-300 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} rendezvous. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link 
        to={href}
        className="text-gray-400 hover:text-white transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a 
      href={href}
      className="text-gray-400 hover:text-white transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  );
}