import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconComponent } from '../shared/lucide-icon.component';
import { FolderChildItem } from '../../models/translation.model';

@Component({
	selector: 'ott-folder-contents-tab',
	standalone: true,
	imports: [CommonModule, FormsModule, LucideIconComponent],
	template: `
		<div class="contents-tab">
			<!-- Toolbar -->
			<div class="contents-toolbar">
				<div class="toolbar-left">
					<button class="toolbar-btn" title="Check In">
						<ott-icon name="unlock" [size]="14"></ott-icon>
						Check In
					</button>
					<div class="toolbar-divider"></div>
					<button class="toolbar-btn" title="List View" [class.active]="viewMode === 'list'" (click)="viewMode = 'list'">
						<ott-icon name="list" [size]="14"></ott-icon>
					</button>
					<button class="toolbar-btn" title="Grid View" [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'">
						<ott-icon name="grid" [size]="14"></ott-icon>
					</button>
				</div>
				<div class="toolbar-right">
					<div class="search-box">
						<ott-icon name="search" [size]="13" color="var(--ott-text-muted)"></ott-icon>
						<input type="text" placeholder="Search..." [(ngModel)]="searchQuery" (input)="onSearch()">
					</div>
				</div>
			</div>

			<!-- Table -->
			<div class="contents-table-wrap">
				<table class="contents-table">
					<thead>
						<tr>
							<th class="col-check">
								<input type="checkbox" [checked]="allSelected" (change)="toggleAll()">
							</th>
							<th class="col-name" (click)="sort('name')">
								Name
								<ott-icon *ngIf="sortField === 'name'" [name]="sortDir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="12"></ott-icon>
							</th>
							<th class="col-id">ID</th>
							<th class="col-type">Type</th>
							<th class="col-modified" (click)="sort('modified')">
								Modified
								<ott-icon *ngIf="sortField === 'modified'" [name]="sortDir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="12"></ott-icon>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr *ngFor="let item of filteredItems; trackBy: trackById"
							[class.selected]="selectedIds.has(item.id)"
							(click)="onItemClick(item)"
							(dblclick)="itemOpen.emit(item)">
							<td class="col-check" (click)="$event.stopPropagation()">
								<input type="checkbox" [checked]="selectedIds.has(item.id)" (change)="toggleItem(item)">
							</td>
							<td class="col-name">
								<ott-icon [name]="item.isFolder ? 'folder' : 'file'" [size]="14"
									[color]="item.isFolder ? 'var(--ott-primary)' : 'var(--ott-text-muted)'"></ott-icon>
								<span class="item-name">{{ item.name }}</span>
							</td>
							<td class="col-id font-mono">{{ item.id }}</td>
							<td class="col-type">{{ item.type }}</td>
							<td class="col-modified">{{ item.modified }}</td>
						</tr>
						<tr *ngIf="filteredItems.length === 0">
							<td colspan="5" class="empty-row">
								<ott-icon name="folder-open" [size]="20" color="var(--ott-text-muted)"></ott-icon>
								<span>{{ searchQuery ? 'No matching items' : 'This folder is empty' }}</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Selection bar -->
			<div class="selection-bar" *ngIf="selectedIds.size > 0">
				{{ selectedIds.size }} item{{ selectedIds.size !== 1 ? 's' : '' }} selected
				<button class="selection-action" (click)="clearSelection()">Clear</button>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }
		.contents-tab { display: flex; flex-direction: column; }

		/* Toolbar */
		.contents-toolbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 8px 0;
			gap: 8px;
		}
		.toolbar-left, .toolbar-right {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.toolbar-btn {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			border: 1px solid transparent;
			background: none;
			cursor: pointer;
			color: var(--ott-text-secondary);
			font-size: 12px;
			font-family: var(--ott-font);
			padding: 4px 8px;
			border-radius: var(--ott-radius-sm);
			transition: all 0.15s;
		}
		.toolbar-btn:hover {
			background: var(--ott-bg-hover);
			color: var(--ott-text);
		}
		.toolbar-btn.active {
			background: var(--ott-bg-subtle);
			color: var(--ott-primary);
			border-color: var(--ott-border-light);
		}
		.toolbar-divider {
			width: 1px;
			height: 18px;
			background: var(--ott-border-light);
			margin: 0 4px;
		}
		.search-box {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 4px 10px;
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
			width: 160px;
		}
		.search-box:focus-within {
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 3px var(--ott-ring);
		}

		/* Table */
		.contents-table-wrap {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			overflow: hidden;
		}
		.contents-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 13px;
		}
		.contents-table th {
			text-align: left;
			padding: 8px 10px;
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.3px;
			color: var(--ott-text-muted);
			background: var(--ott-bg-muted);
			border-bottom: 1px solid var(--ott-border-light);
			cursor: pointer;
			user-select: none;
			white-space: nowrap;
		}
		.contents-table th ott-icon { vertical-align: middle; margin-left: 2px; }
		.contents-table td {
			padding: 7px 10px;
			color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.contents-table tr:last-child td { border-bottom: none; }
		.contents-table tbody tr {
			cursor: pointer;
			transition: background 0.1s;
		}
		.contents-table tbody tr:hover { background: var(--ott-bg-hover); }
		.contents-table tbody tr.selected { background: var(--ott-bg-selected); }

		.col-check { width: 32px; text-align: center; }
		.col-name {
			display: flex;
			align-items: center;
			gap: 8px;
			min-width: 0;
		}
		.item-name {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.col-id { width: 70px; font-size: 12px; color: var(--ott-text-secondary); }
		.col-type { width: 80px; font-size: 12px; }
		.col-modified { width: 100px; font-size: 12px; color: var(--ott-text-secondary); }
		.font-mono { font-family: var(--ott-font-mono); }

		.empty-row {
			text-align: center;
			padding: 32px 0 !important;
			color: var(--ott-text-muted);
			font-size: 13px;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
		}

		/* Selection bar */
		.selection-bar {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 12px;
			margin-top: 8px;
			background: var(--ott-primary-light);
			border-radius: var(--ott-radius-md);
			font-size: 12px;
			color: var(--ott-primary);
			font-weight: 500;
		}
		.selection-action {
			border: none;
			background: none;
			cursor: pointer;
			font-size: 12px;
			font-family: var(--ott-font);
			color: var(--ott-primary);
			text-decoration: underline;
			padding: 0;
		}
	`]
})
export class FolderContentsTabComponent {
	@Input() items: FolderChildItem[] = [];
	@Output() itemOpen = new EventEmitter<FolderChildItem>();
	@Output() selectionChange = new EventEmitter<FolderChildItem[]>();

	searchQuery = '';
	viewMode: 'list' | 'grid' = 'list';
	sortField: 'name' | 'modified' = 'name';
	sortDir: 'asc' | 'desc' = 'asc';
	selectedIds = new Set<string>();

	get filteredItems(): FolderChildItem[] {
		let items = this.items;
		if (this.searchQuery) {
			const q = this.searchQuery.toLowerCase();
			items = items.filter(i => i.name.toLowerCase().includes(q));
		}
		return items.sort((a, b) => {
			const av = (a as any)[this.sortField] || '';
			const bv = (b as any)[this.sortField] || '';
			const cmp = av.localeCompare(bv);
			return this.sortDir === 'asc' ? cmp : -cmp;
		});
	}

	get allSelected(): boolean {
		return this.filteredItems.length > 0 && this.filteredItems.every(i => this.selectedIds.has(i.id));
	}

	trackById(_: number, item: FolderChildItem): string { return item.id; }

	sort(field: 'name' | 'modified'): void {
		if (this.sortField === field) {
			this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortField = field;
			this.sortDir = 'asc';
		}
	}

	toggleAll(): void {
		if (this.allSelected) {
			this.selectedIds.clear();
		} else {
			this.filteredItems.forEach(i => this.selectedIds.add(i.id));
		}
		this.emitSelection();
	}

	toggleItem(item: FolderChildItem): void {
		if (this.selectedIds.has(item.id)) {
			this.selectedIds.delete(item.id);
		} else {
			this.selectedIds.add(item.id);
		}
		this.emitSelection();
	}

	onItemClick(item: FolderChildItem): void {
		this.toggleItem(item);
	}

	clearSelection(): void {
		this.selectedIds.clear();
		this.emitSelection();
	}

	onSearch(): void {
		// Just triggers filteredItems getter via template binding
	}

	private emitSelection(): void {
		const selected = this.items.filter(i => this.selectedIds.has(i.id));
		this.selectionChange.emit(selected);
	}
}
