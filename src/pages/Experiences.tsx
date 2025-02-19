import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';

export function Experiences() {
  const navigate = useNavigate();
  const { experiences, loading, error, fetchExperiences } = useStore();
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  useEffect(() => {
    fetchExperiences(true); // Force refresh on mount
  }, [fetchExperiences]);

  const categories = [
    'all',
    'cultural',
    'wellness',
    'thought-leadership',
    'entertainment',
    'adventure'
  ];

  const filteredExperiences = experiences
    .filter(exp => 
      selectedCategory === 'all' || 
      exp.category?.name.toLowerCase() === selectedCategory
    )
    .filter(exp => 
      !searchQuery || 
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-earth-900">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-earth-900/95 backdrop-blur-sm pt-20 pb-4 border-b border-earth-800">
        <div className="container mx-auto px-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-sand-400" />
              <input
                type="text"
                placeholder="Search experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-none bg-earth-800 border border-earth-700 text-sand-100 focus:outline-none focus:ring-1 focus:ring-sand-400"
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto w-full justify-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Categories Scroll */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === selectedCategory ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize whitespace-nowrap"
                >
                  {category === 'all' ? 'All Experiences' : category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        {/* Add padding to account for fixed header */}
        <div className="pt-52 pb-12">
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sand-400">
              {filteredExperiences.length} {filteredExperiences.length === 1 ? 'experience' : 'experiences'} found
            </p>
          </div>

          <AnimatePresence>
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <p className="text-sand-400">Loading experiences...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <p className="text-red-400">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => fetchExperiences(true)}
                >
                  Retry
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredExperiences.map((experience) => (
                  <ExperienceCard key={experience.id} experience={experience} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && !error && filteredExperiences.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sand-400 mb-4">No experiences found</p>
              <Button onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}