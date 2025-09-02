import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { SessionData, ImageFile, ResultsData } from '../types';
import Button from '../components/Button';
import Spinner from '../components/Spinner';

const VotingPage: React.FC = () => {
  const { data } = useParams<{ data: string }>();
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [shuffledImages, setShuffledImages] = useState<ImageFile[]>([]);
  const [votes, setVotes] = useState<{ [imageId: string]: number }>({});
  const [remainingVotes, setRemainingVotes] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [resultsCode, setResultsCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!data) {
      setError('No voting data found.');
      return;
    }
    try {
      const pako = (window as any).pako;
      const compressed = atob(data);
      const decodedData = pako.inflate(compressed, { to: 'string' });
      const parsedData: SessionData = JSON.parse(decodedData);
      
      setSession(parsedData);
      setRemainingVotes(parsedData.votesPerPerson);
      
      const shuffled = [...parsedData.images].sort(() => Math.random() - 0.5);
      setShuffledImages(shuffled);
      
      const initialVotes = parsedData.images.reduce((acc, img) => {
        acc[img.id] = 0;
        return acc;
      }, {} as { [imageId: string]: number });
      setVotes(initialVotes);

    } catch (e) {
      setError('Invalid or corrupted voting link.');
      console.error(e);
    }
  }, [data]);

  const handleVote = useCallback((imageId: string) => {
    if (remainingVotes > 0) {
      setVotes(prev => ({ ...prev, [imageId]: (prev[imageId] || 0) + 1 }));
      setRemainingVotes(prev => prev - 1);
    }
  }, [remainingVotes]);

  const handleUnvote = useCallback((event: React.MouseEvent, imageId: string) => {
    event.preventDefault(); // Prevent context menu
    if (votes[imageId] > 0) {
      setVotes(prev => ({ ...prev, [imageId]: prev[imageId] - 1 }));
      setRemainingVotes(prev => prev + 1);
    }
  }, [votes]);

  const handleSubmit = () => {
    if (!session) return;
    const resultsData: ResultsData = {
      images: session.images,
      userVotes: votes,
    };
    const jsonString = JSON.stringify(resultsData);

    const pako = (window as any).pako;
    const compressed = pako.deflate(jsonString, { to: 'string' });
    const encodedResults = btoa(compressed);

    setResultsCode(encodedResults);
    setIsSubmitted(true);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(resultsCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (!session) {
    return <div className="text-center"><Spinner /></div>;
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center bg-gray-50 p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-black mb-4">Vote Submitted!</h2>
        <p className="text-gray-700 mb-4">
          Thank you for voting. Please copy the code below and send it to the person who organized this poll.
        </p>
        <div className="bg-gray-200 p-4 space-y-4">
          <textarea
            readOnly
            value={resultsCode}
            className="bg-white text-gray-800 p-2 border border-gray-300 w-full h-32 resize-none text-sm"
            aria-label="Your vote code"
          />
          <Button onClick={copyCode} variant="secondary">
            {isCopied ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          The session organizer will use this code to aggregate results from all participants.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-4 text-center sticky top-0 z-10 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-black">Remaining Votes: {remainingVotes}</h2>
        <p className="text-gray-600">Left-click to add a vote. Right-click to remove a vote.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {shuffledImages.map(image => (
          <div 
            key={image.id}
            className="relative cursor-pointer group overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
            onClick={() => handleVote(image.id)}
            onContextMenu={(e) => handleUnvote(e, image.id)}
          >
            <img src={image.dataUrl} alt={image.name} className="w-full h-auto object-cover aspect-square" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all"></div>
            {votes[image.id] > 0 && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white h-8 w-8 flex items-center justify-center font-bold text-lg border-2 border-white">
                {votes[image.id]}
              </div>
            )}
          </div>
        ))}
      </div>

      {remainingVotes === 0 && (
        <div className="text-center py-6">
          <Button onClick={handleSubmit} size="large">
            Submit Votes & Get Code
          </Button>
        </div>
      )}
    </div>
  );
};

export default VotingPage;