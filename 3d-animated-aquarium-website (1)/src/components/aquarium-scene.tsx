"use client";

import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, type Group } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { AquariumConfig } from "@/lib/catalog";
import { tankDimensions } from "@/lib/aquarium";

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Controls({ motion }: { motion: boolean }) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.enableDamping = true; c.enablePan = false; c.minDistance = 4; c.maxDistance = 12;
    c.minPolarAngle = Math.PI / 4; c.maxPolarAngle = Math.PI / 2.05;
    c.autoRotateSpeed = 0.35; c.target.set(0, -0.1, 0);
    controls.current = c;
    return () => { c.dispose(); controls.current = null; };
  }, [camera, gl]);
  useFrame(() => { if (controls.current) { controls.current.autoRotate = motion; controls.current.update(); } });
  return null;
}

function Plant({ position, index, motion, short = false }: { position: [number, number, number]; index: number; motion: boolean; short?: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => { if (group.current && motion) group.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + index) * 0.045; });
  const height = short ? 0.35 : 0.7 + (index % 4) * 0.17;
  return <group ref={group} position={position}>
    <mesh position={[0, height / 2, 0]}><cylinderGeometry args={[0.013, 0.023, height, 6]} /><meshStandardMaterial color="#547b30" roughness={0.9} /></mesh>
    {Array.from({ length: short ? 4 : 7 }, (_, j) => <mesh key={j} position={[(j % 2 ? 1 : -1) * 0.12, height * (0.2 + j * 0.1), Math.sin(j * 1.9) * 0.075]} rotation={[0.2, j * 1.7, (j % 2 ? -1 : 1) * 0.65]} scale={[short ? 0.12 : 0.15, short ? 0.22 : 0.32, 0.026]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={["#61a640", "#3d7d33", "#80b74f", "#2b663b"][j % 4]} roughness={0.65} /></mesh>)}
  </group>;
}

function SwimmingFish({ index, type, width, motion }: { index: number; type: AquariumConfig["fish"]; width: number; motion: boolean }) {
  const fish = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const phase = index * 1.45 + 0.4;
  const speed = type === "community" ? 0.38 : 0.2;
  const colour = type === "community" ? "#42c6ec" : type === "betta" ? "#f07858" : "#f5a042";
  const size = type === "community" ? 0.8 : type === "betta" ? 1.4 : 1.65;
  useFrame(({ clock }) => {
    if (!fish.current) return;
    const t = motion ? clock.elapsedTime : 3;
    const angle = t * speed + phase;
    fish.current.position.set(Math.sin(angle) * (width / 2 - 0.65), 0.03 + Math.sin(t * 0.3 + phase) * 0.55, Math.cos(t * 0.22 + phase) * 0.48);
    fish.current.rotation.y = Math.atan2(Math.sin(t * 0.22 + phase) * 0.105, Math.cos(angle) * speed * (width / 2 - 0.65));
    if (tail.current) tail.current.rotation.y = Math.sin(t * 9 + phase) * 0.4;
  });
  return <group ref={fish} scale={size}>
    <mesh scale={[0.2, 0.105, 0.075]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={colour} metalness={0.22} roughness={0.3} emissive={colour} emissiveIntensity={0.12} /></mesh>
    {type === "community" && <mesh position={[0, -0.04, 0]} scale={[0.16, 0.035, 0.076]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#f66c5e" /></mesh>}
    <group ref={tail} position={[-0.2, 0, 0]}><mesh rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.32]}><coneGeometry args={[type === "betta" ? 0.24 : 0.14, 0.2, 4]} /><meshStandardMaterial color={type === "community" ? "#92d5d7" : "#f6b586"} side={2} transparent opacity={0.8} /></mesh></group>
    <mesh position={[-0.02, 0.11, 0]} rotation={[0, 0, 0.15]} scale={[0.12, type === "betta" ? 0.14 : 0.06, 0.025]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={colour} transparent opacity={0.75} /></mesh>
    {[-1, 1].map(side => <group key={side} position={[0.12, 0.028, side * 0.061]}><mesh><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#eedfcc" /></mesh><mesh position={[0.008, 0.001, side * 0.017]}><sphereGeometry args={[0.013, 8, 8]} /><meshBasicMaterial color="#101b18" /></mesh></group>)}
  </group>;
}

function Bubble({ index, motion, width }: { index: number; motion: boolean; width: number }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) { const time = motion ? clock.elapsedTime : 2; group.current.position.y = ((time * 0.16 + index * 0.23) % 2.4) - 1.13; }
  });
  return <group ref={group} position={[Math.sin(index * 9.4) * (width / 2 - 0.2), 0, Math.cos(index * 4.6) * 0.8]}><mesh><sphereGeometry args={[0.013 + (index % 3) * 0.008, 7, 7]} /><meshStandardMaterial color="#b1e2d7" transparent opacity={0.45} roughness={0.05} metalness={0.4} /></mesh></group>;
}

function Tank({ config, motion }: { config: AquariumConfig; motion: boolean }) {
  const width = 4;
  const height = 2.6;
  const dimensions = tankDimensions(config);
  const sx = Math.max(0.5, dimensions.length / 2);
  const sy = Math.max(0.4, dimensions.height / 1.25);
  const sz = Math.max(0.5, dimensions.width);
  const fit = Math.min(1, 5.5 / (width * sx), 3.2 / (height * sy), 2.8 / (2.2 * sz));
  const glass = useMemo(() => new BoxGeometry(width, height, 2.2), [width]);
  useEffect(() => () => glass.dispose(), [glass]);
  const plants = config.style === "nature" ? 19 : config.style === "rock" ? 12 : 5;
  const fishes = config.fish === "community" ? 6 : 1;
  return <group position={[0, 0.05, 0]} scale={[sx * fit, sy * fit, sz * fit]}>
    <mesh position={[0, -1.33, 0]} receiveShadow><boxGeometry args={[width + 0.15, 0.14, 2.34]} /><meshStandardMaterial color="#243b32" metalness={0.45} roughness={0.5} /></mesh>
    <mesh position={[0, -1.16, 0]} receiveShadow><boxGeometry args={[width - 0.06, 0.23, 2.13]} /><meshStandardMaterial color={config.style === "minimal" ? "#c5b494" : "#4c5540"} roughness={1} /></mesh>
    <mesh position={[0, 0.02, 0]}><boxGeometry args={[width - 0.04, height - 0.16, 2.12]} /><meshPhysicalMaterial color="#5eab98" transparent opacity={0.055} roughness={0} depthWrite={false} /></mesh>
    <mesh position={[0, 1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width, 2.2]} /><meshStandardMaterial color="#a1d7c8" transparent opacity={0.14} metalness={0.25} roughness={0.1} side={2} depthWrite={false} /></mesh>
    <lineSegments><edgesGeometry args={[glass]} /><lineBasicMaterial color="#83ae9e" transparent opacity={0.65} /></lineSegments>
    <mesh position={[0, 0, -1.1]}><planeGeometry args={[width, height]} /><meshPhysicalMaterial color="#9bcebf" transparent opacity={0.08} side={2} depthWrite={false} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * width / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2.2, height]} /><meshPhysicalMaterial color="#c1e5d5" transparent opacity={0.07} side={2} depthWrite={false} /></mesh>)}
    {Array.from({ length: plants }, (_, i) => <Plant key={`${config.style}-${i}`} motion={motion} index={i} short={config.style === "rock" || i % 5 === 0} position={[Math.sin(i * 7.1) * (width / 2 - 0.3), -1.05, config.style === "rock" ? Math.cos(i * 2.3) * 0.8 : 0.35 + Math.sin(i * 2.3) * 0.43]} />)}
    {Array.from({ length: config.style === "rock" ? 5 : 3 }, (_, i) => <mesh key={i} position={[(i - 1.5) * 0.62, -0.82 + (i % 2) * 0.12, 0.1]} rotation={[i * 0.4, i * 0.7, i * 0.2]} scale={[0.45 + (i % 2) * 0.15, config.style === "rock" ? 0.55 + (i % 3) * 0.15 : 0.3, 0.38]} castShadow><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={i % 2 ? "#627368" : "#49594f"} roughness={1} flatShading /></mesh>)}
    {config.style === "nature" && <group position={[0.15, -0.64, 0.26]} rotation={[0, -0.4, -0.7]}><mesh castShadow><cylinderGeometry args={[0.075, 0.14, 1.7, 7]} /><meshStandardMaterial color="#695441" roughness={0.95} /></mesh><mesh position={[0.1, 0.32, 0]} rotation={[0, 0, -0.65]}><cylinderGeometry args={[0.025, 0.07, 0.8, 6]} /><meshStandardMaterial color="#695441" roughness={0.95} /></mesh></group>}
    {Array.from({ length: fishes }, (_, i) => <SwimmingFish key={`${config.fish}-${i}`} type={config.fish} index={i} width={width} motion={motion} />)}
    {Array.from({ length: 17 }, (_, i) => <Bubble key={i} index={i} width={width} motion={motion} />)}
    {config.extras.includes("light") && <><mesh position={[0, 1.48, -0.13]}><boxGeometry args={[width * 0.78, 0.075, 0.16]} /><meshStandardMaterial color="#3a4942" metalness={0.7} roughness={0.3} /></mesh><mesh position={[0, 1.43, -0.13]}><boxGeometry args={[width * 0.7, 0.01, 0.12]} /><meshBasicMaterial color="#e0f7d5" /></mesh></>}
    {config.extras.includes("filter") && <group position={[width / 2 - 0.25, 0.38, 0.8]}><mesh><boxGeometry args={[0.22, 0.66, 0.2]} /><meshStandardMaterial color="#243f33" roughness={0.6} /></mesh><mesh position={[-0.13, 0.19, -0.12]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 0.24, 8]} /><meshStandardMaterial color="#3c5847" /></mesh></group>}
  </group>;
}

export default function AquariumScene({ config, motion, reset }: { config: AquariumConfig; motion: boolean; reset: number }) {
  const fallback = <div className="scene-fallback"><img src="/images/aquarium-tank.jpg" alt="A lush aquarium preview" /><span>Your browser is showing a photo preview. Your design options still work.</span></div>;
  return <SceneBoundary fallback={fallback}><Canvas key={reset} camera={{ position: [5.5, 3.1, 6.7], fov: 37 }} dpr={[1, 1.7]} shadows gl={{ antialias: true, alpha: true }} fallback={fallback} aria-label="Interactive 3D aquarium. Drag to rotate and scroll to zoom."><ambientLight intensity={1.45} /><directionalLight position={[2, 7, 3]} intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} /><pointLight position={[-3, 3, -2]} intensity={8} color="#bfefd2" /><pointLight position={[2, 1, 4]} intensity={3} color="#ffe1ba" /><Tank config={config} motion={motion} /><Controls motion={motion} /></Canvas></SceneBoundary>;
}
