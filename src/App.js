
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

      let sampleSource; // decide sampling source
    
      if (det) {
        // crop to the face box
        const { x, y, width, height } = det.box;
        const faceCanvas = document.createElement("canvas");
        faceCanvas.width  = width;
        faceCanvas.height = height;
        faceCanvas
          .getContext("2d")
          .drawImage(img, x, y, width, height, 0, 0, width, height);
        sampleSource = faceCanvas;
      
      } else {
        console.warn("No face detected – sampling full image");
        sampleSource = img;
      }
  
      const ct = new ColorThief(); // extract colours
      const [r, g, b] = ct.getColor(sampleSource);
      //const palette = ct.getPalette(img, 5);

      // simple threshold --> warm/cool/neutral 
      const tone = 
        r > b + 10 ? "warm":
        b > r + 10 ? "cool":
        "neutral";

      setUndertone(tone); // save the result
      setLoading(false); // Finish spinner — (important)
      setStep(2); // advance to suggestions
    };
    img.src = URL.createObjectURL(imageFile); // point at the actual file state
    })(); // invoke the IIFE
  }, [step, imageFile]);

  return (
    <div className="max-w-md mx-auto p-4">
      {step === 0 && (
        <UploadStep
          onFileSelect={file => {
            setImageFile(file);
            setLoading(true);
          }}
          goToAnalyze={() => setStep(1)}
        />
      )}

      {step === 1 && (
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

      {step === 2 && <SuggestStep undertone={undertone} />}

    </div>
  )};

export default App;
