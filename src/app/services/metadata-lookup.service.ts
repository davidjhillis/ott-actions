import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
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

/** Known parent page name in the site tree */
const METADATA_PARENT_NAME = 'OTT Metadata';

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
		if (this.loaded || this.loading) {
			return of(undefined);
		}

		if (this.cms.isDevMode) {
			this.loadDemoData();
			return of(undefined);
		}

		this.loading = true;

		// Strategy: use REST API first, fall back to postMessage
		return new Observable<void>(subscriber => {
			this.cmsApi.checkAvailability().subscribe(available => {
				if (available) {
					this.loadIndexViaRestApi(subscriber);
				} else {
					this.loadIndexViaPostMessage(subscriber);
				}
			});
		});
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
	 * Uses PageCommandsServices.SavePartial via the postMessage bridge.
	 */
	saveElements(pageId: string, elements: ElementUpdate[]): Observable<void> {
		if (this.cms.isDevMode) {
			console.log(`[IGX-OTT] Dev: SavePartial ${pageId}`, elements);
			return of(undefined);
		}

		// Build the elements object for SavePartial
		const elementObj: Record<string, any> = {};
		for (const el of elements) {
			elementObj[el.name] = el.value;
		}

		return this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'SavePartial',
			args: [pageId, elementObj]
		}).pipe(
			map(() => undefined),
			tap(() => console.log(`[IGX-OTT] Metadata saved for ${pageId}`)),
			catchError(err => {
				console.error(`[IGX-OTT] Failed to save metadata for ${pageId}:`, err);
				// Fall back to full Save if SavePartial not available
				return this.cms.callService<any>({
					service: 'PageCommandsServices',
					action: 'Save',
					args: [pageId, elementObj]
				}).pipe(map(() => undefined));
			})
		);
	}

	/**
	 * Force-refresh the metadata index.
	 */
	refresh(): Observable<void> {
		this.loaded = false;
		this.loading = false;
		this.metadataMap.clear();
		return this.loadMetadataIndex();
	}

	// -- Private helpers --

	/**
	 * Load metadata index via REST API.
	 * Finds the "OTT Metadata" parent, then fetches its children.
	 */
	private loadIndexViaRestApi(subscriber: any): void {
		// Step 1: Find the "OTT Metadata" parent page
		// We search by getting child pages from the site root (x1)
		this.cmsApi.getChildPagesSimple('x1').pipe(
			catchError(() => of([]))
		).subscribe(children => {
			const parent = children.find((c: any) => c.Name === METADATA_PARENT_NAME);
			if (!parent) {
				console.warn(`[IGX-OTT] "${METADATA_PARENT_NAME}" page not found in site tree`);
				this.loaded = true;
				this.loading = false;
				subscriber.next(undefined);
				subscriber.complete();
				return;
			}

			this.parentPageId = parent.ID;
			console.log(`[IGX-OTT] Found "${METADATA_PARENT_NAME}" parent: ${parent.ID}`);

			// Step 2: Get children of the metadata parent
			this.cmsApi.getChildPagesSimple(parent.ID).pipe(
				catchError(() => of([]))
			).subscribe(metaPages => {
				this.indexChildPages(metaPages);
				subscriber.next(undefined);
				subscriber.complete();
			});
		});
	}

	/**
	 * Load metadata index via postMessage bridge.
	 */
	private loadIndexViaPostMessage(subscriber: any): void {
		// Try to find "OTT Metadata" page via GetChildPagesSimple on root
		this.cms.callService<any[]>({
			service: 'SiteTreeServices',
			action: 'GetChildPagesSimple',
			args: ['x1', 1]
		}).pipe(
			catchError(() => of([]))
		).subscribe(children => {
			const parent = (children || []).find((c: any) => c.Name === METADATA_PARENT_NAME);
			if (!parent) {
				console.warn(`[IGX-OTT] "${METADATA_PARENT_NAME}" page not found via postMessage`);
				this.loaded = true;
				this.loading = false;
				subscriber.next(undefined);
				subscriber.complete();
				return;
			}

			this.parentPageId = parent.ID;

			this.cms.callService<any[]>({
				service: 'SiteTreeServices',
				action: 'GetChildPagesSimple',
				args: [parent.ID, 1]
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
						BaseDesignation: entry.folderName,
						Organization: 'ASTM International',
						Committee: 'E28 — Mechanical Testing',
						CommitteeCode: 'E28',
						HomeEditor: 'Emilie Whealen',
						HomeEditorEmail: 'ewhealen@astm.org',
						ReportNumber: 'RPT-2025-0042',
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
