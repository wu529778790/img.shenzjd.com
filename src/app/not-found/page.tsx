import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FolderGit, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6">
        <FolderGit className="h-24 w-24 mx-auto text-gray-300 dark:text-gray-700" />
        <div>
          <h2 className="text-2xl font-bold mb-2">页面未找到</h2>
          <p className="text-gray-500">
            抱歉，您访问的页面不存在或已被移除
          </p>
        </div>
        <Link href="/">
          <Button>
            <Home className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  )
}
