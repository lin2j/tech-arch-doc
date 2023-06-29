### 需求场景

在书写 `swagger` 文档的时候，有些字段是对应一个枚举的。在处理这类字段时，如果在`@ApiModelProperty` 中手动添加枚举值，可能会出现漏写、错写的情况。

接下来就展示一种**在 `swagger` 中处理枚举类型的方法**。示例源码在文章底部，有需要的自取。



### 思路

通过拦截 `swagger` 生成文档的过程，查看字段是否对应某个枚举类，将枚举类的值按照自定义的形式添加到字段描述中。

#### `Springfox`相关的类

##### `ModelPropertyBuilderPlugin`

内含 `void apply(ModelPropertyContext context)` 和 `boolean supports(S delimiter)` 方法。

`support`用来判断该文档类型要不要使用插件。

`apply` 方法是真正做拦截工作的方法，`ModelPropertyContext` 可以给我们**提供字段的信息**。

##### `ModelPropertyContext`

字段的上下文信息，主要介绍下面两个字段。

`ModelPropertyBuilder builder`：包含了字段详细信息。下图是某个字段的信息。

 ![ModelPropertyBuilder](https://www.lin2j.tech/blog-image/problem/ModelPropertyBuilder.png)

`TypeResolver resolver`：用来处理泛型的信息，其 `ResolvedType resolve(Type type, Type... typeParameters)` 返回一个 `ResolvedType` 对象，通过 `ResolvedType` 可以用简单的 `API` 访问类的信息。可以看看 `com.fasterxml.classmate.ResolvedType` 声明的方法，看看这些简单的 `API` 。

#### Demo 中自定义的类

##### 项目结构

 ![swagger-enum-demo-项目结构](https://www.lin2j.tech/blog-image/problem/swagger-enum-demo-%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84.jpg)

##### `pom.xml` 主要的依赖

```xml
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.6.RELEASE</version>
    </parent>

    <properties>
        <springfox-swagger2.version>2.9.2</springfox-swagger2.version>
        <swagger-bootstrap-ui.version>1.9.3</swagger-bootstrap-ui.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>

        <!-- swagger -->
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger2</artifactId>
            <version>${springfox-swagger2.version}</version>
        </dependency>
        <!-- swagger-ui -->
        <dependency>
            <groupId>com.github.xiaoymin</groupId>
            <artifactId>swagger-bootstrap-ui</artifactId>
            <version>${swagger-bootstrap-ui.version}</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
    </dependencies>
```



##### `@SwaggerDisplayEnum`

```java
/**
 * 标记注解，没有字段，仅是标记作用，
 * 标记到的枚举类才能在 swagger 文档中展示
 *
 * @author linjinjia
 * @date 2021/4/5 16:18
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface SwaggerDisplayEnum {
}
```

##### `UserController` 

```java
/**
 * 方便展示效果
 * 
 * @author linjinjia
 * @date 2021/4/5 10:38
 */
@Api(tags = "用户管理接口")
@RestController
@RequestMapping("user")
public class UserController {

    @ApiOperation("获取用户信息")
    @GetMapping
    public UserVo query() {
        UserVo vo = new UserVo();
        vo.setName("jia");
        vo.setGender(GenderEnum.MALE.getCode());
        return vo;
    }
}
```

##### `GenderEnum`

```java
/**
 * @author linjinjia
 * @date 2021/4/5 10:21
 */
@SwaggerDisplayEnum
@Getter
public enum GenderEnum {

    MALE(0, "男"),
    FEMALE(1, "女"),
    UNKNOWN(2, "未知")
    ;

    private final Integer code;
    private final String desc;

    GenderEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    /**
     * 单个枚举的展示
     */
    @Override
    public String toString() {
        return code + "-" + desc;
    }
}
```

##### `UserVo`

```java
/**
 * @author linjinjia
 * @date 2021/4/5 10:10
 */
@Data
public class UserVo {

    @ApiModelProperty("姓名")
    private String name;
    
    /**
     * notes 是对应枚举类的全限定名
     */
    @ApiModelProperty(value = "性别",notes = "com.jia.swaggerenum.enums.GenderEnum")
    private Integer gender;
}
```

##### `SwaggerConfig` ⭐⭐

**做拦截工作的关键类。**

```java
package com.jia.swaggerenum.config;

import com.fasterxml.classmate.ResolvedType;
import com.google.common.base.Optional;
import com.jia.swaggerenum.annotation.SwaggerDisplayEnum;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.util.StringUtils;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.ModelPropertyBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.schema.Annotations;
import springfox.documentation.service.Contact;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spi.schema.ModelPropertyBuilderPlugin;
import springfox.documentation.spi.schema.contexts.ModelPropertyContext;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger.schema.ApiModelProperties;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 关键类
 * 
 * @author linjinjia
 */
@Slf4j
@Configuration
@EnableSwagger2
public class SwaggerConfig implements ModelPropertyBuilderPlugin {

    @Value("${swagger.title}")
    private String swaggerTitle;

    @Value("${swagger.description}")
    private String swaggerDescription;

    @Value("${swagger.version}")
    private String swaggerVersion;

    @Value("${swagger.enable}")
    private Boolean swaggerEnable;

    /**
     * 添加摘要信息(Docket)
     */
    @Bean
    public Docket controllerApi() {
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(new ApiInfoBuilder()
                        .title(swaggerTitle)
                        .description(swaggerDescription)
                        .contact(new Contact("林锦佳", null, "linjinjia047@163.com"))
                        .version(swaggerVersion)
                        .licenseUrl("/api-doc")
                        .build()
                )
                .select()
                .apis(RequestHandlerSelectors.withMethodAnnotation(ApiOperation.class))
                .paths(PathSelectors.any())
                .build();
    }

    @Override
    public void apply(ModelPropertyContext context) {
        //如果不支持swagger的话，直接返回
        if (!swaggerEnable) {
            return;
        }

        //获取当前字段的类型
        final Class fieldType = context.getBeanPropertyDefinition().get().getField().getRawType();

        //为枚举字段设置注释
        descForEnumFields(context, fieldType);
    }

    /**
     * 为枚举字段设置注释
     */
    private void descForEnumFields(ModelPropertyContext context, Class fieldType) {
        Optional<ApiModelProperty> annotation = Optional.absent();

        // 找到 @ApiModelProperty 注解修饰的枚举类
        if (context.getAnnotatedElement().isPresent()) {
            annotation = annotation
                    .or(ApiModelProperties.findApiModePropertyAnnotation(context.getAnnotatedElement().get()));
        }
        if (context.getBeanPropertyDefinition().isPresent()) {
            annotation = annotation.or(Annotations.findPropertyAnnotation(
                    context.getBeanPropertyDefinition().get(),
                    ApiModelProperty.class));
        }

        //没有@ApiModelProperty 或者 notes 属性没有值，直接返回
        if (!annotation.isPresent() || StringUtils.isEmpty((annotation.get()).notes())) {
            return;
        }

        //@ApiModelProperties中的notes指定的class类型
        Class rawPrimaryType;
        try {
            rawPrimaryType = Class.forName((annotation.get()).notes());
        } catch (ClassNotFoundException e) {
            //如果指定的类型无法转化，直接忽略
            return;
        }

        Object[] subItemRecords = null;
        SwaggerDisplayEnum swaggerDisplayEnum = AnnotationUtils
                .findAnnotation(rawPrimaryType, SwaggerDisplayEnum.class);
        // 判断是否存在 @SwaggerDisplayEnum 注解，并且 rawPrimaryType 是枚举
        if (null != swaggerDisplayEnum && Enum.class.isAssignableFrom(rawPrimaryType)) {
            // 拿到枚举的所有的值
            subItemRecords = rawPrimaryType.getEnumConstants();
        }
        if (null == subItemRecords) {
            return;
        }

        final List<String> displayValues =
                Arrays.stream(subItemRecords)
                        .filter(Objects::nonNull)
                        // 调用枚举类的 toString 方法
                        .map(Object::toString)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

        String joinText = " (" + String.join("; ", displayValues) + ")";
        try {
            // 拿到字段上原先的描述
            Field mField = ModelPropertyBuilder.class.getDeclaredField("description");
            mField.setAccessible(true);
            // context 中的 builder 对象保存了字段的信息
            joinText = mField.get(context.getBuilder()) + joinText;
        } catch (Exception e) {
            log.error(e.getMessage());
        }

        // 设置新的字段说明并且设置字段类型
        final ResolvedType resolvedType = context.getResolver().resolve(fieldType);
        context.getBuilder().description(joinText).type(resolvedType);
    }

    @Override
    public boolean supports(DocumentationType documentationType) {
        return true;
    }
}
```

#### 效果截图

![swagger-enum-demo-效果截图](https://www.lin2j.tech/blog-image/problem/swagger-enum-demo-%E6%95%88%E6%9E%9C%E6%88%AA%E5%9B%BE.jpg)

至此，整个过程就算结束了。

#### 示例源码

[点击下载](https://www.lin2j.tech/blog-image/code/swagger-enum-demo.zip)

### 小技巧

`@ApiModelProperty` 的 `notes` 中类的全限定名称可以不用自己一个一个打上去，Idea 提供了复制类的全限定名称的功能。

![copy-reference](https://www.lin2j.tech/blog-image/problem/copy-reference.png)