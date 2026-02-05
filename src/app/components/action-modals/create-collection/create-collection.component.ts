import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';
import { CMSCommunicationsService } from '../../../services/cms-communications.service';
import { NotificationService } from '../../../services/notification.service';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

@Component({
	selector: 'app-create-collection',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="folder-plus" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Create Collection</h3>
					</div>
					<button class="close-btn" (click)="onCancel()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<div class="modal-body">
					<!-- Parent info -->
					<div class="info-card">
						<div class="info-label">Parent Location</div>
						<div class="info-path">
							<ott-icon name="folder" [size]="14" color="var(--ott-primary)"></ott-icon>
							{{ context?.path || '/Standards/Quality' }}
						</div>
					</div>

					<!-- Name -->
					<div class="form-group">
						<label>Collection Name <span class="required">*</span></label>
						<input type="text" [(ngModel)]="collectionName" placeholder="Enter collection name..."
							(input)="updateSlug()">
						<div class="slug-preview" *ngIf="collectionName">
							URL: {{ context?.path || '/Standards/Quality' }}/{{ slug }}
						</div>
					</div>

					<!-- Schema -->
					<div class="form-group">
						<label>Schema / Type</label>
						<select [(ngModel)]="selectedSchema">
							<option *ngFor="let s of schemas" [value]="s.value">{{ s.label }}</option>
						</select>
					</div>

					<!-- Description -->
					<div class="form-group">
						<label>Description</label>
						<textarea [(ngModel)]="description" rows="3" placeholder="Optional description..."></textarea>
					</div>

					<!-- Options -->
					<div class="options-section">
						<label class="option-item">
							<input type="checkbox" [(ngModel)]="inheritPermissions">
							Inherit parent permissions
						</label>
						<label class="option-item">
							<input type="checkbox" [(ngModel)]="createIndex">
							Create index page
						</label>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn btn-secondary" (click)="onCancel()" [disabled]="saving">Cancel</button>
					<button class="btn btn-primary" (click)="onCreate()" [disabled]="!collectionName.trim() || saving">
						<ott-icon [name]="saving ? 'loader' : 'folder-plus'" [size]="14"></ott-icon>
						{{ saving ? 'Creating...' : 'Create' }}
					</button>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; }
		.modal-overlay {
			position: fixed; top: 0; left: 0; right: 0; bottom: 0;
			background: rgba(0,0,0,0.4); display: flex;
			align-items: center; justify-content: center;
			z-index: 10000; font-family: var(--ott-font);
		}
		.modal-dialog {
			background: var(--ott-bg); border-radius: var(--ott-radius-xl);
			box-shadow: var(--ott-shadow-xl); border: 1px solid var(--ott-border);
			width: 480px; max-height: 80vh; display: flex; flex-direction: column;
		}
		.modal-header {
			display: flex; align-items: center; justify-content: space-between;
			padding: 16px 20px; border-bottom: 1px solid var(--ott-border-light);
		}
		.header-title { display: flex; align-items: center; gap: 8px; }
		.modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--ott-text); }
		.close-btn {
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 4px;
			border-radius: var(--ott-radius-sm);
			transition: color 0.15s, background-color 0.15s;
		}
		.close-btn:hover { color: var(--ott-text); background: var(--ott-bg-hover); }
		.modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }

		.info-card {
			padding: 12px; background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-lg); border: 1px solid var(--ott-border-light);
			margin-bottom: 16px;
		}
		.info-label {
			font-size: 11px; font-weight: 600; text-transform: uppercase;
			color: var(--ott-text-muted); letter-spacing: 0.5px; margin-bottom: 6px;
		}
		.info-path {
			display: flex; align-items: center; gap: 6px;
			font-size: 13px; color: var(--ott-text);
			font-family: var(--ott-font-mono);
		}

		.form-group { margin-bottom: 14px; }
		.form-group label {
			display: block; font-size: 12px; font-weight: 500;
			color: var(--ott-text-secondary); margin-bottom: 5px;
		}
		.required { color: var(--ott-danger); }
		input[type="text"], textarea, select {
			width: 100%; padding: 7px 10px; border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md); font-size: 13px;
			font-family: var(--ott-font); box-sizing: border-box;
			color: var(--ott-text); background: var(--ott-bg);
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		input:focus, textarea:focus, select:focus {
			outline: none; border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
		}
		textarea { resize: vertical; min-height: 60px; }
		.slug-preview {
			font-size: 11px; color: var(--ott-text-muted);
			font-family: var(--ott-font-mono); margin-top: 4px; padding: 4px 0;
		}

		.options-section { border-top: 1px solid var(--ott-border-light); padding-top: 12px; }
		.option-item {
			display: flex; align-items: center; gap: 8px;
			padding: 5px 0; font-size: 13px; cursor: pointer; color: var(--ott-text);
		}

		.modal-footer {
			display: flex; gap: 8px; padding: 14px 20px;
			border-top: 1px solid var(--ott-border-light); justify-content: flex-end;
		}
		.btn {
			padding: 8px 16px; border-radius: var(--ott-radius-md);
			font-size: 13px; font-family: var(--ott-font); font-weight: 500;
			cursor: pointer; border: 1px solid var(--ott-border);
			display: inline-flex; align-items: center; gap: 6px;
			transition: background-color 0.15s, border-color 0.15s;
		}
		.btn-secondary { background: var(--ott-bg); color: var(--ott-text); }
		.btn-secondary:hover { background: var(--ott-bg-hover); }
		.btn-primary { background: var(--ott-primary); color: #fff; border-color: var(--ott-primary); }
		.btn-primary:hover { background: var(--ott-primary-hover); }
		.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	`]
})
export class CreateCollectionComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();
	@Input() context?: AssetContext;

	collectionName = '';
	slug = '';
	selectedSchema = 'StandardsCollection';
	description = '';
	inheritPermissions = true;
	createIndex = true;
	saving = false;

	schemas = [
		{ value: 'StandardsCollection', label: 'Standards Collection' },
		{ value: 'DocumentLibrary', label: 'Document Library' },
		{ value: 'ReportBundle', label: 'Report Bundle' },
		{ value: 'ReviewPackage', label: 'Review Package' },
		{ value: 'GenericFolder', label: 'Generic Folder' },
	];

	constructor(
		ele: ElementRef,
		private cms: CMSCommunicationsService,
		private notify: NotificationService
	) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] Create Collection modal opened');
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	updateSlug(): void {
		this.slug = this.collectionName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	onCancel(): void {
		this.close.emit();
	}

	onCreate(): void {
		if (this.saving) return;
		this.saving = true;
		const parentId = this.context?.id || 'x312';
		const loader = this.notify.loading(`Creating "${this.collectionName}"...`);

		this.cms.callService<any>({
			service: 'SiteTreeServices',
			action: 'CreateNewPage',
			args: [parentId, this.collectionName, this.selectedSchema, this.createIndex],
			postCall: 'refreshTree'
		}).subscribe({
			next: (result) => {
				console.log(`[IGX-OTT] Collection created: ${this.collectionName}`, result);
				loader.success(`Collection "${this.collectionName}" created`);
				this.close.emit();
			},
			error: () => {
				if (this.cms.isDevMode) {
					loader.dismiss();
					this.notify.info(`Dev mode: Would create "${this.collectionName}" under ${parentId}`);
					this.close.emit();
				} else {
					loader.error(`Failed to create "${this.collectionName}"`);
					this.saving = false;
				}
			}
		});
	}
}
