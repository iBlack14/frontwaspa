'use client';
import Image from 'next/image';
// ✅ Lazy load de imágenes
const fondo_transparent = '/logo/wazilrest_white.png';
const wazilrest_logo = '/logo/wazilrest_logo.png';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import Breadcrumb from '../Breadcrumb';
import ThemeToggle from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabase';
import {
  HomeIcon,
  ServerIcon,
  UserIcon,
  BriefcaseIcon,
  InboxIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftOnRectangleIcon,
  RectangleStackIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  BellIcon,
} from '@heroicons/react/24/outline';

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, status, signOut } = useAuth();
  const email = session?.user?.email;
  const username = session?.username;
  const photourl = session?.user?.image;

  const [hasMounted, setHasMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pathname, setPathname] = useState('');

  // Notifications Logic
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [instancesMap, setInstancesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setHasMounted(true);
    setPathname(router.asPath);
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
        // Recuperar estado colapsado en desktop
        const savedState = localStorage.getItem('sidebarCollapsed');
        setIsCollapsed(savedState ? JSON.parse(savedState) : false);
      } else {
        setIsCollapsed(false); // En móvil no colapsamos, usamos drawer
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router.asPath]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    // 1. Fetch instances to map IDs to Names
    const fetchInstances = async () => {
      try {
        const { data } = await supabase.from('instances').select('document_id, profile_name, phone_number');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((i: any) => {
            map[i.document_id] = i.profile_name || i.phone_number || 'Instancia';
          });
          setInstancesMap(map);
        }
      } catch (e) {
        console.error('Error fetching instances for notifications:', e);
      }
    };

    fetchInstances();

    // 2. Subscribe to new messages (Global Listener)
    if (!session || !(session as any).jwt) return;

    // Use singleton client for notifications with Realtime ENABLED
    // IMPORTANT: Authorization header ensures we pass RLS policies
    const channel = supabase
      .channel('global-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const newMessage = payload.new;

          // Ignore own messages
          if (newMessage.from_me) return;

          // Add to notifications
          setNotifications(prev => {
            const instanceName = instancesMap[newMessage.instance_id] || 'WhatsApp';
            const notif = {
              id: newMessage.id,
              title: newMessage.sender_name || newMessage.sender_phone || 'Nuevo mensaje',
              subtitle: `${instanceName} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              instanceId: newMessage.instance_id,
              text: newMessage.message_text || (newMessage.media_url ? '📷 Foto' : 'Mensaje'),
            };

            // Keep max 3, new ones at top
            return [notif, ...prev].slice(0, 3);
          });
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status, instancesMap, session]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const handleLogout = async () => {
    try {
      await signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sidebarCollapsed');
      }
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/';
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const menuItems = [
    { name: 'Home', icon: <HomeIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/home', action: () => handleNavigation('/home') },
    { name: 'Instances', icon: <ServerIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/instances', action: () => handleNavigation('/instances') },
    { name: 'Messages', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/messages', action: () => handleNavigation('/messages') },
    { name: 'Profile', icon: <UserIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/profile', action: () => handleNavigation('/profile') },
    { name: 'Templates', icon: <RectangleStackIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/templates', action: () => handleNavigation('/templates') },
    { name: 'Subscription', icon: <InboxIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/subscription', action: () => handleNavigation('/subscription') },
    { name: 'Documentations', icon: <DocumentTextIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/docs', action: () => handleNavigation('/docs') },
    { name: 'Apps', icon: <Squares2X2Icon className="w-6 h-6" strokeWidth={1.5} />, path: '/apps', action: () => handleNavigation('/apps') },
    { name: 'Suite', icon: <BriefcaseIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/suite', action: () => handleNavigation('/suite') },
    { name: 'Logout', icon: <ArrowLeftOnRectangleIcon className="w-6 h-6" strokeWidth={1.5} />, path: '/login', action: handleLogout },
  ];

  if (!hasMounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#1e293b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" strokeWidth={1.5} />
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Connect BLXK</span>
          </div>
          <ThemeToggle />
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out' : 'relative h-full transition-all duration-300 ease-in-out'}
          ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : (isCollapsed ? 'w-20' : 'w-72')}
          bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl
        `}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/50">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">Connect BLXK</span>
            </div>
          )}
          {isCollapsed && !isMobile && (
            <div className="mx-auto h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-lg">C</span>
            </div>
          )}

          {isMobile ? (
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <XMarkIcon className="w-6 h-6" strokeWidth={1.5} />
            </button>
          ) : (
            !isCollapsed && (
              <button onClick={toggleCollapse} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
              </button>
            )
          )}
        </div>

        {/* Collapse Button (Desktop Only - Centered when collapsed) */}
        {!isMobile && isCollapsed && (
          <div className="flex justify-center py-4 border-b border-slate-100 dark:border-slate-800/50">
            <button onClick={toggleCollapse} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
              <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.path;
            return (
              <div
                key={index}
                onClick={item.action}
                className={`
                  group flex items-center cursor-pointer transition-all duration-200 rounded-xl
                  ${isCollapsed && !isMobile ? 'justify-center p-3' : 'px-4 py-3'}
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }
                  ${item.name === 'Logout' ? 'mt-8 hover:!bg-red-50 dark:hover:!bg-red-900/10 hover:!text-red-600 dark:hover:!text-red-400' : ''}
                `}
              >
                <div className={`${isActive ? 'text-white' : ''}`}>
                  {item.icon}
                </div>

                {(!isCollapsed || isMobile) && (
                  <span className="ml-3 font-medium text-[15px]">{item.name}</span>
                )}

                {/* Tooltip for Collapsed State */}
                {isCollapsed && !isMobile && (
                  <div className="absolute left-16 ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-xl">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#162032]">
          <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3'}`}>
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 p-[2px] shadow-sm">
                {photourl ? (
                  <Image
                    src={photourl}
                    alt="User"
                    height={40}
                    width={40}
                    className="rounded-full bg-white dark:bg-slate-900"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {email ? email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>

            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                  {username || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {email}
                </p>
              </div>
            )}

            {(!isCollapsed || isMobile) && !isMobile && (
              <ThemeToggle />
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-[#0f172a] transition-all duration-300 ${isMobile ? 'pt-16' : ''}`}>

        {/* Global Floating Notification Icon */}
        <div className="absolute top-4 right-6 z-50 pointer-events-auto">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-full bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-[#1e293b] hover:scale-105 transition-all duration-200 group"
            >
              <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-indigo-500 transition-colors" strokeWidth={1.5} />
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#1e293b] animate-pulse"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Notificaciones</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{notifications.length} nuevas</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No hay notificaciones nuevas
                    </div>
                  ) : (
                    notifications.map((notif, i) => (
                      <div key={i} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0 cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{notif.title}</span>
                          <span className="text-[10px] text-slate-400">{notif.subtitle.split('•')[1]}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-1">{notif.text}</p>
                        <span className="text-[10px] text-indigo-500 font-medium bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                          {notif.subtitle.split('•')[0]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarLayout>
      {/* Breadcrumb removed from here as it might be better placed inside pages or redesigned */}
      {/* <Breadcrumb /> */}
      {children}
    </SidebarLayout>
  );
}