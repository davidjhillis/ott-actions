import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';
import { CMSCommunicationsService } from '../../../services/cms-communications.service';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

@Component({
	selector: 'app-assign-report-number',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="hash" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Assign Report Number</h3>
					</div>
					<button class="close-btn" (click)="onCancel()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<div class="modal-body">
					<!-- Current info -->
					<div class="info-card">
						<div class="info-label">Current Asset</div>
						<div class="info-name">{{ context?.name || 'N/A' }}</div>
						<div class="info-path">{{ context?.path || '' }}</div>
					</div>

					<div class="current-number" *ngIf="currentNumber">
						<div class="info-label">Current Number</div>
						<div class="number-display">{{ currentNumber }}</div>
					</div>

					<!-- New number input -->
					<div class="section">
						<div class="section-header">
							<ott-icon name="edit-3" [size]="14"></ott-icon>
							New Report Number
						</div>
						<div class="number-input-row">
							<div class="form-group prefix-group">
								<label>Prefix</label>
								<input type="text" [(ngModel)]="prefix" placeholder="RPT" class="input-sm">
							</div>
							<div class="form-group number-group">
								<label>Number</label>
								<input type="text" [(ngModel)]="reportNumber" placeholder="2025-0042" class="input-lg">
							</div>
							<button class="btn btn-icon" (click)="autoGenerate()" title="Auto-generate">
								<ott-icon name="wand-2" [size]="14"></ott-icon>
							</button>
						</div>
						<div class="preview" *ngIf="prefix || reportNumber">
							Preview: <strong>{{ fullNumber }}</strong>
						</div>
					</div>

					<!-- Date -->
					<div class="form-group">
						<label>Effective Date</label>
						<input type="date" [(ngModel)]="effectiveDate" class="input-lg">
					</div>

					<!-- Notes -->
					<div class="form-group">
						<label>Notes</label>
						<textarea [(ngModel)]="notes" rows="2" placeholder="Optional notes..."></textarea>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
					<button class="btn btn-primary" (click)="onAssign()" [disabled]="!reportNumber">
						<ott-icon name="check" [size]="14"></ott-icon>
						Assign
					</button>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; }
		.modal-overlay {
			position: fixed;
			top: 0; left: 0; right: 0; bottom: 0;
			background: rgba(0,0,0,0.4);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: var(--ott-font);
		}
		.modal-dialog {
			background: var(--ott-bg);
			border-radius: var(--ott-radius-xl);
			box-shadow: var(--ott-shadow-xl);
			border: 1px solid var(--ott-border);
			width: 480px;
			max-height: 80vh;
			display: flex;
			flex-direction: column;
		}
		.modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid var(--ott-border-light);
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
		.info-path { font-size: 12px; color: var(--ott-text-muted); font-family: var(--ott-font-mono); }

		.current-number { margin-bottom: 16px; }
		.number-display {
			font-size: 18px; font-weight: 700; color: var(--ott-primary);
			font-family: var(--ott-font-mono); padding: 8px 12px;
			background: var(--ott-primary-light); border-radius: var(--ott-radius-md);
			display: inline-block;
		}

		.section { margin-bottom: 16px; }
		.section-header {
			display: flex; align-items: center; gap: 6px;
			font-size: 12px; font-weight: 600; color: var(--ott-text-secondary);
			text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
		}

		.number-input-row { display: flex; gap: 8px; align-items: flex-end; margin-bottom: 8px; }
		.prefix-group { width: 80px; }
		.number-group { flex: 1; }

		.form-group { margin-bottom: 12px; }
		.form-group label {
			display: block; font-size: 12px; font-weight: 500;
			color: var(--ott-text-secondary); margin-bottom: 5px;
		}
		input[type="text"], input[type="date"], textarea {
			width: 100%; padding: 7px 10px; border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md); font-size: 13px;
			font-family: var(--ott-font); box-sizing: border-box;
			color: var(--ott-text); background: var(--ott-bg);
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		input:focus, textarea:focus {
			outline: none; border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
		}
		textarea { resize: vertical; min-height: 50px; }
		.input-sm { font-family: var(--ott-font-mono); text-align: center; }
		.input-lg { font-family: var(--ott-font-mono); }

		.preview {
			font-size: 12px; color: var(--ott-text-secondary);
			padding: 6px 10px; background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-sm);
		}
		.preview strong { color: var(--ott-text); font-family: var(--ott-font-mono); }

		.btn-icon {
			padding: 7px 10px; border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md); background: var(--ott-bg);
			cursor: pointer; color: var(--ott-primary);
			transition: background-color 0.15s;
		}
		.btn-icon:hover { background: var(--ott-bg-hover); }

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
export class AssignReportNumberComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();
	@Input() context?: AssetContext;

	currentNumber = '';
	prefix = 'RPT';
	reportNumber = '';
	effectiveDate = '';
	notes = '';

	constructor(
		ele: ElementRef,
		private cms: CMSCommunicationsService
	) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] Assign Report Number modal opened');
		this.effectiveDate = new Date().toISOString().split('T')[0];
		this.loadCurrentNumber();
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	get fullNumber(): string {
		return this.prefix ? `${this.prefix}-${this.reportNumber}` : this.reportNumber;
	}

	autoGenerate(): void {
		const year = new Date().getFullYear();
		const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
		this.reportNumber = `${year}-${seq}`;
	}

	private loadCurrentNumber(): void {
		if (!this.context) return;

		this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'GetPageData',
			args: [this.context.id]
		}).subscribe({
			next: (data) => {
				this.currentNumber = data?.ReportNumber || '';
			},
			error: () => {
				// Dev mode fallback
				this.currentNumber = 'RPT-2024-0187';
			}
		});
	}

	onCancel(): void {
		this.close.emit();
	}

	onAssign(): void {
		if (!this.context) {
			console.log(`[IGX-OTT] Assigned report number: ${this.fullNumber}`);
			this.close.emit();
			return;
		}

		this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'Save',
			args: [this.context.id, { ReportNumber: this.fullNumber, EffectiveDate: this.effectiveDate, Notes: this.notes }]
		}).subscribe({
			next: () => {
				console.log(`[IGX-OTT] Report number assigned: ${this.fullNumber}`);
				this.close.emit();
			},
			error: () => {
				console.log(`[IGX-OTT] Assigned report number (dev): ${this.fullNumber}`);
				this.close.emit();
			}
		});
	}
}
