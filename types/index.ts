/**
 * Central export file for all types in the application
 * 
 * Import from this file to get access to all types in one import:
 * import { BaseEntity, Exercise, WritingProject } from '@/types';
 */

// Export base types (fundamental shared types)
export * from './base';

// Export domain-specific types
export * from './exercises';  // Exercise types and related interfaces
export * from './learning';   // User progress, learning paths and level completion
export * from './writing';    // Writing projects, templates and AI feedback