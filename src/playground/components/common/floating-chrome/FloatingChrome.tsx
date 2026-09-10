import { ConversationsSheet } from '@/playground/components/common/floating-chrome/ConversationsSheet'
import { ProfileSheet } from '@/playground/components/common/floating-chrome/ProfileSheet'
import { glassButtonClass } from '@/playground/components/common/floating-chrome/glass'
import { NewChatButton } from '@/playground/components/common/floating-chrome/NewChatButton'
import { ProjectDialog } from '@/playground/components/common/project-dialog/ProjectDialog'
import { cn } from '@/playground/lib/cn'
import { isMac } from '@/playground/lib/platform'
import { useTranslation } from '@/playground/i18n'
import { useDemo } from '@/playground/providers/PlaygroundProvider'
import { Menu01Icon } from 'hugeicons-react'
import { useState } from 'react'

/**
 * The chat screen's floating chrome — two glass discs laid over the
 * transcript: the leading one opens the conversations sheet (all pages plus
 * the conversations list), the trailing one is New chat (or the active
 * project's manage dialog in project mode).
 */
export function FloatingChrome(): React.JSX.Element {
  const { t } = useTranslation()
  const { newSession, activeProject, setActiveProject, activeSession } = useDemo()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const busy = activeSession.pendingTurn !== null

  return (
    <>
      <div
        className={cn(
          'pointer-events-none fixed inset-x-0 z-30 flex items-center justify-between',
          isMac ? 'top-12 px-3' : 'top-6 px-4'
        )}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          title={t('chat.conversations')}
          aria-label={t('chat.conversations')}
          className={glassButtonClass}
        >
          <Menu01Icon size={18} />
        </button>
        {activeProject ? (
          <button
            type="button"
            onClick={() => setProjectDialogOpen(true)}
            title={activeProject.title.trim() || t('projects.untitled')}
            aria-label={t('projects.project')}
            className={glassButtonClass}
          >
            <span aria-hidden className="text-base leading-none">
              {activeProject.icon || '📁'}
            </span>
          </button>
        ) : (
          <NewChatButton onNew={() => newSession()} onNewInProject={(projectId) => newSession({ projectId })} />
        )}
      </div>
      {sheetOpen && (
        <ConversationsSheet
          onClose={() => setSheetOpen(false)}
          onOpenProfile={() => setProfileOpen(true)}
          suspended={profileOpen}
        />
      )}
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ProjectDialog
        project={projectDialogOpen ? activeProject : null}
        onClose={() => setProjectDialogOpen(false)}
        onChanged={setActiveProject}
        busy={busy}
        onNewConversation={(p) => {
          setProjectDialogOpen(false)
          newSession({ projectId: p.id })
        }}
        onExitProject={() => {
          setProjectDialogOpen(false)
          newSession()
        }}
      />
    </>
  )
}
