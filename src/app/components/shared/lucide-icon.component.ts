import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Wrapper for rendering Lucide icons by string name.
 * Action definitions store icon names as strings in config/localStorage,
 * so we need dynamic lookup rather than static imports.
 *
 * Usage: <ott-icon name="send" [size]="16"></ott-icon>
 */
@Component({
	selector: 'ott-icon',
	standalone: true,
	imports: [LucideAngularModule],
	template: `<lucide-icon [name]="name" [size]="size" [strokeWidth]="strokeWidth" [color]="color"></lucide-icon>`,
	styles: [`
		:host {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			vertical-align: middle;
		}
	`]
})
export class LucideIconComponent {
	@Input() name: string = 'circle';
	@Input() size: number = 16;
	@Input() strokeWidth: number = 1.75;
	@Input() color: string = 'currentColor';
}
