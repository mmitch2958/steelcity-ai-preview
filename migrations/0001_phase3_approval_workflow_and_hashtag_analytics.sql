-- Phase 3 Migration: Approval Workflow + Hashtag Analytics
-- P3-B001: DB schema for approval workflow
-- P3-B005: Hashtag analytics backend schema

-- Add approval_status column to social_posts
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS approval_status TEXT;
CREATE INDEX IF NOT EXISTS posts_approval_status_idx ON social_posts (approval_status);

-- Create social_post_approvals table
CREATE TABLE IF NOT EXISTS social_post_approvals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id VARCHAR NOT NULL,
  approver_id VARCHAR,
  status TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS approvals_post_id_idx ON social_post_approvals (post_id);
CREATE INDEX IF NOT EXISTS approvals_approver_id_idx ON social_post_approvals (approver_id);
CREATE INDEX IF NOT EXISTS approvals_status_idx ON social_post_approvals (status);

-- Create social_post_approval_chain table
CREATE TABLE IF NOT EXISTS social_post_approval_chain (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id VARCHAR NOT NULL,
  chain_order INTEGER NOT NULL,
  approver_role TEXT NOT NULL,
  approver_id VARCHAR,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMP,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS approval_chain_post_id_idx ON social_post_approval_chain (post_id);
CREATE INDEX IF NOT EXISTS approval_chain_order_idx ON social_post_approval_chain (post_id, chain_order);

-- Create social_hashtag_metrics table
CREATE TABLE IF NOT EXISTS social_hashtag_metrics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag TEXT NOT NULL,
  post_id VARCHAR,
  platform TEXT,
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate NUMERIC(10, 4),
  measured_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS hashtag_metrics_hashtag_idx ON social_hashtag_metrics (hashtag);
CREATE INDEX IF NOT EXISTS hashtag_metrics_post_id_idx ON social_hashtag_metrics (post_id);
CREATE INDEX IF NOT EXISTS hashtag_metrics_measured_at_idx ON social_hashtag_metrics (measured_at);
CREATE INDEX IF NOT EXISTS hashtag_metrics_hashtag_date_idx ON social_hashtag_metrics (hashtag, measured_at);
