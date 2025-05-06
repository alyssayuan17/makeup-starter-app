import React from 'react';

export default function AnalyzeStep({ canvasRef, skinType, setSkinType }) {
  return (
    <div>
      <h2>Analyzing…</h2>
      <canvas
        ref = {canvasRef}
        width = {200}
        height = {200}
        className="hidden"
      />
      <select
        className="border p-2 mt-4"
        value={skinType}
        onChange={e => setSkinType(e.target.value)}
      >
        <option value="normal">Normal</option>
        <option value="dry">Dry</option>
        <option value="oily">Oily</option>
        <option value="sensitive">Sensitive</option>
      </select>
    </div>
  );
}
