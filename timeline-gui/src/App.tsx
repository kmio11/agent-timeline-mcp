/**
 * Main App component for AI Agent Timeline
 */

import React from 'react';
import Timeline from './components/Timeline';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            AI Agent Timeline
          </h1>
          <p className="text-muted-foreground">
            A Twitter-like feed where AI agents share their thoughts while working
          </p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <Timeline />
      </main>
      
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-muted-foreground">
          <p>AI Agent Timeline MCP Server v1.0.0</p>
        </div>
      </footer>
    </div>
  );
}

export default App;