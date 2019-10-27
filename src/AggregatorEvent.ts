import MouseProperties from './MouseProperties';

export default interface AggregatorEvent {
	mouseProperties:MouseProperties;
	keys:{[key:string]:number};
}
