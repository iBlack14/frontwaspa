'use client';
import Image from 'next/image';
// ✅ Lazy load de imágenes
const fondo_transparent = '/logo/wazilrest_white.png';
const wazilrest_logo = '/logo/wazilrest_logo.png';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import Breadcrumb from '../Breadcrumb';
import ThemeToggle from '@/components/ThemeToggle';
import {
  HomeIcon,
  ServerIcon,
  UserIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  InboxIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftOnRectangleIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = router.pathname;
  // ✅ Una sola llamada a useSession
  const { data: session, status } = useSession();
  const email = session?.user?.email;
  const username = session?.username;
  const photourl = session?.user?.image;

  const [hasMounted, setHasMounted] = useState(false);
  const isMobileInitial = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isMobile, setIsMobile] = useState(isMobileInitial);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return isMobileInitial;
    }
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState !== null ? JSON.parse(savedState) : isMobileInitial;
  });

  useEffect(() => {
    setHasMounted(true);
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    } else {
      setIsCollapsed(isMobile);
    }
  }, [isMobile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const menuItems = [
    { name: 'Home', icon: <HomeIcon className="w-6 h-6" />, path: '/home', action: () => handleNavigation('/home') },
    { name: 'Instances', icon: <ServerIcon className="w-6 h-6" />, path: '/instances', action: () => handleNavigation('/instances') },
    { name: 'Messages', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, path: '/messages', action: () => handleNavigation('/messages') },
    { name: 'Profile', icon: <UserIcon className="w-6 h-6" />, path: '/profile', action: () => handleNavigation('/profile') },
    { name: 'Templates', icon: <RectangleStackIcon className="w-6 h-6" />, path: '/templates', action: () => handleNavigation('/templates') },
    { name: 'Subscription', icon: <InboxIcon className="w-6 h-6" />, path: '/subscription', action: () => handleNavigation('/subscription') },
    { name: 'Documentations', icon: <DocumentTextIcon className="w-6 h-6" />, path: '/docs', action: () => handleNavigation('/docs') },
    { name: 'Suite', icon: <BriefcaseIcon className="w-6 h-6" />, path: '/suite', action: () => handleNavigation('/suite') },
    { name: 'Logout', icon: <ArrowLeftOnRectangleIcon className="w-6 h-6" />, path: '/login', action: handleLogout },
  ];
  

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`bg-white dark:bg-zinc-900 text-gray-900 dark:text-white h-full border-r border-gray-200 dark:border-zinc-800 ${isCollapsed ? 'w-20' : 'w-64'
          } transition-width duration-300 ease-in-out flex flex-col shadow-lg dark:shadow-xl overflow-y-auto`}
      >
        <div className="p-4 flex items-center border-zinc-700">
          <div className="flex items-center">
            {isCollapsed ? (
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <Image
                  src={wazilrest_logo}
                  alt="Background Logo"
                  height={250}
                  width={250}
                  quality={100}
                  priority
                  className="mx-auto"
                />
              </div>
            ) : (
              <div className="flex items-center">
                <Image
                  src={fondo_transparent}
                  alt="Background Logo"
                  height={250}
                  width={250}
                  quality={100}
                  priority
                  className="mx-auto"
                />
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!isCollapsed && <ThemeToggle />}
            <button onClick={toggleCollapse} className="px-1 text-zinc-400 hover:text-white transition-colors duration-200">
              {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex-grow py-6 px-3 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.path;
            return (
              <div
                key={index}
                onClick={item.action}
                className={`relative group flex ${isCollapsed ? 'flex-col items-center justify-center' : 'flex-row items-center'
                  } ${isCollapsed ? 'mx-2 px-3 py-4' : 'px-4 py-3.5'} mb-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105' 
                    : 'hover:bg-gray-100 dark:hover:bg-zinc-800/80 text-gray-700 dark:text-gray-300 hover:scale-102'
                  } ${item.name === 'Logout' ? 'mt-auto hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400' : ''}`}
              >
                <div className={`${isCollapsed ? 'mb-0' : 'mr-4'} flex-shrink-0 ${isActive ? 'text-white' : ''}`}>
                  {item.name === 'Logout' ? (
                    <ArrowLeftOnRectangleIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                  ) : (
                    <div className={isActive ? 'text-white' : ''}>
                      {item.icon}
                    </div>
                  )}
                </div>

                {isCollapsed && !isMobile && (
                  <div
                    className={`absolute left-full ml-3 top-1/2 transform -translate-y-1/2 hidden group-hover:block ${
                      item.name === 'Logout' ? 'bg-red-600' : 'bg-emerald-600'
                    } text-white text-sm px-4 py-2 rounded-lg shadow-xl z-50 whitespace-nowrap`}
                  >
                    {item.name}
                    <div className={`absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent ${
                      item.name === 'Logout' ? 'border-r-red-600' : 'border-r-emerald-600'
                    }`}></div>
                  </div>
                )}

                {!isCollapsed && (
                  <div className="flex items-center flex-1">
                    <span className={`text-base font-medium ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                  </div>
                )}

                {!isCollapsed && isActive && (
                  <div className="w-1 h-6 bg-white rounded-full ml-auto"></div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : ''} border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50`}
        >
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center overflow-hidden shadow-md">
            {photourl ? (
              <Image
                src={photourl}
                alt="User Photo"
                height={40}
                width={40}
                quality={100}
                className="rounded-full"
              />
            ) : (
              <div className="bg-emerald-600 text-white text-sm font-bold h-full w-full flex items-center justify-center">
                {email ? email.charAt(0).toUpperCase() : 'N/A'}
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-100">{username}</div>
              <div className="text-xs text-gray-400">{email}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-zinc-800 h-full overflow-y-auto">
        {status === 'loading' && (
          <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
            
          </div>
          
        )}
        {status === 'authenticated' && children}



        <footer className="w-full flex flex-col items-center py-6 bg-transparent">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 text-sm">
            <span>© {new Date().getFullYear()} <span className="font-semibold text-gray-800 dark:text-gray-200">Wazilrest</span>.</span>
            <span>Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center mt-1 text-gray-500 dark:text-gray-400 text-xs">
            <span>Creado con</span>
            <span className="mx-1 text-red-500 text-lg">❤️</span>
            <span>por el equipo Wazilrest</span>
          </div>
        </footer>



      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarLayout>
      <Breadcrumb />
      <div className="p-2">{children}</div>
    </SidebarLayout>
  );
}