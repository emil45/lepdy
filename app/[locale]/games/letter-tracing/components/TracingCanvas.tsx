'use client';

/**
 * TracingCanvas Component
 *
 * Uses pixel-based validation:
 * 1. Renders letter as guide
 * 2. Creates hidden mask of letter
 * 3. Checks if user draws ON the letter (pixel detection)
 * 4. Tracks coverage percentage
 */

import React, { useRef, useEffect, useCallback, memo, useState } from 'react';
import { Box } from '@mui/material';

interface TracingCanvasProps {
  /** Canvas size in pixels */
  size: number;
  /** Letter to display as guide */
  letterName: string;
  /** Letter color for drawing */
  letterColor: string;
  /** Required coverage percentage (0-100) */
  requiredCoverage: number;
  /** Stroke width for drawing */
  strokeWidth: number;
  /** Whether letter is complete */
  isComplete: boolean;
  /** Callback when coverage changes */
  onCoverageChange: (coverage: number) => void;
  /** Callback when letter is completed */
  onComplete: () => void;
  /** Callback to reset (exposed via ref or prop) */
  onReset?: () => void;
}

// Letter font size relative to canvas
const LETTER_FONT_RATIO = 0.55;

function TracingCanvasComponent({
  size,
  letterName,
  letterColor,
  requiredCoverage,
  strokeWidth,
  isComplete,
  onCoverageChange,
  onComplete,
}: TracingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const letterPixelCountRef = useRef(0);
  const coveredPixelsRef = useRef(new Set<number>());
  const hasCompletedRef = useRef(false);

  // Create letter mask and draw guide
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !maskCtx) return;

    const fontSize = size * LETTER_FONT_RATIO;

    // Clear both canvases
    ctx.clearRect(0, 0, size, size);
    maskCtx.clearRect(0, 0, size, size);

    // Draw letter guide (visible, faded)
    ctx.save();
    ctx.fillStyle = 'rgba(180, 180, 180, 0.5)';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letterName, size / 2, size / 2);
    ctx.restore();

    // Draw letter mask (hidden, for hit detection)
    maskCtx.fillStyle = '#000000';
    maskCtx.font = `bold ${fontSize}px Arial`;
    maskCtx.textAlign = 'center';
    maskCtx.textBaseline = 'middle';
    maskCtx.fillText(letterName, size / 2, size / 2);

    // Count letter pixels
    const maskData = maskCtx.getImageData(0, 0, size, size);
    let count = 0;
    for (let i = 3; i < maskData.data.length; i += 4) {
      if (maskData.data[i] > 128) count++;
    }
    letterPixelCountRef.current = count;
    coveredPixelsRef.current.clear();
    hasCompletedRef.current = false;
  }, [size, letterName]);

  // Setup on mount and letter change
  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  // Reset when letter changes
  useEffect(() => {
    coveredPixelsRef.current.clear();
    hasCompletedRef.current = false;
    onCoverageChange(0);
  }, [letterName, onCoverageChange]);

  // Mark pixels as covered and update progress
  const markPixelsCovered = useCallback((x: number, y: number) => {
    if (hasCompletedRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) return;

    // Check pixels in stroke radius around point
    const radius = strokeWidth / 2;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const px = Math.floor(x + dx);
          const py = Math.floor(y + dy);

          if (px >= 0 && px < size && py >= 0 && py < size) {
            const pixel = maskCtx.getImageData(px, py, 1, 1);
            if (pixel.data[3] > 128) {
              const pixelIndex = py * size + px;
              coveredPixelsRef.current.add(pixelIndex);
            }
          }
        }
      }
    }

    // Calculate coverage
    if (letterPixelCountRef.current > 0) {
      const coverage = (coveredPixelsRef.current.size / letterPixelCountRef.current) * 100;
      onCoverageChange(Math.min(100, Math.round(coverage)));

      // Check completion
      if (coverage >= requiredCoverage && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
    }
  }, [size, strokeWidth, requiredCoverage, onCoverageChange, onComplete]);

  // Draw stroke on canvas
  const drawStroke = useCallback((fromX: number, fromY: number, toX: number, toY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = letterColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Mark covered pixels along the line
    const dist = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
    const steps = Math.max(1, Math.ceil(dist / 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = fromX + (toX - fromX) * t;
      const y = fromY + (toY - fromY) * t;
      markPixelsCovered(x, y);
    }
  }, [letterColor, strokeWidth, markPixelsCovered]);

  // Get coordinates from event
  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Event handlers
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isComplete) return;
    e.preventDefault();

    const coords = getCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPointRef.current = coords;

    // Draw dot at start
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = letterColor;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        markPixelsCovered(coords.x, coords.y);
      }
    }
  }, [isComplete, getCoords, letterColor, strokeWidth, markPixelsCovered]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isComplete) return;
    e.preventDefault();

    const coords = getCoords(e);
    if (!coords || !lastPointRef.current) return;

    drawStroke(lastPointRef.current.x, lastPointRef.current.y, coords.x, coords.y);
    lastPointRef.current = coords;
  }, [isDrawing, isComplete, getCoords, drawStroke]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  // Expose reset function
  useEffect(() => {
    // Reset function is now handled by setupCanvas being called on letterName change
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        backgroundColor: isComplete ? '#E8F5E9' : '#FFFFFF',
        overflow: 'hidden',
        touchAction: 'none',
        transition: 'background-color 0.3s',
      }}
    >
      {/* Hidden mask canvas */}
      <canvas
        ref={maskCanvasRef}
        width={size}
        height={size}
        style={{ display: 'none' }}
      />

      {/* Main drawing canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          cursor: isComplete ? 'default' : 'crosshair',
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {/* Success overlay */}
      {isComplete && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              fontSize: size * 0.25,
              color: 'rgba(0,0,0,0.7)',
            }}
          >
            ✓
          </Box>
        </Box>
      )}
    </Box>
  );
}

export const TracingCanvas = memo(TracingCanvasComponent);
