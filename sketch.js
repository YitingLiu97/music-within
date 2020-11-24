// posenet_webcam_music_visual
// ITP CAMP 2020
// Yiting Liu 
// 008
// 06/25/2020 

// combined with polar perlin noise
// color: https://www.schemecolor.com/dreamy-pastels.php
// freq: https://pages.mtu.edu/~suits/notefreqs.html

let video;
let poseNet;
let poses = [];
let noseX, noseY, leftWristX, leftWristY, rightWristX, rightWristY;

let noiseSound, env, freqHigh, freqLow;
let zoff = 0;
let zoffVal, zoffValS, noiseMax, noiseMaxS, aVal, aValS, delayVal, rangeS, delayS;
let monoSynth, polySynth, delay, check;

//for polysynth and monosynth
let velocity, time, dur;


function myCheckedEvent() {
	if (this.checked()) {
		clear();
		// console.log("checked")
	} else {
		//do nothing 
	}
}
function modelReady() {
	console.log('Model Loaded');
}
function setup() {

	createCanvas(windowWidth *0.8, windowWidth * 9 / 16 *0.8);
	video = createCapture(VIDEO);
	video.size(width, height);
	poseNet = ml5.poseNet(video, modelReady);
	poseNet.on('pose', function(results) {
		poses = results;
	});

	video.hide();

	check = createCheckbox('clear', false);
	check.changed(myCheckedEvent);

	let zoffDiv = createDiv('zoff');
	zoffDiv.style('inline');
	zoffValS = createSlider(0.01, 0.2, 0.01, 0.01);
	zoffDiv.child(zoffValS);

	let noiseDiv = createDiv('noiseMax');
	noiseDiv.style('inline');
	noiseMaxS = createSlider(0.01, 0.5, 0.3, 0.01);
	noiseDiv.child(noiseMaxS);

	//increment of the perlin noise
	let angleDiv = createDiv('angle');
	angleDiv.style('inline');
	aValS = createSlider(0.01, 0.3, 0.01, 0.01);
	angleDiv.child(aValS);

	//polysynth delay
	let delayDiv = createDiv('delay');
	delayDiv.style('inline');
	delayS = createSlider(3000, 8000, 4000, 200);
	delayDiv.child(delayS);

	//size of the circle
	let rangeDiv = createDiv('size');
	rangeDiv.style('inline');
	rangeS = createSlider(width / 6, width, width / 2, width / 10);
	rangeDiv.child(rangeS);

	let velDiv = createDiv('velocity');
	velDiv.style('inline');
	velS = createSlider(0, 1, 0.2, 0.01);
	velDiv.child(velS);

	monoSynth = new p5.MonoSynth();
	polySynth = new p5.PolySynth();
	delay = new p5.Delay();


	noiseSound = new p5.Noise('pink'); // other types include 'brown' and 'pink'
	noiseSound.start();
	noiseSound.amp(0);
	env = new p5.Envelope();
	env.setADSR(0.001, 0.1, 0.2, 0.1);
	env.setRange(0.3, 0);
}

function draw() {
	background('rgba(255,200,200, 0.25)');

	noFill();
	drawPoints();

	range = rangeS.value()

	let rVal, gVal, bVal;
	freqLow = 220;
	freqHigh = 660;
	push();

	adaptPoint(noseX, noseY, freqLow, freqHigh, range);
	pop();

	push();
	col = fill(255, 0, 0);
	range = range / 3;

	if (noseY > leftWristY) {
		env.play(noiseSound);
		adaptPoint(leftWristX, leftWristY, freqLow, freqHigh, range);

	}
	pop();


	push();
	range = video.width / 60;
	adaptPoint(rightWristX, rightWristY, freqLow, freqHigh, range);
	pop();

}

function adaptPoint(x, y, freqLow, freqHigh, range) {
	if (x != null && y != null) {
		translate(x, y);
		rVal = map(x, 0, video.width, 0, 255);
		gVal = map(y, 0, video.height, 0, 255);
		bVal = (rVal + gVal) / rVal;
		col = stroke(gVal - 20, bVal, rVal);
		playSynth(x, y, freqLow, freqHigh, velocity, time, dur);
		drawPolarPerlinNoise(x, y, col, range);
	}
}

//nose and hands
function drawPoints() {

	for (let i = 0; i < poses.length; i++) {
		let pose = poses[i].pose;
		for (let j = 0; j < pose.keypoints.length; j++) {
			let keypoint = pose.keypoints[j];

			if (keypoint.score > 0.2 && keypoint.part == "nose") {
				noseX = keypoint.position.x;
				noseY = keypoint.position.y;
			}

			if (keypoint.score > 0.2 && keypoint.part == "leftWrist") {
				leftWristX = keypoint.position.x;
				leftWristY = keypoint.position.y;
			}

			if (keypoint.score > 0.2 && keypoint.part == "rightWrist") {

				rightWristX = keypoint.position.x;
				rightWristY = keypoint.position.y;
			}

		}
	}
}


function drawPolarPerlinNoise(centerX, centerY, col, range) {
	aVal = aValS.value();
	noiseMax = noiseMaxS.value();
	zoffVal = zoffValS.value();

	let xoff, yoff;

	beginShape();
	for (let a = 0; a < TWO_PI; a += aVal) {

		yoff = map(sin(a), -1, 1, 0, noiseMax);

		let r = map(noise(xoff, yoff, zoff), 0, 1, 0, range);
		let x = r * cos(a);
		let y = r * sin(a);
		vertex(x, y);

	}
	endShape(CLOSE);
	zoff += zoffVal;
}


function playSynth(x, y, freqLow, freqHigh, velocity, time, dur) {
	userStartAudio();
	let note;
	if (x != null) {
		note = map(x, 0, width, freqLow, freqHigh);
	}
	polySynth.play(note / 3, 0, time, dur / 4);
	polySynth.play(note / 4, 0, 0, dur / 8);
	polySynth.play(note / 2, 0.3, 0.5, dur * 2);

	monoSynth.play(note, velocity, time, dur);
	delay.process(polySynth, 0.12, 0.6, delayS.value());
}