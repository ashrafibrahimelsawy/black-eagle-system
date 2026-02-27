import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { CheckSquare, Plus, Loader2, XCircle, Clock, AlertCircle, User, Briefcase, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Tasks({ user }: { user: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    status: "pending", 
    priority: "medium", 
    due_date: new Date().toISOString().split('T')[0], 
    project_id: "", 
    assigned_to: "" 
  });

  const fetchData = async () => {
    try {
      const [tData, pData, uData] = await Promise.all([
        api.get("/tasks"),
        api.get("/projects"),
        api.get("/users")
      ]);
      setTasks(tData);
      setProjects(pData);
      setUsers(uData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, form);
      } else {
        await api.post("/tasks", form);
      }
      setShowForm(false);
      setEditingTask(null);
      setForm({ title: "", description: "", status: "pending", priority: "medium", due_date: new Date().toISOString().split('T')[0], project_id: "", assigned_to: "" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || "",
      project_id: task.project_id || "",
      assigned_to: task.assigned_to || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المهمة؟")) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (task: any, newStatus: string) => {
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const canManage = user.role !== 'employee';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">المهام</h1>
          <p className="text-slate-500 mt-1">إدارة مهام الفريق ومتابعة الإنجاز.</p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowForm(true); setEditingTask(null); setForm({ title: "", description: "", status: "pending", priority: "medium", due_date: new Date().toISOString().split('T')[0], project_id: "", assigned_to: "" }); }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <Plus className="w-5 h-5" />
            <span>مهمة جديدة</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['pending', 'in_progress', 'completed'].map((status) => (
          <div key={status} className="bg-slate-50 p-4 rounded-3xl border border-slate-200 min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">
                {status === 'pending' ? 'بانتظار البدء' : status === 'in_progress' ? 'قيد التنفيذ' : 'مكتملة'}
              </h3>
              <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-slate-500 border border-slate-200">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            
            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' :
                      task.priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <>
                          <button onClick={() => handleEdit(task)} className="p-1 text-slate-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all">
                            <CheckSquare className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-slate-900 mb-2">{task.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{task.due_date ? format(new Date(task.due_date), "d MMM", { locale: ar }) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500" title={task.assigned_name}>
                        {task.assigned_name?.[0] || '?'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    {task.status !== 'completed' && (
                      <button 
                        onClick={() => updateStatus(task, task.status === 'pending' ? 'in_progress' : 'completed')}
                        className="flex-1 py-2 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        {task.status === 'pending' ? 'بدء المهمة' : 'إكمال'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" dir="rtl">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">{editingTask ? "تعديل مهمة" : "إضافة مهمة جديدة"}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">عنوان المهمة</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الوصف</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الأولوية</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">المشروع</label>
                    <select
                      value={form.project_id}
                      onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="">اختر مشروع...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">إسناد إلى</label>
                    <select
                      value={form.assigned_to}
                      onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="">اختر موظف...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                >
                  {editingTask ? "حفظ التغييرات" : "إنشاء المهمة"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
