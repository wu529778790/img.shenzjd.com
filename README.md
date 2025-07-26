# img

github pages: <https://wu529778790.github.io/img/>

## 利用`github仓库`当做图床存储的服务器

- GitHub 对每个仓库的大小有限制，目前这个限制是 1GB。
- GitHub 对单个文件的大小有限制，目前这个限制是 100MB。

特点是免费、稳定，有一个小缺点是国内访问速度慢，不过没关系，可以使用`jsDelivr`免费CDN加速。

> `jsDelivr`是国外的一家优秀的公共 CDN 服务提供商，该平台是首个「打通中国大陆与海外的免费CDN服务」，无须担心中国防火墙问题而影响使用。官网：<http://www.jsdelivr.com/>

jsdelivr的限制增加了仓库总存储超过50MB的会停止加速服务，当图片过多超过50MB时就没法使用加速了，需要另寻CDN加速服务

- jsDelivr: `https://cdn.jsdelivr.net/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}`
- GitHub: `https://github.com/{{owner}}/{{repo}}/raw/{{branch}}/{{path}}`
- Statically: `https://cdn.statically.io/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}`
- ChinaJsDelivr: `https://jsd.cdn.zzko.cn/gh/{{owner}}/{{repo}}@{{branch}}/{{path}}`

## 利用[picgo](https://github.com/Molunerfinn/PicGo)上传

PicGo: 一个用于快速上传图片并获取图片 URL 链接的工具

我经常用vscode写文章，所以下载vs-picgo插件

配置如下图：

![20210606000138](https://cdn.jsdelivr.net/gh/wu529778790/image/blog/20210606000138.png)

配置文档：<https://picgo.github.io/PicGo-Doc/zh/guide/config.html#github%E5%9B%BE%E5%BA%8A>

上传快捷键：

![20210606000309](https://cdn.jsdelivr.net/gh/wu529778790/image/blog/20210606000309.png)

## 利用[picx](https://picx-docs.xpoet.cn)管理

我主要利用picx进行后台管理
