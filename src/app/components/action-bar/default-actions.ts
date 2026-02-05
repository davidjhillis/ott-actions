import { ActionBarConfig, ActionDefinition, ActionGroup } from '../../models/action.model';

export const DEFAULT_GROUPS: ActionGroup[] = [
	{
		id: 'distribution',
		label: 'Distribution',
		order: 1,
		collapsible: true,
		collapsed: false
	},
	{
		id: 'management',
		label: 'Management',
		order: 2,
		collapsible: true,
		collapsed: false
	},
	{
		id: 'info',
		label: 'Information',
		order: 3,
		collapsible: true,
		collapsed: false
	}
];

export const DEFAULT_ACTIONS: ActionDefinition[] = [
	// Distribution group
	{
		id: 'distribute-report',
		label: 'Distribute Report',
		icon: 'send',
		description: 'Send report to selected recipients',
		handler: { type: 'modal', componentId: 'distribute-report' },
		visibility: { folderOnly: true },
		confirmation: {
			enabled: true,
			title: 'Distribute Report',
			message: 'Are you sure you want to distribute this report?',
			confirmLabel: 'Distribute',
			cancelLabel: 'Cancel'
		},
		enabled: true,
		order: 1,
		groupId: 'distribution'
	},
	{
		id: 'assign-report-number',
		label: 'Assign Report Number',
		icon: 'hash',
		description: 'Assign an official report number to this collection',
		handler: { type: 'modal', componentId: 'assign-report-number' },
		visibility: { folderOnly: true },
		enabled: true,
		order: 2,
		groupId: 'distribution'
	},
	{
		id: 'export-collection',
		label: 'Export Collection',
		icon: 'file-output',
		description: 'Export collection contents as a package',
		handler: { type: 'modal', componentId: 'export-collection' },
		visibility: { folderOnly: true },
		enabled: true,
		order: 3,
		groupId: 'distribution'
	},
	{
		id: 'send-to-translation',
		label: 'Send to Translation',
		icon: 'languages',
		description: 'Send items for translation via Worldview',
		handler: { type: 'modal', componentId: 'send-to-translation' },
		visibility: { folderOnly: true },
		enabled: true,
		order: 4,
		groupId: 'distribution'
	},

	// Management group
	{
		id: 'create-collection',
		label: 'Create Collection',
		icon: 'folder-plus',
		description: 'Create a new standards collection folder',
		handler: { type: 'modal', componentId: 'create-collection' },
		enabled: true,
		order: 1,
		groupId: 'management'
	},
	{
		id: 'manage-workflow',
		label: 'Manage Workflow',
		icon: 'refresh-cw',
		description: 'Change workflow status of selected items',
		handler: { type: 'modal', componentId: 'manage-workflow' },
		enabled: true,
		order: 2,
		groupId: 'management'
	},
	{
		id: 'check-out',
		label: 'Check Out',
		icon: 'lock',
		description: 'Check out this page for editing',
		handler: {
			type: 'cmsApi',
			cmsService: 'PageCommandsServices',
			cmsMethod: 'CheckOut',
			confirmBefore: false
		},
		visibility: { fileOnly: true },
		enabled: true,
		order: 3,
		groupId: 'management'
	},
	{
		id: 'check-in',
		label: 'Check In',
		icon: 'unlock',
		description: 'Check in this page after editing',
		handler: {
			type: 'cmsApi',
			cmsService: 'PageCommandsServices',
			cmsMethod: 'CheckIn',
			postCall: 'refreshTree',
			confirmBefore: false
		},
		visibility: { fileOnly: true },
		enabled: true,
		order: 4,
		groupId: 'management'
	},
	{
		id: 'batch-assign',
		label: 'Batch Assign',
		icon: 'users',
		description: 'Assign items to team members',
		handler: { type: 'modal', componentId: 'batch-assign' },
		enabled: true,
		order: 5,
		groupId: 'management'
	},

	// Info group
	{
		id: 'view-details',
		label: 'View Details',
		icon: 'info',
		description: 'View folder and asset details',
		handler: { type: 'panel', componentId: 'view-details' },
		enabled: true,
		order: 1,
		groupId: 'info'
	},
	{
		id: 'view-history',
		label: 'View History',
		icon: 'history',
		description: 'View change history for this item',
		handler: { type: 'panel', componentId: 'view-history' },
		enabled: true,
		order: 2,
		groupId: 'info'
	}
];

export const DEFAULT_ACTION_BAR_CONFIG: ActionBarConfig = {
	groups: DEFAULT_GROUPS,
	actions: DEFAULT_ACTIONS
};
