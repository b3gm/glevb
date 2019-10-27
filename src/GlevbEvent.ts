import Point2D from "./Point2D";
import Keys from "./Keys";
import KeyState from './KeyState';
import MouseProperties from './MouseProperties';
import AggregatorEvent from './AggregatorEvent';

export default class GlevbEvent {
	constructor(
        public mouseProperties:MouseProperties,
        public keys:{[key:string]:KeyState}
    ) {
	}
	
	public getState(k:Keys):KeyState {
		return this.keys[Keys[k]];
	}
	
	public isDown(k:Keys):boolean {
		let s:KeyState = this.keys[Keys[k]];
		return s === KeyState.pressed || s === KeyState.hold;
	}
	
	public isUp(k:Keys):boolean {
		let s:KeyState = this.keys[Keys[k]];
		return s === KeyState.idle;
	}
	
	public isPressed(k:Keys):boolean {
		return this.keys[Keys[k]] === KeyState.pressed;
	}
	
	public isReleased(k:Keys):boolean {
		return this.keys[Keys[k]] === KeyState.released;
	}
	
}