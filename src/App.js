
// import everything that is needed
import './App.css';
import React, { useState, useRef, useEffect } from "react";
import ColorThief from "colorthief";
import UploadStep   from "./UploadStep";
import AnalyzeStep  from "./AnalyzeStep";
import SuggestStep  from "./SuggestStep";
import products     from "./products.json";

function App() {
  // initialize state and refs
  const [step, setStep] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [undertone, setUndertone] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef();

  useEffect(() => { // set up useEffect for image analysis
    if (step !== 1 || !imageFile) return; // only run once you’ve got an image to analyze
  
    const img = new Image();
    img.crossOrigin = "anonymous"; // avoid CORS issues on canvas

    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
  
      const W = canvas.width; // make sure canvas has dimensions in the JSX
      const H = canvas.height;

      ctx.drawImage(img, 0, 0, W, H); // draw photo into hidden canvas (for analysis)
  
      const ct = new ColorThief(); // extract colours
      const [r, g, b] = ct.getColor(img);
      const palette = ct.getPalette(img, 5);

      // simple threshold --> warm/cool/neutral 
      const tone = 
        r > b + 10 ? "warm":
        b > r + 10 ? "cool":
        "neutral";

      setUndertone(tone); // save the result
      setStep(2); // advance to suggestions
      setLoading(false); // Finish spinner — (important)
    };
  
    // point at the actual file state
    img.src = URL.createObjectURL(imageFile);
  }, [step, imageFile]);

  return (
    <div className="max-w-md mx-auto p-4">
      {step === 0 && (
        <UploadStep
          onFileSelect = {setImageFile}
          goToAnalyze = {() => setStep(1)} // refers to step one once goToAnalyze is called in UploadStep
        />
      )}

      {step === 1 && (
        loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
            <p>Analyzing Image...</p>
          </div>
        ) : (
          <AnalyzeStep canvasRef={canvasRef} />
        )
      )}  

      {step === 2 && <SuggestStep undertone={undertone} />}

    </div>
  )};

export default App;
