import { ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';

/**
 * Base component class that provides common functionality for all components
 * This class is meant to be extended, not used directly
 */
export abstract class ComponentBase {
	/**
	 * Collection of subscriptions to be unsubscribed on component destruction
	 */
	protected observableSubTeardowns: Subscription[] = [];

	/**
	 * Constructor
	 * @param ele Reference to the component's element
	 */
	constructor(public ele?: ElementRef) {}

	/**
	 * Helper method to clean up subscriptions
	 * This should be called in the ngOnDestroy lifecycle hook of the extending component
	 */
	protected cleanup(): void {
		// Unsubscribe from all subscriptions
		this.observableSubTeardowns.forEach(sub => {
			if (sub && !sub.closed) {
				sub.unsubscribe();
			}
		});
		this.observableSubTeardowns = [];
	}
}