import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

interface Recipient {
	id: string;
	name: string;
	email: string;
	selected: boolean;
}

@Component({
	selector: 'app-distribute-report',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<h3>Distribute Report</h3>
					<button class="close-btn" (click)="onCancel()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>
				<div class="modal-body">
					<p class="modal-description">Select recipients to distribute this report to:</p>

					<div class="select-all">
						<label>
							<input type="checkbox"
								[checked]="allSelected"
								(change)="toggleAll()">
							Select All
						</label>
					</div>

					<div class="recipient-list">
						<label class="recipient-item" *ngFor="let r of recipients">
							<input type="checkbox"
								[(ngModel)]="r.selected"
								[checked]="r.selected"
								(change)="r.selected = !r.selected">
							<span class="recipient-name">{{ r.name }}</span>
							<span class="recipient-email">{{ r.email }}</span>
						</label>
					</div>

					<div class="options-section">
						<label class="option-item">
							<input type="checkbox" [checked]="includeAttachments" (change)="includeAttachments = !includeAttachments">
							Include attachments
						</label>
						<label class="option-item">
							<input type="checkbox" [checked]="sendNotification" (change)="sendNotification = !sendNotification">
							Send email notification
						</label>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
					<button class="btn btn-primary" (click)="onDistribute()" [disabled]="selectedCount === 0">
						Distribute ({{ selectedCount }})
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
		.modal-header h3 {
			margin: 0;
			font-size: 15px;
			font-weight: 600;
			color: var(--ott-text);
		}
		.close-btn {
			border: none;
			background: none;
			font-size: 18px;
			cursor: pointer;
			color: var(--ott-text-muted);
			padding: 4px;
			border-radius: var(--ott-radius-sm);
			transition: color 0.15s, background-color 0.15s;
		}
		.close-btn:hover {
			color: var(--ott-text);
			background: var(--ott-bg-hover);
		}
		.modal-body {
			padding: 16px 20px;
			overflow-y: auto;
			flex: 1;
		}
		.modal-description {
			margin: 0 0 12px;
			color: var(--ott-text-secondary);
			font-size: 13px;
		}
		.select-all {
			padding: 8px 0;
			border-bottom: 1px solid var(--ott-border-light);
			margin-bottom: 8px;
		}
		.select-all label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: 600;
			font-size: 13px;
			cursor: pointer;
			color: var(--ott-text);
		}
		.recipient-list {
			max-height: 200px;
			overflow-y: auto;
			margin-bottom: 16px;
		}
		.recipient-item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 7px 0;
			cursor: pointer;
			font-size: 13px;
			color: var(--ott-text);
		}
		.recipient-name {
			flex: 1;
		}
		.recipient-email {
			color: var(--ott-text-muted);
			font-size: 12px;
		}
		.options-section {
			border-top: 1px solid var(--ott-border-light);
			padding-top: 12px;
		}
		.option-item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 5px 0;
			font-size: 13px;
			cursor: pointer;
			color: var(--ott-text);
		}
		.modal-footer {
			display: flex;
			justify-content: flex-end;
			gap: 8px;
			padding: 14px 20px;
			border-top: 1px solid var(--ott-border-light);
		}
		.btn {
			padding: 8px 16px;
			border-radius: var(--ott-radius-md);
			font-size: 13px;
			font-family: var(--ott-font);
			font-weight: 500;
			cursor: pointer;
			border: 1px solid var(--ott-border);
			transition: background-color 0.15s, border-color 0.15s;
		}
		.btn-secondary {
			background: var(--ott-bg);
			color: var(--ott-text);
		}
		.btn-secondary:hover { background: var(--ott-bg-hover); }
		.btn-primary {
			background: var(--ott-primary);
			color: #fff;
			border-color: var(--ott-primary);
		}
		.btn-primary:hover { background: var(--ott-primary-hover); }
		.btn-primary:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	`]
})
export class DistributeReportComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();
	@Output() distribute = new EventEmitter<{ recipients: Recipient[], includeAttachments: boolean, sendNotification: boolean }>();

	includeAttachments = true;
	sendNotification = true;

	// Demo recipients (would come from CMS UserManagerServices in production)
	recipients: Recipient[] = [
		{ id: '1', name: 'John Smith', email: 'j.smith@standards.org', selected: false },
		{ id: '2', name: 'Sarah Chen', email: 's.chen@standards.org', selected: false },
		{ id: '3', name: 'Michael Torres', email: 'm.torres@standards.org', selected: false },
		{ id: '4', name: 'Emily Watson', email: 'e.watson@standards.org', selected: false },
		{ id: '5', name: 'David Kim', email: 'd.kim@standards.org', selected: false },
		{ id: '6', name: 'Lisa Patel', email: 'l.patel@standards.org', selected: false },
		{ id: '7', name: 'James Wilson', email: 'j.wilson@standards.org', selected: false },
		{ id: '8', name: 'Anna Kowalski', email: 'a.kowalski@standards.org', selected: false },
	];

	constructor(ele: ElementRef) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] Distribute Report modal opened');
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	get allSelected(): boolean {
		return this.recipients.every(r => r.selected);
	}

	get selectedCount(): number {
		return this.recipients.filter(r => r.selected).length;
	}

	toggleAll(): void {
		const newState = !this.allSelected;
		this.recipients.forEach(r => r.selected = newState);
	}

	onCancel(): void {
		this.close.emit();
	}

	onDistribute(): void {
		const selected = this.recipients.filter(r => r.selected);
		console.log(`[IGX-OTT] Distributing to ${selected.length} recipients`);
		this.distribute.emit({
			recipients: selected,
			includeAttachments: this.includeAttachments,
			sendNotification: this.sendNotification
		});
		this.close.emit();
	}
}
