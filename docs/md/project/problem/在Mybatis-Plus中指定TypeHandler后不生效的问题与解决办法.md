问题：

在 `Mybatis-Plus` 中为字段指定 `TypeHandler` 之后，`TypeHandler` 只在插入时生效，更新或者查询时未生效。

```
/**
* 设备IP
*/
@TableField(value = "IP", typeHandler = IpTypeHandler.class, jdbcType = JdbcType.INTEGER)
private String ip;
```

`IpTypeHandler` 是一个将 32 位无符号数转换为字符串（或者反过来）的处理器。

经过如此指定之后，在插入时，表现正常，查询时则查出来一个无符号数。



解决办法：

**在 `@TableName` 中指定 `autoResultMap` 为 `true`。**

```java
/**
 * 是否自动构建 resultMap 并使用,
 * 只生效与 mp 自动注入的 method,
 * 如果设置 resultMap 则不会进行 resultMap 的自动构建并注入,
 * 只适合个别字段 设置了 typeHandler 或 jdbcType 的情况
 *
 * @since 3.1.2
 */
boolean autoResultMap() default false;
```



注意点：

上述问题出现，还有另一个要点就是，我是直接调用 `Mybatis-Plus` 的方法，并没有在 `xxxMapper.xml` 文件中书写 `SQL` 语句。**如果是自己写 `SQL` 语句，则需要指定 `resultMap`，并在对应列指定 `TypeHandler`** 。

```xml
<result column="IP" jdbcType="INTEGER" property="ip" typeHandler="com.suntek.vias.portal.typehandler.IpTypeHandler"/>
```