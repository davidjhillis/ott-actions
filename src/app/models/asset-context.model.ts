/**
 * Represents the current CMS asset/folder context
 * that the Action Bar operates on.
 */
export interface AssetContext {
	/** CMS page/asset ID (xID) */
	id: string;
	/** Asset name */
	name: string;
	/** Whether this is a folder (index) */
	isFolder: boolean;
	/** Full path in the CMS tree */
	path: string;
	/** Asset type / schema */
	schema?: string;
	/** OTT folder type from Folder schema FolderType element or site tree metadata */
	folderType?: string;
	/** Site tree page ID for metadata (when using site tree as metadata store) */
	metadataPageId?: string;
	/** Workflow status */
	workflowStatus?: string;
	/** Parent folder ID */
	parentId?: string;
	/** Selected child items (for batch operations) */
	selectedItems?: AssetContextItem[];
}

/**
 * A single item within a folder selection
 */
export interface AssetContextItem {
	/** CMS page/asset ID */
	id: string;
	/** Asset name */
	name: string;
	/** Whether this item is a folder */
	isFolder: boolean;
	/** Asset type / schema */
	schema?: string;
}
