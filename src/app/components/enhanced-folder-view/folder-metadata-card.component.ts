import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import {
	FolderSchema, DesignationCollectionMetadata, StandardDatedVersionMetadata,
	TranslationBatchMetadata, CmsPageField
} from '../../models/translation.model';

@Component({
	selector: 'ott-folder-metadata-card',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<div class="metadata-card" [class.expanded]="expanded">
			<!-- Always-visible summary row -->
			<div class="card-summary" (click)="expanded = !expanded">
				<div class="summary-left">
					<span class="schema-badge">{{ schemaLabel }}</span>

					<!-- Designation Collection summary -->
					<ng-container *ngIf="designationMeta">
						<span class="summary-sep">&middot;</span>
						<span class="summary-text">{{ designationMeta.committee }}</span>
						<span class="summary-sep">&middot;</span>
						<span class="summary-text muted">{{ designationMeta.homeEditor }}</span>
						<ng-container *ngIf="designationMeta.translationMaintenance.length > 0">
							<span class="summary-sep">&middot;</span>
							<span class="lang-pills">
								<span class="lang-pill" *ngFor="let tm of designationMeta.translationMaintenance">
									{{ tm.locale }}
								</span>
							</span>
						</ng-container>
					</ng-container>

					<!-- Batch summary -->
					<ng-container *ngIf="batchMeta">
						<span class="summary-sep">&middot;</span>
						<span class="vendor-badge">{{ batchMeta.vendor }}</span>
						<span class="summary-sep">&middot;</span>
						<span class="summary-text">{{ batchMeta.standardCount }} standards</span>
						<span class="summary-sep">&middot;</span>
						<span class="readiness-badge" [ngClass]="'readiness-' + batchMeta.productionReadiness.toLowerCase().replace(' ', '-')">
							{{ batchMeta.productionReadiness }}
						</span>
					</ng-container>

					<!-- Dated Version summary -->
					<ng-container *ngIf="datedVersionMeta">
						<span class="summary-sep">&middot;</span>
						<span class="summary-text">{{ datedVersionMeta.actionType }}</span>
					</ng-container>

					<!-- Dynamic fields summary (when no typed metadata) -->
					<ng-container *ngIf="!designationMeta && !batchMeta && !datedVersionMeta && pageFields.length > 0">
						<span class="summary-sep">&middot;</span>
						<span class="summary-text">{{ pageFields.length }} fields</span>
					</ng-container>
				</div>

				<button class="expand-btn" [class.rotated]="expanded">
					<ott-icon name="chevron-down" [size]="14"></ott-icon>
				</button>
			</div>

			<!-- Expanded detail panel -->
			<div class="card-details" *ngIf="expanded">

				<!-- TYPED METADATA (for known schemas) -->

				<!-- Designation Collection -->
				<ng-container *ngIf="designationMeta">
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">Base Designation</span>
							<span class="detail-value mono">{{ designationMeta.baseDesignation }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Organization</span>
							<span class="detail-value">{{ designationMeta.organization }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Committee</span>
							<span class="detail-value">{{ designationMeta.committee }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Home Editor</span>
							<span class="detail-value">{{ designationMeta.homeEditor }}</span>
						</div>
						<div class="detail-item" *ngIf="designationMeta.reportNumber">
							<span class="detail-label">Report #</span>
							<span class="detail-value mono">
								{{ designationMeta.reportNumber }}
								<button class="edit-inline-btn" (click)="$event.stopPropagation(); editReportNumber.emit()" title="Edit">
									<ott-icon name="pencil" [size]="11"></ott-icon>
								</button>
							</span>
						</div>
					</div>

					<!-- Translation Maintenance (nested disclosure) -->
					<div class="tm-section" *ngIf="designationMeta.translationMaintenance.length > 0">
						<button class="tm-toggle" (click)="$event.stopPropagation(); tmExpanded = !tmExpanded">
							<ott-icon [name]="tmExpanded ? 'chevron-down' : 'chevron-right'" [size]="12"></ott-icon>
							Translation Maintenance
							<span class="tm-count">{{ designationMeta.translationMaintenance.length }}</span>
						</button>
						<table class="tm-table" *ngIf="tmExpanded">
							<thead>
								<tr><th>Language</th><th>Vendor</th><th>Compilations</th></tr>
							</thead>
							<tbody>
								<tr *ngFor="let tm of designationMeta.translationMaintenance">
									<td>{{ tm.language }}</td>
									<td><span class="vendor-badge">{{ tm.vendor }}</span></td>
									<td class="compilations">{{ tm.compilations.join(', ') }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</ng-container>

				<!-- Standard Dated Version -->
				<ng-container *ngIf="datedVersionMeta">
					<div class="detail-grid">
						<div class="detail-item span-2">
							<span class="detail-label">Standard Title</span>
							<span class="detail-value">{{ datedVersionMeta.standardTitle }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Action Type</span>
							<span class="detail-value">{{ datedVersionMeta.actionType }}</span>
						</div>
						<div class="detail-item" *ngIf="datedVersionMeta.approvalDate">
							<span class="detail-label">Approval Date</span>
							<span class="detail-value">{{ datedVersionMeta.approvalDate }}</span>
						</div>
						<div class="detail-item" *ngIf="datedVersionMeta.publicationDate">
							<span class="detail-label">Publication Date</span>
							<span class="detail-value">{{ datedVersionMeta.publicationDate }}</span>
						</div>
						<div class="detail-item" *ngIf="datedVersionMeta.designationCollectionName">
							<span class="detail-label">Designation Collection</span>
							<span class="detail-value link" (click)="$event.stopPropagation(); navigateToCollection.emit(datedVersionMeta.designationCollectionId)">
								{{ datedVersionMeta.designationCollectionName }}
							</span>
						</div>
					</div>
				</ng-container>

				<!-- Translation Batch -->
				<ng-container *ngIf="batchMeta">
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">Batch ID</span>
							<span class="detail-value mono">{{ batchMeta.batchId }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Vendor</span>
							<span class="detail-value"><span class="vendor-badge">{{ batchMeta.vendor }}</span></span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Type</span>
							<span class="detail-value">{{ batchMeta.type }}</span>
						</div>
						<div class="detail-item" *ngIf="batchMeta.dueDate">
							<span class="detail-label">Due Date</span>
							<span class="detail-value">{{ batchMeta.dueDate }}</span>
						</div>
						<div class="detail-item" *ngIf="batchMeta.assignedTo">
							<span class="detail-label">Assigned To</span>
							<span class="detail-value">{{ batchMeta.assignedTo }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Standards</span>
							<span class="detail-value">{{ batchMeta.standardCount }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Days Elapsed</span>
							<span class="detail-value">{{ batchMeta.daysElapsed }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Readiness</span>
							<span class="detail-value">
								<span class="readiness-badge" [ngClass]="'readiness-' + batchMeta.productionReadiness.toLowerCase().replace(' ', '-')">
									{{ batchMeta.productionReadiness }}
								</span>
							</span>
						</div>
					</div>
				</ng-container>

				<!-- DYNAMIC METADATA (from pageFields — for any schema) -->
				<ng-container *ngIf="!designationMeta && !batchMeta && !datedVersionMeta && pageFields.length > 0">
					<div class="detail-grid">
						<ng-container *ngFor="let field of nonTableFields">
							<div class="detail-item" [class.span-2]="isWideField(field)">
								<span class="detail-label">{{ field.label }}</span>

								<!-- Text / date -->
								<span class="detail-value" *ngIf="field.type === 'text' || field.type === 'date'">
									{{ field.value }}
								</span>

								<!-- Link -->
								<span class="detail-value link" *ngIf="field.type === 'link'"
									(click)="$event.stopPropagation()">
									{{ field.value?.Name || field.value?.href || field.value }}
								</span>

								<!-- List (chips) -->
								<span class="detail-value" *ngIf="field.type === 'list'">
									<span class="chip" *ngFor="let item of field.value">{{ item }}</span>
								</span>

								<!-- Dropdown -->
								<span class="detail-value" *ngIf="field.type === 'dropdown'">
									{{ field.value }}
								</span>

								<!-- Rich text (show stripped) -->
								<span class="detail-value" *ngIf="field.type === 'rich-text'"
									[title]="field.value">
									{{ stripHtml(field.value) | slice:0:120 }}
								</span>
							</div>
						</ng-container>
					</div>

					<!-- Tables -->
					<ng-container *ngFor="let field of tableFields">
						<div class="tm-section">
							<button class="tm-toggle" (click)="$event.stopPropagation(); toggleTable(field.name)">
								<ott-icon [name]="expandedTables[field.name] ? 'chevron-down' : 'chevron-right'" [size]="12"></ott-icon>
								{{ field.label }}
								<span class="tm-count" *ngIf="field.value?.length">{{ field.value.length }}</span>
							</button>
							<table class="tm-table" *ngIf="expandedTables[field.name]">
								<thead>
									<tr>
										<th *ngFor="let col of getTableColumns(field.value)">{{ col }}</th>
									</tr>
								</thead>
								<tbody>
									<tr *ngFor="let row of field.value">
										<td *ngFor="let col of getTableColumns(field.value)">
											{{ getRowValue(row, col) }}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</ng-container>
				</ng-container>

				<!-- Fallback for default/StandardCollection schemas with no dynamic fields -->
				<ng-container *ngIf="(schema === 'default' || schema === 'StandardCollection') && pageFields.length === 0">
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">Name</span>
							<span class="detail-value">{{ folderName }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">ID</span>
							<span class="detail-value mono">{{ folderId }}</span>
						</div>
					</div>
				</ng-container>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		.metadata-card {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			background: var(--ott-bg);
			overflow: hidden;
			transition: border-color 0.15s;
		}
		.metadata-card:hover { border-color: var(--ott-border); }

		/* Summary row */
		.card-summary {
			display: flex; align-items: center; justify-content: space-between;
			padding: 10px 14px; cursor: pointer; user-select: none;
			transition: background 0.12s;
		}
		.card-summary:hover { background: var(--ott-bg-muted); }
		.summary-left {
			display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap;
		}
		.schema-badge {
			font-size: 10px; font-weight: 600; text-transform: uppercase;
			letter-spacing: 0.5px; padding: 2px 7px;
			border-radius: var(--ott-radius-sm);
			background: var(--ott-primary-light); color: var(--ott-primary);
			white-space: nowrap;
		}
		.summary-sep { color: var(--ott-border); font-size: 10px; }
		.summary-text { font-size: 12px; color: var(--ott-text-secondary); white-space: nowrap; }
		.summary-text.muted { color: var(--ott-text-muted); }
		.lang-pills { display: flex; gap: 3px; }
		.lang-pill {
			font-size: 10px; font-weight: 600; font-family: var(--ott-font-mono);
			padding: 1px 5px; border-radius: var(--ott-radius-sm);
			background: var(--ott-bg-subtle); color: var(--ott-text-secondary);
		}
		.expand-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 2px; display: flex;
			transition: transform 0.2s, color 0.15s;
		}
		.expand-btn:hover { color: var(--ott-text); }
		.expand-btn.rotated { transform: rotate(180deg); }

		/* Detail panel */
		.card-details {
			padding: 0 14px 14px;
			border-top: 1px solid var(--ott-border-light);
		}
		.detail-grid {
			display: grid; grid-template-columns: 1fr 1fr;
			gap: 10px 24px; padding-top: 12px;
		}
		.detail-item { display: flex; flex-direction: column; gap: 1px; }
		.detail-item.span-2 { grid-column: span 2; }
		.detail-label {
			font-size: 10px; font-weight: 600; text-transform: uppercase;
			letter-spacing: 0.4px; color: var(--ott-text-muted);
		}
		.detail-value {
			font-size: 13px; color: var(--ott-text);
			display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
		}
		.detail-value.mono, .mono { font-family: var(--ott-font-mono); }
		.detail-value.link { color: var(--ott-primary); cursor: pointer; }
		.detail-value.link:hover { text-decoration: underline; }
		.edit-inline-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 1px;
			border-radius: var(--ott-radius-sm); display: inline-flex;
			transition: color 0.15s;
		}
		.edit-inline-btn:hover { color: var(--ott-primary); }

		/* Chips for list fields */
		.chip {
			font-size: 10px; font-weight: 500; padding: 2px 7px;
			border-radius: var(--ott-radius-full);
			background: var(--ott-bg-subtle); color: var(--ott-text-secondary);
		}

		/* Translation Maintenance / tables */
		.tm-section { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--ott-border-light); }
		.tm-toggle {
			display: flex; align-items: center; gap: 5px;
			border: none; background: none; cursor: pointer;
			font-size: 11px; font-weight: 600; font-family: var(--ott-font);
			text-transform: uppercase; letter-spacing: 0.3px;
			color: var(--ott-text-muted); padding: 0;
			transition: color 0.15s;
		}
		.tm-toggle:hover { color: var(--ott-text-secondary); }
		.tm-count {
			font-size: 10px; font-weight: 700;
			min-width: 16px; height: 16px;
			display: inline-flex; align-items: center; justify-content: center;
			background: var(--ott-bg-subtle); border-radius: var(--ott-radius-full);
			color: var(--ott-text-muted);
		}
		.tm-table {
			width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px;
		}
		.tm-table th {
			text-align: left; padding: 4px 8px; font-weight: 600;
			color: var(--ott-text-muted); font-size: 10px; text-transform: uppercase;
			letter-spacing: 0.3px; border-bottom: 1px solid var(--ott-border-light);
		}
		.tm-table td {
			padding: 5px 8px; color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.tm-table tr:last-child td { border-bottom: none; }
		.compilations {
			font-size: 11px; color: var(--ott-text-muted);
			max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}

		/* Badges */
		.vendor-badge {
			display: inline-flex; padding: 1px 5px; border-radius: var(--ott-radius-sm);
			font-size: 10px; font-weight: 600; letter-spacing: 0.2px;
			background: var(--ott-primary-light); color: var(--ott-primary);
		}
		.readiness-badge {
			display: inline-flex; padding: 2px 7px; border-radius: var(--ott-radius-full);
			font-size: 10px; font-weight: 600;
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
	@Input() pageFields: CmsPageField[] = [];
	@Output() editReportNumber = new EventEmitter<void>();
	@Output() navigateToCollection = new EventEmitter<string>();

	expanded = false;
	tmExpanded = false;
	expandedTables: Record<string, boolean> = {};

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

	/** Non-table fields for the dynamic grid */
	get nonTableFields(): CmsPageField[] {
		return this.pageFields.filter(f => f.type !== 'table');
	}

	/** Table fields rendered as collapsible sections */
	get tableFields(): CmsPageField[] {
		return this.pageFields.filter(f => f.type === 'table');
	}

	isWideField(field: CmsPageField): boolean {
		return field.type === 'rich-text' ||
			(typeof field.value === 'string' && field.value.length > 60);
	}

	toggleTable(name: string): void {
		this.expandedTables[name] = !this.expandedTables[name];
	}

	getTableColumns(rows: any[]): string[] {
		if (!rows || rows.length === 0) return [];
		const first = rows[0];
		return Object.keys(first).filter(k => !k.startsWith('_'));
	}

	getRowValue(row: any, col: string): string {
		const val = row[col];
		if (val === null || val === undefined) return '';
		if (Array.isArray(val)) return val.join(', ');
		return String(val);
	}

	stripHtml(html: string): string {
		if (!html) return '';
		return html.replace(/<[^>]*>/g, '').trim();
	}
}
