import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionDefinition, ActionGroup } from '../../models/action.model';
import { ActionItemComponent } from './action-item.component';
import { LucideIconComponent } from '../shared/lucide-icon.component';

@Component({
	selector: 'app-action-group',
	standalone: true,
	imports: [CommonModule, ActionItemComponent, LucideIconComponent],
	template: `
		<div class="action-group">
			<div class="group-header" (click)="toggleCollapse()">
				<span class="collapse-icon">
					<ott-icon [name]="collapsed ? 'chevron-right' : 'chevron-down'" [size]="12"></ott-icon>
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
			margin-bottom: 2px;
		}
		.group-header {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 10px;
			cursor: pointer;
			font-family: var(--ott-font);
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			color: var(--ott-text-secondary);
			letter-spacing: 0.5px;
			user-select: none;
			transition: color 0.15s;
		}
		.group-header:hover {
			color: var(--ott-text);
		}
		.collapse-icon {
			width: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
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
