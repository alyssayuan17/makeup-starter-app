import React from 'react';
import products from './products.json';

export default function SuggestStep({ undertone }) {
  return (
    <>
      <h2>Your undertone is <strong>{undertone}</strong></h2>
      <div className="grid gap-4">
        {products // refer to products.json, identified tones
          .filter(p => p.tone === undertone)
          .map(p => (
            <div key = {p.id} className = "border p-2 rounded">
              <img
                src = {p.img} // placeholder; subject to change
                alt = {p.name}
                className = "h-24 w-full object-cover"
              />
              <p>{p.name}</p>
            </div>
          ))
        }
      </div>
    </>
  );
}
