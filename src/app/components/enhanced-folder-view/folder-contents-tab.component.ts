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
					<button class="toolbar-btn" [class.active]="viewMode === 'list'" (click)="viewMode = 'list'" title="List">
						<ott-icon name="list" [size]="14"></ott-icon>
					</button>
					<button class="toolbar-btn" [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'" title="Grid">
						<ott-icon name="grid" [size]="14"></ott-icon>
					</button>
					<span class="item-count" *ngIf="items.length > 0">
						{{ folderCount }} folders, {{ fileCount }} files
					</span>
				</div>
				<div class="search-box">
					<ott-icon name="search" [size]="13" color="var(--ott-text-muted)"></ott-icon>
					<input type="text" placeholder="Filter..." [(ngModel)]="searchQuery" (input)="onSearch()">
				</div>
			</div>

			<!-- Table -->
			<table class="contents-table">
				<thead>
					<tr>
						<th class="col-check">
							<input type="checkbox" [checked]="allSelected" (change)="toggleAll()">
						</th>
						<th class="col-name" (click)="sort('name')">
							Name
							<ott-icon *ngIf="sortField === 'name'" [name]="sortDir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="11"></ott-icon>
						</th>
						<th class="col-id">ID</th>
						<th class="col-type" (click)="sort('type')">
							Type
							<ott-icon *ngIf="sortField === 'type'" [name]="sortDir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="11"></ott-icon>
						</th>
						<th class="col-size">Size</th>
						<th class="col-modified" (click)="sort('modified')">
							Modified
							<ott-icon *ngIf="sortField === 'modified'" [name]="sortDir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="11"></ott-icon>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr *ngFor="let item of filteredItems; trackBy: trackById"
						[class.selected]="selectedIds.has(item.id)"
						[class.folder-row]="item.isFolder"
						(click)="onItemClick(item)"
						(dblclick)="onItemDblClick(item)">
						<td class="col-check" (click)="$event.stopPropagation()">
							<input type="checkbox" [checked]="selectedIds.has(item.id)" (change)="toggleItem(item)">
						</td>
						<td class="col-name">
							<ott-icon
								[name]="item.isFolder ? 'folder' : getFileIcon(item)"
								[size]="14"
								[color]="item.isFolder ? 'var(--ott-primary)' : 'var(--ott-text-muted)'">
							</ott-icon>
							<span class="item-name" [title]="item.name">{{ item.name }}</span>
						</td>
						<td class="col-id">{{ item.id }}</td>
						<td class="col-type">
							<span class="type-badge" *ngIf="item.schema || item.isFolder"
								[class.type-folder]="item.isFolder">
								{{ item.type }}
							</span>
							<span *ngIf="!item.schema && !item.isFolder">{{ item.type }}</span>
						</td>
						<td class="col-size">{{ item.size || '—' }}</td>
						<td class="col-modified">{{ item.modified }}</td>
					</tr>
				</tbody>
			</table>

			<div class="empty-state" *ngIf="filteredItems.length === 0">
				<ott-icon name="folder-open" [size]="18" color="var(--ott-text-muted)"></ott-icon>
				{{ searchQuery ? 'No matching items' : 'Empty folder' }}
			</div>

			<!-- Selection summary -->
			<div class="selection-bar" *ngIf="selectedIds.size > 0">
				{{ selectedIds.size }} selected
				<button class="clear-btn" (click)="clearSelection()">Clear</button>
			</div>
		</div>
	`,
	styles: [`
		:host { display: block; font-family: var(--ott-font); }

		/* Toolbar */
		.contents-toolbar {
			display: flex; align-items: center; justify-content: space-between;
			margin-bottom: 8px;
		}
		.toolbar-left { display: flex; align-items: center; gap: 6px; }
		.toolbar-btn {
			display: inline-flex; align-items: center;
			border: none; background: none; cursor: pointer;
			color: var(--ott-text-muted); padding: 5px 6px;
			border-radius: var(--ott-radius-sm); transition: all 0.12s;
		}
		.toolbar-btn:hover { color: var(--ott-text-secondary); background: var(--ott-bg-muted); }
		.toolbar-btn.active { color: var(--ott-primary); background: var(--ott-primary-light); }
		.item-count {
			font-size: 11px; color: var(--ott-text-muted); margin-left: 4px;
		}
		.search-box {
			display: flex; align-items: center; gap: 5px;
			padding: 4px 10px; border: 1px solid var(--ott-border-light);
			border-radius: var(--ott-radius-md); background: var(--ott-bg);
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		.search-box:focus-within {
			border-color: var(--ott-primary);
			box-shadow: 0 0 0 2px var(--ott-ring);
		}
		.search-box input {
			border: none; outline: none; font-size: 12px;
			font-family: var(--ott-font); color: var(--ott-text);
			background: transparent; width: 140px;
		}

		/* Table */
		.contents-table {
			width: 100%; border-collapse: collapse; font-size: 13px;
		}
		.contents-table th {
			text-align: left; padding: 6px 10px;
			font-size: 11px; font-weight: 500;
			color: var(--ott-text-muted);
			border-bottom: 1px solid var(--ott-border-light);
			cursor: pointer; user-select: none; white-space: nowrap;
		}
		.contents-table th ott-icon { vertical-align: middle; margin-left: 2px; }
		.contents-table td {
			padding: 7px 10px; color: var(--ott-text);
			border-bottom: 1px solid var(--ott-border-light);
		}
		.contents-table tbody tr {
			cursor: pointer; transition: background 0.08s;
		}
		.contents-table tbody tr:hover { background: var(--ott-bg-muted); }
		.contents-table tbody tr.selected { background: var(--ott-bg-selected); }
		.contents-table tbody tr.folder-row { font-weight: 500; }

		.col-check { width: 28px; text-align: center; }
		.col-name {
			display: flex; align-items: center; gap: 7px; min-width: 0;
		}
		.item-name {
			overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
		}
		.col-id { width: 60px; font-size: 11px; color: var(--ott-text-muted); font-family: var(--ott-font-mono); }
		.col-type { width: 120px; font-size: 12px; color: var(--ott-text-muted); }
		.col-size { width: 70px; font-size: 12px; color: var(--ott-text-muted); }
		.col-modified { width: 90px; font-size: 12px; color: var(--ott-text-muted); }

		/* Type badges */
		.type-badge {
			font-size: 10px; font-weight: 500; padding: 1px 6px;
			border-radius: var(--ott-radius-sm);
			background: var(--ott-bg-subtle); color: var(--ott-text-secondary);
		}
		.type-badge.type-folder {
			background: var(--ott-primary-light); color: var(--ott-primary);
		}

		/* Empty */
		.empty-state {
			display: flex; align-items: center; justify-content: center; gap: 6px;
			padding: 28px 0; font-size: 13px; color: var(--ott-text-muted);
		}

		/* Selection bar */
		.selection-bar {
			display: flex; align-items: center; gap: 8px;
			padding: 6px 10px; margin-top: 6px;
			background: var(--ott-primary-light);
			border-radius: var(--ott-radius-sm);
			font-size: 12px; color: var(--ott-primary); font-weight: 500;
		}
		.clear-btn {
			border: none; background: none; cursor: pointer;
			font-size: 12px; font-family: var(--ott-font);
			color: var(--ott-primary); text-decoration: underline; padding: 0;
		}
	`]
})
export class FolderContentsTabComponent {
	@Input() items: FolderChildItem[] = [];
	@Output() itemOpen = new EventEmitter<FolderChildItem>();
	@Output() selectionChange = new EventEmitter<FolderChildItem[]>();

	searchQuery = '';
	viewMode: 'list' | 'grid' = 'list';
	sortField: 'name' | 'modified' | 'type' = 'name';
	sortDir: 'asc' | 'desc' = 'asc';
	selectedIds = new Set<string>();

	get filteredItems(): FolderChildItem[] {
		let items = this.items;
		if (this.searchQuery) {
			const q = this.searchQuery.toLowerCase();
			items = items.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
		}
		// Sort: folders first, then by sortField
		return items.sort((a, b) => {
			// Folders always first
			if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
			const av = (a as any)[this.sortField] || '';
			const bv = (b as any)[this.sortField] || '';
			const cmp = String(av).localeCompare(String(bv));
			return this.sortDir === 'asc' ? cmp : -cmp;
		});
	}

	get allSelected(): boolean {
		return this.filteredItems.length > 0 && this.filteredItems.every(i => this.selectedIds.has(i.id));
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

	toggleAll(): void {
		if (this.allSelected) this.selectedIds.clear();
		else this.filteredItems.forEach(i => this.selectedIds.add(i.id));
		this.emitSelection();
	}

	toggleItem(item: FolderChildItem): void {
		if (this.selectedIds.has(item.id)) this.selectedIds.delete(item.id);
		else this.selectedIds.add(item.id);
		this.emitSelection();
	}

	onItemClick(item: FolderChildItem): void { this.toggleItem(item); }

	onItemDblClick(item: FolderChildItem): void {
		// Double-click: open folder navigation or file details
		this.itemOpen.emit(item);
	}

	clearSelection(): void { this.selectedIds.clear(); this.emitSelection(); }
	onSearch(): void {}

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
