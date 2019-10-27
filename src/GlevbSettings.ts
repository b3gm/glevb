export default interface GlevbSettings {
    root?:HTMLElement;
    mouseLock?:boolean;
    interval?:number;
	runLoop?:boolean;
    errorLog?:(...args:any[]) => void;
    debugLog?:(...args:any[]) => void;
}