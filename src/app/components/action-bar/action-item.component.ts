import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionDefinition } from '../../models/action.model';

@Component({
	selector: 'app-action-item',
	standalone: true,
	imports: [CommonModule],
	template: `
		<button class="action-item"
			[class.disabled]="!action.enabled"
			[title]="action.description || action.label"
			(click)="onActionClick()">
			<span class="action-icon fa-light" [ngClass]="action.icon"></span>
			<span class="action-label">{{ action.label }}</span>
		</button>
	`,
	styles: [`
		:host { display: block; }
		.action-item {
			display: flex;
			align-items: center;
			gap: 8px;
			width: 100%;
			padding: 6px 12px;
			border: none;
			background: none;
			color: #333;
			font-size: 13px;
			cursor: pointer;
			border-radius: 3px;
			text-align: left;
			transition: background-color 0.15s;
		}
		.action-item:hover {
			background-color: #e8f0fe;
		}
		.action-item.disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}
		.action-icon {
			width: 16px;
			text-align: center;
			color: #53ace3;
			font-size: 14px;
		}
		.action-label {
			flex: 1;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	`]
})
export class ActionItemComponent {
	@Input() action!: ActionDefinition;
	@Output() actionClick = new EventEmitter<ActionDefinition>();

	onActionClick(): void {
		if (this.action.enabled) {
			this.actionClick.emit(this.action);
		}
	}
}
