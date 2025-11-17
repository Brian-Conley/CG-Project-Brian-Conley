"use strict";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRectangularPrism(objclass, center, dimensions, rotation, translationVector, rotationVector, color) {

    var theta = [0, 0, 0];
    var translation = [0 ,0 ,0];

    const lengthh = dimensions[0] / 2;
    const heighth = dimensions[1] / 2;
    const widthh = dimensions[2] / 2;


    // Set up initial vertex positions
    var local_vertices = [
        vec3( -lengthh, -heighth,  widthh ),
        vec3( -lengthh,  heighth,  widthh ),
        vec3(  lengthh,  heighth,  widthh ),
        vec3(  lengthh, -heighth,  widthh ),
        vec3( -lengthh, -heighth, -widthh ),
        vec3( -lengthh,  heighth, -widthh ),
        vec3(  lengthh,  heighth, -widthh ),
        vec3(  lengthh, -heighth, -widthh )
    ];
    var vertices = [];

    var rotx = rotateX(rotation[0]);
    var roty = rotateY(rotation[1]);
    var rotz = rotateZ(rotation[2]);
    var rot = mult(rotx, mult(roty, rotz));
    var t = mult(translate(center), rot);

    for (let v of local_vertices) {
        var v4 = vec4(v, 1);
        var rot_v4 = vec3( dot(v4, t[0]), dot(v4, t[1]), dot(v4, t[2]) );
        vertices.push(vec3( rot_v4[0], rot_v4[1], rot_v4[2] ));
    }

    // The set of triangles making up the shape
    var indices = [
        1, 0, 3,
        3, 2, 1,
        2, 3, 7,
        7, 6, 2,
        3, 0, 4,
        4, 7, 3,
        6, 5, 1,
        1, 2, 6,
        4, 5, 6,
        6, 7, 4,
        5, 4, 0,
        0, 1, 5
    ];

    // Set the color of each vertex
    var vertexColors = [
        color,
        color,
        color,
        color,
        color,
        color,
        color,
        color
    ];

    // array element buffer
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    // color array atrribute buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW );

    // vertex array attribute buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var boundingBox = {
        min: vec3( center[0] - lengthh, center[1] - heighth, center[2] - widthh ),
        max: vec3( center[0] + lengthh, center[1] + heighth, center[2] + widthh ),
    }

    return {
        objclass: objclass,
        iBuffer: iBuffer,
        cBuffer: cBuffer,
        vBuffer: vBuffer,
        translation: translation,
        translationVector: translationVector,
        theta: theta,
        rotationVector: rotationVector,
        vertices: vertices,
        vertexColors: vertexColors,
        numVertices: 36,
        indices: indices,
        boundingBox: boundingBox,
        AABB: function() {
            let bbm = this.boundingBox.min;
            let bbM = this.boundingBox.max;
            let t = this.translation;
            return {
                min: vec3( bbm[0] + t[0], bbm[1] + t[1], bbm[2] + t[2] ),
                max: vec3( bbM[0] + t[0], bbM[1] + t[1], bbM[2] + t[2] )
            }
        }
    }

}

function applyTransformations(shape) {
    shape.translation[0] += shape.translationVector[0];
    shape.translation[1] += shape.translationVector[1];
    shape.translation[2] += shape.translationVector[2];
    shape.theta[0] += shape.rotationVector[0];
    shape.theta[1] += shape.rotationVector[1];
    shape.theta[2] += shape.rotationVector[2];
}

// Note: The frame appears to be 2x2, base object creation on that.
function makeObstacle() {

}

var canvas;
var gl;

var thetaLoc;
var translationLoc;
var vPosition;
var vColor;

var frameRate = 30.0;
var player;
var playerGravity = -0.025;
var score = 0;
var obstacles;
var border;
var objGroups;
var frameCount = 0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);;

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    vColor = gl.getAttribLocation( program, "vColor" );
    vPosition = gl.getAttribLocation( program, "vPosition" );

    thetaLoc = gl.getUniformLocation(program, "theta");
    translationLoc = gl.getUniformLocation(program, "translation");

    // makeRectangularPrism(objclass, center, dimensions, rotation, translationVector, rotationVector, color) {
    obstacles = [
        makeRectangularPrism("cube", vec3(2,0,0.025), vec3(.1,2,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,1,0,1)),
        makeRectangularPrism("cube", vec3(3,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1)),
        makeRectangularPrism("cube", vec3(4,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1)),
        makeRectangularPrism("cube", vec3(5,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1)),
        makeRectangularPrism("cube", vec3(6,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1)),
        makeRectangularPrism("cube", vec3(7,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1)),
        makeRectangularPrism("cube", vec3(8,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1)),
        makeRectangularPrism("cube", vec3(9,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1)),
        makeRectangularPrism("cube", vec3(10,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1)),
        makeRectangularPrism("cube", vec3(11,0,0.025), vec3(.1,.1,.1), vec3(0,0,0), vec3(-.01,0,0), vec3(0,0,0), vec4(0,0,1,1))
    ];

    border = [
        makeRectangularPrism("border", vec3(0,-1,0), vec3(5,.1,2), vec3(0,0,0), vec3(0,0,0), vec3(0,0,0), vec4(0,0,0,1)),
        makeRectangularPrism("border", vec3(0,1,0), vec3(5,.1,2), vec3(0,0,0), vec3(0,0,0), vec3(0,0,0), vec4(0,0,0,1)),
        makeRectangularPrism("border", vec3(-1,0,0), vec3(.1,5,2), vec3(0,0,0), vec3(0,0,0), vec3(0,0,0), vec4(0,0,0,1)),
        makeRectangularPrism("border", vec3(1,0,0), vec3(.1,5,2), vec3(0,0,0), vec3(0,0,0), vec3(0,0,0), vec4(0,0,0,1))
    ];

    player = makeRectangularPrism("cube", vec3(0,0,0), vec3(.1,.1,.1), vec3(0,0,0), vec3(0,0,0), vec3(0,0,0), vec4(1,0,0,1));

    render();
}

async function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (player.translationVector[1] > -0.05) {
        player.translationVector[1] -= 0.005;
    }

    // Move all objects
    for (var group of [obstacles, border, [player]]) {
        for (var obj of group) {
            applyTransformations(obj);

            gl.bindBuffer(gl.ARRAY_BUFFER, obj.vBuffer);
            gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            gl.bindBuffer(gl.ARRAY_BUFFER, obj.cBuffer);
            gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.iBuffer);

            gl.uniform3fv(thetaLoc, obj.theta);
            gl.uniform3fv(translationLoc, obj.translation);
            gl.drawElements(gl.TRIANGLES, obj.numVertices, gl.UNSIGNED_BYTE, 0);
        }
    }

    await sleep(1000/frameRate);

    frameCount += 1;
    requestAnimFrame( render );
}
