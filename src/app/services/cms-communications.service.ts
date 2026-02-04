import { Injectable } from '@angular/core';
import { Observable, fromEvent, throwError, first, map, filter, timeout } from 'rxjs';

interface ServiceCallMessage {
	purpose: string;
	service: string;
	action: string;
	uniqueId: string;
	args: any[];
	postCall?: string;
}

interface ServiceCallResult {
	data: {
		purpose: string;
		uniqueId: string;
		result: any;
	};
}

/**
 * Communicates with the Ingeniux CMS via the ExternalModule postMessage bridge.
 *
 * Production (inside CMS iframe):
 *   Sends `exModule:serviceCall` to window.top, waits for
 *   `exModule:serviceCallResult` with matching GUID.
 *
 * Dev mode (standalone localhost):
 *   Returns throwError() so consumers can catch and fall back to demo data.
 */
@Injectable({
	providedIn: 'root'
})
export class CMSCommunicationsService {
	readonly isDevMode: boolean;

	constructor() {
		this.isDevMode = !(window.top as any)?.NG_REF;
	}

	/**
	 * Call a CMS service action via postMessage bridge.
	 *
	 * @param options.service   CMS service name (e.g. 'PageCommandsServices')
	 * @param options.action    Method name on the service (e.g. 'GetPageProperties')
	 * @param options.args      Arguments array to pass to the method
	 * @param options.postCall  Optional post-call action (e.g. 'refreshTree')
	 * @param options.timeout   Timeout in ms (default 15000)
	 */
	callService<T>(options: {
		service: string;
		action: string;
		args: any[];
		postCall?: string;
		timeout?: number;
	}): Observable<T> {
		if (this.isDevMode) {
			return throwError(() => new Error('[IGX-OTT] Dev mode — no CMS connection'));
		}

		const uniqueId = this.generateGuid();
		const timeoutMs = options.timeout ?? 15000;

		// Set up listener BEFORE sending postMessage to avoid race condition
		const result$ = fromEvent<MessageEvent>(window, 'message').pipe(
			filter(evt => {
				const d = evt.data;
				return d?.purpose === 'exModule:serviceCallResult' && d?.uniqueId === uniqueId;
			}),
			first(),
			map(evt => evt.data.result as T),
			timeout(timeoutMs)
		);

		// Send the service call request to CMS top frame
		const message: ServiceCallMessage = {
			purpose: 'exModule:serviceCall',
			service: options.service,
			action: options.action,
			uniqueId,
			args: options.args
		};

		if (options.postCall) {
			message.postCall = options.postCall;
		}

		window.top?.postMessage(message, '*');

		console.log(`[IGX-OTT] CMS call: ${options.service}.${options.action}`, options.args);

		return result$;
	}

	/**
	 * Generate a GUID for correlating postMessage request/response pairs.
	 */
	private generateGuid(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}
}
