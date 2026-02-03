import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, Type, createComponent } from "@angular/core";

/**
 * Service responsible for creating and managing dynamic components
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
	
	constructor(
		private appRef: ApplicationRef,
		private environmentInjector: EnvironmentInjector
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
		
		// Store component reference for later management
		this.createdComponents.set(componentRef.instance, componentRef);
		this.elementToComponentMap.set(hostElement, componentRef.instance);
		
		return componentRef;
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