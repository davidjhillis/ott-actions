import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../../ComponentBase';
import { AssetContext } from '../../../models/asset-context.model';
import { CMSCommunicationsService } from '../../../services/cms-communications.service';
import { LucideIconComponent } from '../../shared/lucide-icon.component';

interface AssignableUser {
	id: string;
	name: string;
	type: 'user' | 'group';
}

@Component({
	selector: 'app-batch-assign',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="modal-overlay" (click)="onCancel()">
			<div class="modal-dialog" (click)="$event.stopPropagation()">
				<div class="modal-header">
					<div class="header-title">
						<ott-icon name="users" [size]="18" color="var(--ott-primary)"></ott-icon>
						<h3>Batch Assign</h3>
					</div>
					<button class="close-btn" (click)="onCancel()">
						<ott-icon name="x" [size]="18"></ott-icon>
					</button>
				</div>

				<div class="modal-body">
					<!-- Items to assign -->
					<div class="section">
						<div class="section-header">
							<ott-icon name="file-stack" [size]="14"></ott-icon>
							Items ({{ items.length }})
						</div>
						<div class="item-list">
							<div class="item-row" *ngFor="let item of items">
								<ott-icon [name]="item.isFolder ? 'folder' : 'file'" [size]="14" color="var(--ott-primary)"></ott-icon>
								<span class="item-name">{{ item.name }}</span>
							</div>
						</div>
					</div>

					<!-- User/Group toggle -->
					<div class="section">
						<div class="section-header">
							<ott-icon name="user-check" [size]="14"></ott-icon>
							Assign To
						</div>
						<div class="toggle-tabs">
							<button class="tab-btn" [class.active]="showType === 'user'" (click)="showType = 'user'">
								<ott-icon name="user" [size]="13"></ott-icon> Users
							</button>
							<button class="tab-btn" [class.active]="showType === 'group'" (click)="showType = 'group'">
								<ott-icon name="users" [size]="13"></ott-icon> Groups
							</button>
						</div>

						<!-- Search -->
						<div class="search-box">
							<ott-icon name="search" [size]="14"></ott-icon>
							<input type="text" [(ngModel)]="searchQuery" placeholder="Search {{ showType === 'user' ? 'users' : 'groups' }}...">
						</div>

						<!-- User/Group list -->
						<div class="assignee-list">
							<label class="assignee-item" *ngFor="let a of filteredAssignees"
								[class.selected]="selectedAssigneeId === a.id">
								<input type="radio" name="assignee" [value]="a.id" [(ngModel)]="selectedAssigneeId">
								<ott-icon [name]="a.type === 'user' ? 'user' : 'users'" [size]="14"></ott-icon>
								<span>{{ a.name }}</span>
							</label>
							<div class="no-results" *ngIf="filteredAssignees.length === 0">
								No {{ showType === 'user' ? 'users' : 'groups' }} found
							</div>
						</div>
					</div>

					<!-- Comment -->
					<div class="form-group">
						<label>Comment</label>
						<textarea [(ngModel)]="comment" rows="2" placeholder="Optional comment..."></textarea>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
					<button class="btn btn-primary" (click)="onAssign()" [disabled]="!selectedAssigneeId">
						<ott-icon name="user-check" [size]="14"></ott-icon>
						Assign ({{ items.length }} item{{ items.length !== 1 ? 's' : '' }})
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

		.section { margin-bottom: 16px; }
		.section-header {
			display: flex; align-items: center; gap: 6px;
			font-size: 12px; font-weight: 600; color: var(--ott-text-secondary);
			text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
		}

		.item-list {
			max-height: 120px; overflow-y: auto;
			border: 1px solid var(--ott-border-light); border-radius: var(--ott-radius-md);
			margin-bottom: 4px;
		}
		.item-row {
			display: flex; align-items: center; gap: 8px;
			padding: 6px 12px; font-size: 13px; color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.item-row:last-child { border-bottom: none; }
		.item-name { flex: 1; }

		.toggle-tabs {
			display: flex; gap: 4px; margin-bottom: 8px;
			padding: 3px; background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-md);
		}
		.tab-btn {
			flex: 1; padding: 6px 12px; border: none;
			background: transparent; cursor: pointer;
			font-size: 12px; font-weight: 500; font-family: var(--ott-font);
			color: var(--ott-text-muted); border-radius: var(--ott-radius-sm);
			display: flex; align-items: center; justify-content: center; gap: 5px;
			transition: background-color 0.15s, color 0.15s;
		}
		.tab-btn.active {
			background: var(--ott-bg); color: var(--ott-text);
			box-shadow: var(--ott-shadow-sm);
		}

		.search-box {
			display: flex; align-items: center; gap: 8px;
			padding: 7px 10px; border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md); margin-bottom: 8px;
			color: var(--ott-text-muted);
		}
		.search-box input {
			flex: 1; border: none; outline: none; font-size: 13px;
			font-family: var(--ott-font); color: var(--ott-text);
			background: transparent;
		}

		.assignee-list {
			max-height: 160px; overflow-y: auto;
			border: 1px solid var(--ott-border-light); border-radius: var(--ott-radius-md);
		}
		.assignee-item {
			display: flex; align-items: center; gap: 8px;
			padding: 8px 12px; cursor: pointer; font-size: 13px;
			border-bottom: 1px solid var(--ott-border-light);
			color: var(--ott-text); transition: background-color 0.12s;
		}
		.assignee-item:last-child { border-bottom: none; }
		.assignee-item:hover { background: var(--ott-bg-muted); }
		.assignee-item.selected { background: var(--ott-primary-light); }
		.assignee-item input[type="radio"] { display: none; }
		.no-results {
			padding: 16px; text-align: center; color: var(--ott-text-muted); font-size: 13px;
		}

		.form-group { margin-bottom: 12px; }
		.form-group label {
			display: block; font-size: 12px; font-weight: 500;
			color: var(--ott-text-secondary); margin-bottom: 5px;
		}
		textarea {
			width: 100%; padding: 7px 10px; border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md); font-size: 13px;
			font-family: var(--ott-font); box-sizing: border-box;
			color: var(--ott-text); background: var(--ott-bg);
			resize: vertical; min-height: 50px;
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		textarea:focus {
			outline: none; border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
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
export class BatchAssignComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();
	@Input() context?: AssetContext;

	items: { name: string; isFolder: boolean }[] = [];
	showType: 'user' | 'group' = 'user';
	searchQuery = '';
	selectedAssigneeId = '';
	comment = '';

	private allAssignees: AssignableUser[] = [];

	constructor(
		ele: ElementRef,
		private cms: CMSCommunicationsService
	) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] Batch Assign modal opened');
		this.loadItems();
		this.loadAssignees();
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	get filteredAssignees(): AssignableUser[] {
		return this.allAssignees
			.filter(a => a.type === this.showType)
			.filter(a => !this.searchQuery || a.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
	}

	private loadItems(): void {
		if (this.context?.selectedItems?.length) {
			this.items = this.context.selectedItems.map(i => ({ name: i.name, isFolder: i.isFolder }));
		} else if (this.context) {
			this.items = [{ name: this.context.name, isFolder: this.context.isFolder }];
		} else {
			// Dev fallback
			this.items = [
				{ name: 'Draft-v3.2.docx', isFolder: false },
				{ name: 'Appendix-A.pdf', isFolder: false },
				{ name: 'Review-Comments', isFolder: true },
			];
		}
	}

	private loadAssignees(): void {
		this.cms.callService<any[]>({
			service: 'UserManagerServices',
			action: 'GetUsersAndGroupsSimple',
			args: []
		}).subscribe({
			next: (data) => {
				this.allAssignees = (data || []).map((d: any) => ({
					id: d.ID, name: d.Name, type: d.IsGroup ? 'group' : 'user'
				}));
			},
			error: () => {
				this.allAssignees = [
					{ id: 'u1', name: 'John Smith', type: 'user' },
					{ id: 'u2', name: 'Sarah Chen', type: 'user' },
					{ id: 'u3', name: 'Michael Torres', type: 'user' },
					{ id: 'u4', name: 'Emily Watson', type: 'user' },
					{ id: 'u5', name: 'David Kim', type: 'user' },
					{ id: 'g1', name: 'Standards Committee', type: 'group' },
					{ id: 'g2', name: 'Quality Team', type: 'group' },
					{ id: 'g3', name: 'Editorial Board', type: 'group' },
				];
			}
		});
	}

	onCancel(): void {
		this.close.emit();
	}

	onAssign(): void {
		const assignee = this.allAssignees.find(a => a.id === this.selectedAssigneeId);
		const pageIds = this.context?.selectedItems?.map(i => i.id) || [this.context?.id || 'x312'];

		this.cms.callService<any>({
			service: 'PageCommandsServices',
			action: 'Assign',
			args: [pageIds, this.selectedAssigneeId, this.comment]
		}).subscribe({
			next: () => {
				console.log(`[IGX-OTT] Batch assigned to: ${assignee?.name}`);
				this.close.emit();
			},
			error: () => {
				console.log(`[IGX-OTT] Batch assigned (dev) to: ${assignee?.name}`);
				this.close.emit();
			}
		});
	}
}
