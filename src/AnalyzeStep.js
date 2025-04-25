import React from 'react';

export default function AnalyzeStep({ canvasRef }) {
  return (
    <>
      <h2>Analyzing…</h2>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        style={{ display: 'none' }}
      />
    </>
  );
}
