import React, { useState } from 'react';

export default function OptimizedImage({ src, alt, className = '', width, height, objectFit = 'cover' }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!src) return <div className={`${className} bg-gray-200 animate-pulse`} />;

  return (
    <div className="relative overflow-hidden">
      {isLoading && <div className={`${className} bg-gray-200 animate-pulse absolute inset-0`} />}
      <img
        src={src}
        alt={alt}
        className={`${className} ${error ? 'hidden' : ''}`}
        loading="lazy"
        width={width}
        height={height}
        style={{ objectFit }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
      />
      {error && <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-400`}>Image failed to load</div>}
    </div>
  );
}