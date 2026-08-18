import { useEffect, useRef, useState } from "react";

interface InteractivePatternBgProps {
  type: "lines" | "mesh";
}

export default function InteractivePatternBg({ type }: InteractivePatternBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const mouseVelocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };

      // Calculate velocity (drag direction)
      mouseVelocity.current = {
        x: newPos.x - prevMousePos.current.x,
        y: newPos.y - prevMousePos.current.y,
      };

      prevMousePos.current = newPos;
      setMousePos(newPos);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get parent section dimensions
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const animate = () => {
      timeRef.current += 0.016; // ~60fps
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouseInfluence = 100; // Radius of influence

      if (type === "lines") {
        drawInteractiveLines(
          ctx,
          canvas,
          mousePos,
          mouseInfluence,
          timeRef.current,
          mouseVelocity.current
        );
      } else if (type === "mesh") {
        drawMeshPattern(ctx, canvas, mousePos, mouseInfluence, timeRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [type, mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

function drawMeshPattern(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  mousePos: { x: number; y: number },
  influence: number,
  time: number
) {
  const spacing = 80;
  const nodes: Array<{ x: number; y: number; index: number }> = [];

  // Create nodes
  let nodeIndex = 0;
  for (let x = 0; x < canvas.width; x += spacing) {
    for (let y = 0; y < canvas.height; y += spacing) {
      nodes.push({ x, y, index: nodeIndex++ });
    }
  }

  // Draw connecting lines (subtle)
  ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
  ctx.lineWidth = 1;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const dx = mousePos.x - node.x;
    const dy = mousePos.y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    for (let j = i + 1; j < nodes.length; j++) {
      const otherNode = nodes[j];
      const dx2 = otherNode.x - node.x;
      const dy2 = otherNode.y - node.y;
      const nodeDist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (nodeDist < spacing * 1.8) {
        let opacity = 0.1;

        // Brighten lines near cursor
        if (distance < influence) {
          opacity += (1 - distance / influence) * 0.15;
        }
        if (Math.sqrt((mousePos.x - otherNode.x) ** 2 + (mousePos.y - otherNode.y) ** 2) < influence) {
          opacity += 0.15;
        }

        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(otherNode.x, otherNode.y);
        ctx.stroke();
      }
    }
  }

  // Draw nodes as dots
  nodes.forEach((node) => {
    const dx = mousePos.x - node.x;
    const dy = mousePos.y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let radius = 1.5;
    let opacity = 0.2;

    if (distance < influence) {
      const effect = 1 - distance / influence;
      radius = 1.5 + effect * 2.5;
      opacity = 0.2 + effect * 0.3;
    }

    ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawInteractiveLines(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  mousePos: { x: number; y: number },
  influence: number,
  time: number,
  velocity: { x: number; y: number }
) {
  const spacing = 40;
  const nodes: Array<{ x: number; y: number; index: number }> = [];

  // Create nodes
  let nodeIndex = 0;
  for (let x = 0; x < canvas.width; x += spacing) {
    for (let y = 0; y < canvas.height; y += spacing) {
      nodes.push({ x, y, index: nodeIndex++ });
    }
  }

  // Calculate velocity magnitude for drag effect
  const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  const velocityNorm = velocityMagnitude > 0 ? { x: velocity.x / velocityMagnitude, y: velocity.y / velocityMagnitude } : { x: 0, y: 0 };

  // Draw connecting lines
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const dx = mousePos.x - node.x;
    const dy = mousePos.y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Auto-wave effect on lines (subtle)
    const wave = Math.sin(time * 2 + node.index * 0.2) * 0.5 + 0.5;

    // Drag offset based on cursor velocity and distance
    const dragDistance = Math.min(influence, Math.max(0, influence - distance));
    const dragForce = (dragDistance / influence) * velocityMagnitude * 0.1;
    const dragOffsetX = velocityNorm.x * dragForce;
    const dragOffsetY = velocityNorm.y * dragForce;

    // Connect to nearby nodes
    for (let j = i + 1; j < nodes.length; j++) {
      const otherNode = nodes[j];
      const dx2 = (otherNode.x + dragOffsetX) - (node.x + dragOffsetX);
      const dy2 = (otherNode.y + dragOffsetY) - (node.y + dragOffsetY);
      const nodeDist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (nodeDist < spacing * 1.5) {
        // Reduced opacity for subtle effect
        let opacity = 0.06 + wave * 0.03;
        let lineWidth = 0.8;

        const otherDist = Math.sqrt((mousePos.x - (otherNode.x + dragOffsetX)) ** 2 + (mousePos.y - (otherNode.y + dragOffsetY)) ** 2);
        if (distance < influence || otherDist < influence) {
          opacity = 0.12 + wave * 0.06;
          lineWidth = 1.2;
        }

        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(node.x + dragOffsetX, node.y + dragOffsetY);
        ctx.lineTo(otherNode.x + dragOffsetX, otherNode.y + dragOffsetY);
        ctx.stroke();
      }
    }
  }

  // Draw nodes - much smaller and subtle
  nodes.forEach((node) => {
    const dx = mousePos.x - node.x;
    const dy = mousePos.y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Drag offset for nodes
    const dragDistance = Math.min(influence, Math.max(0, influence - distance));
    const dragForce = (dragDistance / influence) * velocityMagnitude * 0.1;
    const dragOffsetX = velocityNorm.x * dragForce;
    const dragOffsetY = velocityNorm.y * dragForce;

    // Auto-pulse on nodes (subtle)
    const pulse = Math.sin(time * 2 + node.index * 0.15) * 0.5 + 0.5;

    let radius = 1 + pulse * 0.5;
    let opacity = 0.12 + pulse * 0.08;

    if (distance < influence) {
      const effect = 1 - distance / influence;
      radius += effect * 3;
      opacity += effect * 0.2;
    }

    ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`;
    ctx.beginPath();
    ctx.arc(node.x + dragOffsetX, node.y + dragOffsetY, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

