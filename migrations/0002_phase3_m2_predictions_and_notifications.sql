-- Phase 3 Milestone 2: Prediction Records & Notification Preferences
-- P3-B007, P3-B008, P3-B009

-- ============ PREDICTION RECORDS TABLE ============
CREATE TABLE IF NOT EXISTS prediction_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id VARCHAR NOT NULL,
  predicted_score NUMERIC(5,2) NOT NULL,
  confidence NUMERIC(5,2),
  factors JSONB,
  actual_score NUMERIC(5,2),
  actual_measured_at TIMESTAMP,
  predicted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prediction_records_post_id_idx ON prediction_records(post_id);
CREATE INDEX IF NOT EXISTS prediction_records_predicted_at_idx ON prediction_records(predicted_at);

-- ============ NOTIFICATION PREFERENCES TABLE ============
CREATE TABLE IF NOT EXISTS notification_preferences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  user_type TEXT NOT NULL,
  email_on_approval_request BOOLEAN NOT NULL DEFAULT TRUE,
  email_on_approval_response BOOLEAN NOT NULL DEFAULT TRUE,
  email_on_changes_requested BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  email_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_prefs_user_id_idx ON notification_preferences(user_id);

-- ============ ROLLBACK ============
-- DROP TABLE IF EXISTS prediction_records;
-- DROP TABLE IF EXISTS notification_preferences;
