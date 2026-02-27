import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { Users as UsersIcon, Plus, Shield, Mail, Loader2, XCircle, Edit3, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Users({ user }: { user: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "employee", 
    status: "active", 
    base_salary: "", 
    position: "", 
    phone: "",
    permissions: [] as string[]
  });

  const modules = [
    { id: 'projects', name: 'المشاريع' },
    { id: 'clients', name: 'العملاء' },
    { id: 'tasks', name: 'المهام' },
    { id: 'attendance', name: 'الحضور والانصراف' },
    { id: 'leaves', name: 'الإجازات' },
    { id: 'finance', name: 'الماليات' },
    { id: 'payroll', name: 'الرواتب' },
    { id: 'users', name: 'المستخدمين' }
  ];

  const fetchData = async () => {
    try {
      const data = await api.get("/users");
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'super_admin') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user.role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        permissions: form.permissions
      };
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post("/users", payload);
      }
      setShowForm(false);
      setEditingUser(null);
      setForm({ 
        name: "", 
        email: "", 
        password: "", 
        role: "employee", 
        status: "active", 
        base_salary: "", 
        position: "", 
        phone: "",
        permissions: []
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (u: any) => {
    setEditingUser(u);
    let userPermissions = [];
    try {
      userPermissions = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || []);
    } catch (e) {
      userPermissions = [];
    }
    setForm({ 
      name: u.name, 
      email: u.email, 
      password: "", 
      role: u.role, 
      status: u.status, 
      base_salary: u.base_salary || "", 
      position: u.position || "", 
      phone: u.phone || "",
      permissions: userPermissions
    });
    setShowForm(true);
  };

  if (user.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">غير مصرح لك بالدخول</h2>
        <p className="text-slate-500 mt-2">هذه الصفحة مخصصة للمسؤولين فقط.</p>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">إدارة المستخدمين</h1>
          <p className="text-slate-500 mt-1">إضافة وتعديل الموظفين وتحديد صلاحياتهم.</p>
        </div>
        <button
          onClick={() => { 
            setShowForm(true); 
            setEditingUser(null); 
            setForm({ 
              name: "", 
              email: "", 
              password: "", 
              role: "employee", 
              status: "active", 
              base_salary: "", 
              position: "", 
              phone: "",
              permissions: []
            }); 
          }}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
        >
          <UserPlus className="w-5 h-5" />
          <span>إضافة مستخدم</span>
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
                <h3 className="text-xl font-bold text-slate-900">{editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم الكامل</label>
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
                    required
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">كلمة المرور</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      required
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">المنصب</label>
                    <input
                      type="text"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
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
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الراتب الأساسي</label>
                  <input
                    type="number"
                    value={form.base_salary}
                    onChange={(e) => setForm({ ...form, base_salary: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الدور</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="employee">موظف (Employee)</option>
                      <option value="project_manager">مدير مشروع (PM)</option>
                      <option value="admin">مسؤول (Admin)</option>
                      <option value="super_admin">مسؤول عام (Super Admin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الحالة</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="active">نشط</option>
                      <option value="inactive">معطل</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">صلاحيات الوصول الإضافية</label>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    {modules.map(module => (
                      <label key={module.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(module.id)}
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...form.permissions, module.id]
                              : form.permissions.filter(p => p !== module.id);
                            setForm({ ...form, permissions: newPermissions });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{module.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">* الصلاحيات المختارة تمنح المستخدم وصولاً مباشراً لهذه الأقسام بغض النظر عن دوره الأساسي.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                >
                  {editingUser ? "حفظ التغييرات" : "إضافة المستخدم"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">البريد الإلكتروني</th>
                <th className="px-6 py-4">الدور</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {u.name[0]}
                      </div>
                      <span className="font-bold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'super_admin' ? 'bg-red-100 text-red-600' :
                      u.role === 'admin' ? 'bg-blue-100 text-blue-600' :
                      u.role === 'project_manager' ? 'bg-purple-100 text-purple-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-sm text-slate-600">{u.status === 'active' ? 'نشط' : 'معطل'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
