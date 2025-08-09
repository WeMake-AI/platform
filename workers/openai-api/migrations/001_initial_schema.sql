-- =============================================================================
-- Migration 001: Initial Schema Setup
-- =============================================================================
-- Description: Creates the initial database schema for the OpenAI API worker
-- Version: 1.0.0
-- Date: 2024-12-18
-- Environment: All (development, staging, production)
-- =============================================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Core tables for usage tracking and API management
\i ../schema.sql

-- Verify schema creation
SELECT 'Schema migration 001 completed successfully' as status;