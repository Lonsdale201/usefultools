import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Database, FileText, ArrowLeftRight, GitCompare, Code2, Wrench, Globe, ScrollText, X, ChevronLeft, ChevronRight, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import changelogRaw from '../../CHANGELOG.md?raw'

interface ChangelogEntry {
  version: string
  section: string
  text: string
  details: string[]
}

const CHANGELOG_PAGE_SIZE = 3

function parseChangelog(markdown: string): ChangelogEntry[] {
  const normalize = (value: string) => value.replace(/`([^`]+)`/g, '$1').trim()
  const entries: ChangelogEntry[] = []
  const lines = markdown.split(/\r?\n/)
  let currentVersion = 'Unknown'
  let currentSection = 'Change'

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    const versionMatch = line.match(/^##\s+\[(.+?)\](?:\s*-\s*(.+))?$/)
    if (versionMatch) {
      const version = versionMatch[1]
      const date = versionMatch[2]?.trim()
      currentVersion = date ? `${version} (${date})` : version
      continue
    }

    const sectionMatch = line.match(/^###\s+(.+)$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim()
      continue
    }

    const bulletMatch = line.match(/^(\s*)- (.+)$/)
    if (bulletMatch) {
      const indent = bulletMatch[1].length
      const text = normalize(bulletMatch[2])
      if (indent === 0) {
        entries.push({ version: currentVersion, section: currentSection, text, details: [] })
      } else if (entries.length > 0) {
        entries[entries.length - 1].details.push(text)
      }
    }
  }

  return entries
}

const navItems = [
  { labelKey: 'nav.dataGenerator', descKey: 'nav.dataGenerator.desc', path: '/data-generator', icon: Database },
  { labelKey: 'nav.textToolbox', descKey: 'nav.textToolbox.desc', path: '/text-toolbox', icon: FileText },
  { labelKey: 'nav.converters', descKey: 'nav.converters.desc', path: '/converters', icon: ArrowLeftRight },
  { labelKey: 'nav.diffCompare', descKey: 'nav.diffCompare.desc', path: '/diff-compare', icon: GitCompare },
  { labelKey: 'nav.everydayTools', descKey: 'nav.everydayTools.desc', path: '/everyday-tools', icon: Calculator },
  { labelKey: 'nav.codeUtils', descKey: 'nav.codeUtils.desc', path: '/code-utils', icon: Code2 },
]

export function Sidebar() {
  const { t, lang, setLang } = useI18n()
  const [isChangelogOpen, setIsChangelogOpen] = useState(false)
  const [page, setPage] = useState(0)

  const changelogEntries = useMemo(() => parseChangelog(changelogRaw), [])
  const totalPages = Math.max(1, Math.ceil(changelogEntries.length / CHANGELOG_PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const visibleEntries = changelogEntries.slice(
    safePage * CHANGELOG_PAGE_SIZE,
    safePage * CHANGELOG_PAGE_SIZE + CHANGELOG_PAGE_SIZE
  )

  useEffect(() => {
    if (!isChangelogOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsChangelogOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isChangelogOpen])

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1))
    }
  }, [page, totalPages])

  const openChangelog = () => {
    setPage(0)
    setIsChangelogOpen(true)
  }

  const ui = lang === 'hu'
    ? {
        openChangelog: 'Változásnapló megnyitása',
        changelog: 'Változásnapló',
        closeChangelog: 'Változásnapló bezárása',
        noEntries: 'Nincs található bejegyzés a changelogban.',
        prev: 'Előző',
        next: 'Következő',
        page: 'Oldal',
      }
    : {
        openChangelog: 'Open changelog',
        changelog: 'Changelog',
        closeChangelog: 'Close changelog',
        noEntries: 'No changelog entries found.',
        prev: 'Prev',
        next: 'Next',
        page: 'Page',
      }

  return (
    <>
      <div className="flex h-full w-64 flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg tracking-tight">UsefulTools</span>
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto h-8 w-8"
            onClick={openChangelog}
            title={ui.openChangelog}
            aria-label={ui.openChangelog}
          >
            <ScrollText className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">{t(item.labelKey)}</div>
                  <div className="text-xs opacity-70">{t(item.descKey)}</div>
                </div>
              </NavLink>
            ))}
          </nav>
          <Separator className="my-2" />

          {/* Language switcher */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{t('nav.language')}</span>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={lang === 'en' ? 'default' : 'outline'}
                className="flex-1 h-7 text-xs"
                onClick={() => setLang('en')}
              >
                EN
              </Button>
              <Button
                size="sm"
                variant={lang === 'hu' ? 'default' : 'outline'}
                className="flex-1 h-7 text-xs"
                onClick={() => setLang('hu')}
              >
                HU
              </Button>
            </div>
          </div>

          <Separator className="my-2" />
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground">
              {t('nav.footer')}
            </p>
          </div>
        </ScrollArea>
      </div>

      {isChangelogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsChangelogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="font-semibold text-sm">{ui.changelog}</p>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setIsChangelogOpen(false)}
                aria-label={ui.closeChangelog}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 p-4">
              {visibleEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">{ui.noEntries}</p>
              ) : (
                visibleEntries.map((entry, idx) => (
                  <div key={`${safePage}-${idx}`} className="rounded-md border p-3">
                    <p className="text-[11px] text-muted-foreground">{entry.version} - {entry.section}</p>
                    <p className="mt-1 text-xs font-medium">{entry.text}</p>
                    {entry.details.length > 0 && (
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                        {entry.details.map((detail, detailIdx) => (
                          <li key={`${safePage}-${idx}-${detailIdx}`} className="leading-relaxed">{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={safePage === 0}
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                {ui.prev}
              </Button>
              <span className="text-xs text-muted-foreground">{ui.page} {safePage + 1} / {totalPages}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={safePage >= totalPages - 1}
              >
                {ui.next}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
