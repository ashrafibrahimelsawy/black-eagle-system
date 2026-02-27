import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { Briefcase, Plus, Users, CheckCircle2, Clock, Loader2, XCircle, Edit3, Save, DollarSign, Wallet, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Projects({ user }: { user: any }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", client_id: "", budget: "", start_date: "", end_date: "", memberIds: [] as number[] });

  const fetchData = async () => {
    try {
      const [pData, cData, uData] = await Promise.all([
        api.get("/projects"),
        api.get("/clients"),
        api.get("/users").catch(() => []) // Only super_admin can get all users, but PM/Admin might need them too.
      ]);
      setProjects(pData);
      setClients(cData);
      setAllUsers(uData);
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
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, form);
      } else {
        await api.post("/projects", form);
      }
      setShowForm(false);
      setEditingProject(null);
      setForm({ name: "", description: "", client_id: "", budget: "", start_date: "", end_date: "", memberIds: [] });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description,
      client_id: project.client_id,
      budget: project.budget || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      memberIds: project.members.map((m: any) => m.id)
    });
    setShowForm(true);
  };

  const updateProgress = async (id: number, progress: number) => {
    try {
      await api.put(`/projects/${id}`, { progress, status: progress === 100 ? 'completed' : 'in_progress' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const canManage = user.role === 'super_admin' || user.role === 'project_manager';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">المشاريع</h1>
          <p className="text-slate-500 mt-1">إدارة المشاريع والفرق والتقدم.</p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowForm(true); setEditingProject(null); setForm({ name: "", description: "", client_id: "", budget: "", start_date: "", end_date: "", memberIds: [] }); }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <Plus className="w-5 h-5" />
            <span>مشروع جديد</span>
          </button>
        )}
      </div>

      {/* Financial Stats Summary */}
      {user.role !== 'employee' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500">إجمالي المشاريع</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{projects.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500">إجمالي الميزانيات</span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {projects.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500">إجمالي المصاريف</span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {projects.reduce((acc, p) => acc + (p.total_expenses || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500">المبالغ المستلمة</span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {projects.reduce((acc, p) => acc + (p.total_received || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden" dir="rtl">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">{editingProject ? "تعديل مشروع" : "إنشاء مشروع جديد"}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">اسم المشروع</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الوصف</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">العميل</label>
                    <select
                      value={form.client_id}
                      onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      required
                    >
                      <option value="">اختر عميل...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الميزانية</label>
                    <input
                      type="number"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ البدء</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">أعضاء الفريق</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      {allUsers.map(u => (
                        <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-emerald-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={form.memberIds.includes(u.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked 
                                ? [...form.memberIds, u.id]
                                : form.memberIds.filter(id => id !== u.id);
                              setForm({ ...form, memberIds: newIds });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span>{u.name} ({u.role})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                >
                  {editingProject ? "حفظ التغييرات" : "إنشاء المشروع"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            layout
            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md mb-2 inline-block">
                  {project.client_name}
                </span>
                <h3 className="text-xl font-bold text-slate-900">{project.name}</h3>
              </div>
              {canManage && (
                <button onClick={() => handleEdit(project)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6 flex-1 space-y-6">
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {project.description || "لا يوجد وصف متاح لهذا المشروع."}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">التقدم</span>
                  <span className="text-slate-900">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                </div>
                {user.role === 'employee' && (
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={project.progress} 
                    onChange={(e) => updateProgress(project.id, parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
                  />
                )}
              </div>

              {user.role !== 'employee' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">الميزانية</p>
                    <p className="text-sm font-bold text-slate-700">{project.budget?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المصاريف</p>
                    <p className="text-sm font-bold text-red-600">{project.total_expenses?.toLocaleString() || 0}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">الفريق</span>
                  <span className="text-xs font-bold text-slate-900">{project.members.length} أعضاء</span>
                </div>
                <div className="flex -space-x-2 space-x-reverse">
                  {project.members.map((m: any) => (
                    <div key={m.id} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600" title={m.name}>
                      {m.name[0]}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-4 h-4" />
                <span>{project.status === 'completed' ? 'مكتمل' : 'قيد العمل'}</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${project.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`}></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
