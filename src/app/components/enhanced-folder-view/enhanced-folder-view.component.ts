import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../ComponentBase';
import { AssetContext } from '../../models/asset-context.model';
import { FolderViewService, FolderViewData, BreadcrumbSegment } from '../../services/folder-view.service';
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
			<!-- Header: title + ID -->
			<div class="efv-header">
				<span class="efv-title">{{ context?.name || 'Folder' }}</span>
				<span class="efv-id">({{ context?.id }})</span>
			</div>

			<!-- Breadcrumbs -->
			<ott-folder-breadcrumb
				[breadcrumbs]="viewData.breadcrumbs"
				(navigate)="onBreadcrumbNav($event)">
			</ott-folder-breadcrumb>

			<!-- Metadata Card -->
			<ott-folder-metadata-card
				[schema]="viewData.schema"
				[metadata]="viewData.metadata"
				[folderName]="context?.name || ''"
				[folderId]="context?.id || ''"
				(editReportNumber)="showReportNumberEdit = true"
				(navigateToCollection)="onNavigateToCollection($event)">
			</ott-folder-metadata-card>

			<!-- Inline Report Number Editor -->
			<ott-report-number-inline
				*ngIf="showReportNumberEdit"
				[currentNumber]="getReportNumber()"
				(saved)="onReportNumberSaved($event)">
			</ott-report-number-inline>

			<!-- Tab Bar -->
			<div class="efv-tabs">
				<button
					*ngFor="let tab of viewData.tabs"
					class="efv-tab"
					[class.active]="activeTab === tab.id"
					(click)="activeTab = tab.id">
					<ott-icon [name]="tab.icon" [size]="14"></ott-icon>
					{{ tab.label }}
				</button>
			</div>

			<!-- Tab Content -->
			<div class="efv-tab-content">
				<!-- Contents Tab -->
				<ott-folder-contents-tab
					*ngIf="activeTab === 'contents'"
					[items]="viewData.children"
					(itemOpen)="onItemOpen($event)"
					(selectionChange)="onSelectionChange($event)">
				</ott-folder-contents-tab>

				<!-- Translation Tab -->
				<ott-translation-tab
					*ngIf="activeTab === 'translation'"
					[translatedCollections]="viewData.translatedCollections"
					[tmProjects]="viewData.tmProjects"
					[selectedItems]="selectedItems">
				</ott-translation-tab>

				<!-- Kanban Tab -->
				<ott-kanban-tab
					*ngIf="activeTab === 'kanban'"
					[collections]="viewData.translatedCollections"
					(statusChange)="onStatusChange($event)">
				</ott-kanban-tab>

				<!-- Healthcheck Tab -->
				<ott-healthcheck-tab
					*ngIf="activeTab === 'healthcheck'"
					[healthcheck]="viewData.healthcheck"
					[batchName]="getBatchName()">
				</ott-healthcheck-tab>

				<!-- Properties Tab (placeholder) -->
				<div *ngIf="activeTab === 'properties'" class="properties-placeholder">
					<div class="placeholder-content">
						<ott-icon name="settings" [size]="24" color="var(--ott-text-muted)"></ott-icon>
						<p>Native CMS Properties panel renders here.</p>
						<p class="placeholder-sub">In production, this embeds the existing Properties tab from the CMS.</p>
					</div>
				</div>

				<!-- Report Number Tab -->
				<div *ngIf="activeTab === 'report-number'" class="report-number-tab">
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
			padding: 16px 20px;
			max-width: 100%;
		}

		/* Header */
		.efv-header {
			display: flex;
			align-items: baseline;
			gap: 8px;
			margin-bottom: 4px;
		}
		.efv-title {
			font-size: 16px;
			font-weight: 700;
			color: var(--ott-text);
		}
		.efv-id {
			font-size: 12px;
			color: var(--ott-text-muted);
			font-family: var(--ott-font-mono);
		}

		/* Tabs */
		.efv-tabs {
			display: flex;
			gap: 0;
			border-bottom: 2px solid var(--ott-border-light);
			margin-top: 16px;
		}
		.efv-tab {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 9px 16px;
			border: none;
			background: none;
			cursor: pointer;
			font-size: 13px;
			font-family: var(--ott-font);
			font-weight: 500;
			color: var(--ott-text-secondary);
			border-bottom: 2px solid transparent;
			margin-bottom: -2px;
			transition: color 0.15s, border-color 0.15s;
			white-space: nowrap;
		}
		.efv-tab:hover {
			color: var(--ott-text);
		}
		.efv-tab.active {
			color: var(--ott-primary);
			border-bottom-color: var(--ott-primary);
			font-weight: 600;
		}

		/* Tab content */
		.efv-tab-content {
			padding-top: 12px;
		}

		/* Properties placeholder */
		.properties-placeholder {
			display: flex;
			justify-content: center;
			padding: 40px 0;
		}
		.placeholder-content {
			text-align: center;
			color: var(--ott-text-muted);
		}
		.placeholder-content p {
			margin: 8px 0 0;
			font-size: 13px;
		}
		.placeholder-sub { font-size: 12px; }

		/* Report number tab */
		.report-number-tab {
			padding: 16px 0;
			max-width: 400px;
		}
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
		private notify: NotificationService
	) {
		super();
	}

	ngOnInit(): void {
		// Subscribe to view data changes
		this.observableSubTeardowns.push(
			this.folderViewService.viewData$.subscribe(data => {
				this.viewData = data;
				if (data && data.tabs.length > 0) {
					this.activeTab = data.tabs[0].id;
				}
			})
		);

		// Load data
		if (this.context) {
			this.folderViewService.loadFolderView(this.context);
		}
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	onBreadcrumbNav(segment: BreadcrumbSegment): void {
		console.log(`[IGX-OTT] Navigate to: ${segment.name} (${segment.id})`);
		// In production, this would navigate the CMS router
	}

	onNavigateToCollection(id: string | undefined): void {
		if (id) {
			console.log(`[IGX-OTT] Navigate to collection: ${id}`);
		}
	}

	onItemOpen(item: FolderChildItem): void {
		console.log(`[IGX-OTT] Open item: ${item.name} (${item.id})`);
	}

	onSelectionChange(items: FolderChildItem[]): void {
		this.selectedItems = items;
	}

	onStatusChange(event: { itemId: string; newStatus: string }): void {
		this.folderViewService.updateLifecycleStatus(event.itemId, event.newStatus as any).subscribe(ok => {
			if (ok) {
				this.notify.success(`Status updated to ${event.newStatus}`);
			}
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
