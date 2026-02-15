import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import {
	FolderSchema, DesignationCollectionMetadata, StandardDatedVersionMetadata,
	TranslationBatchMetadata, CmsPageField
} from '../../models/translation.model';
import { ElementUpdate } from '../../services/metadata-lookup.service';

@Component({
	selector: 'ott-folder-metadata-card',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="metadata-card" [class.expanded]="expanded" [class.editing]="editing">
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

				<div class="summary-right">
					<!-- Edit button (only when metadataPageId is set) -->
					<button *ngIf="metadataPageId && expanded && !editing"
						class="edit-mode-btn"
						(click)="$event.stopPropagation(); startEditing()"
						title="Edit metadata">
						<ott-icon name="pencil" [size]="13"></ott-icon>
					</button>
					<button class="expand-btn" [class.rotated]="expanded">
						<ott-icon name="chevron-down" [size]="14"></ott-icon>
					</button>
				</div>
			</div>

			<!-- Expanded detail panel -->
			<div class="card-details" *ngIf="expanded">

				<!-- TYPED METADATA (for known schemas) -->

				<!-- Designation Collection -->
				<ng-container *ngIf="designationMeta">
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">Designation Number</span>
							<span class="detail-value mono" *ngIf="!editing">{{ designationMeta.baseDesignation }}</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['DesignationNumber']"
								(ngModelChange)="editValues['DesignationNumber'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Organization</span>
							<span class="detail-value" *ngIf="!editing">{{ designationMeta.organization }}</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['Organization']"
								(ngModelChange)="editValues['Organization'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Committee</span>
							<span class="detail-value" *ngIf="!editing">{{ designationMeta.committee }}</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['Committee']"
								(ngModelChange)="editValues['Committee'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Home Editor</span>
							<span class="detail-value" *ngIf="!editing">{{ designationMeta.homeEditor }}</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['HomeEditor']"
								(ngModelChange)="editValues['HomeEditor'] = $event">
						</div>
						<div class="detail-item" *ngIf="designationMeta.reportNumber || editing">
							<span class="detail-label">Report #</span>
							<span class="detail-value mono" *ngIf="!editing">
								{{ designationMeta.reportNumber }}
								<button class="edit-inline-btn" (click)="$event.stopPropagation(); editReportNumber.emit()" title="Edit">
									<ott-icon name="pencil" [size]="11"></ott-icon>
								</button>
							</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['ReportNumber']"
								(ngModelChange)="editValues['ReportNumber'] = $event">
						</div>
						<div class="detail-item" *ngIf="designationMeta.sourceLocale || editing">
							<span class="detail-label">Source Locale</span>
							<span class="detail-value mono" *ngIf="!editing">{{ designationMeta.sourceLocale }}</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['SourceLocale']"
								(ngModelChange)="editValues['SourceLocale'] = $event">
						</div>
						<div class="detail-item span-2" *ngIf="designationMeta.notes || editing">
							<span class="detail-label">Notes</span>
							<span class="detail-value" *ngIf="!editing">{{ designationMeta.notes }}</span>
							<textarea *ngIf="editing" class="edit-textarea"
								[ngModel]="editValues['Notes']"
								(ngModelChange)="editValues['Notes'] = $event"></textarea>
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
							<span class="detail-value" *ngIf="!editing">{{ datedVersionMeta.standardTitle }}</span>
							<input *ngIf="editing" class="edit-input wide" type="text"
								[ngModel]="editValues['StandardTitle']"
								(ngModelChange)="editValues['StandardTitle'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Action Type</span>
							<span class="detail-value" *ngIf="!editing">{{ datedVersionMeta.actionType }}</span>
							<select *ngIf="editing" class="edit-select"
								[ngModel]="editValues['ActionType']"
								(ngModelChange)="editValues['ActionType'] = $event">
								<option value="New Standard">New Standard</option>
								<option value="Revision">Revision</option>
								<option value="Reapproval">Reapproval</option>
								<option value="Amendment">Amendment</option>
								<option value="Withdrawal">Withdrawal</option>
							</select>
						</div>
						<div class="detail-item">
							<span class="detail-label">Approval Date</span>
							<span class="detail-value" *ngIf="!editing">{{ datedVersionMeta.approvalDate }}</span>
							<input *ngIf="editing" class="edit-input" type="date"
								[ngModel]="editValues['ApprovalDate']"
								(ngModelChange)="editValues['ApprovalDate'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Publication Date</span>
							<span class="detail-value" *ngIf="!editing">{{ datedVersionMeta.publicationDate }}</span>
							<input *ngIf="editing" class="edit-input" type="date"
								[ngModel]="editValues['PublicationDate']"
								(ngModelChange)="editValues['PublicationDate'] = $event">
						</div>
						<div class="detail-item" *ngIf="datedVersionMeta.designationCollectionName">
							<span class="detail-label">Designation Collection</span>
							<span class="detail-value link" *ngIf="!editing"
								(click)="$event.stopPropagation(); navigateToCollection.emit(datedVersionMeta.designationCollectionId)">
								{{ datedVersionMeta.designationCollectionName }}
							</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['DesignationCollectionName']"
								(ngModelChange)="editValues['DesignationCollectionName'] = $event">
						</div>
					</div>
				</ng-container>

				<!-- Translation Batch -->
				<ng-container *ngIf="batchMeta">
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">Batch ID</span>
							<span class="detail-value mono" *ngIf="!editing">{{ batchMeta.batchId }}</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['BatchID']"
								(ngModelChange)="editValues['BatchID'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Vendor</span>
							<span class="detail-value" *ngIf="!editing"><span class="vendor-badge">{{ batchMeta.vendor }}</span></span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['Vendor']"
								(ngModelChange)="editValues['Vendor'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Type</span>
							<span class="detail-value" *ngIf="!editing">{{ batchMeta.type }}</span>
							<select *ngIf="editing" class="edit-select"
								[ngModel]="editValues['Type']"
								(ngModelChange)="editValues['Type'] = $event">
								<option value="New Translation">New Translation</option>
								<option value="Revision">Revision</option>
								<option value="Re-translation">Re-translation</option>
							</select>
						</div>
						<div class="detail-item">
							<span class="detail-label">Due Date</span>
							<span class="detail-value" *ngIf="!editing">{{ batchMeta.dueDate }}</span>
							<input *ngIf="editing" class="edit-input" type="date"
								[ngModel]="editValues['DueDate']"
								(ngModelChange)="editValues['DueDate'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Assigned To</span>
							<span class="detail-value" *ngIf="!editing">{{ batchMeta.assignedTo }}</span>
							<input *ngIf="editing" class="edit-input" type="text"
								[ngModel]="editValues['AssignedTo']"
								(ngModelChange)="editValues['AssignedTo'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Standards</span>
							<span class="detail-value" *ngIf="!editing">{{ batchMeta.standardCount }}</span>
							<input *ngIf="editing" class="edit-input" type="number"
								[ngModel]="editValues['StandardCount']"
								(ngModelChange)="editValues['StandardCount'] = $event">
						</div>
						<div class="detail-item">
							<span class="detail-label">Days Elapsed</span>
							<span class="detail-value">{{ batchMeta.daysElapsed }}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Readiness</span>
							<span class="detail-value" *ngIf="!editing">
								<span class="readiness-badge" [ngClass]="'readiness-' + batchMeta.productionReadiness.toLowerCase().replace(' ', '-')">
									{{ batchMeta.productionReadiness }}
								</span>
							</span>
							<select *ngIf="editing" class="edit-select"
								[ngModel]="editValues['ProductionReadiness']"
								(ngModelChange)="editValues['ProductionReadiness'] = $event">
								<option value="Ready">Ready</option>
								<option value="Not Ready">Not Ready</option>
								<option value="Partial">Partial</option>
							</select>
						</div>
					</div>
				</ng-container>

				<!-- DYNAMIC METADATA (from pageFields — for any schema) -->
				<ng-container *ngIf="!designationMeta && !batchMeta && !datedVersionMeta && pageFields.length > 0">
					<div class="detail-grid">
						<ng-container *ngFor="let field of nonTableFields">
							<div class="detail-item" [class.span-2]="isWideField(field)">
								<span class="detail-label">{{ field.label }}</span>

								<!-- Read mode -->
								<ng-container *ngIf="!editing">
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
								</ng-container>

								<!-- Edit mode -->
								<ng-container *ngIf="editing">
									<input *ngIf="field.type === 'text' || field.type === 'link'" class="edit-input" type="text"
										[ngModel]="editValues[field.name]"
										(ngModelChange)="editValues[field.name] = $event">
									<input *ngIf="field.type === 'date'" class="edit-input" type="date"
										[ngModel]="editValues[field.name]"
										(ngModelChange)="editValues[field.name] = $event">
									<textarea *ngIf="field.type === 'rich-text'" class="edit-textarea"
										[ngModel]="editValues[field.name]"
										(ngModelChange)="editValues[field.name] = $event"></textarea>
									<input *ngIf="field.type === 'dropdown'" class="edit-input" type="text"
										[ngModel]="editValues[field.name]"
										(ngModelChange)="editValues[field.name] = $event">
									<input *ngIf="field.type === 'list'" class="edit-input" type="text"
										placeholder="Comma-separated values"
										[ngModel]="editValues[field.name]"
										(ngModelChange)="editValues[field.name] = $event">
								</ng-container>
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

				<!-- Edit mode footer -->
				<div class="edit-footer" *ngIf="editing">
					<button class="btn-cancel" (click)="$event.stopPropagation(); cancelEditing()">Cancel</button>
					<button class="btn-save" (click)="$event.stopPropagation(); saveEdits()" [disabled]="saving">
						<ott-icon *ngIf="saving" name="loader" [size]="13"></ott-icon>
						{{ saving ? 'Saving...' : 'Save' }}
					</button>
				</div>
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
		.metadata-card.editing { border-color: var(--ott-primary); }

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
		.summary-right {
			display: flex; align-items: center; gap: 4px;
		}
		.schema-badge {
			font-size: var(--ott-font-size-xs); font-weight: 600; text-transform: uppercase;
			letter-spacing: 0.5px; padding: 2px 7px;
			border-radius: var(--ott-radius-sm);
			background: var(--ott-primary-light); color: var(--ott-primary);
			white-space: nowrap;
		}
		.summary-sep { color: var(--ott-border); font-size: var(--ott-font-size-xs); }
		.summary-text { font-size: var(--ott-font-size-sm); color: var(--ott-text-secondary); white-space: nowrap; }
		.summary-text.muted { color: var(--ott-text-muted); }
		.lang-pills { display: flex; gap: 3px; }
		.lang-pill {
			font-size: var(--ott-font-size-xs); font-weight: 600; font-family: var(--ott-font-mono);
			padding: 2px 6px; border-radius: var(--ott-radius-sm);
			background: var(--ott-bg-subtle); color: var(--ott-text-secondary);
		}
		.expand-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 2px; display: flex;
			transition: transform 0.2s, color 0.15s;
		}
		.expand-btn:hover { color: var(--ott-text); }
		.expand-btn.rotated { transform: rotate(180deg); }

		/* Edit mode button */
		.edit-mode-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 3px; display: flex;
			border-radius: var(--ott-radius-sm);
			transition: color 0.15s, background 0.15s;
		}
		.edit-mode-btn:hover { color: var(--ott-primary); background: var(--ott-primary-light); }

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
			font-size: var(--ott-font-size-xs); font-weight: 600; text-transform: uppercase;
			letter-spacing: 0.4px; color: var(--ott-text-muted);
		}
		.detail-value {
			font-size: var(--ott-font-size-base); color: var(--ott-text);
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

		/* Edit controls */
		.edit-input, .edit-select, .edit-textarea {
			font-family: var(--ott-font);
			font-size: var(--ott-font-size-base);
			color: var(--ott-text);
			background: var(--ott-bg);
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-sm);
			padding: 5px 8px;
			width: 100%;
			box-sizing: border-box;
			transition: border-color 0.15s;
		}
		.edit-input:focus, .edit-select:focus, .edit-textarea:focus {
			outline: none;
			border-color: var(--ott-primary);
		}
		.edit-input.wide { grid-column: span 2; }
		.edit-textarea {
			min-height: 60px;
			resize: vertical;
		}

		/* Edit footer */
		.edit-footer {
			display: flex; justify-content: flex-end; gap: 8px;
			margin-top: 14px; padding-top: 12px;
			border-top: 1px solid var(--ott-border-light);
		}
		.btn-cancel, .btn-save {
			font-family: var(--ott-font);
			font-size: var(--ott-font-size-sm);
			font-weight: 500;
			padding: 6px 14px;
			border-radius: var(--ott-radius-sm);
			cursor: pointer;
			display: inline-flex; align-items: center; gap: 5px;
			transition: background 0.15s, color 0.15s;
		}
		.btn-cancel {
			border: 1px solid var(--ott-border);
			background: var(--ott-bg);
			color: var(--ott-text-secondary);
		}
		.btn-cancel:hover { background: var(--ott-bg-muted); }
		.btn-save {
			border: none;
			background: var(--ott-primary);
			color: white;
		}
		.btn-save:hover { opacity: 0.9; }
		.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

		/* Chips for list fields */
		.chip {
			font-size: var(--ott-font-size-xs); font-weight: 500; padding: 2px 7px;
			border-radius: var(--ott-radius-full);
			background: var(--ott-bg-subtle); color: var(--ott-text-secondary);
		}

		/* Translation Maintenance / tables */
		.tm-section { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--ott-border-light); }
		.tm-toggle {
			display: flex; align-items: center; gap: 5px;
			border: none; background: none; cursor: pointer;
			font-size: var(--ott-font-size-sm); font-weight: 600; font-family: var(--ott-font);
			text-transform: uppercase; letter-spacing: 0.3px;
			color: var(--ott-text-muted); padding: 0;
			transition: color 0.15s;
		}
		.tm-toggle:hover { color: var(--ott-text-secondary); }
		.tm-count {
			font-size: var(--ott-font-size-xs); font-weight: 700;
			min-width: 18px; height: 18px;
			display: inline-flex; align-items: center; justify-content: center;
			background: var(--ott-bg-subtle); border-radius: var(--ott-radius-full);
			color: var(--ott-text-muted);
		}
		.tm-table {
			width: 100%; border-collapse: collapse; font-size: var(--ott-font-size-base); margin-top: 6px;
		}
		.tm-table th {
			text-align: left; padding: 6px 8px; font-weight: 600;
			color: var(--ott-text-muted); font-size: var(--ott-font-size-xs); text-transform: uppercase;
			letter-spacing: 0.3px; border-bottom: 1px solid var(--ott-border-light);
		}
		.tm-table td {
			padding: 7px 8px; color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.tm-table tr:last-child td { border-bottom: none; }
		.compilations {
			font-size: var(--ott-font-size-sm); color: var(--ott-text-muted);
			max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}

		/* Badges */
		.vendor-badge {
			display: inline-flex; padding: 2px 6px; border-radius: var(--ott-radius-sm);
			font-size: var(--ott-font-size-xs); font-weight: 600; letter-spacing: 0.2px;
			background: var(--ott-primary-light); color: var(--ott-primary);
		}
		.readiness-badge {
			display: inline-flex; padding: 2px 7px; border-radius: var(--ott-radius-full);
			font-size: var(--ott-font-size-xs); font-weight: 600;
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
	@Input() metadataPageId?: string;
	@Output() editReportNumber = new EventEmitter<void>();
	@Output() navigateToCollection = new EventEmitter<string>();
	@Output() metadataSave = new EventEmitter<{ pageId: string; elements: ElementUpdate[] }>();

	expanded = false;
	tmExpanded = false;
	expandedTables: Record<string, boolean> = {};

	/** Inline editing state */
	editing = false;
	saving = false;
	editValues: Record<string, any> = {};

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

	/** Enter edit mode — populate editValues from current metadata */
	startEditing(): void {
		this.editValues = {};

		if (this.designationMeta) {
			this.editValues['DesignationNumber'] = this.designationMeta.baseDesignation;
			this.editValues['Organization'] = this.designationMeta.organization;
			this.editValues['Committee'] = this.designationMeta.committee;
			this.editValues['HomeEditor'] = this.designationMeta.homeEditor;
			this.editValues['ReportNumber'] = this.designationMeta.reportNumber || '';
			this.editValues['SourceLocale'] = this.designationMeta.sourceLocale || '';
			this.editValues['Notes'] = this.designationMeta.notes || '';
		} else if (this.datedVersionMeta) {
			this.editValues['StandardTitle'] = this.datedVersionMeta.standardTitle;
			this.editValues['ActionType'] = this.datedVersionMeta.actionType;
			this.editValues['ApprovalDate'] = this.datedVersionMeta.approvalDate || '';
			this.editValues['PublicationDate'] = this.datedVersionMeta.publicationDate || '';
			this.editValues['DesignationCollectionName'] = this.datedVersionMeta.designationCollectionName || '';
		} else if (this.batchMeta) {
			this.editValues['BatchID'] = this.batchMeta.batchId;
			this.editValues['Vendor'] = this.batchMeta.vendor;
			this.editValues['Type'] = this.batchMeta.type;
			this.editValues['DueDate'] = this.batchMeta.dueDate || '';
			this.editValues['AssignedTo'] = this.batchMeta.assignedTo || '';
			this.editValues['StandardCount'] = this.batchMeta.standardCount;
			this.editValues['ProductionReadiness'] = this.batchMeta.productionReadiness;
		} else {
			// Dynamic fields
			for (const field of this.pageFields) {
				if (field.type !== 'table') {
					this.editValues[field.name] = field.value;
				}
			}
		}

		this.editing = true;
	}

	/** Cancel editing — discard changes */
	cancelEditing(): void {
		this.editing = false;
		this.editValues = {};
	}

	/** Save edits — emit element updates for the parent to persist */
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

	/** Called by parent after save completes (success or failure) */
	onSaveComplete(success: boolean): void {
		this.saving = false;
		if (success) {
			this.editing = false;
			this.editValues = {};
		}
	}
}
