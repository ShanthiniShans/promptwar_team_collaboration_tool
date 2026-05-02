import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TaskCatalyst() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateTasks = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Determine backend URL
      const backendUrl = import.meta.env.DEV 
        ? 'http://localhost:8000/api/generate-tasks' 
        : '/api/generate-tasks';

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const tasks = data.tasks;

      // Add to Firestore
      const tasksCol = collection(db, 'tasks');
      for (const task of tasks) {
        await addDoc(tasksCol, {
          title: task.title,
          description: task.description || '',
          status: 'todo',
          createdAt: serverTimestamp()
        });
      }
      
      setPrompt('');
    } catch (err) {
      console.error(err);
      setError('Failed to generate tasks. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
          <Sparkles size={24} />
        </div>
        <h3 className="font-semibold text-xl text-indigo-100">Task Catalyst</h3>
      </div>
      
      <p className="text-indigo-200/80 text-sm mb-6">
        Describe your project or goal, and Gemini will automatically generate a structured task list.
      </p>

      <form onSubmit={generateTasks} className="flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., We need to launch a new marketing campaign for our summer sale..."
          className="w-full bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-3 text-indigo-100 placeholder:text-indigo-300/50 focus:outline-none focus:border-indigo-400 transition-colors resize-none min-h-[100px]"
        />
        
        {error && <div className="text-red-400 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Tasks
              <Sparkles size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
