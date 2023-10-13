---
title: Java 泛型机制
---

Java 在 JDK 1.5 的时候引入了泛型（ generic ），泛型**提高了代码的复用性**，同时编译器还加入了**编译时类型安全检查**机制，可以在编译时发现与泛型声明类型不符合的问题。

Java 泛型的本质是**参数化类型**，即所操作的数据类型被指定为一个参数。

## 泛型的使用

在 Java 泛型中，使用 `<T>` 来声明泛型，可以使用任意合法的标识符来表示泛型参数类型，也可以使用 `<S, U>` 这种方式来表示多元泛型。

以下是常见的泛型参数类型标识符：

- **E** - Element (在集合中使用，因为集合中存放的是元素)
- **T** - Type（Java 类）
- **K** - Key（键）
- **V** - Value（值）
- **N** - Number（数值类型）
- **？** - 表示不确定的 java 类型

### 泛型类、接口

泛型类、接口的声明，需要在类名之后添加泛型标识符 `<T>`，然后才可能使用 `T` 作为数据类型。

```java
/**
 * 接口结果类，其中的 data 字段是一个泛型，
 * 可以满足返回各种不同的结果类型
 *
 * @author linjinjia
 * @date 2023/7/5 10:30
 */
public class Result<T> {

    private Integer code;

    private T data;

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public static void main(String[] args) {
        Result<String> result = new Result<>();
        result.setCode(200);
        result.setData("Success");
        // 可以将 data 字段作为字符串去调用其方法
        System.out.println(result.getData().length());
    }
}
```

### 泛型方法

泛型方法的声明，需要在修饰符之后，返回类型之前添加泛型标识符 `<T>`，然后才可以使用 `T` 作为方法的返回值或者参数类型。

```java
/**
 * @author linjinjia
 * @date 2023/7/5 10:45
 */
public class GenericMethod {

    /**
     * 通过静态泛型方法获取 Class 的实例
     *
     * @param clazz 类型
     * @param <T>   泛型类型
     * @return 泛型对应的实例
     * @throws Exception 反射异常
     */
    public static <T> T getObject(Class<T> clazz) throws Exception {
        return clazz.newInstance();
    }

    public static void main(String[] args) throws Exception {
        GenericMethod gm = GenericMethod.getObject(GenericMethod.class);

        System.out.println(gm);
    }
}
```

### 类型的上下限

在使用泛型的时候，我们可以对参数的类型进行上下界限制，比如参数类型只允许传入某种类型的父类或者子类。

- 参数类型的上限： `< ? extends T>` 

  这个写法表示参数类型 `?` 只能是 `T` 或者 `T` 的子类。比如 `<T extends Number>` 表示 `T` 只能是 Number 或者 Number 的子类，Integer、Double 等等。

- 参数类型的下限：`<? super T>` 

  这个写法表示参数类型 `?` 只能是 `T` 或者 `T` 的父类。比如 `<T super Integer>` 表示 `T` 只能是 Integer 或者 Integer 的父类，Number、Object 。

## 泛型的深入理解

### 类型擦除

Java 的泛型是“伪泛型”，类型信息会在编译器被清除，将所有的泛型表示（尖括号中的内容）都替换为具体的类型（其对应的原生态类型），就像完全没有泛型一样。比如 `List<String>` 和 `List<Integer>` 经过编译之后，类型都变为 `List`。

下面通过一个例子，结合代码中的注释来感受类型擦除。

```java
    public static void main(String[] args) throws Exception {
        List<String> strList = new ArrayList<>();
        List<Integer> intList = new ArrayList<>();

        strList.add("abc");
        intList.add(123);

        System.out.println(strList.getClass() == intList.getClass());  // 输出：true

        // strList.add(123); // 编译报错
        strList.getClass().getMethod("add", Object.class).invoke(strList, 123);
        System.out.println(strList); // 输出：[abc, 123]

        intList.getClass().getMethod("add", Object.class).invoke(intList, "abc");
        System.out.println(intList); // 输出：[123, abc]

        int a = intList.get(0);
        int b = intList.get(1);  // Exception in thread "main" java.lang.ClassCastException: java.lang.String cannot be cast to java.lang.Integer
    }
```

1. 第 $8$ 行输出为 true，说明两个 `List` 的类型是一样的。
2. 第 $10$ 企图直接往字符串列表加入整数，显然是不行的，会编译报错。
3. 第 $11$、$14$ 行都是通过反射的方式调用各自的 add 方法添加元素，往字符串列表添加了整数，往整数列表添加了字符串，这是不会报错的，并且可以打印各自的元素。由此也可以看出运行时是不会对添加的元素进行类型检查的。
4. 第 $18$ 行企图从整数列表 intList 中拿出通过反射添加的字符串赋值给整型变量 b，程序直接抛异常提醒 String 不能转型为 Integer。

通过第 $2$ 点和第 $3$ 点的比较可以知道在编译器还是有类型检查的，而在运行时没有类型检查。

这是因为通过编译期的类型擦除后，字节码中保留的是原始类型。

### 原始类型

**原始类型** 就是擦除去了泛型信息，最后在字节码中的类型变量的真正类型，无论何时定义一个泛型，相应的原始类型都会被自动提供，类型变量擦除，并使用其限定类型（无限定的变量用Object）替换。

- 对于 `<T>` 这种声明，其原始类型为 Object。

  ![type-erasure-object](https://www.lin2j.tech/blog-image/basic/type-erasure-object.png)

- 对于类似 `<T extends Number>` 这种声明，其原始类型为 Number。

  ![type-erasure-number](https://www.lin2j.tech/blog-image/basic/type-erasure-number.png)

下面对两种声明进行代码验证

```java
import java.util.Arrays;

public class GenericType {

    /**
     * 没有指定界限，原始类型为 Object
     *
     * @param <E> 类型
     */
    private static class ObjectType<E> {
        /**
         * 类型擦除后，参数类型变为 Object
         */
        public void add(E e) {
        }
    }

    /**
     * 指定上限，原始类型为 Number
     *
     * @param <E> 类型
     */
    private static class NumberType<E extends Number> {
        /**
         * 类型擦除后，参数类型变为 Number
         */
        public void add(E e) {
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println(Arrays.asList(ObjectType.class.getDeclaredMethods()));
        System.out.println(Arrays.asList(NumberType.class.getDeclaredMethods()));
    }
}
```

代码的输出结果是：

```bash
[public void GenericType$ObjectType.add(java.lang.Object)]
[public void GenericType$NumberType.add(java.lang.Number)]
```

由此可见，二者字节码信息中保存的参数类型是不一样的。因为编译期类型擦除之后，保留的是各自的原始类型，因为 NumberType 类限定了类型，所以参数类型是 Number。

### 获取泛型类的参数类型

在  Java 中，由于类型擦除（Type Erasure）的特性，泛型的参数类型在运行时是不可直接获取的。但是可以通过反射来获取泛型的参数类型。

如果你有一个泛型类，你可以通过 `getGenericSuperclass()` 方法获取该类的泛型父类。然后通过 `ParameterizedType` 接口的方法来获取泛型参数类型。

```java
public class GenericType {
    private static class ObjectType<E> {
    }

    public static void main(String[] args) throws Exception {
        // ob 实际指向 ObjectType 的子类实例
        ObjectType<String> ob = new ObjectType<String>() {
        };
        // 拿到 ObjectType 的类型
        Type superClass = ob.getClass().getGenericSuperclass();
        System.out.println("class: " + superClass);
        // //getActualTypeArguments 返回确切的泛型参数, 如Map<String, Integer>返回[String, Integer]
        Type generic = ((ParameterizedType) superClass).getActualTypeArguments()[0];
        System.out.println("参数类型: " + generic);
    }
}
```

输出：

```java
class: GenericType$ObjectType<java.lang.String>
参数类型: class java.lang.String
```

## 参考文章

- https://juejin.cn/post/6844904163751510030
- https://pdai.tech/md/java/basic/java-basic-x-generic.html
