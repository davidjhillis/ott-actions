import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActionDefinition, ActionGroup, ActionHandler, ActionType, VisibilityRule } from '../../models/action.model';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { IconPickerComponent } from '../shared/icon-picker.component';

@Component({
	selector: 'app-action-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent, IconPickerComponent],
	template: `
		<div class="editor-panel" *ngIf="action">
			<div class="editor-header">
				<h4>{{ isNew ? 'New Action' : 'Edit Action' }}</h4>
			</div>
			<div class="editor-body">
				<div class="form-group">
					<label>Label</label>
					<input type="text" [(ngModel)]="draft.label" placeholder="Action label">
				</div>

				<div class="form-group">
					<label>Icon</label>
					<ott-icon-picker [(value)]="draft.icon"></ott-icon-picker>
				</div>

				<div class="form-group">
					<label>Description</label>
					<textarea [(ngModel)]="draft.description" rows="2" placeholder="Brief description"></textarea>
				</div>

				<div class="form-group">
					<label>Group</label>
					<select [(ngModel)]="draft.groupId">
						<option *ngFor="let g of groups" [value]="g.id">{{ g.label }}</option>
					</select>
				</div>

				<div class="form-group">
					<label>Action Type</label>
					<select [(ngModel)]="draft.handler.type">
						<option value="modal">Modal Dialog</option>
						<option value="panel">Side Panel</option>
						<option value="cmsApi">CMS API Call</option>
						<option value="link">Open Link</option>
						<option value="external">External App</option>
					</select>
				</div>

				<div class="form-group" *ngIf="draft.handler.type === 'modal' || draft.handler.type === 'panel'">
					<label>Component ID</label>
					<input type="text" [(ngModel)]="draft.handler.componentId" placeholder="component-id">
				</div>

				<div class="form-group" *ngIf="draft.handler.type === 'cmsApi'">
					<label>API Endpoint</label>
					<input type="text" [(ngModel)]="draft.handler.endpoint" placeholder="/api/...">
				</div>
				<div class="form-group" *ngIf="draft.handler.type === 'cmsApi'">
					<label>HTTP Method</label>
					<select [(ngModel)]="draft.handler.method">
						<option value="GET">GET</option>
						<option value="POST">POST</option>
						<option value="PUT">PUT</option>
						<option value="DELETE">DELETE</option>
					</select>
				</div>

				<div class="form-group" *ngIf="draft.handler.type === 'link' || draft.handler.type === 'external'">
					<label>URL</label>
					<input type="text" [(ngModel)]="draft.handler.url" placeholder="https://...">
				</div>

				<div class="form-divider"></div>
				<h5>Visibility</h5>

				<div class="form-group-inline">
					<label><input type="checkbox" [(ngModel)]="draft.visibility!.folderOnly"> Folders only</label>
					<label><input type="checkbox" [(ngModel)]="draft.visibility!.fileOnly"> Files only</label>
				</div>

				<div class="form-group">
					<label><input type="checkbox" [(ngModel)]="draft.enabled"> Enabled</label>
				</div>
			</div>
			<div class="editor-footer">
				<button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
				<button class="btn btn-danger" *ngIf="!isNew" (click)="onDelete()">Delete</button>
				<button class="btn btn-primary" (click)="onSave()" [disabled]="!draft.label">Save</button>
			</div>
		</div>
		<div class="editor-empty" *ngIf="!action">
			<ott-icon name="mouse-pointer" [size]="32" color="var(--ott-text-muted)"></ott-icon>
			<p>Select an action to edit</p>
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
			padding: 14px 20px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.editor-header h4 {
			margin: 0;
			font-size: 14px;
			font-weight: 600;
			color: var(--ott-text);
		}
		.editor-body {
			flex: 1;
			overflow-y: auto;
			padding: 16px 20px;
		}
		.form-group {
			margin-bottom: 14px;
		}
		.form-group label {
			display: block;
			font-size: 12px;
			font-weight: 500;
			color: var(--ott-text-secondary);
			margin-bottom: 5px;
		}
		.form-group input[type="text"],
		.form-group textarea,
		.form-group select {
			width: 100%;
			padding: 7px 10px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-size: 13px;
			font-family: var(--ott-font);
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
		.form-divider {
			border-top: 1px solid var(--ott-border-light);
			margin: 18px 0 14px;
		}
		h5 {
			margin: 0 0 10px;
			font-size: 11px;
			font-weight: 600;
			color: var(--ott-text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.form-group-inline {
			display: flex;
			gap: 16px;
			margin-bottom: 14px;
		}
		.form-group-inline label {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 13px;
			cursor: pointer;
			color: var(--ott-text);
		}
		.editor-footer {
			display: flex;
			gap: 8px;
			padding: 14px 20px;
			border-top: 1px solid var(--ott-border-light);
			justify-content: flex-end;
		}
		.btn {
			padding: 7px 14px;
			border-radius: var(--ott-radius-md);
			font-size: 13px;
			font-family: var(--ott-font);
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
		.editor-empty ott-icon { margin-bottom: 8px; }
		.editor-empty p { font-size: 13px; }
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

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['action'] && this.action) {
			this.draft = JSON.parse(JSON.stringify(this.action));
			if (!this.draft.visibility) {
				this.draft.visibility = {};
			}
		}
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
