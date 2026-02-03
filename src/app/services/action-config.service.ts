import { EventEmitter, Injectable } from '@angular/core';
import { ActionBarConfig, ActionDefinition, ActionGroup } from '../models/action.model';
import { DEFAULT_ACTION_BAR_CONFIG } from '../components/action-bar/default-actions';

@Injectable({
	providedIn: 'root'
})
export class ActionConfigService {
	private config: ActionBarConfig;

	/** Emitted whenever the config changes */
	public configChanged = new EventEmitter<ActionBarConfig>();

	constructor() {
		// Load from localStorage or use defaults
		const saved = this.loadFromStorage();
		this.config = saved || this.deepClone(DEFAULT_ACTION_BAR_CONFIG);
	}

	// ─── Read ────────────────────────────────────────

	getConfig(): ActionBarConfig {
		return this.config;
	}

	getGroups(): ActionGroup[] {
		return [...this.config.groups].sort((a, b) => a.order - b.order);
	}

	getActions(): ActionDefinition[] {
		return [...this.config.actions];
	}

	getActionsForGroup(groupId: string): ActionDefinition[] {
		return this.config.actions
			.filter(a => a.groupId === groupId)
			.sort((a, b) => a.order - b.order);
	}

	getAction(id: string): ActionDefinition | undefined {
		return this.config.actions.find(a => a.id === id);
	}

	getGroup(id: string): ActionGroup | undefined {
		return this.config.groups.find(g => g.id === id);
	}

	// ─── Groups CRUD ─────────────────────────────────

	addGroup(group: ActionGroup): void {
		this.config.groups.push(group);
		this.save();
	}

	updateGroup(id: string, changes: Partial<ActionGroup>): void {
		const idx = this.config.groups.findIndex(g => g.id === id);
		if (idx >= 0) {
			this.config.groups[idx] = { ...this.config.groups[idx], ...changes };
			this.save();
		}
	}

	removeGroup(id: string): void {
		this.config.groups = this.config.groups.filter(g => g.id !== id);
		// Remove all actions in this group
		this.config.actions = this.config.actions.filter(a => a.groupId !== id);
		this.save();
	}

	reorderGroups(groupIds: string[]): void {
		groupIds.forEach((id, index) => {
			const group = this.config.groups.find(g => g.id === id);
			if (group) group.order = index + 1;
		});
		this.save();
	}

	// ─── Actions CRUD ────────────────────────────────

	addAction(action: ActionDefinition): void {
		this.config.actions.push(action);
		this.save();
	}

	updateAction(id: string, changes: Partial<ActionDefinition>): void {
		const idx = this.config.actions.findIndex(a => a.id === id);
		if (idx >= 0) {
			this.config.actions[idx] = { ...this.config.actions[idx], ...changes };
			this.save();
		}
	}

	removeAction(id: string): void {
		this.config.actions = this.config.actions.filter(a => a.id !== id);
		this.save();
	}

	reorderActions(groupId: string, actionIds: string[]): void {
		actionIds.forEach((id, index) => {
			const action = this.config.actions.find(a => a.id === id && a.groupId === groupId);
			if (action) action.order = index + 1;
		});
		this.save();
	}

	moveActionToGroup(actionId: string, newGroupId: string): void {
		const action = this.config.actions.find(a => a.id === actionId);
		if (action) {
			action.groupId = newGroupId;
			// Set order to end of new group
			const groupActions = this.getActionsForGroup(newGroupId);
			action.order = groupActions.length;
			this.save();
		}
	}

	// ─── Bulk ────────────────────────────────────────

	resetToDefaults(): void {
		this.config = this.deepClone(DEFAULT_ACTION_BAR_CONFIG);
		this.save();
	}

	importConfig(config: ActionBarConfig): void {
		this.config = this.deepClone(config);
		this.save();
	}

	exportConfig(): string {
		return JSON.stringify(this.config, null, 2);
	}

	// ─── Persistence ─────────────────────────────────

	private save(): void {
		try {
			localStorage.setItem('igx-ott-action-config', JSON.stringify(this.config));
		} catch (e) {
			console.warn('[IGX-OTT] Failed to save config to localStorage');
		}
		this.configChanged.emit(this.config);
	}

	private loadFromStorage(): ActionBarConfig | null {
		try {
			const json = localStorage.getItem('igx-ott-action-config');
			if (json) return JSON.parse(json);
		} catch (e) {
			console.warn('[IGX-OTT] Failed to load config from localStorage');
		}
		return null;
	}

	private deepClone<T>(obj: T): T {
		return JSON.parse(JSON.stringify(obj));
	}
}
