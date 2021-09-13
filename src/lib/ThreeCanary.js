import React, { Component } from "react";

import * as THREE from "three";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

// Generate a random integer between min and max
const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

// Generate N integer numbers (with no repetition) between mix and max
const randomN = (min, max, n) => {
  let numbers = [];
  while (numbers.length < n) {
    let num = random(min, max);
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers;
}

class ThreeCanary extends Component {
  constructor(props) {
    super(props);
    this.objectUrl = props.objectUrl;
    this.propsOnNodeSelected = props.onNodeSelected;
    this.propsNodes = props.nodes;
  }

  componentDidMount() {
    this.addScene();
    this.addRenderer();
    this.addCamera();
    this.addEffects();
    this.addControls();
    this.addLights();
    this.addMaterials();
    this.addModels();

    this.renderScene();
    this.start();
  }

  addScene() {
    this.width = this.mount.clientWidth;
    this.height = this.mount.clientHeight;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
  }

  addRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor("#000000");
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.mount.appendChild(this.renderer.domElement);
  }

  addCamera() {
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 1, 3000);
    this.camera.position.z = 30;
    this.camera.position.y = 5;
  }

  addEffects() {
    const renderScene = new RenderPass(this.scene, this.camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.mount.offsetWidth, this.mount.offsetHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0;
    bloomPass.strength = 0.6;

    const composer = new EffectComposer(this.renderer);
    composer.setPixelRatio(2);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    this.composer = composer;
  }

  addControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // Raycaster from camera to vertex pointer so we can interactive with 3D vertices
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    // this.raycaster.params.Points.threshold = 2;
    this.hoveredNodes = [];
    this.hoveredNodesObjs = [];
    this.clickedNodes = [];
    this.selectedNode = null;

    // window.addEventListener("resize", this.onWindowResize);
    document.addEventListener("pointermove", this.onPointerMove);

    if (this.renderer) {
      this.renderer.domElement.addEventListener("click", this.onNodeClicked, true);
    }
  }

  addLights() {
    const lights = [];
    lights[0] = new THREE.PointLight(0xff0000, 5, 0);
    lights[1] = new THREE.PointLight(0x00ff00, 5, 0);
    lights[2] = new THREE.PointLight(0x0000ff, 5, 0);
    lights[0].position.set(5, 0, 0);
    lights[1].position.set(-5, 0, 0);
    lights[2].position.set(0, 5, 0);
    this.lights = lights;

    this.scene.add(lights[0]);
    this.scene.add(lights[1]);
    this.scene.add(lights[2]);

    // this.scene.add( new THREE.PointLightHelper( lights[0], 3 ) );
    // this.scene.add( new THREE.PointLightHelper( lights[1], 3 ) );
    // this.scene.add( new THREE.PointLightHelper( lights[2], 3 ) );

    const gridHelper = new THREE.GridHelper( 400, 40, 0x0000ff, 0x808080 );
    gridHelper.position.y = 0;
    gridHelper.position.x = 0;
    // this.scene.add( gridHelper );
  }

  addMaterials() {
    // TODO: Move to brand color pallet
    this.canaryMtlMesh =  new THREE.PointsMaterial( { color: 0xe6007a });
    // this.canaryMtlPoints = new THREE.PointsMaterial( {
    //   color: 0x8200f9,
    //   size: 0.1
    // } );
  }

  addModels() {
    const gltfLoader = new GLTFLoader()

    gltfLoader.load(
      this.objectUrl,
      gltf => {
        
        if (!gltf.scene) {
          throw new Error(
            "Loaded model contains no scene!"
          );
        }

        const object = gltf.scene.children[0];

        object.geometry.computeTangents();

        if (!object) {
          throw new Error(
            "Loaded model contains no objects!"
          );
        }

        const uniforms = {
          "time": {
            value: 0.2
          }
        };
        this.uniforms = uniforms;
        const vertexShader = `
          varying vec2 vUv;

          void main()	{
    
            vUv = uv;
    
            gl_Position = vec4( position, 1.0 );
    
          }
        `;
        const fragmentShader = `
          varying vec2 vUv;

          uniform float time;
    
          void main()	{
    
            vec2 p = - 1.0 + 2.0 * vUv;
            float a = time * 40.0;
            float d, e, f, g = 1.0 / 40.0 ,h ,i ,r ,q;
    
            e = 400.0 * ( p.x * 0.5 + 0.5 );
            f = 400.0 * ( p.y * 0.5 + 0.5 );
            i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;
            d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g ) * 7.0;
            r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );
            q = f / r;
            e = ( r * cos( q ) ) - a / 2.0;
            f = ( r * sin( q ) ) - a / 2.0;
            d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;
            h = ( ( f + d ) + a / 2.0 ) * g;
            i = cos( h + r * p.x / 1.3 ) * ( e + e + a ) + cos( q * g * 6.0 ) * ( r + h / 3.0 );
            h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;
            h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 ) * g;
            i += cos( h * 2.3 * sin( a / 350.0 - q ) ) * 184.0 * sin( q - ( r * 4.3 + a / 12.0 ) * g ) + tan( r * g + h ) * 184.0 * cos( r * g + h );
            i = mod( i / 5.6, 256.0 ) / 64.0;
            if ( i < 0.0 ) i += 4.0;
            if ( i >= 2.0 ) i = 4.0 - i;
            d = r / 350.0;
            d += sin( d * d * 8.0 ) * 0.52;
            f = ( sin( a * g ) + 1.0 ) / 2.0;
            gl_FragColor = vec4( vec3( f * i / 1.6, i / 2.0 + d / 13.0, i ) * d * p.x + vec3( i / 1.3 + d / 8.0, i / 2.0 + d / 18.0, i ) * d * ( 1.0 - p.x ), 1.0 );
    
          }
        `;

        const shaderMaterial = new THREE.ShaderMaterial( {

          uniforms: uniforms,
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          alphaTest: 1.0,
          transparent: true

        } );


        this.canaryMesh = new THREE.Mesh( object.geometry, shaderMaterial);
        this.canaryMesh = object;
        this.canaryMesh.position.setY(-2);
        this.canaryMesh.rotation.z = Math.PI/4;
        this.canaryMesh.scale.set(4, 4, 4);

        // this.canaryMesh.material = shaderMaterial;
        this.canaryMesh.material.wireframe = true;
        this.canaryMesh.needsUpdate = true;
        this.canaryMesh.material.transparent = true;
        this.scene.add(this.canaryMesh);
        
        // It's a group, traverse it
        object.traverse((child) => {
          if (child.isMesh) {

            // Create point clouds based on mesh
            var childGeometry = child.geometry.clone();

            // Create a group of meshes as a point cloud instead of points, to have
            // per-mesh control
            let pos = childGeometry.attributes.position;
            let numMeshPoints = pos.count;

            // Randomly select n mesh points to use as placement for propsNodes
            this.propsNodesIndexes = randomN(0, numMeshPoints, this.propsNodes.length);

            this.canaryPointCloudGroup = new THREE.Group();

            for (let i=0; i<this.propsNodesIndexes.length; i+=1) {
              let nodeIndex = this.propsNodesIndexes[i];

              let geometry = new THREE.BoxGeometry();
              let mtlColor = "#ff0000";
              if (this.propsNodes[i].color) {
                mtlColor = this.propsNodes[i].color;
              }
              let material = new THREE.MeshBasicMaterial( { color: mtlColor } );
              material.wireframe = false;
              material.needsUpdate = true;
              let cube = new THREE.Mesh( geometry, material );

              cube.position.copy(new THREE.Vector3(pos.getX(nodeIndex), -pos.getZ(nodeIndex), pos.getY(nodeIndex)));
              let _scale = Math.random()*100;
              cube.scale.set(_scale, _scale, _scale);
              this.canaryPointCloudGroup.add( cube );

              // Map mesh ids to propsNodes
              this.propsNodes[i].meshIndex = nodeIndex;
              this.propsNodes[i].meshObj = cube;

            }
            this.canaryPointCloudGroup.position.setY(-2);
            this.canaryPointCloudGroup.rotation.y = -Math.PI/4;
            this.canaryPointCloudGroup.scale.set(4, 4, 4);
            this.scene.add( this.canaryPointCloudGroup );
          }
        })


      },
      xhr => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      error => {
        console.log("Error while loading: " + error);
      }
    );
  }

  onPointerMove = (event) => {
    event.preventDefault();

    // Raycasting have to discount bounding box of rendering canvas
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ( ( event.clientX - rect.left ) / ( rect.right - rect.left ) ) * 2 - 1;
    this.pointer.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;
  }

  onNodeClicked = (event) => {

    if (this.hoveredNodes) {

      for (let i=0; i<this.hoveredNodesObjs.length; i+=1) {
        if (this.selectedNode !== this.hoveredNodesObjs[i]) {
          // If node is hovered and we click on it, put it on selectedNode
          this.selectedNode = this.hoveredNodesObjs[i];

          // Map clicked mesh to propsNodes and call props' callback function
          for (let j=0; j<this.propsNodes.length; j+=1) {
            if (this.propsNodes[j].meshObj === this.hoveredNodesObjs[i]) {
              // Call callback function passing clicked props Nodes as argument
              if (this.propsOnNodeSelected) {
                this.propsOnNodeSelected(this.propsNodes[j]);
              }
            }
          }
        } else {
          // If we click again in a node, remove from selectedNode
          this.selectedNode = null;
        }
      }

    }

  }

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  componentWillUnmount() {
    this.stop();
    this.mount.removeChild(this.renderer.domElement);
  }

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  }

  stop = () => {
    cancelAnimationFrame(this.frameId);
  }

  animate = () => {
    
    const delta = this.clock.getDelta();

    // Change shader params
    if (this.uniforms)
      this.uniforms[ "time" ].value += delta * 5;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    this.hoveredNodes = [];
    this.hoveredNodesObjs = [];
    if (this.canaryPointCloudGroup) {
      const intersects = this.raycaster.intersectObject(this.canaryPointCloudGroup, true);
      if (intersects != null && intersects.length > 0) {
        for (let i=0; i<intersects.length; i+=1) {
          if (!this.hoveredNodes.includes(intersects[i].object.id))
            this.hoveredNodes.push(intersects[i].object.id);
        }
      }

      // Render hovered nodes
      for (let i=0; i<this.canaryPointCloudGroup.children.length; i+=1) {

        if (this.hoveredNodes.includes(this.canaryPointCloudGroup.children[i].id)) {
          // Hovered node style
          this.canaryPointCloudGroup.children[i].material.color.set( "#ffffff" );
          this.canaryPointCloudGroup.children[i].material.wireframe = true;
          this.canaryPointCloudGroup.children[i].scale.set(0.15, 0.15, 0.15);
          this.canaryPointCloudGroup.children[i].rotateX(Math.sin(this.frameId / 70)/20);
          this.canaryPointCloudGroup.children[i].rotateY(Math.sin(this.frameId / 100)/20);
          this.canaryPointCloudGroup.children[i].rotateZ(Math.sin(this.frameId / 80)/20);
          this.hoveredNodesObjs.push(this.canaryPointCloudGroup.children[i]);
        } else {
          // Default node style, from propsNodes' color
          for (let j=0; j<this.propsNodes.length; j+=1) {
            if (this.propsNodes[j].meshObj === this.canaryPointCloudGroup.children[i]) {
              this.canaryPointCloudGroup.children[i].material.color.set( this.propsNodes[j].color );
            }
          }
          this.canaryPointCloudGroup.children[i].material.wireframe = false;
          this.canaryPointCloudGroup.children[i].scale.set(0.05, 0.05, 0.05);
        }
      }

      // Render selected node
      if (this.selectedNode) {
        // Selected node style
        this.selectedNode.material.color.set( "#00ffbb" );
        this.selectedNode.material.wireframe = true;
        this.selectedNode.scale.set(0.15, 0.15, 0.15);
        this.selectedNode.rotateX(Math.sin(this.frameId / 70)/20);
        this.selectedNode.rotateY(Math.sin(this.frameId / 100)/20);
        this.selectedNode.rotateZ(Math.sin(this.frameId / 80)/20);
      }      

    }

    if (this.lights) {
      for (let i=0; i<this.lights.length; i+=1) {
        const time = -performance.now() * 0.0003;
        this.lights[i].position.x = Math.sin( time * 1.7 ) * 3 * (i+1);
        this.lights[i].position.y = Math.cos( time * 1.5 ) * 4 * (i+1);
        this.lights[i].position.z = Math.cos( time * 1.3 ) * 3 * (i+1);
      }
    }

    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);

    this.composer.render();
  }

  renderScene = () => {
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  }

  render() {
    return (
      <div
        style={{ width: "800px", height: "800px" }}
        ref={mount => {
          this.mount = mount;
        }}
      />
    );
  }

}

export default ThreeCanary;
