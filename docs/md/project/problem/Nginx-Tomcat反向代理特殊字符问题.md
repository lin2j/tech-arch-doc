问题：

想使用 nginx 的反向代理功能通过url前缀转发到对应的服务模块去，却发生下面的错误。

```java
java.lang.IllegalArgumentException: The character [_] is never valid in a domain name.
	org.apache.tomcat.util.http.parser.HttpParser$DomainParseState.next(HttpParser.java:974)
	org.apache.tomcat.util.http.parser.HttpParser.readHostDomainName(HttpParser.java:870)
	org.apache.tomcat.util.http.parser.Host.parse(Host.java:71)
	org.apache.tomcat.util.http.parser.Host.parse(Host.java:45)
	org.apache.coyote.AbstractProcessor.parseHost(AbstractProcessor.java:294)
	org.apache.coyote.http11.Http11Processor.prepareRequest(Http11Processor.java:776)
	org.apache.coyote.http11.Http11Processor.service(Http11Processor.java:349)
	org.apache.coyote.AbstractProcessorLight.process(AbstractProcessorLight.java:65)
	org.apache.coyote.AbstractProtocol$ConnectionHandler.process(AbstractProtocol.java:868)
	org.apache.tomcat.util.net.NioEndpoint$SocketProcessor.doRun(NioEndpoint.java:1594)
	org.apache.tomcat.util.net.SocketProcessorBase.run(SocketProcessorBase.java:49)
	java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
	java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
	org.apache.tomcat.util.threads.TaskThread$WrappingRunnable.run(TaskThread.java:61)
	java.base/java.lang.Thread.run(Thread.java:829)
```

```conf
  upstream mgr_upstream {
      server 127.0.0.1:8989;
  }

  server {
      listen       80;
      server_name  localhost;

      location / {
          root   html;
          index  index.html index.htm;
      }

      location /mgr {
          proxy_pass http://mgr_upstream/mgr;
      }
   ...

```

解决办法：

将配置文件内的 upstream 的名称中的**下划线去掉**即可。

```conf
  upstream mgrupstream {
      server 127.0.0.1:8989;
  }

  server {
      listen       80;
      server_name  localhost;

      location / {
          root   html;
          index  index.html index.htm;
      }

      location /mgr {
          proxy_pass http://mgrupstream/mgr;
      }
   ...
```

原因：

Tomcat版本问题。