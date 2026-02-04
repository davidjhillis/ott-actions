import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, NgZone, Type, createComponent } from "@angular/core";

/**
 * Service responsible for creating and managing dynamic components.
 *
 * Cross-frame rendering: When a host element is in a different document
 * (e.g. CMS top frame), Angular injects scoped <style> tags into the
 * iframe's <head> — not the top frame's. This service detects cross-
 * document hosts and syncs all component styles to the target document.
 */
@Injectable({
	providedIn: 'root'
})
export class DynamicComponentService {
	/**
	 * Map of component instances to their ComponentRefs
	 */
	private createdComponents: Map<any, ComponentRef<any>> = new Map();

	/**
	 * Map of hidden components with their original location information
	 */
	private hiddenComponents: Map<any, {
		component: HTMLElement;
		parentElement: HTMLElement;
		nextSibling: Node | null;
		componentType: Type<any>;
	}> = new Map();

	/**
	 * Map of HTML elements to their component instances
	 */
	private elementToComponentMap: Map<HTMLElement, any> = new Map();

	/** Hashes of styles already synced to the top frame */
	private syncedStyleHashes = new Set<string>();

	constructor(
		private appRef: ApplicationRef,
		private environmentInjector: EnvironmentInjector,
		private ngZone: NgZone
	) { }

	/**
	 * Creates a component of the specified type in the given host element
	 * @param componentType The component type to create
	 * @param hostElement The host element to create the component in
	 * @returns The component reference
	 */
	public createComponent<T>(componentType: Type<T>, hostElement: HTMLElement): ComponentRef<T> {
		// Use modern Angular API to create component
		const componentRef = createComponent<T>(componentType, {
			environmentInjector: this.environmentInjector,
			hostElement
		});

		// Add component to change detection
		this.appRef.attachView(componentRef.hostView);

		// If the host element is in a different document (CMS top frame),
		// sync Angular's scoped component styles to that document so the
		// CSS selectors can match the rendered elements.
		this.syncStylesIfCrossDocument(hostElement);

		// Store component reference for later management
		this.createdComponents.set(componentRef.instance, componentRef);
		this.elementToComponentMap.set(hostElement, componentRef.instance);

		return componentRef;
	}

	/**
	 * Copy all Angular <style> elements from the iframe's <head> to the
	 * target document's <head> when the host element lives in a different
	 * document (e.g. CMS top frame). Uses content hashing to avoid
	 * duplicates across multiple createComponent calls.
	 */
	private syncStylesIfCrossDocument(hostElement: HTMLElement): void {
		const targetDoc = hostElement.ownerDocument;
		if (!targetDoc || targetDoc === document) return;

		const styles = document.head.querySelectorAll('style');
		let synced = 0;

		styles.forEach(style => {
			const content = style.textContent || '';
			if (!content.trim()) return;

			const hash = this.quickHash(content);
			if (this.syncedStyleHashes.has(hash)) return;
			this.syncedStyleHashes.add(hash);

			const clone = targetDoc.createElement('style');
			clone.textContent = content;
			clone.setAttribute('data-ott-synced', 'true');
			targetDoc.head.appendChild(clone);
			synced++;
		});

		if (synced > 0) {
			console.log(`[IGX-OTT] Synced ${synced} style sheet(s) to top frame`);
		}
	}

	/** Simple FNV-1a-style hash for deduplication */
	private quickHash(s: string): string {
		let h = 0x811c9dc5;
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193);
		}
		return (h >>> 0).toString(36);
	}
	
	/**
	 * Destroys all components created by this service
	 */
	public destroyAllComponents(): void {
		this.createdComponents.forEach(componentRef => {
			componentRef.destroy();
		});
		this.createdComponents.clear();
		this.elementToComponentMap.clear();
	}
	
	/**
	 * Destroys a specific component
	 * @param component The component instance to destroy
	 */
	public destroyComponent(component: any): void {
		const componentRef = this.createdComponents.get(component);
		if (componentRef) {
			componentRef.destroy();
			this.createdComponents.delete(component);
			
			// Remove from element map
			for (const [element, comp] of this.elementToComponentMap.entries()) {
				if (comp === component) {
					this.elementToComponentMap.delete(element);
					break;
				}
			}
		}
	}
	
	/**
	 * Hides a component by moving it from its current location to the document body
	 * @param component The component instance or HTML element to hide
	 * @returns The component instance or HTML element that was hidden
	 */
	public hideComponent<T>(component: T | HTMLElement): T | HTMLElement {
		// If component is an HTMLElement, try to find the component instance
		if (component instanceof HTMLElement) {
			const comp = this.elementToComponentMap.get(component);
			if (comp) {
				return this.hideComponent(comp) as T;
			}
			
			// If we can't find the component instance, create a placeholder
			const placeholderKey = { id: `placeholder-${Date.now()}` };
			if (component.parentElement) {
				this.hiddenComponents.set(placeholderKey, {
					component: component,
					parentElement: component.parentElement,
					nextSibling: component.nextSibling,
					componentType: Object as any
				});
				
				// Move component to current iframe's document.body
				document.body.appendChild(component);
			}
			
			return component;
		}
		
		// Handle component instance
		const componentRef = this.createdComponents.get(component);
		if (!componentRef) {
			console.log('[IGX-OTT] - Component reference not found');
			return component;
		}
		
		const hostElement = componentRef.location.nativeElement as HTMLElement;
		if (!hostElement || !hostElement.parentElement) {
			console.log('[IGX-OTT] - Host element not found');
			return component;
		}
		
		// Store original location information
		this.hiddenComponents.set(component, {
			component: hostElement,
			parentElement: hostElement.parentElement,
			nextSibling: hostElement.nextSibling,
			componentType: componentRef.componentType
		});
		
		// Move component to current iframe's document.body
		document.body.appendChild(hostElement);
		
		return component;
	}
	
	/**
	 * Shows a component by moving it back to its original location
	 * @param component The component instance or HTML element to show
	 * @returns The component instance or HTML element that was shown
	 */
	public showComponent<T>(component: T | HTMLElement): T | HTMLElement {
		// If component is an HTMLElement, try to find the component instance or placeholder
		if (component instanceof HTMLElement) {
			// Try to find by placeholder
			for (const [key, info] of this.hiddenComponents.entries()) {
				if (info.component === component) {
					// Move component back to original location
					if (info.nextSibling) {
						info.parentElement.insertBefore(component, info.nextSibling);
					} else {
						info.parentElement.appendChild(component);
					}
					
					this.hiddenComponents.delete(key);
					return component;
				}
			}
			
			// If not found, try to find by component instance
			const comp = this.elementToComponentMap.get(component);
			if (comp) {
				return this.showComponent(comp) as T;
			}
			
			return component;
		}
		
		// Handle component instance
		const locationInfo = this.hiddenComponents.get(component);
		if (!locationInfo) {
			console.log('[IGX-OTT] - No component location info found');
			return component;
		}
		
		const { component: hostElement, parentElement, nextSibling } = locationInfo;
		
		// Move component back to original location
		if (nextSibling) {
			parentElement.insertBefore(hostElement, nextSibling);
		} else {
			parentElement.appendChild(hostElement);
		}
		
		this.hiddenComponents.delete(component);
		return component;
	}
}