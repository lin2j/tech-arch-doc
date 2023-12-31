
## 运行时数据区域（五大部分）
> 为了方便内存的管理，将JVM进程的内存细分为以下五部分。各个部分有各个部分的职责。这五部分里，有些是线程共享的，有些则是线程私有的。（在进程之中，**线程组可以共享进程的内存**，另外，还有线程私有的内存）。
### 线程共享
#### 堆
- 内存区域中，最大的一块。用来存放对象实例，几乎所有的**对象实例**和**数组**的都是在这里分配内存的。（对于hotspot虚拟机而言，class对象虽然是对象，但是却存放在方法区中。）
- 这里是垃圾回收的主要场所，因此也叫**GC堆**。为了方便GC，还将这里的内存细分为更小的部分，下面说垃圾回收会谈到。

#### 方法（类）区（(JDK 1.8 后被移入直接内存，并改名为元空间)
- 用于存储已被虚拟机加载的**类信息、常量、静态常量、即时编译器编译后的代码**等数据（反射动态代理生成的class对象也会在这里存储）。
- 也叫永久代。二者的关系：**方法区**是一种能够**概念**，而**永久代**是一种**概念的实现**（HotSpot），类似于接口（方法区）和实现类（永久代）的关系。
- **运行时常量池**：用于存放编译期生成的各种**字面量**（如“abc”）和**符号引用**。运行时产生的常量也可以被放在这里，如String的intern()方法。
- [为什么要将方法区移动到直接内存？](https://blog.csdn.net/qq_39598086/article/details/90024431)

### 线程私有
#### 程序计数器（PC）
- **当前**线程执行的字节码的行号的指示器。
- 因为每个线程执行的**指令不同**，所以这个部分**不能共用**，属于线程私有（这样属于空间换取时间，也可以简化问题，相类似的做法还有**ThreadLocal**）。
- 其中存储的是，当前正在执行的指令的**地址**，然后下一条指令也是通过PC获取（获取了指令后，PC的值加一，下次就可以直接取，取后再加一）。
> 可以参考**CPU**中的**程序计数器**（用于**获取下一条**指令）的工作原理，但是二者有区别，CPU中除了PC，还有**指令寄存器**（**存储正在执行的指令**）。<br>二者的功能融合起来就是JVM中的程序计数器。虚拟机的各种循环、选择、跳转、异常处理、线程恢复，都需要靠这个PC。
- 如果当前执行的本地方法（**native**），那么**PC**的内容**为空**。
- PC**随线程的诞生而创建**，这个位置内存很小，大小是**一个字长**（64位系统的字长为 64bit），这样在**PC内就可以存储一个本地引用，也可以存储returnAdress**。
- 唯一不会出现OOME（OutOfMemoryError）的地方。

#### 虚拟机方法栈
- 这个部分与Java**方法调用有关**。Java中，调用一个方法时，JVM会为这个方法创建一个**栈帧**（**局部变量表**，方法返回地址，动态连接，操作数栈等）,然后将这个栈帧压入虚拟机方法栈中。
> 栈帧结构的介绍:[传送门](https://blog.csdn.net/qian520ao/article/details/79118474)
- 可能发生的异常
    - **StackOverFlowError**：如果方法栈不能动态扩展容量，那么由于栈的大小是有限的，不能无限压入栈帧。当超过最大限度时，就会栈溢出。
    - **OutOfMemoryError**：如果方法栈的可以动态拓展容量，那么当最后一次扩容时，因为没有内存了，就会报出内存不足。
- **栈帧的弹出**，当**出现异常**或者执行到**return**时，会导致**栈帧被弹出**。

#### 本地方法栈
- 与虚拟机方法栈极其类似，不同的是，这个部分是**为本地方法服务的**。
---
## 垃圾回收
### 堆内存的划分
![堆的划分](https://www.lin2j.tech/blog-image/jvm/%E5%A0%86%E7%9A%84%E5%88%92%E5%88%86.png)
- 在堆中，有 1/3 大小为新生代，2/3 为老年代。新生代中还有Eden区和Survivor区，Survivor又有From和To两小部分。**新生代的对象存活时间一般比较短，老年代的存活时间长。**
- **为什么要分老年代和新生代**？目前主流的垃圾收集器都使用**分代回收法**。对于不同的区，存放的对象有所区别，GC的方法也相应的有所不同。
- 那对象有什么不同呢？这就涉及到内存分配策略了。而在这之前，先介绍两种回收策略

### 回收策略
#### Minor GC
- 发生在**新生代**，因为新生代的对象存活时间短，因此Minor GC会被**频繁执行，执行速度也比较快**。
#### Full GC
- 发生在**新生代和老年代**，因为老年代的对象存活时间比较长，因此Full GC**很少执行，执行速度慢**。
### 分配策略
#### 对象优先在Eden分配
- 当Eden区空间不足了，便发生一次Minor GC。
#### 大对象直接进入老年代
- 需要大量连续内存的对象，典型代表：长字符串、长数组。
- 为什么这样规定呢？主要是**避免大对象**在Survivor中的From和To之间**来回大量复制**，影响性能。
#### 长期存活的对象进入老年代
- 对于一个对象，从在Eden出生并**经过Minor GC**，如果**存活下来**，**年龄加一**。当增加到一定的年龄时，便进入老年代。
#### 动态对象年龄判定
- JVM并不要求一定要达到某个年龄才能进入老年代。在**Survivor区**中，对于某个年龄，如果**该年龄的对象的大小总和大于Survivor空间的一半**，那么，**大于或者等于该年龄的对象可以直接进入老年代**。
#### 空间分配担保
- 在发生Minor GC之前，虚拟机先检查**老年代中最大的连续的可用空间**是否大于**新生代对象所有对象大小**的总和，如果大于，那么这次Minor GC是安全的。否则JVM会查看HandlePromotionFailure（分配担保）的值（true 或者 false）。
- **true**：检查历次Minor GC中存活下来并**进入老年代的对象的大小的平均值**，并检查这个**平均值是否小于**老年代中可用连续空间的大小。如果小于，则发生Minor GC。这种做法是**有风险的**，因为这次新生代存活的对象的大小总和可能比这个平均值高得多。
- **false**：不允许冒险，**发生一次Full GC**。


### 判断一个对象是否该被回收
> 如果一个对象没有被引用，那么该对象就没有存活的价值了，因为我们无法再通过引用去操纵这部分内存里的内容。所以我们需要通过算法来判断一个对象有没有被引用。
#### 引用计数法
- 当一个对象被引用，计数器就加1；引用失效后，计数器减1。这样，在回收内存时，只需要（标记）回收计数器为0的对象。
- 这个方法有什么弊端呢？先看一段代码
    ```java
    public class Test {
    
        public Object instance = null;
    
        /**
         * 在这段代码中，1 处的对象实例（Test的实例）先是被a引用，然后被a
         * 的成员 instance引用，2 处也是如此。虽然后来a和b不引用这两个对
         * 象实例了。但是因为 instance的存在，导致了这两个实例的空间不能
         * 被回收。另外，我们不能使用a.instance = null 了，因为a现在指
         * 向的是null，这样写的话，会报出空指针异常。
         */
        public static void main(String[] args) {
            Test a = new Test(); // 1
            Test b = new Test(); // 2
            a.instance = b;
            b.instance = a;
            a = null;
            b = null;
        }
    }
    ```
- 在上面的代码中，a和b都不能使用了，但是各自的内部都引用着对方。两个对象实例的引用计数器永远都是1，这种情况叫**循环引用**。JVM就不知道这两个是要回收掉的，因为不符合引用计数法的回收规则。
- **引用计数法实现简单，效率也很高，但是对循环引用是没办法处理的**。
> 有没有一种方法可以解决循环引用的问题呢？
#### 可达性分析算法
- 通过一系列称为”GC Roots”的对象作为起点，以这些对象为起始点，从这些点开始往下搜索，**走过的路径**称为**引用链**，最后**将不在引用链上的对象（标记）回收**即可。
![gc_roots](https://www.lin2j.tech/blog-image/jvm/gc_roots.png)
- 如图，obj4、5属于循环引用，（**R1->Obj1->Obj2**)是一条引用链。如果现在发生GC，那么很可能4,5,8,9会被回收。
- 可以作为GC Roots的对象有哪些？
    - 虚拟机栈**局部变量表**中引用的对象
    - 本地方法栈**JNI**中引用的对象
    - 方法区中**静态属性引用**的对象
    - 方法区中**常量引用**的对象
### 回收方法区
#### 废弃常量的回收
- 比较简单，当一个常量没有被引用，那么它就应该被回收。
#### 无用类的回收
- 相对复杂，主要是对于无用类的判定，需要同时满足下列的所有条件，才**有可能**被回收
    1. 该类的所有**实例对象**均已被回收。
    2. **加载该类的ClassLoader**已经被回收。
    3. 该类的**class对象没有被引用**，即无法通过该类的class对象操作该类（通过反射实例化、操作方法等）。
### 垃圾收集的算法
> 通过上面的操作，我们已经知道那些对象该回收了。接下来我们就说一下，我们要怎么回收。
#### 标记-清除算法
- 标记：使用可达性分析算法，从根节点遍历，标记出要回收的对象。

- 清除：遍历堆中（新生代和老年代）的所有对象，然后将有清除标记的对象的内存回收。
  ![标记-清除算法](https://www.lin2j.tech/blog-image/jvm/%E6%A0%87%E8%AE%B0-%E6%B8%85%E9%99%A4%E7%AE%97%E6%B3%95.jpeg)

  图片来自[JavaGuide](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM%E5%9E%83%E5%9C%BE%E5%9B%9E%E6%94%B6)

- 可以看出这种方法有以下特点
    - 思想简单。
    - **效率不高**：标记和清除都需要遍历所有的对象。
    - **空间利用率不高**，会产生大量的**内存碎片**。
    
    > 如果某时需要一块**很大**的**连续**的内存存放一个大对象，虽然内存总和能满足条件，但因为可用**内存空间零散**（不连续），即**找不到满足条件**的内存块。此时，需要**触发**一次**Full GC**来腾出空间。但是GC是很费时费力的，特别是在交互式应用程序里，应尽量避免GC的发生。
#### 复制算法
- 将可用内存分为两块一样大小的内存a和b，每次只使用其中一块a分配给对象。发生GC时，将存活的对象复制到另一块b中，然后将当前块a内的所有对象全部清除。
![标记复制算法](https://www.lin2j.tech/blog-image/jvm/%E6%A0%87%E8%AE%B0%E5%A4%8D%E5%88%B6%E7%AE%97%E6%B3%95.png)
图片来自[JavaGuide](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM%E5%9E%83%E5%9C%BE%E5%9B%9E%E6%94%B6)
- 该算法有以下特点
    - 实现简单，运行高效。
    - 内存分配时，**不用考虑内存碎片**的问题。只需要将堆顶指针往后移动即可。
    - **空间利用率不高**，每次只能用可用内存的一半，代价太高。
> 复制算法对空间浪费实在太严重了。
#### 标记-整理算法
 - 标记：使用可达性分析算法，从根节点遍历，标记出要回收的对象。
 - 整理：将**没有标记回收的**对象向内存的**一端移动**，然后直接清理掉**端边界之外**的对象。
![标记整理算法](https://www.lin2j.tech/blog-image/jvm/%E6%A0%87%E8%AE%B0%E6%95%B4%E7%90%86%E7%AE%97%E6%B3%95.png)
图片来自[JavaGuide](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM%E5%9E%83%E5%9C%BE%E5%9B%9E%E6%94%B6)
- 该算法有以下特点
    - 分配内存时**不用考虑内存碎片**的问题。
    - 需要**移动大量对象**，处理效率不高。
> 上面的算法自身都是有好有坏，只适合于某种情况。而我们前面谈到给堆的分代是为了简化问题，方便GC。通过下面这个算法，你应该可以理解分代的好处。
#### 分代收集算法
> 这个算法其实没什么高深之处，只不过是**根据各个年代的特点来使用不同的收集算法**，这个就是上面介绍的三种算法的集大成。
- **新生代**：因为新生代中的对象**大多**是**存活时间非常短**的，所以一般每次都**只剩少量对象能存活**下来而已。所以采用**复制算法**。
- **老年代**：因为老年代的对象一般**存活时间是比较长**的，所以每次GC后，都会有**大量对象存活**，所以采用**标记-清除算法**或者**标记-整理算法**。
- 新生代的复制算法是怎样工作的呢？
    - 之前说过，新生代中 Eden：Survivor.From：Survivor.To = 8:1:1。其实**From和To是平等，它们的作用是一样的**。
    - 因为新生代GC后只有少量存活，所以一般情况下新生代的 1/10 大小是足够放置存活的对象的。
    - GC时，**将Eden和From中的存活的对象复制到To之中去（如果To空间满了，则对象直接进入老年代），然后将Eden和From中的空间清理**。清理后，此时From区是空白的，下次GC时，存活的对象就该复制到这里来了）。
    - 如果**Survivor中的空间不足**以保存存活的对象，又该怎么办呢？这时候就需要**分配担保机制**了。前面讲分配策略时，已经有说过了。其实就是向老年代借空间，老年代够借就借，不够借就发生一次Full GC，Full GC后还不行就要抛Error了。
    - 老年代是没有其他内存给它进行分配担保的，所以不够用就是不够用了。
> 前面分别谈到了：**内存怎么分**（分配策略），**哪些内存该回收**（判断对象存活），**怎么回收**（垃圾收集算法）。接下来说一下**什么时候回收**
### 什么时候进行GC
> 触发GC的条件很简单
#### 调用System.gc();
- 当用户调用System.gc()方法时，只是建议虚拟机进行内存回收，但是虚拟机可以选择不立即GC。不过，不建议使用这种方式，我们应该让虚拟机自己去决定，减少人工干预。
#### 老年代空间不足
- 主要是因为大对象直接进入老年代、长期存活的对象会进入老年代等。
#### 空间分配担保失败
- 使用复制算法的 Minor GC 需要老年代的内存空间作担保，如果担保失败会执行一次 Full GC。



## 参考文章

《深入理解Java虚拟机 JVM高级特性与最佳实践》周志明著

Github开源项目：[JavaGuide-JVM垃圾回收.md](https://github.com/Snailclimb/JavaGuide/blob/master/docs/java/jvm/JVM%E5%9E%83%E5%9C%BE%E5%9B%9E%E6%94%B6.md#22-%E5%8F%AF%E8%BE%BE%E6%80%A7%E5%88%86%E6%9E%90%E7%AE%97%E6%B3%95)

Github开源项目：[JavaGuide-Java内存区域.md](https://github.com/Snailclimb/JavaGuide/blob/master/docs/java/jvm/Java%E5%86%85%E5%AD%98%E5%8C%BA%E5%9F%9F.md)

Github开源项目：[CyC2018-Java 虚拟机.md](https://github.com/CyC2018/CS-Notes/blob/master/notes/Java%20%E8%99%9A%E6%8B%9F%E6%9C%BA.md#full-gc-%E7%9A%84%E8%A7%A6%E5%8F%91%E6%9D%A1%E4%BB%B6)

以及网上的多篇文章～～～
如有错误，欢迎指正。

