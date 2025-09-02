import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResultsData, ImageFile } from '../types';
import Spinner from '../components/Spinner';
import Button from '../components/Button';

interface RankedImage extends ImageFile {
  votes: number;
}

const ResultsPage: React.FC = () => {
  const [voteCodes, setVoteCodes] = useState<string>('');
  const [rankedImages, setRankedImages] = useState<RankedImage[] | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCalculate = () => {
    setIsLoading(true);
    setError('');
    setRankedImages(null);

    if (!voteCodes.trim()) {
      setError('Please paste at least one vote code.');
      setIsLoading(false);
      return;
    }

    const codes = voteCodes.trim().split(/\s+/);
    const aggregatedVotes: { [imageId: string]: number } = {};
    let masterImages: ImageFile[] | null = null;

    try {
      for (const code of codes) {
        if (!code) continue;
        const pako = (window as any).pako;
        const compressed = atob(code);
        const decodedData = pako.inflate(compressed, { to: 'string' });
        const parsedData: ResultsData = JSON.parse(decodedData);
        
        if (!masterImages) {
          masterImages = parsedData.images;
        }

        for (const imageId in parsedData.userVotes) {
          if (Object.prototype.hasOwnProperty.call(parsedData.userVotes, imageId)) {
            const voteCount = parsedData.userVotes[imageId];
            aggregatedVotes[imageId] = (aggregatedVotes[imageId] || 0) + voteCount;
          }
        }
      }

      if (!masterImages) {
        throw new Error("No valid vote codes found.");
      }

      const finalRankings = masterImages
        .map(image => ({
          ...image,
          votes: aggregatedVotes[image.id] || 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      setRankedImages(finalRankings);

    } catch (e) {
      console.error(e);
      setError('An error occurred while decoding the vote codes. Please ensure they are correct and unmodified.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-black mb-2">Aggregate Voting Results</h2>
        <p className="text-gray-600">Paste the "Vote Codes" from all participants below to see the final combined ranking.</p>
      </div>

      <div className="bg-gray-50 p-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-black">1. Enter Vote Codes</h3>
        <textarea
          value={voteCodes}
          onChange={(e) => setVoteCodes(e.target.value)}
          placeholder="Paste vote codes here, separated by spaces or new lines..."
          className="bg-white text-black p-2 border border-gray-300 w-full h-40"
          aria-label="Vote codes input"
        />
        <div className="text-center mt-4">
          <Button onClick={handleCalculate} disabled={isLoading}>
            {isLoading ? 'Calculating...' : 'Calculate Final Ranking'}
          </Button>
        </div>
      </div>
      
      {error && <p className="text-center text-red-500">{error}</p>}

      {isLoading && <div className="py-4"><Spinner /></div>}
      
      {rankedImages && (
        <div className="bg-gray-50 p-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-black">2. Final Results</h3>
          {rankedImages.filter(img => img.votes > 0).length > 0 ? (
            <ol className="space-y-4">
              {rankedImages.map((image, index) => (
                <li key={image.id} className="flex items-center gap-4 bg-white p-3 border border-gray-200">
                  <span className="text-2xl font-bold text-blue-500 w-8 text-center">{index + 1}</span>
                  <img src={image.dataUrl} alt={image.name} className="w-20 h-20 object-cover" />
                  <div className="flex-grow">
                    <p className="font-semibold text-black truncate" title={image.name}>{image.name}</p>
                    <p className="text-sm text-gray-700">{image.votes} {image.votes === 1 ? 'vote' : 'votes'}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-center p-8">
              <h3 className="text-xl text-black">No votes were cast in the submitted codes.</h3>
            </div>
          )}
        </div>
      )}

      <div className="text-center mt-8">
        <Link to="/" className="text-blue-500 hover:text-blue-600 hover:underline">
          Start a new voting session
        </Link>
      </div>
    </div>
  );
};

export default ResultsPage;