**起因**

今天在打包新项目到服务器运行时，项目启动失败，报的异常是 ClassNotFoundException，而项目在本地启动是没有任何问题的。

![ClassNotFound](https://www.lin2j.tech/blog-image/problem/ClassNotFound.png)

**分析**

不过既然是找不到类，我还是再检查了一遍引入的依赖，并且检查 lib 目录下是否有报类缺失的 jar 包。然而，对应的 jar 包确实有在 lib 包下面。

 ![lib-folder](https://www.lin2j.tech/blog-image/problem/lib-folder.png)

为了进一步了解依赖的引入关系，我将主类所在的 jar 进行解压（unzip *.jar），并检查 MANIFEST.MF 中的类路径。

 ![MANIFEST](https://www.lin2j.tech/blog-image/problem/MANIFEST.png)

这时候可以发现，MANIFEST.MF 中的类路径和 lib 下的路径明显不一样了。

MANIFEST.MF 中的包名是不带时间戳的，而 lib 下的是带时间戳的，所以 JVM 在 lib 下找不到想要的 jar 包（不带时间戳的），最终报了 ClassNotFoundException。

**结论**

显然，现在的解决方案就是想办法让 MANIFEST.MF 中的包名和 lib 下的包名一致即可。

通过Google，我最终确定这两处包名的格式是由我的 pom.xml 以及assembly.xml 的配置决定的。

pom.xml 的配置项 `useUniqueVersions` 设置为 false，在打包时将不会把jar包的时间戳记录到 MANIFEST.MF 中。

而在 assembly.xml 中的 `dependencySet` 配置项中没有对 lib 下的 jar 包的格式进行限制。

因此导致了 MANIFEST.MF 中的包名没有时间戳，而 lib 下的包名没有改变，从而二者不同。

`pom.xml` 文件的关键配置

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <configuration>
        <!-- 剔除配置文件 -->
        <excludes>
            <exclude>*.properties</exclude>
            <exclude>*.yml</exclude>
            <exclude>*.xml</exclude>
        </excludes>
        <archive>
            <manifest>
                <addClasspath>true</addClasspath>
                <!-- MANIFEST.MF 中 Class-Path 各个依赖加入前缀 -->
                <!--lib文件夹内容，需要 maven-dependency-plugin插件补充 -->
                <classpathPrefix>../lib</classpathPrefix>
                <!-- jar包不包含唯一版本标识 -->
                <useUniqueVersions>false</useUniqueVersions>
                <!--指定入口类 -->
                <mainClass>com.suntek.video.app.VideoWebApplication</mainClass>
            </manifest>
        </archive>
    </configuration>
</plugin>
```

`assembly.xml` 的关键配置

```xml
<dependencySets>
    <dependencySet>
        <outputDirectory>lib</outputDirectory>
    </dependencySet>
</dependencySets>
```

**解决办法**

解决办法是想办法让 lib 下的包名不要包含时间戳。

需要 dependencySet 下增加一项配置 `outputFileNameMapping` 来固定 lib 下的 jar 包名称，去掉时间戳。

修改后的 `assembly.xml`

```xml
<dependencySet>
    <outputFileNameMapping>
        ${artifact.artifactId}-${artifact.baseVersion}.${artifact.extension}
    </outputFileNameMapping>
    <outputDirectory>lib</outputDirectory>
</dependencySet>
```

再一次打包，发现 lib 下的包名称已经改变了，也能正常启动了。 

 ![lib-folder-format](https://www.lin2j.tech/blog-image/problem/lib-folder-format.png)

最后我觉得这种方式虽然能解决这个问题，但是相对还是比较麻烦的。建议还是使用 spring-boot-maven-plugin 来打包，就不会出现这种时间戳问题。

