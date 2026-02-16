"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Stars } from "@react-three/drei";
import * as THREE from "three";

// Wojak character - positioned at edges
function Wojak({
  position,
  scale = 1,
  emotion = "neutral",
}: {
  position: [number, number, number];
  scale?: number;
  emotion?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  const faceColor =
    emotion === "happy" ? "#FFE4B5" : emotion === "sad" ? "#DDD5C0" : "#FFECD2";

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Head */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.15, 0.1, 0.4]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.15, 0.1, 0.4]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Eyebrows - sad angle */}
      <mesh
        position={[-0.15, 0.25, 0.42]}
        rotation={[0, 0, emotion === "sad" ? 0.3 : -0.2]}
      >
        <boxGeometry args={[0.15, 0.03, 0.02]} />
        <meshStandardMaterial color="#4A3728" />
      </mesh>
      <mesh
        position={[0.15, 0.25, 0.42]}
        rotation={[0, 0, emotion === "sad" ? -0.3 : 0.2]}
      >
        <boxGeometry args={[0.15, 0.03, 0.02]} />
        <meshStandardMaterial color="#4A3728" />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, -0.15, 0.45]}>
        <torusGeometry
          args={[0.08, 0.02, 8, 16, emotion === "sad" ? Math.PI : -Math.PI]}
        />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

// Pepe the Frog
function Pepe({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
      groupRef.current.position.y =
        position[1] + Math.cos(state.clock.elapsedTime * 1.2) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Wide frog head - flattened sphere */}
      <mesh scale={[1.2, 0.9, 0.8]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#68a34d" />
      </mesh>

      {/* Pepe's distinctive wide cheeks/jowls */}
      <mesh position={[-0.35, -0.15, 0.2]} scale={[0.8, 0.6, 0.6]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#68a34d" />
      </mesh>
      <mesh position={[0.35, -0.15, 0.2]} scale={[0.8, 0.6, 0.6]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#68a34d" />
      </mesh>

      {/* Big bulging eyes - white part, positioned high on head */}
      <mesh position={[-0.22, 0.2, 0.32]} scale={[1, 1.3, 0.8]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.22, 0.2, 0.32]} scale={[1, 1.3, 0.8]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Black pupils - small and looking to the side (sad/smug look) */}
      <mesh position={[-0.18, 0.18, 0.45]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.26, 0.18, 0.45]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Heavy eyelids - droopy Pepe look */}
      <mesh
        position={[-0.22, 0.32, 0.35]}
        rotation={[0.3, 0, 0.1]}
        scale={[1.2, 0.3, 0.5]}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#4d7a3a" />
      </mesh>
      <mesh
        position={[0.22, 0.32, 0.35]}
        rotation={[0.3, 0, -0.1]}
        scale={[1.2, 0.3, 0.5]}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#4d7a3a" />
      </mesh>

      {/* Iconic wide Pepe mouth/lips - red lips */}
      <mesh position={[0, -0.2, 0.4]} scale={[1.5, 0.4, 0.5]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#c44536" />
      </mesh>

      {/* Mouth line/crease */}
      <mesh position={[0, -0.18, 0.52]} scale={[1.2, 0.08, 0.1]}>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial color="#8b2e21" />
      </mesh>

      {/* Chin/throat area - lighter green */}
      <mesh position={[0, -0.4, 0.15]} scale={[1, 0.7, 0.8]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#7ab664" />
      </mesh>
    </group>
  );
}

// Doge - Shiba Inu
function Doge({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.7) * 0.15;
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime + 1) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Main fluffy head - slightly elongated */}
      <mesh scale={[1, 1.1, 0.9]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#d4a853" />
      </mesh>

      {/* Fluffy cheeks - tan/cream color like actual doge */}
      <mesh position={[-0.35, -0.05, 0.15]} scale={[0.7, 0.8, 0.6]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#f0dba8" />
      </mesh>
      <mesh position={[0.35, -0.05, 0.15]} scale={[0.7, 0.8, 0.6]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#f0dba8" />
      </mesh>

      {/* Cream colored face marking */}
      <mesh position={[0, 0, 0.35]} scale={[0.7, 0.9, 0.5]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#f5e6c3" />
      </mesh>

      {/* Snout - cream/white */}
      <mesh position={[0, -0.15, 0.45]} scale={[0.8, 0.6, 0.7]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#fff5e6" />
      </mesh>

      {/* Black nose */}
      <mesh position={[0, -0.08, 0.6]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Eyes - the iconic skeptical doge look, slightly squinting */}
      {/* Left eye white */}
      <mesh position={[-0.15, 0.15, 0.4]} scale={[0.9, 0.7, 0.6]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Right eye white - slightly more open for asymmetric skeptical look */}
      <mesh position={[0.15, 0.15, 0.4]} scale={[0.9, 0.8, 0.6]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Eye shine/reflection - that doge look */}
      <mesh position={[-0.13, 0.17, 0.45]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.17, 0.17, 0.45]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Eyebrows - raised skeptical look */}
      <mesh
        position={[-0.15, 0.28, 0.38]}
        rotation={[0, 0, 0.2]}
        scale={[1, 0.4, 0.5]}
      >
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#b8923e" />
      </mesh>
      <mesh
        position={[0.15, 0.3, 0.38]}
        rotation={[0, 0, -0.3]}
        scale={[1, 0.4, 0.5]}
      >
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#b8923e" />
      </mesh>

      {/* Pointed Shiba ears - triangular */}
      <mesh position={[-0.32, 0.45, -0.05]} rotation={[0.2, 0.3, -0.3]}>
        <coneGeometry args={[0.15, 0.4, 3]} />
        <meshStandardMaterial color="#c9943f" />
      </mesh>
      <mesh position={[0.32, 0.45, -0.05]} rotation={[0.2, -0.3, 0.3]}>
        <coneGeometry args={[0.15, 0.4, 3]} />
        <meshStandardMaterial color="#c9943f" />
      </mesh>

      {/* Inner ear - pink */}
      <mesh
        position={[-0.3, 0.42, 0]}
        rotation={[0.3, 0.3, -0.3]}
        scale={[0.6, 0.6, 0.6]}
      >
        <coneGeometry args={[0.1, 0.25, 3]} />
        <meshStandardMaterial color="#e8a0a0" />
      </mesh>
      <mesh
        position={[0.3, 0.42, 0]}
        rotation={[0.3, -0.3, 0.3]}
        scale={[0.6, 0.6, 0.6]}
      >
        <coneGeometry args={[0.1, 0.25, 3]} />
        <meshStandardMaterial color="#e8a0a0" />
      </mesh>

      {/* Small smile line */}
      <mesh position={[0, -0.22, 0.5]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
    </group>
  );
}

// Chad face
function Chad({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Strong jaw head */}
      <mesh>
        <boxGeometry args={[0.7, 0.9, 0.5]} />
        <meshStandardMaterial color="#DEB887" />
      </mesh>
      {/* Chin */}
      <mesh position={[0, -0.5, 0.1]}>
        <boxGeometry args={[0.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#DEB887" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.15, 0.15, 0.26]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#3498db" />
      </mesh>
      <mesh position={[0.15, 0.15, 0.26]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#3498db" />
      </mesh>
      {/* Beard */}
      <mesh position={[0, -0.25, 0.2]}>
        <boxGeometry args={[0.5, 0.4, 0.2]} />
        <meshStandardMaterial color="#4A3728" />
      </mesh>
    </group>
  );
}

// Floating crypto coin
function CryptoCoin({
  position,
  color,
  symbol,
}: {
  position: [number, number, number];
  color: string;
  symbol: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y =
        initialY + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <mesh ref={meshRef}>
          <cylinderGeometry args={[0.3, 0.3, 0.08, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.15}
          color="#fff"
          anchorX="center"
          anchorY="middle"
        >
          {symbol}
        </Text>
      </group>
    </Float>
  );
}

// Rocket ship (to the moon!)
function Rocket({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, 0, 0.3]}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.15, 0.5, 8, 16]} />
        <meshStandardMaterial color="#E0E0E0" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.15, 0.25, 16]} />
        <meshStandardMaterial color="#F44336" />
      </mesh>
      {/* Fins */}
      <mesh position={[-0.2, -0.2, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial color="#F44336" />
      </mesh>
      <mesh position={[0.2, -0.2, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial color="#F44336" />
      </mesh>
      {/* Flame */}
      <mesh position={[0, -0.45, 0]}>
        <coneGeometry args={[0.1, 0.3, 16]} />
        <meshStandardMaterial
          color="#FF9800"
          emissive="#FF5722"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

// Floating meme text
function MemeText({
  position,
  text,
  color = "#FFD700",
}: {
  position: [number, number, number];
  text: string;
  color?: string;
}) {
  const textRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (textRef.current) {
      textRef.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <Text
        ref={textRef}
        position={position}
        fontSize={0.25}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {text}
      </Text>
    </Float>
  );
}

// Chart line going up
function MoonChart({ position }: { position: [number, number, number] }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      pts.push(
        new THREE.Vector3(
          i * 0.1 - 1,
          Math.pow(i / 10, 2) * 0.5 + Math.random() * 0.1,
          0,
        ),
      );
    }
    return pts;
  }, []);

  const lineGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points],
  );

  return (
    <group position={position}>
      <primitive
        object={
          new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({ color: "#00FF00" }),
          )
        }
      />
    </group>
  );
}

// Diamond hands
function DiamondHands({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial
          color="#00BFFF"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

// Moon
function Moon({ position }: { position: [number, number, number] }) {
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (moonRef.current) {
      moonRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={moonRef} position={position}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial
        color="#F5F5DC"
        emissive="#FFFACD"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// Main scene component
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#FFD700" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00FF00" />
      <spotLight position={[0, 10, 0]} intensity={0.8} color="#fff" />

      {/* Background stars */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Moon in the background - top right corner */}
      <Moon position={[7, 5, -10]} />

      {/* Rocket to the moon! */}
      <Rocket position={[0, 9, -5]} />

      <CryptoCoin position={[-9, 4, -2]} color="#F7931A" symbol="₿" />
      <CryptoCoin position={[9, 3.5, -2.5]} color="#627EEA" symbol="Ξ" />
      <CryptoCoin position={[-8.5, -4, -2]} color="#C2A633" symbol="Ð" />
      <CryptoCoin position={[8.5, -3.5, -2.5]} color="#26A17B" symbol="$" />
      <CryptoCoin position={[0, -8.5, -3]} color="#FF0000" symbol="🔥" />
      <CryptoCoin position={[-10, 1, -2]} color="#9945FF" symbol="◎" />
      <CryptoCoin position={[10, 0.5, -2]} color="#2775CA" symbol="Ⓜ" />
      <CryptoCoin position={[-3, 8.5, -3]} color="#F0B90B" symbol="B" />
      <CryptoCoin position={[3, -8.5, -3]} color="#E84142" symbol="A" />

      <MemeText position={[-9, 1.5, -1.5]} text="HODL" color="#FFD700" />
      <MemeText position={[9, -0.5, -1.5]} text="WAGMI" color="#00FF00" />
      <MemeText position={[-5, -7.5, -2]} text="GG" color="#FF6B6B" />
      <MemeText position={[5, 7.5, -2]} text="TO THE MOON" color="#87CEEB" />
      <MemeText position={[1, 8.5, -4]} text="🚀" color="#fff" />
      <MemeText position={[-9.5, -1, -1.5]} text="NGMI" color="#FF4444" />
      <MemeText position={[9.5, 2, -1.5]} text="GM" color="#90EE90" />
      <MemeText position={[-5, 7.8, -2]} text="LFG" color="#FF69B4" />
      <MemeText position={[5, -7.8, -2]} text="PUMP IT" color="#FFD700" />

      <MoonChart position={[-9, 3.5, -3]} />
      <MoonChart position={[8, -6.5, -3]} />
      <MoonChart position={[8, 6, -3]} />
      <MoonChart position={[-8, -6, -3]} />

      <DiamondHands position={[9, 6.5, -2]} />
      <DiamondHands position={[-8, 7.5, -3]} />
      <DiamondHands position={[0, -7.5, -2]} />
      <DiamondHands position={[-9.5, -3, -2]} />
      <DiamondHands position={[9.5, -2.5, -2]} />
      <DiamondHands position={[3, 8, -3]} />
      <DiamondHands position={[-3, -8, -3]} />
    </>
  );
}

export default function MemeBackground() {
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{
          background:
            "linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)",
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
