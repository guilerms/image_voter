import React from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import SetupPage from './pages/SetupPage';
import VotingPage from './pages/VotingPage';
import ResultsPage from './pages/ResultsPage';

const Header = () => (
  <header className="py-4 border-b border-gray-200">
    <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 md:px-8">
      <h1 className="text-2xl font-bold text-black">
        <Link to="/" className="hover:text-blue-600 transition-colors">Image Voting Priority</Link>
      </h1>
      <nav>
        <Link to="/results" className="text-blue-500 hover:text-blue-600 hover:underline font-semibold">
          Aggregate Results
        </Link>
      </nav>
    </div>
  </header>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-white text-black font-sans">
        <Header />
        <main className="container mx-auto p-4 sm:p-6 md:p-8">
          <Routes>
            <Route path="/" element={<SetupPage />} />
            <Route path="/vote/:data" element={<VotingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="text-center p-4 mt-8 border-t border-gray-200 text-gray-600 text-sm">
          <p>Created for collaborative decision-making.</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;