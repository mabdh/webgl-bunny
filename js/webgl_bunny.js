var gl;
var program;
var vs,fs;
var bunny_dat;
var viewportWidth;
var viewportHeight;
var canvas;
var modelViewMatrix  = mat4.create();
var projectionMatrix = mat4.create();
var startTime, runTime;

function init()
{
	canvas = document.getElementById("glcanvas");
	//Initialize
	gl = initWebGL(canvas);
	if(!gl){
		return;
	}
	
	initShaders();
	initBuffers();
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.disable(gl.DEPTH_TEST);
	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );
	startTime = (new Date).getTime();
	drawScene();
}


function onWindowResize( event ) {
	gl.viewport( 0, 0, viewportWidth, viewportHeight );
	mat4.perspective(projectionMatrix, Math.PI/2,canvas.width / canvas.height, 1, 2000);
}

function drawScene(){
	requestAnimationFrame(drawScene);
	runTime = (new Date).getTime() - startTime;

	gl.viewport(0, 0, viewportWidth, viewportHeight);
	var sinRes = 1.5 * Math.cos(runTime/500);
	var cosRes = 1.5 * Math.sin(runTime/500);
	var pos = [sinRes, 0.0, cosRes];
	var up = [0.0,1.0,0.0];
	modelViewMatrix = LookAt(pos, [0,0,0], up);
	var modelMatrix = Translate(0.0,0.0,0.70);

	mat4.multiply(modelViewMatrix,modelViewMatrix,modelMatrix);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	mat4.invert(modelViewMatrix, modelViewMatrix);
	var uniformProjMat = gl.getUniformLocation(program, "aProjectionMatrix");
	var uniformModelViewMat = gl.getUniformLocation(program, "aModelViewMatrix");

	gl.uniformMatrix4fv(uniformProjMat, gl.False, new Float32Array(projectionMatrix));
	gl.uniformMatrix4fv(uniformModelViewMat, gl.False, new Float32Array(modelViewMatrix));

	gl.drawArrays(gl.TRIANGLES, 0, bunny_dat.BunnyNumberVertices);
}

function LookAt(cPos, target, up) {
  var out_temp = vec3.create();
  var z = vec3.create();
  vec3.subtract(out_temp,cPos, target);
  vec3.normalize(z,out_temp);
  var x = vec3.create();
  vec3.cross(x, up, z);
  var y = vec3.create();
  vec3.cross(y, z, x);

  return [
     	x[0], 	x[1], 	x[2], 0,
     	y[0], 	y[1], 	y[2], 0,
     	z[0], 	z[1], 	z[2], 0,
     cPos[0],cPos[1],cPos[2], 1];
}

function Translate(tx, ty, tz) {
  return [1,  0,  0,  0,
		  0,  1,  0,  0,
		  0,  0,  1,  0,
		  tx, ty, tz,  1];
}

function initWebGL(canvas) {
  gl = null;
  
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  }
  catch(e) {}
  viewportWidth = canvas.width;
	viewportHeight = canvas.height;
  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}

function initBuffers(){
	bunny_dat = new BunnyData();
	bunny_buf = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, bunny_buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bunny_dat.BunnyMesh), gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 4, gl.FLOAT, false, bunny_dat.BunnyStrideSize, 0);
	gl.vertexAttribPointer(1, 3, gl.FLOAT, false, bunny_dat.BunnyStrideSize, 4 * Float32Array.BYTES_PER_ELEMENT);
	gl.vertexAttribPointer(2, 2, gl.FLOAT, false, bunny_dat.BunnyStrideSize, 7 * Float32Array.BYTES_PER_ELEMENT);
	
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
}

function initShaders(){
	vs = getShader(gl, "vshader");
	fs = getShader(gl, "fshader");
	program = gl.createProgram();
	
	gl.bindAttribLocation(program, 0, "aPosition");
	gl.bindAttribLocation(program, 1, "aColor");

	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }    
    gl.useProgram(program);
}

 function getShader(gl, id) {
      var shaderScript = document.getElementById(id);
      if (!shaderScript) {
          return null;
      }

      var str = "";
      var k = shaderScript.firstChild;
      while (k) {
          if (k.nodeType == 3)
              str += k.textContent;
          k = k.nextSibling;
      }

      var shader;
      if (shaderScript.type == "x-shader/x-fragment") {
          shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type == "x-shader/x-vertex") {
          shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
          return null;
      }

      gl.shaderSource(shader, str);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          alert(gl.getShaderInfoLog(shader));
          return null;
      }

      return shader;
  }