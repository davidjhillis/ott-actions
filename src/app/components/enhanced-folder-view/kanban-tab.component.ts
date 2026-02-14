import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { TranslatedStandardCollection, LifecycleStatus, LIFECYCLE_STATUSES, LIFECYCLE_STATUS_COLORS } from '../../models/translation.model';

interface KanbanColumn {
	status: LifecycleStatus;
	color: string;
	items: TranslatedStandardCollection[];
}

@Component({
	selector: 'ott-kanban-tab',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="kanban-tab">
			<!-- Toolbar -->
			<div class="kanban-toolbar">
				<div class="toolbar-left">
					<div class="search-box">
						<ott-icon name="search" [size]="13" color="var(--ott-text-muted)"></ott-icon>
						<input type="text" placeholder="Search..." [(ngModel)]="searchQuery" (input)="filterCards()">
					</div>
					<div class="filter-group">
						<select class="filter-select" [(ngModel)]="filterAssignee" (change)="filterCards()">
							<option value="">All Assignees</option>
							<option *ngFor="let a of assignees" [value]="a">{{ a }}</option>
						</select>
						<select class="filter-select" [(ngModel)]="filterLocale" (change)="filterCards()">
							<option value="">All Languages</option>
							<option *ngFor="let l of locales" [value]="l">{{ l }}</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Board -->
			<div class="kanban-board">
				<div class="kanban-column" *ngFor="let col of columns; trackBy: trackByStatus"
					(dragover)="onDragOver($event)"
					(drop)="onDrop($event, col.status)">

					<!-- Column header -->
					<div class="col-header" [style.border-top-color]="col.color">
						<span class="col-count">{{ col.items.length }}</span>
						<span class="col-title">{{ getShortStatus(col.status) }}</span>
					</div>

					<!-- Cards -->
					<div class="col-cards">
						<div class="kanban-card"
							*ngFor="let card of col.items.slice(0, maxVisible); trackBy: trackById"
							draggable="true"
							(dragstart)="onDragStart($event, card)"
							(dragend)="onDragEnd()">
							<div class="card-name font-mono">{{ card.name }}</div>
							<div class="card-meta">
								<span class="card-assignee" *ngIf="card.assignee">
									<ott-icon name="user" [size]="10"></ott-icon>
									{{ card.assignee }}
								</span>
								<span class="card-assignee unassigned" *ngIf="!card.assignee">
									<ott-icon name="user" [size]="10"></ott-icon>
									—
								</span>
								<span class="card-priority" [ngClass]="'priority-' + card.priority.toLowerCase()">
									{{ card.priority }}
								</span>
							</div>
						</div>

						<!-- More indicator -->
						<div class="more-cards" *ngIf="col.items.length > maxVisible">
							+{{ col.items.length - maxVisible }} more
						</div>

						<!-- Empty column -->
						<div class="empty-column" *ngIf="col.items.length === 0">
							<span class="empty-text">No items</span>
						</div>
					</div>
				</div>
			</div>

			<div class="kanban-hint">
				Drag cards between columns to change lifecycle status.
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		/* Toolbar */
		.kanban-toolbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 12px;
		}
		.toolbar-left { display: flex; align-items: center; gap: 8px; }
		.search-box {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 5px 10px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			background: var(--ott-bg);
		}
		.search-box input {
			border: none;
			outline: none;
			font-size: 12px;
			font-family: var(--ott-font);
			color: var(--ott-text);
			background: transparent;
			width: 130px;
		}
		.search-box:focus-within {
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
		}
		.filter-group { display: flex; gap: 6px; }
		.filter-select {
			padding: 5px 8px;
			border: 1px solid var(--ott-border);
			border-radius: var(--ott-radius-md);
			font-size: 12px;
			font-family: var(--ott-font);
			color: var(--ott-text);
			background: var(--ott-bg);
			cursor: pointer;
		}
		.filter-select:focus {
			outline: none;
			border-color: var(--ott-primary);
		}

		/* Board */
		.kanban-board {
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			gap: 8px;
			min-height: 400px;
		}

		/* Column */
		.kanban-column {
			background: var(--ott-bg-muted);
			border-radius: var(--ott-radius-md);
			border: 1px solid var(--ott-border-light);
			border-top: 3px solid var(--ott-border);
			display: flex;
			flex-direction: column;
			min-height: 200px;
		}
		.col-header {
			padding: 8px 10px;
			display: flex;
			align-items: center;
			gap: 6px;
			border-bottom: 1px solid var(--ott-border-light);
		}
		.col-count {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 22px;
			height: 22px;
			border-radius: var(--ott-radius-full);
			background: var(--ott-bg-subtle);
			font-size: 11px;
			font-weight: 700;
			color: var(--ott-text-secondary);
		}
		.col-title {
			font-size: 11px;
			font-weight: 600;
			color: var(--ott-text-secondary);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		/* Cards area */
		.col-cards {
			flex: 1;
			padding: 6px;
			display: flex;
			flex-direction: column;
			gap: 4px;
			overflow-y: auto;
			max-height: 500px;
		}

		/* Card */
		.kanban-card {
			background: var(--ott-bg);
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-sm);
			padding: 8px 10px;
			cursor: grab;
			transition: box-shadow 0.15s, border-color 0.15s;
			user-select: none;
		}
		.kanban-card:hover {
			border-color: var(--ott-border);
			box-shadow: var(--ott-shadow-sm);
		}
		.kanban-card:active { cursor: grabbing; }
		.card-name {
			font-size: 11px;
			font-weight: 600;
			color: var(--ott-text);
			margin-bottom: 4px;
			word-break: break-all;
			line-height: 1.3;
		}
		.font-mono { font-family: var(--ott-font-mono); }
		.card-meta {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 4px;
		}
		.card-assignee {
			display: inline-flex;
			align-items: center;
			gap: 3px;
			font-size: 10px;
			color: var(--ott-text-secondary);
		}
		.card-assignee.unassigned { color: var(--ott-text-muted); }
		.card-priority {
			font-size: 9px;
			font-weight: 600;
			padding: 1px 5px;
			border-radius: var(--ott-radius-sm);
		}
		.priority-high { background: #fef2f2; color: #991b1b; }
		.priority-medium { background: var(--ott-warning-light); color: #92400e; }
		.priority-low { background: var(--ott-bg-subtle); color: var(--ott-text-muted); }

		.more-cards {
			text-align: center;
			font-size: 11px;
			color: var(--ott-primary);
			padding: 4px;
			cursor: pointer;
		}
		.more-cards:hover { text-decoration: underline; }
		.empty-column {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.empty-text {
			font-size: 11px;
			color: var(--ott-text-muted);
		}

		.kanban-hint {
			margin-top: 10px;
			font-size: 12px;
			color: var(--ott-text-muted);
			text-align: center;
		}
	`]
})
export class KanbanTabComponent implements OnChanges {
	@Input() collections: TranslatedStandardCollection[] = [];
	@Output() statusChange = new EventEmitter<{ itemId: string; newStatus: LifecycleStatus }>();

	columns: KanbanColumn[] = [];
	searchQuery = '';
	filterAssignee = '';
	filterLocale = '';
	maxVisible = 10;

	assignees: string[] = [];
	locales: string[] = [];

	private draggedItem: TranslatedStandardCollection | null = null;

	private shortNames: Record<LifecycleStatus, string> = {
		'In Quotation': 'In Quot.',
		'In Translation': 'In Trans.',
		'In QA': 'In QA',
		'In Editorial Review': 'Editorial',
		'Published to ML': 'Pub ML',
		'Published': 'Pub'
	};

	ngOnChanges(): void {
		this.buildColumns();
		this.extractFilters();
	}

	getShortStatus(status: LifecycleStatus): string {
		return this.shortNames[status] || status;
	}

	trackByStatus(_: number, col: KanbanColumn): string { return col.status; }
	trackById(_: number, item: TranslatedStandardCollection): string { return item.id; }

	filterCards(): void {
		this.buildColumns();
	}

	onDragStart(event: DragEvent, item: TranslatedStandardCollection): void {
		this.draggedItem = item;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', item.id);
		}
	}

	onDragEnd(): void {
		this.draggedItem = null;
	}

	onDragOver(event: DragEvent): void {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	onDrop(event: DragEvent, targetStatus: LifecycleStatus): void {
		event.preventDefault();
		if (!this.draggedItem) return;

		if (this.draggedItem.lifecycleStatus !== targetStatus) {
			this.statusChange.emit({
				itemId: this.draggedItem.id,
				newStatus: targetStatus
			});

			// Optimistic update
			this.draggedItem.lifecycleStatus = targetStatus;
			this.buildColumns();
		}

		this.draggedItem = null;
	}

	private buildColumns(): void {
		let filtered = this.collections;

		if (this.searchQuery) {
			const q = this.searchQuery.toLowerCase();
			filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.designation?.toLowerCase().includes(q));
		}
		if (this.filterAssignee) {
			filtered = filtered.filter(c => c.assignee === this.filterAssignee);
		}
		if (this.filterLocale) {
			filtered = filtered.filter(c => c.locale === this.filterLocale);
		}

		this.columns = LIFECYCLE_STATUSES.map(status => ({
			status,
			color: LIFECYCLE_STATUS_COLORS[status],
			items: filtered.filter(c => c.lifecycleStatus === status)
		}));
	}

	private extractFilters(): void {
		const assigneeSet = new Set<string>();
		const localeSet = new Set<string>();
		for (const c of this.collections) {
			if (c.assignee) assigneeSet.add(c.assignee);
			localeSet.add(c.locale);
		}
		this.assignees = Array.from(assigneeSet).sort();
		this.locales = Array.from(localeSet).sort();
	}
}
