let angle = Math.PI / 4;
let len = 150;

function setup() {
    createCanvas(800, 600);
    angleMode(RADIANS);
}

function draw() {
    background(26, 26, 46);
    
    translate(width / 2, height);
    
    stroke(255, 200, 100);
    strokeWeight(2);
    
    branch(len);
}

function branch(len) {
    line(0, 0, 0, -len);
    translate(0, -len);
    
    if (len > 4) {
        push();
        rotate(angle);
        stroke(255, 150, 200);
        branch(len * 0.67);
        pop();
        
        push();
        rotate(-angle);
        stroke(150, 200, 255);
        branch(len * 0.67);
        pop();
    }
}

function mouseMoved() {
    angle = map(mouseX, 0, width, 0, Math.PI);
}

function keyPressed() {
    if (key === 's') {
        saveCanvas('fractal_tree', 'png');
    }
}