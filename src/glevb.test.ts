import {
	Glevb,
	Keys
} from './index';
import {ex2, ey2} from '@b3gm/algebr4/dist/Vec2';
import Vec2 from '@b3gm/algebr4/dist/Vec2';

let glevb:Glevb = new Glevb({
	root: document.getElementById('cvsViewPort'),
	mouseLock: true,
	interval: 3000,
	runLoop: false
});

const PI2 = Math.PI * 2;

class Cursor {
	public position:Vec2;
	
	constructor() {
		this.position = new Vec2(0, 0);
	}
	
	public render(ctx:CanvasRenderingContext2D) {
		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#ff0000';
		ctx.moveTo(this.position.x - 3, this.position.y);
		ctx.lineTo(this.position.x + 3, this.position.y);
		ctx.moveTo(this.position.x, this.position.y - 3);
		ctx.lineTo(this.position.x, this.position.y + 3);
		ctx.stroke();
	}
}

let projectiles:Array<Projectile> = [];

class Projectile {
	public static lifeTime:number = 4000;
	public position:Vec2;
	public speed:Vec2;
	public created:number;
	public orientation:number;
	
	constructor(now:number, position:Vec2, speed:Vec2, orientation:number) {
		this.created = now;
		this.position = position;
		this.speed = speed;
		this.orientation = orientation;
	}
	
	public propagate()  {
		this.position = this.position.add(this.speed);
	}
	
	public render(ctx:CanvasRenderingContext2D) {
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.orientation);
		
		ctx.strokeStyle = '#ffffff';
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(-3, 3);
		ctx.lineTo(3, 3);
		ctx.stroke();
		
		ctx.rotate(-this.orientation);
		ctx.translate(-this.position.x, -this.position.y);
	}
}

function checkProjectiles(now:number) {
	let kickTime: number = now - Projectile.lifeTime;
	let i:number = 0;
	for(let p of projectiles) {
		if(p.created > kickTime) {
			break;
		}
		++i;
	}
	if(i != 0) {
		projectiles = projectiles.slice(i);
	}
}

function fireProjectile(ship:Ship, now:number) {
	if(projectiles.length > 10) {
		return;
	}
	let pos:Vec2 = ship.position.copy();
	let s: Vec2 = ship.speed.add(
        ex2.turnRad(ship.orientation)
            .scalarMultiply(2.5)
    );
	
	projectiles.push(new Projectile(now, pos, s, ship.orientation));
}


class MyRng {
	private a:number;
	private b:number;
	private c:number;
	private x:number;
	
	constructor(seed:number) {
		this.a = 18267;
		this.b = 8371;
		this.c = 2923651;
		this.seed(seed);
	}
	
	public generate() {
		this.x = (this.a * this.x + this.b) % this.c;
		return this.x;
	}
	
	public nextInt(max:number) {
		return Math.floor(this.nextDouble() * max);
	}
	
	public nextDouble() {
		return this.generate() / this.c;
	}
	
	public nextBool() {
		return this.nextDouble() > 0.5;
	}
	
	public seed(s:number) {
		this.x = s % this.c;
		if(this.x < 0) {
			this.x += this.c;
		}
		if(this.x < 0) {
			throw 'x is smaller than 0';
		}
	}
}

class StarField {
	private rng:MyRng;
	private starNumber:number;
	private seed:number;
	private x:number;
	private y:number;
	
	constructor(x0:number, y0:number) {
		this.x = x0;
		this.y = y0;
		this.seed = x0*1300 + y0 * 1350;
		this.rng = new MyRng(this.seed);
		this.starNumber = 10 + this.rng.nextInt(7);
	}
	
	public render(ctx:CanvasRenderingContext2D) {
		this.rng.seed(this.seed);
		let x:number, y:number, r:number;
		ctx.translate(this.x, this.y);
		/* Starfield boundary
		ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
		ctx.rect(0, 0, 640, 480);
		ctx.stroke();//*/
		for (let i = 0; i != this.starNumber; ++i) {
			x = this.rng.nextInt(640);
			y = this.rng.nextInt(480);
			ctx.translate(-x, -y);
			r = this.rng.nextDouble() * 5 + 1;
			let grad = ctx.createRadialGradient(x, y, 0, x, y, r);
			grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
			grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)');
			grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
			ctx.translate(x, y);
			ctx.fillStyle = grad;
			ctx.fillRect(x-r, y-r, 2*r, 2*r);
		}
		ctx.translate(-this.x, -this.y);
	}
}

class Planet {
	private rgb:string;
	
	constructor(
		public name:string,
		public pos:Vec2,
		public radius:number,
		r:number,
		g:number,
		b:number
	) {
		this.rgb = 'rgb(' + r + ',' + g + ',' + b + ')';
	}
	
	public render(ctx:CanvasRenderingContext2D, shipPosition:Vec2) {
		let diffVec:Vec2 = this.pos.subtract(shipPosition);
		let distance:number = diffVec.norm();
		if(distance > this.radius + 480) {
			// RenderUI
			ctx.translate(shipPosition.x, shipPosition.y);
			ctx.beginPath();
			let eDiff:Vec2 = diffVec.normalize();
			let begin: Vec2 = eDiff.scalarMultiply(40);
			let end:Vec2 = eDiff.scalarMultiply(60);
			let tPos:Vec2 = eDiff.scalarMultiply(80);
			ctx.moveTo(begin.x, begin.y);
			ctx.lineTo(end.x, end.y);
			ctx.strokeStyle = this.rgb;
			ctx.stroke();
			ctx.textAlign = 'center';
			ctx.fillStyle = this.rgb;
			ctx.fillText(this.name + ' ' + distance.toFixed(), tPos.x, tPos.y);
			ctx.translate(-shipPosition.x, -shipPosition.y);
		}
		if (distance < this.radius + 640) {
			// render Planet
			console.log('rendering ' + this.name);
			ctx.translate(this.pos.x, this.pos.y);
			ctx.beginPath();
			ctx.arc(0, 0, this.radius, 0, 2*Math.PI, false);
			ctx.fillStyle = this.rgb;
			ctx.fill();
			ctx.translate(-this.pos.x, -this.pos.y);
		}
	}
}

class Ship  {
	public orientation:number;
	public position:Vec2;
	public speed:Vec2;
	public angularVelocity:number;
	private lastForce:Vec2;
	private lastAf:number;
	private rcsThrusterThreshold = 0.00027;
	
	constructor() {
		this.position = new Vec2(0, 0);
		this.angularVelocity = 0;
		this.orientation = 0;
		this.speed = new Vec2(0, 0);
		this.lastForce = new Vec2(0, 0);
		this.lastAf = 0;
	}
	
	public render(ctx:CanvasRenderingContext2D) {
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.orientation);
		ctx.fillStyle = '#4040a0';
		ctx.fillRect(-10, -5, 20, 10);
		if(this.lastForce.x > 0) {
			ctx.fillStyle = '#a0a040';
			ctx.fillRect(-15, -2, 5, 4);
		}
		else if(this.lastForce.x < 0) {
			ctx.fillStyle = '#a0a040';
			ctx.beginPath();
			ctx.moveTo(10, 0);
			ctx.lineTo(14, 3);
			ctx.lineTo(14, -3);
			ctx.closePath();
			ctx.fill();
		}
		let fl:boolean = false;
		let fr:boolean = false;
		let bl:boolean = false;
		let br:boolean = false;
		if(this.lastForce.y < 0) {
			fr = true;
			br = true;
		}
		else if(this.lastForce.y > 0) {
			fl = true;
			bl = true;
		}
		if(this.lastAf < - this.rcsThrusterThreshold) {
			fr = true;
			bl = true;
		}
		else if (this.lastAf > this.rcsThrusterThreshold) {
			fl = true;
			br = true;
		}
		if(fl && fr) {
			fl = fr = false;
		}
		if(bl && br) {
			bl = br = false;
		}
		ctx.fillStyle='#ffffff';
		if(fr) {
			ctx.beginPath();
			ctx.moveTo(7, 5);
			ctx.lineTo(11, 9);
			ctx.lineTo(3, 9);
			ctx.closePath();
			ctx.fill();
		}
		if(bl) {
			ctx.beginPath();
			ctx.moveTo(-7, -5);
			ctx.lineTo(-3, -9);
			ctx.lineTo(-11, -9);
			ctx.closePath();
			ctx.fill();
		}
		if(fl) {
			ctx.beginPath();
			ctx.moveTo(7, -5);
			ctx.lineTo(11, -9);
			ctx.lineTo(3, -9);
			ctx.closePath();
			ctx.fill();
		}
		if(br) {
			ctx.beginPath();
			ctx.moveTo(-7, 5);
			ctx.lineTo(-3, 9);
			ctx.lineTo(-11, 9);
			ctx.closePath();
			ctx.fill();
		}
		ctx.rotate(-this.orientation);
		ctx.translate(-this.position.x, -this.position.y);
	}
	
	public propagate(af:number, trF:Vec2) {
		this.lastForce = trF;
		trF = trF.turnRad(this.orientation);
		this.speed.x += trF.x;
		this.speed.y += trF.y;
		this.position = this.position.add(this.speed);
		
		this.angularVelocity += af;
		this.orientation += this.angularVelocity;
		this.lastAf = af;
	}
}

let ship:Ship = new Ship();
let planets:Array<Planet> = [
	new Planet('Chinone', new Vec2(640, 480), 20, 255, 0, 0),
	new Planet('Theboter', new Vec2(12074, -7463), 100, 100, 230, 80),
	new Planet('Xoutis', new Vec2(-300, -1280), 85, 120, 60, 60),
	new Planet('Groawei', new Vec2(-900, -2156), 29, 170, 170, 190),
	new Planet('Mulvypso', new Vec2(5648, 2459), 49, 69, 60, 236),
	new Planet('Yer', new Vec2(-1769, 384), 500, 255, 255, 180)
];
ship.position.x = 320;
ship.position.y = 240;
let cursor:Cursor = new Cursor();
cursor.position.x = 340;
cursor.position.y = 240;
let canvas:HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('cvsViewPort');
let ctx:CanvasRenderingContext2D = canvas.getContext('2d');
let interval:number = 1000/60;
let lastFired:number = Date.now();
let fireCD:number = 100;

function vecProd(a:Vec2, b:Vec2) {
	a = a.normalize();
	b = b.normalize();
	return a.x * b.y - b.x * a.y;
}
function sigAngle(a:Vec2, b:Vec2) {
	return Math.asin(vecProd(a, b));
}

let fwd:boolean = false;

let forward:Keys = Keys.KeyW;
let backward:Keys = Keys.KeyS;
let strafeLeft:Keys = Keys.KeyA;
let strafeRight:Keys = Keys.KeyD;
let fireButton:Keys = Keys.Mouse1;
let lastPosition:Vec2 = null;
let lastSFX = 0;
let lastSFY = 0;

interface Vec2Pos {
	x:number;
	y:number;
}

function getStarFieldZero(pos:Vec2) {
	let result:Vec2Pos = {
		x: Math.floor(pos.x / 640) * 640,
		y: Math.floor(pos.y / 480) * 480
	}
	return result;
}

function createStarFields(center:Vec2) {
	let result:Array<StarField> = [];
	let sx:number = center.x - 640;
	let sy:number;
	for(let i = 0; i != 3; ++i) {
		sy = center.y - 480;
		for(let j = 0; j != 3; ++j) {
			console.log('Creating starfield:', sx, sy);
			result.push(new StarField(sx, sy));
			sy += 480;
		}
		sx += 640;
	}
	return result;
}

let starFields:Array<StarField> = [];

//*
function gameLoop() {
	const ev = glevb.aggregate();
	let cx: number = cursor.position.x + ev.mouseProperties.movement.x;
	let cy: number = cursor.position.y + ev.mouseProperties.movement.y;
	cursor.position.x = Math.min(640, Math.max(0, cx));
	cursor.position.y = Math.min(480, Math.max(0, cy));
	
	if(ev.mouseProperties.wheelY !== 0) {
		console.log('WheelDelta:', ev.mouseProperties.wheelY);
	}
	
	let cpos:Vec2 = cursor.position.add(ship.position);
	cpos.x -= 320;
	cpos.y -= 240;
	
	let diffVec:Vec2 = cpos.subtract(ship.position);
	
	let af:number;
	if(diffVec.norm() > 10) {
		let shipVec:Vec2 = ex2.turnRad(ship.orientation);

		let angleDiff: number = sigAngle(shipVec, diffVec);
		af = interval / 1000 * (angleDiff * 0.05 - ship.angularVelocity * 1.6);
	}
	else {
		af = 0.0;
	}
	
	let cF:Vec2 = new Vec2(0, 0);
	let mod:number = interval / 33;
	if(ev.isDown(forward)) {
		cF.x += mod * 0.06;
	}
	if(ev.isDown(backward)) {
		cF.x -= mod * 0.035;
	}
	if(ev.isDown(strafeLeft)) {
		cF.y -= mod * 0.035;
	}
	if(ev.isDown(strafeRight)) {
		cF.y += mod * 0.035;
	}
	let now:number = Date.now();
	if(ev.isDown(fireButton) && now - lastFired > fireCD) {
		console.log('Fireing');
		lastFired = now;
		fireProjectile(ship, now);
	}
	checkProjectiles(now);
	ship.propagate(af, cF);
	for(let p of projectiles) {
		p.propagate();
	}
	
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, 640, 480);
	
	let sf0 = getStarFieldZero(ship.position);
	if(starFields.length === 0 || sf0.x != lastSFX || sf0.y != lastSFY) {
		lastSFX = sf0.x;
		lastSFY = sf0.y;
		starFields = createStarFields(new Vec2(lastSFX, lastSFY));
		console.log('x:', lastSFX, ' y:', lastSFY);
	}
	
	// Settings view port
	ctx.translate(-cpos.x +320, -cpos.y +240);
	
	// Rendering Starfield
	for(let sf of starFields) {
		sf.render(ctx);
	}
	
	// rendering planets
    const planetsToRender = planets.filter(
        p => p.pos.subtract(cpos).norm() < p.radius * p.radius + 1000
    );
	for(let p of planetsToRender) {
		p.render(ctx, ship.position);
	}
	
	// rendering Ship
	ship.render(ctx);
	
	// rendering projectiles
	for(let p of projectiles) {
		p.render(ctx);
	}
	
	// resetting viewport
	ctx.translate(cpos.x -320, cpos.y -240);
	
	// rendering cursor
	cursor.render(ctx);
};
//*/

let gameLoopInterval:number;
glevb.onStart(() => {
	console.log('start event caught');
	gameLoopInterval = setInterval(() => gameLoop(), interval);
});

glevb.onStop(() => {
	console.log('stop event caught');
	window.clearInterval(gameLoopInterval);
});

glevb.watchKeys(forward, backward, strafeLeft, strafeRight, fireButton);

window['Vec2'] = Vec2;
window['sigAngle'] = sigAngle;
window['vecProd'] = vecProd;
window['cs'] = glevb;
window['Rng'] = MyRng;

class Ball {
	private r0:number;
	private r:number;
	private squashTime:number;
	private squashFrequency:number;
	private squash:number;
	private squashDecay:number = 0.02;
	private lifeTime:number = 0;
	
	
	constructor(private pos:Vec2, private vel:Vec2, private color:string) {
		this.r = this.r0 = 10;
		this.squashTime = 500;
	}
	
	public splits() {
		if(this.r > 20 && Math.random() < 0.02) {
			this.r /= Math.SQRT2;
			let cV = this.vel.copy();
			cV.x += (Math.random() * 4 - 2);
			cV.y += (Math.random() * 4 - 2);
			this.vel.x += (Math.random() * 4 - 2);
			this.vel.y += (Math.random() * 4 - 2);
			return new Ball(this.pos, cV, this.color);
		}
		return null;
	}
	
	public update(ctx:CanvasRenderingContext2D) {
		++this.lifeTime;
		let r = this.r = this.r + 1 / 100;
		this.squash = this.r * 0.3;
		this.squashFrequency = 10 / this.r * 0.5;
		++this.squashTime;
		let s = this.squash * Math.exp(-this.squashTime * this.squashDecay);
		let trig = Math.cos(this.squashTime * this.squashFrequency);
		let rx = Math.max(0, r + trig * s);
		let ry = Math.max(0, r - trig * s);
		this.pos = this.pos.add(this.vel);
		if(this.pos.x < 0) {
			this.pos.x = 0;
			this.vel.x *= -1;
			this.hit();
		}
		if(this.pos.x > 640) {
			this.pos.x = 640;
			this.vel.x *= -1;
			this.hit();
		}
		if(this.pos.y < 0) {
			this.pos.y = 0;
			this.vel.y *= -1;
			this.hit();
		}
		if(this.pos.y > 480) {
			this.pos.y = 480;
			this.vel.y *= -1;
			this.hit();
		}
		ctx.fillStyle = this.color;
		ctx.strokeStyle = '#00ffff';
		ctx.beginPath();
		ctx.ellipse(
			this.pos.x,
			this.pos.y,
			rx,
			ry,
			ex2.angle(this.vel),
			0,
			PI2
		);
		ctx.fill();
		ctx.stroke();
		
		if(this.lifeTime < 1500) {
			return true;
		}
		return Math.random() > (this.lifeTime - 1500) / 3000;
	}
	
	private hit() {
		this.squashTime = 0;
		this.squash = Math.max(this.r * 0.6, this.vel.norm());
	}
}

class MouseBall {
	private thres:number;
	
	constructor(private r:number) {
		this.thres = r * 0.75;
	}
	
	public update(ctx:CanvasRenderingContext2D, position:Vec2) {
		ctx.fillStyle = '#30a030';
		ctx.strokeStyle = '#a030a0';
		ctx.beginPath();
		let mVec = position
            .subtract(new Vec2(320, 240));
		let mag:number = mVec.norm();
		let angle:number = ex2.angle(mVec);
        if (mVec.y < 0) {
            angle *= -1;
        }
		console.log('Relative angle: ' + (angle / PI2));
		let rx = this.r;
		let ry = this.r;
		if(mag > this.thres) {
			rx = Math.max(2, rx + (mag - this.thres) * 0.5);
			ry = Math.max(2, ry - (mag - this.thres) * 0.5);
		}
		ctx.ellipse(320, 240, rx, ry, angle, 0, PI2);
		ctx.fill();
		ctx.stroke();
	}
}

function createBall() {
	let p:Vec2 = new Vec2(Math.random() * 640, Math.random() * 480);
	let v:Vec2 = new Vec2(Math.random() * 10 - 5, Math.random() * 10 - 5);
	return new Ball(p, v, 'hsl(' + Math.floor(Math.random() * 360) + ', 100%, 50%)');
}

document.addEventListener('DOMContentLoaded', () => {
	let cvs:HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('cvsUnlocked');
	let ctx:CanvasRenderingContext2D = <CanvasRenderingContext2D>cvs.getContext('2d');
	let start = document.getElementById('startBtn');
	let stop = document.getElementById('stopBtn');
	let balls:Array<Ball> = [];
	const ballCount:number = 5;
	for(let i = 0; i != ballCount; ++i) {
		balls.push(createBall());
	}
	let sys2 = new Glevb({
		interval: 1000 / 30,
		runLoop: true,
		root: cvs
	});
	let mouseBall:MouseBall = new MouseBall(50);
	sys2.onLoop((ev) => {
		console.log('System2 loop');
		ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
		ctx.fillRect(0, 0, 640, 480);
		
        mouseBall.update(
            ctx,
            Vec2.fromLiteral(
                ev.mouseProperties.currentPosition
            )
        );
		let b:Ball, c:Ball;
		for(let i = balls.length - 1; i >= 0; --i) {
			b = balls[i];
			if((c = b.splits()) !== null) {
				balls.push(c);
			}
			if(!b.update(ctx)) {
				balls.splice(i, 1);
			}
		}
	});
	start.addEventListener('click', () => {
		sys2.start();
	});
	stop.addEventListener('click', () => {
		sys2.stop();
	});
});
