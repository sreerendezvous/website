import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, X, CircleDot as DragHandleDots2, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { MediaUpload } from '@/components/experiences/MediaUpload';

interface SpotlightCreator {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  media: Array<{ url: string; type: 'image'; order: number }>;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    full_name: string;
    profile_image: string | null;
    creator_profile?: {
      rating: number | null;
    };
  };
}

export function CreatorSpotlightAdmin() {
  const [spotlights, setSpotlights] = useState<SpotlightCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreatorSelect, setShowCreatorSelect] = useState(false);
  const [availableCreators, setAvailableCreators] = useState<any[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [newSpotlight, setNewSpotlight] = useState({
    title: '',
    description: '',
    media: [] as Array<{ url: string; type: 'image'; order: number }>
  });

  // Fetch spotlight data
  const fetchSpotlights = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('creator_spotlights')
        .select(`
          *,
          creator:creator_id (
            id,
            full_name,
            profile_image,
            creator_profile:creator_profiles(*)
          )
        `)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setSpotlights(data || []);
    } catch (err) {
      console.error('Failed to fetch spotlights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch spotlights');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available creators
  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          profile_image,
          creator_profile:creator_profiles(*)
        `)
        .eq('role', 'creator')
        .eq('status', 'approved');

      if (error) throw error;
      setAvailableCreators(data || []);
    } catch (err) {
      console.error('Failed to fetch creators:', err);
    }
  };

  React.useEffect(() => {
    fetchSpotlights();
  }, []);

  const handleMediaUpdate = async (spotlightId: string, media: Array<{ url: string; type: 'image'; order: number }>) => {
    try {
      const { error: updateError } = await supabase
        .from('creator_spotlights')
        .update({
          media,
          updated_at: new Date().toISOString()
        })
        .eq('id', spotlightId);

      if (updateError) throw updateError;
      await fetchSpotlights();
    } catch (err) {
      console.error('Failed to update media:', err);
      setError(err instanceof Error ? err.message : 'Failed to update media');
    }
  };

  const handleTextUpdate = async (spotlightId: string, updates: { title?: string; description?: string }) => {
    try {
      const { error: updateError } = await supabase
        .from('creator_spotlights')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', spotlightId);

      if (updateError) throw updateError;
      await fetchSpotlights();
    } catch (err) {
      console.error('Failed to update text:', err);
      setError(err instanceof Error ? err.message : 'Failed to update text');
    }
  };

  const handleOrderUpdate = async (spotlightId: string, newOrder: number) => {
    try {
      const { error: updateError } = await supabase
        .rpc('update_spotlight_order', {
          spotlight_id: spotlightId,
          new_order: newOrder
        });

      if (updateError) throw updateError;
      await fetchSpotlights();
    } catch (err) {
      console.error('Failed to update order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const handleAddSpotlight = async () => {
    if (!selectedCreator) {
      setError('Please select a creator');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('creator_spotlights')
        .insert({
          creator_id: selectedCreator.id,
          title: newSpotlight.title,
          description: newSpotlight.description,
          media: newSpotlight.media,
          display_order: spotlights.length,
          active: true
        });

      if (insertError) throw insertError;

      // Reset form
      setNewSpotlight({
        title: '',
        description: '',
        media: []
      });
      setSelectedCreator(null);
      setShowCreatorSelect(false);

      // Refresh spotlights
      await fetchSpotlights();
    } catch (err) {
      console.error('Failed to add spotlight:', err);
      setError(err instanceof Error ? err.message : 'Failed to add spotlight');
    }
  };

  const handleDeleteSpotlight = async (spotlightId: string) => {
    if (!window.confirm('Are you sure you want to delete this spotlight?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('creator_spotlights')
        .delete()
        .eq('id', spotlightId);

      if (deleteError) throw deleteError;
      await fetchSpotlights();
    } catch (err) {
      console.error('Failed to delete spotlight:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete spotlight');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sand-400">Loading creator spotlights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display">Creator Spotlights</h2>
        <Button onClick={() => {
          setShowCreatorSelect(true);
          fetchCreators();
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Spotlight
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Add New Spotlight Form */}
      {showCreatorSelect && (
        <div className="bg-earth-800/50 p-6 rounded-lg space-y-6">
          <h3 className="text-lg font-display mb-4">Add New Spotlight</h3>

          {/* Creator Selection */}
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Select Creator
            </label>
            <select
              value={selectedCreator?.id || ''}
              onChange={(e) => {
                const creator = availableCreators.find(c => c.id === e.target.value);
                setSelectedCreator(creator);
              }}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
            >
              <option value="">Select a creator...</option>
              {availableCreators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Spotlight Details */}
          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={newSpotlight.title}
              onChange={(e) => setNewSpotlight(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="Enter spotlight title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Description
            </label>
            <textarea
              value={newSpotlight.description}
              onChange={(e) => setNewSpotlight(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
              placeholder="Enter spotlight description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-300 mb-2">
              Media
            </label>
            <MediaUpload
              value={newSpotlight.media}
              onChange={(media) => setNewSpotlight(prev => ({ ...prev, media }))}
              maxFiles={5}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatorSelect(false);
                setSelectedCreator(null);
                setNewSpotlight({
                  title: '',
                  description: '',
                  media: []
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSpotlight}>
              Add Spotlight
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {spotlights.map((spotlight, index) => (
          <motion.div
            key={spotlight.id}
            className="bg-earth-800/50 rounded-lg overflow-hidden"
            whileHover={{ y: -5 }}
            layout
          >
            {/* Drag Handle */}
            <div className="p-2 border-b border-earth-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DragHandleDots2 className="h-5 w-5 text-sand-400 cursor-move" />
                <span className="text-sm text-sand-400">Position {index + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => handleOrderUpdate(spotlight.id, index - 1)}
                >
                  ↑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index === spotlights.length - 1}
                  onClick={() => handleOrderUpdate(spotlight.id, index + 1)}
                >
                  ↓
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-400"
                  onClick={() => handleDeleteSpotlight(spotlight.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Media Upload */}
            <div className="p-6 border-b border-earth-700">
              <h3 className="text-lg font-medium mb-4">Media Gallery</h3>
              <MediaUpload
                value={spotlight.media}
                onChange={(media) => handleMediaUpdate(spotlight.id, media)}
                maxFiles={5}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              />
            </div>

            {/* Creator Info */}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={spotlight.creator.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${spotlight.creator.full_name}`}
                  alt={spotlight.creator.full_name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-lg font-medium text-sand-100">
                    {spotlight.creator.full_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {spotlight.creator.creator_profile?.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{spotlight.creator.creator_profile.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-green-400">
                      <Shield className="h-4 w-4" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Content */}
              {editingId === spotlight.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={spotlight.title}
                      onChange={(e) => handleTextUpdate(spotlight.id, { title: e.target.value })}
                      className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={spotlight.description}
                      onChange={(e) => handleTextUpdate(spotlight.id, { description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400"
                    />
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    Done Editing
                  </Button>
                </div>
              ) : (
                <div>
                  <h4 className="text-xl font-display text-sand-100 mb-2">
                    {spotlight.title}
                  </h4>
                  <p className="text-sand-400 text-sm mb-4">
                    {spotlight.description}
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(spotlight.id)}
                  >
                    Edit Content
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}