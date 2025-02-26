import React, { useEffect, useRef } from 'react';

interface AudioLevelMeterProps {
  mediaStream: MediaStream | null;
}

export function AudioLevelMeter({ mediaStream }: AudioLevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const splitterRef = useRef<ChannelSplitterNode>();
  const audioContextRef = useRef<AudioContext>();

  useEffect(() => {
    if (!mediaStream) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const splitter = audioContext.createChannelSplitter(2);
    const leftAnalyser = audioContext.createAnalyser();
    const rightAnalyser = audioContext.createAnalyser();
    leftAnalyser.fftSize = 256;
    rightAnalyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(splitter);
    splitter.connect(leftAnalyser, 0);
    splitter.connect(rightAnalyser, 1);

    audioContextRef.current = audioContext;
    splitterRef.current = splitter;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    ctx.scale(dpr, dpr);

    const bufferLength = leftAnalyser.frequencyBinCount;
    const leftData = new Uint8Array(bufferLength);
    const rightData = new Uint8Array(bufferLength);

    const drawMeter = (x: number, width: number, height: number, volume: number, label: string) => {
      // Draw background
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x, 0, width, height);

      // Draw meter
      const gradient = ctx.createLinearGradient(x, 0, x + (width * volume), 0);
      gradient.addColorStop(0, '#818cf8');
      gradient.addColorStop(1, '#4f46e5');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, width * volume, height);

      // Draw peak markers
      if (volume > 0.8) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + (width * 0.8), 0, width * 0.2, height);
      }

      // Draw channel label
      ctx.save();
      ctx.fillStyle = '#475569';
      ctx.font = '600 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add a subtle background for better readability
      const textWidth = ctx.measureText(label).width;
      const padding = 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        x + width / 2 - textWidth / 2 - padding,
        height / 2 - 8,
        textWidth + padding * 2,
        16
      );
      
      ctx.fillStyle = '#475569';
      ctx.fillText(label, x + width / 2, height / 2);
      ctx.restore();
    };

    const draw = () => {
      if (!ctx) return;

      const rect = container.getBoundingClientRect();
      const displayWidth = rect.width;

      animationFrameRef.current = requestAnimationFrame(draw);

      leftAnalyser.getByteFrequencyData(leftData);
      rightAnalyser.getByteFrequencyData(rightData);
      
      ctx.clearRect(0, 0, displayWidth, rect.height);

      const leftAverage = leftData.reduce((acc, val) => acc + val, 0) / bufferLength;
      const rightAverage = rightData.reduce((acc, val) => acc + val, 0) / bufferLength;
      
      const leftVolume = Math.min(leftAverage / 128, 1);
      const rightVolume = Math.min(rightAverage / 128, 1);

      const meterWidth = (displayWidth - 4) / 2;
      const meterHeight = rect.height;

      drawMeter(0, meterWidth, meterHeight, leftVolume, 'L');
      drawMeter(meterWidth + 4, meterWidth, meterHeight, rightVolume, 'R');

      const stereoDiff = Math.abs(leftVolume - rightVolume);
      if (stereoDiff > 0.1) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(displayWidth - 4, 0, 4, 4);
      }
    };

    draw();

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      ctx.scale(dpr, dpr);
    });

    resizeObserver.observe(container);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
      source.disconnect();
      splitter.disconnect();
      leftAnalyser.disconnect();
      rightAnalyser.disconnect();
      audioContext.close();
    };
  }, [mediaStream]);

  return (
    <div ref={containerRef} className="w-full h-8 bg-slate-100 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}