import { useState, useEffect, ChangeEvent } from "react";
import { api } from "../lib/api";
import { 
  Briefcase, 
  Users, 
  Clock, 
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  Camera,
  UserCircle,
  CheckSquare,
  Loader2
} from "lucide-react";
import { motion } from "motion/react";

export default function Dashboard({ user: initialUser }: { user: any }) {
  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState<any>(null);
  const [myPayroll, setMyPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const [projects, clients, attendance, leaves, tasks, payrolls] = await Promise.all([
        api.get("/projects"),
        api.get("/clients"),
        api.get("/attendance"),
        api.get("/leaves"),
        api.get("/tasks"),
        api.get("/payroll")
      ]);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentPayroll = payrolls.find((p: any) => p.month === currentMonth);
      setMyPayroll(currentPayroll);

      setStats({
        projectsCount: projects.length,
        clientsCount: clients.length,
        attendanceCount: attendance.filter((a: any) => a.date === new Date().toISOString().split('T')[0]).length,
        pendingLeaves: leaves.filter((l: any) => l.status === 'pending').length,
        pendingTasks: tasks.filter((t: any) => t.status !== 'completed').length,
        recentProjects: projects.slice(0, 5)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await api.put("/auth/profile", { ...user, avatar: base64 });
        const updatedUser = { ...user, avatar: base64 };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        // Refresh page to update layout avatar too
        window.location.reload();
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>)}
    </div>
  </div>;

  const cards = [
    { name: "المشاريع النشطة", value: stats?.projectsCount, icon: Briefcase, color: "bg-blue-500" },
    { name: "إجمالي العملاء", value: stats?.clientsCount, icon: Users, color: "bg-purple-500" },
    { name: "المهام المعلقة", value: stats?.pendingTasks, icon: CheckSquare, color: "bg-emerald-500" },
    { name: "طلبات إجازة معلقة", value: stats?.pendingLeaves, icon: CalendarCheck, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 border-4 border-white shadow-xl overflow-hidden">
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-12 h-12" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-2 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-emerald-500 transition-all shadow-lg group-hover:scale-110">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">أهلاً بك، {user.name} 👋</h1>
            <p className="text-slate-500 mt-1">أنت مسجل بصلاحية <span className="text-emerald-600 font-bold uppercase">{user.role}</span></p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">الحالة</p>
            <span className="text-sm font-bold text-emerald-600">نشط الآن</span>
          </div>
          <div className="text-center px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المنصب</p>
            <span className="text-sm font-bold text-slate-700">{user.position || "موظف"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-2xl text-white shadow-lg shadow-${card.color.split('-')[1]}-500/20`}>
                <card.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{card.name}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Salary Section */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">معلومات الراتب</h3>
                <p className="text-slate-500 text-sm mt-1">تفاصيل راتب الشهر الحالي ({new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })})</p>
              </div>
              <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <span className="text-emerald-600 font-bold text-sm">مؤمن بالكامل 🔒</span>
              </div>
            </div>

            {myPayroll ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">الراتب الأساسي</p>
                  <p className="text-2xl font-black text-slate-900">{myPayroll.base_salary.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span></p>
                </div>
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                  <p className="text-xs font-bold text-red-400 uppercase mb-2">الاستقطاعات (غياب)</p>
                  <p className="text-2xl font-black text-red-600">-{myPayroll.deductions.toLocaleString()} <span className="text-xs font-normal text-red-400">ج.م</span></p>
                </div>
                <div className="p-6 bg-emerald-600 rounded-3xl shadow-lg shadow-emerald-600/20 text-white">
                  <p className="text-xs font-bold text-emerald-100 uppercase mb-2">صافي الراتب</p>
                  <p className="text-2xl font-black">{myPayroll.net_salary.toLocaleString()} <span className="text-xs font-normal text-emerald-100">ج.م</span></p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">لم يتم توليد مسير الرواتب لهذا الشهر بعد.</p>
                <p className="text-slate-400 text-xs mt-1">سيظهر راتبك هنا فور اعتماده من الإدارة.</p>
              </div>
            )}
            
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">آخر المشاريع</h3>
              <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">عرض الكل</button>
            </div>
            <div className="space-y-4">
              {stats?.recentProjects.map((project: any) => (
                <div key={project.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                      {project.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{project.name}</h4>
                      <p className="text-xs text-slate-500">{project.client_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">{project.progress}%</p>
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      project.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {project.status === 'completed' ? 'مكتمل' : project.status === 'in_progress' ? 'قيد التنفيذ' : 'معلق'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="bg-emerald-500/20 p-3 rounded-2xl w-fit mb-6">
              <AlertCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">تنبيهات النظام</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              تأكد من مراجعة طلبات الإجازات المعلقة وتحديث حالة المشاريع بشكل دوري لضمان دقة التقارير.
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-500 mb-1">تحديث أمني</p>
                <p className="text-sm font-medium">تم تحديث نظام الصلاحيات بنجاح.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-500 mb-1">الحضور</p>
                <p className="text-sm font-medium">نسبة الحضور اليوم مرتفعة (92%).</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
