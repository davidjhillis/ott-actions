import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { FolderSchema, DesignationCollectionMetadata, StandardDatedVersionMetadata, TranslationBatchMetadata } from '../../models/translation.model';

@Component({
	selector: 'ott-folder-metadata-card',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="metadata-card">
			<div class="card-header">
				<ott-icon name="folder" [size]="16" color="var(--ott-primary)"></ott-icon>
				<span class="schema-label">{{ schemaLabel }}</span>
			</div>

			<!-- Designation Collection -->
			<ng-container *ngIf="schema === 'DesignationCollection' && designationMeta">
				<div class="meta-grid">
					<div class="meta-item">
						<span class="meta-label">Base Designation</span>
						<span class="meta-value font-mono">{{ designationMeta.baseDesignation }}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Organization</span>
						<span class="meta-value">{{ designationMeta.organization }}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Committee</span>
						<span class="meta-value">{{ designationMeta.committee }}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Home Editor</span>
						<span class="meta-value">{{ designationMeta.homeEditor }}</span>
					</div>
					<div class="meta-item" *ngIf="designationMeta.reportNumber">
						<span class="meta-label">Report #</span>
						<span class="meta-value font-mono">
							{{ designationMeta.reportNumber }}
							<button class="edit-inline-btn" (click)="editReportNumber.emit()" title="Edit">
								<ott-icon name="pencil" [size]="12"></ott-icon>
							</button>
						</span>
					</div>
				</div>

				<!-- Translation Maintenance table -->
				<div class="tm-section" *ngIf="designationMeta.translationMaintenance.length > 0">
					<div class="tm-header">Translation Maintenance</div>
					<table class="tm-table">
						<thead>
							<tr>
								<th>Language</th>
								<th>Vendor</th>
								<th>Compilations</th>
							</tr>
						</thead>
						<tbody>
							<tr *ngFor="let tm of designationMeta.translationMaintenance">
								<td>{{ tm.language }}</td>
								<td>
									<span class="vendor-badge">{{ tm.vendor }}</span>
								</td>
								<td class="compilations">{{ tm.compilations.join(', ') }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</ng-container>

			<!-- Standard Dated Version -->
			<ng-container *ngIf="schema === 'StandardDatedVersion' && datedVersionMeta">
				<div class="meta-grid">
					<div class="meta-item span-2">
						<span class="meta-label">Standard Title</span>
						<span class="meta-value">{{ datedVersionMeta.standardTitle }}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Action Type</span>
						<span class="meta-value">{{ datedVersionMeta.actionType }}</span>
					</div>
					<div class="meta-item" *ngIf="datedVersionMeta.approvalDate">
						<span class="meta-label">Approval Date</span>
						<span class="meta-value">{{ datedVersionMeta.approvalDate }}</span>
					</div>
					<div class="meta-item" *ngIf="datedVersionMeta.publicationDate">
						<span class="meta-label">Publication Date</span>
						<span class="meta-value">{{ datedVersionMeta.publicationDate }}</span>
					</div>
					<div class="meta-item" *ngIf="datedVersionMeta.designationCollectionName">
						<span class="meta-label">Designation Collection</span>
						<span class="meta-value link" (click)="navigateToCollection.emit(datedVersionMeta.designationCollectionId)">
							{{ datedVersionMeta.designationCollectionName }}
						</span>
					</div>
				</div>
			</ng-container>

			<!-- Translation Batch -->
			<ng-container *ngIf="schema === 'TranslationBatch' && batchMeta">
				<div class="meta-grid">
					<div class="meta-item">
						<span class="meta-label">Batch ID</span>
						<span class="meta-value font-mono">{{ batchMeta.batchId }}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Production Readiness</span>
						<span class="meta-value">
							<span class="readiness-badge" [ngClass]="'readiness-' + batchMeta.productionReadiness.toLowerCase().replace(' ', '-')">
								{{ batchMeta.productionReadiness }}
							</span>
						</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Vendor</span>
						<span class="meta-value"><span class="vendor-badge">{{ batchMeta.vendor }}</span></span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Type</span>
						<span class="meta-value">{{ batchMeta.type }}</span>
					</div>
					<div class="meta-item" *ngIf="batchMeta.dueDate">
						<span class="meta-label">Due Date</span>
						<span class="meta-value">{{ batchMeta.dueDate }}</span>
					</div>
					<div class="meta-item" *ngIf="batchMeta.assignedTo">
						<span class="meta-label">Assigned To</span>
						<span class="meta-value">{{ batchMeta.assignedTo }}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Standards</span>
						<span class="meta-value">{{ batchMeta.standardCount }}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Days Elapsed</span>
						<span class="meta-value">{{ batchMeta.daysElapsed }}</span>
					</div>
				</div>
			</ng-container>

			<!-- Default folder -->
			<ng-container *ngIf="schema === 'default' || schema === 'StandardCollection'">
				<div class="meta-grid">
					<div class="meta-item">
						<span class="meta-label">Name</span>
						<span class="meta-value">{{ folderName }}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">ID</span>
						<span class="meta-value font-mono">{{ folderId }}</span>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	styles: [`
		:host { display: block; }
		.metadata-card {
			background: var(--ott-bg-muted);
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-lg);
			padding: 14px 16px;
			font-family: var(--ott-font);
		}
		.card-header {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 12px;
		}
		.schema-label {
			font-size: 13px;
			font-weight: 600;
			color: var(--ott-text);
		}
		.meta-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 8px 24px;
		}
		.meta-item {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.meta-item.span-2 { grid-column: span 2; }
		.meta-label {
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.4px;
			color: var(--ott-text-muted);
		}
		.meta-value {
			font-size: 13px;
			color: var(--ott-text);
			display: flex;
			align-items: center;
			gap: 6px;
		}
		.meta-value.font-mono, .font-mono { font-family: var(--ott-font-mono); }
		.meta-value.link {
			color: var(--ott-primary);
			cursor: pointer;
		}
		.meta-value.link:hover { text-decoration: underline; }
		.edit-inline-btn {
			border: none;
			background: none;
			cursor: pointer;
			color: var(--ott-text-muted);
			padding: 2px;
			border-radius: var(--ott-radius-sm);
			transition: color 0.15s, background 0.15s;
			display: inline-flex;
		}
		.edit-inline-btn:hover {
			color: var(--ott-primary);
			background: var(--ott-bg-hover);
		}

		/* Translation Maintenance */
		.tm-section {
			margin-top: 12px;
			border-top: 1px solid var(--ott-border-light);
			padding-top: 10px;
		}
		.tm-header {
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.4px;
			color: var(--ott-text-muted);
			margin-bottom: 6px;
		}
		.tm-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 12px;
		}
		.tm-table th {
			text-align: left;
			padding: 4px 8px;
			font-weight: 600;
			color: var(--ott-text-secondary);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.tm-table td {
			padding: 5px 8px;
			color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.tm-table tr:last-child td { border-bottom: none; }
		.compilations {
			font-size: 11px;
			color: var(--ott-text-secondary);
			max-width: 300px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		/* Badges */
		.vendor-badge {
			display: inline-flex;
			padding: 1px 6px;
			border-radius: var(--ott-radius-sm);
			font-size: 10px;
			font-weight: 600;
			letter-spacing: 0.3px;
			background: var(--ott-primary-light);
			color: var(--ott-primary);
		}
		.readiness-badge {
			display: inline-flex;
			padding: 2px 8px;
			border-radius: var(--ott-radius-full);
			font-size: 11px;
			font-weight: 600;
		}
		.readiness-ready { background: var(--ott-success-light); color: #166534; }
		.readiness-not-ready { background: #fef2f2; color: #991b1b; }
		.readiness-partial { background: var(--ott-warning-light); color: #92400e; }
	`]
})
export class FolderMetadataCardComponent {
	@Input() schema: FolderSchema = 'default';
	@Input() metadata: any = null;
	@Input() folderName = '';
	@Input() folderId = '';
	@Output() editReportNumber = new EventEmitter<void>();
	@Output() navigateToCollection = new EventEmitter<string>();

	get schemaLabel(): string {
		switch (this.schema) {
			case 'DesignationCollection': return 'Designation Collection';
			case 'StandardDatedVersion': return 'Standard Dated Version';
			case 'TranslationBatch': return 'Translation Batch';
			case 'StandardCollection': return 'Standard Collection';
			default: return 'Folder';
		}
	}

	get designationMeta(): DesignationCollectionMetadata | null {
		return this.schema === 'DesignationCollection' ? this.metadata : null;
	}

	get datedVersionMeta(): StandardDatedVersionMetadata | null {
		return this.schema === 'StandardDatedVersion' ? this.metadata : null;
	}

	get batchMeta(): TranslationBatchMetadata | null {
		return this.schema === 'TranslationBatch' ? this.metadata : null;
	}
}
