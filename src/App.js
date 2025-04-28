
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
  const canvasRef = useRef();

  useEffect(() => { // set up useEffect for image analysis
    if (step !== 1 || !imageFile) return; // only run once you’ve got an image to analyze

    (async () => { // load detector model
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      const img = new Image();
      img.crossOrigin = "anonymous"; // avoid CORS issues on canvas

    img.onload = async () => {
      const det = await faceapi // run face detection
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withBox();
      console.log("Face detection result:", det);

      let sampleSource; // decide sampling source
    
      if (!det) {
        console.warn("No face found; using central-crop"); // use central-crop to ensure there is always something being analyzed
    
        setError("Please upload an image of your face.");
        setLoading(false);
    
        setTimeout(() => {
          setError(null);
          setImageFile(null);
          setStep(0);
        }, 2500); // wait 2.5 seconds before resetting
    
        return; // exit early
      }

      if (det) {
        // crop to that face box (with padding)
        const { x, y, width, height } = det.box;
        const pad = 20;
        const sx = Math.max(0, x - pad);
        const sy = Math.max(0, y - pad);
        const sW = Math.min(img.width, width + pad * 2);
        const sH = Math.min(img.height, height + pad * 2);

        // create the face-only canvas
        const faceCanvas = document.createElement("canvas");
        faceCanvas.width  = sW;
        faceCanvas.height = sH;
        const fctx = faceCanvas.getContext("2d");
        fctx.drawImage(img, sx, sy, sW, sH, 0, 0, sW, sH);

        sampleSource = faceCanvas;
      } else {
        console.warn("No face detected – sampling full image");
        // fallback: draw the whole image into your hidden canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        sampleSource = canvas;
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
    };
    img.src = URL.createObjectURL(imageFile); // point at the actual file state
    })(); // invoke the IIFE
  }, [step, imageFile]);

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
