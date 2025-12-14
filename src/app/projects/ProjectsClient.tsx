'use client';
import { useState, useEffect, MouseEvent } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { getProjectsByUserId, insertProject, deleteProject, updateProject } from "@/lib/graphql";
import {
    FilePlus, LoaderCircle, Trash2, Edit, Zap, Users, Image as ImageIcon, Video, Mic,
    Folder, Clock, Gift, Sparkles, X, Search, MoreVertical, LayoutGrid, List, Plus
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
            const newProject = await insertProject(newProjectName, newProjectDescription, authContext.token);
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
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pt-24">
            {/* Header Section */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'inherit' }}>
                                    مشاريعي
                                </h1>
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                    {projects.length} مشاريع
                                </span>
                            </div>
                            <p className="text-muted-foreground text-sm">أدر جميع مشاريعك الصوتية والمرئية في مكان واحد.</p>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 md:w-64 group">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="بحث عن مشروع..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:bg-background/50'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:bg-background/50'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={openCreateModal}
                                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                <span>جديد</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-12">
                {/* Floating FAB for Mobile */}
                <button
                    onClick={openCreateModal}
                    className="md:hidden fixed bottom-6 left-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
                >
                    <Plus className="w-7 h-7" />
                </button>

                {filteredProjects.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            : "flex flex-col gap-4"
                        }
                    >
                        <AnimatePresence>
                            {filteredProjects.map((project, index) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        href={`/studio/${project.id}`}
                                        className={`group relative flex bg-card border border-border/40 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500
                                            ${viewMode === 'grid'
                                                ? 'flex-col h-full hover:-translate-y-2'
                                                : 'flex-row h-auto items-stretch hover:translate-x-[-4px]'
                                            }`}
                                    >
                                        {/* Visual Header */}
                                        <div className={`relative overflow-hidden shrink-0 bg-gradient-to-br from-primary via-orange-500 to-rose-600
                                            ${viewMode === 'grid' ? 'h-48 w-full' : 'w-32 sm:w-48 h-auto'}`}
                                        >
                                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                            {/* decorative circle */}
                                            {viewMode === 'grid' && (
                                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                                            )}

                                            {/* Centered Icon - Always Visible but positioned differently */}
                                            <div className={`absolute flex items-center justify-center text-white
                                                ${viewMode === 'grid' ? 'top-4 left-4' : 'inset-0'}`}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                                                    <Folder className="w-6 h-6" />
                                                </div>
                                            </div>

                                            {/* Date - Show in corner for Grid */}
                                            {viewMode === 'grid' && (
                                                <div className="absolute bottom-4 right-4 text-white z-10 w-full px-4">
                                                    <span className="text-xs font-bold text-white/90 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1.5 w-fit ml-auto">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(project.crated_at).toLocaleDateString('ar-EG')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Body */}
                                        <div className={`flex-1 p-5 flex relative bg-card
                                            ${viewMode === 'grid' ? 'flex-col justify-between' : 'flex-row items-center justify-between gap-6'}`}
                                        >
                                            {/* Text Area */}
                                            <div className="space-y-2 flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                                                        {project.name || "مشروع بدون عنوان"}
                                                    </h2>
                                                    {viewMode === 'list' && (
                                                        <span className="text-[10px] sm:text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(project.crated_at).toLocaleDateString('ar-EG')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm sm:text-base text-muted-foreground/80 leading-relaxed font-medium line-clamp-2">
                                                    {project.description || "لا يوجد وصف إضافي للمشروع..."}
                                                </p>
                                            </div>

                                            {/* Actions Area */}
                                            <div className={`flex items-center gap-3
                                                ${viewMode === 'grid' ? 'justify-between pt-6 mt-2 border-t border-border/50 w-full' : 'shrink-0'}`}
                                            >
                                                {viewMode === 'grid' && (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border-2 border-card flex items-center justify-center text-[10px] text-white font-bold shadow-sm">ME</div>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => handleEditClick(project, e)}
                                                        className="w-9 h-9 flex items-center justify-center bg-secondary/50 hover:bg-primary hover:text-white text-muted-foreground rounded-full transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-110"
                                                        title="تعديل"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(project, e)}
                                                        className="w-9 h-9 flex items-center justify-center bg-secondary/50 hover:bg-red-500 hover:text-white text-muted-foreground rounded-full transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-110"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24 text-center"
                    >
                        <div className="w-32 h-32 bg-gradient-to-tr from-primary/20 to-orange-500/20 rounded-full flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-dashed animate-spin-slow" />
                            <Folder className="w-14 h-14 text-primary" />
                        </div>
                        <h3 className="text-3xl font-bold text-foreground mb-3">لا توجد مشاريع حتى الآن</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                            مساحة عملك فارغة. ابدأ رحلتك الإبداعية الآن بإنشاء أول مشروع لك.
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="btn btn-primary px-8 py-4 text-lg rounded-full shadow-xl shadow-primary/30 flex items-center gap-3 hover:scale-105 transition-transform"
                        >
                            <Plus className="w-6 h-6" />
                            <span>إنشاء مشروع جديد</span>
                        </button>
                    </motion.div>
                )}

                {/* Upcoming Features Teaser */}
                <div className="mt-32">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-4 border border-border rounded-full py-1">قريباً في MuejamStudio</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {upcomingFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative p-6 bg-card hover:bg-muted/30 border border-border rounded-2xl transition-all duration-300 hover:border-primary/30"
                            >
                                <div className={`w-12 h-12 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-foreground mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Create/Edit Modal */}
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

            {/* Delete Confirmation Modal */}
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