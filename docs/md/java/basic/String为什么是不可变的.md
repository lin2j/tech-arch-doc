---

title: String 为什么是不可变的

---

主要包括设计考虑、效率优化以及安全性三方面

1. 便于实现字符串常量池 （String Pool）

   在 Java 中，由于 String 也是一类对象，频繁的创建 String 对象会降低程序的性能，而且会造成空间的浪费。因此 Java  提出了字符串常量池的概念，在堆中创建一块存储空间，当初始化一个 String 之后，如果字符串已经存在了，就不会去创建一个新的字符串变量，而是返回已经存在的字符串的引用。

   ```java
   String s1 = "abcd";
   String s2 = "abcd";
   ```

2. 使多线程安全

   因为不可变性，字符串可以不用考虑在多线程访问下的线程安全问题。字符串天生线程安全。

3. 避免安全问题

4. 加快字符串处理速度

   Java 中 String 对象的 hashCode 频繁被使用到，比如在 HashMap 容器中。如果 String 的哈希码可以被缓存，就不用每次都去重新计算，从而节省时间。因为Java中String是不可变的，所以其哈希码也是不会变的，可以放心地缓存起来。String 中有一个 hash 字段就是用来缓存哈希码的。

   ```java
   /** Cache the hash code for the string */
   private int hash; // Default to 0
   ```

   
