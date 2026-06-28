# github图床(利用picGo + github +  jsDelivr / Statically)

## 前言

> Q：为什么要使用图床呢？什么是图床?

A：写博客文章时，图片的上传和存放是一个问题，有的朋友可能会把图片放到和博客同一个仓库当中，使用相对路径来引用，这样后期维护起来会比较麻烦。还有的朋友会在不同的平台发布同一篇文章，这样一来每个平台都要上传图片，为了解决这些问题，比较推荐的做法是把图片统一上传到一个在线的第三方静态资源库中，我们把这个资源库称为图床，其返回一个图片的URL，使用`markdown+图片url`的方式写作文章，一次编写，到处使用~

> Q：图床的选择

A：推荐使用GitHub作为图床，特点是免费、稳定，有一个小缺点是国内访问速度慢，不过没关系，可以使用`jsDelivr`免费CDN加速。

- GitHub 对每个仓库的大小有限制，目前这个限制是 1GB。
- GitHub 对单个文件的大小有限制，目前这个限制是 100MB。

> Q：jsDelivr是什么？

A：`jsDelivr`是国外的一家优秀的公共 CDN 服务提供商，该平台是首个「打通中国大陆与海外的免费CDN服务」，无须担心中国防火墙问题而影响使用。官网：<http://www.jsdelivr.com/>

> jsdelivr的限制增加了仓库总存储超过50MB的会停止加速服务，当图片过多超过50MB时就没法使用加速了，需要另寻CDN加速服务

Statically CDN 使用了Anycast CDN（Anycast Internet Acceleration，AIA）中国大陆大概率分配使用日本东京的节点，据说有国内节点，但十次有九次是海外的，不是美国，加拿大就是日本，韩国，但速度还不错，比jsdelivr的CloudFlare快了一点，CloudFlare在中国有节点，但是不用，一直都是走美西的节点

Tips:jsdelivr主要用CloudFlare其次是fastly，Statically正好相反

使用方式 <https://cdn.statically.com/gh/:user/:repo/:tag/:file>

域名是cdn.staticaly.com

cdn.statically.io是面向海外用户的，访问会显示连接超时

### 域名替换

cdn.jsdelivr.net  叕被污染了

可以用下面的替换

gcore.jsdelivr.net/

fastly.jsdelivr.net/

originfastly.jsdelivr.net/

testingcf.jsdelivr.net/

## 步骤

PicGo 是一个开源的图床工具，它可以帮助你自动化图片上传的过程。

### 1. github创建存储图片资源的仓库image

### 2. vscode下载插件vs-picgo

### 3. 配置github

![20210606000138](https://cdn.jsdelivr.net/gh/wu529778790/image@master/blog/20210606000138.png)

### 4. 配置文档

 <https://picgo.github.io/PicGo-Doc/zh/guide/config.html#github%E5%9B%BE%E5%BA%8A>

![20210606000309](https://cdn.jsdelivr.net/gh/wu529778790/image@master/blog/20210606000309.png)
