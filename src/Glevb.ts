import Point2D from './Point2D';
import GlevbSettings from './GlevbSettings';
import KeyState from './KeyState';
import MouseProperties from './MouseProperties';
import GlevbEvent from './GlevbEvent';
import Keys from './Keys';

const defaults: GlevbSettings = Object.freeze({
    root: document.getElementsByTagName('html')[0],
    mouseLock:false,
    interval:3000,
    runLoop:false,
    errorLog: console.log.bind(console),
    debugLog: console.debug.bind(console)
});

export default class Glevb {
    public static readonly defaults = defaults;
    
	private started:boolean = false;
	private startRequested:boolean = false;
	private captureClicked:boolean = false;
    private root:HTMLElement;
    private interval:number;
    private mouseLock:boolean;
    private mainThread:number;
	private mouseProperties:MouseProperties;
	private runLoop:boolean;
	private keyMapProto:{[key:string]:KeyState};
	private keyMap:{[key:string]:KeyState};
	
	private _mouseHandler:(ev:MouseEvent) => void;
	private _mouseDownHandler:(ev:MouseEvent) => void;
	private _mouseUpHandler:(ev:MouseEvent) => void;
	private _keyUpHandler:(ev:KeyboardEvent) => void;
	private _keyDownHandler:(ev:KeyboardEvent) => void;
	private _scrollHandler:(ev:MouseWheelEvent) => void;
    
    private startHandler:Array<(ev:string) => void> = [];
    private stopHandler:Array<(ev:string) => void> = [];
    private loopHandler:Array<(ev:GlevbEvent) => void> = [];
    private errorLog:(...args:any[]) => void;    
    private debugLog:(...args:any[]) => void;
    
    constructor(settings:GlevbSettings) {
        this.root = settings.root || defaults.root;
        this.interval = settings.interval || defaults.interval;
        this.mouseLock = settings.mouseLock || defaults.mouseLock;
		this.runLoop = settings.runLoop || defaults.runLoop;
        this.errorLog = settings.errorLog || defaults.errorLog;
        this.debugLog = settings.debugLog || defaults.debugLog;
		this.keyMap = {};
		this.keyMapProto = {};
		
		this._mouseDownHandler = (ev:MouseEvent) => {this.mouseDownHandler(ev);};
		this._mouseUpHandler = (ev:MouseEvent) => {this.mouseUpHandler(ev);};
		this._keyDownHandler = (ev:KeyboardEvent) => {this.keyDownHandler(ev);};
		this._keyUpHandler = (ev:KeyboardEvent) => {this.keyUpHandler(ev);};
		this._scrollHandler = (ev:MouseWheelEvent) => {this.scrollHandler(ev);};
		
		if(this.mouseLock) {
			// start automatically if mouseLock is active
			document.addEventListener('pointerlockchange', (e) => {
				this.debugLog(e);
				this.pointerLockChangeHandler();
			});
			this.start();
		}
	}
	
	private pointerLockChangeHandler() {
		if(this.started) {
			this.stop();
			this.started = false;
			// restart immediately to activate mouselockrequest on click
			this.start();
		}
		else if(this.captureClicked) {
			this.captureClicked = false;
			this.started = true;
			this.installDocumentHandler();
			this.startMainThread();
			this.trigger('start', this.startHandler);
		}
	}
	
	private getStrKey(code:number) {
		return Keys[code];
	}
	
	private scrollHandler(ev:MouseWheelEvent) {
		this.mouseProperties.wheelY += ev.deltaY;
		ev.stopPropagation();
		ev.preventDefault();
	}
	
	private keyDownHandler(ev:KeyboardEvent) {
		const sk:string = this.getStrKey(ev.keyCode);
		if(!sk || typeof(this.keyMapProto[sk]) === 'undefined' || this.keyMap[sk] === KeyState.hold) {
			return;
		}
		this.keyMap[sk] = KeyState.pressed;
	}
	
	private keyUpHandler(ev:KeyboardEvent) {
		const sk:string = this.getStrKey(ev.keyCode);
		if(!sk || typeof(this.keyMapProto[sk]) === 'undefined') {
			return;
		}
		this.keyMap[sk] = KeyState.released;
	}
	
	private mouseDownHandler(ev:MouseEvent) {
		const key:string = 'Mouse' + ev.which;
		if(typeof(this.keyMapProto[key]) === 'undefined') {
			return;
		}
		this.keyMap[key] = KeyState.pressed;
	}
	
	private mouseUpHandler(ev:MouseEvent) {
		const key:string = 'Mouse' + ev.which;
		if(typeof(this.keyMapProto[key]) === 'undefined') {
			return;
		}
		this.keyMap[key] = KeyState.released;
	}
	
	private lockedMouseMoveHandler(ev:MouseEvent) {
		let mp:MouseProperties = this.mouseProperties;
		let cp: Point2D = mp.currentPosition;
		let m: Point2D = mp.movement;
		cp.x = ev.clientX;
		cp.y = ev.clientY;
		m.x += ev['movementX'];
		m.y += ev['movementY'];
	}
	
	private unlockedMouseMoveHandler(ev:MouseEvent) {
		const mp:MouseProperties = this.mouseProperties;
		const cp: Point2D = mp.currentPosition;
		const lp: Point2D = mp.lastPosition;
		const m: Point2D = mp.movement;
		cp.x = ev.clientX - this.root.offsetLeft + window.scrollX;
		cp.y = ev.clientY - this.root.offsetTop + window.scrollY;
		m.x = cp.x - lp.x;
		m.y = cp.y - lp.y;
	}
	
	private initProperties() {
		this.keyMap = Object.create(this.keyMapProto);
		this.mouseProperties = {
			currentPosition: {x: 0, y: 0},
			lastPosition: {x: 0, y: 0},
			movement: {x: 0, y: 0},
			wheelY: 0
		};
	}
	
	private installDocumentHandler() {
		document.addEventListener('mousedown', this._mouseDownHandler);
		document.addEventListener('mouseup', this._mouseUpHandler);
		document.addEventListener('keyup', this._keyUpHandler);
		document.addEventListener('keydown', this._keyDownHandler);
		document.addEventListener('mousewheel', this._scrollHandler);
	}
    
	private removeDocumentHandler() {
		document.removeEventListener('mousedown', this._mouseDownHandler);
		document.removeEventListener('mouseup', this._mouseUpHandler);
		document.removeEventListener('keyup', this._keyUpHandler);
		document.removeEventListener('keydown', this._keyDownHandler);
		document.removeEventListener('mousewheel', this._scrollHandler);
	}
	
    public start() {
		if(this.startRequested) {
			return;
		}
		this.startRequested = true;
		this.initProperties();
		if(this.mouseLock) {
			this._mouseHandler = (ev:MouseEvent) => {
				this.lockedMouseMoveHandler(ev);
			}
		}
		else {
			this._mouseHandler = (ev:MouseEvent) => {this.unlockedMouseMoveHandler(ev);};
		}
		
		this.root.addEventListener('mousemove', this._mouseHandler);
		
		const captureClickHandler:() => void = () => {
			this.root.removeEventListener('click', captureClickHandler);
			this.captureClicked = true;
			this.root.requestPointerLock();
		};
		if(this.mouseLock) {
			this.root.addEventListener('click', captureClickHandler);
		}
		else if(this.runLoop) {
			this.startMainThread();
		}
    }
	
	private startMainThread() {
		this.started = true;
		this.installDocumentHandler();
		this.mainThread = window.setInterval(
            () => {this.mThreadHandler();},
            this.interval
        );
	}
    
    public aggregate():GlevbEvent {
        const mProps: MouseProperties = this.mouseProperties;
		const cPos: Point2D = mProps.currentPosition;
        const x = cPos.x, y = cPos.y;
		this.mouseProperties = {
			currentPosition: {x, y},
			lastPosition: {x, y},
			movement: {x: 0, y: 0},
			wheelY: 0
		};
		
		const currentKeys:{[key:string]:KeyState} = this.keyMap;
		this.keyMap = Object.create(this.keyMapProto);
		for(let k in currentKeys) {
			switch(currentKeys[k]) {
			case KeyState.pressed:
			case KeyState.hold:
				this.keyMap[k] = KeyState.hold;
				break;
			case KeyState.released:
			case KeyState.idle:
				this.keyMap[k] = KeyState.idle;
				break;
			}
		}
		
		return new GlevbEvent(mProps, currentKeys);
    }
    
    private trigger<E>(e:E, handers:Array<(e:E) => void>):void {
        for(let h of handers) {
            try {
                h(e);
            } catch(e) {
                this.errorLog(
                    'Caught error during execution of handler',
                    h,
                    e
                );
            }
        }
    }
	
	public mThreadHandler() {
        this.trigger(this.aggregate(), this.loopHandler);
	}
    
    public stop() {
		this.startRequested = false;
		window.clearInterval(this.mainThread);
		this.removeDocumentHandler();
		this.root.removeEventListener('mousemove', this._mouseHandler);
        this.trigger('stop', this.stopHandler);
    }
	
	public watchKeys(...keys:Array<Keys>) {
		this.keyMapProto = {};
		this.keyMap = {};
		
		let strKey:string;
		for(let k of keys) {
			strKey = this.getStrKey(k);
			if(!strKey) {
				console.warn('Unknown keycode', k);
				continue;
			}
			this.keyMapProto[strKey] = this.keyMap[strKey] || KeyState.idle;
		}
	}
    
    public onStart(handler:(ev:string) => void) {
        this.startHandler.push(handler);
    }
    
    public onStop(handler:(ev:string) => void) {
        this.stopHandler.push(handler);
    }
	
	public onLoop(handler:(ev:GlevbEvent) => void) {
		this.loopHandler.push(handler);
	}
}
