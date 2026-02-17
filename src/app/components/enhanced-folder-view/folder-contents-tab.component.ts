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
		<div class="ct">
			<!-- Toolbar -->
			<div class="ct-toolbar">
				<span class="ct-count">
					{{ folderCount }} {{ folderCount === 1 ? 'folder' : 'folders' }}<ng-container *ngIf="fileCount">, {{ fileCount }} {{ fileCount === 1 ? 'file' : 'files' }}</ng-container>
				</span>
				<div class="ct-search">
					<ott-icon name="search" [size]="13" color="var(--ott-text-muted)"></ott-icon>
					<input type="text" placeholder="Filter..." [(ngModel)]="searchQuery">
				</div>
			</div>

			<!-- Table -->
			<div class="ct-table-wrap">
				<table class="ct-table">
					<thead>
						<tr>
							<th class="ct-col-cb">
								<input type="checkbox" [checked]="allSelected" (change)="toggleAll()" title="Select all">
							</th>
							<th class="ct-col-name" (click)="sort('name')">
								Name
								<ott-icon *ngIf="sortField === 'name'" [name]="sortDir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="10"></ott-icon>
							</th>
							<th class="ct-col-id">ID</th>
							<th class="ct-col-type" (click)="sort('type')">
								Type
								<ott-icon *ngIf="sortField === 'type'" [name]="sortDir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="10"></ott-icon>
							</th>
							<th class="ct-col-size">Size</th>
							<th class="ct-col-mod" (click)="sort('modified')">
								Modified
								<ott-icon *ngIf="sortField === 'modified'" [name]="sortDir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="10"></ott-icon>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr *ngFor="let item of filteredItems; trackBy: trackById"
							[class.ct-selected]="selectedIds.has(item.id)"
							(click)="toggleItem(item)"
							(dblclick)="onItemDblClick(item)">
							<td class="ct-col-cb" (click)="$event.stopPropagation()">
								<input type="checkbox" [checked]="selectedIds.has(item.id)" (change)="toggleItem(item)">
							</td>
							<td class="ct-col-name">
								<div class="ct-name-cell">
									<div class="ct-icon-wrap" [class.ct-icon-folder]="item.isFolder">
										<ott-icon
											[name]="item.isFolder ? 'folder' : getFileIcon(item)"
											[size]="14"
											[color]="item.isFolder ? 'var(--ott-primary)' : 'var(--ott-text-muted)'">
										</ott-icon>
									</div>
									<span class="ct-item-name">{{ item.name }}</span>
								</div>
							</td>
							<td class="ct-col-id">{{ item.id }}</td>
							<td class="ct-col-type">
								<span class="ct-type" [class.ct-type-folder]="item.isFolder">{{ item.type }}</span>
							</td>
							<td class="ct-col-size">{{ item.size || '—' }}</td>
							<td class="ct-col-mod">{{ item.modified || '—' }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="ct-empty" *ngIf="filteredItems.length === 0">
				<ott-icon name="folder-open" [size]="20" color="var(--ott-text-muted)"></ott-icon>
				<span>{{ searchQuery ? 'No matching items' : 'Empty folder' }}</span>
			</div>

			<!-- Selection bar -->
			<div class="ct-selection" *ngIf="selectedIds.size > 0">
				<span>{{ selectedIds.size }} selected</span>
				<button class="ct-clear" (click)="clearSelection()">Clear</button>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		/* Toolbar */
		.ct-toolbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 10px;
		}
		.ct-count {
			font-size: 12px;
			color: var(--ott-text-muted);
			font-weight: 500;
		}
		.ct-search {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 5px 10px;
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md);
			background: var(--ott-bg);
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		.ct-search:focus-within {
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 2px var(--ott-ring);
		}
		.ct-search input {
			border: none;
			outline: none;
			font-size: 13px;
			font-family: var(--ott-font);
			color: var(--ott-text);
			background: transparent;
			width: 130px;
		}

		/* Table */
		.ct-table-wrap {
			border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-lg);
			overflow: hidden;
		}
		.ct-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 13px;
		}
		.ct-table thead {
			background: var(--ott-bg-muted);
		}
		.ct-table th {
			text-align: left;
			padding: 8px 12px;
			font-size: 11px;
			font-weight: 600;
			color: var(--ott-text-muted);
			text-transform: uppercase;
			letter-spacing: 0.3px;
			border-bottom: 1px solid var(--ott-border-light);
			cursor: pointer;
			user-select: none;
			white-space: nowrap;
		}
		.ct-table th ott-icon { vertical-align: middle; margin-left: 2px; }
		.ct-table td {
			padding: 10px 12px;
			color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.ct-table tbody tr {
			cursor: pointer;
			transition: background 0.08s;
		}
		.ct-table tbody tr:hover { background: var(--ott-bg-hover); }
		.ct-table tbody tr.ct-selected { background: var(--ott-bg-selected); }
		.ct-table tbody tr:last-child td { border-bottom: none; }

		/* Columns */
		.ct-col-cb {
			width: 32px;
			text-align: center;
		}
		.ct-col-cb input[type="checkbox"] {
			cursor: pointer;
			margin: 0;
		}
		.ct-col-name { min-width: 0; }
		.ct-name-cell {
			display: flex;
			align-items: center;
			gap: 8px;
			min-width: 0;
		}
		.ct-icon-wrap {
			width: 28px;
			height: 28px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: var(--ott-radius-sm);
			background: var(--ott-bg-subtle);
			flex-shrink: 0;
		}
		.ct-icon-wrap.ct-icon-folder {
			background: var(--ott-primary-light);
		}
		.ct-item-name {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			font-weight: 500;
		}
		.ct-col-id {
			width: 60px;
			font-size: 11px;
			color: var(--ott-text-muted);
			font-family: var(--ott-font-mono);
		}
		.ct-col-type { width: 100px; }
		.ct-type {
			font-size: 11px;
			font-weight: 500;
			padding: 2px 8px;
			border-radius: var(--ott-radius-full);
			background: var(--ott-bg-subtle);
			color: var(--ott-text-secondary);
		}
		.ct-type.ct-type-folder {
			background: var(--ott-primary-light);
			color: var(--ott-primary);
		}
		.ct-col-size {
			width: 60px;
			font-size: 12px;
			color: var(--ott-text-muted);
		}
		.ct-col-mod {
			width: 90px;
			font-size: 12px;
			color: var(--ott-text-muted);
		}

		/* Empty */
		.ct-empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			padding: 40px 0;
			font-size: 13px;
			color: var(--ott-text-muted);
		}

		/* Selection bar */
		.ct-selection {
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
		.ct-clear {
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
	sortField: 'name' | 'modified' | 'type' = 'name';
	sortDir: 'asc' | 'desc' = 'asc';
	selectedIds = new Set<string>();

	get filteredItems(): FolderChildItem[] {
		let items = this.items;
		if (this.searchQuery) {
			const q = this.searchQuery.toLowerCase();
			items = items.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
		}
		return items.sort((a, b) => {
			if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
			const av = (a as any)[this.sortField] || '';
			const bv = (b as any)[this.sortField] || '';
			const cmp = String(av).localeCompare(String(bv));
			return this.sortDir === 'asc' ? cmp : -cmp;
		});
	}

	get folderCount(): number {
		return this.items.filter(i => i.isFolder).length;
	}

	get fileCount(): number {
		return this.items.filter(i => !i.isFolder).length;
	}

	trackById(_: number, item: FolderChildItem): string { return item.id; }

	sort(field: 'name' | 'modified' | 'type'): void {
		if (this.sortField === field) {
			this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortField = field;
			this.sortDir = 'asc';
		}
	}

	get allSelected(): boolean {
		return this.items.length > 0 && this.selectedIds.size === this.items.length;
	}

	toggleAll(): void {
		if (this.allSelected) {
			this.selectedIds.clear();
		} else {
			this.items.forEach(i => this.selectedIds.add(i.id));
		}
		this.emitSelection();
	}

	toggleItem(item: FolderChildItem): void {
		if (this.selectedIds.has(item.id)) this.selectedIds.delete(item.id);
		else this.selectedIds.add(item.id);
		this.emitSelection();
	}

	onItemDblClick(item: FolderChildItem): void {
		this.itemOpen.emit(item);
	}

	clearSelection(): void {
		this.selectedIds.clear();
		this.emitSelection();
	}

	getFileIcon(item: FolderChildItem): string {
		const type = (item.type || '').toLowerCase();
		if (type.includes('pdf')) return 'file-text';
		if (type.includes('dxml') || type.includes('xml')) return 'file-text';
		if (type.includes('doc') || type.includes('rtf')) return 'file-text';
		if (type.includes('image') || type.includes('png') || type.includes('jpg')) return 'image';
		return 'file';
	}

	private emitSelection(): void {
		this.selectionChange.emit(this.items.filter(i => this.selectedIds.has(i.id)));
	}
}
