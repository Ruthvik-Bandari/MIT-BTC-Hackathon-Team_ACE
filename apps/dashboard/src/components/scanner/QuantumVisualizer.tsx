'use client';

import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { X, MousePointer } from 'lucide-react';

// -- Element definitions -------------------------------------------------------
export type ElementId = 'core' | 'ring-safe' | 'ring-medium' | 'ring-critical' | 'threats';

interface ElementInfo {
  id: ElementId; label: string; subLabel: string;
  risk: string; riskColor: string; dotColor: string;
  shortDesc: string; description: string;
  stats: { label: string; value: string }[];
  recommendation: string;
}

const ELEMENTS: Record<ElementId, ElementInfo> = {
  core: {
    id: 'core', label: 'secp256k1', subLabel: 'Elliptic Curve Core',
    risk: 'THE TARGET', riskColor: '#60A5FA', dotColor: '#3B82F6',
    shortDesc: 'Bitcoin\'s cryptographic foundation',
    description: 'Every Bitcoin private key is a 256-bit scalar on this curve. Every public key is a point. Shor\'s algorithm on a fault-tolerant quantum computer solves the ECDLP \u2014 deriving any private key from its public key \u2014 in polynomial time (~9 minutes at 500K logical qubits).',
    stats: [
      { label: 'Primitive', value: 'ECDSA + Schnorr' },
      { label: 'Key length', value: '256-bit' },
      { label: 'Quantum attack', value: 'Shor\'s algorithm' },
      { label: 'Break time', value: '\u2248 9 min @ 500K qubits' },
    ],
    recommendation: 'No direct mitigation at the curve level \u2014 your protection depends entirely on which address type holds your BTC.',
  },
  'ring-safe': {
    id: 'ring-safe', label: 'Taproot \u00b7 P2TR', subLabel: 'SAFE \u00b7 Key hidden until spend',
    risk: 'SAFE', riskColor: '#34D399', dotColor: '#10B981',
    shortDesc: 'Public key hidden until spend \u2014 safest option',
    description: 'Pay-to-Taproot (BIP-341) commits the key inside a Merkle root. The actual public key is invisible on-chain until the UTXO is spent. Even if ECDLP breaks tomorrow, unspent P2TR outputs are safe \u2014 no key to run Shor\'s algorithm against.',
    stats: [
      { label: 'Key visibility', value: 'Hidden until spend' },
      { label: 'BTC in P2TR', value: '~4.5M BTC' },
      { label: 'Risk window', value: 'Spend tx broadcast only' },
      { label: 'Adoption (2026)', value: '~30% of outputs' },
    ],
    recommendation: 'Migrate all holdings to fresh Taproot addresses. Best available protection before post-quantum cryptography arrives on Bitcoin.',
  },
  'ring-medium': {
    id: 'ring-medium', label: 'Spent P2WPKH', subLabel: 'HIGH RISK \u00b7 Key exposed post-spend',
    risk: 'HIGH RISK', riskColor: '#FBBF24', dotColor: '#F59E0B',
    shortDesc: 'Public key exposed after any spend',
    description: 'SegWit P2WPKH reveals the raw public key in the witness data when a UTXO is broadcast. Once confirmed, the key is permanently readable on-chain. Any future quantum computer can recover private keys from previously-spent addresses.',
    stats: [
      { label: 'Key visibility', value: 'Exposed post-spend' },
      { label: 'BTC at risk', value: '~1.2M BTC' },
      { label: 'Affected addresses', value: '~8.4M spent P2WPKH' },
      { label: 'Risk trigger', value: 'QC reaching 500K qubits' },
    ],
    recommendation: 'Consolidate remaining funds on previously-spent addresses into a brand-new P2TR wallet now.',
  },
  'ring-critical': {
    id: 'ring-critical', label: 'P2PK Legacy', subLabel: 'CRITICAL \u00b7 Always exposed',
    risk: 'CRITICAL', riskColor: '#F87171', dotColor: '#EF4444',
    shortDesc: 'Raw public key permanently in script \u2014 no spend needed',
    description: 'Pay-to-Public-Key embeds the raw uncompressed public key directly in the locking script. The key is readable from the moment the UTXO is created. Satoshi\'s earliest coins (~1.1M BTC) are P2PK and have not moved since 2009.',
    stats: [
      { label: 'Key visibility', value: 'Always exposed' },
      { label: 'BTC at risk', value: '~1.7M BTC' },
      { label: 'Notable holders', value: 'Genesis block, Satoshi' },
      { label: 'Risk level', value: 'Immediate on QC arrival' },
    ],
    recommendation: 'URGENT: Any P2PK output is the first target when a quantum computer arrives. Move to P2TR immediately.',
  },
  threats: {
    id: 'threats', label: 'Quantum Attacks', subLabel: 'LIVE THREAT \u00b7 Shor\'s algorithm nodes',
    risk: 'LIVE THREAT', riskColor: '#F87171', dotColor: '#EF4444',
    shortDesc: 'Simulated qubit clusters running Shor\'s algorithm',
    description: 'Each red node represents a logical qubit cluster executing Shor\'s algorithm against an exposed secp256k1 public key. Google\'s Willow chip (March 2026) demonstrated error correction below the fault-tolerance threshold \u2014 confirming the exponential scaling path to cryptographically-relevant quantum computers.',
    stats: [
      { label: 'Current record', value: '~105 physical qubits' },
      { label: 'Fault-tol. threshold', value: 'Crossed (Willow 2026)' },
      { label: 'Required for Bitcoin', value: '500K logical qubits' },
      { label: 'Industry estimate', value: '5\u201315 years' },
    ],
    recommendation: 'Don\'t wait. A sudden quantum announcement will trigger a chain-wide panic. Migrations that take months become impossible in hours.',
  },
};

// -- Electric Arc ---------------------------------------------------------------
const ARC_SEGMENTS = 24;

function ElectricArc({ to, phaseOffset, active }: {
  to: [number, number, number]; phaseOffset: number; active: boolean;
}) {
  const arcLine = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array((ARC_SEGMENTS + 1) * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.LineBasicMaterial({
      color: '#93C5FD', transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phaseOffset;
    const mat = arcLine.material as THREE.LineBasicMaterial;
    mat.opacity = active
      ? 0.25 + Math.abs(Math.sin(t * 18 + phaseOffset)) * 0.55
      : 0.05 + Math.abs(Math.sin(t * 4)) * 0.05;

    const fromV = new THREE.Vector3(0, 0, 0);
    const toV = new THREE.Vector3(...to);
    const attr = arcLine.geometry.attributes['position'] as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;

    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const frac = i / ARC_SEGMENTS;
      const p = fromV.clone().lerp(toV, frac);
      const envelope = Math.sin(frac * Math.PI);
      const lo = Math.sin(t * 2.5 + i * 0.8) * 0.18;
      const hi = Math.sin(t * 22 + i * 4.1 + phaseOffset) * 0.055;
      const perturb = (lo + hi) * envelope;
      p.x += perturb * Math.cos(i * 1.7 + phaseOffset);
      p.y += perturb * Math.sin(i * 2.3 + phaseOffset * 0.7);
      p.z += perturb * Math.cos(i * 3.1 + phaseOffset * 1.3);
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    }
    attr.needsUpdate = true;
  });

  return <primitive object={arcLine} />;
}

// -- Pulse Ring -----------------------------------------------------------------
function PulseRing({ phaseOffset }: { phaseOffset: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = ((state.clock.elapsedTime + phaseOffset) % 2.4) / 2.4;
    if (meshRef.current && matRef.current) {
      meshRef.current.scale.setScalar(0.6 + t * 3.4);
      matRef.current.opacity = (1 - t) * 0.55;
    }
  });

  return (
    <mesh ref={meshRef} rotation-x={Math.PI / 2}>
      <ringGeometry args={[0.88, 0.96, 80]} />
      <meshBasicMaterial
        ref={matRef} color="#3B82F6" transparent opacity={0.5}
        side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false}
      />
    </mesh>
  );
}

// -- Nebula cloud ---------------------------------------------------------------
function Nebula() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#0D1B3E', transparent: true, opacity: 0.25,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  return (
    <mesh>
      <sphereGeometry args={[40, 12, 12]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// -- Floating label -------------------------------------------------------------
function FloatingLabel({ position, label, subLabel, color, visible }: {
  position: [number, number, number]; label: string; subLabel: string;
  color: string; visible: boolean;
}) {
  return (
    <Html position={position} center distanceFactor={5} occlude={false} style={{ pointerEvents: 'none' }}>
      <div style={{
        opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease',
        background: 'rgba(9,14,30,0.88)', border: `1px solid ${color}50`,
        borderLeft: `2px solid ${color}`, borderRadius: '6px',
        padding: '5px 10px', whiteSpace: 'nowrap', boxShadow: `0 0 16px ${color}30`,
      }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color, letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ fontSize: '8px', color: '#94A3B8', marginTop: '1px' }}>{subLabel}</div>
      </div>
    </Html>
  );
}

// -- Background deselect --------------------------------------------------------
function Background({ onDeselect }: { onDeselect: () => void }) {
  return (
    <mesh onClick={onDeselect}>
      <sphereGeometry args={[25, 8, 8]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} />
    </mesh>
  );
}

// -- Quantum Core ---------------------------------------------------------------
function QuantumCore({ selected, dimmed, hovered, onClick, onPointerOver, onPointerOut }: {
  selected: boolean; dimmed: boolean; hovered: boolean;
  onClick: () => void; onPointerOver: () => void; onPointerOut: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  const solidMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1D4ED8', emissive: '#2563EB', emissiveIntensity: 0.8,
    metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.9,
  }), []);
  const wireMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#34D399', emissive: '#10B981', emissiveIntensity: 1.2,
    wireframe: true, transparent: true, opacity: 0.5,
  }), []);
  const coronaMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#3B82F6', transparent: true, opacity: 0.06,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.7, 2), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.28;
      meshRef.current.rotation.y = t * 0.45;
      const ts = selected ? 1.18 : hovered ? 1.08 : 1;
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, ts, delta * 6));
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = -t * 0.18;
      wireRef.current.rotation.y = t * 0.38;
    }
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1.6 + Math.sin(t * 1.2) * 0.12);
    }
    solidMat.opacity = THREE.MathUtils.lerp(solidMat.opacity, dimmed ? 0.12 : selected ? 0.35 : 0.9, delta * 5);
    solidMat.emissiveIntensity = THREE.MathUtils.lerp(solidMat.emissiveIntensity, selected ? 3 : 0.8, delta * 5);
    wireMat.opacity = THREE.MathUtils.lerp(wireMat.opacity, dimmed ? 0.04 : selected ? 0.9 : 0.5, delta * 5);
    wireMat.emissiveIntensity = THREE.MathUtils.lerp(wireMat.emissiveIntensity, selected ? 4 : 1.2, delta * 5);
    coronaMat.opacity = THREE.MathUtils.lerp(coronaMat.opacity, dimmed ? 0.01 : selected ? 0.18 : 0.06, delta * 4);
  });

  return (
    <group>
      <mesh ref={coronaRef}>
        <sphereGeometry args={[0.75, 16, 16]} />
        <primitive object={coronaMat} attach="material" />
      </mesh>
      <mesh ref={meshRef} geometry={geo} material={solidMat}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); }}
        onPointerOut={onPointerOut}
      />
      <mesh ref={wireRef} geometry={geo} material={wireMat} scale={1.08} />
      {selected && (
        <>
          <Html position={[0, 0.3, 0.2]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
            <div style={{ fontSize: '9px', color: '#93C5FD', fontWeight: 700, textShadow: '0 0 12px #3B82F6', whiteSpace: 'nowrap' }}>
              P = k \u00b7 G
            </div>
          </Html>
          <Html position={[0.4, -0.1, 0.3]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
            <div style={{ fontSize: '8px', color: '#6EE7B7', fontWeight: 600, textShadow: '0 0 10px #10B981', whiteSpace: 'nowrap' }}>
              G (generator)
            </div>
          </Html>
          <Html position={[-0.35, 0.15, -0.3]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
            <div style={{ fontSize: '8px', color: '#FDE68A', fontWeight: 600, textShadow: '0 0 10px #F59E0B', whiteSpace: 'nowrap' }}>
              k (private key)
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

// -- Particle Ring --------------------------------------------------------------
function ParticleRing({ radius, count, color, speed, selected, dimmed, hovered,
  labelPos, labelText, labelSub, onClick, onPointerOver, onPointerOut }: {
  radius: number; count: number; color: string; speed: number;
  selected: boolean; dimmed: boolean; hovered: boolean;
  labelPos: [number, number, number]; labelText: string; labelSub: string;
  onClick: () => void; onPointerOver: () => void; onPointerOut: () => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const s = (Math.random() - 0.5) * 0.2;
      arr[i * 3] = Math.cos(a) * (radius + s);
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.25;
      arr[i * 3 + 2] = Math.sin(a) * (radius + s);
    }
    return arr;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * speed;
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, dimmed ? 0.06 : selected ? 1.0 : hovered ? 0.9 : 0.7, delta * 6);
    mat.size = THREE.MathUtils.lerp(mat.size, selected ? 0.075 : 0.042, delta * 6);
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.042} transparent opacity={0.7}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <mesh rotation-x={Math.PI / 2}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); }}
        onPointerOut={onPointerOut}>
        <torusGeometry args={[radius, 0.3, 8, 80]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <FloatingLabel position={labelPos} label={labelText} subLabel={labelSub} color={color} visible={!dimmed} />
      <Line points={[labelPos, [Math.cos(-0.4) * radius, 0.08, Math.sin(-0.4) * radius]]}
        color={color} lineWidth={0.5} transparent opacity={dimmed ? 0.04 : 0.25} />
    </group>
  );
}

// -- Threat Spheres -------------------------------------------------------------
const THREAT_POSITIONS: [number, number, number][] = [
  [1.05, 0.35, 0.85], [-1.25, -0.2, 0.5], [0.6, 1.0, -1.05],
  [-0.8, 0.55, -1.15], [1.4, -0.6, -0.3], [-0.4, -0.9, 1.0],
];

function SphereBob({ position, offset, selected, dimmed }: {
  position: [number, number, number]; offset: number; selected: boolean; dimmed: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#DC2626', emissive: '#EF4444', emissiveIntensity: 2.5,
    transparent: true, opacity: 0.95,
  }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime + offset;
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * 0.9) * 0.14;
      ref.current.rotation.y = t * 0.8;
      ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, selected ? 1.6 : 1.0, delta * 5));
    }
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, dimmed ? 0.08 : 0.95, delta * 5);
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, selected ? 5 : 2.5, delta * 5);
  });

  return <mesh ref={ref} position={position} material={mat}><sphereGeometry args={[0.085, 10, 10]} /></mesh>;
}

function ThreatSpheres({ selected, dimmed, onClick, onPointerOver, onPointerOut }: {
  selected: boolean; dimmed: boolean; hovered: boolean;
  onClick: () => void; onPointerOver: () => void; onPointerOut: () => void;
}) {
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); }}
      onPointerOut={onPointerOut}>
      {THREAT_POSITIONS.map((pos, i) => (
        <SphereBob key={i} position={pos} offset={i * 1.1} selected={selected} dimmed={dimmed} />
      ))}
      <FloatingLabel position={[1.8, -1.55, 0]} label="Quantum Attacks"
        subLabel="Shor's algorithm \u00b7 LIVE THREAT" color="#F87171" visible={!dimmed} />
    </group>
  );
}

// -- Main Scene -----------------------------------------------------------------
function Scene({ selectedId, hoveredId, onSelect, onHover }: {
  selectedId: ElementId | null; hoveredId: ElementId | null;
  onSelect: (id: ElementId | null) => void; onHover: (id: ElementId | null) => void;
}) {
  const isDimmed = (id: ElementId) => selectedId !== null && selectedId !== id;

  return (
    <>
      <color attach="background" args={['#040C1B']} />
      <fog attach="fog" args={['#040C1B', 18, 45]} />
      <Stars radius={90} depth={60} count={5000} factor={4} saturation={0.25} fade speed={0.3} />
      <Stars radius={30} depth={20} count={800} factor={2} saturation={0.1} fade speed={0.1} />
      <Nebula />

      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={3} color="#3B82F6" />
      <pointLight position={[-5, -4, -5]} intensity={1.5} color="#10B981" />
      <pointLight position={[0, 6, -3]} intensity={0.8} color="#8B5CF6" />
      <pointLight position={[0, -5, 3]} intensity={0.5} color="#EF4444" />

      <Background onDeselect={() => onSelect(null)} />

      <FloatingLabel position={[0, 1.45, 0]} label="secp256k1"
        subLabel="Elliptic Curve \u00b7 THE TARGET" color="#60A5FA" visible={!isDimmed('core')} />
      <Line points={[[0, 1.25, 0], [0, 0.82, 0]]} color="#60A5FA" lineWidth={0.5}
        transparent opacity={isDimmed('core') ? 0.02 : 0.35} />

      <QuantumCore selected={selectedId === 'core'} dimmed={isDimmed('core')}
        hovered={hoveredId === 'core'} onClick={() => onSelect('core')}
        onPointerOver={() => onHover('core')} onPointerOut={() => onHover(null)} />

      <PulseRing phaseOffset={0} />
      <PulseRing phaseOffset={0.8} />
      <PulseRing phaseOffset={1.6} />

      <ParticleRing radius={1.4} count={100} color="#34D399" speed={0.38}
        selected={selectedId === 'ring-safe'} dimmed={isDimmed('ring-safe')} hovered={hoveredId === 'ring-safe'}
        labelPos={[2.0, 0.65, 0]} labelText="Taproot \u00b7 P2TR" labelSub="SAFE \u00b7 Key hidden until spend"
        onClick={() => onSelect('ring-safe')}
        onPointerOver={() => onHover('ring-safe')} onPointerOut={() => onHover(null)} />

      <ParticleRing radius={1.95} count={75} color="#FBBF24" speed={-0.22}
        selected={selectedId === 'ring-medium'} dimmed={isDimmed('ring-medium')} hovered={hoveredId === 'ring-medium'}
        labelPos={[2.65, 0.35, 0]} labelText="Spent P2WPKH" labelSub="HIGH RISK \u00b7 Exposed after spend"
        onClick={() => onSelect('ring-medium')}
        onPointerOver={() => onHover('ring-medium')} onPointerOut={() => onHover(null)} />

      <ParticleRing radius={2.55} count={50} color="#F87171" speed={0.14}
        selected={selectedId === 'ring-critical'} dimmed={isDimmed('ring-critical')} hovered={hoveredId === 'ring-critical'}
        labelPos={[3.35, 0.05, 0]} labelText="P2PK Legacy" labelSub="CRITICAL \u00b7 Always exposed"
        onClick={() => onSelect('ring-critical')}
        onPointerOver={() => onHover('ring-critical')} onPointerOut={() => onHover(null)} />

      {THREAT_POSITIONS.map((pos, i) => (
        <ElectricArc key={i} to={pos} phaseOffset={i * 1.05}
          active={selectedId === 'threats' || selectedId === 'core'} />
      ))}

      <ThreatSpheres selected={selectedId === 'threats'} dimmed={isDimmed('threats')}
        hovered={hoveredId === 'threats'} onClick={() => onSelect('threats')}
        onPointerOver={() => onHover('threats')} onPointerOut={() => onHover(null)} />

      <OrbitControls autoRotate={selectedId === null} autoRotateSpeed={0.4}
        enableDamping dampingFactor={0.05} minDistance={2.5} maxDistance={12} enablePan={false} />

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.08} luminanceSmoothing={0.92} intensity={2.8} />
      </EffectComposer>
    </>
  );
}

// -- Info Panel -----------------------------------------------------------------
function InfoPanel({ elementId, onClose }: { elementId: ElementId; onClose: () => void }) {
  const info = ELEMENTS[elementId];
  return (
    <div className="mt-4 rounded-2xl border p-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        background: 'rgba(9,14,30,0.97)',
        borderColor: `${info.riskColor}40`,
        boxShadow: `0 0 40px ${info.riskColor}12, 0 8px 32px rgba(0,0,0,0.5)`,
      }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-widest"
            style={{ color: info.riskColor, borderColor: `${info.riskColor}40`, background: `${info.riskColor}14` }}>
            {info.risk}
          </span>
          <h4 className="text-base font-bold text-foreground mt-1.5">{info.label}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{info.shortDesc}</p>
        </div>
        <button type="button" aria-label="Close info panel" onClick={onClose}
          className="p-1.5 rounded-lg bg-muted/40 border border-border text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4 border-l-2 pl-3"
        style={{ borderColor: `${info.riskColor}55` }}>
        {info.description}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {info.stats.map(({ label, value }) => (
          <div key={label} className="p-2.5 bg-muted/30 rounded-xl border border-border">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">{label}</div>
            <div className="text-xs font-semibold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl"
        style={{ background: `${info.riskColor}0e`, border: `1px solid ${info.riskColor}25` }}>
        <p className="text-xs leading-relaxed" style={{ color: info.riskColor }}>
          {info.recommendation}
        </p>
      </div>
    </div>
  );
}

// -- Element Selector -----------------------------------------------------------
function ElementSelector({ onSelect }: { onSelect: (id: ElementId) => void }) {
  const items: { id: ElementId; color: string }[] = [
    { id: 'core', color: '#60A5FA' },
    { id: 'ring-safe', color: '#34D399' },
    { id: 'ring-medium', color: '#FBBF24' },
    { id: 'ring-critical', color: '#F87171' },
    { id: 'threats', color: '#F87171' },
  ];

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-3 text-[10px] text-muted-foreground uppercase tracking-widest">
        <MousePointer className="w-3 h-3" />
        Drag to rotate &middot; scroll to zoom &middot; click an element
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(({ id, color }) => {
          const info = ELEMENTS[id];
          return (
            <button key={id} type="button" onClick={() => onSelect(id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200 hover:shadow-lg"
              style={{ background: `${color}10`, borderColor: `${color}30`, color }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              {info.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -- Export ---------------------------------------------------------------------
export function QuantumVisualizer() {
  const [selectedId, setSelectedId] = useState<ElementId | null>(null);
  const [hoveredId, setHoveredId] = useState<ElementId | null>(null);

  return (
    <div>
      <div className="w-full overflow-hidden rounded-2xl border border-border" style={{ height: '380px' }}>
        <Canvas
          camera={{ position: [0, 1.2, 6], fov: 42 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          style={{ cursor: hoveredId ? 'pointer' : 'default' }}
        >
          <Scene selectedId={selectedId} hoveredId={hoveredId}
            onSelect={setSelectedId} onHover={setHoveredId} />
        </Canvas>
      </div>

      {selectedId
        ? <InfoPanel elementId={selectedId} onClose={() => setSelectedId(null)} />
        : <ElementSelector onSelect={setSelectedId} />}
    </div>
  );
}
