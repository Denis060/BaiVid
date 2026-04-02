"use client";

import React, { useState, useEffect } from "react";
import { getCaptionStyle } from "@/lib/caption-styles";
import { Play } from "lucide-react";

interface CaptionPreviewProps {
  styleId: string;
  sampleText?: string;
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
  onSelect?: (styleId: string) => void;
  selected?: boolean;
}

const SAMPLE_TEXT = "Baivid makes video creation easy";

const sizeClasses = {
  sm: "h-32 w-full",
  md: "h-48 w-full",
  lg: "h-64 w-full",
};

const styleSizes = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function CaptionPreview({
  styleId,
  sampleText = SAMPLE_TEXT,
  isPlaying = true,
  size = "md",
  onSelect,
  selected = false,
}: CaptionPreviewProps) {
  const style = getCaptionStyle(styleId);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isPlaying]);

  if (!style) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <p className="text-gray-500 text-sm">Style not found</p>
      </div>
    );
  }

  const wordList = sampleText.split(" ");
  const fontSize = styleSizes[size];
  const animationDuration = Math.max(2, wordList.length * 0.3);

  const getAnimationStyles = () => {
    const baseStyles = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes popupScale {
        0% { transform: scale(0); opacity: 0; }
        70% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes bounceIn {
        0% { transform: translateY(-30px); opacity: 0; }
        50% { opacity: 1; }
        70% { transform: translateY(5px); }
        100% { transform: translateY(0); }
      }

      @keyframes neonPulse {
        0%, 100% { text-shadow: 0 0 10px #0a7c4e, 0 0 20px #0a7c4e; }
        50% { text-shadow: 0 0 20px #0a7c4e, 0 0 40px #0a7c4e, 0 0 60px #0a7c4e; }
      }

      @keyframes fireGradient {
        0%, 100% { background-position: 0% center; }
        50% { background-position: 100% center; }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }

      @keyframes slideInLeft {
        from { transform: translateX(-30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes highlightPulse {
        0%, 100% { background-color: transparent; }
        50% { background-color: rgba(255, 235, 59, 0.3); }
      }

      @keyframes typewriterBlink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }

      @keyframes karaokeLighten {
        0% { color: rgba(255, 255, 255, 0.3); }
        100% { color: #0a7c4e; }
      }
    `;

    switch (styleId) {
      case "highlight":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            color: white;
            margin: 0 4px;
            font-weight: 500;
            animation: fadeIn 0.3s ease-out forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.3s; }
          .caption-word:nth-child(3) { animation-delay: 0.6s; }
          .caption-word:nth-child(4) { animation-delay: 0.9s; }
          .caption-word:nth-child(5) { animation-delay: 1.2s; }
          .caption-word:nth-child(6) { animation-delay: 1.5s; }
          .caption-word:nth-child(7) { animation-delay: 1.8s; }
          .caption-word:nth-child(8) { animation-delay: 2.1s; }
          .caption-word:nth-child(9) { animation-delay: 2.4s; }
        `;

      case "karaoke":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            color: rgba(255, 255, 255, 0.4);
            margin: 0 4px;
            font-weight: 600;
            animation: karaokeLighten 0.2s ease-out forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.3s; }
          .caption-word:nth-child(3) { animation-delay: 0.6s; }
          .caption-word:nth-child(4) { animation-delay: 0.9s; }
          .caption-word:nth-child(5) { animation-delay: 1.2s; }
          .caption-word:nth-child(6) { animation-delay: 1.5s; }
          .caption-word:nth-child(7) { animation-delay: 1.8s; }
          .caption-word:nth-child(8) { animation-delay: 2.1s; }
          .caption-word:nth-child(9) { animation-delay: 2.4s; }
        `;

      case "typewriter":
        return `
          ${baseStyles}
          .caption-container {
            text-align: center;
            font-family: 'Courier New', monospace;
          }
          .caption-text {
            color: white;
            display: inline-block;
            border-right: 2px solid #00FF00;
            animation: typewriterBlink 0.7s step-end infinite;
          }
        `;

      case "popup":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            color: white;
            margin: 0 4px;
            font-weight: 600;
            animation: popupScale 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.2s; }
          .caption-word:nth-child(3) { animation-delay: 0.4s; }
          .caption-word:nth-child(4) { animation-delay: 0.6s; }
          .caption-word:nth-child(5) { animation-delay: 0.8s; }
          .caption-word:nth-child(6) { animation-delay: 1s; }
          .caption-word:nth-child(7) { animation-delay: 1.2s; }
          .caption-word:nth-child(8) { animation-delay: 1.4s; }
          .caption-word:nth-child(9) { animation-delay: 1.6s; }
        `;

      case "fade":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            color: white;
            margin: 0 4px;
            animation: fadeIn 0.5s ease-out forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.35s; }
          .caption-word:nth-child(3) { animation-delay: 0.7s; }
          .caption-word:nth-child(4) { animation-delay: 1.05s; }
          .caption-word:nth-child(5) { animation-delay: 1.4s; }
          .caption-word:nth-child(6) { animation-delay: 1.75s; }
          .caption-word:nth-child(7) { animation-delay: 2.1s; }
          .caption-word:nth-child(8) { animation-delay: 2.45s; }
          .caption-word:nth-child(9) { animation-delay: 2.8s; }
        `;

      case "bounce":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            color: white;
            margin: 0 4px;
            font-weight: 600;
            animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.25s; }
          .caption-word:nth-child(3) { animation-delay: 0.5s; }
          .caption-word:nth-child(4) { animation-delay: 0.75s; }
          .caption-word:nth-child(5) { animation-delay: 1s; }
          .caption-word:nth-child(6) { animation-delay: 1.25s; }
          .caption-word:nth-child(7) { animation-delay: 1.5s; }
          .caption-word:nth-child(8) { animation-delay: 1.75s; }
          .caption-word:nth-child(9) { animation-delay: 2s; }
        `;

      case "neon":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-text {
            color: white;
            font-weight: bold;
            text-shadow: 0 0 10px #0a7c4e, 0 0 20px #0a7c4e;
            animation: neonPulse 1.5s ease-in-out infinite;
          }
        `;

      case "fire":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-text {
            font-weight: bold;
            background: linear-gradient(90deg, #FF6B35, #FF3D00, #FF6B35);
            background-size: 200% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: fireGradient 2s ease-in-out infinite;
          }
        `;

      case "split":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            position: relative;
            margin: 0 4px;
            font-weight: 600;
            color: white;
            animation: fadeIn 0.3s ease-out forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.3s; }
          .caption-word:nth-child(3) { animation-delay: 0.6s; }
          .caption-word:nth-child(4) { animation-delay: 0.9s; }
          .caption-word:nth-child(5) { animation-delay: 1.2s; }
          .caption-word:nth-child(6) { animation-delay: 1.5s; }
          .caption-word:nth-child(7) { animation-delay: 1.8s; }
          .caption-word:nth-child(8) { animation-delay: 2.1s; }
          .caption-word:nth-child(9) { animation-delay: 2.4s; }
          .caption-word::before {
            content: attr(data-half);
            position: absolute;
            left: 0;
            color: #0a7c4e;
            width: 50%;
            overflow: hidden;
          }
        `;

      case "shake":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            color: white;
            margin: 0 4px;
            font-weight: 600;
            animation: shake 0.4s ease-in-out, fadeIn 0.3s ease-out forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.25s; }
          .caption-word:nth-child(3) { animation-delay: 0.5s; }
          .caption-word:nth-child(4) { animation-delay: 0.75s; }
          .caption-word:nth-child(5) { animation-delay: 1s; }
          .caption-word:nth-child(6) { animation-delay: 1.25s; }
          .caption-word:nth-child(7) { animation-delay: 1.5s; }
          .caption-word:nth-child(8) { animation-delay: 1.75s; }
          .caption-word:nth-child(9) { animation-delay: 2s; }
        `;

      case "slidein":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            color: white;
            margin: 0 4px;
            font-weight: 600;
            animation: slideInLeft 0.5s ease-out forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.15s; }
          .caption-word:nth-child(3) { animation-delay: 0.3s; }
          .caption-word:nth-child(4) { animation-delay: 0.45s; }
          .caption-word:nth-child(5) { animation-delay: 0.6s; }
          .caption-word:nth-child(6) { animation-delay: 0.75s; }
          .caption-word:nth-child(7) { animation-delay: 0.9s; }
          .caption-word:nth-child(8) { animation-delay: 1.05s; }
          .caption-word:nth-child(9) { animation-delay: 1.2s; }
        `;

      case "wordbox":
        return `
          ${baseStyles}
          .caption-container { text-align: center; }
          .caption-word {
            display: inline-block;
            color: white;
            background-color: #0a7c4e;
            padding: 4px 10px;
            border-radius: 16px;
            margin: 4px;
            font-weight: 600;
            animation: popupScale 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          }
          .caption-word:nth-child(1) { animation-delay: 0s; }
          .caption-word:nth-child(2) { animation-delay: 0.15s; }
          .caption-word:nth-child(3) { animation-delay: 0.3s; }
          .caption-word:nth-child(4) { animation-delay: 0.45s; }
          .caption-word:nth-child(5) { animation-delay: 0.6s; }
          .caption-word:nth-child(6) { animation-delay: 0.75s; }
          .caption-word:nth-child(7) { animation-delay: 0.9s; }
          .caption-word:nth-child(8) { animation-delay: 1.05s; }
          .caption-word:nth-child(9) { animation-delay: 1.2s; }
        `;

      default:
        return baseStyles;
    }
  };

  const renderContent = () => {
    switch (styleId) {
      case "typewriter":
        return (
          <div className="caption-text" key={animationKey}>
            {sampleText}
          </div>
        );

      case "neon":
      case "fire":
        return (
          <div className="caption-text" key={animationKey}>
            {sampleText}
          </div>
        );

      case "split":
        return (
          <div className="caption-container" key={animationKey}>
            {wordList.map((word, idx) => (
              <span key={idx} className="caption-word" data-half={word.substring(0, Math.ceil(word.length / 2))}>
                {word}
              </span>
            ))}
          </div>
        );

      default:
        return (
          <div className="caption-container" key={animationKey}>
            {wordList.map((word, idx) => (
              <span key={idx} className="caption-word">
                {word}
              </span>
            ))}
          </div>
        );
    }
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-black cursor-pointer transition-all ${
        selected ? "ring-2 ring-[#0a7c4e]" : "ring-1 ring-gray-700"
      } hover:ring-[#0a7c4e] ${sizeClasses[size]}`}
      onClick={() => onSelect?.(styleId)}
      role="button"
      tabIndex={0}
    >
      <style key={`style-${animationKey}`}>{getAnimationStyles()}</style>

      <div
        className="h-full w-full flex flex-col items-center justify-center p-4"
        style={{ fontSize: `${fontSize}px` }}
      >
        {renderContent()}
      </div>

      {isPlaying && (
        <div className="absolute top-2 right-2 bg-[#0a7c4e]/80 rounded-full p-1 text-white">
          <Play size={12} fill="white" />
        </div>
      )}

      <p className="absolute bottom-2 left-0 right-0 text-center text-xs font-medium text-gray-400 pointer-events-none">
        {style.name}
      </p>
    </div>
  );
}
