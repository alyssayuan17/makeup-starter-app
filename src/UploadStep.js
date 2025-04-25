import React from 'react';

export default function UploadStep({ onFileSelect, goToAnalyze }) {
  return (
    <>
      <h2>Upload a clear selfie</h2>
      <input
        type = "file"
        accept = "image/*"
        onChange = {e => {
          const f = e.target.files?.[0];
          if (f) {
            onFileSelect(f);
            goToAnalyze();
          }
        }}
      />
    </>
  );
}
