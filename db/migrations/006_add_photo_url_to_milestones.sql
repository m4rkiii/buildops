-- Migration: 006_add_photo_url_to_milestones.sql
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS photo_url TEXT;
