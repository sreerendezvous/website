export interface ExperienceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  featured: boolean;
}

export interface TestimonialContent {
  quote: string;
  author: string;
  role: string;
  image: string;
}

export interface ValueContent {
  title: string;
  description: string;
  icon: string;
}

export interface LegalSection {
  title: string;
  content: string[];
}