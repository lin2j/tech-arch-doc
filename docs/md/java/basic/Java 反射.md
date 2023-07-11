---
title: Java 反射机制
---

# 反射


## 什么是反射？

在我平时的使用中，Java 的反射包括两个方面，一是在运行状态中，动态获取类的信息；一是在运行状态中，动态调用对象的方法。

动态获取类的信息就是对于任意一个类，都能获取到这个类的字段、方法、注解相关的信息。

动态调用对象的方法指的是对于任意一个对象，通过反射能调用它的任意方法。

反射强大而复杂。平时的业务开发用的比较少，但是框架、工具构造的时候用的比较多。因此学习反射可以帮助我们更好的看懂框架的源码。

# 获取类的信息

### Class 类

在 Java 运行时，系统始终会为每个对象保存一个所属的类型标识，通过这个标识可以追踪到对象所属的类型。

Java 提供一个专门的类来存放对象的类型信息，保存这些信息的类称为 Class。

一个 Class 类的对象，表示的是一个类型，因此一个类的 Class 对象，我称为某个类的类型（简称类类型）。

虚拟机为每个类型管理一个 Class 对象。 因此，可以利用 $==$ 运算符实现两个类对象比较的操作。

获取类类型的方法有三种
1. 通过实例对象获得；

   ```java
   User user = new User();
   Class cl = user.getClass();
   ```

2. 通过 .class 获得，只适合于在编译前就已知类的类型的情况；

   ```
   Class cl = User.class;
   ```

3. 通过 `Class.forName()` 静态方法获得。这个方法可以用于动态加载类，注意方法会抛出一个已检查异常，是需要捕获处理的。

   ```java
   Class cl = Class.forName("com.jia.User");
   ```

为了方便叙述，这里会新增一个用户类，字段和方法都比较简单。

```java
package com.jia;

public class User {
    private String name;
    private int age;
    
    public User(){}
    public User(int age){this.age = age;}
    
    public static void worldState() {
        System.out.println("The world is functioning normally");
    }

    public void say(){
        System.out.println("hello");
    }

    public void say(String msg){
        System.out.println(msg);
    }
    
    public int age(){
        return this.age;
    }
    
    public String toString(){
        return this.name + "--" + this.age;
    }
}
```

### 类结构的代表类

在获取类的信息之前，需要先了解一下 `java.lang.relect` 包中的其他四个类，它们分别是 Field、Method、Constructor、Modifier，分别代表了类中的字段、方法、构造函数和修饰符。还有注解相关的类，这里先不做叙述。

Field 类有一个 `getType()` 方法，可以获取字段的类型，返回字段所属的类类型。

Method 类有一个  `getReturnType()` 方法，可以获取返回值的类类型。还有一个 `getParameterTypes()` 方法，可以获取方法参数的类类型。

Constructor 类有一个 `getParameterTypes()` 方法，可以获取方法参数的类类型。

此外，Field、Method、Constructor 都含有一个 `getName() ` 方法和 `getModifiers()`方法。

`getName()` 方法可以获取项目的名称。`getModifiers()` 方法可以获取的成员的修饰符，返回的是一个整型数值，通过位开关来描述成员的修饰符。

Modifier 类内含静态方法 `Modifier.toString(int mod)`  可以将 `getModifiers()` 方法返回的值转成字符串。

Class 类中的 `getFields()` 、`getMethods()` 、`getConstructors()` 方法分别获取类中用 public 修饰的字段、方法和构造器，包括超类的成员。

Class 类中的 `getDeclareFields()`、`getDeclareMethods()` 和 `getDeclaredConstructors()` 方法将分别返回类中声明的全部字段、 方法和构造器， 其中包括私有和受保护成员，但不包括超类的成员。

### 分析类信息的例子

这个例子可以通过命令行参数或者控制台输入类的全限定名称，然后打印类的字段、构造器、方法信息等等。

```java
import java.util.*;
import java.lang.reflect.*;

/**
 * @author linjinjia
 * @date 2021/8/17 20:14
 */
public class ClassInfoPrinter {

    public static void main(String[] args) {
        String classPath;
        if(args.length > 0){
            classPath = args[0];
        } else {
            Scanner scanner = new Scanner(System.in);
            System.out.println("输入类的全限定名 (例如 java.util.Date): ");
            classPath = scanner.next();
        }
        try{
            StringBuilder classInfo = new StringBuilder();
            // 找到对应的 Class
            Class clazz = Class.forName(classPath);
            // 超类
            Class superCl = clazz.getSuperclass();
            // 修饰符
            String modifier = Modifier.toString(clazz.getModifiers());
            classInfo.append(modifier).append(" class ").append(clazz.getName());
            if(superCl != null && superCl != Object.class) {
                classInfo.append(" extend ").append(superCl.getName());
            }
            classInfo.append(" {\n");
            classInfo.append(fieldInfo(clazz)).append("\n");
            classInfo.append(constructorInfo(clazz)).append("\n");
            classInfo.append(methodInfo(clazz));
            
            classInfo.append("}");
            System.out.println(classInfo);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    /**
     * 打印类的字段
     */
    private static String fieldInfo(Class clazz) {
        Field[] fields = clazz.getDeclaredFields();
        StringBuilder fieldInfo = new StringBuilder();
        for (Field field : fields) {
            fieldInfo.append("    ");
            // 修饰符
            String modifier = Modifier.toString(field.getModifiers());
            // 字段类型
            Class fieldType = field.getType();
            if (modifier.length() > 0) {
                fieldInfo.append(modifier).append(" ");
            }
            fieldInfo.append(fieldType.getName()).append(" ");
            // 字段名
            fieldInfo.append(field.getName()).append(";\n");
        }
        return fieldInfo.toString();
    }

    /**
     * 打印构造器
     */
    private static String constructorInfo(Class clazz) {
        Constructor[] constructors = clazz.getDeclaredConstructors();
        StringBuilder constructorInfo = new StringBuilder();
        for (Constructor constructor : constructors) {
            constructorInfo.append("    ");
            // 修饰符
            String modifier = Modifier.toString(constructor.getModifiers());
            if (modifier.length() > 0) {
                constructorInfo.append(modifier).append(" ");
            }
            // 名称和方法参数
            constructorInfo.append(constructor.getName()).append("(");
            Class[] paramTypes = constructor.getParameterTypes();
            if (paramTypes.length > 0) {
                for (Class paramType : paramTypes) {
                    constructorInfo.append(paramType.getName()).append(",");
                }
                // 删掉最后一个参数的逗号
                constructorInfo.deleteCharAt(constructorInfo.length() - 1);
            }
            constructorInfo.append(");\n");
        }
        return constructorInfo.toString();
    }

    /**
     * 方法信息
     */
    private static String methodInfo(Class clazz) {
        StringBuilder methodInfo = new StringBuilder();
        Method[] methods = clazz.getDeclaredMethods();
        for (Method m : methods) {
            methodInfo.append("    ");
            // 修饰符
            String modifier = Modifier.toString(m.getModifiers());
            if (modifier.length() > 0) {
                methodInfo.append(modifier).append(" ");
            }
            // 返回值、名称和方法参数
            Class returnType = m.getReturnType();
            methodInfo.append(returnType.getName()).append(" ");
            methodInfo.append(m.getName()).append("(");
            Class[] paramTypes = m.getParameterTypes();
            if (paramTypes.length > 0) {
                for (Class paramType : paramTypes) {
                    methodInfo.append(paramType.getName()).append(",");
                }
                // 删掉最后一个参数的逗号
                methodInfo.deleteCharAt(methodInfo.length() - 1);
            }
            methodInfo.append(");\n");
        }
        return methodInfo.toString();
    }
}

```

# 调用对象的方法

### Method 类

在 Method 类中，有一个 `invoke` 方法，可以调用当前 Method 实例代表的方法。它的方法签名如下
```java
Object invoke(Object obj, Object... args);
```
其中，第一个参数代表的是某个需要调用方法的对象实例，第二个参数是个可变参数数组，即对象方法的传递参数。

对于静态方法，是不需要通过某个具体实例来调用的，因此第一个参数可以用 null 传递。

方法的返回值是一个 Object 对象，对于返回值为基本类型或者 void 的方法来说，会返回对应的包装类型或者 null。

Method 对象可以通过两种方法来获取
- 通过调用 Class 类的 `getDeclaredMethods()` 方法会返回一个方法数组，可以在数组里查找想要的 Method 对象。

- 通过调用 Class 类的 `getMethod()` 方法会返回一个 Method 对象。`getMethod()` 方法的方法签名如下
    ```java
    Method getMethod(String name, Class... parameterTypes);
    ```
    第一个参数是方法的名称，第二个参数是方法的参数列表。实际上，`getMethod()` 的参数传递的是一个方法的方法签名，通过方法签名可以确定一个类中的方法。

通过反射调用对象方法的过程中，`invoke` 方法的的参数和返回值都是 Object 类型，因此需要**进行多次的类型转换**。假如**有错误**，也要等到运行的过程中才能发现，**没有办法在编译期间检查出来**，所以通过反射调用对象方法要比直接调用对象的方法慢一些。

### 反射调用对象方法的例子

```java
package com.jia;

import java.lang.reflect.Method;

/**
 * @author linjinjia
 * @date 2021/8/18 20:21
 */
public class MethodInvokeDemo {

    public static void main(String[] args) {
        User user = new User(14);
        Class cl = user.getClass();
        try {
            // 无参方法
            Method m1 = cl.getMethod("say");
            m1.invoke(user);

            // 有参方法
            Method m2 = cl.getMethod("say", String.class);
            m2.invoke(user, "java");
            
            // 静态方法
            Method m3 = cl.getMethod("worldState");
            m3.invoke(null);
            
            // 基本类型返回值变成包装类型
            Method m4 = cl.getMethod("age");
            Object obj = m4.invoke(user);
            System.out.println(obj);
            System.out.println( obj instanceof Integer);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

# 创建实例和查看字段值

### 创建实例

有时候通过 `Class.forName()` 方法获取类类型时，我们并不知道具体的类类型是什么。那么也不能提前直接 new 一个对应的对象出来。

因此可行的方法应该是通过反射去创建一个实例对象出来。

反射创建对象的方法有两种
- 通过 Class 类的 `newInstance()` 方法相当于调用默认的无参构造器，返回一个 Object 类型的对象。

- 通过 Constructor 创建对象。Class 类中的 `getConstructor()` 方法可以获取到对应的构造器。它方法签名如下
    ```java
    Constructor getConstructor(Class... parameterTypes);
    ```
    方法参数是构造器的参数列表。

### 查看字段值

对于很多 JavaBean 而言，可以通过 getter/setter 方法去获取和设置字段的值。

那在反射中，就可以通过方法调用的方式，获取和设置字段的值，因为很多 getter/setter 方法是有规律的，可以通过字段名构造出方法名。

但是通过方法调用获取字段值有时候会显得比较麻烦，我们也可以通过 Field 类的对象来获取和设置字段值。

Field 类中有一个 `get()` 和 `set()` 方法，可以通过这两个方法对字段值进行查看和设值。
- `get()` 方法的签名如下
  
    ```java
    Object get(Object obj);
    ```
    其中，方法参数 obj 为实例对象。
- `set()` 方法的签名如下
    ```java
    void set(Object obj, Object value)
    ```
    其中，第一个方法参数为实例对象，第二个参数是要设置的字段值。

Field 对象的获取和 Method 对象相似，可以通过 `getDeclaredFields()` 方法或者 `getField()` 方法获取。

### 创建实例和查看设置字段值的例子

```java
package com.jia;

/**
 * @author linjinjia
 * @date 2021/8/18 15:27
 */
public class CreateInstanceDemo {

    public static void main(String[] args) {
        try {
            Class cl = Class.forName("com.jia.User");
            // 通过默认构造器
            Object user = cl.newInstance();
            Method m1 = cl.getMethod("say");
            m1.invoke(user);

            // 通过有参构造器
            Constructor constructor = cl.getConstructor(int.class);
            Object user2 = constructor.newInstance(14);
            // 查看字段值
            Field field = cl.getDeclaredField("age");
            field.setAccessible(true); // 设置为可访问
            System.out.println(field.get(user2));
            field.set(user2, 20);
            System.out.println(user2);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

代码中有一行代码 `field.setAccessible(true);` ，它是设置字段访问权限的。因为 age 是 private 修饰的，即使是反射，也要受限于 Java 的访问控制。

如果没有访问权限，那么在调用 `get()` 方法的时候，将会抛出 IllegalAccessException。

为了摆脱 Java 安全管理器的控制，需要调用 Field、Method 或者 Constructor 对象的 `setAccessible()` 方法。

`setAccessible()` 方法是 AccessibleObject 的一个方法，它是 Field、Method 和 Constructor 的公共超类。

