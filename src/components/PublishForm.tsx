import React, { useState } from 'react';
import { Github, Lock, Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PublishForm() {
  const [pat, setPat] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pat || !name) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pat, name, description, isPrivate }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ success: true, message: 'Successfully published to GitHub!', url: data.url });
        setPat(''); // clear PAT for security
      } else {
        setResult({ success: false, message: data.error || 'Failed to publish repository.' });
      }
    } catch (err: any) {
      setResult({ success: false, message: 'Network error or unable to reach server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Publish Configuration
        </h2>
        <p className="text-slate-500 mt-1">
          Sync your AI Studio workspace directly to a GitHub repository.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-6">
          <div>
            <label htmlFor="pat" className="block text-sm font-semibold text-slate-700 mb-2">
              Personal Access Token
            </label>
            <input
              id="pat"
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              required
              className="w-full border border-slate-300 rounded-md bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-slate-500 mt-2">
              Requires `repo` scope. Get one from your <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">GitHub Settings</a>.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
              Repository Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-awesome-app"
              required
              className="w-full border border-slate-300 rounded-md bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors font-mono"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A cool application built in AI Studio"
              className="w-full border border-slate-300 rounded-md bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Visibility</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label
                className={`flex-1 flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                  !isPrivate ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  className="sr-only"
                />
                <Globe className={`w-5 h-5 shrink-0 mt-0.5 ${!isPrivate ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="ml-3">
                  <span className={`block text-sm font-semibold ${!isPrivate ? 'text-blue-900' : 'text-slate-700'}`}>Public</span>
                  <span className="block text-xs text-slate-500 mt-1">Anyone on the internet can see this repository.</span>
                </div>
              </label>

              <label
                className={`flex-1 flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                  isPrivate ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  className="sr-only"
                />
                <Lock className={`w-5 h-5 shrink-0 mt-0.5 ${isPrivate ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="ml-3">
                  <span className={`block text-sm font-semibold ${isPrivate ? 'text-blue-900' : 'text-slate-700'}`}>Private</span>
                  <span className="block text-xs text-slate-500 mt-1">You choose who can see and commit to this repository.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-lg flex items-start gap-3 mt-6 border ${result.success ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold">{result.message}</p>
              {result.url && (
                <a href={result.url} target="_blank" rel="noreferrer" className="text-sm underline font-semibold mt-1 inline-block text-blue-600">
                  View on GitHub &rarr;
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-6 mt-6 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading || !pat || !name}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-shadow shadow-md disabled:bg-blue-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish to GitHub'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
