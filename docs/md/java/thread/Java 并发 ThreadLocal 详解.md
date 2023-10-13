---
title: ThreadLocal 详解
---

## 简介

ThreadLocal 即线程本地变量的意思，常被用来处理线程安全问题。ThreadLocal 的作用是为多线程中的每一个线程都创建一个线程自身才能用的实例对象，通过线程隔离的方式保证了实例对象的使用安全。

> 在并发编程中，有以下几种方式可以用来避免线程安全问题
>
> - 同步方案
>
>   - 加锁（synchronized 和 Lock）
>
>   - 通过 CAS （原子类）
>
> - 无同步方案
>   - 栈封闭（方法的局部变量）
>   - 本地存储（ThreadLocal）

## 使用示例

下面用两个例子来演示 ThreadLocal 的线程隔离能力，看看它是如何规避线程安全问题的。代码从两个方面来测试

1. 没有使用 ThreadLocal，直接将 SimpleDateFormat 暴露在多线程的环境并发使用。
2. 使用 ThreadLocal 在多线程下使用。

```java
import java.text.ParseException;
import java.text.SimpleDateFormat;

public class ThreadLocalExample {

    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");

    // 创建 ThreadLocal 对象，并指定 SimpleDateFormat 的创建过程
    private static final ThreadLocal<SimpleDateFormat> THREAD_LOCAL = ThreadLocal.withInitial(() -> {
        System.out.println(Thread.currentThread().getName() + " 创建 SimpleDateFormat 对象");
        return new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    });

    public static void main(String[] args) {
        // 下面是没有使用 ThreadLocal 的方式，直接使用 SimpleDateFormat
        // 可以将注释取消运行看看结果
/*
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                String t = Thread.currentThread().getName();
                try {
                    System.out.println(t + "\t共享变量格式化: " + sdf.parse("2023-01-01 12:00:00"));
                } catch (ParseException e) {
                    e.printStackTrace();
                }
            }, "" + i).start();
        }
 */
        
        // 下面是使用 ThreadLocal 的方式
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                String t = Thread.currentThread().getName();
                try {
                    System.out.println(t + "\tThreadLocal格式化: " + THREAD_LOCAL.get().parse("2023-01-01 12:00:00"));
                } catch (ParseException e) {
                    e.printStackTrace();
                } finally {
                    // 最好养成用完就清除的习惯，避免内存泄漏
                    THREAD_LOCAL.remove();
                }
            }, "" + i).start();
        }
    }
}
```

1. 没用使用 ThreadLocal 的方式会因为并发使用而导致异常。

```
Exception in thread "3" java.lang.NumberFormatException: For input string: ".E0"
	at sun.misc.FloatingDecimal.readJavaFormatString(FloatingDecimal.java:2043)
	at sun.misc.FloatingDecimal.parseDouble(FloatingDecimal.java:110)
	at java.lang.Double.parseDouble(Double.java:538)
	at java.text.DigitList.getDouble(DigitList.java:169)
	at java.text.DecimalFormat.parse(DecimalFormat.java:2089)
	at java.text.SimpleDateFormat.subParse(SimpleDateFormat.java:1869)
	at java.text.SimpleDateFormat.parse(SimpleDateFormat.java:1514)
	at java.text.DateFormat.parse(DateFormat.java:364)
	at com.jia.blogdemo.thread.ThreadLocalExample.lambda$main$1(ThreadLocalExample.java:28)
	at java.lang.Thread.run(Thread.java:748)
4	共享变量格式化: Wed Jan 01 00:00:00 CST 2200
9	共享变量格式化: Sun Jan 01 00:00:00 CST 2023
8	共享变量格式化: Sun Jan 01 00:00:00 CST 2023
6	共享变量格式化: Sun Jan 01 00:00:00 CST 2023
5	共享变量格式化: Sun Jan 01 00:00:00 CST 2023
7	共享变量格式化: Sun Jan 01 00:00:00 CST 2023
2	共享变量格式化: Wed Jan 01 00:00:00 CST 2200
1	共享变量格式化: Wed Jun 21 14:16:33 CST 190728635
0	共享变量格式化: Wed Jun 21 14:16:33 CST 190728635
```

2. 使用了 ThreadLocal 的方式运行结果正常，而且结果的前几行可以看出来，每个线程都各自创建了 SimpleDateFormat 对象。

```
0 创建 SimpleDateFormat 对象
2 创建 SimpleDateFormat 对象
1 创建 SimpleDateFormat 对象
4 创建 SimpleDateFormat 对象
3 创建 SimpleDateFormat 对象
5 创建 SimpleDateFormat 对象
6 创建 SimpleDateFormat 对象
7 创建 SimpleDateFormat 对象
8 创建 SimpleDateFormat 对象
9 创建 SimpleDateFormat 对象
3	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
1	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
0	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
7	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
2	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
4	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
9	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
8	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
6	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
5	ThreadLocal格式化: Sun Jan 01 00:00:00 CST 2023
```

## 源码详解

ThreadLocal 有一个内部类叫 ThreadLocalMap，它是一个映射表，将 ThreadLocal 和存储对象作为键值对存储起来。然后关键的是，每个 Thread 对象中，都会有一个叫 threadLocals 的成员变量，它的类型是 ThreadLocalMap。在 ThreadLocal 使用 threadLocals 变量时，如果发现它是 null，那么就会 new 一个新的对象。

ThreadLocal 的关键理解点是，当我们向 ThreadLocal 设置、获取、删除存储对象的时候，第一步都是先拿到当前线程的 threadLocals 变量，然后对这个 ThreadLocalMap 进行添加、获取、删除等等操作。因为每个线程有自己的 ThreadLocalMap，所以线程拿的都是自己的那一份实例对象。

在这个理解基础上，下面的代码实际讲解的是对于 ThreadLocalMap 的操作方法。

<img src="https://www.lin2j.tech/blog-image/thread/Thread-threadLocals.png" alt="Thread-threadLocals" style="zoom:50%;" />

### 内部类 ThreadLocalMap

ThreadLocalMap 是一个哈希表，用于存储 ThreadLocal 和 存储对象的映射关系。ThreadLocalMap 也包含一个内部类 Entry，它是一个键值对，其中键为弱引用，值为存储对象。

当插入键值对发生冲突时，ThreadLocalMap 的做法是向后线性寻找一个第一个 entry 为 null 的位置插入。

```java
static class ThreadLocalMap {

    /**
     * The entries in this hash map extend WeakReference, using
     * its main ref field as the key (which is always a
     * ThreadLocal object).  Note that null keys (i.e. entry.get()
     * == null) mean that the key is no longer referenced, so the
     * entry can be expunged from table.  Such entries are referred to
     * as "stale entries" in the code that follows.
     */
    static class Entry extends WeakReference<ThreadLocal<?>> {
        /** The value associated with this ThreadLocal. */
        Object value;

        Entry(ThreadLocal<?> k, Object v) {
            super(k);
            value = v;
        }
    }

    /**
     * 默认的容量
     */
    private static final int INITIAL_CAPACITY = 16;

    /**
     * 哈希表，必要时会进行扩容，且它的长度永远是 2 的 N 次方
     */
    private Entry[] table;

    /**
     * 哈希表的元素个数
     */
    private int size = 0;

    /**
     * 阈值，当元素个数达到 threshold 的时候，哈希表会扩容
     */
    private int threshold; // Default to 0
  
    // 创建一个 ThreadLocalMap 对象，并接受第一对键值对
    ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
        table = new Entry[INITIAL_CAPACITY]; // 哈希表创建
        int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1); // 计算键的位置
        table[i] = new Entry(firstKey, firstValue); // 构建简直对
        size = 1; // 元素个数
        setThreshold(INITIAL_CAPACITY); // 阈值
    }

    // 创建一个 ThreadLocalMap 对象，接收一个父哈希表，将里面的元素放到新创建的对象中
    private ThreadLocalMap(ThreadLocalMap parentMap) {
        Entry[] parentTable = parentMap.table;
        int len = parentTable.length; // 哈希表长度
        setThreshold(len); //阈值
        table = new Entry[len];

        for (int j = 0; j < len; j++) {
            Entry e = parentTable[j];
            if (e != null) {
                @SuppressWarnings("unchecked")
                ThreadLocal<Object> key = (ThreadLocal<Object>) e.get();
                if (key != null) { // 因为 Entry 的 key 是弱引用，所以复制过程中可能有些 key 为 null
                    Object value = key.childValue(e.value);
                    Entry c = new Entry(key, value);
                    int h = key.threadLocalHashCode & (len - 1); // 计算位置
                    while (table[h] != null)  // 这个 while 循环在后面经常出现，向后寻找第一个 entry 为 null 的位置
                        h = nextIndex(h, len);
                    table[h] = c;  // 插入
                    size++; // 元素个数累加
                }
            }
        }
    }
}
```

ThreadLocalMap 还有很多方法，下面涉及到的时候再具体讲解。

### 属性

ThreadLocal 的属性有三个，主要是用来生成 ThreadLocal 对象的哈希值。

```java
/**
 * 当前实例对象的哈希值，用来确定实例对象在哈希表中的位置
 */
private final int threadLocalHashCode = nextHashCode();

/**
 * 类静态变量，用于生成 threadLocalHashCode，起始值为 0
 */
private static AtomicInteger nextHashCode =
    new AtomicInteger();

/**
 * 哈希值的增量，是一个斐波那契数，它的作用就是让 hash 分布非常均匀
 * 
 * 至于为什么，有兴趣的可以自己找资料学习
 */
private static final int HASH_INCREMENT = 0x61c88647;

/**
 * 返回当前的 nextHashCode 值，并生成下一个 nextHashCode 值
 */
private static int nextHashCode() {
    return nextHashCode.getAndAdd(HASH_INCREMENT);
}
```

每当创建一个 ThreadLocal 对象，nextHashCode 的值就会增加 HASH_INCREMENT。

### 构造函数

ThreadLocal 的构造函数只有一个。

```java
public ThreadLocal() {
}
```

这里顺便讲一下它的初始化方法，所谓初始化就是创建 ThreadLocal 对应的存储对象的过程，可以通过两个方式

1. 重写 initialValue 方法；
2. 通过 withInitial 静态方法，传入一个 Supplier 子类，实现 Supplier 的 get 方法；

```java
// 方式一：initialValue 默认返回 null，需要子类重写
protected T initialValue() {
    return null;
}

// 方式二：withInitial 返回一个 SuppliedThreadLocal 对象
public static <S> ThreadLocal<S> withInitial(Supplier<? extends S> supplier) {
    // SuppliedThreadLocal 接收一个 Supplier 对象
    return new SuppliedThreadLocal<>(supplier);
}

// 默认的 ThreadLocal 子类实现，重写了 initialValue 方法，
// 这个方法返回的值是构造函数传入的 Supplier 对象的 get 方法返回值
static final class SuppliedThreadLocal<T> extends ThreadLocal<T> {

    private final Supplier<? extends T> supplier;

    SuppliedThreadLocal(Supplier<? extends T> supplier) {
        this.supplier = Objects.requireNonNull(supplier);
    }

    @Override
    protected T initialValue() {
        return supplier.get();
    }
}
```

### 核心函数 set

```java
// 保存存储对象至当前线程
public void set(T value) {
    Thread t = Thread.currentThread(); // 拿到当前线程
    ThreadLocalMap map = getMap(t); // 获取线程的 threadLocals 成员变量
    if (map != null)
        map.set(this, value);  // 调用 map 的 set 方法
    else
        createMap(t, value); // 如果 map 为空，则创建一个新的 ThreadLocalMap 实例
}

void createMap(Thread t, T firstValue) {
    // new 一个对象
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

set 方法的过程如下：

1. 先拿到当前线程的对象，并获取当前线程对象的 threadLocals 变量；
2. 如果 threadLocals 不为空，则调用 ThredaLocalMap#set 方法进行保存；
3. 如果 threadLocals 为空，则调用 createMap 方法为当前线程创建一个新的 ThreadLocalMap，并将 value 作为第一个保存的值。

在这个过程中，`map.set(this, value)` 这句代码虽然简单，但是里面做的事情有很多。

```java
private void set(ThreadLocal<?> key, Object value) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len-1); // 根据当前 ThreadLocal 实例的哈希值计算插入位置

    // 从位置 i 开始遍历，直到遍历到某个位置为 null 则停止
    for (Entry e = tab[i];
            e != null;  // 位置 i 的对象为空，则结束循环
            e = tab[i = nextIndex(i, len)]) {
        ThreadLocal<?> k = e.get();  // 拿到位置 i 的 ThreadLocal 对象 k

        if (k == key) {   // 二者相等，则更新位置 i 的 value
            e.value = value;
            return;
        }

        if (k == null) {  // 位置 i 已经被回收，则用当前 key-value 替换旧的 Entry 
            replaceStaleEntry(key, value, i);
            return;
        }
    }

    // 能到这里，说明位置 i 的地方对象为 null，直接插入 Entry 即可
    tab[i] = new Entry(key, value);
    int sz = ++size;
    if (!cleanSomeSlots(i, sz) && sz >= threshold) // 先清除过期的 Entry，若无过期的 Entry，则需要判断是否需要扩容
        rehash(); // 扩容
}

// 这个方法清除掉过期的 Entry，
// 如果有清除 Entry 返回 true，否则返回 false
private boolean cleanSomeSlots(int i, int n) {
    boolean removed = false;
    Entry[] tab = table;
    int len = tab.length;
    do {
        i = nextIndex(i, len); // 下一个位置
        Entry e = tab[i];
        if (e != null && e.get() == null) { // 当出现过期元素
            n = len;  // 当有 Entry 移除，则将 n 重置为 len
            removed = true; // 删除标记
            i = expungeStaleEntry(i); // 从位置 i 往后移除 key 为 null 的元素
        }
    } while ( (n >>>= 1) != 0);  // 以 log2 的方式遍历，注释说这种方式简单、快速
    return removed;
}

private void replaceStaleEntry(ThreadLocal<?> key, Object value,
                                int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;
    Entry e;

    int slotToExpunge = staleSlot; // 清除过期 key 的起始位置
    // 先从位置 staleSlot 往前遍历看有没有过期的 Entry
    for (int i = prevIndex(staleSlot, len);
            (e = tab[i]) != null;
            i = prevIndex(i, len)) // 往前遍历
        if (e.get() == null) // 过期
            slotToExpunge = i;  // 更新 slotToExpunge（即往前推移了）

    for (int i = nextIndex(staleSlot, len);
            (e = tab[i]) != null;
            i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();

        if (k == key) {
            // 如果位置 i 的 Entry 的 key 和传入的 key 相等
            // 则将位置 i 和位置 staleSlot 的元素交换（注意：staleSlot < i）
            e.value = value; // 更新为新的 value
            tab[i] = tab[staleSlot];
            tab[staleSlot] = e;

            if (slotToExpunge == staleSlot) // 如果二者相等，则说明上面的向前寻找 null 元素的遍历没有找到了
                slotToExpunge = i; // 将 slotToExpunge 更新为 i，因为 i 之前的元素不需要清除
          
            cleanSomeSlots(expungeStaleEntry(slotToExpunge), len); // 清除过期元素
            return;
        }
      
        if (k == null && slotToExpunge == staleSlot) // 第一次遍历到 key 为 null 的元素，且上面向前查找 key 为 null 的遍历没有找到
            slotToExpunge = i; // 将 slotToExpunge 更新为 i，因为 i 之前的元素不需要清除
    }

    // 如果 key 没有找到，则新建一个新的 Entry 放在 slot 位置
    tab[staleSlot].value = null;
    tab[staleSlot] = new Entry(key, value);

    if (slotToExpunge != staleSlot) // 二者不相等，说明除了 staleSlot 之外，还有其他位置有过期元素
        cleanSomeSlots(expungeStaleEntry(slotToExpunge), len); //清除过期元素
}
```

expungeStaleEntry 和 rehash 方法分别是过期清理和扩容的方法，下面再专门讲。

### 核心函数 get

```java
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t); 
    if (map != null) {
        // 调用 getEntry 方法，从当前线程的 threadLocals 中拿到当前 ThreadLocal 实例对应的值
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) { // entry 不为空，直接获取 value
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();  // entry 为空，则初始化当前 ThreadLocal 实例
}

// 过程与 set 方法相似
private T setInitialValue() {
    T value = initialValue();
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
    return value;
}
```

get 方法的过程如下：

1. 先拿到当前线程的对象，并获取当前线程对象的 threadLocals 变量；
2. 如果 threadLocals 不为 null，则调用 getEntry 方法获取当前 ThreadLocal 实例对应的值；
3. 如果 threadLocals 为 null 或者获取不到当前 ThreadLocal 实例对应的值，则调用 setInitialValue 方法进行初始化。

```java
private Entry getEntry(ThreadLocal<?> key) {
    int i = key.threadLocalHashCode & (table.length - 1);  // 计算 key 对应的位置
    Entry e = table[i];
    if (e != null && e.get() == key)  // 顺利找到 key
        return e;
    else
        return getEntryAfterMiss(key, i, e); // 找不到 key，则尝试向后查找
}

private Entry getEntryAfterMiss(ThreadLocal<?> key, int i, Entry e) {
    Entry[] tab = table;
    int len = tab.length;
    while (e != null) {
        ThreadLocal<?> k = e.get();
        if (k == key)  // 找到 key
            return e;
        if (k == null)
            expungeStaleEntry(i);   // 清除过期的 Entry
        else
            i = nextIndex(i, len);  // 向后遍历
        e = tab[i];
    }
    return null;
}
```

### 核心函数 remove

```java
public void remove() {
    ThreadLocalMap m = getMap(Thread.currentThread());
    if (m != null)
        m.remove(this);
}

private void remove(ThreadLocal<?> key) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len-1);  // 计算位置
    for (Entry e = tab[i];
            e != null;
            e = tab[i = nextIndex(i, len)]) { // 如果位置 i 的 key 和传入的 key 不相等，则往后寻找
        if (e.get() == key) { // 找到指定的 key
            e.clear(); // 清除
            expungeStaleEntry(i); // 清理过期的 key
            return;
        }
    }
}
```

### 扩容 rehash

```java
/**
 * 1. 清理所有过期的 Entry
 * 2. 扩大 table 的容量为原先的两倍
 */
private void rehash() {
    expungeStaleEntries();  // 清理所有过期的 Entry

    if (size >= threshold - threshold / 4)  // 当前元素个数超过 3/4 threshold
        resize(); // 扩容
}

private void resize() {
    Entry[] oldTab = table;
    int oldLen = oldTab.length;
    int newLen = oldLen * 2;  // 新容量为旧容量的 2 倍
    Entry[] newTab = new Entry[newLen];
    int count = 0;  // 元素个数

    for (int j = 0; j < oldLen; ++j) {
        Entry e = oldTab[j];
        if (e != null) {
            ThreadLocal<?> k = e.get();
            if (k == null) {
                e.value = null; // Help the GC
            } else {
                int h = k.threadLocalHashCode & (newLen - 1); // 根据哈希值重新计算新的位置 h
                while (newTab[h] != null)  // 如果位置 h 已经有元素，则往后寻找 Entry 为 null 的位置
                    h = nextIndex(h, newLen);
                newTab[h] = e; // 插入
                count++; // 元素个数累加
            }
        }
    }
    
    // 更新
    setThreshold(newLen);
    size = count;
    table = newTab;
}
```

ThreadLocalMap 的扩容思路比较简单，先将过期的元素全部清理掉之后，如果元素个数达到 threshold 的 $3/4$ 以上，则扩容。

扩容的时候先 new 一个大小为原先 table 两倍的数组 newTab，然后将 table 内的元素全部根据新的容量重新计算位置，插入到 newTab 的对应位置上。如果对应位置已经有值了，则从当前位置开始向后寻找，找到第一个 Entry 为 null 的位置插入。

### 过期清理

前面讲过 ThreadLocalMap 的 Entry 的 key 是 WeakReference 弱引用。当发生 GC 时，弱引用指向的对象会被回收，因此会出现 Entry 的 key 为 null 的情况。这种情况下，要及时清理过期的 Entry，从而避免内存泄漏和无效数据的积累。

```java
private int expungeStaleEntry(int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;

    // 首先清除 staleSlot 位置的元素
    tab[staleSlot].value = null;
    tab[staleSlot] = null;
    size--;

    // 从 staleSlot 开始向后遍历，直到遇见 Entry 为 null 的位置
    Entry e;
    int i;
    for (i = nextIndex(staleSlot, len);
            (e = tab[i]) != null;
            i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();
        if (k == null) {
            // 过期数据清理
            e.value = null;
            tab[i] = null;
            size--; // 计数减一
        } else {
            // 不为空的元素会根据 key 的哈希值重新插入位置
            int h = k.threadLocalHashCode & (len - 1);
            if (h != i) {
                tab[i] = null;

                while (tab[h] != null)  // 如果原本的位置有数据了，则向后查找合适的位置插入
                    h = nextIndex(h, len);
                tab[h] = e;
            }
        }
    }
    return i;
}
```

set、get、remove 方法，在遍历的时候如果遇到 key 为 null 的情况，都会调用 expungeStaleEntry 方法来清除 key 为 nul l的 Entry。

## 拓展

### 内存泄漏

```java
static class Entry extends WeakReference<ThreadLocal<?>> {
    /** The value associated with this ThreadLocal. */
    Object value;

    Entry(ThreadLocal<?> k, Object v) {
        super(k);
        value = v;
    }
}
```

从 Entry 的定义可以知道，虽然 Entry 的 key 是弱引用，在垃圾回收时会被回收，但是 Entry 的 value 是通过强引用来引用的。因此在不进行清理的情况下会存在如下的强引用链：Thread Ref -> Thread -> ThreadLocalMap -> Entry -> value。这会导致 key 为 null 的 Entry 的 value 永远无法回收，造成内存泄漏。

因此为了避免这种情况，我们可以在使用完 ThreadLocal 后，需要手动调用 remove 方法，以避免出现内存泄漏。

## 参考文章

- https://zhuanlan.zhihu.com/p/34406557
- https://pdai.tech/md/java/thread/java-thread-x-threadlocal.html
