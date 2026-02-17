import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap, shareReplay } from 'rxjs/operators';
import { CMSCommunicationsService } from './cms-communications.service';
import { CmsApiService, CmsPageData } from './cms-api.service';
import { FolderSchema } from '../models/translation.model';

/**
 * A metadata entry mapping an asset folder name to a site tree page.
 */
export interface MetadataEntry {
	/** Site tree page ID (e.g., 'x123') */
	pageId: string;
	/** Resolved schema type */
	schema: FolderSchema;
	/** Raw schema name from CMS */
	schemaName: string;
	/** Folder name this metadata belongs to */
	folderName: string;
}

/**
 * Element update for SavePartial calls.
 */
export interface ElementUpdate {
	name: string;
	value: any;
}

/**
 * Path to the metadata parent in the site tree.
 * Walk: root (x1) → Components → Folder Data → [metadata pages]
 */
const METADATA_PARENT_PATH = ['Components', 'Folder Data'];

/**
 * Demo metadata entries for standalone dev preview.
 * Maps demo asset folder names to fake site tree page IDs.
 */
const DEMO_METADATA: MetadataEntry[] = [
	{ pageId: 'x200', schema: 'DesignationCollection', schemaName: 'DesignationCollection', folderName: 'E0008_E0008M' },
	{ pageId: 'x201', schema: 'DesignationCollection', schemaName: 'DesignationCollection', folderName: 'D6927' },
	{ pageId: 'x202', schema: 'DesignationCollection', schemaName: 'DesignationCollection', folderName: 'A0370' },
	{ pageId: 'x203', schema: 'StandardDatedVersion', schemaName: 'StandardDatedVersion', folderName: 'E0008_E0008M-25' },
	{ pageId: 'x204', schema: 'StandardDatedVersion', schemaName: 'StandardDatedVersion', folderName: 'E0008_E0008M-24' },
	{ pageId: 'x205', schema: 'default', schemaName: 'TranslatedStandardCollection', folderName: 'ASTM_E0008_E0008M-25__es-CL' },
	{ pageId: 'x206', schema: 'default', schemaName: 'TranslatedStandardCollection', folderName: 'ASTM_E0008_E0008M-25__pt-BR' },
	{ pageId: 'x207', schema: 'TranslationBatch', schemaName: 'TranslationBatch', folderName: 'Batch-2025-W06' },
	{ pageId: 'x208', schema: 'TranslationBatch', schemaName: 'TranslationBatch', folderName: 'Batch-2025-W05' },
];

/**
 * Looks up metadata for asset folders by finding matching
 * site tree pages under the "OTT Metadata" parent page.
 *
 * Site tree pages use component schemas (DesignationCollection,
 * TranslationBatch, etc.) and their page name matches the asset
 * folder name exactly.
 *
 * Communication: Uses CMSCommunicationsService (postMessage bridge)
 * in production, with demo data fallback for local dev.
 */
@Injectable({
	providedIn: 'root'
})
export class MetadataLookupService {
	/** Cached map: folder name → metadata entry */
	private metadataMap = new Map<string, MetadataEntry>();

	/** ID of the "OTT Metadata" parent page in the site tree */
	private parentPageId: string | null = null;

	/** Whether the index has been loaded */
	private loaded = false;

	/** Whether a load is currently in progress */
	private loading = false;

	/** Shared observable for the current load — lets multiple callers wait for completion */
	private loadObs$: Observable<void> | null = null;

	constructor(
		private cms: CMSCommunicationsService,
		private cmsApi: CmsApiService
	) {
		if (this.cms.isDevMode) {
			this.loadDemoData();
		}
	}

	/**
	 * Load the metadata index — fetches all child pages under
	 * the "OTT Metadata" parent and caches them by folder name.
	 *
	 * In dev mode, loads hardcoded demo data immediately.
	 * Safe to call multiple times; only loads once.
	 */
	loadMetadataIndex(): Observable<void> {
		if (this.loaded) return of(undefined);

		// Return the in-progress observable so callers can wait for completion
		if (this.loadObs$) return this.loadObs$;

		if (this.cms.isDevMode) {
			this.loadDemoData();
			return of(undefined);
		}

		this.loading = true;

		// Strategy: use REST API first, fall back to postMessage.
		// shareReplay(1) caches the result so late subscribers get it immediately.
		this.loadObs$ = new Observable<void>(subscriber => {
			this.cmsApi.checkAvailability().subscribe(available => {
				if (available) {
					this.loadIndexViaRestApi(subscriber);
				} else {
					this.loadIndexViaPostMessage(subscriber);
				}
			});
		}).pipe(shareReplay(1));

		return this.loadObs$;
	}

	/**
	 * Look up metadata for an asset folder by name.
	 * Returns null if no metadata page exists for this folder.
	 */
	lookupByFolderName(name: string): MetadataEntry | null {
		return this.metadataMap.get(name) || null;
	}

	/**
	 * Check if the metadata index has been loaded.
	 */
	isLoaded(): boolean {
		return this.loaded;
	}

	/**
	 * Read full page data for a metadata site tree page.
	 * Returns the CMS page data with all elements.
	 */
	getPageData(pageId: string): Observable<CmsPageData> {
		if (this.cms.isDevMode) {
			return of(this.getDemoPageData(pageId));
		}

		// Try postMessage first (production), fall back to REST
		return this.cms.callService<CmsPageData>({
			service: 'PageCommandsServices',
			action: 'GetPageData',
			args: [pageId, ''],
			timeout: 5000
		}).pipe(
			catchError(() => this.cmsApi.getPageData(pageId))
		);
	}

	/**
	 * Save partial element updates to a metadata site tree page.
	 * Uses postMessage bridge in CMS, falls back to REST API with FullFieldId format.
	 */
	saveElements(pageId: string, elements: ElementUpdate[]): Observable<void> {
		if (this.cms.isDevMode) {
			console.log(`[IGX-OTT] Dev: SavePartial ${pageId}`, elements);
			return of(undefined);
		}

		// Always use REST API for saves — postMessage SavePartial format
		// is unreliable (requires FullFieldId UIDs, not simple key-value).
		console.log(`[IGX-OTT] Saving ${elements.length} elements to ${pageId} via REST`);
		return this.saveViaRestApi(pageId, elements);
	}

	/**
	 * Save elements via REST API using the FullFieldId format.
	 * Requires element UIDs which are stored as __uid_ElementName in page data.
	 */
	private saveViaRestApi(pageId: string, elements: ElementUpdate[]): Observable<void> {
		// First read the page XML to get element UIDs
		return this.cmsApi.getPageData(pageId).pipe(
			switchMap(pageData => {
				console.log(`[IGX-OTT] Page data for ${pageId}:`, Object.keys(pageData.Elements || {}));

				const saveElements = elements
					.map(el => {
						const uid = pageData.Elements?.[`__uid_${el.name}`];
						if (!uid) {
							console.warn(`[IGX-OTT] No UID found for element "${el.name}" (available UIDs: ${
								Object.keys(pageData.Elements || {}).filter(k => k.startsWith('__uid_')).join(', ')
							})`);
							return null;
						}
						console.log(`[IGX-OTT] Element "${el.name}" → UID ${uid} = "${el.value}"`);
						return {
							FullFieldId: [uid],
							Attributes: [],
							Value: String(el.value)
						};
					})
					.filter(Boolean);

				if (saveElements.length === 0) {
					console.error(`[IGX-OTT] No element UIDs found — cannot save. Elements requested: ${elements.map(e => e.name).join(', ')}`);
					return throwError(() => new Error('No element UIDs found'));
				}

				const body = {
					saveData: {
						PageId: pageId,
						Elements: saveElements,
						Attributes: [],
						CreateMissingAttributes: false
					}
				};

				console.log(`[IGX-OTT] SavePartial body for ${pageId}:`, JSON.stringify(body));

				return this.cmsApi.postWcf<any>(
					'PageCommandsServices', 'SavePartial', body
				).pipe(
					map(() => undefined),
					tap(() => console.log(`[IGX-OTT] REST SavePartial succeeded for ${pageId}`))
				);
			}),
			catchError(err => {
				console.error(`[IGX-OTT] REST SavePartial failed for ${pageId}:`, err);
				return throwError(() => err);
			})
		);
	}

	/**
	 * Force-refresh the metadata index.
	 */
	refresh(): Observable<void> {
		this.loaded = false;
		this.loading = false;
		this.loadObs$ = null;
		this.metadataMap.clear();
		return this.loadMetadataIndex();
	}

	// -- Private helpers --

	/**
	 * Load metadata index via REST API.
	 * Walks the tree path (Components → Folder Data) then indexes children.
	 */
	private loadIndexViaRestApi(subscriber: any): void {
		this.walkTreePathRest('x1', [...METADATA_PARENT_PATH]).subscribe(parentId => {
			if (!parentId) {
				console.warn(`[IGX-OTT] Metadata parent not found at path: ${METADATA_PARENT_PATH.join(' → ')}`);
				this.loaded = true;
				this.loading = false;
				subscriber.next(undefined);
				subscriber.complete();
				return;
			}

			this.parentPageId = parentId;
			console.log(`[IGX-OTT] Found metadata parent: ${parentId}`);

			this.cmsApi.getChildPagesSimple(parentId).pipe(
				catchError(() => of([]))
			).subscribe(metaPages => {
				this.indexChildPages(metaPages);
				subscriber.next(undefined);
				subscriber.complete();
			});
		});
	}

	/**
	 * Walk a path through the site tree via REST API.
	 * Returns the page ID at the end of the path, or null if not found.
	 */
	private walkTreePathRest(rootId: string, path: string[]): Observable<string | null> {
		if (path.length === 0) return of(rootId);

		const [nextName, ...rest] = path;
		return this.cmsApi.getChildPagesSimple(rootId).pipe(
			switchMap(children => {
				const match = (children || []).find((c: any) => c.Name === nextName);
				if (!match) return of(null);
				return this.walkTreePathRest(match.ID, rest);
			}),
			catchError(() => of(null))
		);
	}

	/**
	 * Load metadata index via postMessage bridge.
	 * Walks the tree path (Components → Folder Data) then indexes children.
	 */
	private loadIndexViaPostMessage(subscriber: any): void {
		this.walkTreePathPostMessage('x1', [...METADATA_PARENT_PATH]).subscribe(parentId => {
			if (!parentId) {
				console.warn(`[IGX-OTT] Metadata parent not found via postMessage at path: ${METADATA_PARENT_PATH.join(' → ')}`);
				this.loaded = true;
				this.loading = false;
				subscriber.next(undefined);
				subscriber.complete();
				return;
			}

			this.parentPageId = parentId;

			this.cms.callService<any[]>({
				service: 'SiteTreeServices',
				action: 'GetChildPagesSimple',
				args: [parentId, 1]
			}).pipe(
				catchError(() => of([]))
			).subscribe(metaPages => {
				this.indexChildPages(metaPages || []);
				subscriber.next(undefined);
				subscriber.complete();
			});
		});
	}

	/**
	 * Walk a path through the site tree via postMessage bridge.
	 */
	private walkTreePathPostMessage(rootId: string, path: string[]): Observable<string | null> {
		if (path.length === 0) return of(rootId);

		const [nextName, ...rest] = path;
		return this.cms.callService<any[]>({
			service: 'SiteTreeServices',
			action: 'GetChildPagesSimple',
			args: [rootId, 1]
		}).pipe(
			switchMap(children => {
				const match = (children || []).find((c: any) => c.Name === nextName);
				if (!match) return of(null);
				return this.walkTreePathPostMessage(match.ID, rest);
			}),
			catchError(() => of(null))
		);
	}

	/**
	 * Index child pages by their name → metadata entry.
	 */
	private indexChildPages(pages: any[]): void {
		this.metadataMap.clear();

		for (const page of pages) {
			const name = page.Name || '';
			const schema = this.resolveSchemaFromName(page.Schema || '');
			const entry: MetadataEntry = {
				pageId: page.ID,
				schema,
				schemaName: page.Schema || '',
				folderName: name
			};
			this.metadataMap.set(name, entry);
		}

		this.loaded = true;
		this.loading = false;
		console.log(`[IGX-OTT] Metadata index loaded: ${this.metadataMap.size} entries`);
	}

	/**
	 * Map a CMS schema name to a FolderSchema.
	 */
	private resolveSchemaFromName(schemaName: string): FolderSchema {
		if (!schemaName) return 'default';
		const normalized = schemaName.replace(/[\s_-]/g, '').toLowerCase();
		if (normalized.includes('designationcollection')) return 'DesignationCollection';
		if (normalized.includes('standarddatedversion')) return 'StandardDatedVersion';
		if (normalized.includes('translationbatch')) return 'TranslationBatch';
		if (normalized.includes('standardcollection') || normalized.includes('translatedstandard')) return 'StandardCollection';
		return 'default';
	}

	/**
	 * Load demo data for standalone dev preview.
	 */
	private loadDemoData(): void {
		this.metadataMap.clear();
		for (const entry of DEMO_METADATA) {
			this.metadataMap.set(entry.folderName, entry);
		}
		this.loaded = true;
		this.loading = false;
		console.log(`[IGX-OTT] Demo metadata loaded: ${this.metadataMap.size} entries`);
	}

	/**
	 * Get demo page data for a fake site tree page ID.
	 */
	private getDemoPageData(pageId: string): CmsPageData {
		// Find the entry by pageId
		let entry: MetadataEntry | undefined;
		for (const e of this.metadataMap.values()) {
			if (e.pageId === pageId) {
				entry = e;
				break;
			}
		}

		if (!entry) {
			return { ID: pageId, Name: 'Unknown', Schema: '', Elements: {} };
		}

		switch (entry.schema) {
			case 'DesignationCollection':
				return {
					ID: pageId,
					Name: entry.folderName,
					Schema: 'DesignationCollection',
					Elements: {
						DesignationNumber: entry.folderName,
						Organization: 'ASTM International',
						Committee: 'E28 — Mechanical Testing',
						CommitteeCode: 'E28',
						HomeEditor: 'Emilie Whealen',
						HomeEditorEmail: 'ewhealen@astm.org',
						ReportNumber: 'RPT-2025-0042',
						SourceLocale: 'en-US',
						Notes: 'Demo designation collection for tension testing',
						TranslationMaintenance: [
							{ locale: 'pt-BR', language: 'Brazilian Portuguese', vendor: 'SDL', compilations: ['60.02 - ASTM Standards in Building Codes'] },
							{ locale: 'es-CL', language: 'Chilean Spanish', vendor: 'SDL', compilations: ['60.02 - ASTM Standards in Building Codes'] }
						]
					}
				};

			case 'StandardDatedVersion':
				return {
					ID: pageId,
					Name: entry.folderName,
					Schema: 'StandardDatedVersion',
					Elements: {
						StandardTitle: `${entry.folderName}: Standard Test Methods for Tension Testing of Metallic Materials`,
						ActionType: 'Revision',
						ApprovalDate: '6/15/2025',
						PublicationDate: '7/1/2025',
						DesignationCollectionName: 'E0008_E0008M'
					}
				};

			case 'TranslationBatch':
				return {
					ID: pageId,
					Name: entry.folderName,
					Schema: 'TranslationBatch',
					Elements: {
						BatchID: entry.folderName,
						Type: 'New Translation',
						Vendor: 'SDL',
						DueDate: '3/15/2026',
						AssignedTo: 'Julia Chen',
						StandardCount: '12',
						DaysElapsed: '45',
						ProductionReadiness: 'Not Ready',
						Status: 'In Progress'
					}
				};

			default:
				return {
					ID: pageId,
					Name: entry.folderName,
					Schema: entry.schemaName,
					Elements: {}
				};
		}
	}
}
