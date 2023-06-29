今天在写算法题的时候，本来想调用 `List` 的 `set(int, Object)` 方法，向指定位置新增一个元素，可是却报了数组越界异常，把我给整懵了。

```java
运行失败:
java.lang.IndexOutOfBoundsException: Index 0 out of bounds for length 0
    at line 64, java.base/jdk.internal.util.Preconditions.outOfBounds
    at line 70, java.base/jdk.internal.util.Preconditions.outOfBoundsCheckIndex
    at line 248, java.base/jdk.internal.util.Preconditions.checkIndex
    at line 373, java.base/java.util.Objects.checkIndex
    at line 440, java.base/java.util.ArrayList.set
    at line 28, Solution.levelOrder
    at line 57, __DriverSolution__.__helper__
    at line 82, __Driver__.main
    测试用例:[3,9,20,null,null,15,7]
stdout:
```

相应的代码如下：

![算法题-数组越界案例](https://www.lin2j.tech/blog-image/problem/%E7%AE%97%E6%B3%95%E9%A2%98-%E6%95%B0%E7%BB%84%E8%B6%8A%E7%95%8C%E6%A1%88%E4%BE%8B.png)

解决方法：

```java
Replaces the element at the specified position in this list with the specified element (optional operation).
```

这是 `List` 中对于 `set` 方法的注释，明确指出，该方法是用来替换某个索引位置的元素值的，并不是用来新增元素的。新增元素最好还是用 `add` 方法。

截图中我最后是用普通数组来代替 `ArrayList` ，因为大小我已经知道了，最后再调用 `Arrays.asList` 方法转为`List` 的子类。