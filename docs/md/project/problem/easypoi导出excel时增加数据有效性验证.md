```java
    private void setConstraint(Workbook workbook, Class<?> clazz) {
        Field[] fields = clazz.getDeclaredFields();
        AtomicInteger counter = new AtomicInteger(0);
        Arrays.stream(fields)
                .filter(f -> f.isAnnotationPresent(Excel.class))
                .map(f -> f.getAnnotation(Excel.class))
                .filter(anno -> anno.replace().length > 0)
                .forEach(annotation -> {
                    String[] sheetData = Arrays.stream(annotation.replace())
                            .map(s -> s.replaceAll("_.*", ""))
                            .toArray(String[]::new);
                    int col = Integer.parseInt(annotation.orderNum()) - 1;
                    setConstraint(workbook, counter.get(), sheetData, 1, 65535, col, col);
                    counter.getAndIncrement();
                });
    }

    /**
     * 序号转换成excel列名称
     * @param columnNumber 从 1 开始，1 表示 A 列
     * @return 列名称
     */
    private String convertToTitle(int columnNumber) {
        StringBuffer sb = new StringBuffer();
        while (columnNumber != 0) {
            columnNumber--;
            sb.append((char) (columnNumber % 26 + 'A'));
            columnNumber /= 26;
        }
        return sb.reverse().toString();
    }

    private void setConstraint(Workbook workbook, int col, String[] sheetData,
                               int firstRow, int lastRow, int firstCol, int lastCol) {
        String sheetName = "hidden";
        //将下拉框数据放到新的sheet里，然后excel通过新的sheet数据加载下拉框数据
        Sheet hidden = workbook.getSheet(sheetName);
        if (Objects.isNull(hidden)) {
            hidden = workbook.createSheet(sheetName);
        }

        //创建单元格对象
        Cell cell = null;
        //遍历我们上面的数组，将数据取出来放到新sheet的单元格中
        for (int i = 0, length = sheetData.length; i < length; i++) {
            //取出数组中的每个元素
            String name = sheetData[i];
            //根据i创建相应的行对象（说明我们将会把每个元素单独放一行）
            Row row = hidden.getRow(i);
            if(Objects.isNull(row)){
                row = hidden.createRow(i);
            }
            //创建每一行中的第一个单元格
            cell = row.createCell(col);
            //然后将数组中的元素赋值给这个单元格
            cell.setCellValue(name);
        }
        // 创建名称，可被其他单元格引用
        Name namedCell = workbook.createName();
        namedCell.setNameName(sheetName + col);
        // 设置名称引用的公式
        String title = convertToTitle(col + 1);
        String formula = String.format("%s!$%s$1:$%s$%s", sheetName, title, title, sheetData.length);
        namedCell.setRefersToFormula(formula);
        //加载数据,将名称为hidden的sheet中的数据转换为List形式
        DVConstraint constraint = DVConstraint.createFormulaListConstraint(sheetName + col);

        // (起始行,结束行,起始列,结束列)
        CellRangeAddressList regions = new CellRangeAddressList(firstRow, lastRow, firstCol, lastCol);
        // 将设置下拉选的位置和数据的对应关系 绑定到一起
        DataValidation dataValidation = new HSSFDataValidation(regions, constraint);

        //将第二个sheet设置为隐藏
        workbook.setSheetHidden(1, true);
        //将数据赋给下拉列表
        workbook.getSheetAt(0).addValidationData(dataValidation);
    }
}
```