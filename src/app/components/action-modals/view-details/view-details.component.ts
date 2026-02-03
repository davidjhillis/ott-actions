import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';

@Component({
	selector: 'app-view-details',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div class="details-panel">
			<div class="panel-header">
				<h3>Details</h3>
				<button class="close-btn" (click)="onClose()">
					<span class="fa-light fa-xmark"></span>
				</button>
			</div>
			<div class="panel-body">
				<div class="detail-section">
					<h4>Asset Information</h4>
					<div class="detail-row">
						<span class="detail-label">Name:</span>
						<span class="detail-value">{{ context?.name || 'N/A' }}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">ID:</span>
						<span class="detail-value">{{ context?.id || 'N/A' }}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Type:</span>
						<span class="detail-value">{{ context?.isFolder ? 'Folder (Index)' : (context?.schema || 'Asset') }}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Path:</span>
						<span class="detail-value path-value">{{ context?.path || 'N/A' }}</span>
					</div>
					<div class="detail-row" *ngIf="context?.workflowStatus">
						<span class="detail-label">Status:</span>
						<span class="detail-value status-badge" [ngClass]="'status-' + (context.workflowStatus || '').toLowerCase()">
							{{ context!.workflowStatus }}
						</span>
					</div>
				</div>

				<div class="detail-section" *ngIf="context?.isFolder && context?.selectedItems?.length">
					<h4>Contents ({{ context!.selectedItems!.length }} items)</h4>
					<div class="item-list">
						<div class="item-row" *ngFor="let item of context!.selectedItems">
							<span class="item-icon fa-light" [ngClass]="item.isFolder ? 'fa-folder' : 'fa-file'"></span>
							<span class="item-name">{{ item.name }}</span>
							<span class="item-type">{{ item.schema || '' }}</span>
						</div>
					</div>
				</div>

				<div class="detail-section">
					<h4>Quick Stats</h4>
					<div class="stats-grid">
						<div class="stat-item">
							<span class="stat-value">{{ context?.selectedItems?.length || 0 }}</span>
							<span class="stat-label">Items</span>
						</div>
						<div class="stat-item">
							<span class="stat-value">--</span>
							<span class="stat-label">Versions</span>
						</div>
						<div class="stat-item">
							<span class="stat-value">--</span>
							<span class="stat-label">Linked</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; height: 100%; }
		.details-panel {
			height: 100%;
			background: #fff;
			border-left: 1px solid #ddd;
			display: flex;
			flex-direction: column;
			width: 300px;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		.panel-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 16px;
			border-bottom: 1px solid #eee;
		}
		.panel-header h3 {
			margin: 0;
			font-size: 14px;
			font-weight: 600;
		}
		.close-btn {
			border: none;
			background: none;
			cursor: pointer;
			color: #888;
			font-size: 16px;
		}
		.close-btn:hover { color: #333; }
		.panel-body {
			flex: 1;
			overflow-y: auto;
			padding: 12px 16px;
		}
		.detail-section {
			margin-bottom: 20px;
		}
		.detail-section h4 {
			margin: 0 0 8px;
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			color: #888;
			letter-spacing: 0.5px;
		}
		.detail-row {
			display: flex;
			padding: 4px 0;
			font-size: 13px;
		}
		.detail-label {
			width: 60px;
			color: #888;
			flex-shrink: 0;
		}
		.detail-value {
			color: #333;
			word-break: break-word;
		}
		.path-value {
			font-family: monospace;
			font-size: 12px;
		}
		.status-badge {
			padding: 2px 8px;
			border-radius: 10px;
			font-size: 11px;
			font-weight: 600;
		}
		.status-draft { background: #fff3cd; color: #856404; }
		.status-review { background: #cce5ff; color: #004085; }
		.status-approved { background: #d4edda; color: #155724; }
		.status-published { background: #d1ecf1; color: #0c5460; }
		.item-list {
			max-height: 150px;
			overflow-y: auto;
		}
		.item-row {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 4px 0;
			font-size: 13px;
		}
		.item-icon { color: #53ace3; width: 16px; text-align: center; }
		.item-name { flex: 1; }
		.item-type { color: #999; font-size: 12px; }
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 8px;
		}
		.stat-item {
			text-align: center;
			padding: 8px;
			background: #f8f9fa;
			border-radius: 4px;
		}
		.stat-value {
			display: block;
			font-size: 18px;
			font-weight: 600;
			color: #333;
		}
		.stat-label {
			font-size: 11px;
			color: #888;
		}
	`]
})
export class ViewDetailsComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();

	// Demo context (would come from CMS in production)
	context: AssetContext = {
		id: 'x312',
		name: 'ISO-9001-2025 Draft',
		isFolder: true,
		path: '/Standards/Quality/ISO-9001-2025',
		schema: 'StandardsCollection',
		workflowStatus: 'Review',
		selectedItems: [
			{ id: 'x313', name: 'Draft-v3.2.docx', isFolder: false, schema: 'Document' },
			{ id: 'x314', name: 'Appendix-A.pdf', isFolder: false, schema: 'Document' },
			{ id: 'x315', name: 'Review-Comments', isFolder: true, schema: 'Folder' },
			{ id: 'x316', name: 'Supporting-Data.xlsx', isFolder: false, schema: 'Spreadsheet' },
			{ id: 'x317', name: 'Cover-Letter.docx', isFolder: false, schema: 'Document' },
		]
	};

	constructor(ele: ElementRef) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] View Details panel opened');
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	onClose(): void {
		this.close.emit();
	}
}
