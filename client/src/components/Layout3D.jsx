import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    Grid,
    Html,
    RoundedBox,
    Edges,
    ContactShadows,
    Environment,
    PerspectiveCamera
} from "@react-three/drei";
import DeviceCard3DView from "./DeviceCard3DView.jsx";



const TYPE_STYLE = {
    MegapackXL: {
        light: { top: "#f2f2f2", front: "#e0e0e0", side: "#cfcfcf" },
        dark: { top: "#2b2b2b", front: "#1f1f1f", side: "#141414" }
    },
    Megapack2: {
        light: { top: "#f7f7f7", front: "#e9e9e9", side: "#d9d9d9" },
        dark: { top: "#333333", front: "#262626", side: "#1a1a1a" }
    },
    Megapack: {
        light: { top: "#ffffff", front: "#ededed", side: "#dddddd" },
        dark: { top: "#3a3a3a", front: "#2c2c2c", side: "#1f1f1f" }
    },
    PowerPack: {
        light: { top: "#f5f5f5", front: "#e6e6e6", side: "#d6d6d6" },
        dark: { top: "#3b3b3b", front: "#2e2e2e", side: "#1f1f1f" }
    },
    Transformer: {
        light: { top: "#e31b23", front: "#c9151c", side: "#a90f15" },
        dark: { top: "#e31b23", front: "#c9151c", side: "#a90f15" }
    }
};

const TYPE_COLOR = {
    MegapackXL: "#2563eb",   // blue
    Megapack2: "#16a34a",   // green
    Megapack: "#f59e0b",   // amber
    PowerPack: "#a855f7",   // purple
    Transformer: "#ef4444"    // red
};

const HEIGHT_FT = {
    MegapackXL: 8,
    Megapack2: 7,
    Megapack: 6,
    PowerPack: 4,
    Transformer: 5
};

function shade(hex, amount) {
    const n = Number.parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
    const b = Math.min(255, Math.max(0, (n & 255) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getTypeFace(type, theme) {
    const palette = TYPE_STYLE[type] ?? TYPE_STYLE.Megapack;
    return theme === "dark" ? palette.dark : palette.light;
}

function fitCamera(maxW, maxL) {
    const size = Math.max(maxW, maxL, 60);
    return {
        position: [size * 0.95, size * 0.75, size * 1.05],
        target: [0, 0, 0]
    };
}


function Boundary({ w, l, theme }) {
    const color = theme === "dark" ? "#64748b" : "#94a3b8";
    const points = useMemo(
        () => [
            new THREE.Vector3(0, 0.03, 0),
            new THREE.Vector3(w, 0.03, 0),
            new THREE.Vector3(w, 0.03, l),
            new THREE.Vector3(0, 0.03, l),
            new THREE.Vector3(0, 0.03, 0)
        ],
        [w, l]
    );
    const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
    return (
        <line geometry={geom}>
            <lineBasicMaterial color={color} />
        </line>
    );
}

function DeviceLabel({ p, y, theme, dimmed, centerX, centerZ }) {
    return (
        <Html
            center
            position={[p.x + p.w / 2 - centerX, y, p.y + p.d / 2 - centerZ]}
            style={{ pointerEvents: "none" }}
        >
            <div
                className={[
                    "px-2 py-1 rounded-md text-[11px] shadow",
                    theme === "dark"
                        ? "bg-black/55 text-slate-100 border border-white/10"
                        : "bg-white/80 text-slate-800 border border-slate-200",
                    dimmed ? "opacity-40" : "opacity-100"
                ].join(" ")}
            >
                <div className="font-semibold leading-none">{p.type}</div>
                <div className="leading-none mt-0.5 opacity-80">
                    {p.w}×{p.d}ft
                </div>
            </div>
        </Html>
    );
}

function Device({ p, theme, selectedId, onSelect, onHover, showLabels, centerX, centerZ }) {
    const h = HEIGHT_FT[p.type] ?? 5;
    const face = getTypeFace(p.type, theme);

    const position = useMemo(() => {
        const cx = p.x + p.w / 2 - centerX;
        const cz = p.y + p.d / 2 - centerZ;
        return [cx, h / 2, cz];
    }, [p.x, p.y, p.w, p.d, h, centerX, centerZ]);

    //const baseColor = useMemo(() => shade(face.front, 4), [face.front]);
    const baseColor = useMemo(() => {
        const c = TYPE_COLOR[p.type] ?? "#94a3b8";
        // slightly darken for dark mode so it’s not neon
        return theme === "dark" ? shade(c, -30) : c;
    }, [p.type, theme]);


    const baseMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: baseColor,
                roughness: 0.62,
                metalness: 0.08
            }),
        [baseColor]
    );

    const isSelected = selectedId === p.id;
    const isDimmed = selectedId && !isSelected;

    const ventLines = Math.max(3, Math.floor(p.d / 3));
    const ventScaleX = Math.min(0.7, Math.max(0.35, p.w / 60));

    return (
        <group>
            <RoundedBox
                args={[p.w, h, p.d]}
                radius={Math.min(0.8, Math.min(p.w, p.d) * 0.08)}
                smoothness={6}
                position={position}
                castShadow
                receiveShadow
                material={baseMat}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    onHover(p);
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={(e) => {
                    e.stopPropagation();
                    onHover(null);
                    document.body.style.cursor = "default";
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(p);
                }}
            >
                <Edges
                    scale={1.001}
                    threshold={15}
                    color={theme === "dark" ? "#94a3b8" : "#334155"}
                    opacity={theme === "dark" ? 0.22 : 0.18}
                    transparent
                />
            </RoundedBox>

            {/* Front panel */}
            <mesh position={[position[0], h * 0.55, position[2] - p.d / 2 + 0.02]}>
                <planeGeometry args={[p.w * 0.78, h * 0.42]} />
                <meshStandardMaterial
                    //color={shade(face.top, theme === "dark" ? -6 : -10)}
                    color={theme === "dark" ? shade(baseColor, -12) : shade(baseColor, 22)}
                    roughness={0.7}
                    metalness={0.02}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Vents */}
            {Array.from({ length: ventLines }).map((_, i) => (
                <mesh
                    key={i}
                    position={[
                        position[0] - p.w * 0.26,
                        h * 0.44 + i * (h * 0.06),
                        position[2] - p.d / 2 + 0.04
                    ]}
                >
                    <planeGeometry args={[p.w * ventScaleX, 0.06]} />
                    <meshStandardMaterial
                        //color={shade(face.side, theme === "dark" ? 18 : -18)}
                        color={theme === "dark" ? shade(baseColor, -45) : shade(baseColor, -35)}
                        roughness={0.9}
                        metalness={0}
                    />
                </mesh>
            ))}

            {/* LED */}
            <mesh position={[position[0] + p.w * 0.34, h * 0.25, position[2] - p.d / 2 + 0.08]}>
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshStandardMaterial
                    color={p.type === "Transformer" ? "#ef4444" : "#34d399"}
                    emissive={p.type === "Transformer" ? "#ef4444" : "#34d399"}
                    emissiveIntensity={p.type === "Transformer" ? 0.9 : 0.6}
                />
            </mesh>

            {/* Transformer aura */}
            {p.type === "Transformer" && (
                <mesh position={[position[0], 0.06, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry
                        args={[Math.max(p.w, p.d) * 0.18, Math.max(p.w, p.d) * 0.3, 64]}
                    />
                    <meshBasicMaterial color="#e31b23" transparent opacity={0.22} />
                </mesh>
            )}

            {/* Selection outline */}
            {isSelected && (
                <mesh position={position}>
                    <boxGeometry args={[p.w * 1.03, h * 1.03, p.d * 1.03]} />
                    <meshBasicMaterial color="#2563eb" wireframe />
                </mesh>
            )}

            {/* ✅ Always-on label */}
            {showLabels && (
                <DeviceLabel
                    p={p}
                    theme={theme}
                    y={h + 1.0}
                    dimmed={Boolean(isDimmed)}
                    centerX={centerX}
                    centerZ={centerZ}
                />
            )}
        </group>
    );
}

function DetailsPanel({ selected, theme, onClear }) {
    if (!selected) {
        return (
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4 border border-slate-200 dark:border-slate-800">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Details</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Click a unit in the 3D layout to see details.
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {selected.type}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ID: {selected.id}
                    </div>
                </div>
                <button
                    onClick={onClear}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                    Clear
                </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Size</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {selected.w}ft × {selected.d}ft
                    </div>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Height (visual)</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {HEIGHT_FT[selected.type] ?? 5}ft
                    </div>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Position</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        x: {selected.x}ft, y: {selected.y}ft
                    </div>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Center</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        ({selected.x + selected.w / 2}, {selected.y + selected.d / 2})
                    </div>
                </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                Tip: drag to rotate, scroll to zoom, right-drag to pan.
            </div>
        </div>
    );
}

export default function Layout3D({ computed, theme }) {
    if (!computed) return null;

    const isDark = theme === "dark";
    const { placements, maxWidthFt, siteLengthFt } = computed.layout;
    const displayLengthFt = Math.max(siteLengthFt, 20);
    const centerX = (computed.layout.siteWidthFt || maxWidthFt) / 2;
    const centerZ = displayLengthFt / 2;


    const [hovered, setHovered] = useState(null);
    const [selected, setSelected] = useState(null);
    const [showLabels, setShowLabels] = useState(false);

    const controlsRef = useRef(null);
    const cameraRef = useRef(null);

    const fit = useMemo(() => fitCamera(maxWidthFt, displayLengthFt), [maxWidthFt, displayLengthFt]);

    function resetView() {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(...fit.position);
        controlsRef.current.target.set(...fit.target);
        controlsRef.current.update();
    }

    useEffect(() => {
        resetView();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxWidthFt, displayLengthFt]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: 3D canvas */}
            <div className="lg:col-span-2 p-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            3D site layout
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Drag: rotate • Scroll: zoom • Right-drag: pan
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={resetView}
                            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Reset view
                        </button>

                        <button
                            onClick={() => setShowLabels((v) => !v)}
                            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            {showLabels ? "Hide labels" : "Show labels"}
                        </button>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {selected ? `Selected: ${selected.type}` : hovered ? `Hover: ${hovered.type}` : "—"}
                        </div>
                    </div>
                </div>

                <div className="h-[600px] w-full">
                    <Canvas shadows dpr={[1, 2]}>
                        <PerspectiveCamera
                            ref={cameraRef}
                            makeDefault
                            position={fit.position}
                            fov={45}
                            near={0.1}
                            far={7000}
                        />

                        <Environment preset="city" />

                        <ambientLight intensity={isDark ? 0.35 : 0.55} />
                        <directionalLight
                            position={[140, 220, 140]}
                            intensity={isDark ? 0.8 : 1.0}
                            castShadow
                            shadow-mapSize-width={2048}
                            shadow-mapSize-height={2048}
                        />

                        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
                            <planeGeometry args={[5000, 5000]} />
                            <meshStandardMaterial color={isDark ? "#0b0b0b" : "#f8fafc"} roughness={0.95} metalness={0} />
                        </mesh>


                        <ContactShadows
                            position={[0, 0.01, 0]}
                            scale={[5000, 5000]}
                            opacity={isDark ? 0.35 : 0.25}
                            blur={2.4}
                            far={80}
                        />


                        <Grid
                            position={[0, 0.001, 0]}   // slightly above ground
                            args={[
                                Math.max(maxWidthFt, computed.layout.siteWidthFt) + 100,
                                displayLengthFt + 100
                            ]}
                            cellSize={5}
                            sectionSize={50}
                            cellThickness={0.1}
                            sectionThickness={0.1}
                            fadeDistance={400}
                            fadeStrength={1}
                        />



                        {/* <Boundary w={maxWidthFt} l={displayLengthFt} theme={theme} /> */}

                        {/* Devices */}
                        {placements.map((p) => (
                            <Device
                                key={p.id}
                                p={p}
                                theme={theme}
                                selectedId={selected?.id}
                                onSelect={setSelected}
                                onHover={setHovered}
                                showLabels={showLabels}
                                centerX={centerX}
                                centerZ={centerZ}
                            />
                        ))}


                        {/* Hover tooltip (extra detail) */}
                        {hovered && (
                            <Html
                                center
                                style={{ pointerEvents: "none" }}
                                position={[
                                    hovered.x + hovered.w / 2 - centerX,
                                    (HEIGHT_FT[hovered.type] ?? 5) + 2.5,
                                    hovered.y + hovered.d / 2 - centerZ
                                ]}

                            >
                                <div className="rounded-lg bg-slate-900 text-white text-xs px-2 py-1 shadow">
                                    <div className="font-semibold">{hovered.type}</div>
                                    <div>{hovered.w}ft × {hovered.d}ft</div>
                                    <div>x: {hovered.x}, y: {hovered.y}</div>
                                </div>
                            </Html>
                        )}

                        <OrbitControls
                            ref={controlsRef}
                            target={fit.target}
                            enableDamping
                            dampingFactor={0.08}
                            maxPolarAngle={Math.PI / 2.05}
                        />
                    </Canvas>
                </div>
            </div>

            {/* RIGHT: details panel */}
            <div className="lg:col-span-1">
                <DeviceCard3DView selected={selected} theme={theme} onClear={() => setSelected(null)} />
            </div>
        </div>
    );
}
