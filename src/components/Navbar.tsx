'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import {
    LogOut, User as UserIcon, LogIn, UserPlus, Bell, Menu, X, Mic,
    Settings, ChevronDown, Sparkles, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showPromoBar, setShowPromoBar] = useState(true);

    const profileMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        router.push('/');
        setProfileMenuOpen(false);
    };

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle click outside profile menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileMenuRef]);

    if (pathname.startsWith('/studio/')) {
        return null;
    }

    const navLinks = [
        { name: 'مشاريعي', href: '/projects', icon: LayoutDashboard },
        { name: 'الأسعار', href: '/pricing', icon: Sparkles },
        { name: 'التوثيق', href: '/docs', icon: null },
    ];

    const isLandingPage = pathname === '/';
    const isProjectsPage = pathname.startsWith('/projects');

    let positionClass = 'relative'; // Default safe behavior avoids overlap on Auth/generic pages
    if (isLandingPage) positionClass = 'fixed top-0';
    if (isProjectsPage) positionClass = 'absolute top-0';

    return (
        <div className={`w-full z-50 transition-all duration-300 ${positionClass}`}>
            {/* Promo Bar - Only on Landing Page */}
            {isLandingPage && !user && showPromoBar && (
                <div className="bg-gradient-to-r from-primary via-orange-500 to-rose-500 text-white text-xs md:text-sm py-2 px-4 relative overflow-hidden">
                    <div className="container mx-auto flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="font-bold">عرض خاص: 14 يوم تجربة مجانية شاملة لكل الأدوات!</span>
                        </div>
                        <button onClick={() => setShowPromoBar(false)} aria-label="إغلاق الإعلان" className="hover:bg-white/20 rounded-full p-1 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <nav
                className={`w-full transition-all duration-300 ${scrolled
                    ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm py-2'
                    : isLandingPage && showPromoBar ? 'bg-background/60 backdrop-blur-md py-4' : 'bg-transparent border-b border-transparent py-4'
                    }`}
            >
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between">

                        {/* Logo Section */}
                        <Link href="/" className="flex items-center gap-3 group relative z-50">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 bg-primary/40 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-60"></div>
                                <Image
                                    src="/logos/ms-logo-orange.png"
                                    alt="MuejamStudio Logo"
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-contain relative z-10 rounded-3xl transform transition-all duration-300 group-hover:scale-105"
                                />
                            </div>
                            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-tight">
                                MuejamStudio
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1 bg-secondary/50 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/5 shadow-inner">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 ${pathname === link.href
                                        ? 'text-primary bg-background shadow-md'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                        }`}
                                >
                                    {link.icon && <link.icon className={`w-4 h-4 ${pathname === link.href ? 'text-primary' : ''}`} />}
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Right Section: Auth & Mobile Toggle */}
                        <div className="flex items-center gap-4">
                            {user ? (
                                <div className="hidden md:block relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        aria-label="قائمة المستخدم"
                                        className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border transition-all duration-300 ${profileMenuOpen
                                            ? 'bg-secondary border-primary/30 ring-2 ring-primary/10'
                                            : 'bg-background border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/20">
                                            {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                                        </div>
                                        <div className="text-right hidden lg:block">
                                            <p className="text-xs font-bold text-foreground leading-none mb-0.5">{user.displayName}</p>
                                            <p className="text-[10px] text-muted-foreground leading-none">Basic Plan</p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {profileMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute right-0 top-full mt-2 w-64 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50 transform origin-top-right"
                                            >
                                                <div className="p-4 bg-muted/30 border-b border-border/50">
                                                    <p className="font-bold text-foreground text-sm">{user.displayName}</p>
                                                    <p className="text-xs text-muted-foreground truncate font-mono mt-1">{user.email}</p>
                                                </div>

                                                <div className="p-2 space-y-1">
                                                    <Link href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-xl transition-colors">
                                                        <UserIcon className="w-4 h-4" />
                                                        ملفي الشخصي
                                                    </Link>
                                                    <Link href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-xl transition-colors">
                                                        <Settings className="w-4 h-4" />
                                                        الإعدادات
                                                    </Link>
                                                    <Link href="/notifications" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary rounded-xl transition-colors">
                                                        <Bell className="w-4 h-4" />
                                                        الإشعارات
                                                        <span className="mr-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
                                                    </Link>
                                                </div>

                                                <div className="p-2 border-t border-border/50 bg-muted/20">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        تسجيل الخروج
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="hidden md:flex items-center gap-3">
                                    <Link
                                        href="/login"
                                        className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
                                    >
                                        تسجيل الدخول
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 flex items-center gap-2"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        حساب جديد
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Menu Toggle */}
                            <div className="md:hidden">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
                                    className="p-2 text-foreground bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                                >
                                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
                        >
                            <div className="px-6 py-8 space-y-6">
                                {user && (
                                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl border border-border">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                            {user.displayName?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-lg">{user.displayName}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${pathname === link.href
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                        >
                                            {link.icon && <link.icon className="w-5 h-5" />}
                                            {link.name}
                                        </Link>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-border">
                                    {user ? (
                                        <div className="space-y-3">
                                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors">
                                                <LogOut className="w-5 h-5" />
                                                تسجيل الخروج
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-center bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-colors">
                                                دخول
                                            </Link>
                                            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-center bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg transition-colors">
                                                جديد
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </div>
    );
}