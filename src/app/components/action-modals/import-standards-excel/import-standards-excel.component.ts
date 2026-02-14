import { Component, ElementRef, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { LucideIconComponent } from '../../shared/lucide-icon.component';
import { ExcelImportRow, ExcelImportResult } from '../../../models/translation.model';

type ImportStep = 'upload' | 'preview' | 'processing' | 'complete';

@Component({
	selector: 'app-import-standards-excel',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" [class.wide]="step !== 'upload'" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="file-input" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Import Standards</h3>
					</div>
					<button class="close-btn" (click)="onCancel()" *ngIf="step !== 'processing'">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<div class="modal-body">
					<!-- Step indicators -->
					<div class="steps">
						<div class="step" [class.active]="step === 'upload'" [class.done]="stepIndex > 0">
							<span class="step-num">1</span> Upload
						</div>
						<div class="step-line" [class.active]="stepIndex > 0"></div>
						<div class="step" [class.active]="step === 'preview'" [class.done]="stepIndex > 1">
							<span class="step-num">2</span> Preview
						</div>
						<div class="step-line" [class.active]="stepIndex > 1"></div>
						<div class="step" [class.active]="step === 'processing'" [class.done]="stepIndex > 2">
							<span class="step-num">3</span> Processing
						</div>
						<div class="step-line" [class.active]="stepIndex > 2"></div>
						<div class="step" [class.active]="step === 'complete'">
							<span class="step-num">4</span> Complete
						</div>
					</div>

					<!-- Step 1: Upload -->
					<div *ngIf="step === 'upload'">
						<div class="drop-zone"
							[class.drag-over]="isDragOver"
							(dragover)="onDragOver($event)"
							(dragleave)="isDragOver = false"
							(drop)="onFileDrop($event)">
							<ott-icon name="file-input" [size]="28" color="var(--ott-text-muted)"></ott-icon>
							<span class="drop-text">Drop .xlsx here or <button class="browse-btn" (click)="fileInput.click()">Browse</button></span>
							<input #fileInput type="file" accept=".xlsx,.xls,.csv" (change)="onFileSelect($event)" hidden>
						</div>
						<div class="file-selected" *ngIf="fileName">
							<ott-icon name="file-check" [size]="14" color="var(--ott-success)"></ott-icon>
							{{ fileName }}
						</div>
					</div>

					<!-- Step 2: Preview -->
					<div *ngIf="step === 'preview'">
						<div class="preview-header">
							{{ previewRows.length }} rows &middot; {{ errorCount }} errors
						</div>
						<div class="preview-table-wrap">
							<table class="preview-table">
								<thead>
									<tr>
										<th>Designation</th>
										<th>Version</th>
										<th>Locale</th>
										<th>Vendor</th>
										<th>Batch</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									<tr *ngFor="let row of previewRows" [class.error-row]="!row.valid">
										<td class="font-mono">{{ row.designation }}</td>
										<td>{{ row.version }}</td>
										<td>{{ row.locale }}</td>
										<td>{{ row.vendor }}</td>
										<td>{{ row.batchId }}</td>
										<td>
											<ott-icon *ngIf="row.valid" name="circle-check" [size]="14" color="var(--ott-success)"></ott-icon>
											<span *ngIf="!row.valid" class="error-text" [title]="row.error || ''">
												<ott-icon name="circle-x" [size]="14" color="var(--ott-danger)"></ott-icon>
												{{ row.error }}
											</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div class="preview-summary">
							Creates: {{ previewRows.length }} collections, {{ uniqueBatches }} batch{{ uniqueBatches !== 1 ? 'es' : '' }}
						</div>
					</div>

					<!-- Step 3: Processing -->
					<div *ngIf="step === 'processing'">
						<div class="progress-bar-container">
							<div class="progress-bar" [style.width.%]="progressPercent"></div>
						</div>
						<div class="progress-text">{{ processedCount }}/{{ previewRows.length }}</div>
						<div class="progress-log">
							<div class="log-item" *ngFor="let log of progressLog">
								<ott-icon
									[name]="log.done ? 'circle-check' : (log.active ? 'circle' : 'circle')"
									[size]="14"
									[color]="log.done ? 'var(--ott-success)' : (log.active ? 'var(--ott-primary)' : 'var(--ott-text-muted)')">
								</ott-icon>
								<span [class.done]="log.done" [class.active]="log.active">{{ log.label }}</span>
							</div>
						</div>
					</div>

					<!-- Step 4: Complete -->
					<div *ngIf="step === 'complete'">
						<div class="complete-icon">
							<ott-icon name="circle-check" [size]="40" color="var(--ott-success)"></ott-icon>
						</div>
						<div class="complete-title">Import Complete</div>
						<div class="complete-stats">
							<div class="stat">{{ result.collectionsCreated }} collections</div>
							<div class="stat">{{ result.batchesCreated }} batch{{ result.batchesCreated !== 1 ? 'es' : '' }}</div>
							<div class="stat">{{ result.errors.length }} errors</div>
						</div>
						<label class="checkbox-item">
							<input type="checkbox" [(ngModel)]="emailSummary" checked>
							Email summary
						</label>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn btn-secondary" *ngIf="step === 'upload'" (click)="onCancel()">Cancel</button>
					<button class="btn btn-primary" *ngIf="step === 'upload'" (click)="goToPreview()" [disabled]="!fileName">
						Next
					</button>

					<button class="btn btn-secondary" *ngIf="step === 'preview'" (click)="step = 'upload'">Back</button>
					<button class="btn btn-primary" *ngIf="step === 'preview'" (click)="startImport()" [disabled]="errorCount > 0">
						Import
					</button>

					<button class="btn btn-primary" *ngIf="step === 'complete'" (click)="close.emit()">Done</button>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; }
		.modal-overlay {
			position: fixed; top: 0; left: 0; right: 0; bottom: 0;
			background: rgba(0,0,0,0.4);
			display: flex; align-items: center; justify-content: center;
			z-index: 10000; font-family: var(--ott-font);
		}
		.modal-dialog {
			background: var(--ott-bg);
			border-radius: var(--ott-radius-xl);
			box-shadow: var(--ott-shadow-xl);
			border: 1px solid var(--ott-border);
			width: 440px;
			max-height: 80vh;
			display: flex; flex-direction: column;
			transition: width 0.2s;
		}
		.modal-dialog.wide { width: 620px; }
		.modal-header {
			display: flex; align-items: center; justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.header-title { display: flex; align-items: center; gap: 8px; }
		.modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--ott-text); }
		.close-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 4px;
			border-radius: var(--ott-radius-sm);
		}
		.close-btn:hover { color: var(--ott-text); background: var(--ott-bg-hover); }
		.modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }

		/* Steps */
		.steps {
			display: flex; align-items: center; gap: 0; margin-bottom: 16px;
			justify-content: center;
		}
		.step {
			display: flex; align-items: center; gap: 4px;
			font-size: 11px; font-weight: 500; color: var(--ott-text-muted);
		}
		.step.active { color: var(--ott-primary); font-weight: 600; }
		.step.done { color: var(--ott-success); }
		.step-num {
			display: inline-flex; align-items: center; justify-content: center;
			width: 18px; height: 18px;
			border-radius: 50%;
			background: var(--ott-bg-subtle);
			font-size: 10px; font-weight: 700;
		}
		.step.active .step-num { background: var(--ott-primary-light); color: var(--ott-primary); }
		.step.done .step-num { background: var(--ott-success-light); color: var(--ott-success); }
		.step-line {
			width: 30px; height: 2px;
			background: var(--ott-border-light);
			margin: 0 4px;
		}
		.step-line.active { background: var(--ott-success); }

		/* Drop zone */
		.drop-zone {
			border: 2px dashed var(--ott-border); border-radius: var(--ott-radius-lg);
			padding: 32px; text-align: center;
			display: flex; flex-direction: column; align-items: center; gap: 8px;
			transition: all 0.15s;
		}
		.drop-zone.drag-over { border-color: var(--ott-primary); background: var(--ott-primary-light); }
		.drop-text { font-size: 13px; color: var(--ott-text-secondary); }
		.browse-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-primary); font-size: 13px; font-family: var(--ott-font);
			text-decoration: underline; padding: 0;
		}
		.file-selected {
			display: flex; align-items: center; gap: 6px;
			padding: 8px 0; font-size: 13px; color: var(--ott-text);
		}

		/* Preview table */
		.preview-header { font-size: 13px; font-weight: 500; color: var(--ott-text); margin-bottom: 8px; }
		.preview-table-wrap {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md); overflow: auto; max-height: 250px;
		}
		.preview-table { width: 100%; border-collapse: collapse; font-size: 12px; }
		.preview-table th {
			text-align: left; padding: 6px 10px;
			font-size: 10px; font-weight: 600; text-transform: uppercase;
			letter-spacing: 0.3px; color: var(--ott-text-muted);
			background: var(--ott-bg-muted);
			border-bottom: 1px solid var(--ott-border-light);
			position: sticky; top: 0;
		}
		.preview-table td {
			padding: 5px 10px; color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.preview-table tr.error-row td { background: #fef2f2; }
		.font-mono { font-family: var(--ott-font-mono); }
		.error-text {
			display: inline-flex; align-items: center; gap: 3px;
			font-size: 11px; color: var(--ott-danger);
		}
		.preview-summary {
			margin-top: 8px; font-size: 12px; color: var(--ott-text-secondary);
		}

		/* Progress */
		.progress-bar-container {
			height: 6px; background: var(--ott-bg-subtle);
			border-radius: var(--ott-radius-full); overflow: hidden;
			margin-bottom: 8px;
		}
		.progress-bar {
			height: 100%; background: var(--ott-primary);
			border-radius: var(--ott-radius-full);
			transition: width 0.3s;
		}
		.progress-text {
			text-align: center; font-size: 13px; color: var(--ott-text-secondary);
			margin-bottom: 12px;
		}
		.progress-log { display: flex; flex-direction: column; gap: 4px; }
		.log-item {
			display: flex; align-items: center; gap: 6px;
			font-size: 12px; color: var(--ott-text-muted);
		}
		.log-item .done { color: var(--ott-text); }
		.log-item .active { color: var(--ott-primary); font-weight: 500; }

		/* Complete */
		.complete-icon { text-align: center; margin-bottom: 8px; }
		.complete-title {
			text-align: center; font-size: 16px; font-weight: 600;
			color: var(--ott-text); margin-bottom: 12px;
		}
		.complete-stats {
			display: flex; justify-content: center; gap: 16px; margin-bottom: 16px;
		}
		.stat {
			font-size: 13px; color: var(--ott-text-secondary);
			padding: 6px 12px; background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-md);
		}
		.checkbox-item {
			display: flex; align-items: center; gap: 8px;
			font-size: 13px; color: var(--ott-text); cursor: pointer;
			justify-content: center;
		}

		/* Footer */
		.modal-footer {
			display: flex; gap: 8px; padding: 14px 20px;
			border-top: 1px solid var(--ott-border-light); justify-content: flex-end;
		}
		.btn {
			padding: 8px 16px; border-radius: var(--ott-radius-md);
			font-size: 13px; font-family: var(--ott-font); font-weight: 500;
			cursor: pointer; border: 1px solid var(--ott-border);
			display: inline-flex; align-items: center; gap: 6px;
			transition: all 0.15s;
		}
		.btn-secondary { background: var(--ott-bg); color: var(--ott-text); }
		.btn-secondary:hover { background: var(--ott-bg-hover); }
		.btn-primary { background: var(--ott-primary); color: #fff; border-color: var(--ott-primary); }
		.btn-primary:hover { background: var(--ott-primary-hover); }
		.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	`]
})
export class ImportStandardsExcelComponent extends ComponentBase implements OnInit {
	@Output() close = new EventEmitter<void>();

	step: ImportStep = 'upload';
	isDragOver = false;
	fileName = '';
	emailSummary = true;

	previewRows: ExcelImportRow[] = [];
	processedCount = 0;
	progressLog: { label: string; done: boolean; active: boolean }[] = [];
	result: ExcelImportResult = { totalRows: 0, collectionsCreated: 0, batchesCreated: 0, errors: [] };

	constructor(ele: ElementRef) { super(ele); }

	ngOnInit(): void {
		console.log('[IGX-OTT] Import Standards Excel modal opened');
	}

	get stepIndex(): number {
		const steps: ImportStep[] = ['upload', 'preview', 'processing', 'complete'];
		return steps.indexOf(this.step);
	}

	get errorCount(): number {
		return this.previewRows.filter(r => !r.valid).length;
	}

	get uniqueBatches(): number {
		return new Set(this.previewRows.map(r => r.batchId)).size;
	}

	get progressPercent(): number {
		return this.previewRows.length > 0 ? (this.processedCount / this.previewRows.length) * 100 : 0;
	}

	onDragOver(event: DragEvent): void {
		event.preventDefault();
		this.isDragOver = true;
	}

	onFileDrop(event: DragEvent): void {
		event.preventDefault();
		this.isDragOver = false;
		if (event.dataTransfer?.files?.[0]) {
			this.fileName = event.dataTransfer.files[0].name;
		}
	}

	onFileSelect(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files?.[0]) {
			this.fileName = input.files[0].name;
		}
	}

	goToPreview(): void {
		// In production, this would parse the Excel file with SheetJS
		// For demo, generate preview rows
		this.previewRows = [
			{ designation: 'D8332', version: '22', locale: 'es-CL', vendor: 'SDL', batchId: 'RWS-26', valid: true },
			{ designation: 'D8333', version: '23', locale: 'es-CL', vendor: 'SDL', batchId: 'RWS-26', valid: true },
			{ designation: 'D8401', version: '21', locale: 'pt-BR', vendor: 'SDL', batchId: 'RWS-26', valid: true },
			{ designation: 'D8402', version: '22', locale: 'es-CL', vendor: 'SDL', batchId: 'RWS-26', valid: true },
			{ designation: 'D8489', version: '24', locale: 'pt-BR', vendor: 'SDL', batchId: 'RWS-26', valid: true },
		];
		this.step = 'preview';
	}

	startImport(): void {
		this.step = 'processing';
		this.processedCount = 0;
		this.progressLog = [
			{ label: 'Created batch RWS-26', done: false, active: false },
			...this.previewRows.map(r => ({
				label: `ASTM_${r.designation}-${r.version}__${r.locale}`,
				done: false,
				active: false
			}))
		];

		this.simulateProcessing(0);
	}

	onCancel(): void { this.close.emit(); }

	private simulateProcessing(index: number): void {
		if (index >= this.progressLog.length) {
			this.result = {
				totalRows: this.previewRows.length,
				collectionsCreated: this.previewRows.length,
				batchesCreated: this.uniqueBatches,
				errors: []
			};
			this.step = 'complete';
			return;
		}

		this.progressLog[index].active = true;

		setTimeout(() => {
			this.progressLog[index].active = false;
			this.progressLog[index].done = true;
			if (index > 0) this.processedCount++;
			this.simulateProcessing(index + 1);
		}, 400);
	}
}
