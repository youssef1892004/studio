'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, LogIn, UserPlus, Bell, Menu, X, Plus, Mic } from 'lucide-react';

const VoiceLogo = () => (
    <svg className="h-8 w-auto text-indigo-600" width="800px" height="800px" viewBox="0 0 48 48" id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg">
        <path d="M24,45.5A21.5,21.5,0,1,1,45.5,24,21.51,21.51,0,0,1,24,45.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.75,14.4A7.09,7.09,0,0,1,9,13.09c8.44,0,7.91,22,18.09,22,8.82,0,8.31-18.09,16.63-19.77" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.23,13.51c6.52,3,6.84,21.58,16.18,21.58S29.66,15.2,39.33,15.2a6.87,6.87,0,0,1,5.17,2.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function Navbar() {
    const { user, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const profileMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

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
        { name: 'Projects', href: '/projects' },
        { name: 'About', href: '/about' },
        { name: 'Docs', href: '/docs' },
        { name: 'Pricing', href: '/pricing' },
    ];

    return (
        <nav className="bg-studio-bg-light dark:bg-studio-bg border-b border-studio-border-light dark:border-studio-border sticky top-0 z-50 backdrop-blur-sm">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-studio-accent rounded-lg flex items-center justify-center transform transition-transform group-hover:scale-110">
                            <Mic className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-studio-text-light dark:text-studio-text">Voice Studio</span>
                    </Link>

                    {/* Navigation Links */}
                    {user && (
                        <div className="hidden md:flex items-center gap-1">
                            <Link
                                href="/projects"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/projects'
                                    ? 'bg-studio-accent text-white'
                                    : 'text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel'
                                    }`}
                            >
                                مشاريعي
                            </Link>
                            <Link
                                href="/pricing"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/pricing'
                                    ? 'bg-studio-accent text-white'
                                    : 'text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel'
                                    }`}
                            >
                                الأسعار
                            </Link>
                            <Link
                                href="/docs"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/docs'
                                    ? 'bg-studio-accent text-white'
                                    : 'text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel'
                                    }`}
                            >
                                التوثيق
                            </Link>
                        </div>
                    )}

                    {/* Right section: Mobile menu button and Desktop Profile/Auth */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel focus:outline-none focus:ring-2 focus:ring-inset focus:ring-studio-accent"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                        {/* Desktop Profile/Auth */}
                        <div className="hidden md:flex items-center">
                            {user ? (
                                <div className="relative ml-3" ref={profileMenuRef}>
                                    <div>
                                        <button type="button" onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex rounded-full bg-studio-bg-light dark:bg-studio-bg text-sm focus:outline-none focus:ring-2 focus:ring-studio-accent focus:ring-offset-2 focus:ring-offset-studio-bg-light dark:focus:ring-offset-studio-bg">
                                            <UserIcon className="h-8 w-8 rounded-full text-studio-text-light dark:text-studio-text" />
                                        </button>
                                    </div>
                                    {profileMenuOpen && (
                                        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-studio-panel-light dark:bg-studio-panel py-1 shadow-lg ring-1 ring-studio-border-light dark:ring-studio-border focus:outline-none">
                                            <div className="px-4 py-3 border-b border-studio-border-light dark:border-studio-border">
                                                <p className="text-sm font-medium text-studio-text-light dark:text-studio-text truncate">{user.displayName}</p>
                                                <p className="text-sm text-studio-text-light dark:text-studio-text-light truncate">{user.email}</p>
                                            </div>
                                            <Link href="#" className="block px-4 py-2 text-sm text-studio-text-light dark:text-studio-text hover:bg-studio-panel-hover-light dark:hover:bg-studio-panel-hover">Your Profile</Link>
                                            <Link href="#" className="block px-4 py-2 text-sm text-studio-text-light dark:text-studio-text hover:bg-studio-panel-hover-light dark:hover:bg-studio-panel-hover">Settings</Link>
                                            <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-studio-text-light dark:text-studio-text hover:bg-studio-panel-hover-light dark:hover:bg-studio-panel-hover">Sign out</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center ml-6 gap-x-4">
                                    <Link href="/login" className="inline-flex items-center justify-center rounded-md border border-studio-border-light dark:border-studio-border px-4 py-2 text-sm font-medium text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel">Sign in</Link>
                                    <Link href="/register" className="inline-flex items-center justify-center rounded-md border border-transparent bg-studio-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-studio-accent-dark">Sign up</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden">
                    <div className="space-y-1 pt-2 pb-3">
                        {user && (
                            <>
                                <Link
                                    href="/projects"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname === '/projects'
                                        ? 'border-studio-accent bg-studio-panel-light text-studio-accent'
                                        : 'border-transparent text-studio-text-light hover:border-studio-border-light hover:bg-studio-panel-light hover:text-studio-text'
                                        }`}
                                >
                                    مشاريعي
                                </Link>
                                <Link
                                    href="/pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname === '/pricing'
                                        ? 'border-studio-accent bg-studio-panel-light text-studio-accent'
                                        : 'border-transparent text-studio-text-light hover:border-studio-border-light hover:bg-studio-panel-light hover:text-studio-text'
                                        }`}
                                >
                                    الأسعار
                                </Link>
                                <Link
                                    href="/docs"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${pathname === '/docs'
                                        ? 'border-studio-accent bg-studio-panel-light text-studio-accent'
                                        : 'border-transparent text-studio-text-light hover:border-studio-border-light hover:bg-studio-panel-light hover:text-studio-text'
                                        }`}
                                >
                                    التوثيق
                                </Link>
                            </>
                        )}
                    </div>
                    <div className="border-t border-studio-border-light dark:border-studio-border pt-4 pb-3">
                        {user ? (
                            <>
                                <div className="flex items-center px-4">
                                    <div className="flex-shrink-0">
                                        <UserIcon className="h-10 w-10 rounded-full text-studio-text-light dark:text-studio-text" />
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-studio-text-light dark:text-studio-text">{user.displayName}</div>
                                        <div className="text-sm font-medium text-studio-text-light dark:text-studio-text-light">{user.email}</div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <Link href="#" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel">Your Profile</Link>
                                    <Link href="#" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel">Settings</Link>
                                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-base font-medium text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel">Sign out</button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1 px-2">
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-md py-2 px-3 text-base font-medium text-gray-700 hover:bg-gray-100">Sign in</Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}