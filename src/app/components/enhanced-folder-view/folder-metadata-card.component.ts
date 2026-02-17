import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import {
	FolderSchema, DesignationCollectionMetadata, CmsPageField
} from '../../models/translation.model';
import { ElementUpdate } from '../../services/metadata-lookup.service';

@Component({
	selector: 'ott-folder-metadata-card',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="mc" *ngIf="hasMetadata" [class.mc-editing]="editing">
			<!-- Card header -->
			<div class="mc-header">
				<span class="mc-label">Metadata</span>
				<div class="mc-actions">
					<button *ngIf="metadataPageId && !editing"
						class="mc-edit-btn"
						(click)="startEditing()"
						title="Edit metadata">
						<ott-icon name="pencil" [size]="12"></ott-icon>
						Edit
					</button>
					<ng-container *ngIf="editing">
						<button class="mc-cancel-btn" (click)="cancelEditing()">Cancel</button>
						<button class="mc-save-btn" (click)="saveEdits()" [disabled]="saving">
							{{ saving ? 'Saving...' : 'Save' }}
						</button>
					</ng-container>
				</div>
			</div>

			<!-- Designation Collection -->
			<ng-container *ngIf="designationMeta">
				<div class="mc-grid">
					<div class="mc-field">
						<span class="mc-field-label">Designation Number</span>
						<span class="mc-field-value mono" *ngIf="!editing">{{ designationMeta.baseDesignation || '—' }}</span>
						<input *ngIf="editing" class="mc-input" type="text"
							[ngModel]="editValues['DesignationNumber']"
							(ngModelChange)="editValues['DesignationNumber'] = $event">
					</div>
					<div class="mc-field" *ngIf="designationMeta.organization || editing">
						<span class="mc-field-label">Organization</span>
						<span class="mc-field-value" *ngIf="!editing">{{ designationMeta.organization || '—' }}</span>
						<input *ngIf="editing" class="mc-input" type="text"
							[ngModel]="editValues['Organization']"
							(ngModelChange)="editValues['Organization'] = $event">
					</div>
					<div class="mc-field">
						<span class="mc-field-label">Committee</span>
						<span class="mc-field-value" *ngIf="!editing">{{ designationMeta.committee || '—' }}</span>
						<input *ngIf="editing" class="mc-input" type="text"
							[ngModel]="editValues['Committee']"
							(ngModelChange)="editValues['Committee'] = $event">
					</div>
					<div class="mc-field" *ngIf="designationMeta.committeeCode || editing">
						<span class="mc-field-label">Committee Code</span>
						<span class="mc-field-value mono" *ngIf="!editing">{{ designationMeta.committeeCode || '—' }}</span>
						<input *ngIf="editing" class="mc-input" type="text"
							[ngModel]="editValues['CommitteeCode']"
							(ngModelChange)="editValues['CommitteeCode'] = $event">
					</div>
					<div class="mc-field" *ngIf="designationMeta.homeEditor || editing">
						<span class="mc-field-label">Home Editor</span>
						<span class="mc-field-value" *ngIf="!editing">{{ designationMeta.homeEditor || '—' }}</span>
						<input *ngIf="editing" class="mc-input" type="text"
							[ngModel]="editValues['HomeEditor']"
							(ngModelChange)="editValues['HomeEditor'] = $event">
					</div>
					<div class="mc-field" *ngIf="designationMeta.homeEditorEmail || editing">
						<span class="mc-field-label">Home Editor Email</span>
						<span class="mc-field-value mc-link" *ngIf="!editing">{{ designationMeta.homeEditorEmail || '—' }}</span>
						<input *ngIf="editing" class="mc-input" type="email"
							[ngModel]="editValues['HomeEditorEmail']"
							(ngModelChange)="editValues['HomeEditorEmail'] = $event">
					</div>
					<div class="mc-field" *ngIf="designationMeta.sourceLocale || editing">
						<span class="mc-field-label">Source Locale</span>
						<span class="mc-field-value mono" *ngIf="!editing">{{ designationMeta.sourceLocale || '—' }}</span>
						<input *ngIf="editing" class="mc-input" type="text"
							[ngModel]="editValues['SourceLocale']"
							(ngModelChange)="editValues['SourceLocale'] = $event">
					</div>
					<div class="mc-field" *ngIf="designationMeta.reportNumber || editing">
						<span class="mc-field-label">Report #</span>
						<span class="mc-field-value mono" *ngIf="!editing">{{ designationMeta.reportNumber || '—' }}</span>
						<input *ngIf="editing" class="mc-input" type="text"
							[ngModel]="editValues['ReportNumber']"
							(ngModelChange)="editValues['ReportNumber'] = $event">
					</div>
				</div>
				<div class="mc-field mc-field-wide" *ngIf="designationMeta.notes || editing">
					<span class="mc-field-label">Notes</span>
					<span class="mc-field-value mc-field-notes" *ngIf="!editing">{{ designationMeta.notes || '—' }}</span>
					<textarea *ngIf="editing" class="mc-textarea"
						[ngModel]="editValues['Notes']"
						(ngModelChange)="editValues['Notes'] = $event"></textarea>
				</div>

				<!-- Translation Maintenance -->
				<div class="mc-section" *ngIf="designationMeta.translationMaintenance.length > 0">
					<button class="mc-section-toggle" (click)="tmExpanded = !tmExpanded">
						<ott-icon [name]="tmExpanded ? 'chevron-down' : 'chevron-right'" [size]="12"></ott-icon>
						Translation Maintenance
						<span class="mc-section-count">{{ designationMeta.translationMaintenance.length }}</span>
					</button>
					<table class="mc-table" *ngIf="tmExpanded">
						<thead>
							<tr><th>Language</th><th>Vendor</th><th>Compilations</th></tr>
						</thead>
						<tbody>
							<tr *ngFor="let tm of designationMeta.translationMaintenance">
								<td>{{ tm.language }}</td>
								<td><span class="mc-badge">{{ tm.vendor }}</span></td>
								<td class="mc-truncate">{{ tm.compilations.join(', ') }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</ng-container>

			<!-- Dynamic fields (extra schema fields not covered above) -->
			<ng-container *ngIf="!designationMeta && pageFields.length > 0">
				<div class="mc-grid">
					<ng-container *ngFor="let field of nonTableFields">
						<div class="mc-field" [class.mc-field-span2]="isWideField(field)">
							<span class="mc-field-label">{{ field.label }}</span>
							<ng-container *ngIf="!editing">
								<span class="mc-field-value" *ngIf="field.type === 'text' || field.type === 'date'">{{ field.value || '—' }}</span>
								<span class="mc-field-value mc-link" *ngIf="field.type === 'link'">{{ field.value?.Name || field.value?.href || field.value }}</span>
								<span class="mc-field-value" *ngIf="field.type === 'list'">
									<span class="mc-chip" *ngFor="let item of field.value">{{ item }}</span>
								</span>
								<span class="mc-field-value" *ngIf="field.type === 'dropdown'">{{ field.value || '—' }}</span>
								<span class="mc-field-value" *ngIf="field.type === 'rich-text'" [title]="field.value">
									{{ stripHtml(field.value) | slice:0:120 }}
								</span>
							</ng-container>
							<ng-container *ngIf="editing">
								<input *ngIf="field.type === 'text' || field.type === 'link'" class="mc-input" type="text"
									[ngModel]="editValues[field.name]"
									(ngModelChange)="editValues[field.name] = $event">
								<input *ngIf="field.type === 'date'" class="mc-input" type="date"
									[ngModel]="editValues[field.name]"
									(ngModelChange)="editValues[field.name] = $event">
								<textarea *ngIf="field.type === 'rich-text'" class="mc-textarea"
									[ngModel]="editValues[field.name]"
									(ngModelChange)="editValues[field.name] = $event"></textarea>
								<input *ngIf="field.type === 'dropdown' || field.type === 'list'" class="mc-input" type="text"
									[ngModel]="editValues[field.name]"
									(ngModelChange)="editValues[field.name] = $event">
							</ng-container>
						</div>
					</ng-container>
				</div>

				<!-- Tables -->
				<ng-container *ngFor="let field of tableFields">
					<div class="mc-section">
						<button class="mc-section-toggle" (click)="toggleTable(field.name)">
							<ott-icon [name]="expandedTables[field.name] ? 'chevron-down' : 'chevron-right'" [size]="12"></ott-icon>
							{{ field.label }}
							<span class="mc-section-count" *ngIf="field.value?.length">{{ field.value.length }}</span>
						</button>
						<table class="mc-table" *ngIf="expandedTables[field.name]">
							<thead>
								<tr><th *ngFor="let col of getTableColumns(field.value)">{{ col }}</th></tr>
							</thead>
							<tbody>
								<tr *ngFor="let row of field.value">
									<td *ngFor="let col of getTableColumns(field.value)">{{ getRowValue(row, col) }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</ng-container>
			</ng-container>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		.mc {
			background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-lg);
			padding: 14px 18px 16px;
			margin-bottom: 4px;
		}
		.mc-editing {
			outline: 2px solid var(--ott-primary);
			outline-offset: -2px;
		}

		/* Header */
		.mc-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 12px;
		}
		.mc-label {
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			color: var(--ott-text-muted);
		}
		.mc-actions {
			display: flex;
			align-items: center;
			gap: 6px;
		}
		.mc-edit-btn {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			border: none;
			background: none;
			cursor: pointer;
			font-size: 12px;
			font-family: var(--ott-font);
			font-weight: 500;
			color: var(--ott-text-muted);
			padding: 4px 8px;
			border-radius: var(--ott-radius-sm);
			transition: all 0.15s;
		}
		.mc-edit-btn:hover {
			color: var(--ott-primary);
			background: var(--ott-primary-light);
		}
		.mc-cancel-btn, .mc-save-btn {
			font-family: var(--ott-font);
			font-size: 12px;
			font-weight: 500;
			padding: 5px 12px;
			border-radius: var(--ott-radius-sm);
			cursor: pointer;
			transition: all 0.15s;
		}
		.mc-cancel-btn {
			border: 1px solid var(--ott-border);
			background: var(--ott-bg);
			color: var(--ott-text-secondary);
		}
		.mc-cancel-btn:hover { background: var(--ott-bg-hover); }
		.mc-save-btn {
			border: none;
			background: var(--ott-primary);
			color: white;
		}
		.mc-save-btn:hover { opacity: 0.9; }
		.mc-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

		/* Grid */
		.mc-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12px 20px;
		}

		/* Fields */
		.mc-field {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.mc-field-span2 { grid-column: span 2; }
		.mc-field-wide {
			margin-top: 12px;
		}
		.mc-field-label {
			font-size: 11px;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.3px;
			color: var(--ott-text-muted);
		}
		.mc-field-value {
			font-size: 13px;
			color: var(--ott-text);
			line-height: 1.5;
		}
		.mc-field-value.mono { font-family: var(--ott-font-mono); }
		.mc-field-notes {
			font-size: 13px;
			color: var(--ott-text-secondary);
			line-height: 1.5;
		}
		.mc-link {
			color: var(--ott-primary);
			cursor: pointer;
		}
		.mc-link:hover { text-decoration: underline; }

		/* Input controls */
		.mc-input, .mc-select, .mc-textarea {
			font-family: var(--ott-font);
			font-size: 13px;
			color: var(--ott-text);
			background: var(--ott-bg);
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-sm);
			padding: 5px 8px;
			width: 100%;
			box-sizing: border-box;
			transition: border-color 0.15s;
		}
		.mc-input:focus, .mc-select:focus, .mc-textarea:focus {
			outline: none;
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 2px var(--ott-ring);
		}
		.mc-textarea {
			min-height: 56px;
			resize: vertical;
		}

		/* Badges */
		.mc-badge {
			display: inline-flex;
			padding: 2px 7px;
			border-radius: var(--ott-radius-sm);
			font-size: 11px;
			font-weight: 600;
			background: var(--ott-primary-light);
			color: var(--ott-primary);
		}
		.mc-chip {
			display: inline-flex;
			padding: 2px 7px;
			border-radius: var(--ott-radius-full);
			font-size: 11px;
			font-weight: 500;
			background: var(--ott-bg-subtle);
			color: var(--ott-text-secondary);
			margin-right: 4px;
		}
		.mc-status {
			display: inline-flex;
			padding: 2px 8px;
			border-radius: var(--ott-radius-full);
			font-size: 11px;
			font-weight: 600;
		}
		.mc-status-ready { background: var(--ott-success-light); color: #166534; }
		.mc-status-not-ready { background: #fef2f2; color: #991b1b; }
		.mc-status-partial { background: var(--ott-warning-light); color: #92400e; }

		/* Sections (tables) */
		.mc-section {
			margin-top: 14px;
			padding-top: 12px;
			border-top: 1px solid var(--ott-border-light);
		}
		.mc-section-toggle {
			display: flex;
			align-items: center;
			gap: 5px;
			border: none;
			background: none;
			cursor: pointer;
			font-size: 12px;
			font-weight: 600;
			font-family: var(--ott-font);
			text-transform: uppercase;
			letter-spacing: 0.3px;
			color: var(--ott-text-muted);
			padding: 0;
			transition: color 0.15s;
		}
		.mc-section-toggle:hover { color: var(--ott-text-secondary); }
		.mc-section-count {
			font-size: 10px;
			font-weight: 700;
			min-width: 16px;
			height: 16px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: var(--ott-bg-subtle);
			border-radius: var(--ott-radius-full);
			color: var(--ott-text-muted);
		}
		.mc-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 12px;
			margin-top: 8px;
		}
		.mc-table th {
			text-align: left;
			padding: 6px 8px;
			font-weight: 600;
			color: var(--ott-text-muted);
			font-size: 10px;
			text-transform: uppercase;
			letter-spacing: 0.3px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.mc-table td {
			padding: 7px 8px;
			color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.mc-table tr:last-child td { border-bottom: none; }
		.mc-truncate {
			max-width: 240px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			color: var(--ott-text-muted);
		}
	`]
})
export class FolderMetadataCardComponent {
	@Input() schema: FolderSchema = 'default';
	@Input() metadata: any = null;
	@Input() folderName = '';
	@Input() folderId = '';
	@Input() pageFields: CmsPageField[] = [];
	@Input() metadataPageId?: string;
	@Output() editReportNumber = new EventEmitter<void>();
	@Output() navigateToCollection = new EventEmitter<string>();
	@Output() metadataSave = new EventEmitter<{ pageId: string; elements: ElementUpdate[] }>();

	tmExpanded = false;
	expandedTables: Record<string, boolean> = {};

	editing = false;
	saving = false;
	editValues: Record<string, any> = {};

	get hasMetadata(): boolean {
		return !!(this.designationMeta || this.pageFields.length > 0);
	}

	get designationMeta(): DesignationCollectionMetadata | null {
		// All OTT folders use the same schema — treat metadata as DesignationCollection
		return this.metadata?.baseDesignation !== undefined ? this.metadata : null;
	}

	get nonTableFields(): CmsPageField[] {
		return this.pageFields.filter(f => f.type !== 'table');
	}

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
		return Object.keys(rows[0]).filter(k => !k.startsWith('_'));
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

	startEditing(): void {
		this.editValues = {};

		if (this.designationMeta) {
			this.editValues['DesignationNumber'] = this.designationMeta.baseDesignation;
			this.editValues['Organization'] = this.designationMeta.organization;
			this.editValues['Committee'] = this.designationMeta.committee;
			this.editValues['CommitteeCode'] = this.designationMeta.committeeCode || '';
			this.editValues['HomeEditor'] = this.designationMeta.homeEditor;
			this.editValues['HomeEditorEmail'] = this.designationMeta.homeEditorEmail || '';
			this.editValues['ReportNumber'] = this.designationMeta.reportNumber || '';
			this.editValues['SourceLocale'] = this.designationMeta.sourceLocale || '';
			this.editValues['Notes'] = this.designationMeta.notes || '';
		} else {
			for (const field of this.pageFields) {
				if (field.type !== 'table') {
					this.editValues[field.name] = field.value;
				}
			}
		}

		this.editing = true;
	}

	cancelEditing(): void {
		this.editing = false;
		this.editValues = {};
	}

	saveEdits(): void {
		if (!this.metadataPageId) return;

		this.saving = true;

		const elements: ElementUpdate[] = Object.entries(this.editValues)
			.map(([name, value]) => ({ name, value }));

		this.metadataSave.emit({
			pageId: this.metadataPageId,
			elements
		});
	}

	onSaveComplete(success: boolean): void {
		this.saving = false;
		if (success) {
			this.editing = false;
			this.editValues = {};
		}
	}
}
