import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Trash2, Sparkles, Download } from 'lucide-react';

/**
 * ActiveTasks Component.
 * Fetches and displays a real-time list of tasks from Firestore.
 * Supports task completion toggling, deletion, and CSV exporting.
 *
 * @returns {JSX.Element} The rendered ActiveTasks list.
 */
export default function ActiveTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Toggles the completion status of a task in Firestore.
   * @param {Object} task - The task object to toggle.
   */
  const toggleStatus = async (task) => {
    const taskRef = doc(db, 'tasks', task.id);
    await updateDoc(taskRef, {
      status: task.status === 'todo' ? 'done' : 'todo'
    });
  };

  /**
   * Deletes a task from Firestore.
   * @param {string} id - The document ID of the task to delete.
   */
  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  /**
   * Triggers the backend export endpoint to download the task list as a CSV.
   */
  const syncToSheets = async () => {
    setExporting(true);
    try {
      const backendUrl = import.meta.env.DEV 
        ? 'http://localhost:8000/api/export-tasks' 
        : '/api/export-tasks';
      
      const response = await fetch(backendUrl);
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexus_tasks.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Export error", err);
      alert("Failed to export to Sheets/CSV.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-textSecondary animate-pulse" aria-live="polite">Loading tasks...</div>;
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Top Action Bar */}
      <div className="absolute -top-14 right-0 flex gap-2">
        <button 
          onClick={syncToSheets}
          disabled={exporting || tasks.length === 0}
          className="flex items-center gap-2 text-sm bg-green-900/40 text-green-300 hover:bg-green-800/60 border border-green-700/50 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          aria-label="Sync tasks to Google Sheets via CSV download"
        >
          <Download size={14} aria-hidden="true" />
          {exporting ? 'Syncing...' : 'Sync to Sheets'}
        </button>
      </div>

      <div 
        className="flex flex-col gap-3 overflow-y-auto h-full pr-2 mt-2" 
        role="list"
        aria-label="List of active tasks"
      >
        {tasks.length === 0 ? (
          <div className="text-textSecondary text-sm italic" role="listitem">No active tasks. Ask the Catalyst to generate some!</div>
        ) : (
          tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              role="listitem"
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                task.status === 'done' 
                  ? 'bg-surface/50 border-surface text-textSecondary' 
                  : task.isAI 
                    ? 'bg-surface border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-surface border-slate-700'
              }`}
            >
              <button 
                onClick={() => toggleStatus(task)} 
                className={`mt-0.5 transition-colors ${task.isAI ? 'text-purple-400 hover:text-purple-300' : 'text-primary hover:text-blue-400'}`}
                aria-label={`Mark task '${task.title}' as ${task.status === 'todo' ? 'done' : 'todo'}`}
              >
                {task.status === 'done' ? <CheckCircle size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`font-medium ${task.status === 'done' ? 'line-through opacity-70' : ''}`}>
                    {task.title}
                  </h4>
                  {task.isAI && task.status !== 'done' && (
                    <span 
                      className="text-[10px] uppercase font-bold flex items-center gap-1 bg-purple-900/50 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-md shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      title="Generated by AI"
                    >
                      <Sparkles size={10} aria-hidden="true" /> AI Generated
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm mt-1 opacity-80">{task.description}</p>
                )}
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="text-textSecondary hover:text-red-400 transition-colors opacity-50 hover:opacity-100"
                aria-label={`Delete task '${task.title}'`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
