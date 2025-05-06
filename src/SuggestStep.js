import React from 'react';
import products from './products.json';

export default function SuggestStep({ undertone, skinType }) {

  const filteredProducts = products.filter(
    p =>
      p.tone === undertone &&
      (!p.skinType || (Array.isArray(p.skinType) && p.skinType.includes(skinType)))
  );

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">
        Your undertone is <strong>{undertone}</strong>
      </h2>
      <div className="grid gap-4">
        {filteredProducts.length === 0 && (
          <p className="text-gray-500 italic">No products matched your profile.</p>
        )}
        {filteredProducts.map((p) => (
          <div key={p.id} className="border p-3 rounded shadow">
            <img
              src={p.img}
              alt={p.name}
              className="h-24 w-full object-cover rounded"
            />
            <p className="font-medium mt-2">{p.name}</p>
            {p.reason && (
              <p className="text-sm italic text-gray-600 mt-1">{p.reason}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
