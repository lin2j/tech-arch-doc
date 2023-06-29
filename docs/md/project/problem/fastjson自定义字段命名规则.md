### 前置知识

fastjson 在将对象转变为 JSON 字符串时，字段默认使用 CamelCase 规则命名。

在1.2.15版本之后，fastjson 支持配置 PropertyNamingStrategy，支持四种策略： CamelCase、PascalCase、SnakeCase和KebabCase。

属性名策略说明：

CamelCase策略，Java对象属性：userName，序列化后属性：userName；

PascalCase策略，Java对象属性：userName，序列化后属性：UserName；

SnakeCase策略，Java对象属性：userName，序列化后属性：user_name；

KebabCase策略，Java对象属性：userName，序列化后属性：user-name。

### 我的问题

公司规定 ElasticSearch 上索引的键需要使用大写字母表示，比如 USER_NAME，所以现在的规则没办法满足我的要求。

一开始想看一下是否可以实现什么接口来达到目的，但是发现 PropertyNamingStrategy 是个枚举类，无法继承。

### 解决办法

#### 方法一：

将对象转变为 BeanMap 对象，遍历所有的字段，将字段转变为下划线大写的形式。

下面给出关键代码。

```java
import org.springframework.cglib.beans.BeanMap;

/**
 * 将对象转变为以字段为键，字段值为值的哈希表，并且字段名变为下划线大写的形式
 */
public static <T> Map<String, Object> beanToMap(T bean) {
    Map<String, Object> map = Maps.newHashMap();
    if (bean != null) {
        BeanMap beanMap = BeanMap.create(bean);
        for (Object key : beanMap.keySet()) {
            map.put(StrUtil.camelToUnderscore(key.toString()), beanMap.get(key));
        }
    }
    return map;
}

/**
 * 将驼峰式命名的字符串转换为下划线大写方式。如果转换前的驼峰式命名的字符串为空，则返回空字符串。
 * 例如：HelloWorld->HELLO_WORLD
 *
 * @param name 转换前的驼峰式命名的字符串
 * @return 转换后下划线大写方式命名的字符串
 */
public static String camelToUnderscore(String name) {
    StringBuilder result = new StringBuilder();
    if (name != null && name.length() > 0) {
        // 将第一个字符处理成大写
        result.append(name.substring(0, 1).toUpperCase());
        // 循环处理其余字符
        for (int i = 1; i < name.length(); i++) {
            String s = name.substring(i, i + 1);
            // 在大写字母前添加下划线
            if (s.equals(s.toUpperCase()) && !Character.isDigit(s.charAt(0))) {
                result.append("_");
            }
            // 其他字符直接转成大写
            result.append(s.toUpperCase());
        }
    }
    return result.toString();
}
```

最后通过下面的代码可以将对象发送到 es 进行保存。

```java
IndexRequest request = new IndexRequest(esIndex);
String infoId = StringUtil.toString(t.getInfoId());
request.routing(infoId).source(BeanMapUtil.beanToEsMap(t)).id(infoId);
```

#### 方法二

使用 @JsonField 的 name 属性，在 name 中直接指定命名规则，可以直接得到想要的 JSON 字符串。

下面给出代码示例。

```java
/**
 * @author linjinjia
 * @date 2021/8/23 20:09
 */
public class FastJsonTest {

    public static void main(String[] args) {
        System.out.println(JSON.toJSONString(new User("lin2j", 24)));
        User user = JSON.parseObject("{\"AGE\":24,\"USER_NAME\":\"lin2j\"}", User.class);
        System.out.println(user);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    static class User {
        @JSONField(name = "USER_NAME")
        private String userName;

        @JSONField(name = "AGE")
        private Integer age;
    }
}
```

输出结果为：

```java
{"AGE":24,"USER_NAME":"lin2j"}
FastJsonTest.User(userName=lin2j, age=24)
```

这种方式也能满足我的要求。

### 对比

方法一和方法二都能满足我的要求，但是方法一并不是通过 fastjson 来实现目的的，也会显得麻烦一些。

我比较喜欢使用方法二，因为不用写那么多工具类。