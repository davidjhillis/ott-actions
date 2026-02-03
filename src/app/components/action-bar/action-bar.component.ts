import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../ComponentBase';
import { ActionBarConfig, ActionDefinition, ActionGroup } from '../../models/action.model';
import { AssetContext } from '../../models/asset-context.model';
import { ActionGroupComponent } from './action-group.component';
import { DEFAULT_ACTION_BAR_CONFIG } from './default-actions';

@Component({
	selector: 'app-action-bar',
	standalone: true,
	imports: [CommonModule, ActionGroupComponent],
	template: `
		<div class="action-bar" [class.collapsed]="isCollapsed">
			<div class="action-bar-toggle" (click)="toggleCollapse()" title="Toggle Actions">
				<span class="fa-solid" [ngClass]="isCollapsed ? 'fa-chevron-left' : 'fa-chevron-right'"></span>
			</div>
			<div class="action-bar-content" *ngIf="!isCollapsed">
				<div class="action-bar-header">
					<h3>Actions</h3>
				</div>
				<div class="action-bar-body">
					<app-action-group
						*ngFor="let group of sortedGroups"
						[group]="group"
						[actions]="getActionsForGroup(group.id)"
						(actionClick)="onActionClick($event)">
					</app-action-group>
				</div>
				<div class="action-bar-footer">
					<button class="manage-actions-btn" (click)="onManageActions()">
						<span class="fa-light fa-sliders"></span>
						Manage Actions...
					</button>
				</div>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; height: 100%; }
		.action-bar {
			display: flex;
			flex-direction: row;
			height: 100%;
			background: #fff;
			border-left: 1px solid #ddd;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			position: relative;
		}
		.action-bar.collapsed {
			width: 24px;
		}
		.action-bar-toggle {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			min-width: 24px;
			cursor: pointer;
			background: #f5f5f5;
			border-right: 1px solid #ddd;
			color: #888;
			font-size: 10px;
			transition: background-color 0.15s;
		}
		.action-bar-toggle:hover {
			background: #e8e8e8;
			color: #333;
		}
		.action-bar-content {
			display: flex;
			flex-direction: column;
			width: 220px;
			overflow: hidden;
		}
		.action-bar-header {
			padding: 10px 12px 6px;
			border-bottom: 1px solid #eee;
		}
		.action-bar-header h3 {
			margin: 0;
			font-size: 14px;
			font-weight: 600;
			color: #333;
		}
		.action-bar-body {
			flex: 1;
			overflow-y: auto;
			padding: 4px 0;
		}
		.action-bar-footer {
			border-top: 1px solid #eee;
			padding: 8px;
		}
		.manage-actions-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			width: 100%;
			padding: 6px 8px;
			border: none;
			background: none;
			color: #53ace3;
			font-size: 12px;
			cursor: pointer;
			border-radius: 3px;
		}
		.manage-actions-btn:hover {
			background: #e8f0fe;
		}
	`]
})
export class ActionBarComponent extends ComponentBase implements OnInit, OnDestroy {
	@Input() config: ActionBarConfig = DEFAULT_ACTION_BAR_CONFIG;
	@Input() context?: AssetContext;
	@Output() actionExecute = new EventEmitter<ActionDefinition>();
	@Output() manageActions = new EventEmitter<void>();

	isCollapsed = false;

	constructor(ele: ElementRef) {
		super(ele);
	}

	ngOnInit(): void {
		console.log('[IGX-OTT] Action bar initialized');
	}

	ngOnDestroy(): void {
		this.cleanup();
	}

	get sortedGroups(): ActionGroup[] {
		return [...this.config.groups].sort((a, b) => a.order - b.order);
	}

	getActionsForGroup(groupId: string): ActionDefinition[] {
		return this.config.actions
			.filter(a => a.groupId === groupId)
			.filter(a => this.isActionVisible(a))
			.sort((a, b) => a.order - b.order);
	}

	private isActionVisible(action: ActionDefinition): boolean {
		if (!action.visibility) return true;
		const vis = action.visibility;

		if (vis.folderOnly && this.context && !this.context.isFolder) return false;
		if (vis.fileOnly && this.context && this.context.isFolder) return false;

		return true;
	}

	toggleCollapse(): void {
		this.isCollapsed = !this.isCollapsed;
	}

	onActionClick(action: ActionDefinition): void {
		console.log(`[IGX-OTT] Action clicked: ${action.id}`);
		this.actionExecute.emit(action);
	}

	onManageActions(): void {
		console.log('[IGX-OTT] Manage actions clicked');
		this.manageActions.emit();
	}
}
