import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../ComponentBase';
import { ActionConfigService } from '../../services/action-config.service';
import { ActionDefinition, ActionGroup, ActionType } from '../../models/action.model';
import { ActionEditorComponent } from './action-editor.component';

@Component({
	selector: 'app-action-manager',
	standalone: true,
	imports: [CommonModule, FormsModule, ActionEditorComponent],
	template: `
		<div class="manager-overlay">
			<div class="manager-dialog">
				<div class="manager-header">
					<h2>Action Manager</h2>
					<div class="header-actions">
						<button class="btn btn-sm" (click)="onAddGroup()">
							<span class="fa-light fa-folder-plus"></span> Add Group
						</button>
						<button class="btn btn-sm" (click)="onAddAction()">
							<span class="fa-light fa-plus"></span> Add Action
						</button>
						<button class="btn btn-sm" (click)="onResetDefaults()">
							<span class="fa-light fa-rotate-left"></span> Reset
						</button>
						<button class="close-btn" (click)="onClose()">
							<span class="fa-light fa-xmark"></span>
						</button>
					</div>
				</div>
				<div class="manager-body">
					<!-- Left: Groups + Actions list -->
					<div class="list-panel">
						<div class="group-section" *ngFor="let group of groups; let gi = index">
							<div class="group-header"
								[class.selected]="selectedGroupId === group.id && !selectedAction"
								(click)="selectGroup(group)">
								<div class="group-title">
									<span class="drag-handle fa-solid fa-grip-vertical"></span>
									<span class="group-name">{{ group.label }}</span>
									<span class="group-count">({{ getActionsForGroup(group.id).length }})</span>
								</div>
								<div class="group-actions-btns">
									<button class="icon-btn" (click)="onEditGroup(group, $event)" title="Edit group">
										<span class="fa-light fa-pen"></span>
									</button>
									<button class="icon-btn" (click)="onRemoveGroup(group, $event)" title="Remove group">
										<span class="fa-light fa-trash"></span>
									</button>
								</div>
							</div>
							<div class="action-list">
								<div class="action-row"
									*ngFor="let action of getActionsForGroup(group.id); let ai = index"
									[class.selected]="selectedAction?.id === action.id"
									[class.disabled]="!action.enabled"
									(click)="selectAction(action)">
									<span class="drag-handle fa-solid fa-grip-vertical"></span>
									<span class="action-icon fa-light" [ngClass]="action.icon"></span>
									<span class="action-label">{{ action.label }}</span>
									<span class="action-type-badge">{{ action.handler.type }}</span>
									<button class="icon-btn toggle-btn"
										(click)="toggleAction(action, $event)"
										[title]="action.enabled ? 'Disable' : 'Enable'">
										<span class="fa-solid" [ngClass]="action.enabled ? 'fa-toggle-on' : 'fa-toggle-off'"></span>
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Right: Editor -->
					<div class="editor-panel-container">
						<!-- Group editor (inline) -->
						<div class="group-editor" *ngIf="editingGroup">
							<div class="editor-header">
								<h4>{{ editingGroupIsNew ? 'New Group' : 'Edit Group' }}</h4>
							</div>
							<div class="editor-body">
								<div class="form-group">
									<label>Label</label>
									<input type="text" [(ngModel)]="editingGroup.label" placeholder="Group label">
								</div>
								<div class="form-group-inline">
									<label><input type="checkbox" [(ngModel)]="editingGroup.collapsible"> Collapsible</label>
									<label><input type="checkbox" [(ngModel)]="editingGroup.collapsed"> Start collapsed</label>
								</div>
							</div>
							<div class="editor-footer">
								<button class="btn btn-secondary" (click)="cancelGroupEdit()">Cancel</button>
								<button class="btn btn-primary" (click)="saveGroup()" [disabled]="!editingGroup.label">Save</button>
							</div>
						</div>

						<!-- Action editor -->
						<app-action-editor
							*ngIf="!editingGroup"
							[action]="selectedAction"
							[groups]="groups"
							[isNew]="isNewAction"
							(save)="onSaveAction($event)"
							(delete)="onDeleteAction($event)"
							(cancel)="cancelActionEdit()">
						</app-action-editor>
					</div>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; }
		.manager-overlay {
			position: fixed;
			top: 0; left: 0; right: 0; bottom: 0;
			background: rgba(0,0,0,0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		.manager-dialog {
			background: #fff;
			border-radius: 8px;
			box-shadow: 0 12px 48px rgba(0,0,0,0.25);
			width: 860px;
			height: 600px;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}
		.manager-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 14px 20px;
			border-bottom: 1px solid #eee;
			background: #f8f9fa;
		}
		.manager-header h2 {
			margin: 0;
			font-size: 16px;
			font-weight: 600;
		}
		.header-actions {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.btn { padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; border: 1px solid #ddd; background: #fff; display: inline-flex; align-items: center; gap: 4px; }
		.btn:hover { background: #f0f0f0; }
		.btn-sm { padding: 4px 10px; font-size: 11px; }
		.btn-secondary { background: #fff; color: #333; }
		.btn-primary { background: #53ace3; color: #fff; border-color: #53ace3; }
		.btn-primary:hover { background: #3d9ad4; }
		.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
		.close-btn { border: none; background: none; font-size: 18px; cursor: pointer; color: #888; padding: 4px 8px; }
		.close-btn:hover { color: #333; }

		.manager-body {
			display: flex;
			flex: 1;
			overflow: hidden;
		}
		.list-panel {
			width: 480px;
			border-right: 1px solid #eee;
			overflow-y: auto;
			background: #fafbfc;
		}
		.group-section { margin-bottom: 2px; }
		.group-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 8px 12px;
			background: #f0f2f5;
			cursor: pointer;
			border-bottom: 1px solid #e8e8e8;
		}
		.group-header.selected { background: #dde8f0; }
		.group-header:hover { background: #e4e8ec; }
		.group-title {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.drag-handle {
			color: #ccc;
			font-size: 10px;
			cursor: grab;
		}
		.group-name {
			font-weight: 600;
			font-size: 13px;
		}
		.group-count {
			color: #999;
			font-size: 11px;
		}
		.group-actions-btns {
			display: flex;
			gap: 2px;
			opacity: 0;
			transition: opacity 0.15s;
		}
		.group-header:hover .group-actions-btns { opacity: 1; }
		.icon-btn {
			border: none;
			background: none;
			cursor: pointer;
			padding: 2px 6px;
			color: #888;
			font-size: 12px;
			border-radius: 3px;
		}
		.icon-btn:hover { background: rgba(0,0,0,0.06); color: #333; }

		.action-list { background: #fff; }
		.action-row {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 7px 12px 7px 24px;
			cursor: pointer;
			border-bottom: 1px solid #f5f5f5;
			font-size: 13px;
		}
		.action-row:hover { background: #f8f9fa; }
		.action-row.selected { background: #e8f0fe; }
		.action-row.disabled { opacity: 0.5; }
		.action-icon { width: 16px; text-align: center; color: #53ace3; font-size: 13px; }
		.action-label { flex: 1; }
		.action-type-badge {
			font-size: 10px;
			padding: 1px 6px;
			border-radius: 8px;
			background: #eee;
			color: #666;
			text-transform: uppercase;
		}
		.toggle-btn .fa-toggle-on { color: #4fc236; }
		.toggle-btn .fa-toggle-off { color: #ccc; }

		.editor-panel-container {
			flex: 1;
			overflow-y: auto;
		}
		.group-editor {
			display: flex;
			flex-direction: column;
			height: 100%;
		}
		.group-editor .editor-header {
			padding: 12px 16px;
			border-bottom: 1px solid #eee;
		}
		.group-editor .editor-header h4 { margin: 0; font-size: 14px; font-weight: 600; }
		.group-editor .editor-body {
			flex: 1;
			padding: 12px 16px;
		}
		.form-group { margin-bottom: 12px; }
		.form-group label { display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px; }
		.form-group input[type="text"] { width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box; }
		.form-group-inline { display: flex; gap: 16px; margin-bottom: 12px; }
		.form-group-inline label { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
		.group-editor .editor-footer { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #eee; justify-content: flex-end; }
	`]
})
export class ActionManagerComponent extends ComponentBase implements OnInit, OnDestroy {
	@Output() close = new EventEmitter<void>();

	groups: ActionGroup[] = [];
	selectedAction?: ActionDefinition;
	selectedGroupId?: string;
	isNewAction = false;

	editingGroup?: ActionGroup;
	editingGroupIsNew = false;

	constructor(
		ele: ElementRef,
		private configService: ActionConfigService
	) {
		super(ele);
	}

	ngOnInit(): void {
		this.loadConfig();
		this.observableSubTeardowns.push(
			this.configService.configChanged.subscribe(() => this.loadConfig())
		);
		console.log('[IGX-OTT] Action Manager opened');
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	private loadConfig(): void {
		this.groups = this.configService.getGroups();
	}

	getActionsForGroup(groupId: string): ActionDefinition[] {
		return this.configService.getActionsForGroup(groupId);
	}

	// ─── Selection ───────────────────────────────────

	selectGroup(group: ActionGroup): void {
		this.selectedGroupId = group.id;
		this.selectedAction = undefined;
		this.editingGroup = undefined;
		this.isNewAction = false;
	}

	selectAction(action: ActionDefinition): void {
		this.selectedAction = action;
		this.editingGroup = undefined;
		this.isNewAction = false;
	}

	// ─── Group CRUD ──────────────────────────────────

	onAddGroup(): void {
		this.editingGroupIsNew = true;
		this.editingGroup = {
			id: 'group-' + Date.now(),
			label: '',
			order: this.groups.length + 1,
			collapsible: true,
			collapsed: false
		};
		this.selectedAction = undefined;
	}

	onEditGroup(group: ActionGroup, event: Event): void {
		event.stopPropagation();
		this.editingGroupIsNew = false;
		this.editingGroup = { ...group };
		this.selectedAction = undefined;
	}

	onRemoveGroup(group: ActionGroup, event: Event): void {
		event.stopPropagation();
		this.configService.removeGroup(group.id);
		this.editingGroup = undefined;
		this.selectedGroupId = undefined;
	}

	saveGroup(): void {
		if (!this.editingGroup) return;
		if (this.editingGroupIsNew) {
			this.configService.addGroup(this.editingGroup);
		} else {
			this.configService.updateGroup(this.editingGroup.id, this.editingGroup);
		}
		this.editingGroup = undefined;
	}

	cancelGroupEdit(): void {
		this.editingGroup = undefined;
	}

	// ─── Action CRUD ─────────────────────────────────

	onAddAction(): void {
		const groupId = this.selectedGroupId || (this.groups.length > 0 ? this.groups[0].id : '');
		if (!groupId) return;

		this.isNewAction = true;
		this.editingGroup = undefined;
		this.selectedAction = {
			id: 'action-' + Date.now(),
			label: '',
			icon: 'fa-circle',
			description: '',
			handler: { type: 'modal' as ActionType },
			visibility: {},
			enabled: true,
			order: this.getActionsForGroup(groupId).length + 1,
			groupId
		};
	}

	onSaveAction(action: ActionDefinition): void {
		if (this.isNewAction) {
			this.configService.addAction(action);
		} else {
			this.configService.updateAction(action.id, action);
		}
		this.selectedAction = undefined;
		this.isNewAction = false;
	}

	onDeleteAction(id: string): void {
		this.configService.removeAction(id);
		this.selectedAction = undefined;
	}

	cancelActionEdit(): void {
		this.selectedAction = undefined;
		this.isNewAction = false;
	}

	toggleAction(action: ActionDefinition, event: Event): void {
		event.stopPropagation();
		this.configService.updateAction(action.id, { enabled: !action.enabled });
	}

	// ─── Bulk ────────────────────────────────────────

	onResetDefaults(): void {
		this.configService.resetToDefaults();
		this.selectedAction = undefined;
		this.editingGroup = undefined;
	}

	onClose(): void {
		this.close.emit();
	}
}
