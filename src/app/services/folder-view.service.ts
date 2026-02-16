import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { CMSCommunicationsService } from './cms-communications.service';
import { CmsApiService, CmsPageData, CmsAssetChild, CmsPageProperties } from './cms-api.service';
import { MetadataLookupService, ElementUpdate } from './metadata-lookup.service';
import { AssetContext } from '../models/asset-context.model';
import {
	FolderSchema, FolderTab, FolderChildItem,
	DesignationCollectionMetadata, StandardDatedVersionMetadata,
	TranslationBatchMetadata, TranslatedStandardCollection,
	TMProject, HealthcheckStatusEntry, LifecycleStatus,
	LIFECYCLE_STATUSES, SCHEMA_TABS, CmsPageField
} from '../models/translation.model';

export interface BreadcrumbSegment {
	id: string;
	name: string;
	path: string;
}

export interface FolderViewData {
	schema: FolderSchema;
	tabs: FolderTab[];
	breadcrumbs: BreadcrumbSegment[];
	children: FolderChildItem[];
	metadata: DesignationCollectionMetadata | StandardDatedVersionMetadata | TranslationBatchMetadata | null;
	translatedCollections: TranslatedStandardCollection[];
	tmProjects: TMProject[];
	healthcheck: HealthcheckStatusEntry[];
	/** Dynamic fields parsed from CMS page data (for dynamic rendering) */
	pageFields: CmsPageField[];
	/** Raw page data from CMS */
	rawPageData: CmsPageData | null;
}

@Injectable({
	providedIn: 'root'
})
export class FolderViewService {
	private viewDataSubject = new BehaviorSubject<FolderViewData | null>(null);
	public viewData$ = this.viewDataSubject.asObservable();

	constructor(
		private cms: CMSCommunicationsService,
		private cmsApi: CmsApiService,
		private metadataLookup: MetadataLookupService
	) {}

	/**
	 * Resolve folder view data from asset context.
	 * Uses ctx.folderType (from Folder schema FolderType element) as the logical schema.
	 * Priority: NG_REF (direct CMS state) → REST API → postMessage → demo data.
	 */
	loadFolderView(ctx: AssetContext): void {
		const ngRef = (window.top as any)?.NG_REF;

		// Try NG_REF first (synchronous, reliable in CMS)
		if (ngRef?.currentContent) {
			this.loadFromNgRef(ctx, ngRef);
			return;
		}

		// Fall back to REST API
		this.cmsApi.checkAvailability().subscribe(available => {
			if (available) {
				this.loadFromRestApi(ctx);
			} else if (!this.cms.isDevMode) {
				this.loadFromPostMessage(ctx);
			} else {
				// Dev mode fallback
				this.viewDataSubject.next(this.getDemoData(ctx));
			}
		});
	}

	/**
	 * Load folder data directly from CMS NG_REF state.
	 * Reads Model._value for metadata and parses the native <mat-table> DOM for children.
	 */
	private loadFromNgRef(ctx: AssetContext, ngRef: any): void {
		const model = ngRef.currentContent?.Model?._value;
		if (!model) {
			this.cmsApi.checkAvailability().subscribe(available => {
				if (available) this.loadFromRestApi(ctx);
				else this.viewDataSubject.next(this.getDemoData(ctx));
			});
			return;
		}

		// Use folderType (from FolderType element) as the logical schema
		const schema = this.resolveSchema(ctx.folderType || model.SchemaName || ctx.schema);
		const breadcrumbs = this.buildBreadcrumbsFromPath(ctx.path || '', ctx.id, model.Name || ctx.name);
		const children = this.parseChildrenFromDom();
		const metadata = this.extractMetadataFromModel(schema, model);

		const data: FolderViewData = {
			schema,
			tabs: this.getTabsForSchema(schema),
			breadcrumbs,
			children,
			metadata,
			translatedCollections: [],
			tmProjects: [],
			healthcheck: [],
			pageFields: this.buildPageFieldsFromModel(model),
			rawPageData: null
		};

		this.viewDataSubject.next(data);
		console.log(`[IGX-OTT] Loaded from NG_REF: ${model.Name}, folderType=${ctx.folderType}, schema=${schema}, children=${children.length}`);

		// Enrich with site tree metadata if available
		if (ctx.metadataPageId) {
			this.loadMetadataFromSiteTree(ctx.metadataPageId, schema, data);
		}
	}

	/**
	 * Parse folder children from the native CMS <mat-table> inside <folder-view>.
	 * Each row contains: name, ID, type, size, modified date.
	 */
	private parseChildrenFromDom(): FolderChildItem[] {
		const items: FolderChildItem[] = [];
		try {
			const topDoc = window.top?.document;
			if (!topDoc) return items;

			const folderView = topDoc.querySelector('folder-view');
			if (!folderView) return items;

			// Find mat-table rows
			const rows = folderView.querySelectorAll('mat-row, tr.mat-mdc-row, [mat-row]');
			rows.forEach((row, index) => {
				const cells = row.querySelectorAll('mat-cell, td.mat-mdc-cell, [mat-cell]');
				if (cells.length < 2) return;

				// Extract text content from cells
				const cellTexts = Array.from(cells).map(c => (c.textContent || '').trim());

				// Typical CMS folder grid: [checkbox], [name], [id], [type], [size], [modified]
				// The exact column layout may vary; we extract what we can
				const nameCell = cells.length > 1 ? cellTexts[1] : cellTexts[0];
				const idCell = cells.length > 2 ? cellTexts[2] : '';
				const typeCell = cells.length > 3 ? cellTexts[3] : '';
				const sizeCell = cells.length > 4 ? cellTexts[4] : '';
				const modifiedCell = cells.length > 5 ? cellTexts[5] : '';

				const isFolder = typeCell.toLowerCase().includes('folder') ||
					row.querySelector('[class*="folder"]') !== null;

				if (nameCell) {
					items.push({
						id: idCell || `dom-${index}`,
						name: nameCell,
						type: typeCell || (isFolder ? 'Folder' : 'File'),
						isFolder,
						size: sizeCell || undefined,
						modified: modifiedCell || undefined
					});
				}
			});
		} catch (e) {
			console.warn('[IGX-OTT] Failed to parse children from DOM:', e);
		}
		return items;
	}

	/**
	 * Extract metadata from the CMS Model object based on schema type.
	 */
	private extractMetadataFromModel(
		schema: FolderSchema,
		model: any
	): DesignationCollectionMetadata | StandardDatedVersionMetadata | TranslationBatchMetadata | null {
		switch (schema) {
			case 'DesignationCollection':
				return {
					baseDesignation: model.Name || '',
					organization: model.Organization || '',
					committee: model.Committee || '',
					committeeCode: model.CommitteeCode || '',
					homeEditor: model.AssignedUserName || model.HomeEditor || '',
					homeEditorEmail: model.HomeEditorEmail || '',
					reportNumber: model.ReportNumber,
					translationMaintenance: []
				};
			case 'StandardDatedVersion':
				return {
					standardTitle: model.Name || '',
					actionType: model.ActionType || '',
					approvalDate: model.ApprovalDate,
					publicationDate: model.PublicationDate,
					designationCollectionId: model.ParentId,
					designationCollectionName: model.ParentName
				};
			case 'TranslationBatch':
				return {
					batchId: model.Id || '',
					type: model.BatchType || model.Type || '',
					vendor: model.Vendor || '',
					dueDate: model.DueDate,
					assignedTo: model.AssignedUserName,
					standardCount: parseInt(model.ChildrenCount || '0', 10),
					daysElapsed: 0,
					productionReadiness: model.ProductionReadiness || 'Not Ready',
					status: model.Status || 'Open'
				};
			default:
				return null;
		}
	}

	/**
	 * Build dynamic page fields from the CMS Model properties.
	 */
	private buildPageFieldsFromModel(model: any): CmsPageField[] {
		const fields: CmsPageField[] = [];
		const skipKeys = new Set(['Id', 'ParentId', '__typename', '_value', 'ChildrenCount']);

		for (const [key, value] of Object.entries(model)) {
			if (skipKeys.has(key) || value === null || value === undefined || value === '') continue;
			if (typeof value === 'object' && !Array.isArray(value)) continue;

			fields.push({
				name: key,
				value: value as any,
				type: Array.isArray(value) ? 'list' : 'text',
				label: key.replace(/([A-Z])/g, ' $1').trim()
			});
		}
		return fields;
	}

	/**
	 * Load data from the REST API (Swagger endpoint)
	 */
	private loadFromRestApi(ctx: AssetContext): void {
		forkJoin({
			pageData: this.cmsApi.getPageData(ctx.id).pipe(catchError(() => of(null))),
			children: this.cmsApi.getAssetChildren(ctx.id).pipe(catchError(() => of([] as CmsAssetChild[]))),
			properties: this.cmsApi.getPageProperties(ctx.id).pipe(catchError(() => of(null)))
		}).subscribe({
			next: ({ pageData, children, properties }) => {
				// Use folderType first, then fall back to page/property schema
				const folderType = pageData?.Elements?.['FolderType']?.Value
					|| pageData?.Elements?.['FolderType']
					|| ctx.folderType;
				const schema = this.resolveSchema(folderType || pageData?.Schema || properties?.Schema || ctx.schema);
				const breadcrumbs = this.buildBreadcrumbsFromProperties(properties, ctx);
				const childItems = this.mapAssetChildren(children);
				const pageFields = pageData ? this.cmsApi.parsePageFields(pageData) : [];

				// Try to extract typed metadata from page data
				const metadata = pageData ? this.extractTypedMetadata(schema, pageData) : null;

				// Extract translated collections from children if schema warrants it
				const translatedCollections = this.extractTranslatedCollections(children, pageData);
				const healthcheck = this.buildHealthcheck(translatedCollections);

				const data: FolderViewData = {
					schema,
					tabs: this.getTabsForSchema(schema),
					breadcrumbs,
					children: childItems,
					metadata,
					translatedCollections,
					tmProjects: this.extractTmProjects(pageData),
					healthcheck,
					pageFields,
					rawPageData: pageData
				};

				this.viewDataSubject.next(data);

				// Enrich with site tree metadata if available
				if (ctx.metadataPageId) {
					this.loadMetadataFromSiteTree(ctx.metadataPageId, schema, data);
				}
			},
			error: () => {
				// Fall back to demo data
				this.viewDataSubject.next(this.getDemoData(ctx));
			}
		});
	}

	/**
	 * Load from CMS postMessage bridge (production inside iframe)
	 */
	private loadFromPostMessage(ctx: AssetContext): void {
		this.cms.callService<any>({
			service: 'SiteTreeServices',
			action: 'GetPageProperties',
			args: [ctx.id]
		}).pipe(
			map(props => this.mapCmsToViewData(ctx, props)),
			catchError(() => of(this.getDemoData(ctx)))
		).subscribe(data => this.viewDataSubject.next(data));
	}

	/**
	 * Get the schema type for a folder
	 */
	resolveSchema(schemaName?: string): FolderSchema {
		if (!schemaName) return 'default';
		const normalized = schemaName.replace(/[\s_-]/g, '').toLowerCase();
		if (normalized.includes('designationcollection')) return 'DesignationCollection';
		if (normalized.includes('standarddatedversion')) return 'StandardDatedVersion';
		if (normalized.includes('translationbatch')) return 'TranslationBatch';
		if (normalized.includes('standardcollection') || normalized === 'standardscollection') return 'StandardCollection';
		return 'default';
	}

	/**
	 * Get tabs for a schema
	 */
	getTabsForSchema(schema: FolderSchema): FolderTab[] {
		return SCHEMA_TABS[schema] || SCHEMA_TABS['default'];
	}

	/**
	 * Build breadcrumbs from CMS page properties (real path, no "Home")
	 */
	buildBreadcrumbsFromProperties(properties: CmsPageProperties | null, ctx: AssetContext): BreadcrumbSegment[] {
		// Use BreadcrumbPath from CMS if available
		if (properties?.BreadcrumbPath && properties.BreadcrumbPath.length > 0) {
			return properties.BreadcrumbPath.map(bp => ({
				id: bp.ID,
				name: bp.Name,
				path: ''
			}));
		}

		// Fall back to parsing the Path string
		const path = properties?.Path || ctx.path;
		return this.buildBreadcrumbsFromPath(path, ctx.id, ctx.name);
	}

	/**
	 * Build breadcrumbs from a path string — no "Home" prefix
	 */
	buildBreadcrumbsFromPath(path: string, currentId: string, currentName: string): BreadcrumbSegment[] {
		if (!path) return [{ id: currentId, name: currentName, path: '' }];

		const segments = path.split('/').filter(s => s.length > 0);
		const crumbs: BreadcrumbSegment[] = [];
		let runningPath = '';

		for (let i = 0; i < segments.length; i++) {
			runningPath += '/' + segments[i];
			crumbs.push({
				id: `seg_${i}`,
				name: segments[i],
				path: runningPath
			});
		}

		// Ensure current item is the last crumb
		if (crumbs.length > 0 && crumbs[crumbs.length - 1].name !== currentName) {
			crumbs.push({ id: currentId, name: currentName, path: runningPath + '/' + currentName });
		}

		return crumbs;
	}

	/**
	 * Save report number inline
	 */
	saveReportNumber(pageId: string, reportNumber: string, effectiveDate: string): Observable<boolean> {
		if (this.cms.isDevMode) {
			console.log(`[IGX-OTT] Dev: Saved report number ${reportNumber} for ${pageId}`);
			return of(true);
		}

		return this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'Save',
			args: [pageId, { ReportNumber: reportNumber, EffectiveDate: effectiveDate }]
		}).pipe(
			map(() => true),
			catchError(() => of(false))
		);
	}

	/**
	 * Update lifecycle status of a translated standard
	 */
	updateLifecycleStatus(itemId: string, newStatus: LifecycleStatus): Observable<boolean> {
		if (this.cms.isDevMode) {
			console.log(`[IGX-OTT] Dev: Updated ${itemId} → ${newStatus}`);
			const current = this.viewDataSubject.value;
			if (current) {
				const item = current.translatedCollections.find(c => c.id === itemId);
				if (item) {
					item.lifecycleStatus = newStatus;
					current.healthcheck = this.buildHealthcheck(current.translatedCollections);
					this.viewDataSubject.next({ ...current });
				}
			}
			return of(true);
		}

		return this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'Save',
			args: [itemId, { LifecycleStatus: newStatus }]
		}).pipe(
			map(() => true),
			catchError(() => of(false))
		);
	}

	/**
	 * Load metadata from a site tree page and merge into existing folder view data.
	 * Called when ctx.metadataPageId is set (folder has a matching site tree metadata page).
	 */
	private loadMetadataFromSiteTree(metadataPageId: string, schema: FolderSchema, currentData: FolderViewData): void {
		this.metadataLookup.getPageData(metadataPageId).pipe(
			catchError(err => {
				console.warn(`[IGX-OTT] Failed to load site tree metadata for ${metadataPageId}:`, err);
				return of(null);
			})
		).subscribe(pageData => {
			if (!pageData) return;

			const metadata = this.extractTypedMetadata(schema, pageData);
			const pageFields = this.cmsApi.parsePageFields(pageData);

			// Merge site tree metadata into current data
			const updated: FolderViewData = {
				...currentData,
				metadata: metadata || currentData.metadata,
				pageFields: pageFields.length > 0 ? pageFields : currentData.pageFields,
				rawPageData: pageData
			};

			this.viewDataSubject.next(updated);
			console.log(`[IGX-OTT] Enriched with site tree metadata from ${metadataPageId}`);
		});
	}

	/**
	 * Save metadata element updates to the site tree page.
	 * Called from the enhanced folder view when inline editing is used.
	 */
	saveMetadataElements(metadataPageId: string, elements: ElementUpdate[]): Observable<boolean> {
		if (this.cms.isDevMode) {
			console.log(`[IGX-OTT] Dev: Saved metadata for ${metadataPageId}`, elements);
			// Update the current view data in dev mode
			const current = this.viewDataSubject.value;
			if (current) {
				for (const el of elements) {
					if (current.rawPageData?.Elements) {
						current.rawPageData.Elements[el.name] = el.value;
					}
				}
				// Re-extract metadata from updated page data
				if (current.rawPageData) {
					const metadata = this.extractTypedMetadata(current.schema, current.rawPageData);
					const pageFields = this.cmsApi.parsePageFields(current.rawPageData);
					this.viewDataSubject.next({
						...current,
						metadata: metadata || current.metadata,
						pageFields: pageFields.length > 0 ? pageFields : current.pageFields
					});
				}
			}
			return of(true);
		}

		// Optimistically update local view data with new values immediately.
		// The CMS preview/page-xml may return stale (committed) content after save,
		// so we apply the edits locally to keep the UI in sync.
		const current = this.viewDataSubject.value;
		if (current?.rawPageData?.Elements) {
			for (const el of elements) {
				current.rawPageData.Elements[el.name] = el.value;
			}
			const metadata = this.extractTypedMetadata(current.schema, current.rawPageData);
			const pageFields = this.cmsApi.parsePageFields(current.rawPageData);
			this.viewDataSubject.next({
				...current,
				metadata: metadata || current.metadata,
				pageFields: pageFields.length > 0 ? pageFields : current.pageFields
			});
		}

		return this.metadataLookup.saveElements(metadataPageId, elements).pipe(
			map(() => true),
			catchError(() => of(false))
		);
	}

	// -- Private helpers --

	/**
	 * Map CMS asset children to FolderChildItem[]
	 */
	private mapAssetChildren(children: CmsAssetChild[]): FolderChildItem[] {
		return children.map(child => ({
			id: child.ID,
			name: child.Name,
			type: child.Schema || child.Type || 'Unknown',
			schema: child.Schema,
			isFolder: child.IsFolder,
			modified: child.LastModifiedDate ? this.formatDate(child.LastModifiedDate) : undefined,
			size: child.Size ? this.formatSize(child.Size) : undefined
		}));
	}

	/**
	 * Extract typed metadata from CMS page data based on schema
	 */
	private extractTypedMetadata(
		schema: FolderSchema,
		pageData: CmsPageData
	): DesignationCollectionMetadata | StandardDatedVersionMetadata | TranslationBatchMetadata | null {
		const el = pageData.Elements || {};
		const attr = pageData.Attributes || {};

		switch (schema) {
			case 'DesignationCollection':
				return {
					baseDesignation: el['DesignationNumber'] || el['BaseDesignation'] || el['Designation'] || pageData.Name || '',
					organization: el['Organization'] || attr['Organization'] || '',
					committee: el['Committee'] || attr['Committee'] || '',
					committeeCode: el['CommitteeCode'] || attr['CommitteeCode'] || '',
					homeEditor: el['HomeEditor'] || attr['HomeEditor'] || '',
					homeEditorEmail: el['HomeEditorEmail'] || attr['HomeEditorEmail'] || '',
					reportNumber: el['ReportNumber'] || attr['ReportNumber'],
					sourceLocale: el['SourceLocale'] || attr['SourceLocale'] || '',
					notes: el['Notes'] || attr['Notes'] || '',
					translationMaintenance: this.extractTranslationMaintenance(el)
				};

			case 'StandardDatedVersion':
				return {
					standardTitle: el['StandardTitle'] || el['Title'] || pageData.Name || '',
					actionType: el['ActionType'] || attr['ActionType'] || '',
					approvalDate: el['ApprovalDate'] || attr['ApprovalDate'],
					publicationDate: el['PublicationDate'] || attr['PublicationDate'],
					designationCollectionId: el['DesignationCollectionID'] || attr['ParentID'],
					designationCollectionName: el['DesignationCollectionName']
				};

			case 'TranslationBatch':
				return {
					batchId: el['BatchID'] || pageData.ID || '',
					type: el['Type'] || el['BatchType'] || '',
					vendor: el['Vendor'] || '',
					dueDate: el['DueDate'] || attr['DueDate'],
					assignedTo: el['AssignedTo'] || attr['AssignedTo'],
					standardCount: parseInt(el['StandardCount'] || '0', 10),
					daysElapsed: parseInt(el['DaysElapsed'] || '0', 10),
					productionReadiness: el['ProductionReadiness'] || 'Not Ready',
					status: el['Status'] || 'Open'
				};

			default:
				return null;
		}
	}

	/**
	 * Extract translation maintenance table from elements
	 */
	private extractTranslationMaintenance(el: Record<string, any>): any[] {
		const tm = el['TranslationMaintenance'] || el['LanguageAssignments'];
		if (Array.isArray(tm)) return tm;
		return [];
	}

	/**
	 * Extract translated collections from child assets
	 */
	private extractTranslatedCollections(children: CmsAssetChild[], pageData: CmsPageData | null): TranslatedStandardCollection[] {
		return children
			.filter(c => {
				const schema = (c.Schema || '').toLowerCase();
				return schema.includes('translatedstandard') || schema.includes('translated');
			})
			.map(c => ({
				id: c.ID,
				name: c.Name,
				locale: this.extractLocale(c.Name),
				language: this.extractLanguage(c.Name),
				vendor: 'SDL',
				lifecycleStatus: 'In Translation' as LifecycleStatus,
				daysElapsed: 0,
				priority: 'Medium' as const,
				modified: c.LastModifiedDate
			}));
	}

	/**
	 * Extract TM projects from page data
	 */
	private extractTmProjects(pageData: CmsPageData | null): TMProject[] {
		if (!pageData?.Elements?.['TMProjects']) return [];
		const projects = pageData.Elements['TMProjects'];
		if (!Array.isArray(projects)) return [];
		return projects.map((p: any) => ({
			id: p.ID || p.id || '',
			name: p.Name || p.name || '',
			locale: p.Locale || p.locale || '',
			language: p.Language || p.language || '',
			itemCount: parseInt(p.ItemCount || p.itemCount || '0', 10),
			dueDate: p.DueDate || p.dueDate,
			status: p.Status || p.status || 'Open'
		}));
	}

	private mapCmsToViewData(ctx: AssetContext, props: any): FolderViewData {
		const schema = this.resolveSchema(ctx.folderType || props?.Schema || ctx.schema);
		return {
			schema,
			tabs: this.getTabsForSchema(schema),
			breadcrumbs: this.buildBreadcrumbsFromPath(ctx.path, ctx.id, ctx.name),
			children: [],
			metadata: null,
			translatedCollections: [],
			tmProjects: [],
			healthcheck: [],
			pageFields: [],
			rawPageData: null
		};
	}

	private buildHealthcheck(collections: TranslatedStandardCollection[]): HealthcheckStatusEntry[] {
		const total = collections.length;
		return LIFECYCLE_STATUSES.map(status => {
			const items = collections.filter(c => c.lifecycleStatus === status);
			return {
				status,
				count: items.length,
				percentage: total > 0 ? Math.round((items.length / total) * 100) : 0,
				items
			};
		});
	}

	private extractLocale(name: string): string {
		const match = name.match(/__([a-z]{2}-[A-Z]{2})$/);
		return match ? match[1] : '';
	}

	private extractLanguage(name: string): string {
		const locale = this.extractLocale(name);
		const map: Record<string, string> = {
			'es-CL': 'Chilean Spanish', 'pt-BR': 'Brazilian Portuguese',
			'fr-FR': 'French', 'de-DE': 'German', 'ja-JP': 'Japanese',
			'zh-CN': 'Chinese (Simplified)', 'ko-KR': 'Korean'
		};
		return map[locale] || locale;
	}

	private formatDate(dateStr: string): string {
		try {
			const d = new Date(dateStr);
			return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
		} catch {
			return dateStr;
		}
	}

	private formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	/**
	 * Demo data for standalone dev preview
	 */
	private getDemoData(ctx: AssetContext): FolderViewData {
		const schema = this.resolveSchema(ctx.schema);

		const demoCollections = this.getDemoTranslatedCollections();
		const healthcheck = this.buildHealthcheck(demoCollections);

		// No "Home" — start from actual root folder
		const breadcrumbs: BreadcrumbSegment[] = [
			{ id: 'af/1', name: 'Standards Documents', path: '/Standards Documents' },
			{ id: 'af/5', name: 'E0008_E0008M', path: '/Standards Documents/E0008_E0008M' },
			{ id: 'af/7', name: 'E0008_E0008M-25', path: '/Standards Documents/E0008_E0008M/E0008_E0008M-25' }
		];

		const children: FolderChildItem[] = [
			{ id: 'af/12', name: 'E0008_E0008M-16AE01: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Standard Collection', schema: 'StandardCollection', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/13', name: 'E0008_E0008M-21: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Standard Collection', schema: 'StandardCollection', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/14', name: 'E0008_E0008M-22: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Standard Collection', schema: 'StandardCollection', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/15', name: 'E0008_E0008M-24: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Standard Collection', schema: 'StandardCollection', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/16', name: 'E0008_E0008M-25: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Standard Collection', schema: 'StandardCollection', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/17', name: 'E0008_source.dxml', type: 'DXML', isFolder: false, modified: '10/15/2025', size: '245 KB' },
			{ id: 'af/18', name: 'E0008_E0008M-25.pdf', type: 'PDF', isFolder: false, modified: '11/01/2025', size: '1.2 MB' }
		];

		const metadata: DesignationCollectionMetadata = {
			baseDesignation: 'E0008_E0008M',
			organization: 'ASTM International',
			committee: 'E28 — Mechanical Testing',
			committeeCode: 'E28',
			homeEditor: 'Emilie Whealen',
			homeEditorEmail: 'ewhealen@astm.org',
			reportNumber: 'RPT-2025-0042',
			translationMaintenance: [
				{
					locale: 'pt-BR',
					language: 'Brazilian Portuguese',
					vendor: 'SDL',
					compilations: ['60.02 - ASTM Standards in Building Codes']
				},
				{
					locale: 'es-CL',
					language: 'Chilean Spanish',
					vendor: 'SDL',
					compilations: ['60.02 - ASTM Standards in Building Codes']
				}
			]
		};

		const tmProjects: TMProject[] = [
			{ id: 'tm-1', name: 'RWS 2025 pt-BR Migration', locale: 'pt-BR', language: 'Portuguese (Brazil)', itemCount: 31, dueDate: '1/31/2026', status: 'In Progress' },
			{ id: 'tm-2', name: 'SDL_Nov_28_2025', locale: 'es-CL', language: 'Spanish (Chile)', itemCount: 1, dueDate: '12/22/2025', status: 'Open' }
		];

		// Demo page fields for dynamic rendering
		const pageFields: CmsPageField[] = [
			{ name: 'DesignationNumber', value: 'E0008_E0008M', type: 'text', label: 'Designation Number' },
			{ name: 'Organization', value: 'ASTM International', type: 'text', label: 'Organization' },
			{ name: 'Committee', value: 'E28 — Mechanical Testing', type: 'text', label: 'Committee' },
			{ name: 'HomeEditor', value: 'Emilie Whealen', type: 'text', label: 'Home Editor' },
			{ name: 'HomeEditorEmail', value: 'ewhealen@astm.org', type: 'link', label: 'Home Editor Email' },
			{ name: 'ReportNumber', value: 'RPT-2025-0042', type: 'text', label: 'Report Number' },
			{ name: 'SourceLocale', value: 'en-US', type: 'text', label: 'Source Locale' },
			{ name: 'Notes', value: 'Demo designation collection for tension testing', type: 'text', label: 'Notes' },
			{
				name: 'TranslationMaintenance',
				value: metadata.translationMaintenance,
				type: 'table',
				label: 'Translation Maintenance'
			}
		];

		return {
			schema: schema === 'default' ? 'DesignationCollection' : schema,
			tabs: this.getTabsForSchema(schema === 'default' ? 'DesignationCollection' : schema),
			breadcrumbs,
			children,
			metadata,
			translatedCollections: demoCollections,
			tmProjects,
			healthcheck,
			pageFields,
			rawPageData: null
		};
	}

	private getDemoTranslatedCollections(): TranslatedStandardCollection[] {
		const statuses: LifecycleStatus[] = ['In Quotation', 'In Translation', 'In QA', 'In Editorial Review', 'Published to ML', 'Published'];
		const counts = [0, 39, 0, 59, 68, 28];
		const designations = [
			'D7094', 'D3831', 'D6648', 'D6930', 'E1186', 'F0086', 'F3129', 'D0070', 'D0420', 'C0080', 'C0061',
			'D8332', 'D8333', 'D8401', 'D8402', 'D8489', 'E0119', 'C0033', 'F2413', 'D4294', 'D7042', 'A0706',
			'C0150', 'D3163', 'D5528', 'E0084', 'E0162', 'E0648', 'F1292', 'D4060', 'D7264', 'E0096'
		];
		const locales = ['es-CL', 'pt-BR'];
		const assignees = ['Julia', 'Emilie', 'Sarah', 'Michael', undefined];

		const collections: TranslatedStandardCollection[] = [];
		let idCounter = 1;

		for (let si = 0; si < statuses.length; si++) {
			const count = counts[si];
			for (let i = 0; i < count; i++) {
				const desig = designations[i % designations.length];
				const locale = locales[i % locales.length];
				const ver = 20 + (i % 6);
				collections.push({
					id: `tsc-${idCounter++}`,
					name: `ASTM_${desig}-${ver}__${locale}`,
					locale,
					language: locale === 'es-CL' ? 'Chilean Spanish' : 'Brazilian Portuguese',
					vendor: 'SDL',
					batchId: `batch-${(i % 3) + 1}`,
					batchName: i % 2 === 0 ? 'SDL_Aug_29_2025' : 'RWS_2025_New',
					lifecycleStatus: statuses[si],
					dueDate: i % 3 === 0 ? '12/31/2025' : undefined,
					assignee: assignees[i % assignees.length],
					daysElapsed: 30 + (i * 3) % 120,
					priority: i % 5 === 0 ? 'High' : 'Medium',
					designation: `${desig}-${ver}`
				});
			}
		}

		return collections;
	}
}
