import { PublicUser } from '@/types/user';

// ============================================================================
// TYPES
// ============================================================================

export type GlobalRole = 'user' | 'staffer' | 'super_admin';
export type TeamRole = 'viewer' | 'editor' | 'admin' | 'owner';
export type ProjectRole = 'viewer' | 'editor' | 'admin' | 'owner';

export interface UserWithRole {
  id: number;
  role: GlobalRole;
  isAdmin?: boolean; // Legacy field, will be deprecated
}

export interface TeamMember {
  role: TeamRole;
}

export interface ProjectMember {
  role: ProjectRole;
}

// Location type for permission checks
interface LocationForPermission {
    createdBy: number;
}

// UserSave type for permission checks
interface UserSaveForPermission {
    userId: number;
}

/**
 * Check if a user can edit a location's details
 * Only the creator OR an admin can edit location information
 */
export function canEditLocation(
    user: PublicUser,
    location: LocationForPermission
): boolean {
    return user.id === location.createdBy || user.isAdmin === true;
}

/**
 * Check if a user can delete a UserSave record
 * Only the user who saved the location can delete it from their saves
 */
export function canDeleteUserSave(
    user: PublicUser,
    userSave: UserSaveForPermission
): boolean {
    return user.id === userSave.userId;
}

// ============================================================================
// GLOBAL PERMISSIONS (Site-wide)
// ============================================================================

/**
 * Check if user can access the admin panel
 * Required: staffer or super_admin
 */
export function canAccessAdminPanel(user: PublicUser | UserWithRole | null | undefined): boolean {
  if (!user) return false;
  // PublicUser now always has role field, fallback to isAdmin for backward compat
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  return role === 'staffer' || role === 'super_admin';
}

/**
 * Check if user can send system-wide emails
 * Required: super_admin only
 */
export function canSendSystemEmails(user: PublicUser | UserWithRole | null | undefined): boolean {
  if (!user) return false;
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  return role === 'super_admin';
}

/**
 * Check if user can manage all users (change roles, delete accounts)
 * Required: super_admin only
 */
export function canManageAllUsers(user: PublicUser | UserWithRole | null | undefined): boolean {
  if (!user) return false;
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  return role === 'super_admin';
}

/**
 * Check if user can change user roles
 * Required: super_admin only
 */
export function canChangeUserRoles(user: PublicUser | UserWithRole | null | undefined): boolean {
  if (!user) return false;
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  return role === 'super_admin';
}

/**
 * Check if user can edit email templates
 * Required: super_admin only
 */
export function canEditEmailTemplates(user: PublicUser | UserWithRole | null | undefined): boolean {
  if (!user) return false;
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  return role === 'super_admin';
}

/**
 * Check if user can resend verification emails
 * Required: staffer or super_admin
 */
export function canResendVerificationEmails(user: PublicUser | UserWithRole | null | undefined): boolean {
  if (!user) return false;
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  return role === 'staffer' || role === 'super_admin';
}

/**
 * Check if user can view user management table
 * Required: staffer or super_admin
 */
export function canViewUserManagement(user: PublicUser | UserWithRole | null | undefined): boolean {
  if (!user) return false;
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  return role === 'staffer' || role === 'super_admin';
}

/**
 * Check if user can moderate content
 * Required: staffer or super_admin
 */
export function canModerateContent(user: PublicUser | UserWithRole | null | undefined): boolean {
  if (!user) return false;
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  return role === 'staffer' || role === 'super_admin';
}

// ============================================================================
// TEAM PERMISSIONS (Scoped to specific team)
// ============================================================================

/**
 * Check if user can send emails to team members
 * Required: Team admin or owner role
 */
export function canSendTeamEmails(teamRole: TeamRole | null | undefined): boolean {
  if (!teamRole) return false;
  return teamRole === 'admin' || teamRole === 'owner';
}

/**
 * Check if user can manage team members (invite, remove)
 * Required: Team admin or owner role
 */
export function canManageTeamMembers(teamRole: TeamRole | null | undefined): boolean {
  if (!teamRole) return false;
  return teamRole === 'admin' || teamRole === 'owner';
}

/**
 * Check if user can edit team settings
 * Required: Team admin or owner role
 */
export function canEditTeamSettings(teamRole: TeamRole | null | undefined): boolean {
  if (!teamRole) return false;
  return teamRole === 'admin' || teamRole === 'owner';
}

/**
 * Check if user can delete the team
 * Required: Team owner role only
 */
export function canDeleteTeam(teamRole: TeamRole | null | undefined): boolean {
  if (!teamRole) return false;
  return teamRole === 'owner';
}

/**
 * Check if user can edit team content
 * Required: Team editor, admin, or owner role
 */
export function canEditTeamContent(teamRole: TeamRole | null | undefined): boolean {
  if (!teamRole) return false;
  return teamRole === 'editor' || teamRole === 'admin' || teamRole === 'owner';
}

// ============================================================================
// PROJECT PERMISSIONS (Scoped to specific project)
// ============================================================================

/**
 * Check if user can send emails to project members
 * Required: Project admin or owner role
 */
export function canSendProjectEmails(projectRole: ProjectRole | null | undefined): boolean {
  if (!projectRole) return false;
  return projectRole === 'admin' || projectRole === 'owner';
}

/**
 * Check if user can manage project members (invite, remove)
 * Required: Project admin or owner role
 */
export function canManageProjectMembers(projectRole: ProjectRole | null | undefined): boolean {
  if (!projectRole) return false;
  return projectRole === 'admin' || projectRole === 'owner';
}

/**
 * Check if user can edit project settings
 * Required: Project admin or owner role
 */
export function canEditProjectSettings(projectRole: ProjectRole | null | undefined): boolean {
  if (!projectRole) return false;
  return projectRole === 'admin' || projectRole === 'owner';
}

/**
 * Check if user can delete the project
 * Required: Project owner role only
 */
export function canDeleteProject(projectRole: ProjectRole | null | undefined): boolean {
  if (!projectRole) return false;
  return projectRole === 'owner';
}

/**
 * Check if user can edit project content (locations, photos)
 * Required: Project editor, admin, or owner role
 */
export function canEditProjectContent(projectRole: ProjectRole | null | undefined): boolean {
  if (!projectRole) return false;
  return projectRole === 'editor' || projectRole === 'admin' || projectRole === 'owner';
}

// ============================================================================
// COMBINED PERMISSIONS (Global + Scoped)
// ============================================================================

/**
 * Check if user can send emails to team (combines global and team permissions)
 * Super admin can send to any team, team admins can send to their own team
 */
export function canSendEmailsToTeam(
  user: PublicUser | UserWithRole | null | undefined,
  teamRole: TeamRole | null | undefined
): boolean {
  if (!user) return false;
  
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  
  // Super admin can send to any team
  if (role === 'super_admin') return true;
  
  // Team admin/owner can send to their own team
  return canSendTeamEmails(teamRole);
}

/**
 * Check if user can send emails to project (combines global and project permissions)
 * Super admin can send to any project, project admins can send to their own project
 */
export function canSendEmailsToProject(
  user: PublicUser | UserWithRole | null | undefined,
  projectRole: ProjectRole | null | undefined
): boolean {
  if (!user) return false;
  
  const role = user.role || (user.isAdmin ? 'staffer' : 'user');
  
  // Super admin can send to any project
  if (role === 'super_admin') return true;
  
  // Project admin/owner can send to their own project
  return canSendProjectEmails(projectRole);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get user's display role name
 */
export function getRoleDisplayName(role: GlobalRole): string {
  const roleNames: Record<GlobalRole, string> = {
    user: 'User',
    staffer: 'Staff',
    super_admin: 'Super Admin',
  };
  return roleNames[role] || 'Unknown';
}

/**
 * Get team role display name
 */
export function getTeamRoleDisplayName(role: TeamRole): string {
  const roleNames: Record<TeamRole, string> = {
    viewer: 'Viewer',
    editor: 'Editor',
    admin: 'Admin',
    owner: 'Owner',
  };
  return roleNames[role] || 'Unknown';
}

/**
 * Get project role display name
 */
export function getProjectRoleDisplayName(role: ProjectRole): string {
  const roleNames: Record<ProjectRole, string> = {
    viewer: 'Viewer',
    editor: 'Editor',
    admin: 'Admin',
    owner: 'Owner',
  };
  return roleNames[role] || 'Unknown';
}

/**
 * Check if role is valid
 */
export function isValidGlobalRole(role: string): role is GlobalRole {
  return ['user', 'staffer', 'super_admin'].includes(role);
}

/**
 * Check if team/project role is valid
 */
export function isValidMemberRole(role: string): role is TeamRole | ProjectRole {
  return ['viewer', 'editor', 'admin', 'owner'].includes(role);
}
