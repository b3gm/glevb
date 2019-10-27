import Point2D from './Point2D';

export default interface MouseProperties {
	lastPosition:Point2D;
	currentPosition:Point2D;
	movement:Point2D;
	wheelY:number;
}