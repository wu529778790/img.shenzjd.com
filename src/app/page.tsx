import { redirect } from 'next/navigation'

export default function HomePage() {
  // 已登录用户重定向到上传页
  redirect('/upload')
}
