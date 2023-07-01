写这个转换函数的原因是之前在开发的过程中出现了一个 Bug。业务背景是打算导出一批数据到 Excel ，然后导入第三方系统。但是导入的时候就发生了错误，因为时间的那个字段，在导入第三方系统时，没能被第三方系统正确识别。经过对比正常导入的 Excel 发现，正常导入时，时间单元格的格式是 `常规`，而我导出来的是`文本`，需要手动双击单元格才能变为`常规`。猜测可能是第三方系统读取时，读的是时间的数值（真是奇葩），也就是这篇文章的重点。

easypoi 使用模板导出数据时，模板中自定义的单元格时间格式（yyyy-MM-dd hh:mm:ss）没能起作用。后来发现是因为导出的时候，将时间字段写为文本了，导出后需要手动双击单元格，这样 Excel 才会把这个单元格转换为 `常规`，让时间由字符串变成对应的一个数值。

PS：这个 Bug 不是我写的，我完全是在给别人擦屁股！！！为此我还研究了一波 Excel 单元格格式的问题。对比了正常导入和非正常导入的 Excel 很多遍，最后才发现这个小细节，问题才能得到解决。

![微信图片_20210109010057](https://www.lin2j.tech/blog-image/problem/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87.jpg)

Excel 中的日期是一个数值，由 Excel 自己的规则去定义

Excel 中的日期转换成数值的方式

- 计算当前日期距离 1900年1月0日的天数作为整数部分
- Excel 把 24 小时当成1，比如 12 时，就是 0.5，所以一天中的某个时刻是 0-1之间的某个小数
- 最后把整数和小数部分加起来就是当前日期的数值表示
- 1900 年之前的日期 Excel 会表示为文本，用不了日期函数，可以用加载宏  Extended Date Functions

这里提供一个转换方法以及使用到的常量

```java
    /**
     * Excel 中日期的计算是从 1900年1月0日开始的 <br>
     * 但是实际日期没有 1 月 0 日 <br>
     * 这个数值是 1900年1月1日0时0分0秒 的时间戳<br>
     */
    private static final long EXCEL_BEGIN_TIME = -2209017600000L;

    /**
     * Excel 中日期数值保留的小数位是 10
     */
    public static final int EXCEL_SCALE = 10;

    /**
     * 24 小时的毫秒数
     */
    private static final long DAY_MILLISECONDS = 1000 * 3600 * 24;
 
     /**
     * 将日期转换成excel中日期对应的数值
     */
    private static BigDecimal date2ExcelNumber(Date date){
        // 从 1900 年 1 月 0 日（不存在的日期，相当于计算机中经常从 0 计起） 计起，
        // 然后 date 那天也算是 1 天，所以这里要加 2
        BigDecimal days = new BigDecimal((date.getTime() - EXCEL_BEGIN_TIME)/(DAY_MILLISECONDS) + 2);
        // date 那天的 0时0分0秒
        Date begin = DateUtil.beginOfDay(date);
        // excel 把一天的某个时刻当成 0 - 1 之间的一个小数
        BigDecimal time =
                new BigDecimal((date.getTime() - begin.getTime()))
                        // 要设置 scale，否则可能因为无限循环小数而报错
                .divide(new BigDecimal(DAY_MILLISECONDS), EXCEL_SCALE, BigDecimal.ROUND_HALF_UP);
        return days.add(time);
    }

```