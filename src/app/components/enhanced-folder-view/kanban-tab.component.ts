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

			<!-- Board -->
			<div class="board">
				<div class="column" *ngFor="let col of columns; trackBy: trackByStatus"
					(dragover)="onDragOver($event)"
					(drop)="onDrop($event, col.status)">
					<div class="col-head">
						<span class="col-dot" [style.background]="col.color"></span>
						<span class="col-label">{{ shortName[col.status] }}</span>
						<span class="col-num">{{ col.items.length }}</span>
					</div>
					<div class="col-body">
						<div class="card"
							*ngFor="let card of col.items.slice(0, maxVisible); trackBy: trackById"
							draggable="true"
							(dragstart)="onDragStart($event, card)"
							(dragend)="draggedItem = null">
							<div class="card-title">{{ card.name }}</div>
							<div class="card-foot">
								<span class="card-user">{{ card.assignee || '—' }}</span>
								<span class="card-pill" [ngClass]="'p-' + card.priority.toLowerCase()">{{ card.priority[0] }}</span>
							</div>
						</div>
						<div class="more" *ngIf="col.items.length > maxVisible">
							+{{ col.items.length - maxVisible }} more
						</div>
						<div class="empty" *ngIf="col.items.length === 0">—</div>
					</div>
				</div>
			</div>

			<div class="hint">Drag cards between columns to update status</div>
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
			border: none; outline: none; font-size: 12px;
			font-family: var(--ott-font); color: var(--ott-text);
			background: transparent; width: 110px;
		}
		.filter-select {
			padding: 5px 8px; border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md); font-size: 12px;
			font-family: var(--ott-font); color: var(--ott-text-secondary);
			background: var(--ott-bg); cursor: pointer;
		}

		/* Board */
		.board {
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			gap: 6px;
		}

		/* Column */
		.column {
			border-radius: var(--ott-radius-md);
			background: var(--ott-bg-muted);
			min-height: 180px;
			display: flex; flex-direction: column;
		}
		.col-head {
			display: flex; align-items: center; gap: 5px;
			padding: 7px 8px;
		}
		.col-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
		.col-label {
			flex: 1; font-size: 10px; font-weight: 600;
			text-transform: uppercase; letter-spacing: 0.3px;
			color: var(--ott-text-muted);
			overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.col-num {
			font-size: 10px; font-weight: 700; color: var(--ott-text-muted);
			min-width: 16px; text-align: center;
		}

		/* Cards area */
		.col-body {
			flex: 1; padding: 0 4px 4px;
			display: flex; flex-direction: column; gap: 3px;
			overflow-y: auto; max-height: 420px;
		}

		/* Card */
		.card {
			background: var(--ott-bg);
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-sm);
			padding: 6px 8px;
			cursor: grab; user-select: none;
			transition: box-shadow 0.12s, border-color 0.12s;
		}
		.card:hover { border-color: var(--ott-border); box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
		.card:active { cursor: grabbing; }
		.card-title {
			font-size: 10px; font-weight: 600;
			font-family: var(--ott-font-mono);
			color: var(--ott-text); line-height: 1.3;
			word-break: break-all;
		}
		.card-foot {
			display: flex; align-items: center; justify-content: space-between;
			margin-top: 4px;
		}
		.card-user { font-size: 10px; color: var(--ott-text-muted); }
		.card-pill {
			font-size: 9px; font-weight: 700; padding: 1px 4px;
			border-radius: var(--ott-radius-sm); line-height: 1;
		}
		.p-high { background: #fef2f2; color: #991b1b; }
		.p-medium { background: var(--ott-warning-light); color: #92400e; }
		.p-low { background: var(--ott-bg-subtle); color: var(--ott-text-muted); }

		.more {
			text-align: center; padding: 4px; font-size: 10px;
			color: var(--ott-primary); cursor: pointer;
		}
		.more:hover { text-decoration: underline; }
		.empty {
			flex: 1; display: flex; align-items: center; justify-content: center;
			font-size: 11px; color: var(--ott-text-muted);
		}

		.hint {
			margin-top: 8px; font-size: 11px; color: var(--ott-text-muted);
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
	maxVisible = 8;
	assignees: string[] = [];
	locales: string[] = [];
	draggedItem: TranslatedStandardCollection | null = null;

	shortName: Record<LifecycleStatus, string> = {
		'In Quotation': 'Quotation',
		'In Translation': 'Translation',
		'In QA': 'QA',
		'In Editorial Review': 'Editorial',
		'Published to ML': 'Pub ML',
		'Published': 'Published'
	};

	ngOnChanges(): void { this.buildColumns(); this.extractFilters(); }

	trackByStatus(_: number, col: KanbanColumn): string { return col.status; }
	trackById(_: number, item: TranslatedStandardCollection): string { return item.id; }
	filterCards(): void { this.buildColumns(); }

	onDragStart(event: DragEvent, item: TranslatedStandardCollection): void {
		this.draggedItem = item;
		event.dataTransfer?.setData('text/plain', item.id);
	}

	onDragOver(event: DragEvent): void {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
	}

	onDrop(event: DragEvent, targetStatus: LifecycleStatus): void {
		event.preventDefault();
		if (!this.draggedItem || this.draggedItem.lifecycleStatus === targetStatus) return;
		this.statusChange.emit({ itemId: this.draggedItem.id, newStatus: targetStatus });
		this.draggedItem.lifecycleStatus = targetStatus;
		this.buildColumns();
		this.draggedItem = null;
	}

	private buildColumns(): void {
		let filtered = this.collections;
		if (this.searchQuery) {
			const q = this.searchQuery.toLowerCase();
			filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
		}
		if (this.filterAssignee) filtered = filtered.filter(c => c.assignee === this.filterAssignee);
		if (this.filterLocale) filtered = filtered.filter(c => c.locale === this.filterLocale);

		this.columns = LIFECYCLE_STATUSES.map(status => ({
			status, color: LIFECYCLE_STATUS_COLORS[status],
			items: filtered.filter(c => c.lifecycleStatus === status)
		}));
	}

	private extractFilters(): void {
		const a = new Set<string>(), l = new Set<string>();
		for (const c of this.collections) { if (c.assignee) a.add(c.assignee); l.add(c.locale); }
		this.assignees = [...a].sort();
		this.locales = [...l].sort();
	}
}
