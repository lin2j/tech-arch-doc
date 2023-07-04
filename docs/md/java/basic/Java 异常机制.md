异常是程序中的一些错误，有时候错误是无法避免的，有些错误是用户引起的，有些错误是程序引起的，所以需要一套异常处理机制来处理这些错误。

# 异常的层次结构

![Exception](https://www.lin2j.tech/blog-image/basic/Exception.png)

## Throwable

Throwable 是 Java 中所有错误、异常的顶级父类，向下可以分为 Error（错误） 和 Exception（异常）两种类型。

Throwable 提供了 printStackTrace() 等方法，可以在发生异常时打印异常的调用栈信息，方便排查问题。

## Error 

Error 是虚拟机在运行时产生了致命的严重问题，应用程序不应该去处理这类问题。

比如 OutOfMemoryError：内存不足，StackOverflowError：栈溢出。

## Exception 

Exception 是可以捕获并由应用程序处理的异常，可以分为两类：运行时异常和异常

- 运行时异常是 RuntimeException 类及其子类，运行时异常不需要在编译时显式地进行捕获或者声明，而是在运行时可能抛出并有程序的调用者进行处理，也叫不可查异常。

- 编译时异常是 Exception 的子类，但并不是 RuntimeException 子类，编译时异常时需要在编译时强制要求程序进行捕获或者声明，以确保异常能被正常处理或者传递，也叫可查异常。

# 异常的使用

## 异常关键字

- try ：用于定义一个包含可能抛出异常的代码块。

- catch ：用于捕获和处理 try 块中抛出的异常。catch 在后面跟上要捕获的异常类型，然后对相应的异常进行处理。

- finally ：用于定义一个无法是否发生异常都会执行的代码块。finally 代码块通常用来做关闭连接、释放资源等必要操作。

- throw ：用于代码中抛出一个异常，后接一个异常对象。

- throws ：用于方法声明中指定该方法可能抛出的异常，后接一个或者多个异常类型。如果抛出的是编译时异常，则调用方必须要对可能抛出的异常进行处理。

- try-with-resources ： 是 Java7 引入的一个语法糖，用于简化资源的获取与释放代码。对于实现了  AutoCloseable  接口的资源，无需现实地在 finally 块中进行释放

## 异常关键字使用示例

配合注释去运行体会

```java
import java.util.concurrent.TimeUnit;

/**
 * @author linjinjia
 * @date 2023/7/3 17:57
 */
public class ExceptionUsage {

    /**
     * 自定义检查异常（运行时异常）
     */
    private static class MyCheckedException extends Exception {
    }

    /**
     * 自定义不可查异常（编译时异常）
     */
    private static class MyUncheckedException extends RuntimeException {
    }

    /**
     * 自定义自动关闭的资源
     */
    private static class AutoCloseableResource implements AutoCloseable {
        @Override
        public void close() throws Exception {
            // 使用 try-with-resources 的方式，
            // 即使我们没有显式调用这个方法，它也会自动执行
            System.out.println("try-with-resources: 自动关闭资源");
        }
    }

    /**
     * 该方法会声明并抛出一个编译时异常，调用方必须处理异常
     */
    public static void throwCheckedException() throws MyCheckedException {
        System.out.println("throwCheckedException: 抛出编译时异常");
        throw new MyCheckedException();
    }

    /**
     * 该方法会声明并抛出一个运行时异常，调用方不是必须处理异常
     */
    public static void throwUncheckedException() throws MyUncheckedException {
        System.out.println("throwUncheckedException: 抛出运行时异常");
        throw new MyUncheckedException();
    }

    /**
     * 演示关键字的使用
     */
    public static void tryCatchFinally() {
        try {
            throwCheckedException();
        } catch (MyCheckedException e) {
            // 编译时异常必须被处理
            // 可以将这个 catch 块删除，然后编译，会不通过
            System.out.println("tryCatchFinally: 处理编译时异常");
            e.printStackTrace();
        } finally {
            System.out.println("tryCatchFinally: finally 块一定会被执行");
        }

        try {
            // 不用去处理这个方法抛出的异常，照样可以编译成功，
            // 只不过在运行时不处理会导致线程结束
            throwUncheckedException();
        } catch (MyUncheckedException e) {
            // 可以将这个 catch 块删除，然后编译，可以通过
            // 再运行则会报错
            System.out.println("tryCatchFinally: 处理运行时异常");
            e.printStackTrace();
        } finally {
            System.out.println("tryCatchFinally: finally 块一定会被执行");
        }
    }

    /**
     * 演示 try-with-resources 的使用
     */
    public static void tryWithResources() {
        try (AutoCloseableResource r = new AutoCloseableResource()) {
            // doSomething
        } catch (Exception e) {
            System.out.println("tryWithResources: 处理异常");
        }
    }

    /**
     * try-finally 也搭配使用，不一定需要 catch 异常
     * 通常用在需要保证某部分代码一定需要被执行的情况，比如锁的释放
     */
    public static void tryFinally() {
        try {
            System.out.println("tryFinally: try 代码块");
        } finally {
            System.out.println("tryFinally: finally 代码块");
        }
    }

    public static void main(String[] args) throws Exception {
        tryCatchFinally();
        TimeUnit.SECONDS.sleep(1);
        System.out.println("\n分割线 -------------------- \n");
        tryWithResources();
        System.out.println("\n分割线 -------------------- \n");
        tryFinally();
    }
}
```

# 异常的最佳实践

## 使用 finally 或者 try-with-resources 来清理资源

- finally 可以保证资源释放的代码一定会被执行；
- try-with-resources 对于实现了 AutoCloseable 接口的资源，可以自动关闭，简化代码。

## 异常不要用来做流程控制，条件控制

异常设计的初衷是解决程序运行中的各种意外情况，且异常的处理效率比条件判断方式要低很多。

很多问题可以通过提前判断，来规避异常。比如 NullPointerException，IndexOutOfBoundsException 等等。

而对于解析字符串转数字的情况，可能存在数字错误，可以通过 catch NumberFormatException 实现。

## 对异常进行文档说明

定义异常的时候，需要添加注释明确异常已经在什么情况下使用，避免被滥用。

在方法声明出如果有抛出异常，需要添加  Javadoc 的 @throws 进行描述异常在什么情况下抛出，以方便调用者处理异常。

```java
/**
 * xxx
 * @throws BusinessException 业务异常，xxx
 */
public void test() throws BusinessException {
  // doSomething
}
```

## 尽量复用已有的异常

复用大家熟悉的异常，可以减少别人的代码理解时间，也可以使得你的 API 易于理解和使用。

但是异常的复用是建立在语义之上的，要结合异常的文档来使用，避免出现与异常原本用途不一致的情况。

## 优先捕获明确的异常

当有多个 catch 块的时候，应当将更明确的异常放在前面。

这里的更明确指的是子类，因为异常的层次结构来看，越底层语义应当越明确。

比如 SQLSyntaxErrorException 是 SQLException 子类，拥有更明确的语义，因此捕获的时候，应当优先考虑捕获 SQLSyntaxErrorException。

```java
public void execSql() {
    try {
        // doSomething
    } catch (SQLSyntaxErrorException e) {
        log.error(e);
    } catch (SQLException e) {
        log.error(e)
    }
}
```

之所以要把明确的异常放在前面，是因为如果把 SQLException 放在前面，那么异常就被第一个 catch 块捕获，后面的 catch 块即使异常类型符合也不会执行了。

## 不要捕获 Throwable 类

正如前面提到的， Throwable 包含了 Error 和 Exception，而 Error 是不应该在应用程序中去处理的严重问题。所以一般不要去捕获 Throwable 类。

## 不要忽略捕获的异常

捕获异常是为了处理它，不要捕获了却什么都不处理而抛弃之，如果不想处理它， 请将该异常抛给它的调用者。最外层的业务使用者，必须处理异常，将其转化为用户可以理解的内容。

如果不需要调用者处理，可以**捕获之后通过日志打印错误信息**，方便后期排查问题。

### 包装异常时不要抛弃原始的异常

捕获标准异常并包装为自定义异常时，需要将原本的标准异常传入构造方法，作为自定义异常的 cause 。这样做是为了后面可以正常打印自定义异常的堆栈信息，方便问题的排查。

## 不要在 finally 块中使用 return 

这样执行 finally 块的时候，会直接通过 return 返回，而不会调用 try 块中的 return。

# 异常的底层原理

## 从字节码看异常

Java 异常的底层原理涉及到 JVM 的异常处理机制，每当发生异常时，JVM 会按照一定的规则来处理异常。而这一套处理流程是建立在异常表 Exception table 的基础上进行的。

下面用一个简单的例子，从字节码的层面来看 JVM 是怎么处理异常的。

```java
public class ExceptionTest {

    public static void throwExcep() {
        int i = 1 / 0;
    }
    
    public static void main(String[] args) {
        try {
            throwExcep();
        } catch (ArithmeticException e1) {
            e1.printStackTrace();
        } catch (Exception e2) {
            e2.printStackTrace();
        }
    }
}
```

接下来使用命令 `javac ExceptionTest.java` 将代码编译成字节码，然后使用 `javap -c ExceptionTest`  打印字节码信息。

> javap 是 JDK 自带的命令行工具，用于反汇编字节码文件，-c 选项表示打印字节码指令

```java
Compiled from "ExceptionTest.java"
public class ExceptionTest {
  public ExceptionTest();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public static void throwExcep();
    Code:
       0: iconst_1
       1: iconst_0
       2: idiv
       3: istore_0
       4: return

  public static void main(java.lang.String[]);
    Code:
       0: invokestatic  #2                  // Method throwExcep:()V
       3: goto          19
       6: astore_1
       7: aload_1
       8: invokevirtual #4                  // Method java/lang/ArithmeticException.printStackTrace:()V
      11: goto          19
      14: astore_1
      15: aload_1
      16: invokevirtual #6                  // Method java/lang/Exception.printStackTrace:()V
      19: return
    Exception table:
       from    to  target type
           0     3     6   Class java/lang/ArithmeticException
           0     3    14   Class java/lang/Exception
}
```

文件的尾部出现了前面提的 Exception table，它包含了四个信息

- from：可能发生异常的起点。
- to：可能发生异常的重点。
- target：在 from 和 to 之间发生异常后的异常处理位置。
- type：异常处理位置能处理的异常类型，如果为 any 则表示这部分代码一定会被执行。

所以上述的异常表的第一行表示，在 $0$ 和 $3$ 之间发生了 ArithmeticException 以后的话，会由位置 $6$ 的指令进行处理。

上面是 **try-catch** 的处理方式，如果 **try-catch-finally** 的话，则会复杂一些。从 javap 的结果来看，字节码指令会保证 finally 代码块一定会被执行。

```java
public class exceptiontest2 {

    public static void throwexcep() {
        int i = 1 / 0;
    }

    public static string wrap() {
        try {
            throwexcep();
            return "ok";
        } catch (exception e2) {
            e2.printstacktrace();
            return "error";
        } finally {
            system.out.println("finally block");
        }
    }
    
    public static void main(string[] args) {
        wrap();
    }
}
```

 javap -c ExceptionTest2 的结果

```java
Compiled from "ExceptionTest2.java"
public class ExceptionTest2 {
  public ExceptionTest2();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public static void throwExcep();
    Code:
       0: iconst_1
       1: iconst_0
       2: idiv
       3: istore_0
       4: return

  public static java.lang.String wrap();
    Code:
       0: invokestatic  #2                  // Method throwExcep:()V
       3: ldc           #3                  // String OK
       5: astore_0
       6: getstatic     #4                  // Field java/lang/System.out:Ljava/io/PrintStream;
       9: ldc           #5                  // String finally block
      11: invokevirtual #6                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      14: aload_0
      15: areturn
      16: astore_0
      17: aload_0
      18: invokevirtual #8                  // Method java/lang/Exception.printStackTrace:()V
      21: ldc           #9                  // String Error
      23: astore_1
      24: getstatic     #4                  // Field java/lang/System.out:Ljava/io/PrintStream;
      27: ldc           #5                  // String finally block
      29: invokevirtual #6                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      32: aload_1
      33: areturn
      34: astore_2
      35: getstatic     #4                  // Field java/lang/System.out:Ljava/io/PrintStream;
      38: ldc           #5                  // String finally block
      40: invokevirtual #6                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      43: aload_2
      44: athrow
    Exception table:
       from    to  target type
           0     6    16   Class java/lang/Exception
           0     6    34   any
          16    24    34   any

  public static void main(java.lang.String[]);
    Code:
       0: invokestatic  #10                 // Method wrap:()Ljava/lang/String;
       3: pop
       4: return
}
```

从 wrap 方法的字节码指令来看，finally 块的指令被复制到多个地方以保证一定会被执行。

如果觉得上述字节码指令太复杂，可以使用下面的代码进行测试。

```java
public class ExceptionTest3 {
    
    public static void main(String[] args) {
        try {
            int a = 1;
        } finally {
            System.out.println("finnaly block");
        }
    }
}
```

## 异常表的使用流程

![Exception-Table](https://www.lin2j.tech/blog-image/basic/Exception-Table.png)

如果当前线程是最后一个非守护线程，那么就不是线程终止，而是 JVM 直接停止运行。

# 代码下载

文中出现的代码：[点击下载](https://www.lin2j.tech/blog-image/code/exception.zip)
