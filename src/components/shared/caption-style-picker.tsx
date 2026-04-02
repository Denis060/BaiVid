"use client";

import React, { useState, useMemo } from "react";
import { getAllCaptionStyles } from "@/lib/caption-styles";
import { CaptionPreview } from "./caption-preview";

interface CaptionStylePickerProps {
  selectedStyleId: string;
  onSelect: (styleId: string) => void;
  sampleText?: string;
  size?: "sm" | "md" | "lg";
}

export function CaptionStylePicker({
  selectedStyleId,
  onSelect,
  sampleText,
  size = "md",
}: CaptionStylePickerProps) {
  const styles = useMemo(() => getAllCaptionStyles(), []);
  const [isAnimating, setIsAnimating] = useState(true);

  return (
    <div className="w-full space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Caption Styles</h3>
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isAnimating ? "Pause" : "Play"} Preview
        </button>
      </div>

      {/* Grid of caption style previews - 4x3 or 3x4 responsive */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 px-4">
        {styles.map((style) => (
          <div key={style.id} className="flex flex-col gap-2">
            <CaptionPreview
              styleId={style.id}
              sampleText={sampleText}
              isPlaying={isAnimating}
              size={size === "lg" ? "md" : size}
              onSelect={onSelect}
              selected={selectedStyleId === style.id}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center line-clamp-2 h-8">
              {style.description}
            </p>
          </div>
        ))}
      </div>

      {/* Style details panel */}
      {styles.find((s) => s.id === selectedStyleId) && (
        <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <StyleDetailsPanel styleId={selectedStyleId} />
        </div>
      )}
    </div>
  );
}

function StyleDetailsPanel({ styleId }: { styleId: string }) {
  const styles = getAllCaptionStyles();
  const style = styles.find((s) => s.id === styleId);

  if (!style) return null;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{style.name}</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">{style.description}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Font</span>
          <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
            {style.fontFamily}
          </code>
        </div>

        <div>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Size</span>
          <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
            {style.fontSize}px
          </code>
        </div>

        <div>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Position</span>
          <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100 capitalize">
            {style.position}
          </code>
        </div>

        <div>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Primary Color</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: style.primaryColor }} />
            <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
              {style.primaryColor}
            </code>
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Secondary Color</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: style.secondaryColor }} />
            <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
              {style.secondaryColor}
            </code>
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Animation</span>
          <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100 capitalize">
            {style.animation}
          </code>
        </div>
      </div>

      {style.backgroundColor && (
        <div>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Background</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: style.backgroundColor }} />
            <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
              {style.backgroundColor}
            </code>
          </div>
        </div>
      )}

      {style.shotstack && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Shotstack Export</span>
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium">
              View export config
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto text-gray-900 dark:text-gray-100">
              {JSON.stringify(style.shotstack, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
