import Link from 'next/link'
import { FileTextIcon } from 'lucide-react'

export const Navbar = () => {
  return (
    <nav className="h-14 border-b bg-background flex items-center px-6 gap-4">
      <Link href="/documents" className="flex items-center gap-2 font-semibold text-lg">
        <FileTextIcon className="size-5" />
        DocParser
      </Link>
    </nav>
  )
}