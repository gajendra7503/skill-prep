CREATE DATABASE IF NOT EXISTS prepwise;
USE prepwise;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_token (token)
);

CREATE TABLE IF NOT EXISTS interviews (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(255) NOT NULL,
  level VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  techstack JSON NOT NULL,
  questions JSON NOT NULL,
  finalized BOOLEAN NOT NULL DEFAULT FALSE,
  cover_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interviews_user_id (user_id),
  INDEX idx_interviews_finalized (finalized)
);

CREATE TABLE IF NOT EXISTS feedback (
  id VARCHAR(36) PRIMARY KEY,
  interview_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  total_score INT NOT NULL,
  category_scores JSON NOT NULL,
  strengths JSON NOT NULL,
  areas_for_improvement JSON NOT NULL,
  final_assessment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_feedback_interview_id (interview_id),
  INDEX idx_feedback_user_id (user_id)
);
