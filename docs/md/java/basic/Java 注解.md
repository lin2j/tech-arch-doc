---
title: Java 注解机制
---

# 一、注解概述

## 1. 什么是 Java 注解

Java 注解（Annotation）又称 Java 标注，是 JDK 1.5引入的一种**注释机制**。

注解可以用来标注程序中的类、字段、变量、参数等。**注解只是一种注释、标记作用**，注解插入到代码中，进而可以达到**影响代码运行逻辑**的效果，比如可以动态切换数据源、拼接SQL语句、标记接口白名单等。当然，这些效果都是基于自定义注解完成的，需要我们对注解有一个很好的认识，才能使用注解来帮助我们**减少重复性**代码的开发。

在 Java 中，注解是当作一种修饰符来使用的，它被置于被注释项之前，中间没有分号。

## 2. 学习注解的好处

通过注解，我们可以写出更简短、优雅的代码。比如 lombok 的 @Data 注解等等。

学习注解可以帮助我们看懂开源框架的代码。像 Spring、Mybatis 中用了大量的注解，来帮助我们更加方便地使用框架。

# 二、注解的概念与常见注解

## 1. 注解的构成

一般注解由 `@` 符号以及注解名称组成，例如 `@Override`, `@Deprecated` 等。注解也是类，也会拥有属性或者叫方法。

```java
@Table(name = "t_user", privateKey = "id")
@Column(name = "id")
```

`Table` 是注解的名称，而 `name`， `primaryKey` 是注解的属性，各自被赋予了属性值。在运行时，可以通过方法调用的形式，获得属性值，例如 `table.name()`。

注解**使用的位置**，注解可以使用在类（TYPE）、方法（METHOD）、字段（FIELD）、参数（PARAMETER）注解（ANNOTATION_TYPE）等。一个注解可以使用在哪些位置，是由元注解 `@Target` 决定的。

## 2. JDK 内置注解

### 元注解（描述注解的行为属性）

#### 1) @Retention

对注解的生命周期进行控制，即定义该注解被**保留时间的长短**。它唯一的属性是 `RetentionPolicy` 类型的，`RetentionPolicy` 是一个枚举类，它定义了注解的三种生命周期。

- `RetentionPolicy. SOURCE`：注解只保留在源文件，注解在编译器编译字节码文件期间，可以起到一些检查性作用，例如 `@override`, `@SuppressWarnings` 。当 `.java` 文件编译成字节码文件后，注解被遗弃。
- `RetentionPolicy.CLASS`：注解被保留在字节码文件，当 jvm 加载字节码文件时，注解被遗弃。对于在字节码级别做一下后置处理是非常用的。如果一个注解没有标注 `@RetentionPolicy`，则它默认为 `RetentionPolicy.CLASS`。
- `RetentionPolicy.RUNTIME`：注解被保留在字节码文件中，当 jvm 加载字节码文件时，注解依然存在。这样可以在运行时通过反射动态获取注解信息。

#### 2) @Target

对注解作用的对象进行确定，即定义该注解能在**源码的哪些位置声明**。它的唯一属性的类型是`Elementrype[]` 是一个数组，所以 `@Target` 修饰的注解是可以作用在多种元素类型上的。一条没有用`@Target` 限制的注解可以应用于任何项上。

- `ElemenType.TYPE`：Java 中的类型，包括类，接口（包括注解），枚举。
- `ElemenType .METHOD`：方法声明处使用。
- `ElemenType.FIELD`：字段声明处使用。
- `ElemenType.PARANETBR`：参数声明处使用，比如 `@RequestParam("userId")`注解。

#### 3) @Documented

表明该注解可以出现在 Javadoc 中。

#### 4) @Inherited

表明子类可以继承父类中的该注解。

### 常用内置注解

#### 1) @Override

表明某个方法是重写了父类的方法，这个注解在编译期存在，并不强制要求子类重写方法要加上这个注解，但是**推荐使用**，这样父类的方法签名改变，而子类没能及时调整时，才能发现。

#### 2) @Deprecated

可以用来描述类、方法或者字段等这些被描述的对象已经不赞成使用了，如果我们使用了这些类、方法或者字段．编译器会给我们警告。

实际实用中，最好在 Javadoc 中使用 `@Deprecated`，来描述当前类、方法或者字段不赞成使用了，并告诉开发者应该使用什么方式替代这个对象。

# 三、自定义注解

## 1. 注解的声明

Java 注解是通过 `@interface` 符号声明的，所有的注解都实现了一个共同的接口`java.lang.annotation.Annotation`。定义语法如下：

```java
modifiers @interface AnnotationName {
  	elementl;
  	element2;
}
// 每个 element 声明都是如下
type elemetName();
// 或者
type elementName() default value;
```

举例：

```java
//举例
/**
 * 数据库表
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface Table {
		String name() default "";
		String primaryKey() default ""
}

/**
 *数据库表字段
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Column {
		String value() default ""，
}
```

我们还定义了另一个注解 `@Column`，这个注解只有一个元素 `value`。此时，它还有另一个名字，叫**单值注解**。**当一个注解只有一个元素且名字为 `value` 时，我们在使用注解的时候，可以忽略元素名和等号**，比如`@Column("user_id"')`。

## 2.注解的元素声明

实际上，注解的**元素声明是方法声明**。不过注解的方法声明有一定的**限制**：**不能有任何参数和任何 throws 语句，并且不能是泛型**。

注解的元素类型是下列之一：

- 基本类型 （Java 八大基本类型）
- String
- Class（具有一个可选的类型参数，例如 `Class<? entends Parent>` )
- enum
- 注解类型
- 由上述类型组成的数组，但由数组组成的数组（即多维数组）不是合法的元素类型

**注解元素永远不能为 null，也不允许引入循环依赖。**

# 四、通过反射获取注解信息

## 注解相关的反射 API

Java 的反射机制允许程序在运行时对任意对象的内部属性和方法进行操作。对于 `RetentionPolicy.RUNTIME` 标注的注解，我们可以在运行时，获取注解的信息，动态地改变程序的运行时行为。

反射相关的API，你可以在 `java.lang.reflect.AnnotatedElement` 接口在找到，`Class` 、`Method`、`Field`  等类都实现了这个接口。**这个接口的某些方法会返回注解数组，对返回的数组进行任何操作都不会影响到其他调用者**。

- `<T extends Annotation> T getAnnotation(Class<T> annotationClass)`

  返回对象使用的某种类型的注解，如果存在则返回对应类型的注解，否则就返回 `null`。

- `Annotation[] getAnnotations()`
  
  返回对象上所有的注解，如果没有注解在此对象上，则返回一个 length 为0的数组。
  
- `default <T extends Annotation> T[] getAnnotationsByType(Class<T> annotationClass)`

  获取某种类型的注解数组，如果不存在，则返回 length 为0的数组。这个方法和 `getAnnotation(Class)`的区别在于，如果参数是一个可重复的注解 (`@Repeatable`记的注解），那么该方法会尝试寻找对象上所有该类型的注解，并返回。

- `<T extends Annotation> T getDeclaredAnnotation(Class<T> annotationclass)`

  由**当前对象直接声明的某个特定的注解**，否则返回 `null` 。

- `default <T extends Annotation> T[] getDeclaredAnnotationsByType (Class<T> annotationClass)`
  
  由**当前对象直接声明**的某种特定类型的注解。与 `getAnnotationsByType(Class)`类似，如果参数是一个可重复的注解，那么该方法会尝试寻找对象上所有该类型的注解，并返回。
  
- `Annotation[] getDeclaredAnnotations()`
  
  获取**所有由当前对象直接声明的注解**。如果没有注解在此对象上，则返回一个 `length` 为 0 的数组。
  
- `default boolean isAnnotationPresent(Class<? extends Annotation> annotationClass)`

  判断对象上是否存在某个注解，如果存在则返回 `true` 否则返回 `false`。实际上实现逻辑是 `getAnnotation(annotationClass) != null`。

