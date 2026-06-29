import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  // 移除路由保护，允许未登录用户访问
  // 现在改为在页面内显示骨架屏 + 弹窗提示登录
  matcher: []  // 空数组表示不拦截任何路由
}
