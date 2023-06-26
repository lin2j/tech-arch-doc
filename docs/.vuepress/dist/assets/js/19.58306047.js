(window.webpackJsonp=window.webpackJsonp||[]).push([[19],{290:function(t,a,v){"use strict";v.r(a);var _=v(10),s=Object(_.a)({},(function(){var t=this,a=t._self._c;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("p",[t._v("消息队列是分布式系统中的重要组件，也是 "),a("code",[t._v("Java")]),t._v(" 开发中常用的技术点之一。")]),t._v(" "),a("p",[t._v("使用消息队列可以解决模块间的解耦、流量削峰、异步消息，提高系统的可用性、稳定性以及性能。")]),t._v(" "),a("h3",{attrs:{id:"消息队列的优点与应用场景"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#消息队列的优点与应用场景"}},[t._v("#")]),t._v(" 消息队列的优点与应用场景")]),t._v(" "),a("h4",{attrs:{id:"解耦"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#解耦"}},[t._v("#")]),t._v(" 解耦")]),t._v(" "),a("p",[t._v("在大型项目中，如果使用传统的通过方法进行模块间的相互调用的形式，无法保证系统稳定性。")]),t._v(" "),a("p",[t._v("假设任务告警模块需要在触发告警时将告警信息发送给任务管理模块，那么传统模式中，任务告警模块在调用任务管理模块时，将会报错导至告警消息丢失。如下图：")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://www.lin2j.tech/blog-image/kafka/%E4%BB%BB%E5%8A%A1%E5%91%8A%E8%AD%A6-%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86.jpg",alt:"任务告警-任务管理"}})]),t._v(" "),a("p",[t._v("如果引入消息队列的话，则有告警消息时，任务告警模块将告警信息生产到消息队列。任务管理模块监听消息队列，消息队列有消息时则消费。")]),t._v(" "),a("p",[t._v("这样即使任务管理模块异常了，告警消息也会存在于消息队列中，等待任务管理模块正常后进行消费。两个模块之间通过消息队列进行解耦，达到高可用的目的。如下图：")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://www.lin2j.tech/blog-image/kafka/%E4%BB%BB%E5%8A%A1%E5%91%8A%E8%AD%A6-%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86-%E6%B6%88%E6%81%AF%E9%98%9F%E5%88%97.jpg",alt:"任务告警-任务管理-消息队列"}})]),t._v(" "),a("h4",{attrs:{id:"流量削峰"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#流量削峰"}},[t._v("#")]),t._v(" 流量削峰")]),t._v(" "),a("p",[t._v("在传统架构中，如果有大量的数据库读写请求涌入，一瞬间压在数据库上，数据库有可能吃不消。\n如果采用消息队列，系统A按照自身的处理速度去消息队列中去消息，然后做数据库请求，则可以有效的减轻数据库的压力。\n流量削峰也可以应用在秒杀活动中，秒杀活动一般会有大量请求涌入。通过设置消息队列的长度来控制活动的人数，也可以减轻秒杀应用的压力。\n将先到的请求消息存到消息队列，队列满了之后，则将后到来请求抛弃或者跳转到错误页面，秒杀业务再根据业务逻辑处理消息队列中的消息。如下图：")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://www.lin2j.tech/blog-image/kafka/%E6%B5%81%E9%87%8F%E5%89%8A%E5%B3%B0-%E7%A7%92%E6%9D%80%E4%B8%9A%E5%8A%A1.jpg",alt:"流量削峰-秒杀业务"}})]),t._v(" "),a("h4",{attrs:{id:"异步消息"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#异步消息"}},[t._v("#")]),t._v(" 异步消息")]),t._v(" "),a("p",[t._v("从前面两个优点也可以看出，发送到消息队列上的时候，生产者可以不用等待消息的处理结果。")]),t._v(" "),a("p",[t._v("一些非必要的业务逻辑参杂在主流程中，会消耗整个流程太多的时间。可以将非必要的业务逻辑消息发送到消息队列，通过异步的方式处理。")]),t._v(" "),a("p",[t._v("比如下单支付之后会有一条短信通知，这个短信通知的部分，就可以通过异步的方式处理，减少支付的响应时间。")]),t._v(" "),a("p",[a("img",{attrs:{src:"https://www.lin2j.tech/blog-image/kafka/%E5%BC%82%E6%AD%A5-%E6%94%AF%E4%BB%98%E6%B5%81%E7%A8%8B.jpg",alt:"异步-支付流程"}})]),t._v(" "),a("h3",{attrs:{id:"消息队列的缺点"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#消息队列的缺点"}},[t._v("#")]),t._v(" 消息队列的缺点")]),t._v(" "),a("p",[t._v("消息队列也不全是好处，引入消息队列还会给系统带来一系列的问题。")]),t._v(" "),a("h4",{attrs:{id:"增加系统的复杂度"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#增加系统的复杂度"}},[t._v("#")]),t._v(" 增加系统的复杂度")]),t._v(" "),a("p",[t._v("在串行处理的代码逻辑里，按照处理流程一步一步写好就可以了。但是引入消息队列，需要考虑的东西更多，比如如何保证消息不被重复消费、如何保证消息可靠传输以及一致性问题。")]),t._v(" "),a("h4",{attrs:{id:"系统可用性降低"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#系统可用性降低"}},[t._v("#")]),t._v(" 系统可用性降低")]),t._v(" "),a("p",[t._v("本来只要系统的各个模块运行正常，就不会有什么问题。但是在引入消息中间件后，还需要维护多一个组件，如果组件挂了，那么整个系统也就瘫痪了。因此，可用性降低了。")]),t._v(" "),a("h4",{attrs:{id:"研发成本增加"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#研发成本增加"}},[t._v("#")]),t._v(" 研发成本增加")]),t._v(" "),a("p",[t._v("引入消息队列后，首先需要对选择的消息队列有深入的了解，以及相应的技术选型。消息队列本身也比较复杂，需要根据具体的应用场景进行判断。")]),t._v(" "),a("h3",{attrs:{id:"消息队列的三大重要特性"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#消息队列的三大重要特性"}},[t._v("#")]),t._v(" 消息队列的三大重要特性")]),t._v(" "),a("h4",{attrs:{id:"幂等性"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#幂等性"}},[t._v("#")]),t._v(" 幂等性")]),t._v(" "),a("p",[t._v("在百度百科中，关于幂等的描述如下：")]),t._v(" "),a("blockquote",[a("p",[t._v("在编程中一个幂等操作的特点是其任意多次执行所产生的影响均与一次执行的影响相同。")])]),t._v(" "),a("p",[t._v("生产者在进行重试的时候，有可能会重复写入消息，需要通过消息队列的幂等性来避免这种情况发生。")]),t._v(" "),a("p",[t._v("可以通过为每条消息设置唯一 ID，消费是判断该 ID 是否已经消费过，消费过则丢弃。")]),t._v(" "),a("h4",{attrs:{id:"顺序性"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#顺序性"}},[t._v("#")]),t._v(" 顺序性")]),t._v(" "),a("p",[t._v("当两个业务之间存在先后关系时，需要保证操作的顺序性，这样才不会发生业务处理错误。比如有下单和支付两个操作，需要先下单才有支付的操作。")]),t._v(" "),a("p",[t._v("如果有下单消息和支付消息两条队列，它们各自的顺序混乱的，并不是按照消息生产的顺序入队，那么就可能会在支付的时候找不到下单消息，从而导致支付失败。")]),t._v(" "),a("p",[t._v("对于消息中间件的消息顺序性问题，一般通用的处理方案是保证局部的消息有序。")]),t._v(" "),a("h4",{attrs:{id:"可靠性"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#可靠性"}},[t._v("#")]),t._v(" 可靠性")]),t._v(" "),a("p",[t._v("消息队列的可靠性指的是消息丢失，如何防止消息丢失，消息丢失后如何处理？")]),t._v(" "),a("p",[t._v("对于消息可靠性来说，如果要保证 100% 不丢消息，需要从生产者、服务器、消费者三个地方入手，做好参数配置和异常处理，尽最大努力保证消息不丢失。")])])}),[],!1,null,null,null);a.default=s.exports}}]);