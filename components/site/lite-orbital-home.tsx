"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SatelliteLink = {
  href: string;
  label: string;
  subtitle: string;
  color: string;
  icon: "practice" | "ielts" | "pte" | "articles" | "member" | "contact";
};

type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

type NodeState = {
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
  size: number;
  pos: Vector3Like;
  restPos: Vector3Like;
  vel: Vector3Like;
  settling: boolean;
  orbiting: boolean;
  hasGoneBehind: boolean;
  impact: number;
};

type ProjectedNode = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

type DragState = {
  index: number;
  pointerId: number;
  lastX: number;
  lastY: number;
  moved: number;
};

const EARTH_TEXTURE_PATH = "/textures/earth/nasa-earth-real-muted-2048.jpg";

const BACKGROUND_LINES = [
  "IELTS Listening  Reading  Writing  Speaking",
  "PTE Speaking  Writing  Reading  Listening",
  "Build accuracy through repeated practice",
  "Understand the score before chasing the score",
  "Practice smarter  Review deeper  Improve steadily",
  "Computer-based test practice for real progress",
];

const NAV_LINKS: SatelliteLink[] = [
  {
    href: "/dashboard-v2",
    label: "题库与AI",
    subtitle: "Practice",
    color: "#5c67ff",
    icon: "practice",
  },
  {
    href: "/courses/ielts",
    label: "雅思课程",
    subtitle: "IELTS",
    color: "#ec5b5b",
    icon: "ielts",
  },
  {
    href: "/courses/pte",
    label: "PTE课程",
    subtitle: "PTE",
    color: "#25a67a",
    icon: "pte",
  },
  {
    href: "/posts",
    label: "备考文章",
    subtitle: "Articles",
    color: "#e69b2e",
    icon: "articles",
  },
  {
    href: "/membership",
    label: "成为会员",
    subtitle: "Member",
    color: "#8d58e8",
    icon: "member",
  },
  {
    href: "/contact",
    label: "联系老师",
    subtitle: "Contact",
    color: "#2a99cf",
    icon: "contact",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function length3(vector: Vector3Like) {
  return Math.hypot(vector.x, vector.y, vector.z) || 0.0001;
}

function normalize3(vector: Vector3Like) {
  const length = length3(vector);
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function dot3(a: Vector3Like, b: Vector3Like) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function subtract3(a: Vector3Like, b: Vector3Like) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function add3(a: Vector3Like, b: Vector3Like) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

function scale3(vector: Vector3Like, scale: number) {
  return {
    x: vector.x * scale,
    y: vector.y * scale,
    z: vector.z * scale,
  };
}

function cross3(a: Vector3Like, b: Vector3Like) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function limit3(vector: Vector3Like, maxLength: number) {
  const length = length3(vector);
  return length > maxLength ? scale3(vector, maxLength / length) : vector;
}

function surfaceRadiusFor(size: number, compressed = false) {
  return 1.42 + size * (compressed ? 0.96 : 1.06);
}

function rotateAroundAxis(vector: Vector3Like, axis: Vector3Like, angle: number) {
  const unitAxis = normalize3(axis);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const axisCrossVector = cross3(unitAxis, vector);
  const axisDotVector = dot3(unitAxis, vector);

  return {
    x: vector.x * cos + axisCrossVector.x * sin + unitAxis.x * axisDotVector * (1 - cos),
    y: vector.y * cos + axisCrossVector.y * sin + unitAxis.y * axisDotVector * (1 - cos),
    z: vector.z * cos + axisCrossVector.z * sin + unitAxis.z * axisDotVector * (1 - cos),
  };
}

function moveNodeAlongSurface(node: NodeState, tangent: Vector3Like, distance: number, compressed = false) {
  const radius = surfaceRadiusFor(node.size, compressed);
  const normal = normalize3(node.pos);
  const tangentOnly = subtract3(tangent, scale3(normal, dot3(tangent, normal)));
  if (length3(tangentOnly) < 0.0001) return;

  const direction = normalize3(tangentOnly);
  const angle = distance / radius;
  const nextNormal = normalize3({
    x: normal.x * Math.cos(angle) + direction.x * Math.sin(angle),
    y: normal.y * Math.cos(angle) + direction.y * Math.sin(angle),
    z: normal.z * Math.cos(angle) + direction.z * Math.sin(angle),
  });

  node.pos = scale3(nextNormal, radius);
}

function frontSurfacePoint(size: number, x: number, y: number) {
  const radius = surfaceRadiusFor(size);
  const maxPlanarRadius = radius * 0.72;
  const planarDistance = Math.hypot(x, y);
  const factor = planarDistance > maxPlanarRadius ? maxPlanarRadius / planarDistance : 1;
  const px = x * factor;
  const py = y * factor;
  return {
    x: px,
    y: py,
    z: Math.sqrt(Math.max(0.12, radius ** 2 - px ** 2 - py ** 2)),
  };
}

function projectToSurface(node: NodeState, compressed = false) {
  const radius = surfaceRadiusFor(node.size, compressed);
  const normal = normalize3(node.pos);
  node.pos = scale3(normal, radius);
  const radialSpeed = dot3(node.vel, normal);
  node.vel = subtract3(node.vel, scale3(normal, radialSpeed));
}

function moveNodeTowardFrontOnSurface(node: NodeState, target: Vector3Like, amount: number, compressed = false) {
  const radius = surfaceRadiusFor(node.size, compressed);
  const from = normalize3(node.pos);
  const to = normalize3(target);
  const blended = normalize3({
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount,
    z: from.z + (to.z - from.z) * amount,
  });
  const next = scale3(blended, radius);
  const oldPos = node.pos;
  node.pos = next;
  node.vel = limit3(scale3(subtract3(next, oldPos), 0.28), 0.026);
}

function makeNodes(count: number): NodeState[] {
  const frontSlots = [
    { x: -1.12, y: 0.66 },
    { x: 0, y: 1.03 },
    { x: 1.12, y: 0.66 },
    { x: -1.12, y: -0.72 },
    { x: 0, y: -1.03 },
    { x: 1.12, y: -0.72 },
  ];

  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const size = 0.29 + (index % 2) * 0.02;
    const orbitRadius = surfaceRadiusFor(size);
    const restPos = frontSurfacePoint(size, frontSlots[index]?.x ?? 0, frontSlots[index]?.y ?? 0);
    return {
      angle,
      orbitRadius,
      orbitSpeed: 0.23 + index * 0.017,
      phase: index * 0.81,
      size,
      pos: { ...restPos },
      restPos,
      vel: { x: 0, y: 0, z: 0 },
      settling: false,
      orbiting: false,
      hasGoneBehind: false,
      impact: 0,
    };
  });
}

function makeEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const ocean = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  ocean.addColorStop(0, "#d9eef0");
  ocean.addColorStop(0.46, "#edf7f6");
  ocean.addColorStop(1, "#c8e0e5");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.94;
  ctx.fillStyle = "#aeca9c";
  ctx.strokeStyle = "rgba(104, 137, 118, 0.28)";
  ctx.lineWidth = 2.5;
  const point = (longitude: number, latitude: number): [number, number] => [
    ((longitude + 180) / 360) * canvas.width,
    ((90 - latitude) / 180) * canvas.height,
  ];
  const drawLand = (points: Array<[number, number]>) => {
    ctx.beginPath();
    points.map(([longitude, latitude]) => point(longitude, latitude)).forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  drawLand([
    [-168, 68],
    [-148, 72],
    [-128, 58],
    [-124, 46],
    [-116, 34],
    [-104, 24],
    [-92, 16],
    [-82, 23],
    [-78, 35],
    [-68, 45],
    [-54, 50],
    [-52, 62],
    [-72, 72],
    [-102, 76],
    [-134, 72],
  ]);
  drawLand([
    [-86, 20],
    [-76, 12],
    [-64, 11],
    [-50, 2],
    [-42, -12],
    [-46, -28],
    [-56, -44],
    [-70, -55],
    [-76, -42],
    [-80, -24],
    [-82, -6],
  ]);
  drawLand([
    [-52, 74],
    [-32, 82],
    [-16, 74],
    [-22, 60],
    [-44, 58],
    [-58, 64],
  ]);
  drawLand([
    [-10, 36],
    [8, 58],
    [34, 60],
    [58, 54],
    [88, 62],
    [122, 54],
    [154, 48],
    [174, 36],
    [146, 24],
    [112, 28],
    [96, 12],
    [76, 22],
    [54, 16],
    [36, 26],
    [24, 10],
    [8, 20],
  ]);
  drawLand([
    [-18, 34],
    [10, 36],
    [34, 26],
    [44, 6],
    [42, -18],
    [28, -34],
    [18, -35],
    [4, -22],
    [-8, 2],
    [-16, 18],
  ]);
  drawLand([
    [66, 24],
    [88, 22],
    [104, 10],
    [104, -4],
    [116, -8],
    [122, 10],
    [112, 22],
    [92, 30],
  ]);
  drawLand([
    [112, -12],
    [134, -10],
    [154, -22],
    [146, -38],
    [120, -42],
    [112, -28],
  ]);
  drawLand([
    [-180, -66],
    [-130, -70],
    [-82, -66],
    [-30, -72],
    [24, -68],
    [82, -72],
    [140, -66],
    [180, -70],
    [180, -90],
    [-180, -90],
  ]);

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffffff";
  for (let index = 0; index < 20; index += 1) {
    const x = (index * 131) % canvas.width;
    const y = 44 + ((index * 67) % 390);
    ctx.beginPath();
    ctx.ellipse(x, y, 52 + (index % 4) * 12, 8 + (index % 3) * 4, index * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  return canvas;
}

function addVelocity(node: NodeState, x: number, y: number, z: number) {
  node.vel.x += x;
  node.vel.y += y;
  node.vel.z += z;
}

function addTangentVelocity(node: NodeState, x: number, y: number, z: number) {
  const normal = normalize3(node.pos);
  const velocity = { x, y, z };
  const radialSpeed = dot3(velocity, normal);
  const tangent = subtract3(velocity, scale3(normal, radialSpeed));
  addVelocity(node, tangent.x, tangent.y, tangent.z);
  node.vel = limit3(node.vel, 0.11);
}

function steerNodeTowardRest(node: NodeState, target: Vector3Like, delta: number, strength: number) {
  const normal = normalize3(node.pos);
  const toTarget = subtract3(target, node.pos);
  let tangent = subtract3(toTarget, scale3(normal, dot3(toTarget, normal)));

  if (length3(tangent) < 0.0008) {
    const restNormal = normalize3(target);
    tangent = cross3(normal, cross3(restNormal, normal));
  }

  const direction = normalize3(tangent);
  addTangentVelocity(
    node,
    direction.x * strength * delta,
    direction.y * strength * delta,
    direction.z * strength * delta
  );
}

function drawSatelliteIcon(
  ctx: CanvasRenderingContext2D,
  icon: SatelliteLink["icon"],
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (icon === "practice") {
    ctx.beginPath();
    ctx.arc(-20, -12, 7, 0, Math.PI * 2);
    ctx.arc(18, -18, 7, 0, Math.PI * 2);
    ctx.arc(8, 18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(12, -17);
    ctx.moveTo(16, -12);
    ctx.lineTo(10, 12);
    ctx.moveTo(2, 16);
    ctx.lineTo(-16, -6);
    ctx.stroke();
  } else if (icon === "ielts") {
    ctx.beginPath();
    ctx.moveTo(-28, -24);
    ctx.quadraticCurveTo(-8, -32, 0, -18);
    ctx.quadraticCurveTo(8, -32, 28, -24);
    ctx.lineTo(28, 25);
    ctx.quadraticCurveTo(8, 17, 0, 30);
    ctx.quadraticCurveTo(-8, 17, -28, 25);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 30);
    ctx.moveTo(-17, -8);
    ctx.lineTo(-7, -10);
    ctx.moveTo(10, -10);
    ctx.lineTo(20, -8);
    ctx.stroke();
  } else if (icon === "pte") {
    [-22, -10, 2, 14, 26].forEach((barX, index) => {
      const height = [28, 44, 62, 38, 24][index];
      ctx.beginPath();
      ctx.moveTo(barX, -height / 2);
      ctx.lineTo(barX, height / 2);
      ctx.stroke();
    });
  } else if (icon === "articles") {
    ctx.beginPath();
    ctx.roundRect(-24, -30, 48, 60, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(14, -12);
    ctx.moveTo(-12, 1);
    ctx.lineTo(16, 1);
    ctx.moveTo(-12, 14);
    ctx.lineTo(8, 14);
    ctx.stroke();
  } else if (icon === "member") {
    ctx.beginPath();
    ctx.moveTo(-29, 16);
    ctx.lineTo(-21, -17);
    ctx.lineTo(-5, 3);
    ctx.lineTo(0, -24);
    ctx.lineTo(5, 3);
    ctx.lineTo(21, -17);
    ctx.lineTo(29, 16);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, 27);
    ctx.lineTo(20, 27);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(-30, -23, 60, 42, 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, 19);
    ctx.lineTo(-18, 31);
    ctx.lineTo(8, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-12, -2, 3, 0, Math.PI * 2);
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.arc(12, -2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function makeSatellitePrintTexture({
  title,
  subtitle,
  color,
  icon,
}: {
  title: string;
  subtitle: string;
  color: string;
  icon: SatelliteLink["icon"];
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const centerX = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const plate = ctx.createRadialGradient(centerX - 34, 112, 16, centerX, 158, 188);
  plate.addColorStop(0, "rgba(255,255,255,.92)");
  plate.addColorStop(0.52, "rgba(255,255,255,.62)");
  plate.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.ellipse(centerX, 158, 208, 122, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "rgba(255,255,255,.92)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.beginPath();
  ctx.arc(centerX, 73, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  drawSatelliteIcon(ctx, icon, centerX, 74, color);

  ctx.shadowColor = "rgba(255,255,255,.95)";
  ctx.shadowBlur = 5;
  ctx.fillStyle = "rgba(31,42,58,.98)";
  ctx.font = "900 59px system-ui, -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif";
  ctx.fillText(title, centerX, 154);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(61,74,95,.86)";
  ctx.font = "900 30px system-ui, -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif";
  ctx.fillText(subtitle.toUpperCase(), centerX, 205);

  ctx.globalAlpha = 0.26;
  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(centerX - 54, 118, 118, 42, -0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  return canvas;
}

export default function LiteOrbitalHome() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<NodeState[]>(makeNodes(NAV_LINKS.length));
  const gatherRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const centerPointerRef = useRef<number | null>(null);
  const projectedRef = useRef<ProjectedNode[]>(
    NAV_LINKS.map(() => ({ x: 0, y: 0, scale: 1, opacity: 0 }))
  );
  const centerProjectedRef = useRef<ProjectedNode>({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
  });
  const worldScaleRef = useRef({ x: 6.2, y: 3.6 });
  const [projected, setProjected] = useState<ProjectedNode[]>(
    NAV_LINKS.map(() => ({ x: 0, y: 0, scale: 1, opacity: 0 }))
  );
  const [centerProjected, setCenterProjected] = useState<ProjectedNode>({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
  });

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const scatter = useCallback(
    (sourceIndex: number | null, strength = 1) => {
      const nodes = nodesRef.current;
      nodes.forEach((node, index) => {
        const tangentAngle = node.angle + Math.PI / 2 + (index % 2 === 0 ? 0.35 : -0.35);
        const weight = sourceIndex === null || sourceIndex === index ? 1 : 0.62;
        addTangentVelocity(
          node,
          Math.cos(tangentAngle) * 0.09 * strength * weight + (Math.random() - 0.5) * 0.018,
          Math.sin(tangentAngle) * 0.06 * strength * weight + (Math.random() - 0.5) * 0.018,
          (index % 2 === 0 ? 0.055 : -0.055) * strength * weight
        );
        projectToSurface(node, gatherRef.current);
      });
    },
    []
  );

  const getNearestSatellite = useCallback((clientX: number, clientY: number) => {
    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    projectedRef.current.forEach((node, index) => {
      if (node.opacity < 0.18) return;
      const distance = Math.hypot(node.x - x, node.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    if (bestIndex < 0) return null;
    const hitRadius = Math.max(54, 78 * (projectedRef.current[bestIndex]?.scale ?? 1));
    return bestDistance <= hitRadius ? { index: bestIndex, distance: bestDistance } : null;
  }, []);

  const isCenterHit = useCallback((clientX: number, clientY: number) => {
    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return false;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const center = centerProjectedRef.current;
    const distance = Math.hypot(center.x - x, center.y - y);
    return distance <= Math.min(rect.width, rect.height) * 0.22;
  }, []);

  const startSatelliteDrag = useCallback(
    (pointerId: number, clientX: number, clientY: number, index: number) => {
      dragRef.current = {
        index,
        pointerId,
        lastX: clientX,
        lastY: clientY,
        moved: 0,
      };
      nodesRef.current[index].vel = { x: 0, y: 0, z: 0 };
      nodesRef.current[index].orbiting = false;
      nodesRef.current[index].hasGoneBehind = false;
      nodesRef.current[index].settling = false;
    },
    []
  );

  const moveDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.moved += Math.hypot(dx, dy);

    const node = nodesRef.current[drag.index];
    const previousPoint = node.pos;
    const rect = mountRef.current?.getBoundingClientRect();
    const sensitivity = rect ? (rect.width < 520 ? 3.7 : 3.05) : 3.05;
    const yaw = (dx / Math.max(1, window.innerWidth)) * sensitivity;
    const pitch = (dy / Math.max(1, window.innerHeight)) * sensitivity;
    let nextPoint = rotateAroundAxis(previousPoint, { x: 0, y: 1, z: 0 }, yaw);
    nextPoint = rotateAroundAxis(nextPoint, { x: 1, y: 0, z: 0 }, pitch);
    node.pos = nextPoint;
    projectToSurface(node, gatherRef.current);
    node.vel = limit3(scale3(subtract3(node.pos, previousPoint), 0.9), 0.11);
    node.settling = false;
    node.orbiting = length3(node.vel) > 0.01;
    if (node.pos.z < -0.08) node.hasGoneBehind = true;

    nodesRef.current.forEach((other, index) => {
      if (index === drag.index) return;
      const ox = other.pos.x - node.pos.x;
      const oy = other.pos.y - node.pos.y;
      const oz = other.pos.z - node.pos.z;
      const distance = Math.hypot(ox, oy, oz) || 0.001;
      const minDistance = node.size + other.size + 0.055;
      if (distance < minDistance) {
        const overlap = minDistance - distance;
        const normal = { x: ox / distance, y: oy / distance, z: oz / distance };
        moveNodeAlongSurface(other, normal, overlap * 0.68, gatherRef.current);
        const impulse = overlap * 0.26;
        addTangentVelocity(other, normal.x * impulse, normal.y * impulse, normal.z * impulse);
        addTangentVelocity(
          node,
          -normal.x * impulse * 0.18,
          -normal.y * impulse * 0.18,
          -normal.z * impulse * 0.18
        );
        other.settling = false;
        node.settling = false;
        other.orbiting = true;
        node.orbiting = true;
        other.impact = 1;
        node.impact = 0.45;
        projectToSurface(other, gatherRef.current);
        projectToSurface(node, gatherRef.current);
      }
    });
  }, []);

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>, href: string) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (drag.moved < 8) {
        router.push(href);
        return;
      }

      const node = nodesRef.current[drag.index];
      const speed = length3(node.vel);
      if (speed > 0.0005 && speed < 0.058) {
        node.vel = scale3(normalize3(node.vel), 0.058);
      }
      node.orbiting = true;
      node.hasGoneBehind = node.pos.z < -0.08;
      node.settling = false;
    },
    [router]
  );

  const handleStagePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const hit = getNearestSatellite(event.clientX, event.clientY);
      if (hit) {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        startSatelliteDrag(event.pointerId, event.clientX, event.clientY, hit.index);
        return;
      }

      if (isCenterHit(event.clientX, event.clientY)) {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        centerPointerRef.current = event.pointerId;
        gatherRef.current = true;
      }
    },
    [getNearestSatellite, isCenterHit, startSatelliteDrag]
  );

  const handleStagePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      moveDrag(event);
    },
    [moveDrag]
  );

  const handleStagePointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag?.pointerId === event.pointerId) {
        endDrag(event, NAV_LINKS[drag.index].href);
        return;
      }

      if (centerPointerRef.current === event.pointerId) {
        centerPointerRef.current = null;
        gatherRef.current = false;
        scatter(null, 1.15);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }
    },
    [endDrag, scatter]
  );

  const handleStagePointerCancel = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
    if (centerPointerRef.current === event.pointerId) {
      centerPointerRef.current = null;
      gatherRef.current = false;
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let animationFrame = 0;
    let cleanup = () => {};

    async function bootScene() {
      const THREE = await import("three");
      if (disposed || !canvasRef.current || !mountRef.current) return;

      const mount = mountRef.current;
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.14;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.12, 7.6);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xa9bac3, 2.2));
      scene.add(new THREE.AmbientLight(0xffffff, 0.92));
      const sun = new THREE.DirectionalLight(0xffffff, 5.8);
      sun.position.set(-3.2, 3.6, 5.4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
      const rim = new THREE.PointLight(0xffffff, 4.6, 15);
      rim.position.set(3.8, 1.2, 3.2);
      scene.add(rim);
      const tint = new THREE.PointLight(0x89d2c8, 3.3, 14);
      tint.position.set(2.8, -2.2, 3.4);
      scene.add(tint);

      const group = new THREE.Group();
      scene.add(group);

      let earthTexture;
      try {
        earthTexture = await new THREE.TextureLoader().loadAsync(EARTH_TEXTURE_PATH);
      } catch {
        earthTexture = new THREE.CanvasTexture(makeEarthTexture());
      }
      earthTexture.colorSpace = THREE.SRGBColorSpace;
      earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const centerMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: earthTexture,
        roughness: 0.42,
        metalness: 0.02,
        clearcoat: 0.48,
        clearcoatRoughness: 0.2,
        transmission: 0,
        thickness: 0.08,
        ior: 1.42,
        reflectivity: 0.42,
      });
      const earthGroup = new THREE.Group();
      earthGroup.rotation.z = -0.32;
      group.add(earthGroup);
      const center = new THREE.Mesh(new THREE.SphereGeometry(1.45, 96, 96), centerMaterial);
      center.castShadow = true;
      center.receiveShadow = true;
      earthGroup.add(center);

      const centerHighlight = new THREE.Mesh(
        new THREE.CircleGeometry(0.34, 48),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        })
      );
      centerHighlight.position.set(-0.58, 0.72, 1.36);
      centerHighlight.rotation.z = -0.35;
      center.add(centerHighlight);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.49, 96, 96),
        new THREE.MeshBasicMaterial({
          color: 0xd8fbff,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      earthGroup.add(atmosphere);

      const outerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(1.58, 96, 96),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.075,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          depthWrite: false,
        })
      );
      earthGroup.add(outerGlow);

      const globeLines = new THREE.Group();
      Array.from({ length: 9 }).forEach((_, index) => {
        const meridian = new THREE.Mesh(
          new THREE.TorusGeometry(1.455, 0.004, 10, 130),
          new THREE.MeshBasicMaterial({ color: 0x7f8d9a, transparent: true, opacity: 0.16 })
        );
        meridian.rotation.y = (Math.PI / 9) * index;
        globeLines.add(meridian);
      });
      const equator = new THREE.Mesh(
        new THREE.TorusGeometry(1.457, 0.006, 10, 160),
        new THREE.MeshBasicMaterial({ color: 0x7f8d9a, transparent: true, opacity: 0.24 })
      );
      equator.rotation.x = Math.PI / 2;
      globeLines.add(equator);
      center.add(globeLines);

      const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(2.22, 0.006, 8, 180),
        new THREE.MeshBasicMaterial({
          color: 0xa0b4bd,
          transparent: true,
          opacity: 0.2,
        })
      );
      orbit.rotation.x = Math.PI / 2;
      center.add(orbit);

      const satelliteMeshes = NAV_LINKS.map((item, index) => {
        const labelTexture = new THREE.CanvasTexture(
          makeSatellitePrintTexture({
            title: item.label,
            subtitle: item.subtitle,
            color: item.color,
            icon: item.icon,
          })
        );
        labelTexture.colorSpace = THREE.SRGBColorSpace;

        const shell = new THREE.Mesh(
          new THREE.SphereGeometry(nodesRef.current[index].size, 64, 64),
          new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            roughness: 0.18,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.08,
            transmission: 0.06,
            thickness: 0.45,
            ior: 1.38,
            reflectivity: 0.78,
          })
        );
        shell.castShadow = true;
        shell.receiveShadow = true;

        const core = new THREE.Mesh(
          new THREE.SphereGeometry(nodesRef.current[index].size * 0.24, 32, 32),
          new THREE.MeshBasicMaterial({
            color: item.color,
            transparent: true,
            opacity: 0.28,
          })
        );
        core.position.set(
          -nodesRef.current[index].size * 0.22,
          nodesRef.current[index].size * 0.08,
          nodesRef.current[index].size * 0.22
        );
        shell.add(core);

        const printedLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(nodesRef.current[index].size * 1.74, nodesRef.current[index].size * 1.08, 12, 8),
          new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true,
            opacity: 0.94,
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        );
        printedLabel.position.set(0, 0.002, nodesRef.current[index].size * 1.04);
        printedLabel.renderOrder = 24;
        shell.add(printedLabel);

        const rimShell = new THREE.Mesh(
          new THREE.SphereGeometry(nodesRef.current[index].size * 1.025, 64, 64),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false,
          })
        );
        shell.add(rimShell);

        const shine = new THREE.Mesh(
          new THREE.CircleGeometry(nodesRef.current[index].size * 0.18, 32),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.58,
            depthWrite: false,
          })
        );
        shine.position.set(
          -nodesRef.current[index].size * 0.32,
          nodesRef.current[index].size * 0.28,
          nodesRef.current[index].size * 0.34
        );
        shell.add(shine);
        group.add(shell);
        return shell;
      });

      const shadowPlane = new THREE.Mesh(
        new THREE.CircleGeometry(2.85, 96),
        new THREE.MeshBasicMaterial({
          color: 0x9aadb6,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
        })
      );
      shadowPlane.position.set(0, -1.62, -0.24);
      shadowPlane.scale.set(1.25, 0.16, 1);
      group.add(shadowPlane);

      const sparkleGeometry = new THREE.BufferGeometry();
      const sparkles = Array.from({ length: 140 }, () => [
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 6,
      ]).flat();
      sparkleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sparkles, 3));
      const sparkleCloud = new THREE.Points(
        sparkleGeometry,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.018,
          transparent: true,
          opacity: 0.5,
        })
      );
      scene.add(sparkleCloud);

      const resize = () => {
        const rect = mount.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / Math.max(1, rect.height);
        camera.position.z = rect.width < 520 ? 15.2 : rect.width < 820 ? 9.4 : 7.6;
        camera.updateProjectionMatrix();
        const distance = camera.position.z;
        const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
        worldScaleRef.current = {
          x: visibleHeight * camera.aspect,
          y: visibleHeight,
        };
      };

      const project = (vector: Vector3Like, size = 1) => {
        const rect = mount.getBoundingClientRect();
        const projectedVector = new THREE.Vector3(vector.x, vector.y, vector.z).project(camera);
        const frontVisibility = clamp((vector.z + 0.16) / 0.54, 0, 1);
        return {
          x: ((projectedVector.x + 1) / 2) * rect.width,
          y: ((-projectedVector.y + 1) / 2) * rect.height,
          scale: clamp(0.72 + frontVisibility * 0.28 + size * 0.16, 0.68, 1.08),
          opacity: frontVisibility,
        };
      };

      const clock = new THREE.Clock();
      const render = () => {
        const delta = Math.min(clock.getDelta(), 0.033);
        const nodes = nodesRef.current;

        center.rotation.y += delta * 0.032;
        center.rotation.x = 0.04;
        globeLines.rotation.y += delta * 0.035;
        orbit.rotation.z += delta * 0.045;
        sparkleCloud.rotation.y += delta * 0.01;

        nodes.forEach((node, index) => {
          if (dragRef.current?.index !== index) {
            const target = gatherRef.current
              ? frontSurfacePoint(node.size, node.restPos.x * 0.42, node.restPos.y * 0.42)
              : node.restPos;
            const speed = length3(node.vel);
            const behindOrSide = node.pos.z < 0.9;
            if (node.pos.z < -0.08) node.hasGoneBehind = true;
            if (node.orbiting && !node.hasGoneBehind && speed < 0.004) {
              node.orbiting = false;
            }
            const frontAfterOrbit = node.hasGoneBehind && node.pos.z > 1.08;
            const orbitCanSettle = !node.orbiting || (node.hasGoneBehind && speed < 0.045);
            const shouldSettle =
              gatherRef.current ||
              node.settling ||
              (orbitCanSettle && speed < 0.034) ||
              (frontAfterOrbit && speed < 0.052);

            if (shouldSettle) {
              node.settling = true;
              node.orbiting = false;
              const toRest = subtract3(target, node.pos);
              const distanceToRest = length3(toRest);
              const homeSpeed = node.pos.z < 0 ? 3.25 : behindOrSide ? 2.25 : speed < 0.018 ? 1.25 : 0.72;
              moveNodeTowardFrontOnSurface(node, target, clamp(delta * homeSpeed, 0.018, 0.13), gatherRef.current);
              steerNodeTowardRest(node, target, delta, behindOrSide ? 0.46 : 0.22);
              node.vel = limit3(node.vel, behindOrSide ? 0.032 : 0.024);

              if (!gatherRef.current && distanceToRest < 0.035 && speed < 0.007) {
                node.pos = { ...node.restPos };
                node.vel = { x: 0, y: 0, z: 0 };
                node.settling = false;
                node.orbiting = false;
                node.hasGoneBehind = false;
              }
            }
          }

          const tangentVelocity = subtract3(node.vel, scale3(normalize3(node.pos), dot3(node.vel, normalize3(node.pos))));
          const travelDistance = length3(tangentVelocity);
          if (travelDistance > 0.0002) {
            moveNodeAlongSurface(node, tangentVelocity, travelDistance, gatherRef.current);
          }
          projectToSurface(node, gatherRef.current);
          const speed = length3(node.vel);
          if (node.pos.z < -0.08) node.hasGoneBehind = true;
          const frontAfterOrbit = node.hasGoneBehind && node.pos.z > 1.08;
          const frontDamping = frontAfterOrbit ? 0.82 : 0.992;
          const backDamping = node.settling && node.pos.z < 0.9 ? 0.84 : frontDamping;
          const damping = prefersReducedMotion ? 0.72 : backDamping;
          node.vel.x *= damping;
          node.vel.y *= damping;
          node.vel.z *= damping;
          if (node.orbiting && node.hasGoneBehind && speed < 0.04) {
            node.orbiting = false;
            node.settling = true;
          }
          node.impact *= 0.86;
        });

        for (let pass = 0; pass < 2; pass += 1) {
          for (let i = 0; i < nodes.length; i += 1) {
            for (let j = i + 1; j < nodes.length; j += 1) {
              const a = nodes[i];
              const b = nodes[j];
              const dx = b.pos.x - a.pos.x;
              const dy = b.pos.y - a.pos.y;
              const dz = b.pos.z - a.pos.z;
              const distance = Math.hypot(dx, dy, dz) || 0.001;
              const minDistance = a.size + b.size + 0.055;
              if (distance < minDistance) {
                const nx = dx / distance;
                const ny = dy / distance;
                const nz = dz / distance;
                const normal = { x: nx, y: ny, z: nz };
                const relativeSpeed = dot3(subtract3(a.vel, b.vel), normal);
                const overlap = minDistance - distance;
                const correction = overlap * 0.62;
                const aIsDragged = dragRef.current?.index === i;
                const bIsDragged = dragRef.current?.index === j;

                if (!aIsDragged) {
                  moveNodeAlongSurface(a, scale3(normal, -1), correction * (bIsDragged ? 1.25 : 0.58), gatherRef.current);
                }
                if (!bIsDragged) {
                  moveNodeAlongSurface(b, normal, correction * (aIsDragged ? 1.25 : 0.58), gatherRef.current);
                }

                if (relativeSpeed > 0 && pass === 0) {
                  a.vel = limit3(subtract3(a.vel, scale3(normal, relativeSpeed * 0.78)), 0.07);
                  b.vel = limit3(add3(b.vel, scale3(normal, relativeSpeed * 0.78)), 0.07);
                  a.settling = false;
                  b.settling = false;
                  a.impact = 1;
                  b.impact = 1;
                }

                addTangentVelocity(a, -nx * overlap * 0.1, -ny * overlap * 0.1, -nz * overlap * 0.1);
                addTangentVelocity(b, nx * overlap * 0.1, ny * overlap * 0.1, nz * overlap * 0.1);
                projectToSurface(a, gatherRef.current);
                projectToSurface(b, gatherRef.current);
              }
            }
          }
        }

        satelliteMeshes.forEach((mesh, index) => {
          const node = nodes[index];
          const visibility = clamp((node.pos.z + 0.16) / 0.54, 0, 1);
          mesh.position.set(node.pos.x, node.pos.y, node.pos.z);
          const impactScale = 1 + node.impact * 0.1;
          mesh.scale.setScalar(impactScale);
          mesh.rotation.x = -node.pos.y * 0.04 + Math.sin(clock.elapsedTime * 1.6 + index) * 0.012;
          mesh.rotation.y = node.pos.x * 0.035 + Math.cos(clock.elapsedTime * 1.4 + index) * 0.012;
          mesh.rotation.z = Math.sin(clock.elapsedTime * 1.2 + index * 0.7) * 0.014;
          mesh.visible = visibility > 0.18;
          const meshMaterial = mesh.material;
          if (!Array.isArray(meshMaterial)) meshMaterial.opacity = visibility * 0.86;
        });

        renderer.render(scene, camera);
        const nextProjected = nodes.map((node) => project(node.pos, node.size));
        const nextCenterProjected = project({ x: 0, y: 0, z: 0 }, 1.45);
        projectedRef.current = nextProjected;
        centerProjectedRef.current = nextCenterProjected;
        setProjected(nextProjected);
        setCenterProjected(nextCenterProjected);
        animationFrame = requestAnimationFrame(render);
      };

      resize();
      window.addEventListener("resize", resize);
      animationFrame = requestAnimationFrame(render);

      cleanup = () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", resize);
        renderer.dispose();
        earthTexture.dispose();
        center.geometry.dispose();
        centerMaterial.dispose();
        atmosphere.geometry.dispose();
        const atmosphereMaterial = atmosphere.material;
        if (!Array.isArray(atmosphereMaterial)) atmosphereMaterial.dispose();
        outerGlow.geometry.dispose();
        const outerGlowMaterial = outerGlow.material;
        if (!Array.isArray(outerGlowMaterial)) outerGlowMaterial.dispose();
        centerHighlight.geometry.dispose();
        const centerHighlightMaterial = centerHighlight.material;
        if (!Array.isArray(centerHighlightMaterial)) centerHighlightMaterial.dispose();
        orbit.geometry.dispose();
        shadowPlane.geometry.dispose();
        const shadowPlaneMaterial = shadowPlane.material;
        if (!Array.isArray(shadowPlaneMaterial)) shadowPlaneMaterial.dispose();
        sparkleGeometry.dispose();
        satelliteMeshes.forEach((mesh) => {
          mesh.traverse((child) => {
            const maybeMesh = child as { geometry?: { dispose: () => void }; material?: unknown };
            maybeMesh.geometry?.dispose();
            const material = maybeMesh.material;
            if (Array.isArray(material)) {
              material.forEach((item) => {
                item.map?.dispose();
                item.dispose();
              });
            }
            else if (material && typeof material === "object" && "dispose" in material) {
              if ("map" in material) (material as { map?: { dispose: () => void } }).map?.dispose();
              (material as { dispose: () => void }).dispose();
            }
          });
        });
      };
    }

    bootScene();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [prefersReducedMotion]);

  return (
    <main
      className="lite-orbital-home-page relative min-h-screen cursor-grab overflow-hidden bg-[#edf6f7] text-slate-800 active:cursor-grabbing"
      onPointerDown={handleStagePointerDown}
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      onPointerCancel={handleStagePointerCancel}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_43%_42%,rgba(255,255,255,0.98),rgba(239,248,249,0.72)_31%,transparent_56%),linear-gradient(180deg,#eef7f8_0%,#fbfbf9_52%,#eef2f3_100%)]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {BACKGROUND_LINES.map((line, index) => (
          <div
            key={line}
            className="lite-orbital-marquee absolute left-0 flex w-[220vw] gap-10 whitespace-nowrap text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-500/20 sm:text-sm"
            style={{
              top: `${10 + index * 13}%`,
              animationDelay: `${index * -5.5}s`,
              animationDuration: `${34 + index * 4}s`,
            }}
          >
            {Array.from({ length: 6 }).map((_, repeatIndex) => (
              <span key={`${line}-${repeatIndex}`}>{line}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(203,213,219,.5))]" />

      <div ref={mountRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      </div>

      <div
        className="pointer-events-none absolute left-[68%] top-[24%] z-10 hidden -translate-y-1/2 select-none text-left lg:block"
        aria-hidden="true"
      >
        <div className="text-[clamp(2.4rem,4.2vw,5.2rem)] font-black leading-[0.92] tracking-normal text-slate-800/90 drop-shadow-[0_12px_26px_rgba(255,255,255,.9)]">
          小马哥教育
        </div>
        <div className="mt-4 text-[clamp(0.9rem,1.45vw,1.55rem)] font-extrabold uppercase tracking-[0.32em] text-slate-500/75">
          Lofty Education
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-5 top-6 z-10 select-none text-center lg:hidden"
        aria-hidden="true"
      >
        <div className="text-3xl font-black leading-none tracking-normal text-slate-800/88 sm:text-5xl">
          小马哥教育
        </div>
        <div className="mt-2 text-xs font-extrabold uppercase tracking-[0.28em] text-slate-500/72 sm:text-sm">
          Lofty Education
        </div>
      </div>

      <button
        type="button"
        aria-label="聚拢导航球"
        className="pointer-events-none absolute z-10 aspect-square w-[min(40vw,16.5rem)] -translate-x-1/2 -translate-y-1/2 touch-none select-none rounded-full bg-transparent text-transparent outline-none sm:w-[min(48vw,16.5rem)]"
        style={{
          left: centerProjected.x,
          top: centerProjected.y,
          transform: `translate(-50%, -50%) scale(${centerProjected.scale})`,
        }}
      />

      {NAV_LINKS.map((item, index) => {
        const node = projected[index];
        const depth = Math.round(node.scale * 100);
        return (
          <button
            key={item.href}
            type="button"
            aria-label={`${item.label} ${item.subtitle}`}
            className="pointer-events-none absolute z-20 aspect-square w-[5.8rem] -translate-x-1/2 -translate-y-1/2 touch-none select-none rounded-full bg-transparent text-transparent outline-none sm:w-[7rem]"
            style={{
              left: node.x,
              top: node.y,
              opacity: node.opacity,
              transform: `translate(-50%, -50%) scale(${node.scale})`,
              zIndex: 20 + depth,
            }}
          />
        );
      })}

      <style>{`
        body:has(.lite-orbital-home-page) .lofty-marketing-chrome {
          display: none;
        }

        body:has(.lite-orbital-home-page) .lofty-marketing-main {
          min-height: 100vh;
        }

        @keyframes lite-orbital-marquee {
          from {
            transform: translate3d(-8%, 0, 0);
          }
          to {
            transform: translate3d(-56%, 0, 0);
          }
        }

        .lite-orbital-marquee {
          animation-name: lite-orbital-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        .lite-orbital-marquee:nth-child(even) {
          animation-direction: reverse;
        }

        @media (prefers-reduced-motion: reduce) {
          .lite-orbital-marquee {
            animation: none;
            opacity: 0.45;
          }
        }
      `}</style>
    </main>
  );
}
