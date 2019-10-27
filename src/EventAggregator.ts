import GlevbEvent from './GlevbEvent';
import MouseProperties from './MouseProperties';
import KeyState from './KeyState';
import AggregatorEvent from './AggregatorEvent';

export class EventAggregator {
	private watchedKeys:Array<string>;
	private addCounter:number = 0;
	private keyMap:{[k:string]:number};
	private mouseProperties:MouseProperties;
	
	constructor() {
		this.reset();
	}
	
	public watchKeys(...keys:Array<string>) {
		this.watchedKeys = keys;
	}
	
	private reset() {
		this.keyMap = {};
		
		for(let k of this.watchedKeys) {
			this.keyMap[k] = 0;
		}
		
		this.mouseProperties = {
			lastPosition: {x: 0, y: 0},
			currentPosition: {x: 0, y: 0},
			movement: {x: 0, y: 0},
			wheelY: 0
		};
		
		this.addCounter = 0;
	}
	
	public add(ev:GlevbEvent) {
		const currentProperties: MouseProperties = this.mouseProperties;
		const eventProperties: MouseProperties = ev.mouseProperties;
        const currentMovement = currentProperties.movement;
        const eventMovement = eventProperties.movement;
        currentMovement.x += eventMovement.x;
        currentMovement.y += eventMovement.y;
		currentProperties.currentPosition = eventProperties.currentPosition;
		for(let k in ev.keys) {
			let s:KeyState = ev.keys[k];
			if(s == KeyState.pressed || s == KeyState.hold) {
				this.keyMap[k] += 1;
			}
		}
		
		++this.addCounter;
	}
	
	public getResult():AggregatorEvent {
		for(let k in this.keyMap) {
			this.keyMap[k] /= this.addCounter;
		}
		
		let result:AggregatorEvent = {
			mouseProperties: this.mouseProperties,
			keys: this.keyMap
		};
		this.reset();
		return result;
	}
}