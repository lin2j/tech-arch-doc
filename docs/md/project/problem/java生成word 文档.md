**前言**

Java 要生成 word 文档，可以借助 freemarker 引擎生成。

可能很多人不知道，Word 其实可以导出为 xml 文件，而 xml 文件又可以很轻松的转换为 ftl 文件，只需改个后缀名。

ftl 是 freemarker 文件的后缀，其内容格式与 xml 没太大差别。

而且 freemarker 是一个模版引擎，有自己的语法但是不复杂，非常适合用来生成 html 或者 xml。

> Freemarker 手册   
>
>  http://freemarker.foofun.cn/index.html
>
> 项目demo 
>
> https://github.com/lin2j/ftl2doc

**栗子🌰**

拿到 Word 文档模版，将需要在运行时填入的空位，增加占位符，然后另存为 xml 格式。

![ftl2doc-word](https://www.lin2j.tech/blog-image/problem/ftl2doc-word.png)

将 .xml 后缀修改为 .ftl 后缀，然后打开 idea 对文件内容进行格式化，否则太难看。

```xml
<w:r wsp:rsidRPr="00D769EC">
    <w:rPr>
        <w:rFonts w:ascii="楷体" w:fareast="楷体" w:h-ansi="楷体"/>
        <wx:font wx:val="楷体"/>
        <w:sz w:val="32"/>
        <w:sz-cs w:val="32"/>
    </w:rPr>
    <w:t>${userName}</w:t>
</w:r>
...
<w:r wsp:rsidRPr="00D769EC">
    <w:rPr>
        <w:rFonts w:ascii="楷体" w:fareast="楷体" w:h-ansi="楷体"/>
        <wx:font wx:val="楷体"/>
        <w:sz w:val="32"/>
        <w:sz-cs w:val="32"/>
    </w:rPr>
    <w:t>${age}</w:t>
</w:r>
...
<w:r wsp:rsidRPr="00D769EC">
    <w:rPr>
        <w:rFonts w:ascii="楷体" w:fareast="楷体" w:h-ansi="楷体"/>
        <wx:font wx:val="楷体"/>
        <w:sz w:val="32"/>
        <w:sz-cs w:val="32"/>
    </w:rPr>
    <w:t>${birthday?string('yyyy年MM月dd日')}</w:t>
</w:r>
```

之后就是将查询出来的数据填补到这个模版中即可，过程并不复杂。

```java
import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.date.DatePattern;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import freemarker.template.Configuration;
import freemarker.template.Template;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;

/**
 * @author linjinjia
 * @date 2021/12/2 20:58 下午
 */
public class Ftl2DocTest {

    public static final String BASE_PACKAGE_DIR = "/static/exportTemplate";

    public static void main(String[] args) throws IOException {
        // 加载模版
        Configuration configuration = configuration();
        Template template = configuration.getTemplate("user.ftl");

        // 创建临时输出目录
        String dir = "/data/ftl2doc/export/doc-" + DateUtil.format(new Date(), "yyyyMMddHHmmss");
        FileUtil.mkdir(dir);

        // 模拟数据
        List<User> users = new ArrayList<>();
        users.add(new User("张三", 25, DateUtil.parse("1997-04-07", "yyyy-MM-dd")));
        users.add(new User("李四", 26, DateUtil.parse("1996-01-09", "yyyy-MM-dd")));
        users.add(new User("王五", 27, DateUtil.parse("1995-09-08", "yyyy-MM-dd")));
        users.add(new User("赵六", 28, DateUtil.parse("1994-03-10", "yyyy-MM-dd")));

        // 简单的做法是把 JavaBean 转换为 Map，然后进行导出
        // data 的 key 作为输出文档的名称，value 是一个 bena 转化的 map，存储实体数据
        Map<String, Map<String, Object>> data = new HashMap<>();
        for(User user : users) {
            String docName = user.getUserName() + DateUtil.format(new Date(), DatePattern.PURE_DATETIME_PATTERN)+".doc";
            Map<String, Object> map = BeanUtil.beanToMap(user);
            data.put(docName, map);
        }

        // 输出
        data.forEach((docName, model) -> {
            try {
                File file = new File(dir, docName);
                FileWriter writer = new FileWriter(file);
                template.process(model, writer);
            } catch (Exception e) {
                // 输出错误日志，demo 直接简单打印到控制台
                e.printStackTrace();
            }
        });
    }

    public static freemarker.template.Configuration configuration() {
        Configuration configuration = new Configuration(Configuration.DEFAULT_INCOMPATIBLE_IMPROVEMENTS);
        configuration.setDefaultEncoding("utf-8");
        configuration.setClassicCompatible(true);
        // 设置模版所在的目录，建议所有的模版都放在同一个目录下
        configuration.setClassForTemplateLoading(Ftl2DocTest.class, BASE_PACKAGE_DIR);
        return configuration;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    static class User {
        private String userName;
        private Integer age;
        private Date birthday;
    }
}
```



导出结果

![ftl2doc-result](https://www.lin2j.tech/blog-image/problem/ftl2doc-result.png)

**被坑心得**

1. 另存为 xml 前，最好在 word 中对每个要填的位置写下占位符 ${xx}。不然在 ftl 中想找到对应的位置，可能找到你吐。
2. 在 Word 中，一行文字保存为 xml 后，可能会被分为几小段，所以你的占位符可能会被拆散，需要手动调整。
3. ftl 修改后，尽量不要改动模版，因为 Word 虽然能直接到开 ftl 的文件，但是也可能因为 ftl 本身的语法与 xml 有区别，导致不能正常打开。
4. 使用 `template.process(model, writer)` 导出时，这个model对象可以用 Map ，也可以 JavaBean 实现 TemplateModel 接口。但我觉得用 Map 就已经可以满足了，不需要再去折腾。

最后献上我的 pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.jia</groupId>
    <artifactId>ftl2doc</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.freemarker</groupId>
            <artifactId>freemarker</artifactId>
            <version>2.3.30</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.6</version>
        </dependency>
        <dependency>
            <groupId>cn.hutool</groupId>
            <artifactId>hutool-all</artifactId>
            <version>4.5.16</version>
        </dependency>
    </dependencies>

</project>
```