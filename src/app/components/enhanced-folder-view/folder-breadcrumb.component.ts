import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { BreadcrumbSegment } from '../../services/folder-view.service';

@Component({
	selector: 'ott-folder-breadcrumb',
	standalone: true,
	imports: [CommonModule, LucideIconComponent],
	template: `
		<nav class="breadcrumb-nav">
			<ng-container *ngFor="let crumb of breadcrumbs; let last = last; let first = first">
				<!-- First crumb gets back arrow -->
				<button
					*ngIf="first && !last"
					class="crumb-btn first-crumb"
					(click)="navigate.emit(crumb)"
					[title]="crumb.path">
					<ott-icon name="arrow-left" [size]="13"></ott-icon>
					{{ crumb.name }}
				</button>
				<!-- Middle crumbs -->
				<button
					*ngIf="!first && !last"
					class="crumb-btn"
					(click)="navigate.emit(crumb)"
					[title]="crumb.path">
					{{ crumb.name }}
				</button>
				<!-- Last crumb is current (not clickable) -->
				<span *ngIf="last" class="crumb-current">{{ crumb.name }}</span>
				<!-- Separator between crumbs -->
				<span *ngIf="!last" class="separator">/</span>
			</ng-container>
		</nav>
	`,
	styles: [`
		:host { display: block; }
		.breadcrumb-nav {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: var(--ott-font-size-sm);
			font-family: var(--ott-font);
			padding: 8px 0;
			flex-wrap: wrap;
		}
		.first-crumb {
			display: inline-flex;
			align-items: center;
			gap: 4px;
		}
		.crumb-btn {
			border: none;
			background: none;
			cursor: pointer;
			color: var(--ott-primary);
			font-size: var(--ott-font-size-sm);
			font-family: var(--ott-font);
			font-weight: 500;
			padding: 2px 6px;
			border-radius: var(--ott-radius-sm);
			transition: background 0.15s;
		}
		.crumb-btn:hover { background: var(--ott-bg-hover); }
		.crumb-current {
			color: var(--ott-text);
			font-weight: 600;
			padding: 2px 6px;
		}
		.separator {
			color: var(--ott-text-muted);
			user-select: none;
		}
	`]
})
export class FolderBreadcrumbComponent {
	@Input() breadcrumbs: BreadcrumbSegment[] = [];
	@Output() navigate = new EventEmitter<BreadcrumbSegment>();
}
