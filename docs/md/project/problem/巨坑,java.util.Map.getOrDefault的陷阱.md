### 问题

线上项目发生空指针异常，通过定位发现是因为 `map.getOrdefault()` 方法出了问题，通过这个方法获取到的值仍然为 `null`。

一般为了能够从 Map拿到对象，我们在用 key 从 Map 获取对象时，加一个默认值，想的是如果这个 key 没有对应的 value 时，用默认值来进行下面的逻辑。

但是问题就是这个 `java.util.map.getOrdefault()` 的实现有点不符合我们的想象。

### **分析**

先通过一个 demo 来感受一下这个问题。

```java
@Test
public void test_getOrDefault() {
    Map<String, String> number = new HashMap<>();
    number.put("1", "1");
    number.put("2", null);
		// 主要对比一下 key 为 "2" 和 "3" 时的差别
    System.out.println(number.getOrDefault("1", "one"));
    System.out.println(number.getOrDefault("2", "two"));
    System.out.println(number.getOrDefault("3", "three"));
}
```

output：

```java
1
null
three
```

可以看到当  key 为 $2$ 时，实际上我们希望返回的值是 tow，但是这个方法仍然返回 `null`。

而不是像 key 为 $3$  时一样，返回一个默认值。

再看一下 JDK 中关于这个方法的实现逻辑。

```java
default V getOrDefault(Object key, V defaultValue) {
    V v;
    return (((v = get(key)) != null) || containsKey(key))
        ? v
        : defaultValue;
}
```

1. `((v = get(key)) != null)` 这个判断是判断 key 对应的 value 是否为 null，两种情况会导致这个为 false。
   1. map 中不存在这个 key；
   2. map 中存在这个 key，但是 v 雀食为 `null`；
2. `containsKey(key)` 这个判断很容易理解，判断 map 中是否存在 key。

条件 $1$ 和 $2$ 都为 $false$ 时才会返回默认值。

现在仔细对比一下两个 key：

1. key = 2，条件 $1$ 为 false ，但是条件 $2$  为 $true$，所以返回 v，即 `null`
2. Key = 3，条件 $1$ 和 $2$ 都为 $false$，返回默认值。

所以这个单元测试会有这个结果。

回到线上项目的问题，经过排查属于 key = 2 的情况，在 put 某一个 <key, value> 时，value 为 `null`。

### **解决方法**

1. 使用 JDK 8 的新类 Optioal 来获取默认值。

   ```java
   Optional.ofNullable(number.get("2")).orElse("two");
   ```

2. 使用第三方工具类，比如 hutool 工具包。

   ```java
   MapUtil.get(number, "2", String.class, "two");
   ```

3. 在 put 前判断一下 value 是否为 `null`。

>  相比较引入第三方工具包，我更喜欢用 JDK 自带的类。



### **总结**

网上有些人说这个方法这样设计是个 bug。

但是我倒认为这个默认实现的逻辑也能说得通。

从**接口定义的角度**来说，这个方法就是要获取 key 所映射的 value，而有些 Map 的实现类时允许 value 为 `null` 的，所以当某个 key 对应的 value 为 `null` 时，需要遵循接口定义，实事求是，返回 `null`。

![map_getOrDefault](https://www.lin2j.tech/blog-image/problem/map_getOrDefault.png)

而从**实际业务的角度**来说，大部分时候我们既然给了默认值就是不希望返回 `null`，所以业务开发的时候，用这个方法就会产生超出预期的结果。