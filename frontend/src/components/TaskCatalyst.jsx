import { useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Sparkles, Loader2, ImagePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskCatalyst() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateTasks = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !imageFile) return;

    setLoading(true);
    setError('');

    try {
      let endpoint = '/api/generate-tasks';
      let payload = { prompt };

      if (imageFile) {
        endpoint = '/api/generate-tasks-vision';
        // Base64 encode without the data URL prefix
        const base64Data = imagePreview.split(',')[1];
        payload = {
          prompt,
          image_base64: base64Data,
          mime_type: imageFile.type
        };
      }

      const backendUrl = import.meta.env.DEV 
        ? `http://localhost:8000${endpoint}` 
        : endpoint;

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
          isAI: true,
          createdAt: serverTimestamp()
        });
      }
      
      setPrompt('');
      clearImage();
    } catch (err) {
      console.error(err);
      setError('Failed to generate tasks. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
          <Sparkles size={24} />
        </div>
        <h3 className="font-semibold text-xl text-indigo-100">Task Catalyst</h3>
      </div>
      
      <p className="text-indigo-200/80 text-sm mb-6 relative z-10">
        Describe your project or upload whiteboard notes, and Gemini will generate a structured task list.
      </p>

      <form onSubmit={generateTasks} className="flex flex-col gap-3 flex-1 relative z-10">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., We need to launch a new marketing campaign..."
          className="w-full bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-3 text-indigo-100 placeholder:text-indigo-300/50 focus:outline-none focus:border-indigo-400 transition-colors resize-none flex-1 min-h-[100px]"
        />
        
        <AnimatePresence>
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative w-fit"
            >
              <img src={imagePreview} alt="Upload preview" className="h-24 rounded-xl border border-indigo-500/50 object-cover" />
              <button 
                type="button" 
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors border border-slate-600"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-500/30 text-indigo-300 p-3 rounded-xl transition-colors flex items-center justify-center"
            title="Upload Image"
          >
            <ImagePlus size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <button
            type="submit"
            disabled={loading || (!prompt.trim() && !imageFile)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center gap-2"
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
        </div>
      </form>
    </div>
  );
}
