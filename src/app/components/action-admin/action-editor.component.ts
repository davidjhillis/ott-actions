import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActionDefinition, ActionGroup, ActionHandler, ActionType, VisibilityRule } from '../../models/action.model';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { IconPickerComponent } from '../shared/icon-picker.component';

/** Available CMS services and their methods */
const CMS_SERVICES = [
	{
		name: 'PageCommandsServices',
		description: 'Page/content operations',
		methods: [
			{ name: 'GetPageData', description: 'Get page content and metadata' },
			{ name: 'GetPageProperties', description: 'Get page properties (workflow, dates, etc.)' },
			{ name: 'Save', description: 'Save page content' },
			{ name: 'Advance', description: 'Advance workflow state' },
			{ name: 'Assign', description: 'Assign page to user' },
			{ name: 'CheckIn', description: 'Check in page' },
			{ name: 'CheckOut', description: 'Check out page for editing' },
			{ name: 'GetVersionHistoryPaged', description: 'Get page version history' },
			{ name: 'Revert', description: 'Revert to previous version' },
			{ name: 'Delete', description: 'Delete page' },
			{ name: 'Publish', description: 'Publish page to site' },
			{ name: 'Unpublish', description: 'Unpublish page from site' }
		]
	},
	{
		name: 'SiteTreeServices',
		description: 'Site tree navigation',
		methods: [
			{ name: 'GetChildPagesSimple', description: 'Get child pages of a folder' },
			{ name: 'CreateNewPage', description: 'Create new page or folder' },
			{ name: 'GetPageProperties', description: 'Get page tree properties' },
			{ name: 'MovePage', description: 'Move page to different location' },
			{ name: 'CopyPage', description: 'Copy page to new location' }
		]
	},
	{
		name: 'WorkflowServices',
		description: 'Workflow management',
		methods: [
			{ name: 'GetContentItemAdvanceInfo', description: 'Get available workflow transitions' },
			{ name: 'GetWorkflowStates', description: 'Get all workflow states' },
			{ name: 'GetAssignableUsers', description: 'Get users for assignment' }
		]
	},
	{
		name: 'UserManagerServices',
		description: 'User management',
		methods: [
			{ name: 'GetUsersAndGroupsSimple', description: 'Get users and groups list' },
			{ name: 'GetCurrentUser', description: 'Get current logged-in user' }
		]
	},
	{
		name: 'AssetServices',
		description: 'Asset/media operations',
		methods: [
			{ name: 'GetAssetInfo', description: 'Get asset metadata' },
			{ name: 'UploadAsset', description: 'Upload new asset' },
			{ name: 'DeleteAsset', description: 'Delete asset' }
		]
	},
	{
		name: 'TranslationServices',
		description: 'Translation management',
		methods: [
			{ name: 'GetTranslationStatus', description: 'Get translation status' },
			{ name: 'SendToTranslation', description: 'Submit for translation' },
			{ name: 'GetAvailableLanguages', description: 'Get available languages' }
		]
	}
];

/** Built-in modal/panel components */
const BUILT_IN_COMPONENTS = [
	{ id: 'distribute-report', label: 'Distribute Report', type: 'modal', description: 'Email distribution dialog' },
	{ id: 'send-to-translation', label: 'Send to Translation', type: 'modal', description: 'Translation submission form' },
	{ id: 'assign-report-number', label: 'Assign Report Number', type: 'modal', description: 'Assign tracking number' },
	{ id: 'export-collection', label: 'Export Collection', type: 'modal', description: 'Export folder contents' },
	{ id: 'create-collection', label: 'Create Collection', type: 'modal', description: 'Create new folder' },
	{ id: 'manage-workflow', label: 'Manage Workflow', type: 'modal', description: 'Workflow state management' },
	{ id: 'batch-assign', label: 'Batch Assign', type: 'modal', description: 'Assign multiple items' },
	{ id: 'view-details', label: 'View Details', type: 'panel', description: 'Asset detail panel' },
	{ id: 'view-history', label: 'View History', type: 'panel', description: 'Version history panel' }
];

@Component({
	selector: 'app-action-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent, IconPickerComponent],
	template: `
		<div class="editor-panel" *ngIf="action">
			<div class="editor-header">
				<h4>{{ isNew ? 'Create Action' : 'Edit Action' }}</h4>
			</div>
			<div class="editor-body">
				<!-- Basic Info Section -->
				<div class="section-header">
					<ott-icon name="tag" [size]="14"></ott-icon>
					<span>Basic Info</span>
				</div>

				<div class="form-row">
					<div class="form-group flex-2">
						<label>Label <span class="required">*</span></label>
						<input type="text" [(ngModel)]="draft.label" placeholder="e.g., Publish to Web">
						<span class="field-hint">Button text shown in the action bar</span>
					</div>
					<div class="form-group flex-1">
						<label>Icon</label>
						<ott-icon-picker [(value)]="draft.icon"></ott-icon-picker>
					</div>
				</div>

				<div class="form-group">
					<label>Description</label>
					<input type="text" [(ngModel)]="draft.description" placeholder="Brief tooltip description">
					<span class="field-hint">Shown on hover</span>
				</div>

				<div class="form-group">
					<label>Group</label>
					<select [(ngModel)]="draft.groupId">
						<option *ngFor="let g of groups" [value]="g.id">{{ g.label }}</option>
					</select>
				</div>

				<!-- Action Type Section -->
				<div class="section-header">
					<ott-icon name="zap" [size]="14"></ott-icon>
					<span>Action Type</span>
				</div>

				<div class="form-group">
					<div class="action-type-cards">
						<div class="type-card"
							[class.selected]="draft.handler.type === 'modal'"
							(click)="setActionType('modal')">
							<ott-icon name="square" [size]="20"></ott-icon>
							<span class="type-label">Modal Dialog</span>
							<span class="type-desc">Centered popup window</span>
						</div>
						<div class="type-card"
							[class.selected]="draft.handler.type === 'panel'"
							(click)="setActionType('panel')">
							<ott-icon name="panel-right" [size]="20"></ott-icon>
							<span class="type-label">Side Panel</span>
							<span class="type-desc">Right drawer panel</span>
						</div>
						<div class="type-card"
							[class.selected]="draft.handler.type === 'cmsApi'"
							(click)="setActionType('cmsApi')">
							<ott-icon name="database" [size]="20"></ott-icon>
							<span class="type-label">CMS API</span>
							<span class="type-desc">Direct service call</span>
						</div>
						<div class="type-card"
							[class.selected]="draft.handler.type === 'link'"
							(click)="setActionType('link')">
							<ott-icon name="link" [size]="20"></ott-icon>
							<span class="type-label">Link / URL</span>
							<span class="type-desc">Navigate to URL</span>
						</div>
					</div>
				</div>

				<!-- Modal/Panel Config -->
				<div class="config-section" *ngIf="draft.handler.type === 'modal' || draft.handler.type === 'panel'">
					<div class="form-group">
						<label>Component</label>
						<select [(ngModel)]="draft.handler.componentId">
							<option value="">-- Select a component --</option>
							<optgroup [label]="draft.handler.type === 'modal' ? 'Modal Components' : 'Panel Components'">
								<option *ngFor="let comp of getComponentsForType(draft.handler.type)" [value]="comp.id">
									{{ comp.label }}
								</option>
							</optgroup>
						</select>
						<span class="field-hint">
							{{ getSelectedComponentDescription() || 'Select a built-in UI component to display' }}
						</span>
					</div>
				</div>

				<!-- CMS API Config -->
				<div class="config-section" *ngIf="draft.handler.type === 'cmsApi'">
					<div class="form-group">
						<label>CMS Service</label>
						<select [(ngModel)]="draft.handler.cmsService" (ngModelChange)="onServiceChange()">
							<option value="">-- Select a service --</option>
							<option *ngFor="let svc of cmsServices" [value]="svc.name">
								{{ svc.name }} — {{ svc.description }}
							</option>
						</select>
					</div>

					<div class="form-group" *ngIf="draft.handler.cmsService">
						<label>Service Method</label>
						<select [(ngModel)]="draft.handler.cmsMethod">
							<option value="">-- Select a method --</option>
							<option *ngFor="let method of getMethodsForService()" [value]="method.name">
								{{ method.name }} — {{ method.description }}
							</option>
						</select>
						<span class="field-hint" *ngIf="draft.handler.cmsMethod">
							{{ getSelectedMethodDescription() }}
						</span>
					</div>

					<div class="form-group" *ngIf="draft.handler.cmsMethod">
						<label>Post-Call Action <span class="optional">(optional)</span></label>
						<select [(ngModel)]="draft.handler.postCall">
							<option value="">None</option>
							<option value="refreshTree">Refresh Site Tree</option>
							<option value="refreshPage">Refresh Current Page</option>
							<option value="refreshAssets">Refresh Assets Panel</option>
						</select>
						<span class="field-hint">UI action to perform after the API call completes</span>
					</div>

					<div class="form-group-inline" *ngIf="draft.handler.cmsMethod">
						<label>
							<input type="checkbox" [(ngModel)]="draft.handler.confirmBefore">
							Show confirmation dialog before executing
						</label>
					</div>
				</div>

				<!-- Link Config -->
				<div class="config-section" *ngIf="draft.handler.type === 'link' || draft.handler.type === 'external'">
					<div class="form-group">
						<label>URL</label>
						<input type="text" [(ngModel)]="draft.handler.url" placeholder="https://example.com/page">
						<span class="field-hint">Full URL including https://</span>
					</div>
					<div class="form-group-inline">
						<label>
							<input type="checkbox" [(ngModel)]="draft.handler.newTab">
							Open in new tab
						</label>
					</div>
				</div>

				<!-- Visibility Section -->
				<div class="section-header">
					<ott-icon name="eye" [size]="14"></ott-icon>
					<span>Visibility Rules</span>
				</div>

				<div class="form-group-inline">
					<label>
						<input type="checkbox" [(ngModel)]="draft.visibility!.folderOnly">
						Folders only
					</label>
					<label>
						<input type="checkbox" [(ngModel)]="draft.visibility!.fileOnly">
						Files/pages only
					</label>
				</div>

				<div class="form-group">
					<label><input type="checkbox" [(ngModel)]="draft.enabled"> Action is enabled</label>
				</div>
			</div>

			<div class="editor-footer">
				<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
				<button class="btn btn-danger" *ngIf="!isNew" (click)="onDelete()">Delete</button>
				<button class="btn btn-primary" (click)="onSave()" [disabled]="!draft.label">
					{{ isNew ? 'Create Action' : 'Save Changes' }}
				</button>
			</div>
		</div>

		<div class="editor-empty" *ngIf="!action">
			<ott-icon name="mouse-pointer" [size]="32" color="var(--ott-text-muted)"></ott-icon>
			<p>Select an action to edit</p>
			<p class="hint">Or click "Add Action" to create a new one</p>
		</div>
	`,
	styles: [`
		:host { display: block; height: 100%; }
		.editor-panel {
			display: flex;
			flex-direction: column;
			height: 100%;
		}
		.editor-header {
			padding: 16px 24px;
			border-bottom: 1px solid var(--ott-border-light);
			background: var(--ott-bg-muted);
		}
		.editor-header h4 {
			margin: 0;
			font-family: Helvetica, Arial, sans-serif;
			font-size: 18px;
			font-weight: 400;
			color: var(--ott-text);
		}
		.editor-body {
			flex: 1;
			overflow-y: auto;
			padding: 20px 24px;
		}

		/* Section headers */
		.section-header {
			display: flex;
			align-items: center;
			gap: 8px;
			margin: 20px 0 12px;
			padding-bottom: 8px;
			border-bottom: 1px solid var(--ott-border-light);
			color: var(--ott-text-secondary);
		}
		.section-header:first-child { margin-top: 0; }
		.section-header span {
			font-family: Helvetica, Arial, sans-serif;
			font-size: 12px;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		/* Form layout */
		.form-row {
			display: flex;
			gap: 16px;
		}
		.flex-1 { flex: 1; }
		.flex-2 { flex: 2; }

		.form-group {
			margin-bottom: 16px;
		}
		.form-group label {
			display: block;
			font-family: Helvetica, Arial, sans-serif;
			font-size: 13px;
			font-weight: 500;
			color: var(--ott-text);
			margin-bottom: 6px;
		}
		.form-group label .required { color: var(--ott-danger); }
		.form-group label .optional {
			font-weight: 400;
			color: var(--ott-text-muted);
			font-size: 11px;
		}

		.form-group input[type="text"],
		.form-group textarea,
		.form-group select {
			width: 100%;
			padding: 9px 12px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-family: Helvetica, Arial, sans-serif;
			font-size: 14px;
			box-sizing: border-box;
			color: var(--ott-text);
			background: var(--ott-bg);
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		.form-group input[type="text"]:focus,
		.form-group textarea:focus,
		.form-group select:focus {
			outline: none;
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
		}
		.form-group textarea { resize: vertical; }
		.form-group select {
			cursor: pointer;
		}

		.field-hint {
			display: block;
			font-family: Helvetica, Arial, sans-serif;
			font-size: 12px;
			color: var(--ott-text-muted);
			margin-top: 4px;
		}

		/* Action type cards */
		.action-type-cards {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 10px;
		}
		.type-card {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 14px 10px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-lg);
			background: var(--ott-bg);
			cursor: pointer;
			transition: all 0.15s;
			text-align: center;
		}
		.type-card:hover {
			border-color: var(--ott-primary);
			background: var(--ott-bg-muted);
		}
		.type-card.selected {
			border-color: var(--ott-primary);
			background: var(--ott-primary-light);
		}
		.type-card ott-icon {
			color: var(--ott-text-secondary);
			margin-bottom: 6px;
		}
		.type-card.selected ott-icon {
			color: var(--ott-primary);
		}
		.type-label {
			font-family: Helvetica, Arial, sans-serif;
			font-size: 13px;
			font-weight: 500;
			color: var(--ott-text);
		}
		.type-desc {
			font-family: Helvetica, Arial, sans-serif;
			font-size: 11px;
			color: var(--ott-text-muted);
			margin-top: 2px;
		}

		/* Config section */
		.config-section {
			background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-lg);
			padding: 16px;
			margin: 16px 0;
		}
		.config-section .form-group:last-child { margin-bottom: 0; }

		.form-group-inline {
			display: flex;
			gap: 20px;
			margin-bottom: 14px;
		}
		.form-group-inline label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-family: Helvetica, Arial, sans-serif;
			font-size: 14px;
			cursor: pointer;
			color: var(--ott-text);
		}
		.form-group-inline input[type="checkbox"] {
			width: 16px;
			height: 16px;
			cursor: pointer;
		}

		.editor-footer {
			display: flex;
			gap: 10px;
			padding: 16px 24px;
			border-top: 1px solid var(--ott-border-light);
			justify-content: flex-end;
			background: var(--ott-bg-muted);
		}
		.btn {
			padding: 9px 18px;
			border-radius: var(--ott-radius-md);
			font-family: Helvetica, Arial, sans-serif;
			font-size: 14px;
			font-weight: 500;
			cursor: pointer;
			border: 1px solid var(--ott-border);
			transition: background-color 0.15s, border-color 0.15s;
		}
		.btn-secondary { background: var(--ott-bg); color: var(--ott-text); }
		.btn-secondary:hover { background: var(--ott-bg-hover); }
		.btn-primary {
			background: var(--ott-primary);
			color: #fff;
			border-color: var(--ott-primary);
		}
		.btn-primary:hover { background: var(--ott-primary-hover); }
		.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
		.btn-danger {
			background: var(--ott-bg);
			color: var(--ott-danger);
			border-color: var(--ott-danger);
		}
		.btn-danger:hover {
			background: var(--ott-danger);
			color: #fff;
		}

		.editor-empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			color: var(--ott-text-muted);
		}
		.editor-empty ott-icon { margin-bottom: 12px; }
		.editor-empty p {
			font-family: Helvetica, Arial, sans-serif;
			font-size: 14px;
			margin: 0;
		}
		.editor-empty .hint {
			font-size: 13px;
			margin-top: 4px;
			color: var(--ott-text-muted);
		}
	`]
})
export class ActionEditorComponent implements OnChanges {
	@Input() action?: ActionDefinition;
	@Input() groups: ActionGroup[] = [];
	@Input() isNew = false;
	@Output() save = new EventEmitter<ActionDefinition>();
	@Output() delete = new EventEmitter<string>();
	@Output() cancel = new EventEmitter<void>();

	draft: ActionDefinition = this.createEmpty();
	cmsServices = CMS_SERVICES;
	builtInComponents = BUILT_IN_COMPONENTS;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['action'] && this.action) {
			this.draft = JSON.parse(JSON.stringify(this.action));
			if (!this.draft.visibility) {
				this.draft.visibility = {};
			}
		}
	}

	setActionType(type: ActionType): void {
		this.draft.handler.type = type;
		// Clear type-specific fields when changing type
		if (type === 'modal' || type === 'panel') {
			this.draft.handler.cmsService = undefined;
			this.draft.handler.cmsMethod = undefined;
			this.draft.handler.url = undefined;
		} else if (type === 'cmsApi') {
			this.draft.handler.componentId = undefined;
			this.draft.handler.url = undefined;
		} else {
			this.draft.handler.componentId = undefined;
			this.draft.handler.cmsService = undefined;
			this.draft.handler.cmsMethod = undefined;
		}
	}

	getComponentsForType(type: string): typeof BUILT_IN_COMPONENTS {
		return this.builtInComponents.filter(c => c.type === type);
	}

	getSelectedComponentDescription(): string {
		if (!this.draft.handler.componentId) return '';
		const comp = this.builtInComponents.find(c => c.id === this.draft.handler.componentId);
		return comp ? comp.description : '';
	}

	onServiceChange(): void {
		// Reset method when service changes
		this.draft.handler.cmsMethod = undefined;
	}

	getMethodsForService(): { name: string; description: string }[] {
		const svc = this.cmsServices.find(s => s.name === this.draft.handler.cmsService);
		return svc ? svc.methods : [];
	}

	getSelectedMethodDescription(): string {
		const methods = this.getMethodsForService();
		const method = methods.find(m => m.name === this.draft.handler.cmsMethod);
		return method ? method.description : '';
	}

	onSave(): void {
		this.save.emit(JSON.parse(JSON.stringify(this.draft)));
	}

	onDelete(): void {
		if (this.action) {
			this.delete.emit(this.action.id);
		}
	}

	onCancel(): void {
		this.cancel.emit();
	}

	private createEmpty(): ActionDefinition {
		return {
			id: '',
			label: '',
			icon: 'circle',
			description: '',
			handler: { type: 'modal' as ActionType },
			visibility: {},
			enabled: true,
			order: 0,
			groupId: ''
		};
	}
}
