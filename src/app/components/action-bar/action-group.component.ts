import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionDefinition, ActionGroup } from '../../models/action.model';
import { ActionItemComponent } from './action-item.component';

@Component({
	selector: 'app-action-group',
	standalone: true,
	imports: [CommonModule, ActionItemComponent],
	template: `
		<div class="action-group">
			<div class="group-header" (click)="toggleCollapse()">
				<span class="collapse-icon fa-solid"
					[ngClass]="collapsed ? 'fa-chevron-right' : 'fa-chevron-down'">
				</span>
				<span class="group-label">{{ group.label }}</span>
			</div>
			<div class="group-actions" *ngIf="!collapsed">
				<app-action-item
					*ngFor="let action of actions"
					[action]="action"
					(actionClick)="actionClick.emit($event)">
				</app-action-item>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; }
		.action-group {
			margin-bottom: 4px;
		}
		.group-header {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 6px 8px;
			cursor: pointer;
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			color: #666;
			letter-spacing: 0.5px;
			user-select: none;
		}
		.group-header:hover {
			color: #333;
		}
		.collapse-icon {
			font-size: 9px;
			width: 10px;
			text-align: center;
			transition: transform 0.15s;
		}
		.group-actions {
			padding: 0 0 4px 0;
		}
	`]
})
export class ActionGroupComponent {
	@Input() group!: ActionGroup;
	@Input() actions: ActionDefinition[] = [];
	@Output() actionClick = new EventEmitter<ActionDefinition>();

	collapsed = false;

	ngOnInit(): void {
		this.collapsed = this.group.collapsed;
	}

	toggleCollapse(): void {
		if (this.group.collapsible) {
			this.collapsed = !this.collapsed;
		}
	}
}
