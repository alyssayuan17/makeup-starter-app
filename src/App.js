
// import everything that is needed
import './App.css';
import React, { useState, useRef, useEffect } from "react";
import ColorThief from "colorthief";
import UploadStep   from "./UploadStep";
import AnalyzeStep  from "./AnalyzeStep";
import SuggestStep  from "./SuggestStep";
import products     from "./products.json";
import * as faceapi from "face-api.js"; // import for face detection

function App() {
  // initialize state and refs
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [undertone, setUndertone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false); // boolean to gate analysis behind a condition
  const canvasRef = useRef();

  useEffect(() => { // load face-api model once on mount
    faceapi.nets.tinyFaceDetector
      .loadFromUri("/models")
      .then(() => setModelLoaded(true)) // only set boolean to true when faceapi.nets.tinyFaceDetector.loadFromUri("/models") resolves
      .catch(err => console.error("Failed to load face-api model:", err));
  }, []);

  useEffect(() => { // analyze uploaded image when ready
    if (step !== 1 || !imageFile || !modelLoaded) return; // only run once you’ve got an image to analyze

    const img = new Image();
    img.crossOrigin = "anonymous"; // avoid CORS issues
    const blobUrl = URL.createObjectURL(imageFile);

    img.onload = async () => {
      // Run face detection
      const det = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withBox();
      console.log("Face detection result:", det);

      let sampleSource;

      if (det) {
        // crop to face region
        const { x, y, width, height } = det.box;
        const pad = 20;
        const sx = Math.max(0, x - pad);
        const sy = Math.max(0, y - pad);
        const sW = Math.min(img.width, width + pad * 2);
        const sH = Math.min(img.height, height + pad * 2);

        const faceCanvas = document.createElement("canvas");
        faceCanvas.width = sW;
        faceCanvas.height = sH;
        const fctx = faceCanvas.getContext("2d");
        fctx.drawImage(img, sx, sy, sW, sH, 0, 0, sW, sH);

        sampleSource = faceCanvas;
      } else {
        // fallback: use full image canvas
        console.warn("No face detected – sampling full image");
        const full = canvasRef.current;
        const fctx = full.getContext("2d");
        fctx.clearRect(0, 0, full.width, full.height);
        fctx.drawImage(img, 0, 0, full.width, full.height);
        sampleSource = full;
      }
  
      const ct = new ColorThief(); // extract colours
      const [r, g, b] = ct.getColor(sampleSource);
      console.log("Raw skin RGB:", { r, g, b });
      //const palette = ct.getPalette(img, 5);

      // simple threshold --> warm/cool/neutral 
      const tone = 
        r > b + 10 ? "warm":
        b > r + 10 ? "cool":
        "neutral";
      console.log("Mapped tone:", tone);

      setUndertone(tone); // save the result
      setLoading(false); // Finish spinner — (important)
      setStep(2); // advance to suggestions

      // cleanup object URL
      URL.revokeObjectURL(blobUrl);
    };
    img.src = blobUrl;
  }, [step, imageFile, modelLoaded]);

  return (
    <div className="max-w-md mx-auto p-4">
      {error && (
        <div className="text-center text-red-500 p-4">
          <h2>{error}</h2>
        </div>
      )}

      {!error && step === 0 && (
        <UploadStep
          onFileSelect={file => {
            setImageFile(file);
            setLoading(true);
          }}
          goToAnalyze={() => setStep(1)}
        />
      )}

      {!error && step === 1 && (
        loading ? (
          <div className="flex justify-center items-center h-64">
            <h2 className="mr-4">Analyzing…</h2>
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="hidden"
            />
          </div>
        ) : (
          <AnalyzeStep canvasRef={canvasRef} />
        )
      )}  

      {!error && step === 2 && <SuggestStep undertone={undertone} />}
    </div>
  )};

export default App;
