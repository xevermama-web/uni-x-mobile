import { useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import { BarChart, TrendingUp, Users, BookOpen } from 'lucide-react';

export default function Analytics() {
  const { user } = useOutletContext<any>();

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100dvh-8rem)]">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">System Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Overview of university metrics and system usage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
        {[
          { label: "Active Users Today", value: "842", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Total Assignments", value: "3,104", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Average Attendance", value: "91%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
          { label: "Server Load", value: "24%", icon: BarChart, color: "text-amber-600", bg: "bg-amber-100" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-[24px] border border-white/40 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-white/40 flex-1 min-h-0 flex flex-col p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">User Activity Overview</h3>
        <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800/70/50 dark:bg-slate-800/50">
          <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Analytics charts will be rendered here.
          </p>
        </div>
      </div>
    </div>
  );
}
