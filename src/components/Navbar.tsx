'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, LogIn, UserPlus, Bell, Menu, X, Plus } from 'lucide-react';

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
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    
                    {/* Left section: Logo */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link href={user ? "/projects" : "/"}>
                                <VoiceLogo />
                            </Link>
                        </div>
                    </div>

                    {/* Centered navigation for desktop */}
                    <div className="hidden sm:flex sm:items-center sm:space-x-4 absolute left-1/2 -translate-x-1/2">
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`rounded-md px-3 py-2 text-sm font-medium ${
                                    pathname === item.href
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right section: Mobile menu button and Desktop Profile/Auth */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <div className="sm:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
                        <div className="hidden sm:flex items-center">
                            {user ? (
                                <div className="relative ml-3" ref={profileMenuRef}>
                                    <div>
                                        <button type="button" onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                            <UserIcon className="h-8 w-8 rounded-full text-gray-400" />
                                        </button>
                                    </div>
                                    {profileMenuOpen && (
                                        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <div className="px-4 py-3 border-b border-gray-200">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                            </div>
                                            <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                                            <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                                            <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center ml-6 gap-x-4">
                                    <Link href="/login" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Sign in</Link>
                                    <Link href="/register" className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Sign up</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="sm:hidden">
                    <div className="space-y-1 pt-2 pb-3">
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                                    pathname === item.href
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 pt-4 pb-3">
                        {user ? (
                            <>
                                <div className="flex items-center px-4">
                                    <div className="flex-shrink-0">
                                        <UserIcon className="h-10 w-10 rounded-full text-gray-400" />
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-800">{user.displayName}</div>
                                        <div className="text-sm font-medium text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <Link href="#" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">Your Profile</Link>
                                    <Link href="#" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">Settings</Link>
                                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">Sign out</button>
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
        </header>
    );
}