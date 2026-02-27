import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { Users, Plus, Briefcase, Phone, Mail, Loader2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Clients({ user }: { user: any }) {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [form, setForm] = useState({ name: "", contact_info: "", email: "", phone: "" });

  const fetchData = async () => {
    try {
      const [cData, pData] = await Promise.all([
        api.get("/clients"),
        api.get("/projects")
      ]);
      setClients(cData);
      setProjects(pData);
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
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, form);
      } else {
        await api.post("/clients", form);
      }
      setShowForm(false);
      setEditingClient(null);
      setForm({ name: "", contact_info: "", email: "", phone: "" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setForm({ name: client.name, contact_info: client.contact_info || "", email: client.email || "", phone: client.phone || "" });
    setShowForm(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">العملاء</h1>
          <p className="text-slate-500 mt-1">إدارة بيانات العملاء ومشاريعهم.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة عميل</span>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" dir="rtl">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">{editingClient ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</h3>
                <button onClick={() => { setShowForm(false); setEditingClient(null); }} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">اسم العميل / الشركة</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">رقم الهاتف</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">العنوان / ملاحظات</label>
                  <textarea
                    value={form.contact_info}
                    onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none"
                    placeholder="رقم الهاتف، البريد الإلكتروني، العنوان..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                >
                  {editingClient ? "حفظ التغييرات" : "إضافة العميل"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.map((client) => {
          const clientProjects = projects.filter(p => p.client_id === client.id);
          return (
            <motion.div
              key={client.id}
              className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 hover:shadow-md transition-shadow relative group"
            >
              <button 
                onClick={() => handleEdit(client)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{client.name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Client ID: #{client.id}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{client.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 text-slate-400 mt-1" />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {client.contact_info || "لا توجد ملاحظات إضافية."}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-900">المشاريع التابعة</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    {clientProjects.length} مشاريع
                  </span>
                </div>
                <div className="space-y-2">
                  {clientProjects.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs text-slate-500">
                      <Briefcase className="w-3 h-3" />
                      <span className="truncate">{p.name}</span>
                    </div>
                  ))}
                  {clientProjects.length > 3 && (
                    <p className="text-[10px] text-slate-400 text-center mt-2">+{clientProjects.length - 3} مشاريع أخرى</p>
                  )}
                  {clientProjects.length === 0 && (
                    <p className="text-xs text-slate-400 italic">لا توجد مشاريع حالياً.</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
