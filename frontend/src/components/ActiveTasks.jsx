import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';

export default function ActiveTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const toggleStatus = async (task) => {
    const taskRef = doc(db, 'tasks', task.id);
    await updateDoc(taskRef, {
      status: task.status === 'todo' ? 'done' : 'todo'
    });
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  if (loading) {
    return <div className="text-textSecondary animate-pulse">Loading tasks...</div>;
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full pr-2">
      {tasks.length === 0 ? (
        <div className="text-textSecondary text-sm italic">No active tasks. Ask the Catalyst to generate some!</div>
      ) : (
        tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              task.status === 'done' 
                ? 'bg-surface/50 border-surface text-textSecondary' 
                : 'bg-surface border-slate-700'
            }`}
          >
            <button onClick={() => toggleStatus(task)} className="mt-0.5 text-primary hover:text-blue-400 transition-colors">
              {task.status === 'done' ? <CheckCircle size={20} /> : <Circle size={20} />}
            </button>
            <div className="flex-1">
              <h4 className={`font-medium ${task.status === 'done' ? 'line-through' : ''}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm mt-1 opacity-80">{task.description}</p>
              )}
            </div>
            <button 
              onClick={() => deleteTask(task.id)}
              className="text-textSecondary hover:text-red-400 transition-colors opacity-50 hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </motion.div>
        ))
      )}
    </div>
  );
}
