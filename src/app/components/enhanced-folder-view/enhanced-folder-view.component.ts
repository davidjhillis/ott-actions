import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../ComponentBase';
import { AssetContext } from '../../models/asset-context.model';
import { FolderViewService, FolderViewData, BreadcrumbSegment } from '../../services/folder-view.service';
import { ActionExecutorService } from '../../services/action-executor.service';
import { FolderSchema, FolderTab, FolderChildItem } from '../../models/translation.model';
import { NotificationService } from '../../services/notification.service';
import { FolderBreadcrumbComponent } from './folder-breadcrumb.component';
import { FolderMetadataCardComponent } from './folder-metadata-card.component';
import { FolderContentsTabComponent } from './folder-contents-tab.component';
import { ReportNumberInlineComponent } from './report-number-inline.component';
import { TranslationTabComponent } from './translation-tab.component';
import { HealthcheckTabComponent } from './healthcheck-tab.component';
import { KanbanTabComponent } from './kanban-tab.component';
import { LucideIconComponent } from '../shared/lucide-icon.component';

@Component({
	selector: 'ott-enhanced-folder-view',
	standalone: true,
	imports: [
		CommonModule,
		LucideIconComponent,
		FolderBreadcrumbComponent,
		FolderMetadataCardComponent,
		FolderContentsTabComponent,
		ReportNumberInlineComponent,
		TranslationTabComponent,
		HealthcheckTabComponent,
		KanbanTabComponent
	],
	template: `
		<div class="efv" *ngIf="viewData">
			<!-- Breadcrumbs -->
			<ott-folder-breadcrumb
				[breadcrumbs]="viewData.breadcrumbs"
				(navigate)="onBreadcrumbNav($event)">
			</ott-folder-breadcrumb>

			<!-- Header row: title + ID -->
			<div class="efv-header">
				<h2 class="efv-title">{{ context?.name || 'Folder' }}</h2>
				<span class="efv-id">{{ context?.id }}</span>
			</div>

			<!-- Metadata Card (collapsed by default) -->
			<ott-folder-metadata-card
				[schema]="viewData.schema"
				[metadata]="viewData.metadata"
				[folderName]="context?.name || ''"
				[folderId]="context?.id || ''"
				[pageFields]="viewData.pageFields"
				(editReportNumber)="showReportNumberEdit = true"
				(navigateToCollection)="onNavigateToCollection($event)">
			</ott-folder-metadata-card>

			<!-- Inline Report Number Editor -->
			<div class="report-edit-area" *ngIf="showReportNumberEdit">
				<ott-report-number-inline
					[currentNumber]="getReportNumber()"
					(saved)="onReportNumberSaved($event)">
				</ott-report-number-inline>
			</div>

			<!-- Tab Bar -->
			<nav class="efv-tabs">
				<button
					*ngFor="let tab of viewData.tabs"
					class="efv-tab"
					[class.active]="activeTab === tab.id"
					(click)="activeTab = tab.id">
					{{ tab.label }}
					<span class="tab-badge" *ngIf="getTabCount(tab.id) as count">{{ count }}</span>
				</button>
			</nav>

			<!-- Tab Content -->
			<div class="efv-tab-content">
				<ott-folder-contents-tab
					*ngIf="activeTab === 'contents'"
					[items]="viewData.children"
					(itemOpen)="onItemOpen($event)"
					(selectionChange)="onSelectionChange($event)">
				</ott-folder-contents-tab>

				<ott-translation-tab
					*ngIf="activeTab === 'translation'"
					[translatedCollections]="viewData.translatedCollections"
					[tmProjects]="viewData.tmProjects"
					[selectedItems]="selectedItems"
					(addToProject)="onAddToProject($event)"
					(uploadSourceFiles)="onUploadSourceFiles()"
					(addCollection)="onAddCollection()">
				</ott-translation-tab>

				<ott-kanban-tab
					*ngIf="activeTab === 'kanban'"
					[collections]="viewData.translatedCollections"
					(statusChange)="onStatusChange($event)">
				</ott-kanban-tab>

				<ott-healthcheck-tab
					*ngIf="activeTab === 'healthcheck'"
					[healthcheck]="viewData.healthcheck"
					[batchName]="getBatchName()">
				</ott-healthcheck-tab>

				<div *ngIf="activeTab === 'properties'" class="placeholder-tab">
					<ott-icon name="settings" [size]="20" color="var(--ott-text-muted)"></ott-icon>
					<p>Native CMS Properties panel</p>
				</div>

				<div *ngIf="activeTab === 'report-number'" class="inline-edit-tab">
					<ott-report-number-inline
						[currentNumber]="getReportNumber()"
						(saved)="onReportNumberSaved($event)">
					</ott-report-number-inline>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		.efv {
			padding: 12px 20px 20px;
			max-width: 100%;
		}

		/* Header */
		.efv-header {
			display: flex;
			align-items: baseline;
			gap: 8px;
			margin: 2px 0 10px;
		}
		.efv-title {
			margin: 0;
			font-size: var(--ott-font-size-xl);
			font-weight: 700;
			color: var(--ott-text);
			letter-spacing: -0.01em;
		}
		.efv-id {
			font-size: var(--ott-font-size-xs);
			color: var(--ott-text-muted);
			font-family: var(--ott-font-mono);
		}

		/* Report edit area */
		.report-edit-area {
			margin-top: 8px;
			padding: 10px 14px;
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			background: var(--ott-bg);
		}

		/* Tab bar */
		.efv-tabs {
			display: flex;
			gap: 0;
			margin-top: 16px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.efv-tab {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			padding: 10px 14px;
			border: none;
			background: none;
			cursor: pointer;
			font-size: var(--ott-font-size-md);
			font-family: var(--ott-font);
			font-weight: 500;
			color: var(--ott-text-muted);
			border-bottom: 2px solid transparent;
			margin-bottom: -1px;
			transition: color 0.15s, border-color 0.15s;
			white-space: nowrap;
		}
		.efv-tab:hover { color: var(--ott-text-secondary); }
		.efv-tab.active {
			color: var(--ott-text);
			border-bottom-color: var(--ott-primary);
		}
		.tab-badge {
			font-size: var(--ott-font-size-xs);
			font-weight: 600;
			min-width: 20px;
			height: 20px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: var(--ott-bg-subtle);
			color: var(--ott-text-muted);
			border-radius: var(--ott-radius-full);
			padding: 0 5px;
		}
		.efv-tab.active .tab-badge {
			background: var(--ott-primary-light);
			color: var(--ott-primary);
		}

		/* Tab content */
		.efv-tab-content { padding-top: 14px; }

		/* Placeholders */
		.placeholder-tab {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 6px;
			padding: 40px 0;
			color: var(--ott-text-muted);
			font-size: var(--ott-font-size-base);
		}
		.placeholder-tab p { margin: 0; }
		.inline-edit-tab { max-width: 400px; padding: 12px 0; }
	`]
})
export class EnhancedFolderViewComponent extends ComponentBase implements OnInit, OnDestroy {
	@Input() context?: AssetContext;

	viewData: FolderViewData | null = null;
	activeTab = 'contents';
	showReportNumberEdit = false;
	selectedItems: FolderChildItem[] = [];

	constructor(
		private folderViewService: FolderViewService,
		private actionExecutor: ActionExecutorService,
		private notify: NotificationService
	) {
		super();
	}

	ngOnInit(): void {
		this.observableSubTeardowns.push(
			this.folderViewService.viewData$.subscribe(data => {
				this.viewData = data;
				if (data && data.tabs.length > 0) {
					this.activeTab = data.tabs[0].id;
				}
			})
		);

		if (this.context) {
			this.folderViewService.loadFolderView(this.context);
		}
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	getTabCount(tabId: string): number | null {
		if (!this.viewData) return null;
		switch (tabId) {
			case 'contents': return this.viewData.children.length || null;
			case 'translation': return this.viewData.translatedCollections.length || null;
			case 'kanban': return this.viewData.translatedCollections.length || null;
			default: return null;
		}
	}

	onBreadcrumbNav(segment: BreadcrumbSegment): void {
		console.log(`[IGX-OTT] Navigate to: ${segment.name} (${segment.id})`);
		// Reload folder view with the breadcrumb segment as new context
		if (this.context && segment.id !== this.context.id) {
			const newContext: AssetContext = {
				id: segment.id,
				name: segment.name,
				isFolder: true,
				path: segment.path,
				schema: this.context.schema
			};
			this.context = newContext;
			this.folderViewService.loadFolderView(newContext);
		}
	}

	onNavigateToCollection(id: string | undefined): void {
		if (id) {
			console.log(`[IGX-OTT] Navigate to collection: ${id}`);
			const newContext: AssetContext = {
				id,
				name: id,
				isFolder: true,
				path: ''
			};
			this.context = newContext;
			this.folderViewService.loadFolderView(newContext);
		}
	}

	onItemOpen(item: FolderChildItem): void {
		console.log(`[IGX-OTT] Open item: ${item.name} (${item.id})`);
		if (item.isFolder) {
			// Navigate into sub-folder
			const newContext: AssetContext = {
				id: item.id,
				name: item.name,
				isFolder: true,
				path: '',
				schema: item.schema
			};
			this.context = newContext;
			this.folderViewService.loadFolderView(newContext);
		}
	}

	onSelectionChange(items: FolderChildItem[]): void {
		this.selectedItems = items;
	}

	onStatusChange(event: { itemId: string; newStatus: string }): void {
		this.folderViewService.updateLifecycleStatus(event.itemId, event.newStatus as any).subscribe(ok => {
			if (ok) this.notify.success(`Status updated`);
		});
	}

	onReportNumberSaved(event: { reportNumber: string; effectiveDate: string }): void {
		const pageId = this.context?.id || '';
		this.folderViewService.saveReportNumber(pageId, event.reportNumber, event.effectiveDate).subscribe(ok => {
			if (ok) {
				this.notify.success(`Report number set to ${event.reportNumber}`);
				this.showReportNumberEdit = false;
			}
		});
	}

	onAddToProject(event: { projectId: string | null; items: FolderChildItem[]; isNew: boolean }): void {
		console.log(`[IGX-OTT] Add to project:`, event);
		this.notify.success(`Added ${event.items.length} items to ${event.isNew ? 'new' : 'existing'} project`);
	}

	onUploadSourceFiles(): void {
		console.log('[IGX-OTT] Upload source files');
		// Trigger the upload modal via ActionExecutorService
		this.actionExecutor.execute({
			id: 'upload-source-files',
			label: 'Upload Source Files',
			icon: 'upload',
			handler: { type: 'modal', componentId: 'upload-source-files' },
			enabled: true,
			groupId: 'translation',
			order: 0
		});
	}

	onAddCollection(): void {
		console.log('[IGX-OTT] Add collection');
		// Trigger the create collection modal via ActionExecutorService
		this.actionExecutor.execute({
			id: 'create-collection',
			label: 'Create Collection',
			icon: 'folder-plus',
			handler: { type: 'modal', componentId: 'create-collection' },
			enabled: true,
			groupId: 'translation',
			order: 0
		});
	}

	getReportNumber(): string {
		if (this.viewData?.metadata && 'reportNumber' in this.viewData.metadata) {
			return (this.viewData.metadata as any).reportNumber || '';
		}
		return '';
	}

	getBatchName(): string {
		if (this.viewData?.metadata && 'batchId' in this.viewData.metadata) {
			return (this.viewData.metadata as any).batchId || '';
		}
		return 'RWS 2025 New Translations';
	}
}
