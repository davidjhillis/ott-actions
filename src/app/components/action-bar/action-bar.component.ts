import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentBase } from '../../ComponentBase';
import { ActionBarConfig, ActionDefinition, ActionGroup } from '../../models/action.model';
import { AssetContext } from '../../models/asset-context.model';
import { ActionGroupComponent } from './action-group.component';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { DEFAULT_ACTION_BAR_CONFIG } from './default-actions';

@Component({
	selector: 'app-action-bar',
	standalone: true,
	imports: [CommonModule, ActionGroupComponent, LucideIconComponent],
	template: `
		<div class="action-bar" [class.collapsed]="isCollapsed">
			<div class="action-bar-toggle" (click)="toggleCollapse($event)" [title]="isCollapsed ? 'Expand Actions' : 'Collapse Actions'">
				<ott-icon [name]="isCollapsed ? 'chevron-left' : 'chevron-right'" [size]="14"></ott-icon>
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
						<ott-icon name="sliders-horizontal" [size]="14"></ott-icon>
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
			background: var(--ott-bg);
			border-left: 1px solid var(--ott-border);
			font-family: var(--ott-font);
			position: relative;
		}
		.action-bar.collapsed {
			width: 20px;
		}
		.action-bar.collapsed .action-bar-toggle {
			border-right: none;
		}
		.action-bar-toggle {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 20px;
			min-width: 20px;
			cursor: pointer;
			background: var(--ott-bg-muted);
			border-right: 1px solid var(--ott-border);
			color: var(--ott-text-muted);
			transition: background-color 0.15s, color 0.15s;
			user-select: none;
			-webkit-user-select: none;
			z-index: 10;
		}
		.action-bar-toggle:hover {
			background: var(--ott-primary-light);
			color: var(--ott-primary);
		}
		.action-bar-toggle:active {
			background: var(--ott-primary);
			color: white;
		}
		.action-bar-content {
			display: flex;
			flex-direction: column;
			width: 224px;
			overflow: hidden;
		}
		.action-bar-header {
			padding: 12px 12px 8px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.action-bar-header h3 {
			margin: 0;
			font-size: 13px;
			font-weight: 600;
			color: var(--ott-text);
			letter-spacing: 0.02em;
		}
		.action-bar-body {
			flex: 1;
			overflow-y: auto;
			padding: 4px 0;
		}
		.action-bar-footer {
			border-top: 1px solid var(--ott-border-light);
			padding: 8px;
		}
		.manage-actions-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			width: 100%;
			padding: 7px 8px;
			border: none;
			background: none;
			color: var(--ott-primary);
			font-family: var(--ott-font);
			font-size: 12px;
			font-weight: 500;
			cursor: pointer;
			border-radius: var(--ott-radius-md);
			transition: background-color 0.15s;
		}
		.manage-actions-btn:hover {
			background: var(--ott-bg-selected);
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

		// Folder/file restrictions (only apply when context is available)
		if (vis.folderOnly && this.context && !this.context.isFolder) return false;
		if (vis.fileOnly && this.context && this.context.isFolder) return false;

		// Asset type / schema restrictions
		if (vis.assetTypes?.length && this.context?.schema) {
			if (!vis.assetTypes.includes(this.context.schema)) return false;
		}

		return true;
	}

	toggleCollapse(event?: MouseEvent): void {
		if (event) {
			event.stopPropagation();
			event.preventDefault();
		}
		this.isCollapsed = !this.isCollapsed;
		console.log(`[IGX-OTT] Action bar ${this.isCollapsed ? 'collapsed' : 'expanded'}`);
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
