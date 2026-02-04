import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';
import { CMSCommunicationsService } from '../../../services/cms-communications.service';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

interface ContentItem {
	id: string;
	name: string;
	schema: string;
	selected: boolean;
}

@Component({
	selector: 'app-export-collection',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="download" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Export Collection</h3>
					</div>
					<button class="close-btn" (click)="onCancel()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<div class="modal-body">
					<!-- Folder info -->
					<div class="info-card">
						<div class="info-label">Collection</div>
						<div class="info-name">{{ context?.name || 'N/A' }}</div>
						<div class="info-meta">{{ items.length }} items</div>
					</div>

					<!-- Format selection -->
					<div class="section">
						<div class="section-header">
							<ott-icon name="file-type" [size]="14"></ott-icon>
							Export Format
						</div>
						<div class="format-options">
							<label class="format-option" *ngFor="let fmt of formats"
								[class.selected]="selectedFormat === fmt.value">
								<input type="radio" name="format" [value]="fmt.value"
									[(ngModel)]="selectedFormat">
								<ott-icon [name]="fmt.icon" [size]="16"></ott-icon>
								<div>
									<div class="format-name">{{ fmt.label }}</div>
									<div class="format-desc">{{ fmt.description }}</div>
								</div>
							</label>
						</div>
					</div>

					<!-- Include options -->
					<div class="section">
						<div class="section-header">
							<ott-icon name="settings-2" [size]="14"></ott-icon>
							Include
						</div>
						<div class="options-grid">
							<label class="option-item">
								<input type="checkbox" [(ngModel)]="includeMetadata">
								Metadata
							</label>
							<label class="option-item">
								<input type="checkbox" [(ngModel)]="includeHistory">
								Version History
							</label>
							<label class="option-item">
								<input type="checkbox" [(ngModel)]="includeTranslations">
								Translations
							</label>
							<label class="option-item">
								<input type="checkbox" [(ngModel)]="includeAttachments">
								Attachments
							</label>
						</div>
					</div>

					<!-- Content preview -->
					<div class="section">
						<div class="section-header">
							<ott-icon name="list" [size]="14"></ott-icon>
							Content ({{ selectedItemCount }}/{{ items.length }})
						</div>
						<div class="item-list">
							<label class="item-row" *ngFor="let item of items">
								<input type="checkbox" [(ngModel)]="item.selected">
								<span class="item-name">{{ item.name }}</span>
								<span class="item-schema">{{ item.schema }}</span>
							</label>
						</div>
					</div>
				</div>

				<div class="modal-footer">
					<span class="selected-count" *ngIf="selectedItemCount > 0">
						{{ selectedItemCount }} item{{ selectedItemCount !== 1 ? 's' : '' }} selected
					</span>
					<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
					<button class="btn btn-primary" (click)="onExport()" [disabled]="selectedItemCount === 0">
						<ott-icon name="download" [size]="14"></ott-icon>
						Export {{ selectedFormat.toUpperCase() }}
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
			width: 520px; max-height: 80vh; display: flex; flex-direction: column;
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
			color: var(--ott-text-muted); letter-spacing: 0.5px; margin-bottom: 4px;
		}
		.info-name { font-size: 14px; font-weight: 600; color: var(--ott-text); }
		.info-meta { font-size: 12px; color: var(--ott-text-muted); margin-top: 2px; }

		.section { margin-bottom: 16px; }
		.section-header {
			display: flex; align-items: center; gap: 6px;
			font-size: 12px; font-weight: 600; color: var(--ott-text-secondary);
			text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
		}

		.format-options { display: flex; flex-direction: column; gap: 6px; }
		.format-option {
			display: flex; align-items: center; gap: 10px;
			padding: 10px 12px; border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md); cursor: pointer;
			transition: border-color 0.15s, background-color 0.15s;
		}
		.format-option:hover { background: var(--ott-bg-muted); }
		.format-option.selected {
			border-color: var(--ott-primary); background: var(--ott-primary-light);
		}
		.format-option input[type="radio"] { display: none; }
		.format-name { font-size: 13px; font-weight: 600; color: var(--ott-text); }
		.format-desc { font-size: 11px; color: var(--ott-text-muted); }

		.options-grid {
			display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
		}
		.option-item {
			display: flex; align-items: center; gap: 8px;
			padding: 6px 10px; font-size: 13px; cursor: pointer;
			color: var(--ott-text); border-radius: var(--ott-radius-sm);
			transition: background-color 0.12s;
		}
		.option-item:hover { background: var(--ott-bg-muted); }

		.item-list {
			max-height: 160px; overflow-y: auto;
			border: 1px solid var(--ott-border-light); border-radius: var(--ott-radius-md);
		}
		.item-row {
			display: flex; align-items: center; gap: 8px;
			padding: 7px 12px; font-size: 13px; cursor: pointer;
			border-bottom: 1px solid var(--ott-border-light);
			color: var(--ott-text); transition: background-color 0.12s;
		}
		.item-row:last-child { border-bottom: none; }
		.item-row:hover { background: var(--ott-bg-muted); }
		.item-name { flex: 1; }
		.item-schema { font-size: 11px; color: var(--ott-text-muted); }

		.modal-footer {
			display: flex; align-items: center; gap: 8px;
			padding: 14px 20px; border-top: 1px solid var(--ott-border-light);
		}
		.selected-count { flex: 1; font-size: 12px; color: var(--ott-text-secondary); }
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
export class ExportCollectionComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();
	@Input() context?: AssetContext;

	formats = [
		{ value: 'xml', label: 'XML', icon: 'file-code', description: 'Structured XML with full schema' },
		{ value: 'json', label: 'JSON', icon: 'braces', description: 'JSON format for integrations' },
		{ value: 'csv', label: 'CSV', icon: 'table', description: 'Spreadsheet-compatible format' },
	];
	selectedFormat = 'xml';

	includeMetadata = true;
	includeHistory = false;
	includeTranslations = false;
	includeAttachments = false;

	items: ContentItem[] = [];

	constructor(
		ele: ElementRef,
		private cms: CMSCommunicationsService
	) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] Export Collection modal opened');
		this.loadContents();
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	get selectedItemCount(): number {
		return this.items.filter(i => i.selected).length;
	}

	private loadContents(): void {
		if (!this.context) {
			this.loadDemoData();
			return;
		}

		this.cms.callService<any[]>({
			service: 'SiteTreeServices',
			action: 'GetChildPagesSimple',
			args: [this.context.id]
		}).subscribe({
			next: (pages) => {
				this.items = (pages || []).map(p => ({
					id: p.ID, name: p.Name, schema: p.Schema || 'Page', selected: true
				}));
			},
			error: () => this.loadDemoData()
		});
	}

	private loadDemoData(): void {
		this.items = [
			{ id: 'x313', name: 'Draft-v3.2.docx', schema: 'Document', selected: true },
			{ id: 'x314', name: 'Appendix-A.pdf', schema: 'Document', selected: true },
			{ id: 'x315', name: 'Review-Comments', schema: 'Folder', selected: true },
			{ id: 'x316', name: 'Supporting-Data.xlsx', schema: 'Spreadsheet', selected: true },
			{ id: 'x317', name: 'Cover-Letter.docx', schema: 'Document', selected: true },
			{ id: 'x318', name: 'Compliance-Checklist.pdf', schema: 'Document', selected: true },
		];
	}

	onCancel(): void {
		this.close.emit();
	}

	onExport(): void {
		const selected = this.items.filter(i => i.selected);
		console.log(`[IGX-OTT] Exporting ${selected.length} items as ${this.selectedFormat.toUpperCase()}`);
		this.close.emit();
	}
}
