今天在开发过程中发现一个问题，原本的逻辑是方法去做一次网络请求，成功之后再将记录插入到数据库。

但是在实际测试中，发现即使网络请求失败，也会插入到数据库。

我已经加了 `@Transactional` 注解了，但是似乎不起效果。

部分代码如下

```java
@Override
public void bindChannel(TvWallChannelBindDto dto) {
    TvWallChannelConfig entity = dto.toEntity();
    checkBind(dto);
    DecoderInfo decoder = getDecoder(dto.getDecoderSbbm());
    if (Objects.isNull(decoder)) {
        throw new BizException("编码器不存在");
    }
    DisChannelInfo channelInfo = disChannelInfoMapper.queryByConfig(entity);
    if (Objects.isNull(channelInfo)) {
        throw new BizException("通道不存在");
    }
    bind(entity, decoder);
}

@Transactional(rollbackFor = Exception.class)
public void bind(TvWallChannelConfig entity, DecoderInfo decoder) {
    tvWallChannelConfigMapper.insert(entity);
    // 下面做网络请求
    channelDistribute(entity.getWindowNo(), decoder, entity.getChannelNo());
}
```

如上，我没有细心地去研究代码逻辑的先后顺序，一昧地认为开启了事务就可以在发生异常时进行回滚了。

但是我却没意识到 `@Transactional`注解失效的情况有哪些，而这里就包含了一种。

因此我通过 Google 搜索，寻找`@Transactional` 失效的情况，发现有如下的使用规则。

1. 使用 @Transactional 注解的方法，需要是 `public` 的。如果加在 `protected`、`private` 或者 `package` 可见的方法上，不会生效，也不会报错。
2. `@Transactional` 默认对 `RuntimeException` 才会进行回滚，如果需要对其他的异常也进行回滚，可以通过设置 `rollbackFor` 属性实现，`@Transactional(rollbackFor = Exception.class)` 。
3. 如果异常在方法内部被 `try...catch` 掉了，事务也不会进行回滚。
4. `Springboot` 项目默认已经支持事务，不用配置；其他类型项目需要在 xml中配置是否开启事务。
5. 检查下自己的数据库是否支持事务，如 `MySQL` 的 `mylsam`。
6. 如果在同一个类中，一个非`@Transaction`的方法调用有`@Transaction`的方法不会生效，因为代理问题。

这里面的前 5 点我都没违反，只有第 6 点，跟我的情况符合。

得知原因后，只需要对 `bind()` 方法做一下简单的调整即可。

```java
// @Transactional(rollbackFor = Exception.class)
public void bind(TvWallChannelConfig entity, DecoderInfo decoder) {
    channelDistribute(entity.getWindowNo(), decoder, entity.getChannelNo());
    tvWallChannelConfigMapper.insert(entity);
}
```

这里能这么做是因为数据库的插入本来就应该在网络请求成功后才能进行。失败之后会产生异常，直接退出方法。

之前也是因为自己的粗心，导致了这一个问题。



**为什么没加 @Transactional 的方法调用加了 @Transactional 注解的方法时，不会开启事务？**

首先要知道加了 `@Transactional` 注解后，Spring 通过 AOP 对类或者方法进行增强。

具体是通过生成代理类，在调用实际方法前，开启一个事务，然后再调用实际方法。

问题就出在这里，调用实际方法的方式，是在代理类中创建一个没有增强的对象，也就是我们实际编码写的类的实例，是没有进行过增强的，我们写出来是怎么样，它就是怎么样的。

即使 `bind()` 方法有增加 `@Transactional` 注解，但是实际对象中并没有开启事务，因此看起来就好像注解没生效。

辅助例子：

```java
@Service
public class A {
    public void a(){
        b();
    }
    
    @Transactional(rollbackFor = Exception.calss)
    public void b(){
        
    }
}

// Spring 扫描到 @Service 和 @Transactional 注解后
// 为 A 生成一个代理类，增强 A 的功能
public class Proxy$A {
    A obj = new A();
    
    public void a() {
        // 这里直接调用 A 的 a() 方法，是没有启用事务的
        obj.a();
    }
    
    public void b() {
      	// 扫描到 b 方法有 @Transactional 注解，为其开启事务
        startTransactinal();
        obj.b();
    }
}
```

可以看出 Proxy$A 在调用 `a()` 方法时，并没有调用增强过的 `b()` 方法。

解决的方法，我认为可以使用以下几种

1. 把这两个方法分开到不同的类上
2. 把注解加到类名上
3. 调整代码的逻辑顺序，在不影响正常逻辑的情况下，将数据库的操作尽量往后移