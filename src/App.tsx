/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PublishForm from './components/PublishForm';
import { Github } from 'lucide-react';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <Github className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">AI Studio <span className="text-slate-400 mx-1">/</span> GitHub Publisher</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-8 overflow-y-auto w-full flex justify-center">
          <PublishForm />
        </main>
      </div>
    </div>
  );
}
