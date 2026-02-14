import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CMSCommunicationsService } from './cms-communications.service';
import { AssetContext } from '../models/asset-context.model';
import {
	FolderSchema, FolderTab, FolderChildItem,
	DesignationCollectionMetadata, StandardDatedVersionMetadata,
	TranslationBatchMetadata, TranslatedStandardCollection,
	TMProject, HealthcheckStatusEntry, LifecycleStatus,
	LIFECYCLE_STATUSES, SCHEMA_TABS
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
}

@Injectable({
	providedIn: 'root'
})
export class FolderViewService {
	private viewDataSubject = new BehaviorSubject<FolderViewData | null>(null);
	public viewData$ = this.viewDataSubject.asObservable();

	constructor(private cms: CMSCommunicationsService) {}

	/**
	 * Resolve folder view data from asset context
	 */
	loadFolderView(ctx: AssetContext): void {
		if (this.cms.isDevMode) {
			this.viewDataSubject.next(this.getDemoData(ctx));
			return;
		}

		// Production: fetch from CMS
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
	 * Build breadcrumbs from a path string
	 */
	buildBreadcrumbs(path: string, currentId: string, currentName: string): BreadcrumbSegment[] {
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
			// Update in-memory demo data
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

	// -- Private helpers --

	private mapCmsToViewData(ctx: AssetContext, props: any): FolderViewData {
		const schema = this.resolveSchema(props?.Schema || ctx.schema);
		return {
			schema,
			tabs: this.getTabsForSchema(schema),
			breadcrumbs: this.buildBreadcrumbs(ctx.path, ctx.id, ctx.name),
			children: [],
			metadata: null,
			translatedCollections: [],
			tmProjects: [],
			healthcheck: []
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

	/**
	 * Demo data for standalone dev preview
	 */
	private getDemoData(ctx: AssetContext): FolderViewData {
		const schema = this.resolveSchema(ctx.schema);

		const demoCollections = this.getDemoTranslatedCollections();
		const healthcheck = this.buildHealthcheck(demoCollections);

		const breadcrumbs: BreadcrumbSegment[] = [
			{ id: 'home', name: 'Home', path: '/' },
			{ id: 'af/1', name: 'Standards Documents', path: '/Standards Documents' },
			{ id: 'af/5', name: 'E0008_E0008M', path: '/Standards Documents/E0008_E0008M' },
			{ id: 'af/7', name: 'E0008_E0008M-25', path: '/Standards Documents/E0008_E0008M/E0008_E0008M-25' }
		];

		const children: FolderChildItem[] = [
			{ id: 'af/12', name: 'E0008_E0008M-16AE01: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Std Coll', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/13', name: 'E0008_E0008M-21: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Std Coll', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/14', name: 'E0008_E0008M-22: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Std Coll', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/15', name: 'E0008_E0008M-24: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Std Coll', isFolder: true, modified: '11/21/2025' },
			{ id: 'af/16', name: 'E0008_E0008M-25: Standard Test Methods for Tension Testing of Metallic Materials', type: 'Std Coll', isFolder: true, modified: '11/21/2025' }
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

		return {
			schema: schema === 'default' ? 'DesignationCollection' : schema,
			tabs: this.getTabsForSchema(schema === 'default' ? 'DesignationCollection' : schema),
			breadcrumbs,
			children,
			metadata,
			translatedCollections: demoCollections,
			tmProjects,
			healthcheck
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
