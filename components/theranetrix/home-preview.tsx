'use client';

import {useEffect, type CSSProperties} from 'react';
import {ChevronRight, MessageSquarePlus, Search} from 'lucide-react';
import {toast} from 'sonner';
import {Toaster} from '@/components/ui/sonner';
import {SidebarProvider, Sidebar, SidebarTrigger} from '@/components/ui/sidebar';
import type {Workspace} from '@/lib/theranetrix';
import {needsAction} from '@/lib/patient-overview';
import {Navigation, type Context} from './app';
import {DoctorFocus} from './doctor-focus';
import {NeedsActionBell} from './needs-action';
import {GuideButton} from './guide-dialog';

const previewMessage = () => toast.info('Home screen preview', {
  description: 'This preview uses sample patients. Other screens and saving changes are not included.',
  id: 'home-preview',
});

/** A presentation-only entry point. It never loads or saves a live workspace. */
export function HomePreview({data}: {data: Workspace}) {
  const attention = needsAction(data);
  const ctx: Context = {
    data, user: 'Demo care team', accessMode: 'shared', busy: false,
    open: previewMessage,
    save: async () => { previewMessage(); return false; },
    signOut: async () => { previewMessage(); },
  };

  // Also covers links rendered into notification/dialog portals. Keep reviewers
  // on the single exported page instead of sending them to an unavailable route.
  useEffect(() => {
    function keepHome(event: globalThis.MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link) return;
      const destination = new URL(link.getAttribute('href')!, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === '/') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      previewMessage();
    }
    document.addEventListener('click', keepHome, true);
    document.addEventListener('auxclick', keepHome, true);
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('[aria-label="Search clinical overview"]')?.focus();
      }
    }
    document.addEventListener('keydown', focusSearch);
    return () => {
      document.removeEventListener('click', keepHome, true);
      document.removeEventListener('auxclick', keepHome, true);
      document.removeEventListener('keydown', focusSearch);
    };
  }, []);

  return <>
    <SidebarProvider className="redesign-shell" style={{'--sidebar-width': '216px'} as CSSProperties}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar className="thera-sidebar">
        <Navigation path="/" enginePatient="" user="Demo care team" accessMode="shared"
          reviews={data.reviews.filter(review => review.status !== 'Resolved').length}
          replies={attention.groups.find(group => group.id === 'replies')?.rows.length ?? 0}/>
      </Sidebar>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <SidebarTrigger aria-label="Toggle navigation" className="mobile-menu"/>
            <a className="desktop-crumb" href="/">Care workspace</a>
            <ChevronRight size={14} className="desktop-crumb"/><span>Care overview</span>
          </div>
          <div className="top-tools">
            <button className="prototype-feedback-trigger" onClick={previewMessage}><MessageSquarePlus size={16}/><span>Feedback</span></button>
            <button className="search-trigger" aria-label="Find a patient" onClick={() => {
              document.querySelector<HTMLInputElement>('[aria-label="Search clinical overview"]')?.focus();
            }}><Search size={17}/><span>Search patients</span><kbd>⌘ K</kbd></button>
            <GuideButton path="/"/>
            <NeedsActionBell attention={attention}/>
            <a href="/settings?tab=access" className="top-avatar" aria-label="Account and access">TN</a>
          </div>
        </header>
        <main className="main-content" id="main-content"><DoctorFocus ctx={ctx}/></main>
        <footer className="workspace-footer" style={{justifyContent: 'flex-start', gap: 16, flexWrap: 'wrap'}}><span>Focus concept · Sample patients · Changes are not saved</span><form action="/__preview/logout" method="post"><button type="submit" className="text-link">Lock preview</button></form></footer>
      </div>
      <Toaster position="top-right" richColors closeButton/>
    </SidebarProvider>
  </>;
}
