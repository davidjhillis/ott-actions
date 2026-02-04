import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';
import { CMSCommunicationsService } from '../../../services/cms-communications.service';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

interface WorkflowTransition {
	id: string;
	label: string;
	targetStatus: string;
	requiresComment: boolean;
}

interface WorkflowUser {
	id: string;
	name: string;
}

@Component({
	selector: 'app-manage-workflow',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="git-branch" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Manage Workflow</h3>
					</div>
					<button class="close-btn" (click)="onCancel()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<div class="modal-body">
					<!-- Current status -->
					<div class="info-card">
						<div class="status-row">
							<div>
								<div class="info-label">Current Status</div>
								<span class="status-badge" [ngClass]="'status-' + (currentStatus || '').toLowerCase()">
									{{ currentStatus || 'Unknown' }}
								</span>
							</div>
							<div>
								<div class="info-label">Asset</div>
								<div class="info-name">{{ context?.name || 'N/A' }}</div>
							</div>
						</div>
					</div>

					<!-- Available transitions -->
					<div class="section">
						<div class="section-header">
							<ott-icon name="arrow-right-circle" [size]="14"></ott-icon>
							Available Transitions
						</div>
						<div class="transition-list">
							<label class="transition-item" *ngFor="let t of transitions"
								[class.selected]="selectedTransition?.id === t.id">
								<input type="radio" name="transition" [value]="t.id"
									[(ngModel)]="selectedTransitionId" (change)="selectTransition(t)">
								<div class="transition-info">
									<div class="transition-label">{{ t.label }}</div>
									<div class="transition-target">
										<ott-icon name="arrow-right" [size]="12"></ott-icon>
										{{ t.targetStatus }}
									</div>
								</div>
							</label>
						</div>
					</div>

					<!-- Assign to -->
					<div class="form-group">
						<label>Assign to</label>
						<select [(ngModel)]="assignToId">
							<option value="">-- No assignment --</option>
							<option *ngFor="let u of users" [value]="u.id">{{ u.name }}</option>
						</select>
					</div>

					<!-- Comment -->
					<div class="form-group">
						<label>
							Comment
							<span class="required" *ngIf="selectedTransition?.requiresComment">*</span>
						</label>
						<textarea [(ngModel)]="comment" rows="3" placeholder="Add a comment..."></textarea>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
					<button class="btn btn-primary" (click)="onAdvance()"
						[disabled]="!selectedTransition || (selectedTransition.requiresComment && !comment.trim())">
						<ott-icon name="check-circle" [size]="14"></ott-icon>
						Advance
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
			width: 500px; max-height: 80vh; display: flex; flex-direction: column;
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
		.status-row { display: flex; gap: 24px; }
		.info-label {
			font-size: 11px; font-weight: 600; text-transform: uppercase;
			color: var(--ott-text-muted); letter-spacing: 0.5px; margin-bottom: 4px;
		}
		.info-name { font-size: 14px; font-weight: 600; color: var(--ott-text); }
		.status-badge {
			display: inline-block; padding: 3px 10px;
			border-radius: var(--ott-radius-full);
			font-size: 12px; font-weight: 600;
		}
		.status-draft { background: var(--ott-warning-light); color: #92400e; }
		.status-review { background: var(--ott-primary-light); color: #1e40af; }
		.status-approved { background: var(--ott-success-light); color: #166534; }
		.status-published { background: #dbeafe; color: #1e3a5f; }

		.section { margin-bottom: 16px; }
		.section-header {
			display: flex; align-items: center; gap: 6px;
			font-size: 12px; font-weight: 600; color: var(--ott-text-secondary);
			text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
		}

		.transition-list {
			border: 1px solid var(--ott-border-light); border-radius: var(--ott-radius-md);
			overflow: hidden;
		}
		.transition-item {
			display: flex; align-items: center; gap: 10px;
			padding: 10px 12px; cursor: pointer;
			border-bottom: 1px solid var(--ott-border-light);
			transition: background-color 0.12s;
		}
		.transition-item:last-child { border-bottom: none; }
		.transition-item:hover { background: var(--ott-bg-muted); }
		.transition-item.selected { background: var(--ott-primary-light); }
		.transition-item input[type="radio"] { display: none; }
		.transition-label { font-size: 13px; font-weight: 600; color: var(--ott-text); }
		.transition-target {
			display: flex; align-items: center; gap: 4px;
			font-size: 11px; color: var(--ott-text-muted);
		}

		.form-group { margin-bottom: 12px; }
		.form-group label {
			display: block; font-size: 12px; font-weight: 500;
			color: var(--ott-text-secondary); margin-bottom: 5px;
		}
		.required { color: var(--ott-danger); }
		select, textarea {
			width: 100%; padding: 7px 10px; border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md); font-size: 13px;
			font-family: var(--ott-font); box-sizing: border-box;
			color: var(--ott-text); background: var(--ott-bg);
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		select:focus, textarea:focus {
			outline: none; border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
		}
		textarea { resize: vertical; min-height: 60px; }

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
export class ManageWorkflowComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();
	@Input() context?: AssetContext;

	currentStatus = '';
	transitions: WorkflowTransition[] = [];
	users: WorkflowUser[] = [];
	selectedTransitionId = '';
	selectedTransition: WorkflowTransition | null = null;
	assignToId = '';
	comment = '';

	constructor(
		ele: ElementRef,
		private cms: CMSCommunicationsService
	) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] Manage Workflow modal opened');
		this.currentStatus = this.context?.workflowStatus || 'Draft';
		this.loadWorkflowInfo();
		this.loadUsers();
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	selectTransition(t: WorkflowTransition): void {
		this.selectedTransition = t;
	}

	private loadWorkflowInfo(): void {
		if (!this.context) {
			this.loadDemoTransitions();
			return;
		}

		this.cms.callService<any>({
			service: 'WorkflowServices',
			action: 'GetContentItemAdvanceInfo',
			args: [this.context.id]
		}).subscribe({
			next: (info) => {
				this.currentStatus = info?.CurrentStatus || this.currentStatus;
				this.transitions = (info?.AvailableTransitions || []).map((t: any) => ({
					id: t.ID, label: t.Label, targetStatus: t.TargetStatus,
					requiresComment: t.RequiresComment === true
				}));
			},
			error: () => this.loadDemoTransitions()
		});
	}

	private loadDemoTransitions(): void {
		this.transitions = [
			{ id: 'submit-review', label: 'Submit for Review', targetStatus: 'Review', requiresComment: false },
			{ id: 'approve', label: 'Approve', targetStatus: 'Approved', requiresComment: true },
			{ id: 'reject', label: 'Reject & Return', targetStatus: 'Draft', requiresComment: true },
			{ id: 'publish', label: 'Publish', targetStatus: 'Published', requiresComment: false },
		];
	}

	private loadUsers(): void {
		this.cms.callService<any[]>({
			service: 'UserManagerServices',
			action: 'GetUsersAndGroupsSimple',
			args: []
		}).subscribe({
			next: (users) => {
				this.users = (users || []).map((u: any) => ({ id: u.ID, name: u.Name }));
			},
			error: () => {
				this.users = [
					{ id: 'u1', name: 'John Smith' },
					{ id: 'u2', name: 'Sarah Chen' },
					{ id: 'u3', name: 'Michael Torres' },
					{ id: 'u4', name: 'Emily Watson' },
				];
			}
		});
	}

	onCancel(): void {
		this.close.emit();
	}

	onAdvance(): void {
		if (!this.selectedTransition) return;

		const pageId = this.context?.id || 'x312';

		this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'Advance',
			args: [pageId, this.selectedTransition.id, this.assignToId, this.comment],
			postCall: 'refreshTree'
		}).subscribe({
			next: () => {
				console.log(`[IGX-OTT] Workflow advanced: ${this.selectedTransition!.label}`);
				this.close.emit();
			},
			error: () => {
				console.log(`[IGX-OTT] Workflow advanced (dev): ${this.selectedTransition!.label}`);
				this.close.emit();
			}
		});
	}
}
