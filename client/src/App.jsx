import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ProblemDetail from './pages/ProblemDetail';
import PracticeForm from './pages/PracticeForm';
import EvaluationStatus from './pages/EvaluationStatus';
import FeedbackView from './pages/FeedbackView';
import AttemptHistory from './pages/AttemptHistory';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
            <Route path="/attempts/:id/practice" element={<PracticeForm />} />
            <Route path="/attempts/:id/evaluation" element={<EvaluationStatus />} />
            <Route path="/attempts/:id/feedback" element={<FeedbackView />} />
            <Route path="/history" element={<AttemptHistory />} />
            <Route
              path="*"
              element={
                <div className="page-container text-center py-20">
                  <h1 className="text-6xl font-black text-gray-700 mb-4">404</h1>
                  <p className="text-gray-500 mb-6">Page not found</p>
                  <a href="/" className="btn-primary inline-flex">Go Home</a>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
