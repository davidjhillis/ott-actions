import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';
import { FolderChildItem, TMProject, TranslationSubmission } from '../../../models/translation.model';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

@Component({
	selector: 'app-send-to-translation',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onClose()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<!-- Header -->
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="languages" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Send to Translation</h3>
					</div>
					<button class="close-btn" (click)="onClose()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<!-- Step indicator -->
				<div class="step-bar" *ngIf="step < 4">
					<div class="step-label">Step {{ step }} of 3</div>
					<div class="step-dots">
						<span class="dot" [class.active]="step >= 1" [class.done]="step > 1"></span>
						<span class="dot-line" [class.done]="step > 1"></span>
						<span class="dot" [class.active]="step >= 2" [class.done]="step > 2"></span>
						<span class="dot-line" [class.done]="step > 2"></span>
						<span class="dot" [class.active]="step >= 3"></span>
					</div>
					<div class="step-name">{{ stepName }}</div>
				</div>

				<!-- ═══ STEP 1: Review Files ═══ -->
				<div class="modal-body" *ngIf="step === 1">
					<div class="file-list">
						<div class="file-item" *ngFor="let f of files; let i = index">
							<ott-icon [name]="f.isFolder ? 'folder' : (f.type === 'DXML' ? 'file-text' : 'file')" [size]="14" color="var(--ott-text-secondary)"></ott-icon>
							<span class="file-name">{{ f.name }}</span>
							<span class="file-type">{{ f.type }}</span>
							<button class="remove-btn" (click)="removeFile(i)" title="Remove">
								<ott-icon name="x" [size]="14"></ott-icon>
							</button>
						</div>
						<div class="empty-state" *ngIf="files.length === 0">
							<ott-icon name="file-search" [size]="20" color="var(--ott-text-muted)"></ott-icon>
							<span>No files selected. Select files in the Contents tab first.</span>
						</div>
					</div>
					<div class="file-count" *ngIf="files.length > 0">
						{{ files.length }} file{{ files.length !== 1 ? 's' : '' }} selected
					</div>
				</div>

				<!-- ═══ STEP 2: Choose Project ═══ -->
				<div class="modal-body" *ngIf="step === 2">
					<div class="picker-tabs">
						<button class="picker-tab" [class.active]="projectMode === 'existing'" (click)="projectMode = 'existing'">
							Add to Existing
						</button>
						<button class="picker-tab" [class.active]="projectMode === 'new'" (click)="projectMode = 'new'">
							Create New
						</button>
					</div>

					<!-- Existing projects list -->
					<div class="project-list" *ngIf="projectMode === 'existing'">
						<label class="project-card" *ngFor="let proj of tmProjects"
							[class.selected]="selectedProjectId === proj.id"
							(click)="selectedProjectId = proj.id">
							<input type="radio" name="project" [value]="proj.id" [checked]="selectedProjectId === proj.id">
							<div class="project-info">
								<span class="project-name">{{ proj.name }}</span>
								<span class="project-meta">
									{{ proj.vendor }} &middot; {{ proj.itemCount }} items
									<span *ngIf="proj.dueDate"> &middot; Due {{ proj.dueDate }}</span>
								</span>
								<span class="project-locale">{{ proj.locale }} &mdash; {{ proj.language }}</span>
							</div>
						</label>
						<div class="empty-state" *ngIf="tmProjects.length === 0">
							<span>No open projects available.</span>
						</div>
					</div>

					<!-- Create new project form -->
					<div class="new-project-form" *ngIf="projectMode === 'new'">
						<div class="form-group">
							<label class="form-label">Project Name</label>
							<input class="form-input" type="text" [(ngModel)]="newProjectName" placeholder="e.g., pt-BR Q1 2026 Batch">
						</div>
						<div class="form-group">
							<label class="form-label">Target Language</label>
							<select class="form-input" [(ngModel)]="newProjectLocale">
								<option value="">Select language...</option>
								<option value="pt-BR">pt-BR &mdash; Brazilian Portuguese</option>
								<option value="es-CL">es-CL &mdash; Chilean Spanish</option>
								<option value="ja-JP">ja-JP &mdash; Japanese</option>
								<option value="de-DE">de-DE &mdash; German</option>
								<option value="fr-FR">fr-FR &mdash; French</option>
								<option value="zh-CN">zh-CN &mdash; Chinese (Simplified)</option>
								<option value="ko-KR">ko-KR &mdash; Korean</option>
							</select>
						</div>
						<div class="form-group">
							<label class="form-label">Vendor</label>
							<select class="form-input" [(ngModel)]="newProjectVendor">
								<option value="">Select vendor...</option>
								<option value="SDL">SDL</option>
								<option value="Lionbridge">Lionbridge</option>
								<option value="XTM">XTM</option>
								<option value="RWS">RWS</option>
							</select>
						</div>
						<div class="form-group">
							<label class="form-label">Due Date</label>
							<input class="form-input" type="date" [(ngModel)]="newProjectDueDate">
						</div>
					</div>
				</div>

				<!-- ═══ STEP 3: Confirm & Submit ═══ -->
				<div class="modal-body" *ngIf="step === 3">
					<div class="summary-card">
						<div class="summary-row">
							<span class="summary-label">Project</span>
							<span class="summary-value">{{ summaryProjectName }}</span>
						</div>
						<div class="summary-row">
							<span class="summary-label">Vendor</span>
							<span class="summary-value">{{ summaryVendor }}</span>
						</div>
						<div class="summary-row">
							<span class="summary-label">Target</span>
							<span class="summary-value">{{ summaryLocale }}</span>
						</div>
						<div class="summary-row">
							<span class="summary-label">Files</span>
							<span class="summary-value">{{ files.length }}</span>
						</div>
						<div class="summary-row" *ngIf="summaryDueDate">
							<span class="summary-label">Due Date</span>
							<span class="summary-value">{{ summaryDueDate }}</span>
						</div>
					</div>

					<div class="summary-files">
						<div class="summary-file" *ngFor="let f of files">
							<ott-icon [name]="f.isFolder ? 'folder' : 'file-text'" [size]="13" color="var(--ott-text-secondary)"></ott-icon>
							<span>{{ f.name }}</span>
						</div>
					</div>
				</div>

				<!-- ═══ STEP 4: Success ═══ -->
				<div class="modal-body success-body" *ngIf="step === 4">
					<div class="success-icon">
						<ott-icon name="check-circle" [size]="40" color="#22c55e"></ott-icon>
					</div>
					<h4 class="success-title">Submitted Successfully</h4>
					<p class="success-detail">
						{{ files.length }} file{{ files.length !== 1 ? 's' : '' }} added to
						"{{ summaryProjectName }}" and submitted for translation.
					</p>
					<a class="tm-link" *ngIf="tmAppUrl" [href]="tmAppUrl" target="_blank" rel="noopener">
						<ott-icon name="external-link" [size]="14"></ott-icon>
						View in Translation Manager
					</a>
				</div>

				<!-- Submitting spinner overlay -->
				<div class="submitting-overlay" *ngIf="submitting">
					<div class="spinner"></div>
					<span>Submitting to Translation Manager...</span>
				</div>

				<!-- Footer -->
				<div class="modal-footer">
					<ng-container *ngIf="step === 1">
						<button class="btn btn-secondary" (click)="onClose()">Cancel</button>
						<button class="btn btn-primary" (click)="step = 2" [disabled]="files.length === 0">
							Next
							<ott-icon name="arrow-right" [size]="14"></ott-icon>
						</button>
					</ng-container>

					<ng-container *ngIf="step === 2">
						<button class="btn btn-secondary" (click)="step = 1">
							<ott-icon name="arrow-left" [size]="14"></ott-icon>
							Back
						</button>
						<button class="btn btn-primary" (click)="step = 3" [disabled]="!canProceedFromStep2">
							Next
							<ott-icon name="arrow-right" [size]="14"></ott-icon>
						</button>
					</ng-container>

					<ng-container *ngIf="step === 3">
						<button class="btn btn-secondary" (click)="step = 2">
							<ott-icon name="arrow-left" [size]="14"></ott-icon>
							Back
						</button>
						<button class="btn btn-primary" (click)="onSubmit()" [disabled]="submitting">
							<ott-icon name="send" [size]="14"></ott-icon>
							Submit
						</button>
					</ng-container>

					<ng-container *ngIf="step === 4">
						<div style="flex:1"></div>
						<button class="btn btn-primary" (click)="onClose()">Done</button>
					</ng-container>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; }

		/* Overlay + Dialog */
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
			width: 540px; max-height: 80vh;
			display: flex; flex-direction: column;
			position: relative;
		}

		/* Header */
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

		/* Step bar */
		.step-bar {
			display: flex; align-items: center; gap: 10px;
			padding: 10px 20px;
			border-bottom: 1px solid var(--ott-border-light);
			background: var(--ott-bg-muted);
		}
		.step-label {
			font-size: 11px; font-weight: 600; color: var(--ott-text-muted);
			text-transform: uppercase; letter-spacing: 0.4px;
			white-space: nowrap;
		}
		.step-dots {
			display: flex; align-items: center; gap: 0;
		}
		.dot {
			width: 8px; height: 8px;
			border-radius: 50%;
			background: var(--ott-border);
			transition: all 0.2s;
		}
		.dot.active { background: var(--ott-primary); }
		.dot.done { background: #22c55e; }
		.dot-line {
			width: 20px; height: 2px;
			background: var(--ott-border);
			transition: background 0.2s;
		}
		.dot-line.done { background: #22c55e; }
		.step-name {
			flex: 1; text-align: right;
			font-size: 12px; font-weight: 500; color: var(--ott-text-secondary);
		}

		/* Body */
		.modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }

		/* Step 1: File list */
		.file-list {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			overflow: hidden; max-height: 300px; overflow-y: auto;
		}
		.file-item {
			display: flex; align-items: center; gap: 8px;
			padding: 9px 12px;
			border-bottom: 1px solid var(--ott-border-light);
			font-size: 13px;
		}
		.file-item:last-child { border-bottom: none; }
		.file-name {
			flex: 1; color: var(--ott-text);
			overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.file-type {
			font-size: 10px; font-weight: 600;
			padding: 2px 6px; border-radius: var(--ott-radius-sm);
			background: var(--ott-bg-subtle); color: var(--ott-text-muted);
			text-transform: uppercase;
		}
		.remove-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 2px;
			border-radius: var(--ott-radius-sm);
		}
		.remove-btn:hover { color: var(--ott-danger); }
		.file-count {
			font-size: 12px; color: var(--ott-text-muted);
			margin-top: 8px;
		}
		.empty-state {
			display: flex; flex-direction: column; align-items: center; gap: 6px;
			padding: 24px; color: var(--ott-text-muted); font-size: 13px;
			text-align: center;
		}

		/* Step 2: Project picker tabs */
		.picker-tabs {
			display: flex; gap: 0; margin-bottom: 12px;
			border: 1px solid var(--ott-border-light); border-radius: var(--ott-radius-sm);
			overflow: hidden;
		}
		.picker-tab {
			flex: 1; padding: 8px 12px; border: none;
			background: var(--ott-bg-muted); cursor: pointer;
			font-size: 13px; font-family: var(--ott-font);
			font-weight: 500; color: var(--ott-text-muted);
			transition: all 0.12s;
		}
		.picker-tab.active { background: var(--ott-bg); color: var(--ott-text); font-weight: 600; }
		.picker-tab:not(:last-child) { border-right: 1px solid var(--ott-border-light); }

		/* Project cards */
		.project-list { display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; }
		.project-card {
			display: flex; align-items: flex-start; gap: 10px;
			padding: 10px 12px; cursor: pointer;
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			transition: all 0.12s;
		}
		.project-card:hover { border-color: var(--ott-border); background: var(--ott-bg-muted); }
		.project-card.selected { border-color: var(--ott-primary); background: var(--ott-primary-light); }
		.project-card input[type="radio"] { margin-top: 3px; }
		.project-info { display: flex; flex-direction: column; gap: 2px; }
		.project-name { font-size: 13px; font-weight: 600; color: var(--ott-text); }
		.project-meta { font-size: 11px; color: var(--ott-text-muted); }
		.project-locale { font-size: 11px; color: var(--ott-text-secondary); }

		/* New project form */
		.new-project-form { display: flex; flex-direction: column; gap: 12px; }
		.form-group { display: flex; flex-direction: column; gap: 4px; }
		.form-label {
			font-size: 12px; font-weight: 600; color: var(--ott-text-secondary);
		}
		.form-input {
			padding: 8px 10px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-size: 13px; font-family: var(--ott-font);
			color: var(--ott-text); background: var(--ott-bg);
			transition: border-color 0.15s;
		}
		.form-input:focus { outline: none; border-color: var(--ott-primary); }

		/* Step 3: Summary */
		.summary-card {
			padding: 12px 14px;
			background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-lg);
			border: 1px solid var(--ott-border-light);
			margin-bottom: 12px;
		}
		.summary-row {
			display: flex; gap: 12px; padding: 4px 0;
		}
		.summary-label {
			font-size: 11px; font-weight: 600; text-transform: uppercase;
			color: var(--ott-text-muted); letter-spacing: 0.4px;
			min-width: 64px;
		}
		.summary-value { font-size: 13px; font-weight: 500; color: var(--ott-text); }
		.summary-files {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			overflow: hidden;
		}
		.summary-file {
			display: flex; align-items: center; gap: 8px;
			padding: 7px 12px; font-size: 13px; color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.summary-file:last-child { border-bottom: none; }

		/* Step 4: Success */
		.success-body {
			display: flex; flex-direction: column; align-items: center;
			padding: 32px 20px; text-align: center;
		}
		.success-icon { margin-bottom: 12px; }
		.success-title {
			margin: 0 0 8px; font-size: 16px; font-weight: 600; color: var(--ott-text);
		}
		.success-detail {
			margin: 0 0 16px; font-size: 13px; color: var(--ott-text-secondary);
			line-height: 1.5; max-width: 320px;
		}
		.tm-link {
			display: inline-flex; align-items: center; gap: 6px;
			padding: 8px 16px; border-radius: var(--ott-radius-md);
			background: var(--ott-bg-muted);
			border: 1px solid var(--ott-border-light);
			color: var(--ott-primary); font-size: 13px; font-weight: 500;
			text-decoration: none; transition: all 0.15s;
		}
		.tm-link:hover {
			background: var(--ott-primary-light);
			border-color: var(--ott-primary);
		}

		/* Submitting overlay */
		.submitting-overlay {
			position: absolute; inset: 0;
			background: rgba(255,255,255,0.85);
			display: flex; flex-direction: column;
			align-items: center; justify-content: center; gap: 12px;
			z-index: 5; border-radius: var(--ott-radius-xl);
			font-size: 13px; color: var(--ott-text-secondary);
		}
		.spinner {
			width: 28px; height: 28px;
			border: 3px solid var(--ott-border-light);
			border-top-color: var(--ott-primary);
			border-radius: 50%;
			animation: spin 0.7s linear infinite;
		}
		@keyframes spin { to { transform: rotate(360deg); } }

		/* Footer */
		.modal-footer {
			display: flex; align-items: center; gap: 8px;
			padding: 14px 20px;
			border-top: 1px solid var(--ott-border-light);
			justify-content: flex-end;
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
export class SendToTranslationComponent extends ComponentBase implements OnInit {
	@Input() context?: AssetContext;
	@Input() selectedItems: FolderChildItem[] = [];
	@Input() tmProjects: TMProject[] = [];

	@Output() close = new EventEmitter<void>();
	@Output() submitted = new EventEmitter<TranslationSubmission>();

	step = 1;
	files: FolderChildItem[] = [];
	submitting = false;

	// Step 2 state
	projectMode: 'existing' | 'new' = 'existing';
	selectedProjectId: string | null = null;

	// New project form
	newProjectName = '';
	newProjectLocale = '';
	newProjectVendor = '';
	newProjectDueDate = '';

	// Resolved after submit
	tmAppUrl = '';

	constructor(ele: ElementRef) { super(ele); }

	ngOnInit(): void {
		this.files = [...this.selectedItems];
		console.log(`[IGX-OTT] Send to Translation modal opened with ${this.files.length} files`);
	}

	get stepName(): string {
		switch (this.step) {
			case 1: return 'Selected Files';
			case 2: return 'Translation Project';
			case 3: return 'Review & Submit';
			default: return '';
		}
	}

	get canProceedFromStep2(): boolean {
		if (this.projectMode === 'existing') {
			return this.selectedProjectId !== null;
		}
		return this.newProjectName.trim().length > 0
			&& this.newProjectLocale.length > 0
			&& this.newProjectVendor.length > 0;
	}

	get selectedProject(): TMProject | undefined {
		return this.tmProjects.find(p => p.id === this.selectedProjectId);
	}

	get summaryProjectName(): string {
		if (this.projectMode === 'existing') {
			return this.selectedProject?.name || '';
		}
		return this.newProjectName;
	}

	get summaryVendor(): string {
		if (this.projectMode === 'existing') {
			return this.selectedProject?.vendor || '';
		}
		return this.newProjectVendor;
	}

	get summaryLocale(): string {
		if (this.projectMode === 'existing') {
			return this.selectedProject?.locale || '';
		}
		return this.newProjectLocale;
	}

	get summaryDueDate(): string {
		if (this.projectMode === 'existing') {
			return this.selectedProject?.dueDate || '';
		}
		return this.newProjectDueDate;
	}

	removeFile(index: number): void {
		this.files.splice(index, 1);
	}

	onSubmit(): void {
		this.submitting = true;

		const submission: TranslationSubmission = {
			files: this.files,
			projectId: this.projectMode === 'existing' ? this.selectedProjectId : null,
			projectName: this.summaryProjectName,
			vendor: this.summaryVendor,
			locale: this.summaryLocale,
			dueDate: this.summaryDueDate || undefined,
			isNewProject: this.projectMode === 'new'
		};

		// Resolve TM app URL
		if (this.projectMode === 'existing' && this.selectedProject?.tmAppUrl) {
			this.tmAppUrl = this.selectedProject.tmAppUrl;
		} else {
			this.tmAppUrl = 'https://tm.ingeniux.com/projects';
		}

		// Simulate submission delay (demo mode)
		setTimeout(() => {
			this.submitting = false;
			this.step = 4;
			this.submitted.emit(submission);
			console.log('[IGX-OTT] Translation submission:', submission);
		}, 1500);
	}

	onClose(): void {
		this.close.emit();
	}
}
