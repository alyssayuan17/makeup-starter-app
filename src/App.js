
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
  const [skinType, setSkinType] = useState("normal"); // variable for skin type
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

      const canvas = canvasRef.current;
      
      let sampleSource;

      if (det) {
        // crop to face region
        const { x, y, width, height } = det.box;

        
        // target cheek region (adjust ratios as needed)
        const cheekX = x + width * 0.3; // target sampling areas more precisely
        const cheekY = y + height * 0.6;
        const cheekW = width * 0.2;
        const cheekH = height * 0.2;

        const sxInt = Math.max(0, Math.floor(cheekX));
        const syInt = Math.max(0, Math.floor(cheekY));
        const sWInt = Math.min(img.width - sxInt, Math.floor(cheekW));
        const sHInt = Math.min(img.height - syInt, Math.floor(cheekH));

        if (sWInt > 0 && sHInt > 0) {
          canvas.width = sWInt;
          canvas.height = sHInt;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, sWInt, sHInt);
          ctx.drawImage(img, sxInt, syInt, sWInt, sHInt, 0, 0, sWInt, sHInt);
          sampleSource = canvas;
          console.log("Sample source set (face):", canvas.width, canvas.height);
        }
      }

      if (!sampleSource) { // fallback to full image if no face or invalid box
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        sampleSource = canvas;
        console.log("Sample source set (fallback):", canvas.width, canvas.height);
      }

      // Validate canvas size before passing to ColorThief
      if (!sampleSource || sampleSource.width === 0 || sampleSource.height === 0) {
        console.error("Invalid canvas dimensions for ColorThief.");

        try {
          const ctx = sampleSource?.getContext("2d");
          const px = ctx?.getImageData(0, 0, 1, 1).data;
          console.log("Pixel data sample:", px);
        } catch (e) {
          console.warn("Failed to read pixel data:", e);
        }

        setError("Could not extract color – invalid canvas.");
        setLoading(false);
        return;
      } 

      try {
        //const ct = new ColorThief();
        const [r, g, b] = getAverageColorFromCanvas(sampleSource);
        console.log("Extracted RGB:", { r, g, b });
      
        const tone = r > b + 10 ? "warm" : b > r + 10 ? "cool" : "neutral";
        setUndertone(tone);
        setStep(2);
      } catch (err) {
        console.error("ColorThief error:", err);
        setError("Failed to extract color.");
      } 

      setLoading(false); // Finish spinner — (important)

      // cleanup object URL
      URL.revokeObjectURL(blobUrl);
    };
    img.src = blobUrl;
  }, [step, imageFile, modelLoaded]);

  function getAverageColorFromCanvas(canvas) { // custom solution
    const ctx = canvas.getContext("2d");
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
  
    return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
  }

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
          setSkinType = {setSkinType}
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
          <AnalyzeStep canvasRef={canvasRef} skinType={skinType} setSkinType={setSkinType} />
        )
      )}  

      {!error && step === 2 && <SuggestStep undertone={undertone} skinType={skinType}/>}
    </div>
  )};

export default App;
