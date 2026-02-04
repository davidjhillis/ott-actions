import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconComponent } from './lucide-icon.component';

/** Curated set of icons relevant to CMS/document management */
export const CURATED_ICONS: string[] = [
	// Documents & files
	'file', 'file-text', 'file-check', 'file-plus', 'file-minus', 'file-output',
	'file-input', 'file-search', 'file-lock', 'file-warning',
	// Folders
	'folder', 'folder-plus', 'folder-minus', 'folder-open', 'folder-check',
	'folder-lock', 'folder-search', 'folder-output', 'folder-input',
	// Communication
	'send', 'mail', 'mail-plus', 'mail-check', 'message-square', 'message-circle',
	'bell', 'megaphone',
	// Users & teams
	'user', 'users', 'user-plus', 'user-check', 'user-x', 'contact',
	// Workflow & process
	'refresh-cw', 'rotate-ccw', 'arrow-right-left', 'git-branch', 'git-merge',
	'workflow', 'timer', 'clock', 'history', 'calendar',
	// Actions
	'plus', 'minus', 'x', 'check', 'check-circle', 'pencil', 'trash-2',
	'copy', 'clipboard', 'download', 'upload', 'share', 'link', 'unlink',
	// Navigation
	'chevron-left', 'chevron-right', 'chevron-down', 'chevron-up',
	'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down',
	// Content & media
	'image', 'video', 'book', 'bookmark', 'tag', 'tags', 'hash',
	// Settings & tools
	'settings', 'sliders-horizontal', 'filter', 'search', 'eye', 'eye-off',
	'lock', 'unlock', 'shield', 'key',
	// Info & status
	'info', 'alert-circle', 'alert-triangle', 'help-circle',
	'circle-check', 'circle-x', 'ban',
	// Layout
	'layout', 'grid', 'list', 'columns', 'rows', 'grip-vertical',
	// Translation / i18n
	'languages', 'globe',
];

@Component({
	selector: 'ott-icon-picker',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="icon-picker-trigger" (click)="toggle($event)">
			<div class="icon-preview">
				<ott-icon [name]="value || 'circle'" [size]="18"></ott-icon>
			</div>
			<span class="icon-name">{{ value || 'Select icon' }}</span>
			<ott-icon name="chevron-down" [size]="14" class="chevron"></ott-icon>
		</div>

		<div class="icon-picker-dropdown" *ngIf="isOpen" (click)="$event.stopPropagation()">
			<div class="picker-search">
				<input type="text"
					[(ngModel)]="searchQuery"
					placeholder="Search icons..."
					(input)="filterIcons()"
					#searchInput>
			</div>
			<div class="picker-grid">
				<button class="icon-cell"
					*ngFor="let icon of filteredIcons"
					[class.selected]="icon === value"
					[title]="icon"
					(click)="selectIcon(icon)">
					<ott-icon [name]="icon" [size]="20"></ott-icon>
				</button>
			</div>
			<div class="picker-empty" *ngIf="filteredIcons.length === 0">
				No icons found
			</div>
		</div>
	`,
	styles: [`
		:host {
			display: block;
			position: relative;
		}
		.icon-picker-trigger {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 6px 10px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			cursor: pointer;
			background: var(--ott-bg);
			font-family: var(--ott-font);
			font-size: 13px;
			color: var(--ott-text);
			transition: border-color 0.15s;
		}
		.icon-picker-trigger:hover {
			border-color: var(--ott-primary);
		}
		.icon-preview {
			width: 28px;
			height: 28px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--ott-primary-light);
			border-radius: var(--ott-radius-sm);
			color: var(--ott-primary);
		}
		.icon-name {
			flex: 1;
			color: var(--ott-text-secondary);
		}
		.chevron {
			color: var(--ott-text-muted);
		}

		.icon-picker-dropdown {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			margin-top: 4px;
			background: var(--ott-bg);
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-lg);
			box-shadow: var(--ott-shadow-lg);
			z-index: 100;
			max-height: 320px;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}
		.picker-search {
			padding: 8px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.picker-search input {
			width: 100%;
			padding: 6px 8px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-size: 12px;
			font-family: var(--ott-font);
			box-sizing: border-box;
			color: var(--ott-text);
		}
		.picker-search input:focus {
			outline: none;
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 2px var(--ott-ring);
		}
		.picker-grid {
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			gap: 2px;
			padding: 8px;
			overflow-y: auto;
			flex: 1;
		}
		.icon-cell {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			aspect-ratio: 1;
			border: none;
			background: none;
			cursor: pointer;
			border-radius: var(--ott-radius-md);
			color: var(--ott-text-secondary);
			transition: background-color 0.12s, color 0.12s;
		}
		.icon-cell:hover {
			background: var(--ott-bg-hover);
			color: var(--ott-text);
		}
		.icon-cell.selected {
			background: var(--ott-primary-light);
			color: var(--ott-primary);
			box-shadow: inset 0 0 0 2px var(--ott-primary);
		}
		.picker-empty {
			padding: 16px;
			text-align: center;
			color: var(--ott-text-muted);
			font-size: 12px;
		}
	`]
})
export class IconPickerComponent {
	@Input() value: string = '';
	@Output() valueChange = new EventEmitter<string>();

	isOpen = false;
	searchQuery = '';
	filteredIcons: string[] = CURATED_ICONS;

	toggle(event: Event): void {
		event.stopPropagation();
		this.isOpen = !this.isOpen;
		if (this.isOpen) {
			this.searchQuery = '';
			this.filteredIcons = CURATED_ICONS;
		}
	}

	filterIcons(): void {
		const q = this.searchQuery.toLowerCase();
		if (!q) {
			this.filteredIcons = CURATED_ICONS;
			return;
		}
		this.filteredIcons = CURATED_ICONS.filter(icon => icon.includes(q));
	}

	selectIcon(icon: string): void {
		this.value = icon;
		this.valueChange.emit(icon);
		this.isOpen = false;
	}

	@HostListener('document:click')
	onClickOutside(): void {
		this.isOpen = false;
	}
}
