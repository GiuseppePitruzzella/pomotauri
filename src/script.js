import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { Color } from "Color";
import { Scene } from "Scene";
import { PerspectiveCamera } from "PerspectiveCamera";
import { WebGLRenderer } from "WebGLRenderer";
import { RGBELoader } from "RGBELoader";
import { EffectComposer } from "EffectComposer";
import { RenderPass } from "RenderPass";
import { UnrealBloomPass } from "UnrealBloomPass";
import { BoxGeometry, CylinderGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, RingGeometry, Vector2, Vector3, Matrix4, Euler } from "three";

const scene = new Scene();
scene.background = new Color("black");

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 15);

const renderer = new WebGLRenderer({ antialias: true, alpha: true, autoSize: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEnconding;
document.body.appendChild(renderer.domElement);

const renderScene = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    0.5,
    0.1,
    0.1
);
composer.addPass(bloomPass);

let controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableZoom = false;

let pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

let mousePosition = new Vector2(0, 0);
window.addEventListener("mousemove", (e) => {
    let x = e.clientX - innerWidth * 0.5;
    let y = e.clientY - innerHeight * 0.5;

    mousePosition.x = x * 0.001;
    mousePosition.y = y * 0.001;
});

(async function init() {
    let envHdrTexture = await new RGBELoader().loadAsync("../assets/cannon_1k_blurred.hdr");
    let envRT = pmrem.fromEquirectangular(envHdrTexture);

    let outerRing = customRing(envRT, 0.2, new Color(0xFBF0E7)); 
    scene.add(outerRing);

    let innerRing = customRing(envRT, 0.1, new Color(0xF78E69));
    innerRing.scale.set(0.90, 0.90);
    scene.add(innerRing);
    
    let clockCylinder = customRing(envRT, 0.1, new Color(0xFBF0E7));
    clockCylinder.scale.set(0.80, 0.80);
    scene.add(clockCylinder);

    let hoursLine = customLines(0.8, 0.03, 0.05, envRT, 0xFBF0E7, 1);
    scene.add(hoursLine);

    let minutesLine = customLines(1, 0.03, 0.05, envRT, 0xFBF0E7, 1);
    scene.add(minutesLine);

    let secondsLine = customLines(1, 0.01, 0.05, envRT, 0xF78E69, 1);
    scene.add(secondsLine);

    renderer.setAnimationLoop(() => {
        clockCylinder.rotation.x = clockCylinder.rotation.x * 0.95 + (mousePosition.y * 1.2) * 0.05;
        clockCylinder.rotation.y = clockCylinder.rotation.y * 0.95 + (mousePosition.x * 1.2) * 0.05;

        hoursLine.rotation.x = hoursLine.rotation.x * 0.95 + (mousePosition.y * 1.2) * 0.05;
        hoursLine.rotation.y = hoursLine.rotation.y * 0.95 + (mousePosition.x * 1.2) * 0.05;

        minutesLine.rotation.x = minutesLine.rotation.x * 0.95 + (mousePosition.y * 1.2) * 0.05;
        minutesLine.rotation.y = minutesLine.rotation.y * 0.95 + (mousePosition.x * 1.2) * 0.05;

        secondsLine.rotation.x = secondsLine.rotation.x * 0.95 + (mousePosition.y * 1.2) * 0.05;
        secondsLine.rotation.y = secondsLine.rotation.y * 0.95 + (mousePosition.x * 1.2) * 0.05;

        outerRing.rotation.x = outerRing.rotation.x * 0.95 + (mousePosition.y * 0.4) * 0.05;
        outerRing.rotation.y = outerRing.rotation.y * 0.95 + (mousePosition.x * 0.4) * 0.05;
        
        innerRing.rotation.x = innerRing.rotation.y * 0.95 + (-mousePosition.x * 0.3) * 0.05;
        innerRing.rotation.y = innerRing.rotation.x * 0.95 + (-mousePosition.y * 0.3) * 0.05;

        let date = new Date();
        
        let hourAngle = date.getHours() / 12 * Math.PI * 2;
        rotateLine(hoursLine, hourAngle, clockCylinder.rotation, 1.0, 0);
    
        let minutesAngle = date.getMinutes() / 60 * Math.PI * 2;
        rotateLine(minutesLine, minutesAngle, clockCylinder.rotation, 0.8, 0.1);
    
        let secondsAngle = (date.getSeconds() + date.getMilliseconds() / 1000) / 60 * Math.PI * 2;
        rotateLine(secondsLine, secondsAngle, clockCylinder.rotation, 0.75, -0.1);

        controls.update();
        // renderer.render(scene, camera);
        composer.render();
    })
})();

function rotateLine(line, angle, ringRotation, topTranslation, depthTranslation) {
    let tmatrix  = new Matrix4().makeTranslation(0, topTranslation, depthTranslation);
    let rmatrix  = new Matrix4().makeRotationAxis(new Vector3(0, 0, 1), -angle);
    let r1matrix = new Matrix4().makeRotationFromEuler(new Euler().copy(ringRotation));
  
    line.matrix.copy(new Matrix4().multiply(r1matrix).multiply(rmatrix).multiply(tmatrix));
    line.matrixAutoUpdate = false;
    line.matrixWorldNeedsUpdate = false;
}

function customRing(envRT, thickness, color) {
    let frontRing = new Mesh(
        new RingGeometry(2, 2 + thickness, 70),
        new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
    );
    frontRing.position.set(0, 0, 0.5 * 0.25);

    let backRing = new Mesh(
        new RingGeometry(2, 2 + thickness, 70),
        new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
    );
    backRing.position.set(0, 0, -1 * 0.5 * 0.25);

    let outerCylinder = new Mesh(
        new CylinderGeometry(2 + thickness, 2 + thickness, 0.25, 70, 1, true),
        new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
    );
    outerCylinder.rotation.x = Math.PI * 0.5;

    let innerCylinder = new Mesh(
        new CylinderGeometry(2, 2, 0.25, 140, 1, true),
        new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
    );
    innerCylinder.rotation.x = Math.PI * 0.5;

    let group = new Group();
    group.add(frontRing, backRing, outerCylinder, innerCylinder);

    return group;
}

function customLines(height, width, depth, envRT, color, envMapIntensity) {
    let box = new Mesh(
        new BoxGeometry(width, height, depth),
        new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
    );
    box.position.set(0, 0, 0);

    let topCap = new Mesh(
        new CylinderGeometry(width * 0.5, width * 0.5, depth, 10),
        new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
    );
    topCap.rotation.x = Math.PI * 0.5;
    topCap.position.set(0, height * 0.5, 0);

    let bottomCap = new Mesh(
        new CylinderGeometry(width * 0.5, width * 0.5, depth, 10),
        new MeshStandardMaterial({ envMap: envRT.texture, roughness: 0, metalness: 1, side: DoubleSide, color, envMapIntensity: 1 })
    );
    bottomCap.rotation.x = Math.PI * 0.5;
    bottomCap.position.set(0, -height * 0.5, 0);

    let group = new Group();
    group.add(box, topCap, bottomCap);

    return group;
}