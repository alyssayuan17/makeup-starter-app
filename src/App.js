
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
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
      const det = await faceapi.detectSingleFace(img, options);
      console.log("Detection result:", det);

      let sampleSource;
      let validBox = false;

      if (det) {
        // crop to face region
        const { x, y, width, height } = det.box;
        const pad = 20;

        const sx = x - pad;
        const sy = y - pad;
        const sW = width + pad * 2;
        const sH = height + pad * 2;

        const sxInt = Math.max(0, Math.floor(sx));
        const syInt = Math.max(0, Math.floor(sy));
        const sWInt = Math.min(img.width - sxInt, Math.floor(sW));
        const sHInt = Math.min(img.height - syInt, Math.floor(sH));
        // const sx = Math.max(0, Math.round(x - pad));
        // const sy = Math.max(0, Math.round(y - pad));
        // const sW = Math.min(img.width, Math.round(width + pad * 2));
        // const sH = Math.min(img.height, Math.round(height + pad * 2));

        if (sWInt > 0 && sHInt > 0) {
          const visibleCanvas = canvasRef.current;
          visibleCanvas.width = sWInt;
          visibleCanvas.height = sHInt;
          const ctx = visibleCanvas.getContext("2d");
          ctx.clearRect(0, 0, sWInt, sHInt);
          ctx.drawImage(img, sxInt, syInt, sWInt, sHInt, 0, 0, sWInt, sHInt);
          sampleSource = visibleCanvas;
        } else {
          console.warn("Invalid cropped dimensions:", { sWInt, sHInt });
        }
      }

      if (!validBox) {
        const full = canvasRef.current;
        full.width = img.width;
        full.height = img.height;
        const fctx = full.getContext("2d");
        fctx.clearRect(0, 0, full.width, full.height);
        fctx.drawImage(img, 0, 0, full.width, full.height);
        sampleSource = full;
      }

      // Validate canvas size before passing to ColorThief
      if (!sampleSource || sampleSource.width === 0 || sampleSource.height === 0) {
        console.error("Invalid canvas dimensions for ColorThief.");
      
        if (sampleSource) {
          // Only try to access context if sampleSource exists
          try {
            const ctx = sampleSource.getContext("2d");
            const px = ctx.getImageData(0, 0, 1, 1).data;
            console.log("Pixel data sample:", px);
          } catch (e) {
            console.warn("Failed to read pixel data:", e);
          }
        }
      
        setError("Could not extract color – invalid canvas.");
        setLoading(false);
        return;
      }


      try {
        const ct = new ColorThief();
        const [r, g, b] = ct.getColor(sampleSource);
        console.log("Extracted RGB:", { r, g, b });
    
        const tone = r > b + 10 ? "warm" : b > r + 10 ? "cool" : "neutral";
        setUndertone(tone);
        setStep(2);
      } catch (err) {
        console.error("ColorThief error:", err);
        setError("Failed to extract color.");
      }

      // const ct = new ColorThief(); // extract colours
      // const [r, g, b] = ct.getColor(sampleSource);
      // console.log("Raw skin RGB:", { r, g, b });
      // //const palette = ct.getPalette(img, 5);

      // // simple threshold --> warm/cool/neutral 
      // const tone = 
      //   r > b + 10 ? "warm":
      //   b > r + 10 ? "cool":
      //   "neutral";
      // console.log("Mapped tone:", tone);

      // setUndertone(tone); // save the result
      setLoading(false); // Finish spinner — (important)
      // setStep(2); // advance to suggestions

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
              className="invisible absolute"
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
