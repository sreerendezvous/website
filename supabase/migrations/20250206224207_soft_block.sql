-- Create necessary folders in the media bucket
INSERT INTO storage.objects (bucket_id, name, owner, created_at, updated_at, metadata)
VALUES 
  ('media', 'profile-images/.keep', auth.uid(), now(), now(), '{"mimetype": "text/plain", "size": 0}'::jsonb),
  ('media', 'experience-media/.keep', auth.uid(), now(), now(), '{"mimetype": "text/plain", "size": 0}'::jsonb)
ON CONFLICT (bucket_id, name) DO NOTHING;