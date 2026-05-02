import { motion } from 'framer-motion';
import AuthButton from './components/AuthButton';
import ActiveTasks from './components/ActiveTasks';
import TeamChat from './components/TeamChat';
import TaskCatalyst from './components/TaskCatalyst';

/**
 * Main Application Component for Nexus AI.
 * Defines the Bento-Grid layout using semantic HTML sections for WCAG compliance.
 *
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            role="img"
            aria-label="Nexus AI Logo"
          >
            N
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nexus AI</h1>
        </div>
        <AuthButton />
      </header>

      {/* Bento Grid Layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]" role="main">
        
        {/* Active Tasks - Span 8 cols */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="md:col-span-8 md:row-span-2 bg-surface/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 flex flex-col shadow-xl"
          aria-labelledby="active-tasks-heading"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 id="active-tasks-heading" className="text-xl font-semibold">Active Tasks</h2>
            <div 
              className="flex items-center gap-2 text-sm text-textSecondary bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700"
              aria-live="polite"
              title="Tasks are syncing in real-time"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></span>
              Live Sync
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ActiveTasks />
          </div>
        </motion.section>

        {/* Task Catalyst - Span 4 cols */}
        <motion.aside
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="md:col-span-4 rounded-3xl overflow-hidden shadow-xl"
          aria-label="Task Catalyst AI Tool"
        >
          <TaskCatalyst />
        </motion.aside>

        {/* Team Chat - Span 4 cols */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="md:col-span-4 md:row-span-1 shadow-xl h-[400px] md:h-auto"
          aria-label="Team Chat Interface"
        >
          <TeamChat />
        </motion.section>

      </main>
    </div>
  );
}

export default App;
