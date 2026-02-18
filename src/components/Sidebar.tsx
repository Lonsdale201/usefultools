import { NavLink } from 'react-router-dom'
import { Database, FileText, ArrowLeftRight, GitCompare, Code2, Wrench, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

const navItems = [
  { labelKey: 'nav.dataGenerator', descKey: 'nav.dataGenerator.desc', path: '/data-generator', icon: Database },
  { labelKey: 'nav.textToolbox', descKey: 'nav.textToolbox.desc', path: '/text-toolbox', icon: FileText },
  { labelKey: 'nav.converters', descKey: 'nav.converters.desc', path: '/converters', icon: ArrowLeftRight },
  { labelKey: 'nav.diffCompare', descKey: 'nav.diffCompare.desc', path: '/diff-compare', icon: GitCompare },
  { labelKey: 'nav.codeUtils', descKey: 'nav.codeUtils.desc', path: '/code-utils', icon: Code2 },
]

export function Sidebar() {
  const { t, lang, setLang } = useI18n()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Wrench className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg tracking-tight">UsefulTools</span>
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
  )
}
