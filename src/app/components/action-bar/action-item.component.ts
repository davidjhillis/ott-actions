import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionDefinition } from '../../models/action.model';
import { LucideIconComponent } from '../shared/lucide-icon.component';

@Component({
	selector: 'app-action-item',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<button class="action-item"
			[class.disabled]="!action.enabled"
			[title]="action.description || action.label"
			(click)="onActionClick()">
			<span class="action-icon">
				<ott-icon [name]="action.icon" [size]="15"></ott-icon>
			</span>
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
			padding: 7px 12px;
			border: none;
			background: none;
			color: var(--ott-text);
			font-family: var(--ott-font);
			font-size: 13px;
			cursor: pointer;
			border-radius: var(--ott-radius-md);
			text-align: left;
			transition: background-color 0.15s, color 0.15s;
		}
		.action-item:hover {
			background-color: var(--ott-bg-selected);
		}
		.action-item.disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}
		.action-icon {
			width: 16px;
			text-align: center;
			color: var(--ott-primary);
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
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
