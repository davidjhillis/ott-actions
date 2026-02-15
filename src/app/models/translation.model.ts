/**
 * Lifecycle statuses for translated standards
 */
export type LifecycleStatus =
	| 'In Quotation'
	| 'In Translation'
	| 'In QA'
	| 'In Editorial Review'
	| 'Published to ML'
	| 'Published';

export const LIFECYCLE_STATUSES: LifecycleStatus[] = [
	'In Quotation',
	'In Translation',
	'In QA',
	'In Editorial Review',
	'Published to ML',
	'Published'
];

export const LIFECYCLE_STATUS_COLORS: Record<LifecycleStatus, string> = {
	'In Quotation': '#94a3b8',
	'In Translation': '#f59e0b',
	'In QA': '#8b5cf6',
	'In Editorial Review': '#3b82f6',
	'Published to ML': '#22c55e',
	'Published': '#059669'
};

/**
 * A language + vendor assignment on a Designation Collection
 */
export interface TranslationLanguageAssignment {
	locale: string;
	language: string;
	vendor: string;
	compilations: string[];
}

/**
 * Metadata for a Designation Collection folder
 */
export interface DesignationCollectionMetadata {
	baseDesignation: string;
	organization: string;
	committee: string;
	committeeCode: string;
	homeEditor: string;
	homeEditorEmail: string;
	reportNumber?: string;
	/** Source locale (e.g., 'en-US') — from CMS DesignationCollection component */
	sourceLocale?: string;
	/** Notes — free text from CMS DesignationCollection component */
	notes?: string;
	translationMaintenance: TranslationLanguageAssignment[];
}

/**
 * Metadata for a Standard Dated Version folder
 */
export interface StandardDatedVersionMetadata {
	standardTitle: string;
	actionType: string;
	approvalDate?: string;
	publicationDate?: string;
	designationCollectionId?: string;
	designationCollectionName?: string;
}

/**
 * Metadata for a Translation Batch folder
 */
export interface TranslationBatchMetadata {
	batchId: string;
	type: string;
	vendor: string;
	dueDate?: string;
	assignedTo?: string;
	standardCount: number;
	daysElapsed: number;
	productionReadiness: 'Ready' | 'Not Ready' | 'Partial';
	status: 'Open' | 'In Progress' | 'Closed-Complete';
}

/**
 * A translated standard collection item
 */
export interface TranslatedStandardCollection {
	id: string;
	name: string;
	locale: string;
	language: string;
	vendor: string;
	batchId?: string;
	batchName?: string;
	lifecycleStatus: LifecycleStatus;
	dueDate?: string;
	assignee?: string;
	daysElapsed: number;
	priority: 'Low' | 'Medium' | 'High';
	designation?: string;
}

/**
 * A Translation Manager project
 */
export interface TMProject {
	id: string;
	name: string;
	locale: string;
	language: string;
	itemCount: number;
	dueDate?: string;
	status: 'Open' | 'In Progress' | 'Completed';
}

/**
 * Healthcheck status breakdown
 */
export interface HealthcheckStatusEntry {
	status: LifecycleStatus;
	count: number;
	percentage: number;
	items: TranslatedStandardCollection[];
}

/**
 * Folder child item for contents tab
 */
export interface FolderChildItem {
	id: string;
	name: string;
	type: string;
	schema?: string;
	size?: string;
	modified?: string;
	assignedTo?: string;
	isFolder: boolean;
}

/**
 * Schema types that drive tab configuration
 */
export type FolderSchema =
	| 'DesignationCollection'
	| 'StandardDatedVersion'
	| 'TranslationBatch'
	| 'StandardCollection'
	| 'default';

/**
 * Tab definition
 */
export interface FolderTab {
	id: string;
	label: string;
	icon: string;
}

/**
 * Tab config by schema
 */
export const SCHEMA_TABS: Record<FolderSchema, FolderTab[]> = {
	DesignationCollection: [
		{ id: 'contents', label: 'Contents', icon: 'folder' },
		{ id: 'translation', label: 'Translation', icon: 'languages' },
		{ id: 'kanban', label: 'Kanban', icon: 'columns' },
		{ id: 'healthcheck', label: 'Healthcheck', icon: 'circle-check' },
		{ id: 'properties', label: 'Properties', icon: 'settings' }
	],
	StandardDatedVersion: [
		{ id: 'contents', label: 'Contents', icon: 'folder' },
		{ id: 'translation', label: 'Translation', icon: 'languages' },
		{ id: 'properties', label: 'Properties', icon: 'settings' }
	],
	TranslationBatch: [
		{ id: 'contents', label: 'Contents', icon: 'folder' },
		{ id: 'kanban', label: 'Kanban', icon: 'columns' },
		{ id: 'healthcheck', label: 'Healthcheck', icon: 'circle-check' },
		{ id: 'properties', label: 'Properties', icon: 'settings' }
	],
	StandardCollection: [
		{ id: 'contents', label: 'Contents', icon: 'folder' },
		{ id: 'properties', label: 'Properties', icon: 'settings' },
		{ id: 'report-number', label: 'Report Number', icon: 'hash' }
	],
	default: [
		{ id: 'contents', label: 'Contents', icon: 'folder' },
		{ id: 'properties', label: 'Properties', icon: 'settings' }
	]
};

/**
 * Editorial status — simplified 4-state Kanban for MVP
 */
export type EditorialStatus = 'Draft' | 'In Review' | 'Approved' | 'Published';

export const EDITORIAL_STATUSES: EditorialStatus[] = [
	'Draft', 'In Review', 'Approved', 'Published'
];

export const EDITORIAL_STATUS_COLORS: Record<EditorialStatus, string> = {
	'Draft': '#94a3b8',
	'In Review': '#f59e0b',
	'Approved': '#3b82f6',
	'Published': '#22c55e'
};

/**
 * Map a CMS lifecycle status to simplified editorial status
 */
export function mapLifecycleToEditorial(lifecycleStatus?: LifecycleStatus | string): EditorialStatus {
	if (!lifecycleStatus) return 'Draft';
	switch (lifecycleStatus) {
		case 'In Quotation':
			return 'Draft';
		case 'In Translation':
		case 'In QA':
			return 'In Review';
		case 'In Editorial Review':
		case 'Published to ML':
			return 'Approved';
		case 'Published':
			return 'Published';
		default:
			return 'Draft';
	}
}

/**
 * Generic CMS page field for dynamic schema rendering
 */
export interface CmsPageField {
	name: string;
	value: any;
	type: 'text' | 'date' | 'link' | 'list' | 'dropdown' | 'table' | 'rich-text' | 'unknown';
	label: string;
}

/**
 * Import row from Excel
 */
export interface ExcelImportRow {
	designation: string;
	version: string;
	locale: string;
	vendor: string;
	batchId: string;
	valid: boolean;
	error?: string;
}

/**
 * Import result
 */
export interface ExcelImportResult {
	totalRows: number;
	collectionsCreated: number;
	batchesCreated: number;
	errors: string[];
}
