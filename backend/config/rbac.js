/**
 * RBAC (Role-Based Access Control) Configuration
 * Defines permissions for each role in the system
 */

export const RBAC_PERMISSIONS = {
  Administrator: {
    role: "Administrator",
    label: "System Administrator",
    permissions: [
      // User Management
      "manage_users",
      "view_users",
      "create_users",
      "edit_users",
      "delete_users",
      "reset_user_password",

      // System Settings
      "manage_system_settings",
      "manage_roles",
      "view_audit_logs",
      "manage_departments",

      // Projects
      "view_all_projects",
      "create_project",
      "edit_project",
      "delete_project",
      "approve_project",

      // Alerts & Notifications
      "manage_alerts",
      "view_alerts",
      "clear_alerts",

      // Reports
      "generate_reports",
      "export_reports",
      "view_analytics",

      // All other permissions
      "all",
    ],
  },

  SeniorOfficer: {
    role: "SeniorOfficer",
    label: "Senior Officer",
    permissions: [
      // View Permissions
      "view_all_projects",
      "view_analytics",
      "view_alerts",
      "view_reports",

      // Reports
      "export_reports",
      "generate_custom_reports",

      // Analysis
      "view_progress_tracking",
      "view_bottleneck_analysis",
      "view_dependency_alerts",

      // Collaboration
      "add_notes_to_projects",
      "view_comments",

      // Insights
      "view_gis_data",
      "view_weighted_progress",
    ],
  },

  DepartmentOfficer: {
    role: "DepartmentOfficer",
    label: "Department Officer",
    permissions: [
      // Department-level access
      "view_department_projects",
      "view_own_department",
      "edit_own_department",

      // Stage-specific permissions (will be extended based on sub-role)
      "view_project_details",
      "update_project_status",
      "add_project_documents",
      "upload_gis_data",

      // Collaboration
      "add_notes",
      "view_comments",
      "send_notifications",

      // Limited reporting
      "view_department_reports",
      "export_department_data",
    ],
  },

  ProjectManager: {
    role: "ProjectManager",
    label: "Project Manager",
    permissions: [
      // Project Management
      "create_project",
      "view_projects",
      "edit_project",
      "view_project_details",
      "manage_project_team",
      "assign_tasks",

      // Tracking
      "update_project_status",
      "view_progress",
      "manage_timeline",

      // Reports
      "generate_project_reports",
      "export_project_data",
      "view_project_analytics",

      // Collaboration
      "add_notes",
      "view_comments",
      "send_notifications",
    ],
  },

  DistrictOfficer: {
    role: "DistrictOfficer",
    label: "District Officer",
    permissions: [
      // District-level view
      "view_district_projects",
      "view_district_data",

      // Limited project management
      "view_project_details",
      "add_notes",

      // District reports
      "view_district_reports",
      "export_district_data",
    ],
  },
};

/**
 * STAGE-SPECIFIC PERMISSIONS for DepartmentOfficers
 * Maps specific departments to their unique permissions
 */
export const STAGE_PERMISSIONS = {
  Survey: {
    department: "Survey",
    label: "Survey Officer",
    permissions: [
      "view_survey_data",
      "create_survey",
      "edit_survey",
      "add_coordinates",
      "upload_drone_data",
      "mark_survey_complete",
      "view_boundaries",
      "manage_land_demarcations",
      "upload_survey_reports",
    ],
  },

  "Legal Verification": {
    department: "Legal Verification",
    label: "Legal Verification Officer",
    permissions: [
      "view_legal_data",
      "verify_title",
      "check_disputes",
      "manage_noc",
      "approve_legal",
      "record_ownership_changes",
      "manage_encumbrance_details",
      "schedule_hearings",
      "upload_legal_documents",
      "view_title_deeds",
    ],
  },

  Compensation: {
    department: "Compensation",
    label: "Compensation Officer",
    permissions: [
      "view_compensation_data",
      "calculate_award",
      "verify_bank_details",
      "process_disbursement",
      "manage_beneficiaries",
      "create_payment_orders",
      "upload_bank_statements",
      "track_payment_status",
      "approve_compensation",
      "view_beneficiary_details",
    ],
  },

  Rehabilitation: {
    department: "Rehabilitation",
    label: "Rehabilitation Officer",
    permissions: [
      "view_rehabilitation_data",
      "allocate_plots",
      "manage_schemes",
      "track_livelihood",
      "generate_rehabilitation_reports",
      "manage_resettlement",
      "approve_plots",
      "view_affected_families",
      "upload_rehabilitation_docs",
      "schedule_training",
    ],
  },

  Approvals: {
    department: "Approvals",
    label: "Approvals Officer",
    permissions: [
      "view_approvals_data",
      "review_clearances",
      "publish_gazette",
      "issue_sanctions",
      "approve_documents",
      "manage_notifications",
      "track_clearance_status",
      "upload_approval_docs",
      "schedule_inspections",
      "generate_certificates",
    ],
  },

  Possession: {
    department: "Possession",
    label: "Possession Officer",
    permissions: [
      "view_possession_data",
      "record_takeover",
      "handover_site",
      "mark_completion",
      "generate_certificates",
      "manage_asset_transfer",
      "update_ownership_records",
      "upload_possession_docs",
      "schedule_handover",
      "track_possession_status",
    ],
  },
};

/**
 * Action-based permissions (used for specific features)
 */
export const ACTION_PERMISSIONS = {
  CAN_VIEW_DASHBOARD: ["Administrator", "SeniorOfficer", "ProjectManager"],
  CAN_CREATE_PROJECT: ["Administrator", "ProjectManager"],
  CAN_EDIT_PROJECT: ["Administrator", "ProjectManager", "DepartmentOfficer"],
  CAN_DELETE_PROJECT: ["Administrator"],
  CAN_VIEW_ANALYTICS: ["Administrator", "SeniorOfficer", "ProjectManager"],
  CAN_EXPORT_DATA: ["Administrator", "SeniorOfficer", "ProjectManager"],
  CAN_MANAGE_USERS: ["Administrator"],
  CAN_VIEW_ALERTS: ["Administrator", "SeniorOfficer"],
  CAN_MANAGE_DEPARTMENTS: ["Administrator"],
};

/**
 * Helper function to check if a role has a permission
 */
export const hasPermission = (role, permission) => {
  const roleConfig = RBAC_PERMISSIONS[role];
  if (!roleConfig) return false;
  if (roleConfig.permissions.includes("all")) return true;
  return roleConfig.permissions.includes(permission);
};

/**
 * Helper function to check if a role can perform an action
 */
export const canPerformAction = (role, action) => {
  const allowedRoles = ACTION_PERMISSIONS[action];
  return allowedRoles ? allowedRoles.includes(role) : false;
};

/**
 * Helper function to get all permissions for a role
 */
export const getRolePermissions = (role) => {
  const roleConfig = RBAC_PERMISSIONS[role];
  return roleConfig ? roleConfig.permissions : [];
};

/**
 * Helper function to get stage-specific permissions
 */
export const getStagePermissions = (department) => {
  return STAGE_PERMISSIONS[department] || null;
};
