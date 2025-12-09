'use client';
import { useState, useEffect, MouseEvent } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { getProjectsByUserId, insertProject, deleteProject, updateProject } from "@/lib/graphql";
import { FilePlus, LoaderCircle, Trash2, Edit, Zap, Users, Image, Video, Mic, Folder, Clock, Gift, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Project } from "@/lib/types";

const upcomingFeatures = [
    {
        title: "المؤثرات الصوتية",
        description: "إضافة تأثيرات (صدى، فلترة، تردد) على المقاطع الصوتية.",
        icon: Zap
    },
    {
        title: "أصوات جديدة وموسعة",
        description: "إطلاق مجموعة ضخمة من الأصوات الاحترافية واللهجات الإقليمية.",
        icon: Users
    },
    {
        title: "توليد الصور بالذكاء الاصطناعي",
        description: "تحويل النص إلى صورة (Text-to-Image) لإنشاء خلفيات بصرية.",
        icon: Image
    },
    {
        title: "توليد الفيديوهات القصيرة",
        description: "دمج الصوت مع الصور الثابتة أو مقاطع الفيديو البسيطة.",
        icon: Video
    },
    {
        title: "التسجيل وتحويل الصوت (AI)",
        description: "سجل صوتك وحوّله إلى أي صوت آخر مدعوم بتقنيات الاستنساخ الآمن.",
        icon: Mic
    },
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-studio-bg-light dark:bg-studio-bg">
                <LoaderCircle className="w-12 h-12 text-studio-accent animate-spin mb-4" />
                <p className="text-lg font-medium text-studio-text-light dark:text-studio-text">جاري تحميل مشاريعك...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-studio-bg-light dark:bg-studio-bg">
            <div className="relative bg-studio-bg dark:bg-studio-bg text-studio-text dark:text-studio-text">
                <div className="container mx-auto px-6 py-12 relative z-10">
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 bg-studio-panel-light/40 dark:bg-studio-panel/40 backdrop-blur-sm px-6 py-3 rounded-full border border-studio-border-light dark:border-studio-border">
                            <Gift className="w-5 h-5 text-studio-accent" />
                            <span className="font-bold text-sm">🎉 جميع الميزات مجانية لمدة 14 يوم! 🎉</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <Folder className="w-10 h-10 text-studio-accent" />
                                مشاريعي
                            </h1>
                            <p className="text-studio-text-light/80 dark:text-studio-text/80 text-lg">أنشئ وأدر مشاريع الصوت الذكي الخاصة بك</p>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="group flex items-center gap-2 px-6 py-3 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            <FilePlus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                            مشروع جديد
                        </button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-12">
                {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                        {projects.map((project, index) => (
                            <Link
                                href={`/studio/${project.id}`}
                                key={project.id}
                                className="group relative bg-studio-panel-light dark:bg-studio-panel rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-studio-border-light dark:border-studio-border overflow-hidden cursor-pointer"
                            >
                                <div className="h-2 bg-studio-accent"></div>

                                <div className="p-6">
                                    <div className="w-14 h-14 bg-studio-accent/20 rounded-xl flex items-center justify-center mb-4">
                                        <Folder className="w-8 h-8 text-studio-accent" />
                                    </div>

                                    <h2 className="text-xl font-bold text-studio-text-light dark:text-studio-text mb-2 truncate group-hover:text-studio-accent transition-colors">
                                        {project.name || "مشروع بدون عنوان"}
                                    </h2>

                                    <p className="text-sm text-studio-text-light/70 dark:text-studio-text/70 mb-4 line-clamp-2 h-10">
                                        {project.description || "لا يوجد وصف"}
                                    </p>

                                    <div className="flex items-center gap-2 text-xs text-studio-text-light/50 dark:text-studio-text/50 mb-4">
                                        <Clock className="w-4 h-4" />
                                        <span>تم الإنشاء: {new Date(project.crated_at).toLocaleDateString('ar-EG')}</span>
                                    </div>

                                    <div className="flex gap-2 transition-opacity duration-300 pt-2 border-t border-studio-border-light/50 dark:border-studio-border/50">
                                        <button
                                            onClick={(e) => handleEditClick(project, e)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-studio-bg-light/50 dark:bg-studio-bg/50 text-studio-text-light dark:text-studio-text rounded-lg hover:bg-studio-accent/20 hover:text-studio-accent transition-colors text-sm font-medium"
                                        >
                                            <Edit className="w-4 h-4" />
                                            تعديل
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(project, e)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-studio-bg-light/50 dark:bg-studio-bg/50 text-studio-text-light dark:text-studio-text rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors text-sm font-medium"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-block p-8 bg-studio-panel-light dark:bg-studio-panel rounded-3xl shadow-lg mb-6 border border-studio-border-light dark:border-studio-border">
                            <Folder className="w-20 h-20 text-studio-border dark:text-studio-border mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-studio-text-light dark:text-studio-text mb-2">لا توجد مشاريع بعد</h3>
                            <p className="text-studio-text-light/70 dark:text-studio-text/70 mb-6">ابدأ بإنشاء مشروعك الأول الآن!</p>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                <FilePlus className="w-5 h-5" />
                                إنشاء مشروع جديد
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-16 border-t-2 border-gray-200 pt-12">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 border border-yellow-200 px-6 py-2 rounded-full font-bold mb-4">
                            <Sparkles className="w-5 h-5" />
                            قريباً
                        </div>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent mb-4">
                            المزيد من القوة الإبداعية
                        </h2>
                        <p className="text-xl text-gray-600">ميزات متقدمة قادمة لتعزيز إنتاجك الصوتي</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className="relative p-6 bg-studio-panel-light dark:bg-studio-panel rounded-2xl shadow-lg border-2 border-dashed border-studio-border-light dark:border-studio-border hover:border-studio-accent transition-all duration-300 transform hover:scale-105"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-14 h-14 bg-studio-accent/20 rounded-xl flex items-center justify-center">
                                        <feature.icon className="w-8 h-8 text-studio-accent" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-studio-text-light dark:text-studio-text mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-studio-text-light/70 dark:text-studio-text/70 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {showCreateOrEditModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowCreateOrEditModal(false)}>
                    <div className="bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#333] dark:bg-[#333] p-6 rounded-t-2xl border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    {projectToEdit ? <Edit className="w-6 h-6 text-[#F48969]" /> : <FilePlus className="w-6 h-6 text-[#F48969]" />}
                                    {projectToEdit ? "تعديل المشروع" : "مشروع جديد"}
                                </h2>
                                <button
                                    onClick={() => setShowCreateOrEditModal(false)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={projectToEdit ? handleUpdateProject : handleCreateProject} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        اسم المشروع *
                                    </label>
                                    <input
                                        type="text"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        placeholder="أدخل اسم المشروع..."
                                        className="w-full px-4 py-3 bg-[#1F1F1F] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-[#F48969] focus:ring-1 focus:ring-[#F48969] focus:outline-none transition-all"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        الوصف (اختياري)
                                    </label>
                                    <textarea
                                        value={newProjectDescription}
                                        onChange={(e) => setNewProjectDescription(e.target.value)}
                                        placeholder="أضف وصفاً للمشروع..."
                                        className="w-full px-4 py-3 bg-[#1F1F1F] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-[#F48969] focus:ring-1 focus:ring-[#F48969] focus:outline-none transition-all resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateOrEditModal(false)}
                                    className="flex-1 px-6 py-3 bg-transparent border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 hover:text-white transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newProjectName.trim()}
                                    className="flex-1 px-6 py-3 bg-[#F48969] hover:bg-[#e07555] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <LoaderCircle className="w-5 h-5 animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        projectToEdit ? "حفظ التغييرات" : "إنشاء المشروع"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {projectToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProjectToDelete(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="bg-red-100 text-red-800 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Trash2 className="w-6 h-6" />
                                    تأكيد الحذف
                                </h2>
                                <button
                                    onClick={() => setProjectToDelete(null)}
                                    className="p-2 hover:bg-black/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-700 mb-6 text-lg">
                                هل أنت متأكد من حذف المشروع <span className="font-bold text-gray-900">&quot;{projectToDelete.name}&quot;</span>؟
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                <p className="text-sm text-red-800 font-medium">
                                    ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setProjectToDelete(null)}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="w-5 h-5 animate-spin" />
                                            جاري الحذف...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-5 h-5" />
                                            حذف نهائي
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-30px); }
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-float-delayed {
                    animation: float-delayed 8s ease-in-out infinite;
                }
                
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fade-in-down {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out backwards;
                }
                
                .animate-fade-in-down {
                    animation: fade-in-down 0.6s ease-out;
                }
                
                .animate-fade-in-up-delay {
                    animation: fade-in-up 0.6s ease-out 0.2s backwards;
                }
                
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}