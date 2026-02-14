import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconComponent } from '../shared/lucide-icon.component';

@Component({
	selector: 'ott-report-number-inline',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<!-- Read mode -->
		<div class="report-display" *ngIf="!editing">
			<span class="report-label">Report #</span>
			<span class="report-value" *ngIf="currentNumber">{{ currentNumber }}</span>
			<span class="report-value empty" *ngIf="!currentNumber">Not assigned</span>
			<button class="edit-btn" (click)="startEdit()" title="Edit Report Number">
				<ott-icon name="pencil" [size]="12"></ott-icon>
				Edit
			</button>
		</div>

		<!-- Edit mode -->
		<div class="report-edit" *ngIf="editing">
			<span class="report-label">Report #</span>
			<div class="edit-row">
				<input
					type="text"
					class="prefix-input"
					[(ngModel)]="prefix"
					placeholder="RPT">
				<input
					type="text"
					class="number-input"
					[(ngModel)]="number"
					placeholder="2025-0042">
				<button class="auto-btn" (click)="autoGenerate()" title="Auto-generate">
					<ott-icon name="rotate-ccw" [size]="14"></ott-icon>
				</button>
			</div>
			<div class="edit-row">
				<label class="date-label">Effective:</label>
				<input type="date" class="date-input" [(ngModel)]="effectiveDate">
			</div>
			<div class="preview" *ngIf="prefix || number">
				Preview: <strong>{{ fullNumber }}</strong>
			</div>
			<div class="edit-actions">
				<button class="btn-cancel" (click)="cancelEdit()">Cancel</button>
				<button class="btn-save" (click)="save()" [disabled]="!number">Save</button>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }
		.report-display {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 6px 0;
		}
		.report-label {
			font-size: var(--ott-font-size-sm);
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.4px;
			color: var(--ott-text-muted);
			min-width: 60px;
		}
		.report-value {
			font-size: var(--ott-font-size-base);
			font-weight: 600;
			font-family: var(--ott-font-mono);
			color: var(--ott-primary);
		}
		.report-value.empty {
			color: var(--ott-text-muted);
			font-style: italic;
			font-weight: 400;
		}
		.edit-btn {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			border: 1px solid var(--ott-border);
			background: var(--ott-bg);
			cursor: pointer;
			color: var(--ott-text-secondary);
			font-size: var(--ott-font-size-sm);
			font-family: var(--ott-font);
			padding: 4px 8px;
			border-radius: var(--ott-radius-sm);
			transition: all 0.15s;
		}
		.edit-btn:hover {
			background: var(--ott-bg-hover);
			color: var(--ott-primary);
			border-color: var(--ott-primary);
		}

		/* Edit mode */
		.report-edit {
			padding: 8px 0;
		}
		.edit-row {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-top: 6px;
		}
		.prefix-input {
			width: 60px;
			padding: 6px 8px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-size: var(--ott-font-size-base);
			font-family: var(--ott-font-mono);
			text-align: center;
			color: var(--ott-text);
			background: var(--ott-bg);
		}
		.number-input {
			flex: 1;
			max-width: 180px;
			padding: 6px 8px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-size: var(--ott-font-size-base);
			font-family: var(--ott-font-mono);
			color: var(--ott-text);
			background: var(--ott-bg);
		}
		.prefix-input:focus, .number-input:focus, .date-input:focus {
			outline: none;
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
		}
		.auto-btn {
			padding: 5px 8px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			background: var(--ott-bg);
			cursor: pointer;
			color: var(--ott-primary);
			transition: background 0.15s;
			display: inline-flex;
		}
		.auto-btn:hover { background: var(--ott-bg-hover); }
		.date-label {
			font-size: var(--ott-font-size-base);
			color: var(--ott-text-secondary);
		}
		.date-input {
			padding: 5px 8px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-size: var(--ott-font-size-base);
			font-family: var(--ott-font);
			color: var(--ott-text);
			background: var(--ott-bg);
		}
		.preview {
			font-size: var(--ott-font-size-sm);
			color: var(--ott-text-secondary);
			margin-top: 6px;
			padding: 5px 8px;
			background: var(--ott-bg-subtle);
			border-radius: var(--ott-radius-sm);
			display: inline-block;
		}
		.preview strong {
			font-family: var(--ott-font-mono);
			color: var(--ott-text);
		}
		.edit-actions {
			display: flex;
			gap: 6px;
			margin-top: 8px;
		}
		.btn-cancel, .btn-save {
			padding: 6px 12px;
			border-radius: var(--ott-radius-md);
			font-size: var(--ott-font-size-base);
			font-family: var(--ott-font);
			font-weight: 500;
			cursor: pointer;
			border: 1px solid var(--ott-border);
			transition: all 0.15s;
		}
		.btn-cancel {
			background: var(--ott-bg);
			color: var(--ott-text);
		}
		.btn-cancel:hover { background: var(--ott-bg-hover); }
		.btn-save {
			background: var(--ott-primary);
			color: #fff;
			border-color: var(--ott-primary);
		}
		.btn-save:hover { background: var(--ott-primary-hover); }
		.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
	`]
})
export class ReportNumberInlineComponent {
	@Input() currentNumber = '';
	@Output() saved = new EventEmitter<{ reportNumber: string; effectiveDate: string }>();

	editing = false;
	prefix = 'RPT';
	number = '';
	effectiveDate = '';

	get fullNumber(): string {
		return this.prefix ? `${this.prefix}-${this.number}` : this.number;
	}

	startEdit(): void {
		this.editing = true;
		if (this.currentNumber) {
			const parts = this.currentNumber.split('-');
			if (parts.length >= 2) {
				this.prefix = parts[0];
				this.number = parts.slice(1).join('-');
			} else {
				this.number = this.currentNumber;
			}
		}
		this.effectiveDate = new Date().toISOString().split('T')[0];
	}

	cancelEdit(): void {
		this.editing = false;
		this.prefix = 'RPT';
		this.number = '';
	}

	autoGenerate(): void {
		const year = new Date().getFullYear();
		const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
		this.number = `${year}-${seq}`;
	}

	save(): void {
		this.saved.emit({ reportNumber: this.fullNumber, effectiveDate: this.effectiveDate });
		this.currentNumber = this.fullNumber;
		this.editing = false;
	}
}
