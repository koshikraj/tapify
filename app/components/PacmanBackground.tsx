"use client";
import React, { useEffect, useRef } from "react";

const PacmanBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Function to resize canvas to fill the screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawPacmanPattern(ctx, canvas.width, canvas.height);
    };

    // Draw the Pac-Man pattern on the canvas
    const drawPacmanPattern = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      const pacmanRadius = 20;
      const gap = 50; // Space between patterns
      ctx.clearRect(0, 0, width, height);

      for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < width; x += gap) {
          drawPacman(ctx, x, y, pacmanRadius);
        }
      }
    };

    // Draw a single Pac-Man
    const drawPacman = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number
    ) => {
      // Pac-Man body
      ctx.beginPath();
      ctx.arc(x, y, radius, 0.2 * Math.PI, 1.8 * Math.PI);
      ctx.lineTo(x, y); // Close the mouth
      ctx.fillStyle = "#282b33";
      ctx.fill();
      ctx.closePath();

      // Pac-Man eye
      ctx.beginPath();
      ctx.arc(x, y - radius / 2, radius / 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.closePath();
    };

    // Attach event listener
    window.addEventListener("resize", resizeCanvas);

    // Initial setup
    resizeCanvas();

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,

        zIndex: -1,
        opacity: 0.3,
      }}
    />
  );
};

export default PacmanBackground;
