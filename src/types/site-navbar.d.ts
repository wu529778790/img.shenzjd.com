// 公共导航 web component（@wu529778790/site-navbar），由 unpkg 脚本注册
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type SiteNavbarAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'site-navbar': SiteNavbarAttributes
      }
    }
  }
}

export {}
