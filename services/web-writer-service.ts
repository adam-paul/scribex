import supabaseService from './supabase-service';
import { WritingProject } from '@/types';
import { nanoid } from 'nanoid/non-secure';

/**
 * Service for handling web writer pairing functionality
 */
class WebWriterService {
  private static instance: WebWriterService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): WebWriterService {
    if (!WebWriterService.instance) {
      WebWriterService.instance = new WebWriterService();
    }
    return WebWriterService.instance;
  }

  /**
   * Generate a session token and store it in Supabase
   * @param projectId The ID of the project to associate with the token
   * @returns The generated token or null if error
   */
  public async generateSessionToken(projectId: string): Promise<string | null> {
    try {
      console.log("[TOKEN] Generating session token for project:", projectId);
      
      const user = supabaseService.getCurrentUser();
      if (!user) {
        console.error('[TOKEN] Cannot generate session token: No user is logged in');
        return null;
      }
      
      console.log("[TOKEN] User authenticated:", user.id);

      // Get the project
      console.log("[TOKEN] Fetching writing projects");
      const projects = await supabaseService.getWritingProjects('generateSessionToken');
      console.log("[TOKEN] Writing projects fetched:", projects?.length || 0);
      
      const project = projects?.find(p => p.id === projectId);

      if (!project) {
        console.error('[TOKEN] Cannot generate session token: Project not found');
        return null;
      }
      
      console.log("[TOKEN] Project found:", project.id, project.title);

      // Generate a random token
      const token = nanoid(12);
      console.log("[TOKEN] Generated random token:", token);
      
      // Store the token in Supabase
      console.log("[TOKEN] Storing token in web_session_tokens table");
      const { data, error } = await supabaseService.getClient()
        .from('web_session_tokens')
        .insert({
          token,
          user_id: user.id,
          project_id: projectId,
          project_data: project,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        })
        .select();

      if (error) {
        console.error('[TOKEN] Error storing session token:', error);
        return null;
      }
      
      console.log('[TOKEN] Token stored successfully:', data);
      
      // Verify token was properly stored
      const { data: verifyData, error: verifyError } = await supabaseService.getClient()
        .from('web_session_tokens')
        .select()
        .eq('token', token)
        .single();
        
      console.log('[TOKEN] Verification check:', verifyData ? 'Found' : 'Not found', verifyError || 'No error');

      return token;
    } catch (error) {
      console.error('Exception generating session token:', error);
      return null;
    }
  }

  /**
   * Validate a session token
   * @param token The token to validate
   * @returns The project associated with the token or null if invalid
   */
  public async validateSessionToken(token: string): Promise<WritingProject | null> {
    try {
      console.log('[TOKEN] Validating session token:', token);
      // Call the RPC function to validate the token
      const { data, error } = await supabaseService.getClient()
        .rpc('validate_session_token', { p_token: token });

      if (error) {
        console.error('[TOKEN] Error validating session token:', error);
        return null;
      }

      console.log('[TOKEN] Validation response:', data);
      if (data && data.valid && data.project) {
        return data.project as WritingProject;
      }

      return null;
    } catch (error) {
      console.error('Exception validating session token:', error);
      return null;
    }
  }

  /**
   * Update a project associated with a session token
   * @param token The session token
   * @param projectUpdate The project data to update
   * @returns Success status
   */
  public async updateProjectWithToken(token: string, projectUpdate: Partial<WritingProject>): Promise<boolean> {
    try {
      console.log('[TOKEN] Updating project with token:', token);
      // First validate the token and get the current project
      const project = await this.validateSessionToken(token);
      
      if (!project) {
        console.error('[TOKEN] Cannot update project: Invalid token');
        return false;
      }

      console.log('[TOKEN] Project found, updating...');
      // Update the project in Supabase
      const { error } = await supabaseService.getClient()
        .from('web_session_tokens')
        .update({
          project_data: { ...project, ...projectUpdate, dateModified: new Date().toISOString() }
        })
        .eq('token', token);

      if (error) {
        console.error('Error updating project with token:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception updating project with token:', error);
      return false;
    }
  }
}

export default WebWriterService.getInstance();