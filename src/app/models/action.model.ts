/**
 * Action type determines how the action is executed
 */
export type ActionType = 'cmsApi' | 'modal' | 'panel' | 'external' | 'link';

/**
 * Defines when an action should be visible
 */
export interface VisibilityRule {
	/** Show only for folders */
	folderOnly?: boolean;
	/** Show only for files/assets */
	fileOnly?: boolean;
	/** Required user roles (empty = all roles) */
	requiredRoles?: string[];
	/** Required asset types (e.g., 'xml', 'pdf') */
	assetTypes?: string[];
	/** Custom visibility predicate key */
	customRule?: string;
}

/**
 * Confirmation dialog config shown before executing an action
 */
export interface ConfirmationConfig {
	/** Whether to show a confirmation dialog */
	enabled: boolean;
	/** Dialog title */
	title?: string;
	/** Dialog message */
	message?: string;
	/** Confirm button label */
	confirmLabel?: string;
	/** Cancel button label */
	cancelLabel?: string;
}

/**
 * Defines how the action is handled/executed
 */
export interface ActionHandler {
	/** The type of action */
	type: ActionType;

	// --- Modal/Panel fields ---
	/** Component ID to open (for modal/panel type) */
	componentId?: string;

	// --- CMS API fields ---
	/** CMS service name (e.g., 'PageCommandsServices', 'SiteTreeServices') */
	cmsService?: string;
	/** CMS service method (e.g., 'GetPageData', 'Publish') */
	cmsMethod?: string;
	/** Post-call action (e.g., 'refreshTree', 'refreshPage') */
	postCall?: string;
	/** Show confirmation dialog before executing */
	confirmBefore?: boolean;
	/** Legacy: CMS API endpoint path */
	endpoint?: string;
	/** Legacy: HTTP method */
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

	// --- Link/External fields ---
	/** External URL (for external/link type) */
	url?: string;
	/** Whether to open in new tab (for link type) */
	newTab?: boolean;

	// --- Advanced ---
	/** Custom handler function name */
	customHandler?: string;
}

/**
 * A single action definition
 */
export interface ActionDefinition {
	/** Unique identifier */
	id: string;
	/** Display label */
	label: string;
	/** Lucide icon name (e.g., 'send', 'folder-plus', 'info') */
	icon: string;
	/** Tooltip / description */
	description?: string;
	/** How the action is executed */
	handler: ActionHandler;
	/** When the action is visible */
	visibility?: VisibilityRule;
	/** Confirmation before executing */
	confirmation?: ConfirmationConfig;
	/** Whether the action is enabled */
	enabled: boolean;
	/** Sort order within group */
	order: number;
	/** Group this action belongs to */
	groupId: string;
}

/**
 * A group of related actions
 */
export interface ActionGroup {
	/** Unique identifier */
	id: string;
	/** Display label */
	label: string;
	/** Sort order */
	order: number;
	/** Whether the group is collapsible */
	collapsible: boolean;
	/** Whether the group starts collapsed */
	collapsed: boolean;
}

/**
 * Full action bar configuration
 */
export interface ActionBarConfig {
	/** All action groups */
	groups: ActionGroup[];
	/** All action definitions */
	actions: ActionDefinition[];
}
