import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageFile, SessionData } from '../types';
import Button from '../components/Button';
import Spinner from '../components/Spinner';

const MAX_IMAGES = 99;

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      if (!event.target?.result) {
        return reject(new Error("Couldn't read file"));
      }
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const SetupPage: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [votesPerPerson, setVotesPerPerson] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [encodedData, setEncodedData] = useState<string>('');
  const navigate = useNavigate();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setError('');
    const files = event.target.files;
    if (!files) {
      setIsLoading(false);
      return;
    }

    if (files.length + images.length > MAX_IMAGES) {
      setError(`You can only upload a maximum of ${MAX_IMAGES} images.`);
      setIsLoading(false);
      return;
    }

    const imagePromises = Array.from(files).map(file => {
      return resizeImage(file).then(dataUrl => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        dataUrl,
      }));
    });

    try {
      const newImages = await Promise.all(imagePromises);
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      setError('There was an error processing the images. Some files might not be valid images.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [images.length]);
  
  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const generateLink = () => {
    if (images.length === 0 || votesPerPerson <= 0) {
      setError('Please upload at least one image and set a positive number of votes.');
      return;
    }
    setError('');
    const sessionData: SessionData = { images, votesPerPerson };
    const jsonString = JSON.stringify(sessionData);

    // Compress data to make URL shorter
    const pako = (window as any).pako;
    const compressed = pako.deflate(jsonString, { to: 'string' });
    const encoded = btoa(compressed);
    
    setEncodedData(encoded);
    const link = `${window.location.origin}${window.location.pathname}#/vote/${encoded}`;
    setGeneratedLink(link);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const startVoting = () => {
    if (encodedData) {
      navigate(`/vote/${encodedData}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-50 p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-black">1. Upload Images</h2>
        <div className="border-2 border-dashed border-gray-300 p-6 text-center">
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600
                  file:mr-4 file:py-2 file:px-4
                  file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-600"
                disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">Maximum {MAX_IMAGES} images. PNG, JPG, GIF accepted.</p>
        </div>
        {isLoading && <div className="mt-4"><Spinner /></div>}
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {images.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">{images.length} Image(s) Uploaded:</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-64 overflow-y-auto p-2 bg-gray-200">
              {images.map(image => (
                <div key={image.id} className="relative group">
                  <img src={image.dataUrl} alt={image.name} className="w-full h-24 object-cover" />
                  <button onClick={() => removeImage(image.id)} className="absolute top-1 right-1 bg-red-600 text-white h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-black">2. Set Votes</h2>
        <label htmlFor="votes-per-person" className="block text-gray-800 mb-2">Number of votes for each person:</label>
        <input
          id="votes-per-person"
          type="number"
          min="1"
          value={votesPerPerson}
          onChange={(e) => setVotesPerPerson(parseInt(e.target.value, 10))}
          className="bg-white text-black p-2 border border-gray-300 w-full md:w-1/3"
        />
      </div>

      <div className="text-center">
        <Button onClick={generateLink} disabled={images.length === 0 || votesPerPerson <= 0 || isLoading}>
          Generate Voting Link
        </Button>
      </div>

      {generatedLink && (
        <div className="bg-gray-50 p-6 border border-gray-200 mt-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-black">3. Share Your Link & Start!</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-gray-200 p-4">
            <input type="text" readOnly value={generatedLink} className="bg-white text-gray-800 p-2 border border-gray-300 w-full text-sm flex-grow" />
            <Button onClick={copyLink} variant="secondary">
              {isCopied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button onClick={startVoting}>
              Start Voting Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupPage;