
// import everything that is needed
import logo from './logo.svg';
import './App.css';
import React, { useState, useRef, useEffect } from "react";
import ColorThief from "colorthief";
import UploadStep   from "./UploadStep";
import AnalyzeStep  from "./AnalyzeStep";
import SuggestStep  from "./SuggestStep";
import products from "./products.json"; 

function App() {
  // initialize state and refs
  const [step, setStep] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [undertone, setUndertone] = useState(null);
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
      const [r, g, b] = ct.getColor(canvas);
      const palette = ct.getPalette(canvas, 5);

      // simple threshold --> warm/cool/neutral 
      const tone = 
        r > b + 10 ? "warm":
        b > r + 10 ? "cool":
        "neutral";

      setUndertone(tone); // save the result
      setStep(2); // advance to suggestions
    };
  
    // point at the actual file state
    img.src = URL.createObjectURL(imageFile);
  }, [step, imageFile]);

  return (
    <div className="max-w-md mx-auto p-4">
      {step === 0 && (
        <> {/*STEP 1: Upload*/}
          <h2>Upload a clear selfie</h2> {/*prompt user*/}
          <input
            type = "file"
            accept = "image/*"
            onChange = {e => {
              const f = e.target.files?.[0];
              if (f) {
                setImageFile(f);
                setStep(1); //set to step 1
              }
            }}
          />
        </>
      )}

      {step === 1 && (
        <> {/* STEP 2: Analyzing Image*/}
          <h2>Analyzing…</h2>
          <canvas ref={canvasRef} width={200} height={200} className="hidden"/>
        </>
      )}

      {step === 2 && (
        <> {/* STEP 3: Suggestions */}
        <h2>Your undertone is <strong>{undertone}</strong></h2>
        <div className = "grid gap-4">
          {products
            .filter (p => p.tone === undertone)
            .map(p => (
              <div key = {p.id} className = "border p-2 rounded">
                <img src = {p.img} alt = {p.name} className = "h-24 w-full object-cover"/>
                <p>{p.name}</p>
              </div>
            ))
          }
        </div>
      </>
    )}
  </div>
)};

export default App;
