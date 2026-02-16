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
	outdated?: boolean;
}

/**
 * Data passed through the Send to Translation wizard
 */
export interface TranslationSubmission {
	files: FolderChildItem[];
	projectId: string | null;
	projectName: string;
	vendor: string;
	locale: string;
	dueDate?: string;
	isNewProject: boolean;
}

/**
 * A Translation Manager project
 */
export interface TMProject {
	id: string;
	name: string;
	locale: string;
	language: string;
	vendor: string;
	itemCount: number;
	dueDate?: string;
	status: 'Open' | 'In Progress' | 'Completed';
	tmAppUrl?: string;
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
 * Standard OTT tabs — same for every OTT-managed folder.
 * Folders without a metadata page use the native CMS view instead.
 */
export const OTT_FOLDER_TABS: FolderTab[] = [
	{ id: 'contents', label: 'Contents', icon: 'folder' },
	{ id: 'translation', label: 'Translation', icon: 'languages' },
	{ id: 'properties', label: 'Properties', icon: 'settings' }
];

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
