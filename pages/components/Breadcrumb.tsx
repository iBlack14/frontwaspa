'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import SidebarComponent from './SidebarComponent';

export default function Breadcrumb() {
    const pathname = usePathname();
    if (!pathname) return null;

    const pathParts = pathname.split('/').filter(Boolean);


    const showButton = pathParts[0] === 'suite' || pathParts[0] === 'instances';




    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const defaultFilter: 'all' | 'plan' | 'no-plan' =
        pathParts[0] === 'instances'
            ? 'plan'
            : pathParts[0] === 'suite'
                ? 'no-plan'
                : 'all';



    // Toggle sidebar visibility
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };




    return (
        <nav className="bg-zinc-800  shadow-zinc-800">
            <div className="px-12 py-8 flex items-center border-b-2 border-zinc-700">
                <div className="flex items-center justify-between w-full">
                    <ol className="flex items-center space-x-1 text-sm">
                        <li>
                            <Link
                                href="/"
                                className="flex items-center text-zinc-400 hover:text-zinc-300 transition-colors duration-200"
                            >
                                <HomeIcon className="w-4 h-4 mr-1" />
                                <span className="text-xl font-medium">Home</span>
                            </Link>
                        </li>

                        {pathParts.map((part, index) => {
                            const href = '/' + pathParts.slice(0, index + 1).join('/');
                            const isLast = index === pathParts.length - 1;
                            const label = decodeURIComponent(part);

                            return (
                                <li key={index} className="flex items-center space-x-1">
                                    <ChevronRightIcon className="w-4 h-4 text-zinc-500" />
                                    {isLast ? (
                                        <span className="text-white text-xl capitalize font-semibold px-1">{label}</span>
                                    ) : (
                                        <Link
                                            href={href}
                                            className="text-zinc-400 hover:text-zinc-300 transition-colors duration-200 capitalize px-1"
                                        >
                                            {label}
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                    {showButton && (
                        <button
                            onClick={toggleSidebar}
                            className="mb-4 bg-red-600 text-white px-4 py-2 mr-18 rounded font-bold hover:bg-red-700 transition"
                        >
                            {isSidebarOpen
                                ? 'Cerrar Tienda'
                                : defaultFilter === 'plan'
                                    ? '👑 Upgrade Instances 👑 '
                                    : defaultFilter === 'no-plan'
                                        ? '👑 Buy Suite 👑'
                                        : ''}
                        </button>
                    )}

                </div>
            </div>
            <SidebarComponent
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
                initialFilter={defaultFilter}
            />
        </nav>

    );
}