// Vercel build check: fixed parentElement version2
"use client";

import { useEffect, useRef } from "react";

type CodeRainProps = {
  className?: string;
};

export default function CodeRain({ className = "hero-canvas" }: CodeRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parentElement = canvas.parentElement;
    const ctx = canvas.getContext("2d");

    if (!parentElement || !ctx) return;

    let columns: Array<{
      y: number;
      speed: number;
      opacity: number;
      colorShift: number;
    }> = [];

    let fontSize = 17;
    let canvasWidth = 0;
    let canvasHeight = 0;

    const characters = "01{}[]<>/#$@AIUXSEOCLIENTPORTALWEBMEDIOSACCESIBLE";

    function resizeCanvas() {
      const rect = parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      canvasWidth = rect.width;
      canvasHeight = rect.height;
      fontSize = 17;

      const count = Math.floor(canvasWidth / fontSize);

      columns = Array.from({ length: count }, () => ({
        y: Math.random() * -canvasHeight,
        speed: 0.55 + Math.random() * 0.75,
        opacity: 0.1 + Math.random() * 0.65,
        colorShift: Math.random()
      }));
    }

    function drawCodeRain() {
      ctx.fillStyle = "rgba(3, 4, 11, 0.055)";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.font = `${fontSize}px Courier New`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const x = i * fontSize + fontSize / 2;
        const char = characters[Math.floor(Math.random() * characters.length)];

        if (col.colorShift > 0.985) {
          ctx.fillStyle = "rgba(255, 45, 255, 0.92)";
          ctx.shadowColor = "#ff2dff";
          ctx.shadowBlur = 14;
        } else if (col.colorShift > 0.94) {
          ctx.fillStyle = "rgba(0, 234, 255, 0.9)";
          ctx.shadowColor = "#00eaff";
          ctx.shadowBlur = 14;
        } else {
          ctx.fillStyle = `rgba(230, 240, 255, ${col.opacity})`;
          ctx.shadowBlur = 0;
        }

        ctx.fillText(char, x, col.y);

        col.y += fontSize * col.speed;

        if (col.y > canvasHeight + 80 && Math.random() > 0.965) {
          col.y = Math.random() * -260;
          col.speed = 0.55 + Math.random() * 0.75;
          col.opacity = 0.1 + Math.random() * 0.65;
          col.colorShift = Math.random();
        }
      }

      animationRef.current = requestAnimationFrame(drawCodeRain);
    }

    resizeCanvas();
    drawCodeRain();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
