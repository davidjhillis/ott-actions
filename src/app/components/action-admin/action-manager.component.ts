import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentBase } from '../../ComponentBase';
import { ActionConfigService } from '../../services/action-config.service';
import { ActionDefinition, ActionGroup, ActionType } from '../../models/action.model';
import { ActionEditorComponent } from './action-editor.component';
import { LucideIconComponent } from '../shared/lucide-icon.component';

@Component({
	selector: 'app-action-manager',
	standalone: true,
	imports: [CommonModule, FormsModule, ActionEditorComponent, LucideIconComponent],
	template: `
		<div class="manager-overlay">
			<div class="manager-dialog">
				<div class="manager-header">
					<h2>Action Manager</h2>
					<div class="header-actions">
						<button class="btn btn-sm" (click)="onAddGroup()">
							<ott-icon name="folder-plus" [size]="13"></ott-icon> Add Group
						</button>
						<button class="btn btn-sm" (click)="onAddAction()">
							<ott-icon name="plus" [size]="13"></ott-icon> Add Action
						</button>
						<button class="btn btn-sm" (click)="onExportConfig()">
							<ott-icon name="download" [size]="13"></ott-icon> Export
						</button>
						<button class="btn btn-sm" (click)="fileInput.click()">
							<ott-icon name="upload" [size]="13"></ott-icon> Import
						</button>
						<input #fileInput type="file" accept=".json" style="display:none"
							(change)="onImportConfig($event)">
						<button class="btn btn-sm" (click)="onResetDefaults()">
							<ott-icon name="rotate-ccw" [size]="13"></ott-icon> Reset
						</button>
						<button class="close-btn" (click)="onClose()">
							<ott-icon name="x" [size]="18"></ott-icon>
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
									<span class="drag-handle"><ott-icon name="grip-vertical" [size]="12"></ott-icon></span>
									<span class="group-name">{{ group.label }}</span>
									<span class="group-count">({{ getActionsForGroup(group.id).length }})</span>
								</div>
								<div class="group-actions-btns">
									<button class="icon-btn" (click)="onEditGroup(group, $event)" title="Edit group">
										<ott-icon name="pencil" [size]="13"></ott-icon>
									</button>
									<button class="icon-btn" (click)="onRemoveGroup(group, $event)" title="Remove group">
										<ott-icon name="trash-2" [size]="13"></ott-icon>
									</button>
								</div>
							</div>
							<div class="action-list">
								<div class="action-row"
									*ngFor="let action of getActionsForGroup(group.id); let ai = index"
									[class.selected]="selectedAction?.id === action.id"
									[class.disabled]="!action.enabled"
									(click)="selectAction(action)">
									<span class="drag-handle"><ott-icon name="grip-vertical" [size]="12"></ott-icon></span>
									<span class="action-icon"><ott-icon [name]="action.icon" [size]="14"></ott-icon></span>
									<span class="action-label">{{ action.label }}</span>
									<span class="action-type-badge">{{ action.handler.type }}</span>
									<button class="toggle-switch"
										[class.active]="action.enabled"
										(click)="toggleAction(action, $event)"
										[title]="action.enabled ? 'Disable' : 'Enable'">
										<span class="toggle-knob"></span>
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
			background: rgba(0,0,0,0.4);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: var(--ott-font);
		}
		.manager-dialog {
			background: var(--ott-bg);
			border-radius: var(--ott-radius-xl);
			box-shadow: var(--ott-shadow-xl);
			width: 880px;
			height: 620px;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			border: 1px solid var(--ott-border);
		}
		.manager-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid var(--ott-border);
			background: var(--ott-bg-muted);
		}
		.manager-header h2 {
			margin: 0;
			font-size: 15px;
			font-weight: 600;
			color: var(--ott-text);
		}
		.header-actions {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.btn {
			padding: 6px 12px;
			border-radius: var(--ott-radius-md);
			font-size: 12px;
			font-family: var(--ott-font);
			font-weight: 500;
			cursor: pointer;
			border: 1px solid var(--ott-border);
			background: var(--ott-bg);
			color: var(--ott-text);
			display: inline-flex;
			align-items: center;
			gap: 5px;
			transition: background-color 0.15s, border-color 0.15s;
		}
		.btn:hover { background: var(--ott-bg-hover); }
		.btn-sm { padding: 5px 10px; font-size: 11px; }
		.btn-secondary { background: var(--ott-bg); color: var(--ott-text); }
		.btn-primary {
			background: var(--ott-primary);
			color: #fff;
			border-color: var(--ott-primary);
		}
		.btn-primary:hover { background: var(--ott-primary-hover); }
		.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
		.close-btn {
			border: none;
			background: none;
			font-size: 18px;
			cursor: pointer;
			color: var(--ott-text-muted);
			padding: 4px 8px;
			border-radius: var(--ott-radius-sm);
			transition: color 0.15s, background-color 0.15s;
		}
		.close-btn:hover {
			color: var(--ott-text);
			background: var(--ott-bg-hover);
		}

		.manager-body {
			display: flex;
			flex: 1;
			overflow: hidden;
		}
		.list-panel {
			width: 500px;
			border-right: 1px solid var(--ott-border);
			overflow-y: auto;
			background: var(--ott-bg-muted);
		}
		.group-section { margin-bottom: 1px; }
		.group-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10px 14px;
			background: var(--ott-bg-subtle);
			cursor: pointer;
			border-bottom: 1px solid var(--ott-border);
			transition: background-color 0.15s;
		}
		.group-header.selected { background: var(--ott-bg-selected); }
		.group-header:hover { background: var(--ott-bg-hover); }
		.group-title {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.drag-handle {
			color: var(--ott-text-muted);
			font-size: 10px;
			cursor: grab;
		}
		.group-name {
			font-weight: 600;
			font-size: 13px;
			color: var(--ott-text);
		}
		.group-count {
			color: var(--ott-text-muted);
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
			padding: 4px 6px;
			color: var(--ott-text-muted);
			font-size: 12px;
			border-radius: var(--ott-radius-sm);
			transition: background-color 0.15s, color 0.15s;
		}
		.icon-btn:hover {
			background: rgba(0,0,0,0.06);
			color: var(--ott-text);
		}

		.action-list { background: var(--ott-bg); }
		.action-row {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 14px 8px 28px;
			cursor: pointer;
			border-bottom: 1px solid var(--ott-border-light);
			font-size: 13px;
			transition: background-color 0.15s;
		}
		.action-row:hover { background: var(--ott-bg-muted); }
		.action-row.selected { background: var(--ott-bg-selected); }
		.action-row.disabled { opacity: 0.5; }
		.action-icon {
			width: 16px;
			text-align: center;
			color: var(--ott-primary);
			font-size: 13px;
			flex-shrink: 0;
		}
		.action-label { flex: 1; color: var(--ott-text); }
		.action-type-badge {
			font-size: 10px;
			padding: 2px 8px;
			border-radius: var(--ott-radius-full);
			background: var(--ott-bg-subtle);
			color: var(--ott-text-secondary);
			text-transform: uppercase;
			font-weight: 500;
			letter-spacing: 0.02em;
		}

		/* Toggle switch */
		.toggle-switch {
			position: relative;
			display: inline-flex;
			align-items: center;
			width: 36px;
			height: 20px;
			border-radius: var(--ott-radius-full);
			border: none;
			background: #d1d5db;
			cursor: pointer;
			padding: 0;
			flex-shrink: 0;
			transition: background-color 0.2s;
		}
		.toggle-switch.active { background: var(--ott-success); }
		.toggle-knob {
			position: absolute;
			top: 2px;
			left: 2px;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background: white;
			box-shadow: var(--ott-shadow-sm);
			transition: transform 0.2s ease;
		}
		.toggle-switch.active .toggle-knob {
			transform: translateX(16px);
		}

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
			padding: 14px 20px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.group-editor .editor-header h4 {
			margin: 0;
			font-size: 14px;
			font-weight: 600;
			color: var(--ott-text);
		}
		.group-editor .editor-body {
			flex: 1;
			padding: 16px 20px;
		}
		.form-group { margin-bottom: 14px; }
		.form-group label {
			display: block;
			font-size: 12px;
			font-weight: 500;
			color: var(--ott-text-secondary);
			margin-bottom: 5px;
		}
		.form-group input[type="text"] {
			width: 100%;
			padding: 7px 10px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-size: 13px;
			font-family: var(--ott-font);
			box-sizing: border-box;
			color: var(--ott-text);
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		.form-group input[type="text"]:focus {
			outline: none;
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
		}
		.form-group-inline { display: flex; gap: 16px; margin-bottom: 14px; }
		.form-group-inline label {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 13px;
			cursor: pointer;
			color: var(--ott-text);
		}
		.group-editor .editor-footer {
			display: flex;
			gap: 8px;
			padding: 14px 20px;
			border-top: 1px solid var(--ott-border-light);
			justify-content: flex-end;
		}
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

	// --- Selection ---

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

	// --- Group CRUD ---

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

	// --- Action CRUD ---

	onAddAction(): void {
		const groupId = this.selectedGroupId || (this.groups.length > 0 ? this.groups[0].id : '');
		if (!groupId) return;

		this.isNewAction = true;
		this.editingGroup = undefined;
		this.selectedAction = {
			id: 'action-' + Date.now(),
			label: '',
			icon: 'circle',
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

	// --- Import/Export ---

	onExportConfig(): void {
		this.configService.exportToFile();
	}

	async onImportConfig(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const success = await this.configService.importFromFile(file);
		if (success) {
			this.loadConfig();
			this.selectedAction = undefined;
			this.editingGroup = undefined;
		}

		// Reset file input so the same file can be re-imported
		input.value = '';
	}

	// --- Bulk ---

	onResetDefaults(): void {
		this.configService.resetToDefaults();
		this.selectedAction = undefined;
		this.editingGroup = undefined;
	}

	onClose(): void {
		this.close.emit();
	}
}
