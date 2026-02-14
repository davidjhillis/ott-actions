import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import {
	TranslatedStandardCollection, EditorialStatus,
	EDITORIAL_STATUSES, EDITORIAL_STATUS_COLORS,
	mapLifecycleToEditorial
} from '../../models/translation.model';

interface KanbanColumn {
	status: EditorialStatus;
	color: string;
	items: TranslatedStandardCollection[];
}

@Component({
	selector: 'ott-kanban-tab',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="kanban-tab">
			<!-- Filters -->
			<div class="kanban-filters">
				<div class="search-box">
					<ott-icon name="search" [size]="13" color="var(--ott-text-muted)"></ott-icon>
					<input type="text" placeholder="Filter..." [(ngModel)]="searchQuery" (input)="filterCards()">
				</div>
				<select class="filter-select" [(ngModel)]="filterAssignee" (change)="filterCards()">
					<option value="">All assignees</option>
					<option *ngFor="let a of assignees" [value]="a">{{ a }}</option>
				</select>
				<select class="filter-select" [(ngModel)]="filterLocale" (change)="filterCards()">
					<option value="">All languages</option>
					<option *ngFor="let l of locales" [value]="l">{{ l }}</option>
				</select>
			</div>

			<!-- Board — stopPropagation prevents drag from bubbling to parent tab bar -->
			<div class="board"
				(dragstart)="$event.stopPropagation()"
				(dragover)="$event.stopPropagation()"
				(dragenter)="$event.stopPropagation()"
				(dragleave)="$event.stopPropagation()"
				(drop)="$event.stopPropagation()">
				<div class="column" *ngFor="let col of columns; trackBy: trackByStatus"
					(dragover)="onDragOver($event)"
					(drop)="onDrop($event, col.status)"
					[class.drag-over]="dragOverStatus === col.status">
					<div class="col-head">
						<span class="col-dot" [style.background]="col.color"></span>
						<span class="col-label">{{ col.status }}</span>
						<span class="col-num">{{ col.items.length }}</span>
					</div>
					<div class="col-body">
						<div class="card"
							*ngFor="let card of col.items.slice(0, maxVisible); trackBy: trackById"
							draggable="true"
							(dragstart)="onDragStart($event, card)"
							(dragend)="onDragEnd()">
							<div class="card-header">
								<span class="card-schema">{{ card.locale }}</span>
							</div>
							<div class="card-title" [title]="card.name">{{ truncateName(card.name) }}</div>
							<div class="card-foot">
								<span class="card-assignee" *ngIf="card.assignee">
									<ott-icon name="user" [size]="10" color="var(--ott-text-muted)"></ott-icon>
									{{ card.assignee }}
								</span>
								<span class="card-assignee muted" *ngIf="!card.assignee">Unassigned</span>
								<span class="card-date" *ngIf="card.dueDate">{{ card.dueDate }}</span>
							</div>
						</div>
						<div class="more" *ngIf="col.items.length > maxVisible"
							(click)="maxVisible = maxVisible + 20">
							+{{ col.items.length - maxVisible }} more
						</div>
						<div class="empty" *ngIf="col.items.length === 0">
							<ott-icon name="circle" [size]="14" [color]="col.color"></ott-icon>
							No items
						</div>
					</div>
				</div>
			</div>

			<div class="hint">Drag cards between columns to update editorial status</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		/* Filters */
		.kanban-filters {
			display: flex; align-items: center; gap: 6px; margin-bottom: 10px;
		}
		.search-box {
			display: flex; align-items: center; gap: 5px;
			padding: 4px 10px; border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md); background: var(--ott-bg);
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		.search-box:focus-within { border-color: var(--ott-primary); box-shadow: 0 0 0 2px var(--ott-ring); }
		.search-box input {
			border: none; outline: none; font-size: var(--ott-font-size-base);
			font-family: var(--ott-font); color: var(--ott-text);
			background: transparent; width: 110px;
		}
		.filter-select {
			padding: 6px 8px; border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md); font-size: var(--ott-font-size-base);
			font-family: var(--ott-font); color: var(--ott-text-secondary);
			background: var(--ott-bg); cursor: pointer;
		}

		/* Board — 4 columns */
		.board {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 8px;
		}

		/* Column */
		.column {
			border-radius: var(--ott-radius-md);
			background: var(--ott-bg-muted);
			min-height: 200px;
			display: flex; flex-direction: column;
			transition: box-shadow 0.15s;
		}
		.column.drag-over {
			box-shadow: inset 0 0 0 2px var(--ott-primary);
		}
		.col-head {
			display: flex; align-items: center; gap: 6px;
			padding: 8px 10px;
		}
		.col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
		.col-label {
			flex: 1; font-size: var(--ott-font-size-sm); font-weight: 600;
			text-transform: uppercase; letter-spacing: 0.3px;
			color: var(--ott-text-secondary);
		}
		.col-num {
			font-size: var(--ott-font-size-xs); font-weight: 700; color: var(--ott-text-muted);
			min-width: 20px; height: 20px;
			display: inline-flex; align-items: center; justify-content: center;
			background: var(--ott-bg); border-radius: var(--ott-radius-full);
		}

		/* Cards area */
		.col-body {
			flex: 1; padding: 0 6px 6px;
			display: flex; flex-direction: column; gap: 4px;
			overflow-y: auto; max-height: 460px;
		}

		/* Card — wider, more readable */
		.card {
			background: var(--ott-bg);
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			padding: 8px 10px;
			cursor: grab; user-select: none;
			transition: box-shadow 0.12s, border-color 0.12s;
		}
		.card:hover { border-color: var(--ott-border); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
		.card:active { cursor: grabbing; }

		.card-header {
			display: flex; align-items: center; justify-content: space-between;
			margin-bottom: 4px;
		}
		.card-schema {
			font-size: var(--ott-font-size-xs); font-weight: 600;
			text-transform: uppercase; letter-spacing: 0.3px;
			padding: 2px 5px; border-radius: var(--ott-radius-sm);
			background: var(--ott-bg-subtle); color: var(--ott-text-muted);
		}

		.card-title {
			font-size: var(--ott-font-size-base); font-weight: 500;
			color: var(--ott-text); line-height: var(--ott-line-height-tight);
			word-break: break-word;
		}

		.card-foot {
			display: flex; align-items: center; justify-content: space-between;
			margin-top: 6px;
		}
		.card-assignee {
			display: flex; align-items: center; gap: 3px;
			font-size: var(--ott-font-size-sm); color: var(--ott-text-secondary);
		}
		.card-assignee.muted { color: var(--ott-text-muted); }
		.card-date {
			font-size: var(--ott-font-size-xs); color: var(--ott-text-muted);
			font-family: var(--ott-font-mono);
		}

		.more {
			text-align: center; padding: 6px; font-size: var(--ott-font-size-sm);
			color: var(--ott-primary); cursor: pointer;
			border-radius: var(--ott-radius-sm);
		}
		.more:hover { background: var(--ott-bg); text-decoration: underline; }
		.empty {
			flex: 1; display: flex; flex-direction: column;
			align-items: center; justify-content: center; gap: 4px;
			font-size: var(--ott-font-size-sm); color: var(--ott-text-muted); padding: 20px 0;
		}

		.hint {
			margin-top: 8px; font-size: var(--ott-font-size-sm); color: var(--ott-text-muted);
			text-align: center;
		}
	`]
})
export class KanbanTabComponent implements OnChanges {
	@Input() collections: TranslatedStandardCollection[] = [];
	@Output() statusChange = new EventEmitter<{ itemId: string; newStatus: string }>();

	columns: KanbanColumn[] = [];
	searchQuery = '';
	filterAssignee = '';
	filterLocale = '';
	maxVisible = 12;
	assignees: string[] = [];
	locales: string[] = [];
	draggedItem: TranslatedStandardCollection | null = null;
	dragOverStatus: EditorialStatus | null = null;

	ngOnChanges(): void { this.buildColumns(); this.extractFilters(); }

	trackByStatus(_: number, col: KanbanColumn): string { return col.status; }
	trackById(_: number, item: TranslatedStandardCollection): string { return item.id; }
	filterCards(): void { this.buildColumns(); }

	truncateName(name: string): string {
		// Show designation part more prominently
		const match = name.match(/ASTM_(\w+[-_]\w+)__(.+)/);
		if (match) return `${match[1]} (${match[2]})`;
		return name.length > 40 ? name.substring(0, 37) + '...' : name;
	}

	onDragStart(event: DragEvent, item: TranslatedStandardCollection): void {
		event.stopPropagation();
		this.draggedItem = item;
		event.dataTransfer?.setData('text/plain', item.id);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	onDragOver(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		// Find which column we're over
		const col = (event.currentTarget as HTMLElement);
		const statusAttr = this.getColumnStatus(col);
		if (statusAttr) this.dragOverStatus = statusAttr;
	}

	onDrop(event: DragEvent, targetStatus: EditorialStatus): void {
		event.preventDefault();
		event.stopPropagation();
		this.dragOverStatus = null;
		if (!this.draggedItem) return;

		const currentEditorial = mapLifecycleToEditorial(this.draggedItem.lifecycleStatus);
		if (currentEditorial === targetStatus) return;

		this.statusChange.emit({ itemId: this.draggedItem.id, newStatus: targetStatus });
		this.draggedItem = null;
		this.buildColumns();
	}

	onDragEnd(): void {
		this.draggedItem = null;
		this.dragOverStatus = null;
	}

	private buildColumns(): void {
		let filtered = this.collections;
		if (this.searchQuery) {
			const q = this.searchQuery.toLowerCase();
			filtered = filtered.filter(c => c.name.toLowerCase().includes(q) ||
				(c.assignee && c.assignee.toLowerCase().includes(q)));
		}
		if (this.filterAssignee) filtered = filtered.filter(c => c.assignee === this.filterAssignee);
		if (this.filterLocale) filtered = filtered.filter(c => c.locale === this.filterLocale);

		this.columns = EDITORIAL_STATUSES.map(status => ({
			status,
			color: EDITORIAL_STATUS_COLORS[status],
			items: filtered.filter(c => mapLifecycleToEditorial(c.lifecycleStatus) === status)
		}));
	}

	private extractFilters(): void {
		const a = new Set<string>(), l = new Set<string>();
		for (const c of this.collections) { if (c.assignee) a.add(c.assignee); l.add(c.locale); }
		this.assignees = [...a].sort();
		this.locales = [...l].sort();
	}

	private getColumnStatus(el: HTMLElement): EditorialStatus | null {
		const colIndex = Array.from(el.parentElement?.children || []).indexOf(el);
		return EDITORIAL_STATUSES[colIndex] || null;
	}
}
