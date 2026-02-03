import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActionDefinition, ActionGroup, ActionHandler, ActionType, VisibilityRule } from '../../models/action.model';

@Component({
	selector: 'app-action-editor',
	standalone: true,
	imports: [CommonModule, FormsModule],
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
					<label>Icon (Font Awesome)</label>
					<div class="icon-input">
						<span class="icon-preview fa-light" [ngClass]="draft.icon || 'fa-circle'"></span>
						<input type="text" [(ngModel)]="draft.icon" placeholder="fa-paper-plane">
					</div>
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
			<span class="fa-light fa-hand-pointer"></span>
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
			padding: 12px 16px;
			border-bottom: 1px solid #eee;
		}
		.editor-header h4 {
			margin: 0;
			font-size: 14px;
			font-weight: 600;
		}
		.editor-body {
			flex: 1;
			overflow-y: auto;
			padding: 12px 16px;
		}
		.form-group {
			margin-bottom: 12px;
		}
		.form-group label {
			display: block;
			font-size: 12px;
			font-weight: 600;
			color: #666;
			margin-bottom: 4px;
		}
		.form-group input[type="text"],
		.form-group textarea,
		.form-group select {
			width: 100%;
			padding: 6px 8px;
			border: 1px solid #ddd;
			border-radius: 4px;
			font-size: 13px;
			box-sizing: border-box;
		}
		.form-group textarea { resize: vertical; }
		.icon-input {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.icon-preview {
			width: 24px;
			height: 24px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
			color: #53ace3;
			background: #f0f7ff;
			border-radius: 4px;
		}
		.icon-input input { flex: 1; }
		.form-divider {
			border-top: 1px solid #eee;
			margin: 16px 0 12px;
		}
		h5 {
			margin: 0 0 8px;
			font-size: 12px;
			font-weight: 600;
			color: #666;
			text-transform: uppercase;
		}
		.form-group-inline {
			display: flex;
			gap: 16px;
			margin-bottom: 12px;
		}
		.form-group-inline label {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 13px;
			cursor: pointer;
		}
		.editor-footer {
			display: flex;
			gap: 8px;
			padding: 12px 16px;
			border-top: 1px solid #eee;
			justify-content: flex-end;
		}
		.btn {
			padding: 6px 14px;
			border-radius: 4px;
			font-size: 13px;
			cursor: pointer;
			border: 1px solid #ddd;
		}
		.btn-secondary { background: #fff; color: #333; }
		.btn-secondary:hover { background: #f5f5f5; }
		.btn-primary { background: #53ace3; color: #fff; border-color: #53ace3; }
		.btn-primary:hover { background: #3d9ad4; }
		.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
		.btn-danger { background: #fff; color: #dc3545; border-color: #dc3545; }
		.btn-danger:hover { background: #dc3545; color: #fff; }
		.editor-empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			color: #999;
		}
		.editor-empty .fa-light { font-size: 32px; margin-bottom: 8px; }
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
			icon: 'fa-circle',
			description: '',
			handler: { type: 'modal' as ActionType },
			visibility: {},
			enabled: true,
			order: 0,
			groupId: ''
		};
	}
}
