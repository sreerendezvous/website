import type { ExperienceCategory } from '@/types';

export const experienceCategories: ExperienceCategory[] = [
  {
    id: 'cultural',
    name: 'Cultural',
    description: 'Immerse yourself in local traditions and heritage',
    icon: 'Globe',
    image: 'https://images.unsplash.com/photo-1465310477141-6fb93167a273',
    featured: true,
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Transform through mindfulness and self-discovery',
    icon: 'Heart',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    featured: true,
  },
  {
    id: 'thought-leadership',
    name: 'Thought Leadership',
    description: 'Gain insights from industry leaders and experts',
    icon: 'Brain',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2',
    featured: true,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Enjoy unique performances and creative activities',
    icon: 'Music',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    featured: false,
  },
  {
    id: 'adventure',
    name: 'Adventure',
    description: 'Challenge yourself with outdoor experiences',
    icon: 'Mountain',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    featured: false,
  },
];