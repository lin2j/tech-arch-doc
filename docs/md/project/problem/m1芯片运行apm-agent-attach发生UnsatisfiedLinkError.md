**问题**

M1 芯片运行 `apm-agent-attach` 依赖包发生虚拟机错误 `java.lang.UnsatisfiedLinkError` 。

本地 idea 配置的 jdk 时 zulu 1.8 的版本。

```java
Caused by: java.lang.UnsatisfiedLinkError: /Users/jay/Library/Caches/JNA/temp/jna6476532391668202562.tmp: dlopen(/Users/jay/Library/Caches/JNA/temp/jna6476532391668202562.tmp, 0x0001): tried: '/Users/jay/Library/Caches/JNA/temp/jna6476532391668202562.tmp' (fat file, but missing compatible architecture (have 'i386,x86_64', need 'arm64e')), '/usr/lib/jna6476532391668202562.tmp' (no such file)
	at java.lang.ClassLoader$NativeLibrary.load(Native Method)
	at java.lang.ClassLoader.loadLibrary0(ClassLoader.java:1950)
	at java.lang.ClassLoader.loadLibrary(ClassLoader.java:1832)
	at java.lang.Runtime.load0(Runtime.java:811)
	at java.lang.System.load(System.java:1088)
	at com.sun.jna.Native.loadNativeDispatchLibraryFromClasspath(Native.java:1018)
	at com.sun.jna.Native.loadNativeDispatchLibrary(Native.java:988)
	at com.sun.jna.Native.<clinit>(Native.java:195)
	at co.elastic.apm.attach.bytebuddy.agent.VirtualMachine$ForHotSpot$Connection$ForJnaPosixSocket$Factory.withDefaultTemporaryFolder(VirtualMachine.java:893)
	at co.elastic.apm.attach.bytebuddy.agent.VirtualMachine$ForHotSpot.attach(VirtualMachine.java:243)
... 11 more
```

经过搜索，可以确定这是因为依赖包要访问一些平台相关的系统本地库时，发现临时文件不是自己需要的结构导致的。

可以关注到这个错误点，依赖包需要的是 arm 架构的文件，但是依赖包生成的不是 arm 架构的文件。

```java
...temp/jna6476532391668202562.tmp' (fat file, but missing compatible architecture (have 'i386,x86_64', need 'arm64e'))
```

下面从三个不同的思路，来对这个问题进行解决。

**解决办法**

1. 使用 X86 架构下的 JDK

   即我们经常使用的 Oracle JDK，但是在运行时会对代码进行 Rosetta 转译，速度会慢一些，但是至少能用。

   没条件的可以用这种方式。

2. 修改依赖包的版本

   `apm-agent-attach`访问系统本地库是通过 `jna` 和 `jan-platform` 这两个包实现的。

   但是这两个包只有在 5.7 版本以及更新的版本中，才有针对 arm 架构进行适配。

   因此可以在引入 `  apm-agent-attach` 依赖时，剔除这两个依赖包，然后重新引入 5.7 版本及以上的包。

   如果开发者可以修改 pom.xml 文件，可以使用这种方式。

```xml
<dependency>
   <groupId>co.elastic.apm</groupId>
   <artifactId>apm-agent-attach</artifactId>
   <exclusions>
      <exclusion>
         <groupId>net.java.dev.jna</groupId>
         <artifactId>jna-platform</artifactId>
      </exclusion>
      <exclusion>
         <groupId>net.java.dev.jna</groupId>
         <artifactId>jna</artifactId>
      </exclusion>
   </exclusions>
</dependency>

<dependency>
   <groupId>net.java.dev.jna</groupId>
   <artifactId>jna-platform</artifactId>
   <version>5.10.0</version>
</dependency>

<dependency>
   <groupId>net.java.dev.jna</groupId>
   <artifactId>jna</artifactId>
   <version>5.10.0</version>
</dependency>
```

3. 开发时不开启 `apm agent server` 

   我认为 apm 一般用于监测线上系统的运行情况，实际开发时不需要用到，是否可以通过参数关闭掉呢？

   基于这个想法，我阅读 `apm-agent-attach` 的源代码发现，其内部为了防止对同一个 JVM 虚拟机多次绑定，使用了一个参数 `ElasticApm.attached` 进行标识。 

​	   在这个方法内做判断 `co.elastic.apm.attach.ElasticApmAttacher#attach(String, Map<String,String>)` 。

![apm-agent-attach](https://www.lin2j.tech/blog-image/problem/apm-agent-attach.png)

因此可以在虚拟机参数中将这个参数标记为 true，便可以跳过 `apm attach server` 启动过程，从而避免访问本地库。

![apm-agent-attach-vm-option](https://www.lin2j.tech/blog-image/problem/apm-agent-attach-vm-option.png)

（界面也许有些不同，靠自己）

**总结**

方法一虽然好，但是编译时会比较慢，总会让人心里有些不爽。（不过还是比较可靠的方式，一般都能顺利解决）

方法二是比较好的方式，发生这种平台相关的错误时，我们可以去看一下报错的依赖包是否调用了一些本地库的方法。尝试去这个调用本地库的依赖包对应的开源社区搜索一下关键字，看是否能通过更改版本号来解决。（不过这也许需要一些基础的英语阅读能力）

方法三的出现是因为我不能修改 pom 文件，项目组有很多人一起开发这个项目。我不希望因为个人的原因，去修改这个配置。因此驱使我去寻找一种通过参数来避免问题的方法。当然，不是所有的依赖都能在开发时通过参数去跳过它的，这点仁者见仁，各取所需。（能顺利开发下去才是关键）

