import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

interface UploadFile {
	name: string;
	size: string;
	file?: File;
}

@Component({
	selector: 'app-upload-source-files',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="upload" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Upload Source Files</h3>
					</div>
					<button class="close-btn" (click)="onCancel()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<div class="modal-body">
					<div class="info-card">
						<div class="info-row">
							<span class="info-label">Standard</span>
							<span class="info-value">{{ context?.name || 'E0008_E0008M-25' }}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Languages</span>
							<span class="info-value">es-CL (SDL), pt-BR (SDL)</span>
						</div>
					</div>

					<!-- Drop zone -->
					<div class="drop-zone"
						[class.drag-over]="isDragOver"
						(dragover)="onDragOver($event)"
						(dragleave)="isDragOver = false"
						(drop)="onFileDrop($event)">
						<ott-icon name="upload" [size]="24" color="var(--ott-text-muted)"></ott-icon>
						<span class="drop-text">Drag & drop files or <button class="browse-btn" (click)="fileInput.click()">Browse</button></span>
						<span class="drop-hint">.doc .rtf .pdf .htm .dxml</span>
						<input #fileInput type="file" multiple accept=".doc,.docx,.rtf,.pdf,.htm,.html,.dxml,.xml" (change)="onFileSelect($event)" hidden>
					</div>

					<!-- File list -->
					<div class="file-list" *ngIf="files.length > 0">
						<div class="file-item" *ngFor="let f of files; let i = index">
							<ott-icon name="file-text" [size]="14" color="var(--ott-text-secondary)"></ott-icon>
							<span class="file-name">{{ f.name }}</span>
							<span class="file-size">{{ f.size }}</span>
							<button class="remove-btn" (click)="removeFile(i)">
								<ott-icon name="x" [size]="14"></ott-icon>
							</button>
						</div>
					</div>

					<!-- Options -->
					<div class="options">
						<label class="checkbox-item">
							<input type="checkbox" [(ngModel)]="autoCreateCollections">
							Auto-create Translated Standard Collections
						</label>
						<label class="checkbox-item">
							<input type="checkbox" [(ngModel)]="addToBatch">
							Add to weekly Translation Batch
						</label>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
					<button class="btn btn-primary" (click)="onUpload()" [disabled]="files.length === 0">
						<ott-icon name="upload" [size]="14"></ott-icon>
						Upload & Process
					</button>
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
			width: 520px;
			max-height: 80vh;
			display: flex; flex-direction: column;
		}
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

		.info-card {
			padding: 10px 14px; background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-lg); border: 1px solid var(--ott-border-light);
			margin-bottom: 14px;
		}
		.info-row { display: flex; gap: 10px; margin-bottom: 4px; }
		.info-row:last-child { margin-bottom: 0; }
		.info-label {
			font-size: 11px; font-weight: 600; text-transform: uppercase;
			color: var(--ott-text-muted); letter-spacing: 0.4px; min-width: 70px;
		}
		.info-value { font-size: 13px; color: var(--ott-text); }

		/* Drop zone */
		.drop-zone {
			border: 2px dashed var(--ott-border);
			border-radius: var(--ott-radius-lg);
			padding: 24px;
			text-align: center;
			display: flex; flex-direction: column; align-items: center; gap: 6px;
			transition: all 0.15s;
			margin-bottom: 12px;
		}
		.drop-zone.drag-over {
			border-color: var(--ott-primary);
			background: var(--ott-primary-light);
		}
		.drop-text { font-size: 13px; color: var(--ott-text-secondary); }
		.drop-hint { font-size: 11px; color: var(--ott-text-muted); }
		.browse-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-primary); font-size: 13px; font-family: var(--ott-font);
			text-decoration: underline; padding: 0;
		}

		/* File list */
		.file-list {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			margin-bottom: 12px; overflow: hidden;
		}
		.file-item {
			display: flex; align-items: center; gap: 8px;
			padding: 8px 12px;
			border-bottom: 1px solid var(--ott-border-light);
			font-size: 13px;
		}
		.file-item:last-child { border-bottom: none; }
		.file-name { flex: 1; color: var(--ott-text); }
		.file-size { font-size: 12px; color: var(--ott-text-muted); font-family: var(--ott-font-mono); }
		.remove-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 2px;
			border-radius: var(--ott-radius-sm);
		}
		.remove-btn:hover { color: var(--ott-danger); }

		/* Options */
		.options { display: flex; flex-direction: column; gap: 6px; }
		.checkbox-item {
			display: flex; align-items: center; gap: 8px;
			font-size: 13px; color: var(--ott-text); cursor: pointer;
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
export class UploadSourceFilesComponent extends ComponentBase implements OnInit {
	@Output() close = new EventEmitter<void>();
	@Input() context?: AssetContext;

	files: UploadFile[] = [];
	isDragOver = false;
	autoCreateCollections = true;
	addToBatch = true;

	constructor(ele: ElementRef) { super(ele); }

	ngOnInit(): void {
		console.log('[IGX-OTT] Upload Source Files modal opened');
	}

	onDragOver(event: DragEvent): void {
		event.preventDefault();
		this.isDragOver = true;
	}

	onFileDrop(event: DragEvent): void {
		event.preventDefault();
		this.isDragOver = false;
		if (event.dataTransfer?.files) {
			this.addFiles(event.dataTransfer.files);
		}
	}

	onFileSelect(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			this.addFiles(input.files);
		}
	}

	removeFile(index: number): void {
		this.files.splice(index, 1);
	}

	onCancel(): void { this.close.emit(); }

	onUpload(): void {
		console.log(`[IGX-OTT] Uploading ${this.files.length} files`, {
			autoCreateCollections: this.autoCreateCollections,
			addToBatch: this.addToBatch
		});
		this.close.emit();
	}

	private addFiles(fileList: FileList): void {
		for (let i = 0; i < fileList.length; i++) {
			const f = fileList[i];
			this.files.push({
				name: f.name,
				size: this.formatSize(f.size),
				file: f
			});
		}
	}

	private formatSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
}
