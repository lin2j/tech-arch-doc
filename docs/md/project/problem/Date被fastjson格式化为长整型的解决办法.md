问题：在将对象转化为 `json` 字符串时，对象的 `Date` 类型的字段会被序列化为 `Long` 型的字段类型。这样在反序列化的时候，就会报错。

```java
java.util.concurrent.CompletionException: com.suntek.vias.taskmanager.exception.SystemException: 服务器内部错误：org.springframework.validation.BeanPropertyBindingResult: 2 errors
Field error in object 'alarmQo' on field 'EndCreateTime': rejected value [1619503200062]; codes [typeMismatch.alarmQo.EndCreateTime,typeMismatch.EndCreateTime,typeMismatch.java.util.Date,typeMismatch]; arguments [org.springframework.context.support.DefaultMessageSourceResolvable: codes [alarmQo.EndCreateTime,EndCreateTime]; arguments []; default message [EndCreateTime]]; default message [Failed to convert property value of type 'java.lang.String' to required type 'java.util.Date' for property 'EndCreateTime'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [@io.swagger.annotations.ApiModelProperty java.util.Date] for value '1619503200062'; nested exception is java.lang.IllegalArgumentException]
...
```

`AlarmQo` 的成员声明

```java
@ApiModelProperty("创建时间-开始")
@JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN, timezone = GMT8)
@DateTimeFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
private Date startCreateTime;

@ApiModelProperty("创建时间-结束")
@JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN, timezone = GMT8)
@DateTimeFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
private Date endCreateTime;
```

`JsonUtil`

```java
public class JsonUtil {

    private static final SerializeConfig config = new SerializeConfig();

    static {
        // userName --> UserName
        config.propertyNamingStrategy = PropertyNamingStrategy.PascalCase;
    }

    public static String upperCaseToString(Object object, boolean needUpperCase) {
        String param;
        if (needUpperCase) {
            //json key转大驼峰
            param = JSON.toJSONString(object, config);
        } else {
            param = JSON.toJSONString(object);
        }

        return param;
    }
}
```

解决办法：

第一种：使用 `JSON#toJSONStringWithDateFormat`方法，指定日期格式化的格式

```java
public static String toJSONStringWithDateFormat(Object object, String dateFormat,SerializerFeature... features)
```

但是这样方式不能指定 `SerializeConfig` ，所以其实并不能满足我的要求。

第二种：使用 `@JsonField` 注解，指定日期格式化的格式。`@JSONField(format = "yyyy-MM-dd HH:mm:ss")`

```java
@ApiModelProperty("创建时间-开始")
@JSONField(format = DatePattern.NORM_DATETIME_PATTERN)
@JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN, timezone = GMT8)
@DateTimeFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
private Date startCreateTime;

@ApiModelProperty("创建时间-结束")
@JSONField(format = DatePattern.NORM_DATETIME_PATTERN)
@JsonFormat(pattern = DatePattern.NORM_DATETIME_PATTERN, timezone = GMT8)
@DateTimeFormat(pattern = DatePattern.NORM_DATETIME_PATTERN)
private Date endCreateTime;
```