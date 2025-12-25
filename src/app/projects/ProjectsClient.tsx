'use client';
import { useState, useEffect, MouseEvent } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { getProjectsByUserId, insertProject, deleteProject, updateProject, getUserUsage } from "@/lib/graphql";
import {
    FilePlus, LoaderCircle, Trash2, Edit, Zap, Users, Image as ImageIcon, Video, Mic,
    Folder, Clock, Gift, Sparkles, X, Search, MoreVertical, LayoutGrid, List, Plus, TrendingUp, DollarSign
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Project } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

const upcomingFeatures = [
    {
        title: "المؤثرات الصوتية",
        description: "إضافة تأثيرات (صدى، فلترة، تردد) على المقاطع الصوتية.",
        icon: Zap,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    },
    {
        title: "أصوات جديدة وموسعة",
        description: "إطلاق مجموعة ضخمة من الأصوات الاحترافية واللهجات الإقليمية.",
        icon: Users,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        title: "توليد الصور بالذكاء الاصطناعي",
        description: "تحويل النص إلى صورة (Text-to-Image) لإنشاء خلفيات بصرية.",
        icon: ImageIcon,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
    },
    {
        title: "توليد الفيديوهات القصيرة",
        description: "دمج الصوت مع الصور الثابتة أو مقاطع الفيديو البسيطة.",
        icon: Video,
        color: "text-rose-400",
        bg: "bg-rose-400/10"
    }
];

export default function ProjectsClient() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectDescription, setNewProjectDescription] = useState("");
    const [showCreateOrEditModal, setShowCreateOrEditModal] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [usageStats, setUsageStats] = useState<{ charsUsed: number, projectsCount: number }>({ charsUsed: 0, projectsCount: 0 });

    const authContext = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (authContext.user?.id && authContext.token) {
            getProjectsByUserId(authContext.user.id, authContext.token)
                .then(setProjects)
                .catch(err => {
                    console.error("Failed to fetch projects", err);
                    toast.error("فشل تحميل المشاريع. حاول إعادة تحميل الصفحة.");
                })
                .finally(() => setIsLoading(false));

            getUserUsage(authContext.user.id, authContext.token)
                .then(setUsageStats)
                .catch(err => console.error("Failed to fetch usage stats", err));
        } else if (!authContext.isLoading) {
        } else if (!authContext.isLoading) {
            setIsLoading(false);
        }
    }, [authContext.user, authContext.isLoading, authContext.token]);

    const openCreateModal = () => {
        setProjectToEdit(null);
        setNewProjectName("");
        setNewProjectDescription("");
        setShowCreateOrEditModal(true);
    };

    const handleEditClick = (project: Project, e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setProjectToEdit(project);
        setNewProjectName(project.name);
        setNewProjectDescription(project.description || "");
        setShowCreateOrEditModal(true);
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim() || !authContext.user?.id || !authContext.token) return;
        setIsSubmitting(true);
        try {
            const newProject = await insertProject(newProjectName, newProjectDescription, authContext.user.id);
            toast.success(`تم إنشاء مشروع "${newProjectName}" بنجاح!`);
            router.push(`/studio/${newProject.id}`);
        } catch (error) {
            console.error("Failed to create project", error);
            toast.error("فشل إنشاء المشروع.");
            setIsSubmitting(false);
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectToEdit || !newProjectName.trim() || !authContext.token) return;
        setIsSubmitting(true);
        try {
            await updateProject(projectToEdit.id, newProjectName, newProjectDescription, authContext.token);
            setProjects(currentProjects =>
                currentProjects.map(p =>
                    p.id === projectToEdit.id
                        ? { ...p, name: newProjectName, description: newProjectDescription }
                        : p
                )
            );
            toast.success(`تم تحديث المشروع "${newProjectName}" بنجاح.`);
        } catch (error) {
            console.error("Failed to update project", error);
            toast.error("فشل تحديث المشروع.");
        } finally {
            setIsSubmitting(false);
            setShowCreateOrEditModal(false);
            setProjectToEdit(null);
        }
    };

    const handleDeleteClick = (project: Project, e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setProjectToDelete(project);
    };

    const confirmDelete = async () => {
        if (!projectToDelete || !authContext.token) return;
        setIsDeleting(true);
        const projectName = projectToDelete.name;
        try {
            await deleteProject(projectToDelete.id, authContext.token);
            setProjects(currentProjects => currentProjects.filter(p => p.id !== projectToDelete.id));
            toast.success(`تم حذف المشروع "${projectName}" بنجاح.`);
        } catch (error) {
            console.error("Failed to delete project", error);
            toast.error("فشل حذف المشروع.");
        } finally {
            setIsDeleting(false);
            setProjectToDelete(null);
        }
    };

    const filteredProjects = projects.filter(project =>
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <LoaderCircle className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium text-muted-foreground animate-pulse">جاري تحميل المشاريع...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-16 flex">
            {/* Sidebar (Tablet/Desktop) */}
            <aside className="w-64 border-l border-border bg-card/30 hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="p-6">
                    <button
                        onClick={openCreateModal}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>مشروع جديد</span>
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <SidebarItem icon={LayoutGrid} label="الرئيسية" active />
                    <SidebarItem icon={Folder} label="مشاريعي" />
                    <SidebarItem icon={Sparkles} label="أدوات الذكاء الاصطناعي" />
                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">الأدوات</p>
                    </div>
                    <SidebarItem icon={Mic} label="تحويل النص لكلام" />
                    <SidebarItem icon={Video} label="محرر الفيديو" />
                    <SidebarItem icon={Users} label="استنساخ الصوت" badge="قريباً" />
                    <SidebarItem icon={ImageIcon} label="توليد الصور" badge="قريباً" />
                </nav>

                <div className="p-4 mt-auto">
                    <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl p-4 border border-primary/20">
                        <h4 className="font-bold text-sm mb-1">Muejam Pro</h4>
                        <p className="text-xs text-muted-foreground mb-3">احصل على المزيد من الأصوات والميزات.</p>
                        <button className="text-xs font-bold text-primary hover:underline">ترقية الخطة &larr;</button>
                    </div>

                    <UsageWidget stats={usageStats} />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
                <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">

                    {/* Hero Banner with Modern Gradient */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-primary p-8 sm:p-12 mb-10 text-white shadow-2xl">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 max-w-2xl">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight">
                                اصنع محتواك <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-200">بالذكاء الاصطناعي</span>
                            </h1>
                            <p className="text-white/90 text-lg mb-8 max-w-lg leading-relaxed">
                                استوديو متكامل يجمع بين قوة الصوت والفيديو. حول نصوصك إلى قصص مرئية مذهلة في ثوانٍ.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={openCreateModal} className="px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                                    <Video className="w-5 h-5" />
                                    <span>إنشاء فيديو</span>
                                </button>
                                <button className="px-6 py-3 bg-white/20 backdrop-blur-md text-white/70 font-bold rounded-xl border border-white/30 cursor-not-allowed flex items-center gap-2">
                                    <Mic className="w-5 h-5" />
                                    <span>استنساخ صوت (قريباً)</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Templates Section - NEW */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-purple-500" />
                                <span>ابدأ بقالب جاهز</span>
                            </h2>
                            <button className="text-sm text-primary hover:underline">عرض الكل</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {[
                                { title: "فيديو تيك توك", color: "from-pink-500 to-rose-500", icon: Video },
                                { title: "إعلان يوتيوب", color: "from-red-500 to-orange-500", icon: Video },
                                { title: "بودكاست", color: "from-violet-500 to-purple-500", icon: Mic },
                                { title: "قصة انستجرام", color: "from-purple-500 to-pink-500", icon: ImageIcon },
                            ].map((template, idx) => (
                                <button key={idx} onClick={openCreateModal} className="min-w-[160px] h-24 rounded-2xl relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-90`}></div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                                        <template.icon className="w-6 h-6 mb-2 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                        <span className="font-bold text-sm shadow-black/20 drop-shadow-md">{template.title}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Tools Grid (Magic Tools) */}
                    <div className="mb-12">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <span>أدوات سحرية</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <QuickToolCard
                                icon={Video}
                                title="محرر الفيديو"
                                desc="مونتاج احترافي"
                                color="bg-blue-500"
                                onClick={openCreateModal}
                            />
                            <QuickToolCard
                                icon={Mic}
                                title="النص إلى كلام"
                                desc="أصوات عربية واضحة"
                                color="bg-orange-500"
                                onClick={() => { }}
                            />
                            <QuickToolCard
                                icon={Users}
                                title="استنساخ الصوت"
                                desc="قريباً"
                                color="bg-purple-500"
                                isComingSoon
                                onClick={() => { }}
                            />
                            <QuickToolCard
                                icon={ImageIcon}
                                title="توليد الصور"
                                desc="قريباً"
                                color="bg-rose-500"
                                isComingSoon
                                onClick={() => { }}
                            />
                        </div>
                    </div>

                    {/* Recent Projects Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                <span>المشاريع الأخيرة</span>
                            </h2>
                            <div className="flex items-center gap-2">
                                {/* Search - Smaller version */}
                                <div className="relative group hidden sm:block">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="بحث..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-48 bg-muted/50 border border-border rounded-lg py-2 pr-9 pl-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="flex bg-muted p-1 rounded-lg">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {filteredProjects.length > 0 ? (
                            <motion.div
                                layout
                                className={viewMode === 'grid'
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                    : "flex flex-col gap-3"
                                }
                            >
                                <AnimatePresence>
                                    {filteredProjects.map((project, index) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            viewMode={viewMode}
                                            onEdit={(e: any) => handleEditClick(project, e)}
                                            onDelete={(e: any) => handleDeleteClick(project, e)}
                                            index={index}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                                <Folder className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-muted-foreground mb-2">لا توجد مشاريع</h3>
                                <button onClick={openCreateModal} className="text-primary font-bold hover:underline">ابدأ مشروعك الأول</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile FAB */}
            <button
                onClick={openCreateModal}
                className="md:hidden fixed bottom-6 left-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
            >
                <Plus className="w-7 h-7" />
            </button>

            {/* Modals (Create/Edit/Delete) - Preserved Logic */}
            <AnimatePresence>
                {showCreateOrEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowCreateOrEditModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    {projectToEdit ? <Edit className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-primary" />}
                                    {projectToEdit ? "تعديل بيانات المشروع" : "إنشاء مشروع جديد"}
                                </h2>
                                <button onClick={() => setShowCreateOrEditModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={projectToEdit ? handleUpdateProject : handleCreateProject} className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">اسم المشروع</label>
                                    <input
                                        type="text"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        placeholder="مثال: الحملة الإعلانية لشهر رمضان"
                                        className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">وصف المشروع <span className="text-muted-foreground text-xs font-normal">(اختياري)</span></label>
                                    <textarea
                                        value={newProjectDescription}
                                        onChange={(e) => setNewProjectDescription(e.target.value)}
                                        placeholder="أضف ملاحظات سريعة عن المشروع..."
                                        className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none h-24"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateOrEditModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-input hover:bg-muted font-medium transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newProjectName.trim()}
                                        className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                                    >
                                        {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : (projectToEdit ? "حفظ التغييرات" : "إنشاء الآن")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {projectToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setProjectToDelete(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-border"
                        >
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">حذف المشروع؟</h3>
                                <p className="text-muted-foreground mb-6">
                                    هل أنت متأكد من حذف <span className="font-bold text-foreground">"{projectToDelete.name}"</span>؟ لا يمكن التراجع عن هذا الإجراء.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setProjectToDelete(null)}
                                        className="flex-1 py-3 border border-border rounded-xl hover:bg-muted font-medium transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : "نعم، حذف"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Helper Components ---

function SidebarItem({ icon: Icon, label, active, badge }: { icon: any, label: string, active?: boolean, badge?: string }) {
    return (
        <button className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
            ${active
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
        }>
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span>{label}</span>
            </div>
            {badge && (
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                    {badge}
                </span>
            )}
        </button>
    )
}

function QuickToolCard({ icon: Icon, title, desc, color, onClick, isComingSoon }: any) {
    return (
        <div
            onClick={!isComingSoon ? onClick : undefined}
            className={`relative p-5 bg-card border border-border/50 rounded-2xl hover:shadow-xl hover:border-primary/30 transition-all duration-300 group cursor-pointer ${isComingSoon ? 'opacity-70 grayscale' : ''}`}
        >
            <div className={`w-12 h-12 ${color} bg-opacity-20 rounded-xl flex items-center justify-center mb-4 text-white relative overflow-hidden`}>
                <div className={`absolute inset-0 ${color} opacity-20`}></div>
                <Icon className={`w-6 h-6 relative z-10 ${color.replace('bg-', 'text-')}`} />
            </div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
            {isComingSoon && <span className="absolute top-3 right-3 text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">قريباً</span>}
        </div>
    )
}

function ProjectCard({ project, viewMode, onEdit, onDelete, index }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link
                href={`/studio/${project.id}`}
                className={`group relative flex bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300
                    ${viewMode === 'grid'
                        ? 'flex-col h-full hover:-translate-y-1'
                        : 'flex-row h-auto items-center hover:translate-x-[-2px]'
                    }`}
            >
                {/* Visual Header */}
                <div className={`relative overflow-hidden shrink-0 bg-secondary
                    ${viewMode === 'grid' ? 'h-40 w-full' : 'w-24 h-24 m-2 rounded-xl'}`}
                >
                    {/* Placeholder Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-primary/20">
                        <Folder className="w-10 h-10" />
                    </div>
                </div>

                {/* Content */}
                <div className={`flex-1 p-4 flex
                    ${viewMode === 'grid' ? 'flex-col justify-between' : 'flex-row items-center justify-between px-4'}`}
                >
                    <div className="min-w-0">
                        <h3 className="font-bold text-foreground text-lg mb-1 truncate">{project.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{project.description || "لا يوجد وصف"}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                            <Clock className="w-3 h-3" />
                            {new Date(project.crated_at).toLocaleDateString('ar-EG')}
                        </div>
                    </div>

                    <div className={`flex items-center gap-1 
                         ${viewMode === 'grid' ? 'mt-4 pt-3 border-t border-border/40 justify-end' : ''}`}
                    >
                        <button
                            onClick={onEdit}
                            className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

function UsageWidget({ stats }: { stats: { charsUsed: number, projectsCount: number } }) {
    // 1000 chars approx 1 min. Free plan = 30k chars (30 mins).
    const maxChars = 30000;
    const percentage = Math.min(100, Math.max(0, (stats.charsUsed / maxChars) * 100));
    const usedMinutes = Math.ceil(stats.charsUsed / 1000);
    const totalMinutes = 30;

    return (
        <div className="mt-4 bg-muted/30 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    الاستهلاك الشهري
                </span>
                <span className="text-xs font-bold text-primary">{usedMinutes} / {totalMinutes} دقيقة</span>
            </div>
            <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden mb-2">
                <div
                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
                يتم تجديد الرصيد في بداية الشهر
            </p>
        </div>
    )
}