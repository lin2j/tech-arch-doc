# 什么是 SPI 机制

SPI （Service Provider Interface）是 Java 内置的一种**服务提供**发现机制，将功能的实现交给第三方，用来拓展和替换组件。

SPI 的核心思想是**解耦**，将接口的定义和实现分开两部分处理。接口的调用方负责定义接口，而实现则由第三方去实现。

SPI 机制允许将功能的实现抽离出原本的模块，在模块化设计中颇为受用。

当服务的提供者实现了一种接口之后，需要在自己的 classpath 下的 `META-INF/services` 目录新建一个文件，文件名是接口的名称，内容是接口的实现类的全限定名称，每个实现类占一行。

<img src="https://www.lin2j.tech/blog-image/basic/SPI%E6%9C%BA%E5%88%B6.png" alt="SPI机制" >

# SPI 机制的简单示例

假设当前有一个 `DataSearch` 接口，搜索的实现可以基于数据库或者 Elastic Search 实现。

这里采用 Maven 多模块的方式来模拟调用方和服务提供方可能不在同一个包内。

目录结构：

<img alt="spi-demo" src="https://www.lin2j.tech/blog-image/basic/spi-demo.png" >

1. 先定义好接口

   ```java
   package com.jia.spidemo;
   
   public interface DataSearch {
       /**
        * 数据查询
        */
       void search();
   }
   ```

2. MySQL 数据库实现，并在 resource 下新建 `META-INF/services/com.jia.spidemo.DataSearch` 文件，内容为  `com.jia.spidemo.MySqlSearch`

   ```java
   package com.jia.spidemo;
   
   public class MySqlSearch implements DataSearch {
       @Override
       public void search() {
           System.out.println("MySQL Search");
       }
   }
   ```

3. Elastic Search 全文搜索，并在 resource 下新建 `META-INF/services/com.jia.spidemo.DataSearch` 文件，内容为  `com.jia.spidemo.ElasticSearch`

   ```java
   package com.jia.spidemo;
   
   public class ElasticSearch implements DataSearch{
       @Override
       public void search() {
           System.out.println("Elastic Search");
       }
   }
   ```

4. 测试

   ```java
   package com.jia.spidemo;
   
   public class Application {
   
       public static void main(String[] args) {
           ServiceLoader<DataSearch> serviceLoader = ServiceLoader.load(DataSearch.class);
           Iterator<DataSearch> iterator = serviceLoader.iterator();
           while (iterator.hasNext()) {
             	// 只有在调用 next 方法时，才会创建对应的实例
               DataSearch ds = iterator.next();
               ds.search();
           }
       }
   }
   ```

可以看到输出结果：

```bash
MySQL Search
Elastic Search
```

这就是 SPI 的使用方式，[示例代码下载](https://www.lin2j.tech/blog-image/code/spi-demo.zip)

# SPI 机制的应用

## 数据库驱动程序加载

Java数据库连接（JDBC）规范使用了SPI机制，通过在classpath下提供特定命名的配置文件，让开发者可以注册和加载数据库驱动程序的实现类。这样可以实现在运行时根据配置文件加载不同的数据库驱动程序。

## SLF4J 日志门面

许多Java日志系统（如SLF4J）使用SPI机制，通过提供不同的实现类来支持不同的日志框架。开发者可以根据需要选择合适的日志实现，并在classpath下提供相应的配置文件，实现日志系统的动态切换和扩展。

## 插件系统

许多应用程序（比如 Eclipse）或框架都提供了插件机制，允许开发者通过SPI机制来注册和加载插件。这样可以让应用程序在不修改源代码的情况下，通过提供新的插件实现类来扩展功能，实现动态的插件加载和卸载。

## Spring 中的 SPI 机制

与 Java 内置的 SPI 有异曲同工之妙的是 Spring 的工厂加载机制，即 `Spring Factories Loader`，用户先在 `META-INF/spring.factories`  路径下配置好接口和实现类的关系，然后通过 `SpringFactoriesLoader` 加载实现类，该机制可以为框架上下文动态的增加扩展。

spring.factories 文件示例：

```
com.jia.spidemo.spring_factory_test.IUserService=\
  com.jia.spidemo.spring_factory_test.UserService,\
  com.jia.spidemo.spring_factory_test.UserService2
```

# SPI 的实现原理

```java
package java.util;

// ServiceLoader 实现了 Iterable 接口，
// 通过自己的内部迭代器可以遍历所有的服务实现类
public final class ServiceLoader<S>
    implements Iterable<S>
{
		// 规定的配置文件路径
    private static final String PREFIX = "META-INF/services/";
  
    // 服务接口的 Class
    private final Class<S> service;

    // 用来加载服务实现实例的类加载器，用来定位、加载和实例化提供者
    private final ClassLoader loader;
  
    // 访问控制上下文，用来限制对敏感操作的访问权限
    private final AccessControlContext acc;

    // 缓存服务实现类，并保证加载的顺序缓存
    private LinkedHashMap<String,S> providers = new LinkedHashMap<>();

    // ServiceLoader 实现的内部迭代器
    private LazyIterator lookupIterator;

  	// 重新加载所有的实现类，相当重新创建了 ServiceLoader
    // 这个方法用来在 JVM 运行时，加载新的服务提供者
    public void reload() {
        providers.clear();
        lookupIterator = new LazyIterator(service, loader);
    }

    // 私有构造器，使用指定的类加载器加载服务实例
    // 如果没有指定类加载器，则使用应用类加载器
    private ServiceLoader(Class<S> svc, ClassLoader cl) {
        service = Objects.requireNonNull(svc, "Service interface cannot be null");
        loader = (cl == null) ? ClassLoader.getSystemClassLoader() : cl;
        acc = (System.getSecurityManager() != null) ? AccessController.getContext() : null;
        reload();
    }

    // 解析失败处理
    private static void fail(Class<?> service, String msg, Throwable cause)
        throws ServiceConfigurationError
    {
        throw new ServiceConfigurationError(service.getName() + ": " + msg,
                                            cause);
    }

    private static void fail(Class<?> service, String msg)
        throws ServiceConfigurationError
    {
        throw new ServiceConfigurationError(service.getName() + ": " + msg);
    }

    private static void fail(Class<?> service, URL u, int line, String msg)
        throws ServiceConfigurationError
    {
        fail(service, u + ":" + line + ": " + msg);
    }

    // 解析配置文件的某一行，先去掉注释，然后判断该行是否含有非法字符
    // 将成功解析的结果放入到 names 列表中，重复的配置项和已经被加载的服务项不会被放入列表
    // 返回下一行的行号
    private int parseLine(Class<?> service, URL u, BufferedReader r, int lc,
                          List<String> names)
        throws IOException, ServiceConfigurationError
    {
        String ln = r.readLine();
        if (ln == null) {
            return -1;
        }
        int ci = ln.indexOf('#');
        if (ci >= 0) ln = ln.substring(0, ci);
        ln = ln.trim();
        int n = ln.length();
        if (n != 0) {
            if ((ln.indexOf(' ') >= 0) || (ln.indexOf('\t') >= 0))
                fail(service, u, lc, "Illegal configuration-file syntax");
            int cp = ln.codePointAt(0);
            // 通过调用isJavaIdentifierStart方法，
            // 可以方便地检查一个字符是否符合Java标识符的开始条件（就是 Java 定义的合法标识符开头，'a', '_', '$'）
            // 从而进行合法性验证或进行相应的处理。
            if (!Character.isJavaIdentifierStart(cp))
                fail(service, u, lc, "Illegal provider-class name: " + ln);
            for (int i = Character.charCount(cp); i < n; i += Character.charCount(cp)) {
                cp = ln.codePointAt(i);
                if (!Character.isJavaIdentifierPart(cp) && (cp != '.'))
                    fail(service, u, lc, "Illegal provider-class name: " + ln);
            }
            if (!providers.containsKey(ln) && !names.contains(ln))
                names.add(ln);
        }
        return lc + 1;
    }

    // 加载给定的 URL 作为配置文件
    private Iterator<String> parse(Class<?> service, URL u)
        throws ServiceConfigurationError
    {
        InputStream in = null;
        BufferedReader r = null;
        ArrayList<String> names = new ArrayList<>();
        try {
            in = u.openStream();
            r = new BufferedReader(new InputStreamReader(in, "utf-8"));
            int lc = 1;
            while ((lc = parseLine(service, u, r, lc, names)) >= 0);
        } catch (IOException x) {
            fail(service, "Error reading configuration file", x);
        } finally {
            try {
                if (r != null) r.close();
                if (in != null) in.close();
            } catch (IOException y) {
                fail(service, "Error closing configuration file", y);
            }
        }
        return names.iterator();
    }

    // 私有的内部懒加载迭代器
    private class LazyIterator
        implements Iterator<S>
    {

        Class<S> service;
        ClassLoader loader;
        Enumeration<URL> configs = null;
        Iterator<String> pending = null;
        String nextName = null;

        private LazyIterator(Class<S> service, ClassLoader loader) {
            this.service = service;
            this.loader = loader;
        }

        // 加载
        private boolean hasNextService() {
            if (nextName != null) {
                return true;
            }
            if (configs == null) {
                try {
                    String fullName = PREFIX + service.getName();
                    if (loader == null)
                        configs = ClassLoader.getSystemResources(fullName);
                    else
                        configs = loader.getResources(fullName);
                } catch (IOException x) {
                    fail(service, "Error locating configuration files", x);
                }
            }
            while ((pending == null) || !pending.hasNext()) {
                if (!configs.hasMoreElements()) {
                    return false;
                }
                pending = parse(service, configs.nextElement());
            }
            nextName = pending.next();
            return true;
        }

        // 调用 nextService 方法时才会去实例化服务类
        private S nextService() {
            if (!hasNextService())
                throw new NoSuchElementException();
            String cn = nextName;
            nextName = null;
            Class<?> c = null;
            try {
                c = Class.forName(cn, false, loader);
            } catch (ClassNotFoundException x) {
                fail(service,
                     "Provider " + cn + " not found");
            }
            if (!service.isAssignableFrom(c)) {
                fail(service,
                     "Provider " + cn  + " not a subtype");
            }
            try {
                S p = service.cast(c.newInstance());
                providers.put(cn, p);
                return p;
            } catch (Throwable x) {
                fail(service,
                     "Provider " + cn + " could not be instantiated",
                     x);
            }
            throw new Error();          // This cannot happen
        }

        public boolean hasNext() {
            if (acc == null) {
                return hasNextService();
            } else {
                PrivilegedAction<Boolean> action = new PrivilegedAction<Boolean>() {
                    public Boolean run() { return hasNextService(); }
                };
                return AccessController.doPrivileged(action, acc);
            }
        }

        public S next() {
            if (acc == null) {
                return nextService();
            } else {
                PrivilegedAction<S> action = new PrivilegedAction<S>() {
                    public S run() { return nextService(); }
                };
                return AccessController.doPrivileged(action, acc);
            }
        }

        // 不支持删除元素
        public void remove() {
            throw new UnsupportedOperationException();
        }

    }

    // 以懒加载的方式返回一个获取服务提供者的迭代器
    // 懒加载的意思是：在迭代的过程中去加载配置文件和实例化服务提供者
    public Iterator<S> iterator() {
        return new Iterator<S>() {

            Iterator<Map.Entry<String,S>> knownProviders
                = providers.entrySet().iterator();

            public boolean hasNext() {
                if (knownProviders.hasNext())
                    return true;
                return lookupIterator.hasNext();
            }

            public S next() {
                if (knownProviders.hasNext())
                    return knownProviders.next().getValue();
                return lookupIterator.next();
            }

            public void remove() {
                throw new UnsupportedOperationException();
            }

        };
    }

    // 使用给定的类型和类加载器创建一个 ServiceLoader
    public static <S> ServiceLoader<S> load(Class<S> service,
                                            ClassLoader loader)
    {
        return new ServiceLoader<>(service, loader);
    }

    // 使用给定的类型和线程上下文类加载器创建 ServiceLoader
    public static <S> ServiceLoader<S> load(Class<S> service) {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        return ServiceLoader.load(service, cl);
    }

    // 使用给定类型和拓展类加载器创建 ServiceLoader
    // 只会加载 JVM 已经安装的服务提供者，用户的应用程序类路径下的服务提供者将被忽略
    public static <S> ServiceLoader<S> loadInstalled(Class<S> service) {
        ClassLoader cl = ClassLoader.getSystemClassLoader();
        ClassLoader prev = null;
        while (cl != null) {
            prev = cl;
            cl = cl.getParent();
        }
        return ServiceLoader.load(service, prev);
    }

    public String toString() {
        return "java.util.ServiceLoader[" + service.getName() + "]";
    }

}
```

1. ServiceLoader 实现了 Iterable 接口，加载配置文件和实例化服务提供者的工作都交给了迭代器来做，这个加载器是懒加载器，只有在遍历时才会去加载，`hasNext()` 方法加载配置文件，`next()` 方法实例化服务提供者。
2. 静态变量 `PREFIX = "META-INF/services/"` 规定了配置文件必须放在 `META-INF/services/` 路径下。
3. 服务提供者实例化是调用 `Class.forName()` 方法进行的，实例化之后，服务提供者会被缓存在 `providers` 有序列表中。

# SPI 机制的缺陷

- ServiceLoader 不是线程安全的，多个线程同时使用会有并发问题；
- 不能按需加载，每次都需要通过遍历来获取，对于不想要和实例化很耗时的类，也会被实例化；
- 获取的方式只能通过 Iterator 方式获取，不够灵活。
