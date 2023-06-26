---
title: 实用插件推荐 - Show Comment
---



最近发现一款不错的 IDEA 插件 **Show Comment**，可以**辅助显示**代码注释。

它能在左侧的目录树显示每个文件的类注释，也能在代码中显示每一行的代码注释，前提是你这一行的字段或者方法已经写过注释了。

但是要想插件生效的话，写注释的时候要注意**使用 Javadoc 规范**，见过有些小伙伴喜欢给类的字段写行尾注释，这样 IDEA 读取不到这个字段的注释。

像下面这样，而且我觉得这种注释方式有点丑陋。

```java
private String name; // 姓名
```

**下面是效果图**，代码中的暗绿色行尾注释就是 Show Comment 自动显示的**虚拟文字**，并不会影响这一行的真实文字。

![show_comment](https://www.lin2j.tech/blog-image/intellij-recommoned/show_comment.png)

如果对与这个插件有什么配置要求，可以尝试在 `Tools > //Show Comment Global` 这个位置进行全局设置

也可以在  `Tools > //Show Comment Global > //Show Comment Project`  只针对某个项目进行设置。

![show_comment_settings](https://www.lin2j.tech/blog-image/intellij-recommoned/show_comment_settings.png) 

这个插件给我的使用感受就是，用了之后，我更喜欢写注释了。有点强迫症的我，会尽量在字段和方法的注释上多下功夫。

而且看别人的代码时，如果他有写代码，阅读起来也方便许多。



这个插件的代码是开源的，我本身也喜欢自己做一些 IntelliJ 平台的插件开发，如果大家觉得这个插件好用，可以给这个作者的项目一个 Star。

最后附上这个插件的 Github 地址：https://github.com/LinWanCen/show-comment